<template>
  <div class="biometric-auth-view">
    <div v-if="isLoading" class="loading-spinner">
      <p>{{ $t('biometric.loadingBiometrics') }}</p>
      <!-- Add a nicer loading spinner here -->
      <div
        class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"
      ></div>
    </div>

    <div v-else-if="!isBiometricAvailable" class="unavailable-message">
      <h3 class="text-xl font-semibold mb-2">
        {{ $t('biometric.biometricAuthenticationNotAvailable') }}
      </h3>
      <p class="text-muted-foreground mb-4">
        {{ unavailableMessage }}
      </p>
      <button @click="fallbackToPassword" class="fallback-button">
        {{ $t('biometric.usePasswordInstead') }}
      </button>
    </div>

    <div v-else-if="showPasswordFallback" class="password-fallback">
      <h3 class="text-xl font-semibold mb-2">
        {{ $t('biometric.biometricAuthenticationFailed') }}
      </h3>
      <p class="text-muted-foreground mb-4">
        {{ $t('biometric.tooManyAttempts') }}
      </p>
      <button @click="fallbackToPassword" class="fallback-button">
        {{ $t('biometric.signInWithPassword') }}
      </button>
    </div>

    <BiometricPrompt
      v-else-if="isBiometricEnabled && !showPasswordFallback"
      @authenticated="handleBiometricSuccess"
      @authentication-failed="handleBiometricFailure"
      @error="handleBiometricError"
    />

    <div
      v-else-if="!isBiometricEnabled && isBiometricAvailable"
      class="setup-prompt"
    >
      <h3 class="text-xl font-semibold mb-2">
        {{ $t('biometric.enableBiometricLoginQuestion') }}
      </h3>
      <p class="text-muted-foreground mb-4">
        You can set up biometric authentication for faster and more secure
        access. This is usually done after your first successful password login
        or in settings.
      </p>
      <button @click="fallbackToPassword" class="fallback-button">
        Continue to Password Login
      </button>
      <!-- Or navigate to BiometricSetup.vue if appropriate in the flow -->
    </div>

    <div
      v-if="errorMessage"
      class="error-message mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
    >
      <p>{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useBiometricAuth } from '@/composables/useBiometricAuth';
import BiometricPrompt from './BiometricPrompt.vue'; // Will be created next
import { useI18n } from 'vue-i18n';

const emit = defineEmits([
  'biometricSuccess',
  'biometricFailed',
  'fallbackToPassword',
  'setupBiometric',
]);

const { t } = useI18n();

const {
  isBiometricAvailable,
  isBiometricEnabled,
  isLoading: biometricLoading,
  error: biometricError,
  checkBiometricAvailability,
  authenticateWithBiometrics,
  getBiometricTypeName,
} = useBiometricAuth();

const isLoading = ref(true);
const errorMessage = ref('');
const attempts = ref(0);
const MAX_ATTEMPTS = 3;
const showPasswordFallback = ref(false);

const unavailableMessage = computed(() => {
  if (biometricError.value) {
    return biometricError.value;
  }
  return t('biometric.deviceNotSupported');
});

onMounted(async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    await checkBiometricAvailability();
    if (isBiometricAvailable.value && isBiometricEnabled.value) {
      // If available and enabled, BiometricPrompt will handle the auth attempt
    } else if (!isBiometricAvailable.value) {
      // Handled by v-if
    } else if (!isBiometricEnabled.value) {
      // User needs to set it up, usually after first password login or in settings.
      // For now, this view will guide them to password login.
    }
  } catch (err) {
    console.error('BiometricAuthView onMounted error:', err);
    errorMessage.value =
      err.message || 'An error occurred while checking biometric status.';
  } finally {
    isLoading.value = false;
  }
});

const handleBiometricSuccess = (authResult) => {
  console.log('BiometricAuthView: Success', authResult);
  attempts.value = 0;
  showPasswordFallback.value = false;
  emit('biometricSuccess', authResult);
};

const handleBiometricFailure = (failureReason) => {
  console.log('BiometricAuthView: Failure', failureReason);
  attempts.value++;
  errorMessage.value = `Authentication failed. ${failureReason || ''} (Attempt ${attempts.value} of ${MAX_ATTEMPTS})`;
  if (attempts.value >= MAX_ATTEMPTS) {
    showPasswordFallback.value = true;
    errorMessage.value = `Too many biometric attempts. Please use your password.`;
    emit('biometricFailed', { error: 'Max attempts reached' });
  }
};

const handleBiometricError = (errorData) => {
  console.error('BiometricAuthView: Error from prompt', errorData);
  errorMessage.value =
    errorData.error || 'An unexpected biometric error occurred.';
  // Decide if this error should count as an attempt or lead to fallback
  if (errorData.isFatal) {
    // Assuming prompt might emit such a flag
    showPasswordFallback.value = true;
  }
  emit('biometricFailed', errorData);
};

const fallbackToPassword = () => {
  console.log('BiometricAuthView: Fallback to password requested');
  emit('fallbackToPassword');
};

// Expose for potential parent interaction, though mostly self-contained
defineExpose({
  retryBiometric: () => {
    if (
      isBiometricAvailable.value &&
      isBiometricEnabled.value &&
      !showPasswordFallback.value
    ) {
      attempts.value = 0; // Reset attempts if manually retrying
      errorMessage.value = '';
      // The BiometricPrompt itself would handle the new attempt when it's visible
      // This might involve re-rendering or calling a method on BiometricPrompt if exposed
      console.log(
        'Retry biometric triggered - BiometricPrompt should re-attempt.'
      );
    }
  },
});
</script>

<style scoped>
.biometric-auth-view {
  width: 100%;
  max-width: 400px;
  margin: auto;
  padding: 20px;
  text-align: center;
}

.loading-spinner,
.unavailable-message,
.password-fallback,
.setup-prompt {
  padding: 20px;
  border-radius: 8px;
  background-color: #f9f9f9;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.fallback-button {
  display: inline-block;
  margin-top: 15px;
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.fallback-button:hover {
  background-color: #0056b3;
}

.error-message {
  color: #d8000c;
  background-color: #ffd2d2;
  border: 1px solid #d8000c;
  padding: 10px;
  border-radius: 5px;
  margin-top: 15px;
}
</style>
