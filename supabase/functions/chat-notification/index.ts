import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// FCM Server Key - Store this in Supabase secrets:
// `supabase secrets set FCM_SERVER_KEY your_fcm_server_key_here`
const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY');
const FCM_API_URL = 'https://fcm.googleapis.com/fcm/send';

interface ChatMessage {
  id: string;
  room_id: string;
  sender_user_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
}

interface ChatRoom {
  id: string;
  user1_id: string;
  user2_id: string;
  user1_name?: string;
  user2_name?: string;
}

interface UserDeviceToken {
  user_id: string;
  device_token: string;
  platform: 'ios' | 'android' | 'web';
}

interface UserNotificationPreference {
  user_id: string;
  enable_chat_notifications: boolean;
  quiet_hours_start: string; // e.g., "22:00:00"
  quiet_hours_end: string; // e.g., "08:00:00"
}

// This function will be triggered by a Supabase Database Webhook
// on new rows in the 'chat_messages' table.
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // The webhook payload will contain the new chat message record
    const newMessagePayload = await req.json();
    const newMessage: ChatMessage = newMessagePayload.record;

    if (!newMessage || !newMessage.id) {
      console.warn('New chat message data missing or invalid.');
      return new Response(JSON.stringify({ error: 'Invalid message data' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log(
      `Processing new chat message: ${newMessage.id} from ${newMessage.sender_user_id}`
    );

    // Get the chat room to determine the recipient
    const { data: chatRoom, error: roomError } = await supabaseClient
      .from('chat_rooms')
      .select('*')
      .eq('id', newMessage.room_id)
      .single();

    if (roomError || !chatRoom) {
      console.error('Error fetching chat room:', roomError);
      return new Response(JSON.stringify({ error: 'Chat room not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Determine the recipient (the user who is not the sender)
    const recipientId =
      chatRoom.user1_id === newMessage.sender_user_id
        ? chatRoom.user2_id
        : chatRoom.user1_id;

    console.log(`Message recipient: ${recipientId}`);

    // Get sender's name for the notification
    let senderName = 'Someone';
    if (newMessage.sender_name) {
      senderName = newMessage.sender_name;
    } else {
      // Use the name from the chat room
      senderName =
        chatRoom.user1_id === newMessage.sender_user_id
          ? chatRoom.user1_name || 'Someone'
          : chatRoom.user2_name || 'Someone';
    }

    // Check notification preferences for the recipient
    const { data: preferences, error: prefsError } = await supabaseClient
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', recipientId)
      .single();

    if (prefsError) {
      console.log(
        `No notification preferences found for user ${recipientId}, using defaults`
      );
    }

    // Check if chat notifications are enabled (default to true if no preference set)
    const chatNotificationsEnabled =
      preferences?.enable_chat_notifications !== false;

    if (!chatNotificationsEnabled) {
      console.log(`User ${recipientId} has chat notifications disabled.`);
      return new Response(
        JSON.stringify({
          message: 'Chat notifications disabled for recipient.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Check quiet hours
    if (preferences?.quiet_hours_start && preferences?.quiet_hours_end) {
      const now = new Date();
      const currentHours = now.getUTCHours();
      const currentMinutes = now.getUTCMinutes();
      const currentTimeInMinutes = currentHours * 60 + currentMinutes;

      const [startH, startM] = preferences.quiet_hours_start
        .split(':')
        .map(Number);
      const quietStartInMinutes = startH * 60 + startM;

      const [endH, endM] = preferences.quiet_hours_end.split(':').map(Number);
      const quietEndInMinutes = endH * 60 + endM;

      let isInQuietHours = false;
      if (quietStartInMinutes < quietEndInMinutes) {
        // Quiet hours do not cross midnight
        isInQuietHours =
          currentTimeInMinutes >= quietStartInMinutes &&
          currentTimeInMinutes < quietEndInMinutes;
      } else {
        // Quiet hours cross midnight (e.g., 22:00 - 08:00)
        isInQuietHours =
          currentTimeInMinutes >= quietStartInMinutes ||
          currentTimeInMinutes < quietEndInMinutes;
      }

      if (isInQuietHours) {
        console.log(
          `User ${recipientId} is in quiet hours. Skipping notification.`
        );
        return new Response(
          JSON.stringify({ message: 'User is in quiet hours.' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
    }

    // Get device tokens for the recipient
    const { data: tokens, error: tokensError } = await supabaseClient
      .from('user_device_tokens')
      .select('*')
      .eq('user_id', recipientId);

    if (tokensError) throw tokensError;
    if (!tokens || tokens.length === 0) {
      console.log(`No device tokens found for user ${recipientId}.`);
      return new Response(
        JSON.stringify({ message: 'No device tokens for recipient.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const notificationPromises = [];

    // Truncate message content for notification preview
    const messagePreview =
      newMessage.content.length > 100
        ? newMessage.content.substring(0, 100) + '...'
        : newMessage.content;

    for (const tokenRecord of tokens as UserDeviceToken[]) {
      const notificationPayload = {
        to: tokenRecord.device_token,
        notification: {
          // Standard notification payload
          title: `New message from ${senderName}`,
          body: messagePreview,
          // iOS specific
          sound: 'default',
          badge: 1,
        },
        data: {
          // Custom data payload for deep linking and additional info
          messageId: newMessage.id,
          roomId: newMessage.room_id,
          senderId: newMessage.sender_user_id,
          senderName: senderName,
          deepLink: `myapp://chat/${newMessage.room_id}`,
          type: 'chat_message',
        },
        priority: 'high',
      };

      console.log(
        `Sending chat notification to user ${recipientId} for message ${newMessage.id}`
      );

      notificationPromises.push(
        fetch(FCM_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `key=${FCM_SERVER_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notificationPayload),
        })
          .then(async (response) => {
            if (!response.ok) {
              const errorBody = await response.text();
              console.error(
                `FCM send error for token ${tokenRecord.device_token}: ${response.status} ${response.statusText}`,
                errorBody
              );
            } else {
              console.log(
                `Successfully sent chat notification for token ${tokenRecord.device_token}`
              );
            }
            return response;
          })
          .catch((error) =>
            console.error(
              `FCM fetch error for token ${tokenRecord.device_token}:`,
              error
            )
          )
      );
    }

    await Promise.all(notificationPromises);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Chat notifications processed.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing chat notification:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
