<template>
  <div class="w-full p-4 rounded-lg bg-transparent border border-border">
    <h2 class="text-xl font-normal mb-4 text-foreground">
      {{ $t('biometric.biometricAuthentication') }}
    </h2>

    <!-- Availability Status -->
    <div class="mb-6">
      <div class="flex items-center p-3 rounded-lg" :class="statusBgClass">
        <svg
          class="w-5 h-5 mr-3"
          :class="statusIconClass"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            v-if="isBiometricAvailable"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
          <path
            v-else
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        <div>
          <p class="font-medium" :class="statusTextClass">
            {{ statusTitle }}
          </p>
          <p class="text-sm" :class="statusSubtextClass">
            {{ statusDescription }}
          </p>
        </div>
      </div>
    </div>

    <!-- Settings Controls -->
    <div v-if="isBiometricAvailable" class="space-y-4">
      <!-- Enable/Disable Toggle -->
      <div class="flex items-center justify-between">
        <div>
          <label class="text-sm font-medium text-foreground">
            {{ $t('biometric.enableBiometricLogin') }}
          </label>
          <p class="text-xs text-muted-foreground">
            {{ $t('biometric.biometricLoginDescription') }}
          </p>
        </div>
        <button
          @click="toggleBiometricAuth"
          :disabled="isLoading"
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          :class="isBiometricEnabled ? 'bg-blue-600' : 'bg-muted'"
        >
          <span
            class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
            :class="isBiometricEnabled ? 'translate-x-6' : 'translate-x-1'"
          />
        </button>
      </div>

      <!-- Test Authentication Button -->
      <div v-if="isBiometricEnabled" class="pt-4 border-t border-border">
        <button
          @click="testBiometricAuth"
          :disabled="isLoading"
          class="w-full flex items-center justify-center gap-2 py-2 px-4 border border-border rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            v-if="!isLoading"
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div
            v-else
            class="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"
          ></div>
          <span class="text-sm">
            {{
              isLoading
                ? $t('biometric.testing')
                : $t('biometric.testBiometricAuthentication')
            }}
          </span>
        </button>
      </div>
    </div>

    <!-- Setup Instructions -->
    <div v-else class="pt-4">
      <div
        class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
      >
        <h4 class="font-medium text-blue-900 dark:text-blue-300 mb-2">
          {{ $t('biometric.howToEnableBiometric') }}
        </h4>
        <ul class="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>{{ $t('biometric.ensureDeviceSupports') }}</li>
          <li>{{ $t('biometric.setupBiometricMethods') }}</li>
          <li>{{ $t('biometric.returnToEnable') }}</li>
        </ul>
      </div>
    </div>

    <!-- Error Display -->
    <div
      v-if="error"
      class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
    >
      <div class="flex items-center">
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

    <!-- Success Display -->
    <div
      v-if="successMessage"
      class="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
    >
      <div class="flex items-center">
        <svg
          class="w-5 h-5 text-green-500 dark:text-green-400 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
        <p class="text-green-700 dark:text-green-300 text-sm">
          {{ successMessage }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useBiometricAuth } from '@/composables/useBiometricAuth';
import { useSupabaseAuth } from '@/composables/useSupabaseAuth'; // Import Supabase auth

const { t } = useI18n();

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
  disableBiometricAuth,
  getBiometricTypeName,
} = useBiometricAuth();

const { session: currentSupabaseSession, user: currentSupabaseUser } =
  useSupabaseAuth(); // Get current Supabase session/user

// Local state
const successMessage = ref('');

// Computed properties
const availabilityStatus = computed(() => {
  if (isBiometricAvailable.value) {
    return isBiometricEnabled.value
      ? t('biometric.enabled')
      : t('biometric.available');
  }
  return t('biometric.notAvailable');
});

const statusBgClass = computed(() => {
  if (isBiometricAvailable.value) {
    return isBiometricEnabled.value
      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
      : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800';
  }
  return 'bg-muted';
});

