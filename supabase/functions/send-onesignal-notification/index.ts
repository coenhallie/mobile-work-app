import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// OneSignal API credentials - Store these in Supabase secrets:
// `supabase secrets set ONESIGNAL_APP_ID your_onesignal_app_id_here`
// `supabase secrets set ONESIGNAL_REST_API_KEY your_onesignal_rest_api_key_here`
const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');
const ONESIGNAL_API_URL = 'https://onesignal.com/api/v1/notifications';

interface Job {
  id: string;
  title: string;
  location_text: string;
  compensation_range: string;
  specialty_tags: string[];
}

interface ContractorProfile {
  user_id: string;
  region_text: string;
  specialty_tags: string[];
}

interface UserDeviceToken {
  user_id: string;
  device_token: string;
  platform: 'ios' | 'android' | 'web';
}

interface UserNotificationPreference {
  user_id: string;
  enable_new_job_notifications: boolean;
  quiet_hours_start: string; // e.g., "22:00:00"
  quiet_hours_end: string; // e.g., "08:00:00"
}

// This function will be triggered by a Supabase Database Webhook
// on new rows in the 'jobs' table.
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate OneSignal credentials
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      throw new Error('OneSignal credentials not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // The webhook payload will contain the new job record
    const newJobPayload = await req.json();
    const newJob: Job = newJobPayload.record;

    if (!newJob || !newJob.id) {
      console.warn('New job data missing or invalid.');
      return new Response(JSON.stringify({ error: 'Invalid job data' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log(`Processing new job: ${newJob.title} (ID: ${newJob.id})`);

    // 1. Fetch all contractor profiles (in a real app, you'd optimize this)
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('contractor_profiles')
      .select('user_id, region_text, specialty_tags');

    if (profilesError) throw profilesError;
    if (!profiles) {
      console.log('No contractor profiles found.');
      return new Response(
        JSON.stringify({ message: 'No contractor profiles to match.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const matchedUserIds: string[] = [];

    for (const profile of profiles as ContractorProfile[]) {
      // Basic matching logic:
      // - Region matches (case-insensitive exact match for simplicity)
      // - At least one specialty tag matches
      const regionMatch =
        profile.region_text?.toLowerCase() ===
        newJob.location_text?.toLowerCase();
      const specialtyMatch = newJob.specialty_tags?.some((jobTag) =>
        profile.specialty_tags?.includes(jobTag)
      );

      if (regionMatch && specialtyMatch) {
        matchedUserIds.push(profile.user_id);
      }
    }

    if (matchedUserIds.length === 0) {
      console.log(`No contractors matched for job ID: ${newJob.id}`);
      return new Response(
        JSON.stringify({ message: 'No matching contractors found.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(
      `Found ${matchedUserIds.length} matched contractors for job ID: ${newJob.id}`
    );

    // 2. Fetch notification preferences and device tokens for matched users
    const { data: preferences, error: prefsError } = await supabaseClient
      .from('user_notification_preferences')
      .select('*')
      .in('user_id', matchedUserIds);

    if (prefsError) throw prefsError;

    const { data: tokens, error: tokensError } = await supabaseClient
      .from('user_device_tokens')
      .select('*')
      .in('user_id', matchedUserIds);

    if (tokensError) throw tokensError;
    if (!tokens || tokens.length === 0) {
      console.log('No device tokens found for matched users.');
      return new Response(
        JSON.stringify({ message: 'No device tokens for matched users.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Filter users based on notification preferences and quiet hours
    const eligibleUserIds: string[] = [];
    const currentTime = new Date();
    const currentHours = currentTime.getUTCHours();
    const currentMinutes = currentTime.getUTCMinutes();
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;

    for (const userPref of preferences as UserNotificationPreference[]) {
      // Skip users who have disabled new job notifications
      if (!userPref.enable_new_job_notifications) {
        console.log(
          `User ${userPref.user_id} has new job notifications disabled.`
        );
        continue;
      }

      // Check quiet hours
      if (userPref.quiet_hours_start && userPref.quiet_hours_end) {
        const [startH, startM] = userPref.quiet_hours_start
          .split(':')
          .map(Number);
        const quietStartInMinutes = startH * 60 + startM;

        const [endH, endM] = userPref.quiet_hours_end.split(':').map(Number);
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
            `User ${userPref.user_id} is in quiet hours. Skipping notification.`
          );
          continue;
        }
      }

      eligibleUserIds.push(userPref.user_id);
    }

    if (eligibleUserIds.length === 0) {
      console.log('No eligible users to receive notifications.');
      return new Response(
        JSON.stringify({ message: 'No eligible users for notifications.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Get device tokens for eligible users
    const eligibleTokens = tokens.filter((token: UserDeviceToken) =>
      eligibleUserIds.includes(token.user_id)
    );

    // Group tokens by user to avoid duplicate notifications
    const userTokenMap = new Map<string, string[]>();
    for (const token of eligibleTokens) {
      if (!userTokenMap.has(token.user_id)) {
        userTokenMap.set(token.user_id, []);
      }
      userTokenMap.get(token.user_id)!.push(token.device_token);
    }

    // Prepare OneSignal notification
    const notificationPayload = {
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: eligibleTokens.map((token) => token.device_token),
      headings: { en: `New Job: ${newJob.title}` },
      contents: {
        en: `Location: ${newJob.location_text}\nCompensation: ${newJob.compensation_range}`,
      },
      data: {
        jobId: newJob.id,
        deepLink: `myapp://job/${newJob.id}`,
        title: newJob.title,
        location: newJob.location_text,
        compensation: newJob.compensation_range,
      },
      ios_sound: 'default',
      android_sound: 'default',
      android_channel_id: 'job-notifications',
      priority: 10,
    };

    console.log(
      `Sending OneSignal notification to ${eligibleTokens.length} devices`
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
    console.log('OneSignal notification sent successfully:', responseData);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notifications sent via OneSignal.',
        recipients: eligibleTokens.length,
        oneSignalResponse: responseData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing notification:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
