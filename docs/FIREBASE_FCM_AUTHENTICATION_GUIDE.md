# 🔑 Firebase FCM Authentication Guide (Latest 2025)

## 🚨 Important Update: Legacy Server Keys vs Service Account Keys

Based on the latest Firebase documentation, there are **two ways** to authenticate with FCM:

### **1. Legacy Server Key (What you currently have)**

- **Format**: Short alphanumeric string (like `BTalI4Oz70FThjUa41NcZHDN0qYs8MZAnrv0p2GBxXY`)
- **Status**: ⚠️ **Deprecated but still works**
- **Use**: Simple HTTP API calls
- **Location**: Firebase Console → Project Settings → Cloud Messaging → "Server key"

### **2. Service Account Key (Recommended)**

- **Format**: JSON file with private key
- **Status**: ✅ **Current recommended approach**
- **Use**: Firebase Admin SDK
- **Location**: Firebase Console → Project Settings → Service Accounts

## 🔍 How to Get Your FCM Server Key (Legacy)

### **Step 1: Access Firebase Console**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the **⚙️ Settings** gear icon (top left)
4. Select **"Project settings"**

### **Step 2: Navigate to Cloud Messaging**

1. Click the **"Cloud Messaging"** tab
2. Scroll down to **"Project credentials"** section

### **Step 3: Find Your Server Key**

Look for:

- **"Server key"** - This is what you need for HTTP API
- Should start with `AAAA` and be ~150+ characters
- Example: `AAAAxxxxxxx:APA91bxxxxxxx...`

**If you only see a short key like yours (`BTalI4Oz70FThjUa41NcZHDN0qYs8MZAnrv0p2GBxXY`), this might be:**

- Web API Key (not for server use)
- Project ID
- Sender ID

## 🆕 Modern Approach: Service Account Authentication

### **Step 1: Get Service Account Key**

1. In Firebase Console → Project Settings
2. Go to **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Download the JSON file

### **Step 2: Use Firebase Admin SDK**

```javascript
// Instead of HTTP API with server key
const admin = require('firebase-admin');
const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Send notification
const message = {
  notification: {
    title: 'New Chat Message',
    body: 'You have a new message',
  },
  token: deviceToken,
};

admin.messaging().send(message);
```

## 🔧 Troubleshooting Your Current Setup

### **Issue**: Your key `BTalI4Oz70FThjUa41NcZHDN0qYs8MZAnrv0p2GBxXY` is likely:

1. **Web API Key** - Found in Project Settings → General → Web API Key
2. **Project ID** - Your Firebase project identifier
3. **Sender ID** - Found in Cloud Messaging settings

### **Solution Options**:

#### **Option A: Find the Correct Legacy Server Key**

1. Go to Firebase Console → Cloud Messaging
2. Look for "Server key" (not Web API key)
3. Should be much longer: `AAAAxxxxxxx:APA91bxxxxxxx...`

#### **Option B: Switch to Service Account (Recommended)**

1. Download service account JSON
2. Update your Edge Function to use Firebase Admin SDK
3. More secure and future-proof

## 🚀 Updated Edge Function with Service Account

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { initializeApp, cert } from 'https://esm.sh/firebase-admin@12.0.0/app';
import { getMessaging } from 'https://esm.sh/firebase-admin@12.0.0/messaging';

// Service Account JSON (store as Supabase secret)
const serviceAccount = JSON.parse(
  Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '{}'
);

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert(serviceAccount),
});

const messaging = getMessaging(app);

// Send notification
const message = {
  notification: {
    title: 'New Chat Message',
    body: messagePreview,
  },
  data: {
    messageId: newMessage.id,
    roomId: newMessage.room_id,
    type: 'chat_message',
  },
  token: deviceToken,
};

await messaging.send(message);
```

## 📋 Quick Checklist

### **For Legacy Server Key**:

- ✅ Go to Firebase Console → Cloud Messaging
- ✅ Find "Server key" (not Web API key)
- ✅ Should start with `AAAA` and be ~150+ characters
- ✅ Test with: `curl -X POST "https://fcm.googleapis.com/fcm/send"`

### **For Service Account (Recommended)**:

- ✅ Go to Firebase Console → Service Accounts
- ✅ Generate new private key (JSON file)
- ✅ Store JSON as Supabase secret
- ✅ Use Firebase Admin SDK in Edge Function

## 🎯 Next Steps

1. **Check if you have the correct server key format**
2. **If not, either find the real server key or switch to service account**
3. **Update your Supabase Edge Function accordingly**
4. **Test notifications**

The key you have (`BTalI4Oz70FThjUa41NcZHDN0qYs8MZAnrv0p2GBxXY`) is definitely not the correct FCM server key format. You'll need to find the proper one or switch to the modern service account approach.
