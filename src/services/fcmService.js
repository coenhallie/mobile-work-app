import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { ref } from 'vue';

// FCM state
const isInitialized = ref(false);
const deviceToken = ref(null);
const hasNotificationPermission = ref(false);
const initError = ref(null);

/**
 * FCM service for handling Firebase Cloud Messaging push notifications
 */
export const fcmService = {
  /**
   * Initialize FCM with your Firebase project ID
   * @param {Object} options Configuration options
   * @param {String} options.projectId Your Firebase Project ID
   * @param {Function} options.onNotificationReceived Callback for received notifications
   * @param {Function} options.onNotificationClicked Callback for clicked notifications
   */
  async initialize(options) {
    if (isInitialized.value) {
      return {
        deviceToken: deviceToken.value,
        hasPermission: hasNotificationPermission.value,
      };
    }

    try {
      initError.value = null;

      if (!options.projectId) {
        throw new Error('Firebase Project ID is required but not provided');
      }

      // Check if we're in a Tauri environment
      if (typeof window === 'undefined' || !window.__TAURI__) {
        return {
          deviceToken: null,
          hasPermission: false,
        };
      }

      // Initialize FCM via Tauri plugin
      const result = await invoke('plugin:fcm|init_fcm', {
        projectId: options.projectId,
      });

      if (result.success && result.device_token) {
        deviceToken.value = result.device_token;
        isInitialized.value = true;
      } else {
        throw new Error(result.error || 'Failed to initialize FCM');
      }

      // Set up notification event listeners
      if (options.onNotificationReceived) {
        await listen('fcm-notification-received', (event) => {
          options.onNotificationReceived(event.payload);
        });
      }

      if (options.onNotificationClicked) {
        await listen('fcm-notification-clicked', (event) => {
          options.onNotificationClicked(event.payload);
        });
      }

      return {
        deviceToken: deviceToken.value,
        hasPermission: hasNotificationPermission.value,
      };
    } catch (error) {
      console.error('Error initializing FCM:', error);
      initError.value = error.message || 'Failed to initialize FCM';
      throw error;
    }
  },

  /**
   * Request notification permission
   * @returns {Promise<boolean>} Whether permission was granted
   */
  async requestPermission() {
    try {
      if (!isInitialized.value) {
        return false;
      }

      const result = await invoke('plugin:fcm|request_permission');

      hasNotificationPermission.value = result.granted;

      return hasNotificationPermission.value;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  },

  /**
   * Get the FCM device token
   * @returns {Promise<string>} FCM device token
   */
  async getDeviceToken() {
    if (!isInitialized.value) {
      throw new Error('FCM not initialized');
    }

    try {
      const result = await invoke('plugin:fcm|get_device_token');

      if (result.success && result.token) {
        deviceToken.value = result.token;
        return result.token;
      } else {
        throw new Error(result.error || 'Failed to get device token');
      }
    } catch (error) {
      console.error('Error getting FCM device token:', error);
      throw error;
    }
  },

  /**
   * Register device token with your backend
   * @param {string} userId Your app's user ID
   * @param {string} platform Platform identifier ('ios', 'android', 'web')
   */
  async registerDeviceToken(userId, platform = 'android') {
    if (!isInitialized.value) {
      throw new Error('FCM not initialized');
    }

    if (!deviceToken.value) {
      throw new Error('No device token available');
    }

    try {
      const result = await invoke('plugin:fcm|register_device_token', {
        userId,
        deviceToken: deviceToken.value,
      });

      return result;
    } catch (error) {
      console.error('Error registering device token:', error);
      throw error;
    }
  },

  /**
   * Check if notification permissions can be requested
   * @returns {boolean} Whether permissions can be requested
   */
  canRequestPermission() {
    // If not initialized, we can't check
    if (!isInitialized.value) return false;

    // If already granted, no need to request again
    if (hasNotificationPermission.value) return false;

    // For mobile platforms, we can usually request permission
    return true;
  },

  /**
   * Get the current state
   */
  getState() {
    return {
      isInitialized: isInitialized.value,
      deviceToken: deviceToken.value,
      hasNotificationPermission: hasNotificationPermission.value,
      initError: initError.value,
    };
  },

  /**
   * Handle deep link from notification
   * @param {string} deepLink The deep link URL
   */
  handleDeepLink(deepLink) {
    // Parse the deep link and navigate accordingly
    if (deepLink.includes('/chat/')) {
      const roomId = deepLink.split('/chat/')[1];
      // Navigate to chat room - this would be handled by your router
      return { type: 'chat', roomId };
    } else if (deepLink.includes('/job/')) {
      const jobId = deepLink.split('/job/')[1];
      // Navigate to job details - this would be handled by your router
      return { type: 'job', jobId };
    }

    return { type: 'unknown', deepLink };
  },
};
