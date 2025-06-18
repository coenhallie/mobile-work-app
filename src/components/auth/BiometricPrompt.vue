<template>
  <div class="biometric-prompt-container">
    <div class="prompt-content text-center p-6">
      <h3 class="text-xl font-semibold mb-3 text-foreground">
        {{ title }}
      </h3>
      <p class="text-muted-foreground mb-6">{{ message }}</p>

      <div
        class="icon-container mx-auto mb-6 w-24 h-24 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-800"
        :class="{
          'animate-pulse': isProcessing,
          'bg-green-100 dark:bg-green-700': authStatus === 'success',
          'bg-red-100 dark:bg-red-700': authStatus === 'error',
        }"
      >
        <!-- Generic Biometric Icon (Replace with specific ones if needed) -->
        <svg
          v-if="authStatus !== 'success' && authStatus !== 'error'"
          class="w-12 h-12 text-blue-500 dark:text-blue-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11V9c0-5.021 4.028-9 9-9s9 3.979 9 9v2c0 4.274-3.548 7.741-8.448 7.975M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11V9c0-5.021 4.028-9 9-9s9 3.979 9 9v2c0 4.274-3.548 7.741-8.448 7.975"
          ></path>
          <!-- Fingerprint part -->
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 10l.01 0M7 13l.01 0M10 7l.01 0M10 10l.01 0M10 13l.01 0M13 7l.01 0M13 10l.01 0M13 13l.01 0M16 10l.01 0M16 13l.01 0"
          ></path>
        </svg>
        <svg
          v-if="authStatus === 'success'"
          class="w-12 h-12 text-green-500 dark:text-green-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          ></path>
        </svg>
        <svg
          v-if="authStatus === 'error'"
          class="w-12 h-12 text-red-500 dark:text-red-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          ></path>
        </svg>
      </div>

      <div
        v-if="isProcessing && authStatus === 'processing'"
        class="status-text text-blue-600 dark:text-blue-400"
      >
        Processing...
      </div>
      <div
        v-if="authStatus === 'success'"
        class="status-text text-green-600 dark:text-green-400"
      >
        Authentication Successful!
      </div>
      <div
        v-if="authStatus === 'error'"
        class="status-text text-red-600 dark:text-red-400"
      >
        {{ localErrorMessage || 'Authentication Failed' }}
      </div>

      <button
        v-if="authStatus === 'idle' || authStatus === 'error'"
        @click="triggerAuthentication"
        :disabled="isProcessing"
        class="mt-6 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
      >
        {{
          authStatus === 'error'
            ? 'Try Again'
            : 'Authenticate with ' + biometricTypeName
        }}
      </button>

      <button
        v-if="authStatus !== 'success' && !isProcessing"
        @click="cancelAuthentication"
        class="mt-3 w-full py-2 px-4 text-foreground hover:bg-muted/80 border border-border rounded-lg font-medium transition-colors"
      >
        Cancel
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useBiometricAuth } from '@/composables/useBiometricAuth';

const emit = defineEmits([
  'authenticated',
  'authentication-failed',
  'error',
  'cancelled',
]);

const {
  authenticateWithBiometrics,
  getBiometricTypeName,
  isLoading: biometricHookLoading,
  error: biometricHookError,
  isBiometricAvailable,
  isBiometricEnabled,
  checkBiometricAvailability,
} = useBiometricAuth();

const title = ref('Biometric Authentication');
const message = ref('Please use your biometric sensor to log in.');
const isProcessing = ref(false);
const authStatus = ref('idle'); // idle, processing, success, error
const localErrorMessage = ref('');
const biometricTypeName = ref('Biometrics');

onMounted(async () => {
  // Initial check, though parent (BiometricAuthView) should ensure availability
  if (!isBiometricAvailable.value || !isBiometricEnabled.value) {
    await checkBiometricAvailability(); // Ensure state is fresh
  }
  biometricTypeName.value = getBiometricTypeName();
  message.value = `Please use your ${biometricTypeName.value} to log in.`;

  // Automatically trigger authentication if component is mounted for that purpose
  // This assumes the parent view controls when this prompt is shown and ready for auth
  if (isBiometricAvailable.value && isBiometricEnabled.value) {
    triggerAuthentication();
  } else {
    authStatus.value = 'error';
    localErrorMessage.value =
      'Biometric authentication is not available or not enabled.';
    emit('error', { error: localErrorMessage.value, isFatal: true });
  }
});

const triggerAuthentication = async () => {
  if (isProcessing.value) return;

  isProcessing.value = true;
  authStatus.value = 'processing';
  localErrorMessage.value = '';
  message.value = `Authenticating with ${biometricTypeName.value}...`;

  try {
    const result = await authenticateWithBiometrics();
    if (result && result.session && result.user) {
      // Supabase returns session and user on success
      authStatus.value = 'success';
      message.value = 'Authentication successful!';
      emit('authenticated', result);
    } else {
      // This case might be hit if authenticateWithBiometrics returns null or an object without session/user
      // The composable's error ref should also be set
      authStatus.value = 'error';
      localErrorMessage.value =
        biometricHookError.value || 'Authentication failed. Please try again.';
      message.value = localErrorMessage.value;
      emit('authentication-failed', localErrorMessage.value);
    }
  } catch (err) {
    console.error('BiometricPrompt error:', err);
    authStatus.value = 'error';
    localErrorMessage.value =
      err.message ||
      'An unexpected error occurred during biometric authentication.';
    message.value = localErrorMessage.value;
    emit('error', { error: localErrorMessage.value, isFatal: true }); // Assuming catch means it's likely fatal for this attempt
  } finally {
    isProcessing.value = false;
  }
};

const cancelAuthentication = () => {
  if (isProcessing.value) {
    // Potentially add logic to try and cancel an in-flight biometric operation if the plugin supports it
    console.warn(
      'Cannot cancel while processing, biometric prompt might still be active.'
    );
  }
  emit('cancelled');
};

// Watch for external loading state changes from the hook (e.g. during setup)
// watch(biometricHookLoading, (newValue) => {
//   if (authStatus.value !== 'processing') { // Don't override local processing state
//     isProcessing.value = newValue;
//   }
// });

// Watch for external errors from the hook
// watch(biometricHookError, (newError) => {
//   if (newError && authStatus.value !== 'error') { // Don't override local error state if already set
//     authStatus.value = 'error';
//     localErrorMessage.value = newError;
//     message.value = newError;
//   }
// });
</script>

<style scoped>
.biometric-prompt-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.prompt-content {
  background-color: white;
  border-radius: 0.75rem; /* rounded-xl */
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05); /* shadow-xl */
  width: 100%;
  max-width: 380px;
}

.icon-container {
  transition: background-color 0.3s ease-in-out;
}

.status-text {
  font-weight: 500; /* medium */
  margin-top: 0.5rem; /* mt-2 */
}

/* Basic pulse animation for processing state */
.animate-pulse {
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}
</style>
