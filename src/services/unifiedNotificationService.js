import { ref, computed } from 'vue';
import { localNotificationService } from './localNotificationService';
import { oneSignalService } from './oneSignalService';
import { tauriOneSignalPlugin } from './tauriOneSignalPlugin';
import { isClient, isMobile } from '@/lib/utils';

// Notification state
const isInitialized = ref(false);
const hasPermission = ref(false);
const permissionState = ref('default'); // 'default', 'granted', 'denied', 'unsupported'
const currentPlatform = ref(null);
const isSupported = ref(true);
const initError = ref(null);
const deviceId = ref(null);
const notificationMode = ref('local'); // 'local', 'push', 'hybrid'

/**
 * Unified Notification Service (Facade Pattern)
 *
 * This service provides a unified interface for both local and push notifications,
 * intelligently routing notification requests to the appropriate service based on
 * the notification type, platform, and available capabilities.
 */
export const unifiedNotificationService = {
  /**
   * Initialize the notification system
   * @param {Object} options Configuration options
   * @param {String} options.appId OneSignal App ID (required for push notifications)
   * @param {Boolean} options.allowLocalhostAsSecureOrigin Allow localhost for development
   * @param {Function} options.onNotificationReceived Callback for received notifications
   * @param {Function} options.onNotificationClicked Callback for clicked notifications
   * @returns {Promise<Object>} Initialization result
   */
  async initialize(options = {}) {
    try {
      console.log('Initializing unified notification service');

      if (isInitialized.value) {
        console.log('Notification service already initialized');
        return this.getState();
      }

      // Detect platform and capabilities
      await this._detectPlatformAndCapabilities();

      // Initialize appropriate services based on platform
      if (isMobile()) {
        console.log(
          'Mobile platform detected, initializing hybrid notifications'
        );
        notificationMode.value = 'hybrid';

        // On mobile, we'll use the Tauri OneSignal plugin for push notifications
        // and fall back to local notifications when needed
        try {
          // Initialize Tauri OneSignal plugin for native push notifications
          if (!options.appId) {
            throw new Error(
              'OneSignal App ID is required for push notifications'
            );
          }

          const pushResult = await tauriOneSignalPlugin.initialize({
            appId: options.appId,
          });

          if (pushResult.success) {
            deviceId.value = pushResult.device_id;

            // Set up notification handlers
            if (options.onNotificationClicked) {
              tauriOneSignalPlugin.onNotificationOpened(
                options.onNotificationClicked
              );
            }
          }
        } catch (pushError) {
          console.warn('Failed to initialize push notifications:', pushError);
          console.log('Falling back to local notifications only');
          notificationMode.value = 'local';
        }
      } else {
        // On desktop/web, use OneSignal for web push and local notifications as fallback
        console.log('Desktop/web platform detected');

        if (options.appId) {
          console.log('Initializing web push notifications');
          notificationMode.value = 'push';

          try {
            const pushResult = await oneSignalService.initialize({
              appId: options.appId,
              allowLocalhostAsSecureOrigin:
                options.allowLocalhostAsSecureOrigin || false,
              onNotificationReceived: options.onNotificationReceived,
              onNotificationClicked: options.onNotificationClicked,
            });

            if (pushResult && pushResult.userId) {
              deviceId.value = pushResult.userId;
            }
          } catch (pushError) {
            console.warn(
              'Failed to initialize web push notifications:',
              pushError
            );
            console.log('Falling back to local notifications');
            notificationMode.value = 'local';
          }
        } else {
          console.log(
            'No OneSignal App ID provided, using local notifications only'
          );
          notificationMode.value = 'local';
        }
      }

      // Always initialize local notifications as fallback
      const localResult = await localNotificationService.initialize();
      isSupported.value = localResult.supported;

      if (!isSupported.value) {
        console.warn('Local notifications not supported in this environment');
        initError.value = 'Notifications not supported in this environment';

        if (notificationMode.value === 'local') {
          // If we're in local-only mode and local isn't supported, we're out of options
          permissionState.value = 'unsupported';
          return {
            supported: false,
            error: 'Notifications not supported in this environment',
          };
        }
      }

      // Update permission state based on the active notification mode
      await this._updatePermissionState();

      isInitialized.value = true;
      console.log('Unified notification service initialized:', {
        mode: notificationMode.value,
        supported: isSupported.value,
        hasPermission: hasPermission.value,
        permissionState: permissionState.value,
        platform: currentPlatform.value,
        deviceId: deviceId.value
          ? `${deviceId.value.substring(0, 8)}...`
          : null,
      });

      return this.getState();
    } catch (error) {
      console.error('Error initializing unified notification service:', error);
      initError.value = error.message || 'Failed to initialize notifications';
      throw error;
    }
  },

  /**
   * Request notification permission
   * @returns {Promise<boolean>} Whether permission was granted
   */
  async requestPermission() {
    try {
      console.log('Requesting notification permission');

      if (!isInitialized.value) {
        await this.initialize();
      }

      let granted = false;

      // Request permission from the appropriate service based on mode
      if (
        notificationMode.value === 'push' ||
        notificationMode.value === 'hybrid'
      ) {
        try {
          if (isMobile()) {
            granted = await tauriOneSignalPlugin.requestPermission();
          } else {
            granted = await oneSignalService.requestPermission();
          }
        } catch (pushError) {
          console.warn(
            'Error requesting push notification permission:',
            pushError
          );
          console.log('Falling back to local notification permission');
          granted = await localNotificationService.requestPermission();
        }
      } else {
        // Local-only mode
        granted = await localNotificationService.requestPermission();
      }

      // Update permission state
      hasPermission.value = granted;
      permissionState.value = granted ? 'granted' : 'denied';

      return granted;
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
   * @param {boolean} options.forcePush Force using push notification if available (optional)
   * @param {boolean} options.forceLocal Force using local notification (optional)
   * @param {Object} options.data Additional data for push notifications (optional)
   * @param {Function} options.onClick Callback when notification is clicked (optional)
   */
  async sendNotification(options) {
    if (!isInitialized.value) {
      await this.initialize();
    }

    if (!hasPermission.value) {
      console.warn('Notification permission not granted');
      return false;
    }

    try {
      console.log('Sending notification:', options);

      // Determine which notification service to use
      let useLocal = options.forceLocal || notificationMode.value === 'local';
      let usePush =
        (options.forcePush && !options.forceLocal) ||
        notificationMode.value === 'push' ||
        notificationMode.value === 'hybrid';

      // For important notifications on hybrid mode, try push first then fall back to local
      if (usePush) {
        try {
          if (isMobile()) {
            // Use Tauri OneSignal plugin for native push notifications
            // This would typically send to the OneSignal API, but for our demo
            // we'll just simulate success
            console.log('Sending push notification via Tauri OneSignal plugin');
            return true;
          } else {
            // Use web push via OneSignal service
            // In a real implementation, this would call OneSignal's API
            console.log('Sending web push notification via OneSignal service');
            return true;
          }
        } catch (pushError) {
          console.warn('Error sending push notification:', pushError);
          if (!options.forcePush) {
            console.log('Falling back to local notification');
            useLocal = true;
          } else {
            throw pushError;
          }
        }
      }

      if (useLocal) {
        // Send local notification
        return await localNotificationService.sendNotification(options);
      }

      return false;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  },

  /**
   * Register a device token with user ID
   * @param {string} userId Your app's user ID
   * @returns {Promise<Object>} Registration result
   */
  async registerDevice(userId) {
    if (!isInitialized.value) {
      await this.initialize();
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      console.log(`Registering device for user ${userId}...`);

      if (
        notificationMode.value === 'push' ||
        notificationMode.value === 'hybrid'
      ) {
        if (isMobile()) {
          // Register with Tauri OneSignal plugin
          return await tauriOneSignalPlugin.registerDevice(userId);
        } else {
          // Register with OneSignal web service
          await oneSignalService.setExternalUserId(userId);
          return { success: true };
        }
      }

      return { success: false, error: 'Push notifications not available' };
    } catch (error) {
      console.error('Error registering device:', error);
      throw error;
    }
  },

  /**
   * Add a tag for user segmentation
   * @param {string} key Tag key
   * @param {string} value Tag value
   */
  async sendTag(key, value) {
    if (!isInitialized.value) {
      await this.initialize();
    }

    try {
      console.log(`Setting tag ${key}=${value}...`);

      if (
        notificationMode.value === 'push' ||
        notificationMode.value === 'hybrid'
      ) {
        if (isMobile()) {
          // Send tag via Tauri OneSignal plugin
          return await tauriOneSignalPlugin.sendTag(key, value);
        } else {
          // Send tag via OneSignal web service
          await oneSignalService.addTag(key, value);
          return { success: true };
        }
      }

      return { success: false, error: 'Push notifications not available' };
    } catch (error) {
      console.error('Error setting tag:', error);
      throw error;
    }
  },

  /**
   * Check if notification permission can be requested
   * @returns {boolean} Whether permission can be requested
   */
  canRequestPermission() {
    if (!isInitialized.value) {
      return false;
    }

    if (notificationMode.value === 'push') {
      return isMobile()
        ? true // We'll assume we can always request on mobile for this demo
        : oneSignalService.canRequestPermission();
    } else {
      return localNotificationService.canRequestPermission();
    }
  },

  /**
   * Get the current state
   * @returns {Object} Current state
   */
  getState() {
    return {
      isInitialized: isInitialized.value,
      hasPermission: hasPermission.value,
      permissionState: permissionState.value,
      platform: currentPlatform.value,
      isSupported: isSupported.value,
      mode: notificationMode.value,
      deviceId: deviceId.value,
      error: initError.value,
    };
  },

  /**
   * Get the notification mode
   * @returns {string} Current notification mode ('local', 'push', or 'hybrid')
   */
  getMode() {
    return notificationMode.value;
  },

  /**
   * Detect platform and capabilities
   * @private
   */
  async _detectPlatformAndCapabilities() {
    // Detect platform
    if (!isClient()) {
      currentPlatform.value = 'server';
      isSupported.value = false;
      return;
    }

    try {
      // Try to use Tauri OS plugin to detect platform
      try {
        const { platform } = await import('@tauri-apps/plugin-os');
        currentPlatform.value = await platform();
      } catch (e) {
        // Fall back to user agent detection
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
      }

      console.log('Detected platform:', currentPlatform.value);
    } catch (error) {
      console.warn('Could not detect platform:', error);
    }
  },

  /**
   * Update permission state based on active notification mode
   * @private
   */
  async _updatePermissionState() {
    if (
      notificationMode.value === 'push' ||
      notificationMode.value === 'hybrid'
    ) {
      if (isMobile()) {
        // Get permission state from Tauri OneSignal plugin
        try {
          const result = await tauriOneSignalPlugin.requestPermission();
          hasPermission.value = result;
          permissionState.value = result ? 'granted' : 'denied';
        } catch (e) {
          console.warn(
            'Error getting permission state from Tauri OneSignal plugin:',
            e
          );
          // Fall back to local notification permission state
          const localState = localNotificationService.getPermissionState();
          hasPermission.value = localState.hasPermission;
          permissionState.value = localState.permissionState;
        }
      } else {
        // Get permission state from OneSignal web service
        const state = oneSignalService.getState();
        hasPermission.value = state.hasNotificationPermission;
        permissionState.value = hasPermission.value ? 'granted' : 'denied';
      }
    } else {
      // Get permission state from local notification service
      const localState = localNotificationService.getPermissionState();
      hasPermission.value = localState.hasPermission;
      permissionState.value = localState.permissionState;
    }
  },
};

/**
 * Helper computed properties for use in components
 */
export const useUnifiedNotificationState = () => {
  const isInitialized = computed(
    () => unifiedNotificationService.getState().isInitialized
  );
  const hasPermission = computed(
    () => unifiedNotificationService.getState().hasPermission
  );
  const permissionState = computed(
    () => unifiedNotificationService.getState().permissionState
  );
  const notificationMode = computed(
    () => unifiedNotificationService.getState().mode
  );
  const isSupported = computed(
    () => unifiedNotificationService.getState().isSupported
  );

  return {
    isInitialized,
    hasPermission,
    permissionState,
    notificationMode,
    isSupported,
  };
};
