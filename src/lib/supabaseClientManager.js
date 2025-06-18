/**
 * SupabaseClientManager - A singleton manager for Supabase client instances
 *
 * This utility centralizes Supabase client creation and management to:
 * 1. Avoid creating multiple clients throughout the codebase
 * 2. Ensure consistent client configuration
 * 3. Simplify authentication token handling (now managed by Supabase client)
 * 4. Provide a clean API for accessing the client
 */

import { createClient } from '@supabase/supabase-js';
import { ref, computed } from 'vue';
import { createLogger } from './loggerService';

const logger = createLogger('SupabaseClientManager');

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  logger.error(
    'Missing Supabase environment variables. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are defined in your .env file.'
  );
  // Consider throwing an error here if these are absolutely critical for app startup
}

const supabaseClientInstance = ref(null);
const currentUserSession = ref(null); // Stores the current Supabase session
const isInitialized = ref(false);
let authStateChangeListener = null;

/**
 * Initialize the Supabase client if it doesn't exist.
 * Sets up an auth state change listener.
 * @returns {Object} - Supabase client
 */
function initializeSupabaseClient() {
  if (!supabaseClientInstance.value && SUPABASE_URL && SUPABASE_ANON_KEY) {
    logger.debug('Initializing Supabase client');
    supabaseClientInstance.value = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      }
    );

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabaseClientInstance.value.auth.onAuthStateChange(
      (event, session) => {
        logger.debug(`Supabase auth event: ${event}`, session);
        currentUserSession.value = session;
        // If a global event bus or state management (like Pinia) is used,
        // an event could be dispatched here to notify other parts of the app.
      }
    );
    authStateChangeListener = subscription;
    isInitialized.value = true;
    logger.debug('Supabase client initialized and auth listener attached.');
  } else if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    logger.error(
      'Cannot initialize Supabase client due to missing URL or Key.'
    );
  }
  return supabaseClientInstance.value;
}

/**
 * Get the Supabase client. Initializes it if not already done.
 * @param {boolean} requireAuth - If true, and no user is authenticated, this could throw or return null.
 *                                For now, it returns the client, and auth checks are done by callers.
 * @returns {Promise<Object|null>} - Supabase client or null if not initializable
 */
async function getClient(requireAuth = false) {
  if (!isInitialized.value) {
    initializeSupabaseClient();
  }
  // Wait a tick to ensure onAuthStateChange might have fired if session was in URL
  await new Promise((resolve) => setTimeout(resolve, 0));

  if (requireAuth && !currentUserSession.value) {
    logger.warn('Authenticated client requested, but no user session found.');
    // Depending on strictness, could throw new Error('Authentication required.');
  }
  return supabaseClientInstance.value;
}

/**
 * Get a Supabase client synchronously.
 * Note: This might not have the latest auth state if called before onAuthStateChange fires.
 * Prefer getClient() for auth-dependent operations.
 * @returns {Object|null} - Supabase client or null if not initializable
 */
function getClientSync() {
  if (!isInitialized.value) {
    initializeSupabaseClient();
  }
  return supabaseClientInstance.value;
}

/**
 * Check if the user is currently authenticated based on the Supabase session.
 * @returns {Promise<boolean>}
 */
async function isUserAuthenticated() {
  if (!isInitialized.value) {
    await getClient(); // Ensure initialization and session check
  }
  return !!currentUserSession.value;
}

/**
 * Get the current user session.
 * @returns {Promise<Object|null>}
 */
async function getCurrentSession() {
  if (!isInitialized.value) {
    await getClient(); // Ensure initialization
  }
  return currentUserSession.value;
}

/**
 * Get the current authenticated user.
 * @returns {Promise<Object|null>}
 */
async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user || null;
}

/**
 * Process a Supabase image URL to ensure it's properly formatted
 * @param {string} url - The raw URL from Supabase storage
 * @param {Object} options - Options for processing
 * @returns {string|null} - The processed URL or null
 */
