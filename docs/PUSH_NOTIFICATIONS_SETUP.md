# Push Notifications Setup Guide

This guide explains how to set up and use OneSignal push notifications in the Mobile Work App.

## Prerequisites

1. Create a OneSignal account at [https://onesignal.com](https://onesignal.com)
2. Create a new OneSignal app in the OneSignal dashboard
3. Configure your app for Web Push, iOS, and/or Android platforms

## Configuration

### 1. Get Your OneSignal App ID

After creating your OneSignal app, you'll get an App ID. This is a UUID that looks like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`.

### 2. Set Environment Variables

Add your OneSignal App ID to the `.env` or `.env.local` file:

```
VITE_ONESIGNAL_APP_ID=your-onesignal-app-id
```

### 3. Configure OneSignal for Each Platform

#### Web Push

For web push notifications, the service worker files are already set up in the `public/onesignal` directory:

- `OneSignalSDKWorker.js`
- `OneSignalSDKUpdaterWorker.js`

#### iOS (for Tauri mobile app)

1. Follow the [OneSignal iOS setup guide](https://documentation.onesignal.com/docs/ios-sdk-setup)
2. Add the required capabilities to your Xcode project:
   - Push Notifications
   - Background Modes > Remote Notifications

#### Android (for Tauri mobile app)

1. Follow the [OneSignal Android setup guide](https://documentation.onesignal.com/docs/android-sdk-setup)
2. Make sure your `AndroidManifest.xml` has the required permissions

## Supabase Edge Functions

The project includes two Supabase Edge Functions for handling notifications:

1. `send-onesignal-notification`: Sends notifications for new jobs to matched contractors
2. `test-notification`: Sends a test notification to verify the setup

### Deploying Edge Functions

Deploy the Edge Functions to your Supabase project:

```bash
supabase functions deploy send-onesignal-notification
supabase functions deploy test-notification
```

### Setting Secrets

Set the required secrets for the Edge Functions:

```bash
supabase secrets set ONESIGNAL_APP_ID=your-onesignal-app-id
supabase secrets set ONESIGNAL_REST_API_KEY=your-onesignal-rest-api-key
```

## Usage

### Testing Notifications

1. Go to the User Profile page
2. Scroll down to the "Test Notifications" section
3. Click the "Send Test Notification" button

### Notification Preferences

Users can manage their notification preferences in the User Profile page:

- Enable/disable new job notifications
- Set quiet hours when notifications won't be sent

### Quiet Hours

The system respects users' quiet hours settings. Notifications won't be sent during the specified quiet hours, which are stored in the user's local timezone.

## Troubleshooting

### Notifications Not Working on Web

1. Make sure the browser supports push notifications
2. Check that the user has granted notification permissions
3. Verify that the service worker files are correctly served from the `/onesignal` path
4. Check the browser console for any errors

### Notifications Not Working on Mobile

1. Ensure the device has an internet connection
2. Verify that the app has notification permissions
3. Check that the OneSignal SDK is properly initialized
4. Look for any errors in the device logs

## Additional Resources

- [OneSignal Documentation](https://documentation.onesignal.com/docs)
- [OneSignal Vue SDK Documentation](https://documentation.onesignal.com/docs/vue-sdk-setup)
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
