<template>
  <div class="biometric-setup-container p-6 bg-card rounded-xl shadow-lg">
    <div v-if="currentStep === 'initial'">
      <h2 class="text-2xl font-semibold text-foreground mb-3">
        Enable Biometric Login
      </h2>
      <p class="text-muted-foreground mb-6">
        Secure your account and log in faster with {{ biometricTypeName }}.
      </p>
      <div
        class="icon-container mx-auto mb-6 w-24 h-24 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-800"
      >
        <svg
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
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 10l.01 0M7 13l.01 0M10 7l.01 0M10 10l.01 0M10 13l.01 0M13 7l.01 0M13 10l.01 0M13 13l.01 0M16 10l.01 0M16 13l.01 0"
          ></path>
        </svg>
      </div>
      <button
        @click="startSetup"
        :disabled="isLoading"
        class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 mb-3"
      >
        Enable {{ biometricTypeName }} Login
      </button>
      <button
        v-if="showSkipOption"
        @click="skipSetup"
        :disabled="isLoading"
        class="w-full py-2 px-4 text-foreground hover:bg-muted/80 border border-border rounded-lg font-medium transition-colors"
      >
        Skip for Now
      </button>
    </div>

    <div v-if="currentStep === 'verifying'">
      <h2 class="text-2xl font-semibold text-foreground mb-3">
        Verify with {{ biometricTypeName }}
      </h2>
      <p class="text-muted-foreground mb-6">
        Please confirm your identity using {{ biometricTypeName }} to complete
        the setup.
      </p>
      <div
        class="icon-container animate-pulse mx-auto mb-6 w-24 h-24 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-800"
      >
        <svg
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
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 10l.01 0M7 13l.01 0M10 7l.01 0M10 10l.01 0M10 13l.01 0M13 7l.01 0M13 10l.01 0M13 13l.01 0M16 10l.01 0M16 13l.01 0"
          ></path>
        </svg>
      </div>
      <p v-if="isLoading" class="text-blue-600 dark:text-blue-400">
        Waiting for biometric confirmation...
      </p>
    </div>

    <div v-if="currentStep === 'success'">
      <h2
        class="text-2xl font-semibold text-green-600 dark:text-green-400 mb-3"
      >
        Setup Complete!
      </h2>
      <p class="text-muted-foreground mb-6">
        You can now use {{ biometricTypeName }} to log in quickly and securely.
      </p>
      <div
        class="icon-container mx-auto mb-6 w-24 h-24 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-700"
      >
        <svg
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
      </div>
      <button
        @click="finishSetup"
        class="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
      >
        Continue
      </button>
    </div>

    <div v-if="currentStep === 'error'">
      <h2 class="text-2xl font-semibold text-red-600 dark:text-red-400 mb-3">
        Setup Failed
      </h2>
      <p class="text-muted-foreground mb-6">
        {{
          errorMessage ||
          'Could not enable biometric login. Please try again or ensure biometrics are set up on your device.'
        }}
      </p>
      <div
        class="icon-container mx-auto mb-6 w-24 h-24 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-700"
      >
        <svg
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
      <button
        @click="resetSetup"
        class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors mb-3"
      >
        Try Again
      </button>
      <button
        v-if="showSkipOption"
        @click="skipSetup"
        class="w-full py-2 px-4 text-foreground hover:bg-muted/80 border border-border rounded-lg font-medium transition-colors"
      >
        Skip for Now
      </button>
    </div>

    <div v-if="currentStep === 'unavailable'">
      <h2 class="text-2xl font-semibold text-foreground mb-3">
        Biometrics Not Available
      </h2>
      <p class="text-muted-foreground mb-6">
        {{
          errorMessage ||
          'Biometric authentication is not available on this device or not set up in your device settings. Please set it up in your device system settings first.'
        }}
      </p>
      <button
        @click="skipSetup"
        class="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
      >
        OK
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useBiometricAuth } from '@/composables/useBiometricAuth';

const props = defineProps({
  credentials: {
    // To pass to enableBiometricAuth if needed (e.g. { email, password } or { session, user })
    type: Object,
    default: null,
  },
  showSkipOption: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits([
  'biometricEnabled',
  'biometricSkipped',
  'error',
  'completed',
]);

const {
  isBiometricAvailable,
  isLoading,
  error: biometricErrorHook,
  enableBiometricAuth,
  checkBiometricAvailability,
  getBiometricTypeName,
} = useBiometricAuth();

const currentStep = ref('initial'); // initial, verifying, success, error, unavailable
const errorMessage = ref('');
const biometricTypeName = ref('Biometrics');

onMounted(async () => {
  biometricTypeName.value = getBiometricTypeName();
  isLoading.value = true; // Use the composable's isLoading
  await checkBiometricAvailability();
  if (!isBiometricAvailable.value) {
    currentStep.value = 'unavailable';
    errorMessage.value =
      biometricErrorHook.value ||
      'Biometric authentication is not available on this device. Please ensure it is set up in your device settings.';
  }
  // isLoading will be set to false by checkBiometricAvailability
});

const startSetup = async () => {
  errorMessage.value = '';
  if (!isBiometricAvailable.value) {
    currentStep.value = 'unavailable';
    errorMessage.value =
      'Biometric authentication is not available on this device.';
    emit('error', { error: errorMessage.value });
    return;
  }

  currentStep.value = 'verifying';
  try {
    // enableBiometricAuth from the composable handles the native biometric prompt
    const result = await enableBiometricAuth(props.credentials); // Pass credentials if required by your setup
    if (result && result.session && result.user) {
      // Assuming enableBiometricAuth returns session/user on success
      currentStep.value = 'success';
      emit('biometricEnabled', {
        type: biometricTypeName.value, // Or a more specific type if available from result
        session: result.session,
        user: result.user,
      });
    } else {
      // Error should be caught by the catch block or handled by the composable's error state
      currentStep.value = 'error';
      errorMessage.value =
        biometricErrorHook.value ||
        'Failed to enable biometric authentication.';
      emit('error', { error: errorMessage.value });
    }
  } catch (err) {
    console.error('BiometricSetup error:', err);
    currentStep.value = 'error';
    errorMessage.value =
      err.message || 'An unexpected error occurred during setup.';
    emit('error', { error: errorMessage.value });
  }
};

const skipSetup = () => {
  emit('biometricSkipped');
  emit('completed'); // Generic completion event
};

const finishSetup = () => {
  emit('completed'); // Generic completion event
};

const resetSetup = () => {
  currentStep.value = 'initial';
  errorMessage.value = '';
  // Re-check availability in case something changed
  onMounted();
};
</script>

<style scoped>
.biometric-setup-container {
  width: 100%;
  max-width: 420px;
  margin: auto;
  text-align: center;
}

.icon-container {
  transition: background-color 0.3s ease-in-out;
}

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