function processImageUrl(url, options = {}) {
  if (!url) return null;
  const { addCacheBuster = true } = options;
  if (addCacheBuster) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}`;
  }
  return url;
}

/**
 * Upload a profile image to Supabase storage
 * @param {Object} supabase - Supabase client instance
 * @param {File} file - The image file to upload
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} - Upload result with URL
 */
export async function uploadProfileImage(supabase, file, userId) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    // Fix: Use userId as folder name to match storage policy
    const filePath = `${userId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('profile-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      logger.error('Error uploading profile image:', error);
      throw error;
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('profile-images').getPublicUrl(filePath);

    return {
      url: publicUrl,
      path: filePath,
      data,
    };
  } catch (error) {
    logger.error('Failed to upload profile image:', error);
    throw error;
  }
}

/**
 * Update user profile with new profile image URL
 * @param {Object} supabase - Supabase client instance
 * @param {string} userId - The user ID
 * @param {string} imageUrl - The new profile image URL
 * @returns {Promise<Object>} - Update result
 */
export async function updateUserProfileWithProfileImage(
  supabase,
  userId,
  imageUrl
) {
  try {
    // Try updating contractor_profiles first
    const { data: contractorData, error: contractorError } = await supabase
      .from('contractor_profiles')
      .update({ profile_picture_url: imageUrl })
      .eq('id', userId)
      .select();

    if (contractorData && contractorData.length > 0) {
      logger.debug('Updated contractor profile with new image');
      return { success: true, data: contractorData };
    }

    // If no contractor profile, try client_profiles
    const { data: clientData, error: clientError } = await supabase
      .from('client_profiles')
      .update({ profile_picture_url: imageUrl })
      .eq('id', userId)
      .select();

    if (clientError) {
      logger.error('Error updating client profile:', clientError);
      throw clientError;
    }

    if (clientData && clientData.length > 0) {
      logger.debug('Updated client profile with new image');
      return { success: true, data: clientData };
    }

    // If neither profile exists, this might be an error condition
    logger.warn('No profile found to update for user:', userId);
    return { success: false, error: 'No profile found' };
  } catch (error) {
    logger.error('Failed to update profile with image:', error);
    throw error;
  }
}

// Add diagnostic logging
console.log(
  '[DEBUG] SupabaseClientManager: About to export default object and named supabase'
);
console.log(
  '[DEBUG] SupabaseClientManager: supabaseClientInstance.value =',
  supabaseClientInstance.value
);

// Export the supabase client instance as a named export
export const supabase =
  supabaseClientInstance.value ||
  (() => {
    console.warn(
      '[DEBUG] SupabaseClientManager: supabase client not initialized, initializing now'
    );
    return initializeSupabaseClient();
  })();

export default {
  initialize: initializeSupabaseClient, // Expose for explicit initialization if needed
  getClient,
  getClientSync,
  isUserAuthenticated,
  getCurrentSession,
  getCurrentUser,
  processImageUrl,

  isAuthenticated: computed(() => !!currentUserSession.value),
  isInitialized: computed(() => isInitialized.value),
  currentUser: computed(() => currentUserSession.value?.user || null),
  currentSessionRef: computed(() => currentUserSession.value),

  reset() {
    if (
      authStateChangeListener &&
      typeof authStateChangeListener.unsubscribe === 'function'
    ) {
      authStateChangeListener.unsubscribe();
    }
    authStateChangeListener = null;
    supabaseClientInstance.value = null;
    currentUserSession.value = null;
    isInitialized.value = false;
    logger.debug('SupabaseClientManager reset.');
  },

  // The old setupAuthWatcher is no longer needed as onAuthStateChange handles this.
  // If a component-specific reaction to auth changes is needed,
  // it should use the `useAuth` composable which can expose `currentUserSession` or similar reactive properties.
};
