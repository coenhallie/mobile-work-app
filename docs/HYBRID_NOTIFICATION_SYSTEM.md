# Hybrid Notification System Documentation

This document provides an overview of the hybrid notification system implemented for the Tauri mobile application, which integrates both local notifications and push notifications via OneSignal.

## Architecture Overview

The hybrid notification system uses a facade pattern to provide a unified interface for both local and push notifications. The system intelligently routes notification requests to the appropriate service based on:

1. The notification type
2. Platform capabilities
3. User preferences
4. Network conditions

### Key Components

- **Tauri OneSignal Plugin**: A custom Rust plugin that bridges JavaScript calls to native OneSignal SDKs on iOS and Android
- **Local Notification Service**: Handles browser-based notifications using the Web Notifications API
- **Unified Notification Service**: A facade that routes notification requests to either local or push services
- **Notification Composables**: Vue composables that provide a clean interface to the notification services

## Implementation Details

### 1. Tauri OneSignal Plugin

The plugin is implemented in Rust and provides the following API:

- `initOneSignal(appId)`: Initialize the OneSignal SDK with your app ID
- `requestPermission()`: Request notification permission from the user
- `registerDevice(userId)`: Register the device with your user ID
- `sendTag(key, value)`: Add a tag for user segmentation

### 2. Local Notification Service

Provides browser-based notifications using the Web Notifications API:

- Works across platforms (desktop and mobile)
- Handles permission management
- Sends local notifications

### 3. Unified Notification Service

Implements the facade pattern to provide a unified interface:

- Automatically detects platform and capabilities
- Routes notification requests to the appropriate service
- Handles fallback scenarios
- Manages user consent

### 4. Notification Composables

Vue composables that provide a clean interface to the notification services:

- `useLocalNotifications`: For local notifications only
- `usePushNotifications`: For OneSignal push notifications
- `useNotifications`: Unified interface for both local and push notifications

## Decision Logic

The system uses the following logic to determine which notification service to use:

1. **Platform Detection**:

   - On mobile (iOS/Android), prefer native OneSignal SDK via Tauri plugin
   - On desktop/web, use OneSignal web SDK or local notifications

2. **Capability Detection**:

   - Check if push notifications are supported and permitted
   - Fall back to local notifications if push is unavailable

3. **Notification Type**:
   - Important notifications use push when available
   - Non-critical notifications may use local to save battery/data
   - Allow forcing specific notification type via options

## Testing Instructions

### Local Notifications Testing

1. **Setup**:

   ```javascript
   import { useLocalNotifications } from '@/composables/useLocalNotifications';

   const { initializeNotifications, requestPermission, sendNotification } =
     useLocalNotifications();

   // Initialize
   await initializeNotifications();

   // Request permission
   const granted = await requestPermission();

   // Send a notification
   if (granted) {
     await sendNotification({
       title: 'Test Local Notification',
       body: 'This is a test local notification',
     });
   }
   ```

2. **Testing on Desktop**:

   - Run the application in development mode
   - Click "Enable Notifications" when prompted
   - Click "Test Notification" to send a test notification
   - Verify the notification appears in the system notification area

3. **Testing on Mobile Web**:
   - Access the web version on a mobile device
   - Follow the same steps as desktop testing
   - Note that mobile browsers may have different permission UIs

### Push Notifications Testing

1. **Setup**:

   ```javascript
   import { usePushNotifications } from '@/composables/usePushNotifications';

   const {
     initializePushNotifications,
     requestPermission,
     sendTestNotification,
   } = usePushNotifications();

   // Initialize
   await initializePushNotifications();

   // Request permission
   const granted = await requestPermission();

   // Send a test notification
   if (granted) {
     await sendTestNotification();
   }
   ```

2. **Testing on Android**:

   - Build and install the Android app
   - Ensure OneSignal is properly configured in your project
   - Grant notification permissions when prompted
   - Use the test function to send a push notification
   - Verify the notification appears in the system notification area

3. **Testing on iOS**:
   - Build and install the iOS app
   - Ensure OneSignal is properly configured and APNS certificates are set up
   - Grant notification permissions when prompted
   - Use the test function to send a push notification
   - Verify the notification appears in the system notification area

### Unified Notification System Testing

1. **Setup**:

   ```javascript
   import { useNotifications } from '@/composables/useNotifications';

   const {
     initializeNotifications,
     requestPermission,
     sendNotification,
     sendTestNotification,
     notificationMode,
   } = useNotifications();

   // Initialize
   await initializeNotifications();

   // Request permission
   const granted = await requestPermission();

   // Check which mode was selected
   console.log('Current notification mode:', notificationMode.value);

   // Send a test notification
   if (granted) {
     // Auto mode (system decides)
     await sendTestNotification();

     // Force push notification
     await sendTestNotification(true, false);

     // Force local notification
     await sendTestNotification(false, true);
   }
   ```

2. **Testing Mode Selection**:

   - Run the app on different platforms to verify the correct mode is selected
   - On mobile devices with the Tauri app, it should select 'hybrid' mode
   - On desktop browsers, it should select 'push' mode if OneSignal is configured
   - If push notifications fail or aren't configured, it should fall back to 'local' mode

3. **Testing Fallback Behavior**:
   - Disable network connectivity to test offline fallback to local notifications
   - Deny push notification permissions to test permission-based fallback

## Troubleshooting

### Common Issues

1. **Notifications not appearing on Android**:

   - Check that notification permissions are granted in system settings
   - Verify OneSignal is properly configured in your project
   - Check that the device is registered in the OneSignal dashboard

2. **Notifications not appearing on iOS**:

   - Verify APNS certificates are correctly set up
   - Check that notification permissions are granted
   - Ensure the app is properly signed and provisioned

3. **Web push notifications not working**:
   - Ensure the site is served over HTTPS (required for web push)
   - Check browser compatibility (Safari has limited web push support)
   - Verify service worker registration

### Debugging Tools

1. **Notification Logs**:

   - Check the browser console for detailed logs
   - Review the notification_logs table in the database
   - Use the OneSignal dashboard to verify device registration

2. **Permission Status**:
   - Use the NotificationConsentManager component to view current permission status
   - Check browser settings to verify site permissions

## Future Improvements

1. **Enhanced Targeting**:

   - Implement more sophisticated user segmentation
   - Add support for topic-based subscriptions

2. **Rich Notifications**:

   - Add support for images, actions, and other rich content
   - Implement notification grouping and threading

3. **Analytics**:

   - Track notification open rates and engagement
   - A/B test notification content and delivery times

4. **Offline Queue**:
   - Queue notifications when offline
   - Send when connectivity is restored
