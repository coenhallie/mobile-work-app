# 🚀 Setup Push Notifications Without Supabase CLI

Since you don't have the Supabase CLI installed, here are alternative ways to set up and test your FCM push notifications:

## 🔧 Option 1: Set FCM Key via Supabase Dashboard

1. **Go to your Supabase Dashboard**:

   - Visit: https://supabase.com/dashboard/project/qdyjtebjyktxundpqzqt
   - Login with your account

2. **Navigate to Edge Functions**:

   - Go to "Edge Functions" in the left sidebar
   - Click on your `chat-notification` function

3. **Set Environment Variables**:
   - Look for "Environment Variables" or "Secrets" section
   - Add a new secret:
     - **Name**: `FCM_SERVER_KEY`
     - **Value**: `BTalI4Oz70FThjUa41NcZHDN0qYs8MZAnrv0p2GBxXY`
   - Save the changes

## 🔧 Option 2: Update Edge Function with Hardcoded Key (For Testing)

I can temporarily update your Edge Function to include the FCM key directly for testing purposes:

```typescript
// In the chat-notification function, replace:
const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY');

// With:
const FCM_SERVER_KEY = 'BTalI4Oz70FThjUa41NcZHDN0qYs8MZAnrv0p2GBxXY';
```

## 🧪 Test Your Notifications Right Now

### Test 1: Validate FCM Server Key

```bash
node test-server-key.js
```

This should show: ✅ SUCCESS: Server key is valid!

### Test 2: Send Direct FCM Notification

1. Edit `test-fcm-direct.js`
2. Replace `RECIPIENT_DEVICE_TOKEN` with a real device token
3. Run: `node test-fcm-direct.js`

### Test 3: Test Edge Function Directly

```bash
curl -X POST "https://qdyjtebjyktxundpqzqt.supabase.co/functions/v1/chat-notification" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -d '{
    "record": {
      "id": "test-msg-123",
      "room_id": "test-room-456",
      "sender_user_id": "test-sender-789",
      "content": "Hello! This is a test message.",
      "sender_name": "Test User"
    }
  }'
```

## 🎯 What Works Right Now

Even without the FCM key set in Supabase secrets, you can:

1. **Test FCM Server Key**: ✅ Works (validates your Firebase key)
2. **Send Direct Notifications**: ✅ Works (bypasses Supabase)
3. **Test App Integration**: ✅ Works (FCM service in your app)
4. **Build Android App**: ✅ Works (Rust compilation fixed)

## 🔄 Alternative: Install Supabase CLI Later

If you want to install the Supabase CLI later:

1. **Update Command Line Tools**:

   ```bash
   sudo rm -rf /Library/Developer/CommandLineTools
   sudo xcode-select --install
   ```

2. **Then install Supabase CLI**:

   ```bash
   brew install supabase/tap/supabase
   ```

3. **Set the secret**:
   ```bash
   supabase secrets set FCM_SERVER_KEY "BTalI4Oz70FThjUa41NcZHDN0qYs8MZAnrv0p2GBxXY"
   ```

## 🚀 Quick Start (No CLI Needed)

1. **Test your FCM key**: `node test-server-key.js`
2. **Set FCM key in Supabase Dashboard** (Option 1 above)
3. **Send a test chat message** in your app
4. **Receive push notification** automatically!

Your push notification system is fully implemented and ready to work - you just need to set the FCM key in your Supabase project via the dashboard!
