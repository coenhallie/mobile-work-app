import { ref } from 'vue';
import { fcmService } from '../services/fcmService.js';

/**
 * Vue composable for Firebase Cloud Messaging (FCM)
 * Provides reactive state and methods for push notifications
 */
export function useFCM() {
  // Note: router should be injected by the component using this composable

  // Reactive state
  const isInitialized = ref(false);
  const deviceToken = ref(null);
  const hasPermission = ref(false);
  const isLoading = ref(false);
  const error = ref(null);
  const lastNotification = ref(null);

  /**
   * Initialize FCM with Firebase project configuration
   * @param {Object} config Configuration object
   * @param {string} config.projectId Firebase project ID
   * @param {boolean} config.autoRequestPermission Whether to automatically request permission
   */
  const initialize = async (config) => {
    if (isInitialized.value) {
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const result = await fcmService.initialize({
        projectId: config.projectId,
        onNotificationReceived: handleNotificationReceived,
        onNotificationClicked: handleNotificationClicked,
      });

      isInitialized.value = true;
      deviceToken.value = result.deviceToken;
      hasPermission.value = result.hasPermission;

      // Auto-request permission if configured
      if (config.autoRequestPermission && !hasPermission.value) {
        await requestPermission();
      }
    } catch (err) {
      console.error('Failed to initialize FCM:', err);
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Request notification permission from the user
   */
  const requestPermission = async () => {
    if (!isInitialized.value) {
      return false;
    }

    if (hasPermission.value) {
      return true;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const granted = await fcmService.requestPermission();
      hasPermission.value = granted;

      if (granted) {
      } else {
      }

      return granted;
    } catch (err) {
      console.error('Failed to request notification permission:', err);
      error.value = err.message;
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Get the current FCM device token
   */
  const getToken = async () => {
    if (!isInitialized.value) {
      return null;
    }

    try {
      const token = await fcmService.getDeviceToken();
      deviceToken.value = token;
      return token;
    } catch (err) {
      console.error('Failed to get FCM token:', err);
      error.value = err.message;
      return null;
    }
  };

  /**
   * Register the device token with your backend
   * @param {string} userId User ID to associate with the token
   * @param {string} platform Platform identifier
   */
  const registerToken = async (userId, platform = 'android') => {
    if (!isInitialized.value) {
      throw new Error('FCM not initialized. Call initialize() first.');
    }

    if (!deviceToken.value) {
      await getToken();
    }

    try {
      await fcmService.registerDeviceToken(userId, platform);
    } catch (err) {
      console.error('Failed to register device token:', err);
      error.value = err.message;
      throw err;
    }
  };

  /**
   * Handle received notifications (when app is in foreground)
   * @param {Object} notification Notification payload
   */
  const handleNotificationReceived = (notification) => {
    lastNotification.value = {
      ...notification,
      receivedAt: new Date(),
      type: 'received',
    };

    // You can emit events or show in-app notifications here
    // For example, show a toast or update a notification badge
  };

  /**
   * Handle notification clicks (when user taps notification)
   * @param {Object} notification Notification payload with data
   */
  const handleNotificationClicked = (notification) => {
    lastNotification.value = {
      ...notification,
      clickedAt: new Date(),
      type: 'clicked',
    };

    // Handle deep linking based on notification data
    if (notification.data) {
      const deepLinkResult = fcmService.handleDeepLink(
        notification.data.deepLink
      );

      switch (deepLinkResult.type) {
        case 'chat':
          router.push(`/chat/${deepLinkResult.roomId}`);
          break;
        case 'job':
          router.push(`/job/${deepLinkResult.jobId}`);
          break;
        default:
      }
    }
  };

  /**
   * Check if we can request notification permission
   */
  const canRequestPermission = () => {
    return fcmService.canRequestPermission();
  };

  /**
   * Get current FCM state
   */
  const getState = () => {
    return {
      isInitialized: isInitialized.value,
      deviceToken: deviceToken.value,
      hasPermission: hasPermission.value,
      isLoading: isLoading.value,
      error: error.value,
      lastNotification: lastNotification.value,
    };
  };

  /**
   * Clear any errors
   */
  const clearError = () => {
    error.value = null;
  };

  /**
   * Clear the last notification
   */
  const clearLastNotification = () => {
    lastNotification.value = null;
  };

  // Cleanup function that components can call manually
  const cleanup = () => {
    // Any cleanup logic if needed
  };

  return {
    // State
    isInitialized,
    deviceToken,
    hasPermission,
    isLoading,
    error,
    lastNotification,

    // Methods
    initialize,
    requestPermission,
    getToken,
    registerToken,
    canRequestPermission,
    getState,
    clearError,
    clearLastNotification,
    cleanup,

    // Event handlers (exposed for custom handling if needed)
    handleNotificationReceived,
    handleNotificationClicked,
  };
}
