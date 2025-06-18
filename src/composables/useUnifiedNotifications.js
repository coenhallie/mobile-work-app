import { ref, computed, onMounted, onUnmounted } from 'vue';
import { unifiedNotificationService } from '../services/unifiedNotificationService.js';

// Global state for notifications
const isInitialized = ref(false);
const hasPermission = ref(false);
const permissionState = ref('default');
const notificationMode = ref('local');
const isSupported = ref(true);
const deviceId = ref(null);
const error = ref(null);

// Notification handlers
const notificationHandlers = ref(new Map());

/**
 * Unified Notifications Composable
 *
 * This composable provides a Vue 3 reactive interface to the unified notification service,
 * consolidating all notification functionality (FCM, OneSignal, Local, Tauri) into a single API.
 *
 * Features:
 * - Automatic platform detection (web, mobile, desktop)
 * - Intelligent fallback between push and local notifications
 * - Reactive state management
 * - Event handling for notification interactions
 * - Permission management
 * - Device registration for push notifications
 */
export function useUnifiedNotifications() {
  /**
   * Initialize the notification system
   * @param {Object} options Configuration options
   * @param {string} options.appId OneSignal App ID for push notifications
   * @param {boolean} options.allowLocalhostAsSecureOrigin Allow localhost for development
   * @param {Function} options.onNotificationReceived Global handler for received notifications
   * @param {Function} options.onNotificationClicked Global handler for clicked notifications
   */
  const initialize = async (options = {}) => {
    try {
      console.log('[useUnifiedNotifications] Initializing...');

      const result = await unifiedNotificationService.initialize({
        ...options,
        onNotificationReceived: (notification) => {
          console.log(
            '[useUnifiedNotifications] Notification received:',
            notification
          );

          // Call global handler if provided
          if (options.onNotificationReceived) {
            options.onNotificationReceived(notification);
          }

          // Call specific handlers
          notificationHandlers.value.forEach((handler, key) => {
            if (handler.type === 'received' || handler.type === 'all') {
              handler.callback(notification);
            }
          });
        },
        onNotificationClicked: (notification) => {
          console.log(
            '[useUnifiedNotifications] Notification clicked:',
            notification
          );

          // Call global handler if provided
          if (options.onNotificationClicked) {
            options.onNotificationClicked(notification);
          }

          // Call specific handlers
          notificationHandlers.value.forEach((handler, key) => {
            if (handler.type === 'clicked' || handler.type === 'all') {
              handler.callback(notification);
            }
          });
        },
      });

      // Update reactive state
      updateState(result);

      console.log(
        '[useUnifiedNotifications] Initialized successfully:',
        result
      );
      return result;
    } catch (err) {
      console.error('[useUnifiedNotifications] Initialization failed:', err);
      error.value = err.message;
      throw err;
    }
  };

  /**
   * Request notification permission
   */
  const requestPermission = async () => {
    try {
      console.log('[useUnifiedNotifications] Requesting permission...');
      const granted = await unifiedNotificationService.requestPermission();

      hasPermission.value = granted;
      permissionState.value = granted ? 'granted' : 'denied';

      console.log('[useUnifiedNotifications] Permission result:', granted);
      return granted;
    } catch (err) {
      console.error(
        '[useUnifiedNotifications] Permission request failed:',
        err
      );
      error.value = err.message;
      throw err;
    }
  };

  /**
   * Send a notification
   * @param {Object} options Notification options
   * @param {string} options.title Notification title
   * @param {string} options.body Notification body
   * @param {string} options.icon Notification icon URL (optional)
   * @param {boolean} options.forcePush Force using push notification (optional)
   * @param {boolean} options.forceLocal Force using local notification (optional)
   * @param {Object} options.data Additional data for push notifications (optional)
   * @param {Function} options.onClick Callback when notification is clicked (optional)
   */
  const sendNotification = async (options) => {
    try {
      console.log('[useUnifiedNotifications] Sending notification:', options);

      // Add click handler if provided
      if (options.onClick) {
        const handlerId = `notification_${Date.now()}_${Math.random()}`;
        addNotificationHandler(handlerId, 'clicked', options.onClick);

        // Auto-remove handler after 30 seconds to prevent memory leaks
        setTimeout(() => {
          removeNotificationHandler(handlerId);
        }, 30000);
      }

      const result = await unifiedNotificationService.sendNotification(options);
      console.log('[useUnifiedNotifications] Notification sent:', result);
      return result;
    } catch (err) {
      console.error('[useUnifiedNotifications] Send notification failed:', err);
      error.value = err.message;
      throw err;
    }
  };

  /**
   * Register device for push notifications
   * @param {string} userId Your app's user ID
   */
  const registerDevice = async (userId) => {
    try {
      console.log(
        '[useUnifiedNotifications] Registering device for user:',
        userId
      );
      const result = await unifiedNotificationService.registerDevice(userId);

      if (result.success && result.deviceId) {
        deviceId.value = result.deviceId;
      }

      console.log(
        '[useUnifiedNotifications] Device registration result:',
        result
      );
      return result;
    } catch (err) {
      console.error(
        '[useUnifiedNotifications] Device registration failed:',
        err
      );
      error.value = err.message;
      throw err;
    }
  };

  /**
   * Add a tag for user segmentation
   * @param {string} key Tag key
   * @param {string} value Tag value
   */
  const sendTag = async (key, value) => {
    try {
      console.log('[useUnifiedNotifications] Sending tag:', { key, value });
      const result = await unifiedNotificationService.sendTag(key, value);
      console.log('[useUnifiedNotifications] Tag sent:', result);
      return result;
    } catch (err) {
      console.error('[useUnifiedNotifications] Send tag failed:', err);
      error.value = err.message;
      throw err;
    }
  };

  /**
   * Add a notification event handler
   * @param {string} id Unique handler ID
   * @param {string} type Handler type: 'received', 'clicked', or 'all'
   * @param {Function} callback Handler function
   */
  const addNotificationHandler = (id, type, callback) => {
    notificationHandlers.value.set(id, { type, callback });
  };

  /**
   * Remove a notification event handler
   * @param {string} id Handler ID to remove
   */
  const removeNotificationHandler = (id) => {
    notificationHandlers.value.delete(id);
  };

  /**
   * Update reactive state from service state
   * @param {Object} serviceState State from unifiedNotificationService
   */
  const updateState = (serviceState) => {
    if (serviceState) {
      isInitialized.value = serviceState.isInitialized || false;
      hasPermission.value = serviceState.hasPermission || false;
      permissionState.value = serviceState.permissionState || 'default';
      notificationMode.value = serviceState.mode || 'local';
      isSupported.value = serviceState.isSupported !== false;
      deviceId.value = serviceState.deviceId || null;
      error.value = serviceState.error || null;
    }
  };

  /**
   * Refresh state from service
   */
  const refreshState = () => {
    const serviceState = unifiedNotificationService.getState();
    updateState(serviceState);
  };

  // Computed properties
  const canRequestPermission = computed(() => {
    return (
      isInitialized.value && unifiedNotificationService.canRequestPermission()
    );
  });

  const isReady = computed(() => {
    return isInitialized.value && isSupported.value;
  });

  const needsPermission = computed(() => {
    return (
      isReady.value &&
      !hasPermission.value &&
      permissionState.value !== 'denied'
    );
  });

  const isPushMode = computed(() => {
    return (
      notificationMode.value === 'push' || notificationMode.value === 'hybrid'
    );
  });

  const isLocalMode = computed(() => {
    return notificationMode.value === 'local';
  });

  // Lifecycle hooks
  onMounted(() => {
    // Refresh state when component mounts
    refreshState();
  });

  onUnmounted(() => {
    // Clean up handlers when component unmounts
    notificationHandlers.value.clear();
  });

  return {
    // State
    isInitialized: computed(() => isInitialized.value),
    hasPermission: computed(() => hasPermission.value),
    permissionState: computed(() => permissionState.value),
    notificationMode: computed(() => notificationMode.value),
    isSupported: computed(() => isSupported.value),
    deviceId: computed(() => deviceId.value),
    error: computed(() => error.value),

    // Computed properties
    canRequestPermission,
    isReady,
    needsPermission,
    isPushMode,
    isLocalMode,

    // Actions
    initialize,
    requestPermission,
    sendNotification,
    registerDevice,
    sendTag,
    addNotificationHandler,
    removeNotificationHandler,
    refreshState,

    // Utilities
    getState: () => unifiedNotificationService.getState(),
  };
}

