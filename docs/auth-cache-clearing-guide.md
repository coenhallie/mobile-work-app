# Authentication Cache Clearing Guide

## Problem Description

When user roles are updated in Supabase, the authentication session may continue to use cached user data that doesn't include the updated role metadata. This results in:

- "Using default app role" appearing in logs
- Services navigation tab not appearing for client users
- Multiple "Auth state changed" and "User signed in" events
- Authentication session using stale cached data

## Root Cause Analysis

The issue stems from **Supabase Auth Session Caching** and **Vue Reactive State Caching**:

1. **Supabase Auth Session Cache**: Supabase stores authentication sessions in browser localStorage/sessionStorage
2. **Vue Reactive State Cache**: The app's computed `userRole` property uses cached user metadata
3. **Browser Storage Persistence**: localStorage, sessionStorage, and IndexedDB contain stale auth data
4. **Token Refresh Issues**: Auth tokens may not refresh to pick up new metadata

## Solution Methods

### Method 1: Automated Script (Recommended)

Use the provided authentication cache clearing script:

#### Option A: Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Copy and paste this code:

```javascript
// Clear all Supabase auth cache
Object.keys(localStorage).forEach((key) => {
  if (key.includes('supabase') || key.includes('sb-') || key.includes('auth')) {
    localStorage.removeItem(key);
    console.log(`Cleared localStorage: ${key}`);
  }
});

Object.keys(sessionStorage).forEach((key) => {
  if (key.includes('supabase') || key.includes('sb-') || key.includes('auth')) {
    sessionStorage.removeItem(key);
    console.log(`Cleared sessionStorage: ${key}`);
  }
});

console.log('✅ Cache cleared! Reloading page...');
setTimeout(() => window.location.reload(), 1000);
```

4. Press Enter to execute
5. The page will reload automatically
6. Sign in again with your credentials

#### Option B: Use the AuthCacheClearer Component

1. Navigate to your user profile or settings page
2. Add the AuthCacheClearer component temporarily
3. Click "Clear Cache & Reload" button
4. Sign in again after the page reloads

#### Option C: Run the Standalone Script

1. Run the provided `clear-auth-cache.js` script
2. Follow the console instructions
3. Sign in again after the page reloads

### Method 2: Manual Browser Cache Clearing

If the automated script doesn't work:

1. **Open Browser DevTools** (F12)
2. **Go to Application/Storage tab**
3. **Clear localStorage**:
   - Expand "Local Storage" in the sidebar
   - Click on your domain
   - Delete all keys containing "supabase", "sb-", or "auth"
4. **Clear sessionStorage**:
   - Expand "Session Storage" in the sidebar
   - Click on your domain
   - Delete all keys containing "supabase", "sb-", or "auth"
5. **Clear cookies** (optional but recommended):
   - Expand "Cookies" in the sidebar
   - Click on your domain
   - Delete all Supabase-related cookies
6. **Clear IndexedDB** (if present):
   - Expand "IndexedDB" in the sidebar
   - Delete any Supabase-related databases
7. **Reload the page** and sign in again

### Method 3: Complete Browser Reset

For persistent issues:

1. **Clear all browser data** for the domain:
   - Chrome: Settings > Privacy > Clear browsing data
   - Firefox: Settings > Privacy > Clear Data
   - Safari: Develop > Empty Caches
2. **Disable browser cache** temporarily:
   - Open DevTools (F12)
   - Go to Network tab
   - Check "Disable cache"
3. **Use incognito/private browsing** mode
4. **Sign in again** with your credentials

## Verification Steps

After clearing the cache and signing in again:

1. **Check the browser console** for auth logs:

   ```
   ✅ Should see: "User signed in: your-email@domain.com"
   ✅ Should see: User role loaded correctly
   ❌ Should NOT see: "Using default app role"
   ```

2. **Check navigation tabs**:

   - Client users should see "Services" tab
   - Contractor users should see "Dashboard" tab
   - All authenticated users should see "Messages" and "Profile" tabs

3. **Verify user metadata** in console:
   ```javascript
   // Run in browser console to check current user data
   console.log(
     'Current user:',
     JSON.stringify(window.supabase?.auth?.user(), null, 2)
   );
   ```

## Prevention

To prevent this issue in the future:

1. **Force token refresh** after role updates:

   ```javascript
   await supabase.auth.refreshSession();
   ```

2. **Clear cache programmatically** when updating roles:

   ```javascript
   // After updating user role in database
   await supabase.auth.signOut();
   // Redirect to login page
   ```

3. **Add cache busting** to auth state changes:
   ```javascript
   // In your auth composable
   const forceRefresh = async () => {
     await supabase.auth.refreshSession();
     // Force re-fetch user data
   };
   ```

## Troubleshooting

### Issue: Cache clearing doesn't work

**Solution**: Try Method 3 (Complete Browser Reset)

### Issue: Still seeing "Using default app role"

**Solution**:

1. Check if the role was actually updated in Supabase database
2. Verify the role is in `user_metadata` not just the profiles table
3. Try signing in from a different browser/device

### Issue: Services tab still not appearing

**Solution**:

1. Check the `userRole` computed property in App.vue
2. Verify the navigation logic in `navItems` computed property
3. Ensure the role value matches exactly ('client', not 'Client')

### Issue: Multiple auth state changes

**Solution**:

1. This should resolve after cache clearing
2. If persistent, check for multiple auth listeners
3. Review the auth composable for duplicate event handlers

## Files Modified/Created

- `clear-auth-cache.js` - Standalone cache clearing script
- `src/components/auth/AuthCacheClearer.vue` - Vue component for cache clearing
- `docs/auth-cache-clearing-guide.md` - This documentation

## Technical Details

The authentication cache issue occurs because:

1. **Supabase Client Caching**: The `@supabase/supabase-js` client caches user sessions in browser storage
2. **Vue Reactivity**: The app's reactive state holds references to the cached user object
3. **Computed Properties**: The `userRole` computed property doesn't automatically refresh when database changes occur
4. **Token Persistence**: JWT tokens contain user metadata and don't automatically refresh to pick up database changes

The solution forces a complete authentication reset, ensuring fresh user data is loaded from the server.
