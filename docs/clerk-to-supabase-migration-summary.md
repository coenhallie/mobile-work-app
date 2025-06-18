# Clerk to Supabase Migration Summary

## Overview

This document outlines the migration from Clerk authentication to Supabase authentication, consolidating all authentication functionality into Supabase.

## Completed Changes

### 1. Removed Clerk Components

- ✅ **ClerkSignInView.vue** - Removed (functionality replaced by SupabaseSignInView.vue)
- ⚠️ **ClerkSignUpView.vue** - Should be removed (functionality included in SupabaseSignInView.vue)

### 2. Updated Core Authentication

- ✅ **src/composables/useAuth.js** - Completely rewritten to use useSupabaseAuth instead of Clerk
- ✅ **src/composables/useSupabaseAuth.js** - Already exists with full Supabase auth functionality

### 3. Router Configuration

- ✅ **src/router/index.js** - Already using SupabaseSignInView for login route

## Remaining Tasks

### High Priority - Core Components

#### 1. Remove ClerkSignUpView.vue

```bash
rm src/views/ClerkSignUpView.vue
```

#### 2. Update Components Using Clerk Imports

The following files need to be updated to use the new useAuth composable:

**Views:**

- `src/views/PostJobView.vue` - Line 255: Update Clerk auth usage
- `src/views/CompleteProfileView.vue` - Lines 854, 880, 884: Remove Clerk imports and usage
- `src/views/UserProfileView.vue` - Lines 181, 187: Update Clerk client usage
- `src/views/JobDetailsView.vue` - Lines 585, 604: Remove Clerk imports
- `src/views/ContractorListView.vue` - Lines 178, 192: Remove Clerk imports
- `src/views/ContractorProfileView.vue` - Lines 65, 72: Remove Clerk imports
- `src/views/HomeView.vue` - Lines 280, 314: Remove Clerk imports

**Components:**

- `src/components/onboarding/MinimalSetup.vue` - Lines 96, 98: Remove Clerk imports
- `src/components/chat/ChatInterface.vue` - Lines 136: Remove Clerk imports

**Composables:**

- `src/composables/usePushNotifications.js` - Lines 3, 13: Remove Clerk imports
- `src/composables/useLocalNotifications.js` - Lines 4, 14: Remove Clerk imports
- `src/composables/useTauriNotifications.js` - Lines 4, 14: Remove Clerk imports
- `src/composables/useNotifications.js` - Lines 4, 19: Remove Clerk imports

**Stores:**

- `src/stores/jobApplications.js` - Lines 4, 13: Remove Clerk imports
- `src/stores/jobImages.js` - Lines 4, 16: Remove Clerk imports

**Services/Libraries:**

- `src/lib/supabaseClient.js` - Lines 30, 598: Remove createClerkSupabaseClient function
- `src/lib/supabaseClientManager.js` - Remove Clerk-specific functionality
- `src/lib/categoryAnalyzer.js` - Lines 1, 16: Remove Clerk client usage
- `src/lib/clerkUtils.js` - Can be removed entirely or renamed to userUtils.js
- `src/lib/jobStoreOptimizer.js` - Lines 8, 31: Remove Clerk ID processing

### Medium Priority - Cleanup

#### 3. Remove Clerk Dependencies

Update `package.json` to remove Clerk packages:

```json
{
  "dependencies": {
    // Remove these:
    "@clerk/vue": "...",
    "@clerk/clerk-js": "...",
    // Keep Supabase:
    "@supabase/supabase-js": "..."
  }
}
```

#### 4. Update Environment Variables

Remove Clerk environment variables from `.env` files:

```env
# Remove these:
VITE_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...

# Keep these:
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

#### 5. Clean Up Diagnostic/Debug Code

- ✅ `src/lib/diagnosticUtils.js` - REMOVED: debugClerkImage function
- ✅ `src/components/debug/HomeDiagnostic.vue` - REMOVED: Diagnostic component

### Low Priority - Documentation

#### 6. Update Documentation

- Update README.md to reflect Supabase-only authentication
- Remove any Clerk setup instructions
- Update development setup guides

## Migration Strategy

### Phase 1: Core Authentication (Completed)

- ✅ Update main auth composable
- ✅ Ensure SupabaseSignInView is fully functional

### Phase 2: Component Updates (Next)

1. Update all view components to use new useAuth
2. Remove Clerk imports from all files
3. Test authentication flow

### Phase 3: Cleanup (Final)

1. Remove Clerk dependencies from package.json
2. Clean up environment variables
3. Remove utility functions and debug code
4. Update documentation

## Testing Checklist

After completing the migration, test:

- [ ] User sign in/sign up flow
- [ ] User profile management
- [ ] Job posting (requires auth)
- [ ] Contractor dashboard access
- [ ] Chat functionality
- [ ] Biometric authentication (if applicable)
- [ ] Guest access mode
- [ ] Password reset functionality

## Notes

1. **Backward Compatibility**: The new useAuth composable maintains the same interface as the Clerk version, so most components should work with minimal changes.

2. **User ID Format**: Supabase uses UUID format for user IDs, while Clerk used `user_` prefixed IDs. The clerkUtils.js functions may still be useful for handling legacy data.

3. **Profile Images**: The migration includes logic to handle profile images stored in both Clerk and Supabase. Consider running a one-time migration script to move all profile images to Supabase storage.

4. **Metadata**: User metadata structure may differ between Clerk and Supabase. Ensure all necessary user data is properly migrated.

## Support

If you encounter issues during migration:

1. Check the browser console for authentication errors
2. Verify Supabase environment variables are correct
3. Ensure Supabase RLS policies allow the necessary operations
4. Test with a fresh user account to avoid cached Clerk data
