import { ref } from 'vue';

// Notification state
const hasPermission = ref(false);
const permissionState = ref('default'); // 'default', 'granted', 'denied'
const currentPlatform = ref(null);
const isSupported = ref(true);

/**
 * Browser-based Local Notification Service
 *
 * A service for handling local web notifications that works across platforms.
 * This service provides methods for checking permission status, requesting
 * permissions, and sending notifications using the Web Notifications API.
 */
export const localNotificationService = {
  /**
   * Initialize notification service and check permissions
   * @returns {Promise<Object>} Object containing support status and permission information
   */
  async initialize() {
    try {
      console.log('Initializing local notification service');

      // Check if notifications are supported in this environment
      if (!('Notification' in window)) {
        console.warn('Notifications not supported in this browser');
        isSupported.value = false;
        return { supported: false };
      }

      // Detect platform from user agent
      try {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('mac')) {
          currentPlatform.value = 'darwin';
        } else if (userAgent.includes('win')) {
          currentPlatform.value = 'win32';
        } else if (userAgent.includes('linux')) {
          currentPlatform.value = 'linux';
        } else if (userAgent.includes('android')) {
          currentPlatform.value = 'android';
        } else if (
          userAgent.includes('iphone') ||
          userAgent.includes('ipad') ||
          userAgent.includes('ipod')
        ) {
          currentPlatform.value = 'ios';
        }
        console.log('Detected platform:', currentPlatform.value);
      } catch (platformError) {
        console.warn('Could not detect platform:', platformError);
      }

      // Check current permission
      const currentPermission = Notification.permission;
      hasPermission.value = currentPermission === 'granted';
      permissionState.value = currentPermission;

      console.log('Notification permission state:', permissionState.value);

      return {
        supported: true,
        hasPermission: hasPermission.value,
        permissionState: permissionState.value,
        platform: currentPlatform.value,
      };
    } catch (error) {
      console.error('Error initializing notifications:', error);
      isSupported.value = false;
      return { supported: false, error: error.message };
    }
  },

  /**
   * Request notification permission
   * @returns {Promise<boolean>} Whether permission was granted
   */
  async requestPermission() {
    try {
      console.log('Requesting notification permission');

      if (!('Notification' in window)) {
        throw new Error('Notifications not supported in this browser');
      }

      const permission = await Notification.requestPermission();
      hasPermission.value = permission === 'granted';
      permissionState.value = permission;

      console.log('Permission request result:', permission);
      return hasPermission.value;
    } catch (error) {
      console.error('Error requesting permission:', error);
      throw error;
    }
  },

  /**
   * Send a notification
   * @param {Object} options Notification options
   * @param {string} options.title Notification title
   * @param {string} options.body Notification body
   * @param {string} options.icon Notification icon (optional)
   * @param {Object} options.actions Array of notification actions (optional, platform dependent)
   * @param {Function} options.onClick Callback when notification is clicked (optional)
   */
  async sendNotification(options) {
    try {
      console.log('Sending local notification:', options);

      if (!('Notification' in window)) {
        throw new Error('Notifications not supported in this browser');
      }

      if (Notification.permission !== 'granted') {
        console.warn('Notification permission not granted');
        return false;
      }

      // Prepare notification options
      const notificationOptions = {
        body: options.body,
      };

      // Add optional parameters if provided
      if (options.icon) notificationOptions.icon = options.icon;

      // Create and show the notification
      const notification = new Notification(options.title, notificationOptions);

      // Handle click callback if provided
      if (typeof options.onClick === 'function') {
        notification.onclick = options.onClick;
      }

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  },

  /**
   * Check if notifications are supported in the current environment
   * @returns {boolean} Whether notifications are supported
   */
  isSupported() {
    return isSupported.value;
  },

  /**
   * Get the current platform
   * @returns {string|null} The current platform or null if unknown
   */
  getPlatform() {
    return currentPlatform.value;
  },

  /**
   * Check if notification permission can be requested
   * @returns {boolean} Whether permission can be requested
   */
  canRequestPermission() {
    return isSupported.value && Notification.permission !== 'granted';
  },

  /**
   * Get the current permission state
   * @returns {Object} Object containing permission information
   */
  getPermissionState() {
    return {
      hasPermission: hasPermission.value,
      permissionState: permissionState.value,
      platform: currentPlatform.value,
    };
  },
};
