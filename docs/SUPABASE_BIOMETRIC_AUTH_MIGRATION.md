# Supabase Biometric Authentication Migration Guide

This document outlines the migration of the biometric authentication system from Clerk to Supabase Auth, including all changes made and how to use the updated system.

## Overview

The biometric authentication system has been successfully migrated from Clerk to Supabase Auth while maintaining all existing functionality and UI components. The system now integrates seamlessly with Supabase's authentication system.

## Key Changes Made

### 1. Updated `useBiometricAuth` Composable

**File**: `src/composables/useBiometricAuth.js`

**Changes**:

- ✅ Replaced Clerk token storage with Supabase session storage
- ✅ Added Supabase client integration using environment variables
- ✅ Updated `enableBiometricAuth()` to accept credentials or existing session
- ✅ Updated `authenticateWithBiometrics()` to return session and user objects
- ✅ Added automatic session refresh for expired tokens
- ✅ Updated secure storage keys for Supabase data
- ✅ Added helper functions for session management

**New Storage Keys**:

```javascript
const SUPABASE_SESSION_KEY = 'supabase_session';
const SUPABASE_USER_KEY = 'supabase_user';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
```

**New Functions**:

- `getCurrentSession()` - Get stored session if valid
- `getSupabaseClient()` - Get Supabase client instance

### 2. Updated BiometricSetup Component

**File**: `src/components/auth/BiometricSetup.vue`

**Changes**:

- ✅ Changed prop from `sessionToken` to `credentials`
- ✅ Updated `handleEnableBiometric()` to work with Supabase credentials
- ✅ Updated `handleTestBiometric()` to handle session/user objects
- ✅ Modified event emissions to include session and user data

**New Props**:

```javascript
credentials: {
  type: Object,
  default: null,
  // Expected format:
  // { email: 'user@example.com', password: 'password123' }
  // OR
  // { session: existingSession, user: existingUser }
}
```

### 3. Updated BiometricModal Component

**File**: `src/components/auth/BiometricModal.vue`

**Changes**:

- ✅ Changed prop from `sessionToken` to `credentials`
- ✅ Updated authentication success handling
- ✅ Modified event emissions for Supabase compatibility

### 4. Updated BiometricAuthView Component

**File**: `src/components/auth/BiometricAuthView.vue`

**Changes**:

- ✅ Removed Clerk `useAuth` dependency
- ✅ Updated authentication flow to use Supabase
- ✅ Added Supabase session management in success handler

## Usage Examples

### 1. Setting Up Biometric Authentication

```vue
<template>
  <BiometricSetup
    :credentials="userCredentials"
    :showSkipOption="true"
    @biometricEnabled="handleBiometricEnabled"
    @biometricSkipped="handleSkipped"
    @error="handleError"
  />
</template>

<script setup>
import { ref } from 'vue';
import BiometricSetup from './components/auth/BiometricSetup.vue';

// Option 1: Use email/password for setup
const userCredentials = ref({
  email: 'user@example.com',
  password: 'userpassword123',
});

// Option 2: Use existing session (if user is already authenticated)
const userCredentials = ref({
  session: existingSupabaseSession,
  user: existingSupabaseUser,
});

const handleBiometricEnabled = (result) => {
  console.log('Biometric enabled:', result);
  // result contains: { type, typeName, session, user }

  // Update your app's authentication state
  updateAuthState(result.session, result.user);
};
</script>
```

### 2. Using Biometric Authentication Modal

```vue
<template>
  <BiometricModal
    :isOpen="showBiometricModal"
    :credentials="userCredentials"
    :autoMode="true"
    @close="showBiometricModal = false"
    @authSuccess="handleAuthSuccess"
    @authFailed="handleAuthFailed"
    @fallbackRequested="handleFallback"
  />
</template>

<script setup>
const handleAuthSuccess = (result) => {
  console.log('Auth success:', result);
  // result contains: { session, user, method: 'biometric' }

  // Set session in Supabase client
  const supabase = getSupabaseClient();
  await supabase.auth.setSession({
    access_token: result.session.access_token,
    refresh_token: result.session.refresh_token
  });

  // Update app state and redirect
  updateAuthState(result.session, result.user);
  router.push('/dashboard');
};
</script>
```

### 3. Using the Composable Directly

