import { ref } from 'vue';
import supabaseClientManager from '@/lib/supabaseClientManager';
import { useI18n } from 'vue-i18n';

// Check if we're running in Tauri environment
const isTauriEnvironment = () => {
  return typeof window !== 'undefined' && window.__TAURI__ !== undefined;
};

// Dynamically import Tauri plugins only when in Tauri environment
const getTauriModules = async () => {
  if (!isTauriEnvironment()) {
    return null;
  }

  try {
    const [biometric, os, store] = await Promise.all([
      import('@tauri-apps/plugin-biometric'),
      import('@tauri-apps/plugin-os'),
      import('@tauri-apps/plugin-store'),
    ]);

    return {
      authenticate: biometric.authenticate,
      platform: os.platform,
      Store: store.Store,
    };
  } catch (error) {
    console.warn('Failed to load Tauri modules:', error);
    return null;
  }
};

// Check if we're on mobile using the OS plugin
const isMobile = async () => {
  try {
    const tauriModules = await getTauriModules();
    if (!tauriModules) {
      // Fallback: check user agent when not in Tauri
      return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    }

    const currentPlatform = await tauriModules.platform();
    return currentPlatform === 'android' || currentPlatform === 'ios';
  } catch (error) {
    console.warn('Platform detection failed:', error);
    // Fallback: check user agent
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }
};

// Check if we're on macOS
const isMacOS = async () => {
  try {
    const tauriModules = await getTauriModules();
    if (!tauriModules) {
      // Fallback: check user agent when not in Tauri
      return /Mac|macOS/i.test(navigator.userAgent);
    }

    const currentPlatform = await tauriModules.platform();
    return currentPlatform === 'macos';
  } catch (error) {
    console.warn('Platform detection failed:', error);
    // Fallback: check user agent
    return /Mac|macOS/i.test(navigator.userAgent);
  }
};

// Check if biometric authentication is available
const available = async () => {
  try {
    if (!isTauriEnvironment()) {
      console.warn(
        'Biometric authentication is only available in Tauri environment'
      );
      return false;
    }

    const tauriModules = await getTauriModules();
    if (!tauriModules) {
      return false;
    }

    const mobile = await isMobile();
    const macOS = await isMacOS();

    // Available on mobile platforms and macOS (for Touch ID)
    if (mobile || macOS) {
      // For now, assume it's available on supported platforms
      // The actual availability will be determined when authenticate() is called
      return true;
    }

    return false;
  } catch (error) {
    console.warn('Biometric availability check failed:', error);
    return false;
  }
};

// Store configuration
const SUPABASE_SESSION_KEY = 'supabase_session';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const SUPABASE_USER_KEY = 'supabase_user';

// Create a secure store for auth tokens and session data (only in Tauri)
const getStore = async () => {
  const tauriModules = await getTauriModules();
  if (!tauriModules) {
    return null;
  }
  return new tauriModules.Store('.auth.dat');
};

// Supabase client configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL or Anon Key is missing. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment variables.'
  );
}

// Use centralized Supabase client
const supabase = supabaseClientManager.getClientSync();

/**
 * Composable for handling biometric authentication
 */
