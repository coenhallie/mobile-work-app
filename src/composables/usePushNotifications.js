import { ref, onMounted, watch } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useRouter } from 'vue-router';
import { oneSignalService } from '@/services/oneSignalService';

// OneSignal App ID - Replace with your actual OneSignal App ID
// In production, this should be in an environment variable
const ONESIGNAL_APP_ID =
  import.meta.env.VITE_ONESIGNAL_APP_ID || 'your-onesignal-app-id';

export function usePushNotifications() {
  const { userId, getSupabaseClient } = useAuth();
  // Create a Supabase client using Supabase authentication
  const supabase = getSupabaseClient();
  const router = useRouter();
  const permissionGranted = ref(false);
  const isInitializing = ref(false);
  const initError = ref(null);
  const oneSignalUserId = ref(null);
  const permissionState = ref('default'); // 'default', 'granted', 'denied', or 'unsupported'

  const initializePushNotifications = async () => {
    if (!userId.value) {
      console.log('User not authenticated, skipping push notification setup.');
      return;
    }
    if (isInitializing.value) return;
    isInitializing.value = true;
    initError.value = null;

    try {
      console.log('Initializing OneSignal push notifications...');

      // Check if notifications are supported
      if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        permissionState.value = 'unsupported';
        return;
      }

      // Initialize OneSignal
      const result = await oneSignalService.initialize({
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true, // For development
        onNotificationReceived: (notification) => {
          console.log('Push notification received:', notification);
          // Display notification logic would go here
        },
        onNotificationClicked: (notification) => {
          console.log('Notification clicked:', notification);
          // Focus window logic would go here
          handleDeepLink(notification?.data);
        },
      });

      // Check current permission state
      const currentPermission = OneSignal.Notifications.permission;
      permissionState.value = currentPermission;
      console.log('Current notification permission state:', currentPermission);

      // Request permission if not already granted
      if (!result || !result.hasPermission) {
        permissionGranted.value = await oneSignalService.requestPermission();
      } else {
        permissionGranted.value = true;
      }

      // Update permission state after request
      permissionState.value = OneSignal.Notifications.permission;

      // Get OneSignal User ID and register it
      oneSignalUserId.value =
        result?.userId || (await oneSignalService.getDeviceId());

      if (oneSignalUserId.value) {
        // Link OneSignal user with our app user
        await oneSignalService.setExternalUserId(userId.value);

        // Register device token in our database
        await registerDeviceToken(oneSignalUserId.value);
      } else {
        console.warn('Could not retrieve OneSignal user ID.');
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      initError.value =
        error.message || 'Failed to initialize push notifications.';
    } finally {
      isInitializing.value = false;
    }
  };

  const registerDeviceToken = async (token) => {
    if (!userId.value || !token) return;

    // Dynamically import to avoid build errors
    let platformIdentifier = 'web';
    try {
      const osPlatform = await import('@tauri-apps/plugin-os').then((os) =>
        os.platform()
      );
      if (osPlatform === 'android') platformIdentifier = 'android';
      if (osPlatform === 'ios') platformIdentifier = 'ios';
    } catch (e) {
      console.warn('Could not determine platform:', e);
    }

    try {
      const { data, error } = await supabase.from('user_device_tokens').upsert(
        {
          user_id: userId.value,
          device_token: token,
          platform: platformIdentifier,
          last_updated_at: new Date().toISOString(),
        },
        { onConflict: 'device_token' }
      );

      if (error) throw error;
      console.log('OneSignal device ID registered/updated:', data);

      // Add user tags for better targeting
      await oneSignalService.addTag('user_type', 'contractor');
      await oneSignalService.addTag('platform', platformIdentifier);
    } catch (error) {
      console.error('Error registering device token:', error);
    }
  };

  const handleDeepLink = (data) => {
    if (!data) return;

    // Handle both old and new OneSignal data formats
    const notificationData = data.additionalData || data;

    if (notificationData.jobId) {
      console.log(`Deep linking to job ID: ${notificationData.jobId}`);
      router.push({
        name: 'JobDetails',
        params: { id: notificationData.jobId },
      });
    } else if (notificationData.deepLink) {
      const match = notificationData.deepLink.match(/myapp:\/\/job\/([^/]+)/);
      if (match && match[1]) {
        console.log(`Deep linking to job ID from URL: ${match[1]}`);
        router.push({ name: 'JobDetails', params: { id: match[1] } });
      }
    } else {
      console.warn('No jobId found in notification data for deep linking.');
    }
  };

  onMounted(() => {
    // Initialize when component using this composable is mounted and user is available
    const unwatch = watch(
      () => userId.value,
      (newVal) => {
        if (newVal) {
          initializePushNotifications();
          unwatch();
        }
      },
      { immediate: true }
    );

    if (userId.value && !isInitializing.value) {
      // If userId already present
      initializePushNotifications();
    }
  });

  return {
    permissionGranted,
    permissionState,
    initializePushNotifications,
    isInitializing,
    initError,
    oneSignalUserId,

    // Check if we can request permissions
    canRequestPermission() {
      return oneSignalService.canRequestPermission();
    },

    // Request notification permission
    async requestPermission() {
      try {
        return await oneSignalService.requestPermission();
      } catch (error) {
        console.error('Error requesting permission:', error);
        return false;
      }
    },

    // Add a method to test notifications
    async sendTestNotification() {
      if (!oneSignalUserId.value) {
        console.log(
          'Error: OneSignal not initialized, oneSignalUserId is null'
        );
        throw new Error('OneSignal not initialized');
      }

      try {
        // Log the payload being sent
        console.log('Sending test notification request with:', {
          userId: userId.value,
          oneSignalUserId: oneSignalUserId.value,
        });

        // Construct the correct URL for the Supabase Edge Function
        const apiUrl = import.meta.env.VITE_SUPABASE_URL
          ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-notification`
          : '/api/test-notification';

        // Enhanced logging of the API URL
        console.log('Using API URL:', apiUrl);

        // Log OneSignal user ID before sending
        const currentOneSignalId = await oneSignalService.getDeviceId();
        console.log('Current OneSignal Device ID:', currentOneSignalId);

        const payload = {
          userId: userId.value,
          oneSignalUserId: oneSignalUserId.value,
        };
        console.log('Request payload:', JSON.stringify(payload));

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Add Authorization header if using Supabase Edge Function
            ...(import.meta.env.VITE_SUPABASE_ANON_KEY && {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            }),
          },
          body: JSON.stringify(payload),
        });

        // Log HTTP response status
        console.log('Response status:', response.status);

        // Clone the response to read it twice
        const responseClone = response.clone();

        // Try to parse as JSON first
        let responseData;
        let responseText;
        try {
          responseData = await response.json();
          console.log('Response data:', responseData);
        } catch (e) {
          // If JSON parsing fails, get the text instead
          responseText = await responseClone.text();
          console.log('Response text:', responseText);
        }

        if (!response.ok) {
          console.error('Error response details:', {
            status: response.status,
            statusText: response.statusText,
            data: responseData || responseText,
          });
          throw new Error(
            `Failed to send test notification: ${
              responseData?.error || response.statusText
            }`
          );
        }

        return responseData;
      } catch (error) {
        console.error('Error sending test notification:', error);
        console.error('Error stack:', error.stack);
        throw error;
      }
    },
  };
}
