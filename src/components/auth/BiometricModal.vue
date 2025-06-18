<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center p-4 z-50"
    @click.self="handleClose"
  >
    <div class="bg-card rounded-xl shadow-xl max-w-md w-full p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-foreground">
          {{ modalTitle }}
        </h3>
        <button
          @click="handleClose"
          class="text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="text-center">
        <!-- Biometric Icon -->
        <div
          class="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <svg
            class="w-10 h-10 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <!-- Status Message -->
        <div class="mb-6">
          <h4 class="text-xl font-semibold text-foreground mb-2">
            {{ statusTitle }}
          </h4>
          <p class="text-muted-foreground">
            {{ statusMessage }}
          </p>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="mb-6">
          <div
            class="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"
          ></div>
        </div>

        <!-- Error State -->
        <div
          v-if="error"
          class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <div class="flex items-center justify-center">
            <svg
              class="w-5 h-5 text-red-500 dark:text-red-400 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p class="text-red-700 dark:text-red-300 text-sm">{{ error }}</p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-3">
          <!-- Primary Action Button -->
          <button
            v-if="showPrimaryAction"
            @click="handlePrimaryAction"
            :disabled="isLoading"
            class="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              v-if="!isLoading"
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span>{{ primaryActionText }}</span>
          </button>

          <!-- Secondary Action Button -->
          <button
            v-if="showSecondaryAction"
            @click="handleSecondaryAction"
            :disabled="isLoading"
            class="w-full py-2 px-4 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            {{ secondaryActionText }}
          </button>

          <!-- Fallback Button -->
          <button
            v-if="showFallbackAction"
            @click="handleFallbackAction"
            :disabled="isLoading"
            class="w-full py-2 px-4 rounded-lg text-foreground hover:bg-muted/80 transition-colors text-sm"
          >
            {{ fallbackActionText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useBiometricAuth } from '@/composables/useBiometricAuth';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  credentials: {
    // Changed from sessionToken to align with Supabase migration & BiometricSetup
    type: Object,
    default: null,
    // Expected format for setup mode:
    // { email: 'user@example.com', password: 'userpassword123' }
    // OR
    // { session: existingSupabaseSession, user: existingSupabaseUser }
  },
  autoMode: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'close',
  'authSuccess',
  'authFailed',
  'fallbackRequested',
  'setupCompleted',
  'setupSkipped',
]);

// Biometric auth composable
const {
  isBiometricAvailable,
  isBiometricEnabled,
  isLoading,
  error,
  authState,
  checkBiometricAvailability,
  authenticateWithBiometrics,
  enableBiometricAuth,
  getBiometricTypeName, // Added to use in prompt messages if needed
} = useBiometricAuth();

// Local state
const currentMode = ref('checking'); // checking, setup, authenticate, success, error

// Computed properties
const modalTitle = computed(() => {
  switch (currentMode.value) {
    case 'checking':
      return 'Biometric Authentication';
    case 'setup':
      return 'Setup Biometric Authentication';
    case 'authenticate':
      return 'Biometric Authentication';
    case 'success':
      return 'Authentication Successful';
    case 'error':
      return 'Authentication Failed';
    default:
      return 'Biometric Authentication';
  }
});

const statusTitle = computed(() => {
  switch (currentMode.value) {
    case 'checking':
      return 'Checking Availability';
    case 'setup':
      return 'Enable Biometric Login';
    case 'authenticate':
      return 'Authenticate with Biometrics';
    case 'success':
      return 'Welcome Back!';
    case 'error':
      return 'Authentication Failed';
    default:
      return 'Biometric Authentication';
  }
});

const statusMessage = computed(() => {
  switch (currentMode.value) {
    case 'checking':
      return 'Please wait while we check biometric availability...';
    case 'setup':
      return `To enable ${getBiometricTypeName() || 'biometric'} login, please verify your identity.`;
    case 'authenticate':
      return `Please use your ${getBiometricTypeName() || 'biometric method'} to authenticate.`;
    case 'success':
      return 'You have been successfully authenticated.';
    case 'error':
      return error.value || 'Please try again or use an alternative method.';
    default:
      return 'Please wait...';
  }
});

const showPrimaryAction = computed(() => {
  return (
    ['setup', 'authenticate'].includes(currentMode.value) && !isLoading.value
  );
});

