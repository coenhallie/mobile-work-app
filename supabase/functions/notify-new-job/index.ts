import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// FCM Server Key - Store this in Supabase secrets:
// `supabase secrets set FCM_SERVER_KEY your_fcm_server_key_here`
// And ensure it's available as an environment variable in your Edge Function settings.
const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY');
const FCM_API_URL = 'https://fcm.googleapis.com/fcm/send';

interface Job {
  id: string;
  title: string;
  location_text: string; // Location for job
  compensation_range: string;
  specialty_tags: string[]; // Legacy field for specialties
  required_skills: string[]; // New field for specific required skills
  category_id: string; // Category ID for fallback matching
  category_name: string; // Category name for display
}

interface ContractorProfile {
  user_id: string;
  region_text: string; // Contractor's service area
  specialty_tags: string[]; // Legacy field for specialties
  specialties: string[]; // New field for specific skills
  service_areas: string[]; // Optional array of service areas
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
    console.log(
      `Job details: Location: ${newJob.location_text}, Category: ${newJob.category_name}`
    );

    if (newJob.required_skills && newJob.required_skills.length > 0) {
      console.log(`Required skills: ${newJob.required_skills.join(', ')}`);
    } else {
      console.log('No specific skills required for this job');
    }

    // 1. Fetch all contractor profiles
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('contractor_profiles')
      .select(
        'user_id, region_text, specialty_tags, specialties, service_areas'
      );

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
      // 1. Location matching (service area)
      const locationMatch = checkLocationMatch(profile, newJob);

      if (!locationMatch) {
        continue; // Skip if location doesn't match
      }

      // 2. Skills matching with fallback to category
      const skillsMatch = checkSkillsMatch(profile, newJob);

      // Only match if both location AND (skills OR category) match
      if (locationMatch && skillsMatch) {
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

    const notificationPromises = [];

    for (const tokenRecord of tokens as UserDeviceToken[]) {
      const userPref = (
        preferences as UserNotificationPreference[] | null
      )?.find((p) => p.user_id === tokenRecord.user_id);

      if (!userPref || !userPref.enable_new_job_notifications) {
        console.log(
          `User ${tokenRecord.user_id} has new job notifications disabled.`
        );
        continue;
      }

      // Check quiet hours
      if (userPref.quiet_hours_start && userPref.quiet_hours_end) {
        const now = new Date();
        const currentHours = now.getUTCHours();
        const currentMinutes = now.getUTCMinutes();
        const currentTimeInMinutes = currentHours * 60 + currentMinutes;

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
            `User ${tokenRecord.user_id} is in quiet hours. Skipping notification.`
          );
          continue;
        }
      }

      // Create a more descriptive notification message
      let notificationBody = `Location: ${newJob.location_text}\nCompensation: ${newJob.compensation_range}`;

      // Add skills information if available
      if (newJob.required_skills && newJob.required_skills.length > 0) {
        notificationBody += `\nSkills: ${newJob.required_skills.join(', ')}`;
      }

      const notificationPayload = {
        to: tokenRecord.device_token,
        notification: {
          // Standard notification payload
          title: `New ${newJob.category_name} Job: ${newJob.title}`,
          body: notificationBody,
          // iOS specific
          sound: 'default',
          badge: 1,
        },
        data: {
          // Custom data payload for deep linking and additional info
          jobId: newJob.id,
          deepLink: `myapp://job/${newJob.id}`,
          title: newJob.title,
          location: newJob.location_text,
          compensation: newJob.compensation_range,
          category: newJob.category_name,
          requiredSkills: newJob.required_skills || [],
        },
        priority: 'high',
      };

      console.log(
        `Sending notification to user ${tokenRecord.user_id} for job ${newJob.id}`
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
                `Successfully sent notification for token ${tokenRecord.device_token}`
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
      JSON.stringify({ success: true, message: 'Notifications processed.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing new job notification:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Helper function to check if contractor's location matches job location
function checkLocationMatch(profile: ContractorProfile, job: Job): boolean {
  // If contractor has service_areas array, check if job location is in it
  if (
    profile.service_areas &&
    Array.isArray(profile.service_areas) &&
    profile.service_areas.length > 0
  ) {
    // Case-insensitive check if job location is in contractor's service areas
    return profile.service_areas.some(
      (area) => area.toLowerCase() === job.location_text.toLowerCase()
    );
  }

  // Fallback to region_text exact match (case-insensitive)
  return (
    profile.region_text?.toLowerCase() === job.location_text?.toLowerCase()
  );
}

// Helper function to check if contractor's skills match job requirements
function checkSkillsMatch(profile: ContractorProfile, job: Job): boolean {
  // If job has specific required skills
  if (
    job.required_skills &&
    Array.isArray(job.required_skills) &&
    job.required_skills.length > 0
  ) {
    // Check if contractor has the new specialties field
    if (
      profile.specialties &&
      Array.isArray(profile.specialties) &&
      profile.specialties.length > 0
    ) {
      // Check if any of the contractor's specialties match any of the job's required skills
      return job.required_skills.some((skill) =>
        profile.specialties.some(
          (specialty) => specialty.toLowerCase() === skill.toLowerCase()
        )
      );
    }

    // Fallback to legacy specialty_tags if specialties not available
    if (
      profile.specialty_tags &&
      Array.isArray(profile.specialty_tags) &&
      profile.specialty_tags.length > 0
    ) {
      return job.required_skills.some((skill) =>
        profile.specialty_tags.some(
          (tag) => tag.toLowerCase() === skill.toLowerCase()
        )
      );
    }

    // No skills match
    return false;
  }

  // If job doesn't have specific required skills, fall back to category matching
  // This is handled by the specialty_tags which typically include the category
  if (
    profile.specialty_tags &&
    Array.isArray(profile.specialty_tags) &&
    profile.specialty_tags.length > 0
  ) {
    // Check if any specialty tag matches the job category (simple check)
    return profile.specialty_tags.some(
      (tag) => tag.toLowerCase() === job.category_name?.toLowerCase()
    );
  }

  // No category match either
  return false;
}
