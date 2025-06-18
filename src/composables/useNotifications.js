import { ref, onMounted, computed, watch } from 'vue';
import { unifiedNotificationService } from '@/services/unifiedNotificationService';
import { useAuth } from '@/composables/useAuth';
import { useRouter } from 'vue-router';

// OneSignal App ID - Replace with your actual OneSignal App ID
// In production, this should be in an environment variable
const ONESIGNAL_APP_ID =
  import.meta.env.VITE_ONESIGNAL_APP_ID || 'your-onesignal-app-id';

/**
 * Composable for managing notifications using the unified notification service
 *
 * This composable provides a clean interface to the unified notification service,
 * handling both local and push notifications through a single API.
 */
export function useNotifications() {
  const { userId, getSupabaseClient } = useAuth();
  const supabase = getSupabaseClient();
  const router = useRouter();

  // State
  const permissionGranted = ref(false);
  const isInitializing = ref(false);
  const initError = ref(null);
  const deviceId = ref(null);
  const permissionState = ref('default'); // 'default', 'granted', 'denied', 'unsupported'
  const notificationMode = ref('local'); // 'local', 'push', 'hybrid'
  const platform = ref(null);

  /**
   * Initialize the notification system
   */
  const initializeNotifications = async () => {
    if (!userId.value) {
      console.log('User not authenticated, skipping notification setup.');
      return;
    }

    if (isInitializing.value) return;
    isInitializing.value = true;
    initError.value = null;

    try {
      console.log('Initializing unified notification system...');

      // Initialize the unified notification service
      const result = await unifiedNotificationService.initialize({
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true, // For development
        onNotificationReceived: (notification) => {
          console.log('Notification received:', notification);
          // Display notification logic would go here
        },
        onNotificationClicked: (notification) => {
          console.log('Notification clicked:', notification);
          handleDeepLink(notification?.data);
        },
      });

      // Update state from result
      permissionGranted.value = result.hasPermission;
      permissionState.value = result.permissionState;
      notificationMode.value = result.mode;
      platform.value = result.platform;
      deviceId.value = result.deviceId;

      // If we have a device ID and permission, register it with our backend
      if (deviceId.value && permissionGranted.value) {
        await registerDeviceToken(deviceId.value);
      }

      console.log('Notification initialization complete:', {
        mode: notificationMode.value,
        permissionGranted: permissionGranted.value,
        permissionState: permissionState.value,
        platform: platform.value,
        deviceId: deviceId.value
          ? `${deviceId.value.substring(0, 8)}...`
          : null,
      });
    } catch (error) {
      console.error('Error initializing notifications:', error);
      initError.value = error.message || 'Failed to initialize notifications';
    } finally {
      isInitializing.value = false;
    }
  };

  /**
   * Register device token with backend
   */
  const registerDeviceToken = async (token) => {
    if (!userId.value || !token) return;

    // Determine platform identifier
    let platformIdentifier = 'web';
    if (platform.value === 'android') platformIdentifier = 'android';
    if (platform.value === 'ios') platformIdentifier = 'ios';

    try {
      const { data, error } = await supabase.from('user_device_tokens').upsert(
        {
          user_id: userId.value,
          device_token: token,
          platform: platformIdentifier,
          notification_mode: notificationMode.value,
          last_updated_at: new Date().toISOString(),
        },
        { onConflict: 'device_token' }
      );

      if (error) throw error;
      console.log('Device token registered/updated:', data);

      // Add user tags for better targeting
      if (
        notificationMode.value === 'push' ||
        notificationMode.value === 'hybrid'
      ) {
        await unifiedNotificationService.sendTag('user_type', 'contractor');
        await unifiedNotificationService.sendTag(
          'platform',
          platformIdentifier
        );
      }
    } catch (error) {
      console.error('Error registering device token:', error);
    }
  };

  /**
   * Request notification permission from the user
   */
  const requestPermission = async () => {
    try {
      console.log('Requesting notification permission...');

      const granted = await unifiedNotificationService.requestPermission();

      // Update permission state
      permissionGranted.value = granted;
      permissionState.value = granted ? 'granted' : 'denied';

      // If permission was granted and we have a device ID, register it
      if (granted && deviceId.value) {
        await registerDeviceToken(deviceId.value);
      }

      return granted;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  };

  /**
   * Send a notification
   * @param {Object} options Notification options
   * @param {string} options.title Notification title
   * @param {string} options.body Notification body
   * @param {string} options.icon Notification icon (optional)
   * @param {boolean} options.forcePush Force using push notification if available (optional)
   * @param {boolean} options.forceLocal Force using local notification (optional)
   * @param {Object} options.data Additional data for push notifications (optional)
   */
  const sendNotification = async (options) => {
    try {
      return await unifiedNotificationService.sendNotification(options);
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  };

  /**
   * Send a test notification
   * @param {boolean} forcePush Force using push notification if available
   * @param {boolean} forceLocal Force using local notification
   */
  const sendTestNotification = async (
    forcePush = false,
    forceLocal = false
  ) => {
    if (!userId.value) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('Sending test notification');

      // Determine notification type for the message
      const notificationType = forcePush
        ? 'push'
        : forceLocal
          ? 'local'
          : 'auto';

      // Send a test notification
      const success = await sendNotification({
        title: `Test ${notificationType.charAt(0).toUpperCase() + notificationType.slice(1)} Notification`,
        body: `This is a test ${notificationType} notification from your mobile work app.`,
        icon: 'tauri.png', // Optional, uses app icon by default
        forcePush,
        forceLocal,
        data: {
          test: true,
          userId: userId.value,
          timestamp: new Date().toISOString(),
        },
      });

      // Log the test in the database if needed
      if (success && supabase) {
        try {
          await supabase.from('notification_logs').insert({
            user_id: userId.value,
            notification_type: `test_${notificationType}`,
            status: 'sent',
            timestamp: new Date().toISOString(),
          });
        } catch (dbError) {
          console.warn('Could not log notification to database:', dbError);
        }
      }

      return { success };
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  };

  /**
   * Handle deep links from notifications
   */
  const handleDeepLink = (data) => {
    if (!data) return;

    // Handle both old and new data formats
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

  /**
   * Check if notification permission can be requested
   */
  const canRequestPermission = computed(() => {
    return unifiedNotificationService.canRequestPermission();
  });

  /**
   * Get user-friendly permission status text
   */
  const permissionStatusText = computed(() => {
    switch (permissionState.value) {
      case 'granted':
        return 'Notifications are enabled';
      case 'denied':
        return 'Notifications are blocked';
      case 'unsupported':
        return 'Notifications are not supported on this device';
      default:
        return 'Notification permission not requested';
    }
  });

  /**
   * Get user-friendly notification mode text
   */
  const notificationModeText = computed(() => {
    switch (notificationMode.value) {
      case 'push':
        return 'Push notifications';
      case 'local':
        return 'Local notifications';
      case 'hybrid':
        return 'Hybrid notifications';
      default:
        return 'Unknown notification mode';
    }
  });

  // Initialize when component is mounted and user is available
  onMounted(() => {
    const unwatch = watch(
      () => userId.value,
      (newVal) => {
        if (newVal) {
          initializeNotifications();
          unwatch();
        }
      },
      { immediate: true }
    );

    if (userId.value && !isInitializing.value) {
      // If userId already present
      initializeNotifications();
    }
  });

  return {
    // State
    permissionGranted,
    permissionState,
    notificationMode,
    isInitializing,
    initError,
    deviceId,
    platform,

    // Computed
    canRequestPermission,
    permissionStatusText,
    notificationModeText,

    // Methods
    initializeNotifications,
    requestPermission,
    sendNotification,
    sendTestNotification,
  };
}