export function useBiometricAuth() {
  const { t } = useI18n();

  const isBiometricAvailable = ref(false);
  const isBiometricEnabled = ref(false);
  const isLoading = ref(false);
  const error = ref(null);
  const authState = ref('idle'); // idle, processing, success, error, unavailable
  const biometricType = ref('fingerprint'); // fingerprint, face, generic

  /**
   * Check if biometric authentication is available on the device
   */
  const checkBiometricAvailability = async () => {
    try {
      isLoading.value = true;
      authState.value = 'processing';
      error.value = null;
      console.log('[BiometricAuth] Checking availability...');

      if (!isTauriEnvironment()) {
        console.log('[BiometricAuth] Not in Tauri environment.');
        isBiometricAvailable.value = false;
        authState.value = 'unavailable';
        error.value = t('biometric.webPlatformWarning');
        isLoading.value = false;
        return false;
      }
      console.log('[BiometricAuth] In Tauri environment.');

      const tauriModules = await getTauriModules();
      if (!tauriModules) {
        console.log('[BiometricAuth] Failed to load Tauri modules.');
        isBiometricAvailable.value = false;
        authState.value = 'unavailable';
        error.value =
          'Could not initialize biometric services. Please try restarting the app.';
        isLoading.value = false;
        return false;
      }
      console.log('[BiometricAuth] Tauri modules loaded.');

      if (
        typeof tauriModules.authenticate !== 'function' ||
        typeof tauriModules.platform !== 'function'
      ) {
        console.error(
          '[BiometricAuth] Core Tauri biometric/OS plugin functions (authenticate/platform) are not available. Plugin might be missing or not registered correctly in Rust.'
        );
        isBiometricAvailable.value = false;
        authState.value = 'unavailable';
        error.value =
          'Biometric plugin functions not found. Please check app configuration or restart.';
        isLoading.value = false;
        return false;
      }
      console.log('[BiometricAuth] Core plugin functions verified.');

      const currentPlatform = await tauriModules.platform();
      console.log(`[BiometricAuth] Detected platform: ${currentPlatform}`);
      const isSupportedMobile =
        currentPlatform === 'android' || currentPlatform === 'ios';
      const isSupportedMacOS = currentPlatform === 'macos';

      if (!isSupportedMobile && !isSupportedMacOS) {
        console.log('[BiometricAuth] Platform not supported for biometrics.');
        isBiometricAvailable.value = false;
        authState.value = 'unavailable';
        error.value = `Biometric login is not supported on this device platform (${currentPlatform}). Supported on iOS, Android, and macOS with Touch ID.`;
        isLoading.value = false;
        return false;
      }
      console.log('[BiometricAuth] Platform supported.');

      // At this point, we consider biometrics "available" in principle because the environment and platform are correct.
      // The actual hardware presence/readiness is confirmed by the native `authenticate` call.
      isBiometricAvailable.value = true;

      if (currentPlatform === 'ios') {
        biometricType.value = 'face';
      } else if (currentPlatform === 'android') {
        biometricType.value = 'fingerprint';
      } else if (currentPlatform === 'macos') {
        biometricType.value = 'touch';
      } else {
        biometricType.value = 'generic'; // Should not happen if previous checks passed
      }
      console.log(
        `[BiometricAuth] Biometric type set to: ${biometricType.value}`
      );

      const store = await getStore();
      if (store) {
        const storedValue = await store.get(BIOMETRIC_ENABLED_KEY);
        isBiometricEnabled.value = storedValue === true;
        console.log(
          `[BiometricAuth] Biometric enabled in store: ${isBiometricEnabled.value}`
        );
      } else {
        console.warn(
          '[BiometricAuth] Secure store not available for checking BIOMETRIC_ENABLED_KEY. Assuming not enabled.'
        );
        isBiometricEnabled.value = false;
      }

      authState.value = 'idle';
      isLoading.value = false;
      console.log(
        `[BiometricAuth] Availability check complete. Available: ${isBiometricAvailable.value}, Enabled: ${isBiometricEnabled.value}`
      );
      return isBiometricAvailable.value;
    } catch (err) {
      console.error(
        '[BiometricAuth] Error checking biometric availability:',
        err
      );
      error.value = `Failed to check biometric availability: ${err.message || 'An unknown error occurred.'}`;
      isBiometricAvailable.value = false;
      authState.value = 'error';
      isLoading.value = false;
      return false;
    }
  };

  /**
   * Enable biometric authentication for the current user
   * @param {Object} credentials - User credentials (email/password) or existing session
   */
  const enableBiometricAuth = async (credentials) => {
    try {
      isLoading.value = true;
      authState.value = 'processing';
      error.value = null;

      if (!isBiometricAvailable.value) {
        // This typically calls checkBiometricAvailability which sets isLoading.value = false
        // However, to be safe, ensure isLoading is false if we throw here.
        isLoading.value = true; // Set true before check
        const availabilityCheck = await checkBiometricAvailability();
        isLoading.value = false; // Reset after check
        if (!availabilityCheck) {
          throw new Error(error.value || t('biometric.notAvailableOnDevice'));
        }
      }

      // Request biometric authentication before storing the session using Tauri 2 API
      const tauriModules = await getTauriModules();
      if (!tauriModules) {
        throw new Error('Biometric services are currently unavailable.');
      }

      // The message for the native biometric prompt
      const promptMessage = `Confirm to enable ${getBiometricTypeName()} login for this app.`;
      await tauriModules.authenticate(promptMessage);

      // If we reach here, authentication was successful
      let session;
      let user;

      // Check if we already have a session or need to authenticate
      if (credentials.session && credentials.user) {
        // Use existing session
        session = credentials.session;
        user = credentials.user;
      } else if (credentials.email && credentials.password) {
        // Authenticate with email/password to get session
        const { data, error: authError } =
          await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

        if (authError) {
          throw new Error(`Authentication failed: ${authError.message}`);
        }

        session = data.session;
        user = data.user;
      } else {
        throw new Error('Invalid credentials provided');
      }

      if (!session || !user) {
        throw new Error('Failed to obtain valid session');
      }

      // Store the session and user data securely
      const store = await getStore();
      if (!store) {
        throw new Error('Secure local storage is currently unavailable.');
      }

      await store.set(SUPABASE_SESSION_KEY, {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        token_type: session.token_type,
      });
      await store.set(SUPABASE_USER_KEY, user);
      await store.set(BIOMETRIC_ENABLED_KEY, true);
      await store.save();

      isBiometricEnabled.value = true;
      authState.value = 'success';
      return { session, user };
    } catch (err) {
      console.error('[BiometricAuth] Error enabling biometric auth:', err);
      if (
        err.message &&
        (err.message.toLowerCase().includes('cancelled') ||
          err.message.toLowerCase().includes('canceled'))
      ) {
        error.value = `Biometric setup was cancelled by user.`;
      } else if (
        err.message &&
        err.message.toLowerCase().includes('not available')
      ) {
        error.value = t('biometric.notAvailableOrNotSetup');
      } else if (err.message && err.message.toLowerCase().includes('denied')) {
        // Example for permission issues
        error.value = t('biometric.permissionDenied');
      } else {
        error.value =
          err.message ||
          'An unexpected error occurred while enabling biometric login.';
      }
      authState.value = 'error';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Authenticate using biometrics and retrieve the stored Supabase session
   */
  const authenticateWithBiometrics = async () => {
    try {
      isLoading.value = true;
      authState.value = 'processing';
      error.value = null;

      if (!isBiometricAvailable.value) {
        isLoading.value = true; // Set true before check
        const availabilityCheck = await checkBiometricAvailability();
        isLoading.value = false; // Reset after check
        if (!availabilityCheck) {
          throw new Error(error.value || t('biometric.notAvailableOnDevice'));
        }
      }

      if (!isBiometricEnabled.value) {
        throw new Error(
          `Biometric login has not been set up for this account. Please enable it in settings or after password login.`
        );
      }

      // Request biometric authentication using the official Tauri 2 API
      const tauriModules = await getTauriModules();
      if (!tauriModules) {
        throw new Error('Biometric services are currently unavailable.');
      }

      const promptMessage = `Log in to your account using ${getBiometricTypeName()}`;
      await tauriModules.authenticate(promptMessage);

      // If we reach here, authentication was successful
      // Retrieve the stored session and user data
      const store = await getStore();
      if (!store) {
        throw new Error('Secure local storage is currently unavailable.');
      }

      const storedSession = await store.get(SUPABASE_SESSION_KEY);
      const storedUser = await store.get(SUPABASE_USER_KEY);

      if (!storedSession || !storedUser) {
        // This case should ideally not happen if isBiometricEnabled.value is true,
        // as enabling should have stored them.
        isBiometricEnabled.value = false; // Correct the state
        if (store) {
          // ensure store is available before trying to use it
          await store.set(BIOMETRIC_ENABLED_KEY, false);
          await store.save();
        }
        throw new Error(
          'Stored biometric credentials are corrupted or missing. Please set up biometric login again through settings.'
        );
      }

      // Check if the session is still valid or needs refresh
      const now = Math.floor(Date.now() / 1000);
      if (storedSession.expires_at && storedSession.expires_at < now) {
        // Session expired, try to refresh
        if (storedSession.refresh_token) {
          const { data, error: refreshError } =
            await supabase.auth.refreshSession({
              refresh_token: storedSession.refresh_token,
            });

          if (refreshError) {
            throw new Error(`Session refresh failed: ${refreshError.message}`);
          }

          if (data.session && data.user) {
            // Update stored session with new tokens
            const updateStore = await getStore();
            if (updateStore) {
              await updateStore.set(SUPABASE_SESSION_KEY, {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_at: data.session.expires_at,
                token_type: data.session.token_type,
              });
              await updateStore.set(SUPABASE_USER_KEY, data.user);
              await updateStore.save();
            }

            authState.value = 'success';
            return { session: data.session, user: data.user };
          }
        }
        throw new Error('Session expired and refresh failed');
      }

      // Set the session in Supabase client
      const { data, error: setSessionError } = await supabase.auth.setSession({
        access_token: storedSession.access_token,
        refresh_token: storedSession.refresh_token,
      });

      if (setSessionError) {
        throw new Error(
          `Failed to restore session: ${setSessionError.message}`
        );
      }

      authState.value = 'success';
      return { session: data.session, user: data.user || storedUser };
    } catch (err) {
      console.error(
        '[BiometricAuth] Error authenticating with biometrics:',
        err
      );
      if (
        err.message &&
        (err.message.toLowerCase().includes('cancelled') ||
          err.message.toLowerCase().includes('canceled'))
      ) {
        error.value = `Biometric login was cancelled by user.`;
      } else if (
        err.message &&
        err.message.toLowerCase().includes('not available')
      ) {
        error.value = t('biometric.notAvailableOrNotSetup');
      } else if (err.message && err.message.toLowerCase().includes('denied')) {
        error.value = t('biometric.permissionDenied');
      } else if (err.message && err.message.toLowerCase().includes('lockout')) {
        // Example for lockout
        error.value = `Biometric authentication is temporarily locked due to too many failed attempts.`;
      } else {
        error.value =
          err.message || 'Biometric authentication failed. Please try again.';
      }
      authState.value = 'error';
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Disable biometric authentication
   */
  const disableBiometricAuth = async () => {
    try {
      isLoading.value = true;
      authState.value = 'processing';
      error.value = null;

      // Remove stored session, user data, and settings
      const store = await getStore();
      if (store) {
        await store.delete(SUPABASE_SESSION_KEY);
        await store.delete(SUPABASE_USER_KEY);
        await store.set(BIOMETRIC_ENABLED_KEY, false);
        await store.save();
      }

      isBiometricEnabled.value = false;
      authState.value = 'idle';
      return true;
    } catch (err) {
      console.error('Error disabling biometric auth:', err);
      error.value = err.message || 'Failed to disable biometric authentication';
      authState.value = 'error';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Reset the authentication state
   */
  const resetAuthState = () => {
    authState.value = 'idle';
    error.value = null;
    isLoading.value = false;
  };

  /**
   * Get user-friendly biometric type name
   */
  const getBiometricTypeName = () => {
    switch (biometricType.value) {
      case 'face':
        return 'Face ID';
      case 'fingerprint':
        return 'Fingerprint';
      case 'touch':
        return 'Touch ID';
      default:
        return 'Biometric';
    }
  };

  /**
   * Get the current Supabase session if available
   */
  const getCurrentSession = async () => {
    try {
      const store = await getStore();
      if (!store) {
        return null;
      }

      const storedSession = await store.get(SUPABASE_SESSION_KEY);
      const storedUser = await store.get(SUPABASE_USER_KEY);

      if (!storedSession || !storedUser) {
        return null;
      }

      // Check if session is still valid
      const now = Math.floor(Date.now() / 1000);
      if (storedSession.expires_at && storedSession.expires_at < now) {
        return null;
      }

      return { session: storedSession, user: storedUser };
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  };

  /**
   * Get the Supabase client instance
   */
  const getSupabaseClient = () => {
    return supabase;
  };

  return {
    isBiometricAvailable,
    isBiometricEnabled,
    isLoading,
    error,
    authState,
    biometricType,
    checkBiometricAvailability,
    enableBiometricAuth,
    authenticateWithBiometrics,
    disableBiometricAuth,
    resetAuthState,
    getBiometricTypeName,
    getCurrentSession,
    getSupabaseClient,
  };
}
