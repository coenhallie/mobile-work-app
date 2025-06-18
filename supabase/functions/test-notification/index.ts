import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// OneSignal API credentials
const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');
const ONESIGNAL_API_URL = 'https://onesignal.com/api/v1/notifications';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate OneSignal credentials
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      throw new Error('OneSignal credentials not configured');
    }

    // Parse request body
    const { userId, oneSignalUserId } = await req.json();

    if (!userId || !oneSignalUserId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user exists and has notification preferences
    const { data: userPrefs, error: prefsError } = await supabaseClient
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefsError) {
      console.log('User preferences not found, creating default preferences');
      // Create default preferences if not found
      const { error: insertError } = await supabaseClient
        .from('user_notification_preferences')
        .insert({
          user_id: userId,
          enable_new_job_notifications: true,
          quiet_hours_start: '22:00:00',
          quiet_hours_end: '08:00:00',
        });

      if (insertError) throw insertError;
    }

    // Check if user is in quiet hours
    let isInQuietHours = false;
    if (userPrefs) {
      const currentTime = new Date();
      const currentHours = currentTime.getUTCHours();
      const currentMinutes = currentTime.getUTCMinutes();
      const currentTimeInMinutes = currentHours * 60 + currentMinutes;

      const [startH, startM] = userPrefs.quiet_hours_start
        .split(':')
        .map(Number);
      const quietStartInMinutes = startH * 60 + startM;

      const [endH, endM] = userPrefs.quiet_hours_end.split(':').map(Number);
      const quietEndInMinutes = endH * 60 + endM;

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
    }

    // If in quiet hours, inform the user but still send the test notification
    const quietHoursMessage = isInQuietHours
      ? "Note: You're currently in quiet hours, but this test notification will still be sent."
      : '';

    // Prepare OneSignal notification
    const notificationPayload = {
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: [oneSignalUserId],
      headings: { en: 'Test Notification' },
      contents: {
        en: `This is a test notification from your mobile work app. ${quietHoursMessage}`,
      },
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
      },
      ios_sound: 'default',
      android_sound: 'default',
      android_channel_id: 'test-notifications',
      priority: 10,
    };

    console.log(
      `Sending test notification to user ${userId} (OneSignal ID: ${oneSignalUserId})`
    );

    // Send notification via OneSignal API
    const response = await fetch(ONESIGNAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(notificationPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OneSignal API error: ${response.status} ${errorText}`);
    }

    const responseData = await response.json();
    console.log('Test notification sent successfully:', responseData);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Test notification sent successfully',
        inQuietHours: isInQuietHours,
        oneSignalResponse: responseData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error sending test notification:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
