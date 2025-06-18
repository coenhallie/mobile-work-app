# 🔑 FCM Server Key Setup Guide

## 📍 Where to Find Your FCM Server Key

### Step 1: Access Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Sign in with your Google account
3. Select your project (or create a new one if you don't have one)

### Step 2: Navigate to Cloud Messaging Settings

1. In your Firebase project dashboard, click on the **⚙️ Settings** gear icon (top left)
2. Select **"Project settings"** from the dropdown
3. Click on the **"Cloud Messaging"** tab

### Step 3: Find Your Server Key

You'll see several keys in the Cloud Messaging section:

#### **Legacy Server Key** (What you need for this implementation)

- Look for **"Server key"** under the "Project credentials" section
- This is a long string starting with something like `AAAAxxxxxxx...`
- Click the **copy icon** 📋 next to it
- **This is your FCM_SERVER_KEY**

#### **Other Keys You'll See (for reference)**

- **Sender ID**: A numeric ID (you might need this later)
- **Web Push certificates**: For web notifications (not needed for mobile)

## 🚨 Important Notes

### Legacy vs New API

- **Legacy Server Key**: What we're using (simpler setup)
- **New HTTP v1 API**: More secure but requires service account JSON (more complex)
- For this implementation, use the **Legacy Server Key**

### Security Warning

⚠️ **Keep your server key secure!**

- Never commit it to version control
- Store it as an environment variable or secret
- Only use it on your backend/server

## 🔧 Setting Up Your FCM Server Key

### Option 1: Supabase Secrets (Recommended)

```bash
# Set the key as a Supabase secret
supabase secrets set FCM_SERVER_KEY "AAAAxxxxxxx_your_actual_server_key_here"

# Verify it was set
supabase secrets list
```

### Option 2: Environment Variables

```bash
# Add to your .env file (for local testing)
FCM_SERVER_KEY=AAAAxxxxxxx_your_actual_server_key_here

# For production, set in your hosting platform
```

### Option 3: Direct Testing

For immediate testing, you can use it directly in the test scripts:

```javascript
// In test-fcm-direct.js
const FCM_SERVER_KEY = 'AAAAxxxxxxx_your_actual_server_key_here';
```

## 🧪 Testing Your Server Key

### Quick Test Script

```javascript
// test-server-key.js
const testFCMServerKey = async () => {
  const FCM_SERVER_KEY = 'YOUR_SERVER_KEY_HERE';

  // Test with a dummy token (will fail but validate the key)
  const response = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      Authorization: `key=${FCM_SERVER_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: 'dummy_token',
      notification: {
        title: 'Test',
        body: 'Testing server key',
      },
    }),
  });

  const result = await response.json();

  if (result.error === 'InvalidRegistration') {
    console.log('✅ Server key is valid! (Invalid token is expected)');
  } else if (result.error === 'Unauthorized') {
    console.log('❌ Server key is invalid or missing');
  } else {
    console.log('Response:', result);
  }
};

testFCMServerKey();
```

## 🔄 If You Don't Have a Firebase Project

### Create a New Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name (e.g., "mobile-work-app")
4. Choose whether to enable Google Analytics (optional)
5. Click **"Create project"**

### Enable Cloud Messaging

1. In your new project, go to **"Build"** → **"Cloud Messaging"**
2. If prompted, click **"Get started"**
3. Follow the setup wizard
4. Your server key will be automatically generated

## 📱 Additional Setup for Mobile Apps

### For Android

You'll also need:

1. **google-services.json** file
2. Add it to your Android app directory
3. Configure in your build.gradle files

### For iOS

You'll also need:

1. **GoogleService-Info.plist** file
2. Add it to your iOS app bundle
3. Configure in your Xcode project

## 🔍 Troubleshooting

### Common Issues

1. **"Unauthorized" Error**

   - Server key is incorrect
   - Copy the key again from Firebase Console
   - Make sure you're using the Legacy Server Key

2. **"Project not found"**

   - Wrong project ID
   - Check your Firebase project settings

3. **"Service not enabled"**
   - Cloud Messaging API not enabled
   - Go to Google Cloud Console → APIs & Services → Enable FCM API

### Verification Steps

1. ✅ Firebase project exists
2. ✅ Cloud Messaging is enabled
3. ✅ Server key is copied correctly
4. ✅ Key is set in Supabase secrets
5. ✅ Test script validates the key

## 🎯 Next Steps After Getting Your Key

1. **Set in Supabase**: `supabase secrets set FCM_SERVER_KEY "your_key"`
2. **Deploy Edge Function**: `supabase functions deploy chat-notification`
3. **Test Notifications**: Use the provided test scripts
4. **Configure Mobile Apps**: Add Firebase config files

Your FCM server key is the bridge between your backend and Firebase's notification service. Once you have it set up, you'll be able to send push notifications to your mobile app users!