const statusIconClass = computed(() => {
  if (isBiometricAvailable.value) {
    return isBiometricEnabled.value
      ? 'text-green-500 dark:text-green-400'
      : 'text-blue-500 dark:text-blue-400';
  }
  return 'text-muted-foreground';
});

const statusTextClass = computed(() => {
  if (isBiometricAvailable.value) {
    return isBiometricEnabled.value
      ? 'text-green-900 dark:text-green-300'
      : 'text-blue-900 dark:text-blue-300';
  }
  return 'text-foreground';
});

const statusSubtextClass = computed(() => {
  if (isBiometricAvailable.value) {
    return isBiometricEnabled.value
      ? 'text-green-700 dark:text-green-400'
      : 'text-blue-700 dark:text-blue-400';
  }
  return 'text-muted-foreground';
});

const statusTitle = computed(() => {
  if (isBiometricAvailable.value) {
    return isBiometricEnabled.value
      ? t('biometric.biometricAuthenticationEnabled')
      : t('biometric.biometricAuthenticationAvailable');
  }
  return t('biometric.biometricAuthenticationNotAvailable');
});

const statusDescription = computed(() => {
  if (isBiometricAvailable.value) {
    const bioType = getBiometricTypeName() || 'biometric';
    return isBiometricEnabled.value
      ? t('biometric.youCanUseBiometric', { type: bioType })
      : t('biometric.enableBiometricForAccess', { type: bioType });
  }
  return t('biometric.deviceNotSupported');
});

// Methods
const clearMessages = () => {
  error.value = '';
  successMessage.value = '';
};

const toggleBiometricAuth = async () => {
  try {
    clearMessages();

    if (isBiometricEnabled.value) {
      const disabled = await disableBiometricAuth();
      if (disabled) {
        successMessage.value = `${getBiometricTypeName() || 'Biometric'} authentication has been disabled.`;
      } else {
        // error.value should be set by the composable
        // successMessage.value = ''; // Clear any previous success
      }
    } else {
      // User is enabling biometrics
      if (!currentSupabaseSession.value || !currentSupabaseUser.value) {
        error.value =
          'You must be logged in to enable biometric authentication.';
        console.error(
          'Attempted to enable biometrics without an active Supabase session.'
        );
        return;
      }
      const enabledResult = await enableBiometricAuth({
        session: currentSupabaseSession.value,
        user: currentSupabaseUser.value,
      });

      if (enabledResult && enabledResult.session) {
        // enableBiometricAuth returns {session, user} on success
        successMessage.value = `${getBiometricTypeName() || 'Biometric'} authentication has been enabled successfully.`;
      } else {
        // error.value should be set by the composable
        // successMessage.value = ''; // Clear any previous success
      }
    }

    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  } catch (err) {
    console.error('Error toggling biometric auth:', err);
    error.value =
      err.message || 'Failed to update biometric authentication settings';
  }
};

const testBiometricAuth = async () => {
  try {
    clearMessages();

    const result = await authenticateWithBiometrics(); // Returns {session, user} or null

    if (result && result.session) {
      successMessage.value = `${getBiometricTypeName() || t('biometric.biometric')} ${t('biometric.testSuccess')}`;
      setTimeout(() => {
        successMessage.value = '';
      }, 3000);
    } else {
      // error.value should be set by the composable
      // successMessage.value = ''; // Clear any previous success
    }
  } catch (err) {
    // Should generally be caught by the composable
    console.error('Error testing biometric auth:', err);
    error.value =
      err.message ||
      `Failed to test ${getBiometricTypeName() || 'biometric'} authentication.`;
  }
};

// Lifecycle
onMounted(async () => {
  try {
    await checkBiometricAvailability();
  } catch (err) {
    console.error('Error checking biometric availability:', err);
    error.value = 'Failed to check biometric availability';
  }
});
</script>