```javascript
import { useBiometricAuth } from '@/composables/useBiometricAuth';

const {
  isBiometricAvailable,
  isBiometricEnabled,
  enableBiometricAuth,
  authenticateWithBiometrics,
  getCurrentSession,
  getSupabaseClient,
} = useBiometricAuth();

// Check availability
const isAvailable = await checkBiometricAvailability();

// Enable biometric auth
const setupResult = await enableBiometricAuth({
  email: 'user@example.com',
  password: 'password123',
});

// Authenticate with biometrics
const authResult = await authenticateWithBiometrics();
if (authResult && authResult.session) {
  // Authentication successful
  console.log('User:', authResult.user.email);
  console.log(
    'Session expires:',
    new Date(authResult.session.expires_at * 1000)
  );
}
```

## Migration Steps for Existing Code

### Step 1: Update Component Props

**Before (Clerk)**:

```vue
<BiometricSetup
  :sessionToken="clerkSessionToken"
  @biometricEnabled="handleEnabled"
/>
```

**After (Supabase)**:

```vue
<BiometricSetup
  :credentials="{ email: userEmail, password: userPassword }"
  @biometricEnabled="handleEnabled"
/>
```

### Step 2: Update Event Handlers

**Before (Clerk)**:

```javascript
const handleEnabled = (result) => {
  // result = { type, typeName }
  console.log('Biometric enabled');
};

const handleAuthSuccess = (result) => {
  // result = { token, method }
  setClerkToken(result.token);
};
```

**After (Supabase)**:

```javascript
const handleEnabled = (result) => {
  // result = { type, typeName, session, user }
  updateAuthState(result.session, result.user);
};

const handleAuthSuccess = (result) => {
  // result = { session, user, method }
  updateAuthState(result.session, result.user);
};
```

### Step 3: Update Authentication State Management

**Before (Clerk)**:

```javascript
// Store Clerk token
localStorage.setItem('clerk_token', token);
```

**After (Supabase)**:

```javascript
// Session is automatically stored securely by the composable
// Just update your app's reactive state
const authStore = useAuthStore();
authStore.setUser(user);
authStore.setSession(session);
```

## Security Features

### Secure Storage

- ✅ Sessions stored using Tauri's encrypted store (`.auth.dat`)
- ✅ Automatic session refresh for expired tokens
- ✅ Secure token handling with proper cleanup

### Session Management

- ✅ Automatic session validation before use
- ✅ Refresh token handling for expired sessions
- ✅ Proper session cleanup on disable

### Biometric Security

- ✅ Biometric data never leaves the device
- ✅ Hardware-level security on supported devices
- ✅ Fallback options for authentication failures

## Error Handling

The system includes comprehensive error handling for:

- **Device Compatibility**: Checks if biometric auth is available
- **Setup Errors**: Handles authentication failures during setup
- **Session Errors**: Manages expired or invalid sessions
- **Network Errors**: Handles Supabase connection issues
- **Biometric Errors**: Manages hardware authentication failures

## Testing

Use the provided test file to verify the migration:

```bash
# Run the test file
node test-supabase-biometric-system.js
```

The test covers:

- ✅ Biometric availability checking
- ✅ Biometric authentication setup
- ✅ Authentication flow testing
- ✅ Session management verification
- ✅ Cleanup and disable functionality

## Environment Variables Required

Ensure these environment variables are set:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Compatibility

### Supported Platforms

- ✅ Android (Fingerprint, Face unlock)
- ✅ iOS (Touch ID, Face ID)
- ✅ Desktop (when biometric hardware available)

### Browser Compatibility

- ✅ Works in Tauri applications
- ✅ Graceful fallback for unsupported environments

## Troubleshooting

### Common Issues

1. **"Biometric not available"**

   - Ensure device has biometric hardware
   - Check device settings for biometric enrollment
   - Verify app permissions

2. **"Session expired"**

   - Automatic refresh should handle this
   - Check network connectivity
   - Verify Supabase configuration

3. **"Authentication failed"**
   - Check biometric sensor cleanliness
   - Retry authentication
   - Use fallback authentication

### Debug Mode

Enable debug logging:

```javascript
localStorage.setItem('enableBiometricDebug', 'true');
```

## Future Enhancements

Potential improvements for the system:

- [ ] Multi-factor authentication support
- [ ] Biometric enrollment verification
- [ ] Advanced session management
- [ ] Offline authentication caching
- [ ] Biometric template backup/restore

## Support

For issues or questions regarding the biometric authentication system:

1. Check this documentation
2. Review the test file examples
3. Check console logs for error details
4. Verify environment configuration
5. Test on supported hardware

---

**Migration completed successfully!** The biometric authentication system now uses Supabase Auth while maintaining all existing functionality and security features.