const primaryActionText = computed(() => {
  switch (currentMode.value) {
    case 'setup':
      return 'Enable Biometric Auth';
    case 'authenticate':
      return 'Authenticate';
    default:
      return 'Continue';
  }
});

const showSecondaryAction = computed(() => {
  return currentMode.value === 'setup' && !isLoading.value;
});

const secondaryActionText = computed(() => {
  return 'Skip for now';
});

const showFallbackAction = computed(() => {
  return (
    ['authenticate', 'error'].includes(currentMode.value) && !isLoading.value
  );
});

const fallbackActionText = computed(() => {
  return 'Use Password Instead';
});

// Methods
const handleClose = () => {
  emit('close');
};

const handlePrimaryAction = async () => {
  try {
    if (currentMode.value === 'setup') {
      // Pass credentials if provided, for enableBiometricAuth to potentially use them
      // (e.g., if it needs to re-auth with password to get a fresh session to store)
      const setupResult = await enableBiometricAuth(props.credentials);
      if (setupResult && setupResult.session && setupResult.user) {
        // enableBiometricAuth returns {session, user} on success
        emit('setupCompleted', {
          success: true,
          session: setupResult.session,
          user: setupResult.user,
        });
        // Optionally, transition to 'authenticate' or 'success' directly if setup implies login
        currentMode.value = 'success'; // Assuming setup success means user is effectively logged in/session stored
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        currentMode.value = 'error'; // error ref from composable should be set
        emit('authFailed', {
          success: false,
          error: error.value || 'Setup failed',
        });
      }
    } else if (currentMode.value === 'authenticate') {
      const authResult = await authenticateWithBiometrics();
      // authenticateWithBiometrics returns {session, user} on success, or null on failure
      if (authResult && authResult.session && authResult.user) {
        currentMode.value = 'success';
        emit('authSuccess', authResult); // Emitting {session, user}
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        currentMode.value = 'error'; // error ref from composable should be set
        emit('authFailed', {
          success: false,
          error: error.value || 'Authentication failed',
        });
      }
    }
  } catch (err) {
    // This catch is for unexpected errors not handled by the composable's try/catch
    console.error('Biometric action failed:', err);
    currentMode.value = 'error';
    // Ensure the composable's error state is also updated if this is a new error
    if (!error.value) error.value = err.message;
    emit('authFailed', { success: false, error: err.message });
  }
};

const handleSecondaryAction = () => {
  emit('setupSkipped');
  handleClose();
};

const handleFallbackAction = () => {
  emit('fallbackRequested');
  handleClose();
};

const initializeModal = async () => {
  if (!props.isOpen) return;

  try {
    currentMode.value = 'checking';
    await checkBiometricAvailability();

    if (!isBiometricAvailable.value) {
      currentMode.value = 'error';
      // error.value should be set by checkBiometricAvailability
      emit('authFailed', {
        success: false,
        error:
          error.value ||
          'Biometric authentication is not available on this device.',
      });
      return;
    }

    if (!isBiometricEnabled.value && props.credentials) {
      // If credentials are provided, assume setup mode
      currentMode.value = 'setup';
    } else if (isBiometricEnabled.value) {
      currentMode.value = 'authenticate';
      if (props.autoMode) {
        // Auto-trigger authentication in auto mode
        setTimeout(() => {
          if (props.isOpen && currentMode.value === 'authenticate')
            handlePrimaryAction();
        }, 500);
      }
    } else {
      // Biometric is available, but not enabled, and no credentials for setup.
      // This state might indicate an issue or a flow where the modal was opened without a clear purpose.
      // Defaulting to 'error' or a specific message.
      currentMode.value = 'error';
      error.value =
        'Biometric login is available but not set up. Please enable it in settings or after password login.';
      emit('authFailed', { success: false, error: error.value });
    }
  } catch (err) {
    console.error('Error initializing biometric modal:', err);
    currentMode.value = 'error';
    error.value = err.message || 'Failed to initialize biometric modal.';
    emit('authFailed', { success: false, error: error.value });
  }
};

// Watchers
watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      initializeModal();
    } else {
      currentMode.value = 'checking';
    }
  }
);

// Lifecycle
onMounted(() => {
  if (props.isOpen) {
    initializeModal();
  }
});
</script>
