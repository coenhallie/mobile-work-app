/**
 * useAuth - Central authentication composable
 *
 * Provides a unified interface for:
 * 1. Supabase authentication state
 * 2. Authenticated Supabase client access
 * 3. Loading states and error handling
 * 4. Reactive authentication status
 */

import { useSupabaseAuth } from './useSupabaseAuth';

/**
 * Main authentication composable - now using Supabase
 * Provides a unified interface for authentication state and methods
 */
export function useAuth() {
  const supabaseAuth = useSupabaseAuth();

  return {
    // Auth state (compatible with previous Clerk interface)
    isLoaded: supabaseAuth.isLoaded,
    isSignedIn: supabaseAuth.isSignedIn,
    user: supabaseAuth.user,
    userId: supabaseAuth.userId,
    userEmail: supabaseAuth.userEmail,
    userRole: supabaseAuth.userRole,

    // Auth methods
    signIn: supabaseAuth.signIn,
    signUp: supabaseAuth.signUp,
    signOut: supabaseAuth.signOut,
    resetPassword: supabaseAuth.resetPassword,
    updateUserMetadata: supabaseAuth.updateUserMetadata,
    getUserProfile: supabaseAuth.getUserProfile,
    upsertUserProfile: supabaseAuth.upsertUserProfile,

    // Supabase client access
    getSupabaseClient: supabaseAuth.getSupabaseClient,
    getToken: () => supabaseAuth.session.value?.access_token || null,

    // Wait for auth to be ready
    waitForAuth: (timeout = 5000) => {
      return new Promise((resolve, reject) => {
        if (supabaseAuth.isLoaded.value) {
          resolve(supabaseAuth.user.value);
          return;
        }

        const timeoutId = setTimeout(() => {
          reject(new Error('Authentication timeout'));
        }, timeout);

        const unwatch = supabaseAuth.isLoaded.value
          ? null
          : supabaseAuth.isLoaded.value ||
            (() => {
              if (supabaseAuth.isLoaded.value) {
                clearTimeout(timeoutId);
                resolve(supabaseAuth.user.value);
              }
            });

        // If already loaded, resolve immediately
        if (supabaseAuth.isLoaded.value) {
          clearTimeout(timeoutId);
          resolve(supabaseAuth.user.value);
        }
      });
    },

    // Initialization and cleanup
    initializeAuth: supabaseAuth.initializeAuth,
    cleanup: supabaseAuth.cleanup,

    // Additional computed properties for compatibility
    isAuthReady: supabaseAuth.isLoaded,
    isAuthenticated: supabaseAuth.isSignedIn,
    currentUser: supabaseAuth.user,
    session: supabaseAuth.session,
  };
}

/**
 * Alias for useAuth() - provides authenticated data fetching capabilities
 * This is used by stores that need authentication state and Supabase client access
 */
export function useAuthenticatedDataFetching() {
  return useAuth();
}

// Legacy useUser function (Clerk compatibility) has been removed.
// All components should now use useAuth() directly.
