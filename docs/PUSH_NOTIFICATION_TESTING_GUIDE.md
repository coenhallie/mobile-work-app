# 🚀 Push Notification Testing Guide

## Overview

This guide explains how to send and test push notifications in your chat app using the FCM implementation.

## 🔧 Setup Requirements

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Go to Project Settings → Cloud Messaging
4. Copy your **Server Key** (Legacy)

### 2. Supabase Configuration

```bash
# Set your FCM server key in Supabase
supabase secrets set FCM_SERVER_KEY "your_fcm_server_key_here"

# Deploy the Edge Function
supabase functions deploy chat-notification

# Run the database migration
supabase db push
```

## 📱 Testing Methods

### Method 1: Automatic Chat Notifications (Production Flow)

**How it works:**

1. User sends a chat message
2. Database trigger fires
3. Edge Function sends FCM notification
4. Recipient receives push notification

**To test:**

1. Ensure two users are in a chat room
2. User A sends a message
3. User B should receive a push notification

### Method 2: Manual Edge Function Testing

Use the provided test script:

```bash
# Edit test-chat-notification.js with your values
node test-chat-notification.js
```

**Required values:**

- `YOUR_SUPABASE_ANON_KEY`: From your Supabase project settings
- Update the mock data with real user IDs and room IDs

### Method 3: Direct FCM API Testing

Use the direct FCM test script:

```bash
# Edit test-fcm-direct.js with your values
node test-fcm-direct.js
```

**Required values:**

- `YOUR_FCM_SERVER_KEY`: From Firebase Console
- `RECIPIENT_DEVICE_TOKEN`: From the app (see below how to get it)

## 🔍 Getting Device Tokens

### In Development (Mock Tokens)

The current implementation generates mock tokens for testing. You can see them in the browser console when FCM initializes.

### For Real Testing

1. Open your app
2. Check browser console for FCM initialization logs
3. Look for device token in the logs
4. Use this token in your test scripts

## 🧪 Testing Scenarios

### 1. Basic Notification Test

```javascript
// Test basic notification delivery
const testPayload = {
  to: 'device_token_here',
  notification: {
    title: 'Test Message',
    body: 'Hello from your chat app!',
  },
};
```

### 2. Chat-Specific Notification Test

```javascript
// Test with chat-specific data
const chatPayload = {
  to: 'device_token_here',
  notification: {
    title: 'New message from John',
    body: 'Hey, how are you doing?',
  },
  data: {
    messageId: 'msg_123',
    roomId: 'room_456',
    senderId: 'user_789',
    deepLink: 'myapp://chat/room_456',
    type: 'chat_message',
  },
};
```

### 3. Deep Link Testing

1. Send notification with deep link data
2. Tap notification on device
3. App should navigate to specific chat room

## 🔧 Troubleshooting

### Common Issues:

1. **"Invalid registration token"**

   - Device token is expired or invalid
   - Generate a new token

2. **"Unauthorized"**

   - FCM server key is incorrect
   - Check Firebase Console for correct key

3. **"No device tokens found"**

   - User hasn't granted notification permissions
   - Device token not registered in database

4. **Notifications not appearing**
   - Check device notification settings
   - Verify app is in background (foreground notifications need special handling)

### Debug Steps:

1. **Check FCM initialization:**

   ```javascript
   // In browser console
   console.log('FCM State:', fcmService.getState());
   ```

2. **Verify device token:**

   ```javascript
   // Get current device token
   const token = await fcmService.getDeviceToken();
   console.log('Device Token:', token);
   ```

3. **Test Edge Function directly:**
   ```bash
   curl -X POST "http://localhost:54321/functions/v1/chat-notification" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
     -d '{"record": {"id": "test", "room_id": "room1", "sender_user_id": "user1", "content": "test"}}'
   ```

## 📋 Production Checklist

- [ ] Firebase project configured
- [ ] FCM server key set in Supabase secrets
- [ ] Edge Function deployed
- [ ] Database migration applied
- [ ] Device tokens being collected and stored
- [ ] Notification preferences working
- [ ] Deep linking functional
- [ ] Error handling in place

## 🎯 Next Steps

1. **Native SDK Integration**: Replace mock implementations with real FCM SDKs for iOS/Android
2. **Advanced Features**: Add notification categories, actions, rich media
3. **Analytics**: Track notification delivery and engagement
4. **A/B Testing**: Test different notification formats and timing

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Verify Supabase Edge Function logs
3. Test with direct FCM API calls
4. Ensure all environment variables are set correctly