/**
 * Global notification state (singleton pattern)
 * Use this when you need to share notification state across multiple components
 */
let globalNotificationInstance = null;

export function useGlobalNotifications() {
  if (!globalNotificationInstance) {
    globalNotificationInstance = useUnifiedNotifications();
  }
  return globalNotificationInstance;
}

/**
 * Notification presets for common use cases
 */
export const NotificationPresets = {
  /**
   * Job application notification
   */
  jobApplication: (jobTitle, contractorName) => ({
    title: 'New Job Application',
    body: `${contractorName} has applied to your job: ${jobTitle}`,
    icon: '/images/job-application-icon.png',
    data: {
      type: 'job_application',
      jobTitle,
      contractorName,
    },
  }),

  /**
   * Job status update notification
   */
  jobStatusUpdate: (jobTitle, newStatus) => ({
    title: 'Job Status Update',
    body: `Your job "${jobTitle}" status has been updated to: ${newStatus}`,
    icon: '/images/job-status-icon.png',
    data: {
      type: 'job_status_update',
      jobTitle,
      newStatus,
    },
  }),

  /**
   * New message notification
   */
  newMessage: (senderName, preview) => ({
    title: `New message from ${senderName}`,
    body: preview,
    icon: '/images/message-icon.png',
    data: {
      type: 'new_message',
      senderName,
      preview,
    },
  }),

  /**
   * System notification
   */
  system: (title, message) => ({
    title,
    body: message,
    icon: '/images/system-icon.png',
    data: {
      type: 'system',
    },
  }),
};
