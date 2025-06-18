import { ref, onMounted, computed } from 'vue';
import { tauriNotificationService } from '@/services/tauriNotificationService';
import { useAuth } from '@/composables/useAuth';

/**
 * Composable for managing Tauri native notifications
 *
 * This composable provides a clean interface to the Tauri notification
 * functionality, including permission management, sending notifications,
 * and handling platform-specific behavior.
 */
export function useTauriNotifications() {
  const { userId, getSupabaseClient } = useAuth();
  const supabase = getSupabaseClient();

  // State
  const permissionGranted = ref(false);
  const permissionState = ref('default'); // 'default', 'granted', 'denied'
  const isInitializing = ref(false);
  const initError = ref(null);
  const isSupported = ref(true);
  const platform = ref(null);

  /**
   * Initialize the notification system
   */
  const initializeNotifications = async () => {
    if (isInitializing.value) return;
    isInitializing.value = true;
    initError.value = null;

    try {
      console.log('Initializing Tauri notifications...');

      // Initialize the notification service
      const result = await tauriNotificationService.initialize();

      isSupported.value = result.supported;
      if (!result.supported) {
        console.warn('Tauri notifications not supported in this environment');
        initError.value = 'Notifications not supported in this environment';
        return;
      }

      // Update permission state
      permissionGranted.value = result.hasPermission;
      permissionState.value = result.permissionState;
      platform.value = result.platform;

      console.log('Notification initialization complete:', {
        supported: isSupported.value,
        permissionGranted: permissionGranted.value,
        permissionState: permissionState.value,
        platform: platform.value,
      });
    } catch (error) {
      console.error('Error initializing notifications:', error);
      initError.value = error.message || 'Failed to initialize notifications';
    } finally {
      isInitializing.value = false;
    }
  };

  /**
   * Request notification permission from the user
   */
  const requestPermission = async () => {
    try {
      console.log('Requesting notification permission...');

      if (!isSupported.value) {
        throw new Error('Notifications not supported in this environment');
      }

      const granted = await tauriNotificationService.requestPermission();

      // Update permission state
      permissionGranted.value = granted;
      permissionState.value = granted ? 'granted' : 'denied';

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
   */
  const sendNotification = async (options) => {
    if (!isSupported.value) {
      throw new Error('Notifications not supported in this environment');
    }

    if (!permissionGranted.value) {
      throw new Error('Notification permission not granted');
    }

    try {
      return await tauriNotificationService.sendNotification(options);
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  };

  /**
   * Send a test notification
   */
  const sendTestNotification = async () => {
    if (!userId.value) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('Sending test notification');

      // Send a test notification
      const success = await sendNotification({
        title: 'Test Notification',
        body: 'This is a test notification from your mobile work app.',
        icon: 'tauri.png', // Optional, uses app icon by default
      });

      // Log the test in the database if needed
      if (success && supabase) {
        try {
          await supabase.from('notification_logs').insert({
            user_id: userId.value,
            notification_type: 'test',
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
   * Check if notification permission can be requested
   */
  const canRequestPermission = computed(() => {
    return (
      isSupported.value &&
      permissionState.value !== 'granted' &&
      permissionState.value !== 'denied'
    );
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
      default:
        return 'Notification permission not requested';
    }
  });

  // Initialize when component is mounted
  onMounted(() => {
    initializeNotifications();
  });

  return {
    // State
    permissionGranted,
    permissionState,
    isSupported,
    isInitializing,
    initError,
    platform,

    // Computed
    canRequestPermission,
    permissionStatusText,

    // Methods
    initializeNotifications,
    requestPermission,
    sendNotification,
    sendTestNotification,
  };
}
