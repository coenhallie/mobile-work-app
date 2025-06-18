import { ref, computed, onMounted, onUnmounted } from 'vue';
import supabaseClientManager from '@/lib/supabaseClientManager';

// Use centralized Supabase client to avoid multiple instances
const supabase = supabaseClientManager.getClientSync();

// Global state
const user = ref(null);
const session = ref(null);
const isLoaded = ref(false);
const isLoading = ref(true);

/**
 * Supabase Authentication Composable
 * Provides reactive authentication state and methods
 */
export function useSupabaseAuth() {
  // Computed properties
  const isSignedIn = computed(() => !!user.value);
  const userId = computed(() => {
    const id = user.value?.id || null;
    return id;
  });
  const userEmail = computed(() => user.value?.email || null);
  const userRole = computed(() => {
    return (
      user.value?.user_metadata?.role || user.value?.app_metadata?.role || null
    );
  });

  // Initialize auth state
  const initializeAuth = async () => {
    try {
      isLoading.value = true;

      // Get initial session
      const {
        data: { session: initialSession },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting initial session:', error);
      } else {
        session.value = initialSession;
        user.value = initialSession?.user || null;
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      isLoading.value = false;
      isLoaded.value = true;
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign up with email and password
  const signUp = async (email, password, metadata = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      // Clear local state
      user.value = null;
      session.value = null;

      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign in with OAuth (Google, Apple, etc.)
  const signInWithOAuth = async (provider) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error(`${provider} sign-in error:`, error);
      return { success: false, error: error.message };
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: error.message };
    }
  };

  // Update user metadata
  const updateUserMetadata = async (metadata) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: metadata,
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Update user metadata error:', error);
      return { success: false, error: error.message };
    }
  };

  // Get or create user profile
  const getUserProfile = async (userId = null) => {
    try {
      const targetUserId = userId || user.value?.id;

      if (!targetUserId) {
        throw new Error('No user ID provided');
      }

      const { data, error } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Get user profile error:', error);
      return { success: false, error: error.message };
    }
  };

  // Create or update user profile
  const upsertUserProfile = async (profileData) => {
    try {
      if (!user.value?.id) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('client_profiles')
        .upsert({
          id: user.value.id,
          email: user.value.email,
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Upsert user profile error:', error);
      return { success: false, error: error.message };
    }
  };

  // Setup auth state listener
  let authListener = null;

  const setupAuthListener = () => {
    authListener = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        session.value = newSession;
        user.value = newSession?.user || null;

        // Handle specific auth events
        switch (event) {
          case 'SIGNED_IN':
            break;
          case 'SIGNED_OUT':
            break;
          case 'TOKEN_REFRESHED':
            break;
          case 'USER_UPDATED':
            break;
        }
      }
    );
  };

  // Cleanup auth listener
  const cleanupAuthListener = () => {
    if (authListener) {
      authListener.data.subscription.unsubscribe();
      authListener = null;
    }
  };

  // Get Supabase client instance
  const getSupabaseClient = () => supabase;

  // Initialize immediately when composable is used
  // Components can call initializeAuth() and setupAuthListener() manually if needed
  if (typeof window !== 'undefined') {
    initializeAuth();
    setupAuthListener();
  }

  return {
    // State
    user,
    session,
    isLoaded: computed(() => isLoaded.value),
    isLoading: computed(() => isLoading.value),
    isSignedIn,
    userId,
    userEmail,
    userRole,

    // Methods
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    resetPassword,
    updateUserMetadata,
    getUserProfile,
    upsertUserProfile,
    initializeAuth,
    getSupabaseClient,

    // Cleanup
    cleanup: cleanupAuthListener,
  };
}

// Export singleton instance for global state management
let authInstance = null;

export function getAuthInstance() {
  if (!authInstance) {
    authInstance = useSupabaseAuth();
  }
  return authInstance;
}

// Export Supabase client for direct access
export { supabase };
