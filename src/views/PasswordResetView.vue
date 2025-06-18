<template>
  <div class="min-h-screen bg-background flex items-center justify-center">
    <div class="max-w-md w-full mx-auto p-6">
      <div class="bg-card rounded-xl shadow-lg p-8">
        <!-- Password Reset Form -->
        <div v-if="showPasswordForm" class="space-y-6">
          <div class="text-center">
            <h2 class="text-2xl font-bold text-foreground">
              {{ t('auth.resetPassword') }}
            </h2>
            <p class="mt-2 text-muted-foreground">
              {{ t('passwordReset.enterNewPassword') }}
            </p>
          </div>

          <form @submit.prevent="handlePasswordReset" class="space-y-4">
            <div>
              <label
                for="password"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {{ t('passwordReset.newPassword') }}
              </label>
              <input
                id="password"
                v-model="newPassword"
                type="password"
                required
                minlength="6"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                :placeholder="t('passwordReset.enterNewPasswordPlaceholder')"
              />
            </div>

            <div>
              <label
                for="confirmPassword"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {{ t('auth.confirmPassword') }}
              </label>
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                type="password"
                required
                minlength="6"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                :placeholder="t('passwordReset.confirmNewPasswordPlaceholder')"
              />
            </div>

            <div v-if="passwordError" class="text-destructive text-sm">
              {{ passwordError }}
            </div>

            <button
              type="submit"
              :disabled="isUpdating || !newPassword || !confirmPassword"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div
                v-if="isUpdating"
                class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
              ></div>
              {{
                isUpdating
                  ? t('passwordReset.updating')
                  : t('passwordReset.updatePassword')
              }}
            </button>
          </form>
        </div>

        <!-- Processing State -->
        <div v-else-if="isProcessing" class="text-center space-y-4">
          <div
            class="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto"
          >
            <div
              class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"
            ></div>
          </div>
          <h2 class="text-xl font-semibold text-foreground">
            {{ t('passwordReset.verifyingResetLink') }}
          </h2>
          <p class="text-muted-foreground">
            {{ t('passwordReset.pleaseWaitVerifying') }}
          </p>
        </div>

        <!-- Success State -->
        <div v-else-if="isSuccess" class="text-center space-y-4">
          <div
            class="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto"
          >
            <svg
              class="w-8 h-8 text-green-600 dark:text-green-400"
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
          </div>
          <h2 class="text-xl font-semibold text-foreground">
            {{ t('passwordReset.passwordUpdated') }}
          </h2>
          <p class="text-muted-foreground">
            {{ t('passwordReset.passwordUpdatedRedirecting') }}
          </p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center space-y-4">
          <div
            class="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto"
          >
            <svg
              class="w-8 h-8 text-destructive"
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
          </div>
          <h2 class="text-xl font-semibold text-foreground">
            {{ t('passwordReset.resetLinkInvalid') }}
          </h2>
          <p class="text-muted-foreground">
            {{ error }}
          </p>
          <button
            @click="redirectToLogin"
            class="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            {{ t('passwordReset.backToLogin') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import supabaseClientManager from '@/lib/supabaseClientManager';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const router = useRouter();
const route = useRoute();

// Use centralized Supabase client
const supabase = supabaseClientManager.getClientSync();

// Component state
const isProcessing = ref(true);
const isSuccess = ref(false);
const isUpdating = ref(false);
const showPasswordForm = ref(false);
const error = ref('');
const passwordError = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

// Handle password reset verification and form
const handlePasswordResetFlow = async () => {
  try {
    // Check if this is a password reset callback
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type');

    console.log('Password reset flow params:', {
      type,
      hasAccessToken: !!accessToken,
    });

    if (type === 'recovery' && accessToken && refreshToken) {
      // Set the session with the tokens from the URL
      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        throw sessionError;
      }

      if (data.session) {
        // Valid reset link, show password form
        isProcessing.value = false;
        showPasswordForm.value = true;
        console.log('Valid password reset session established');
      } else {
        throw new Error('Failed to establish password reset session');
      }
    } else {
      // Check for error parameters
      const errorParam = hashParams.get('error');
      const errorDescription = hashParams.get('error_description');

      if (errorParam) {
        throw new Error(
          errorDescription || t('passwordReset.linkInvalidOrExpired')
        );
      } else {
        throw new Error(t('passwordReset.invalidResetLink'));
      }
    }
  } catch (err) {
    console.error('Password reset flow error:', err);
    error.value = err.message || t('passwordReset.linkInvalidOrExpired');
    isProcessing.value = false;
  }
};

// Handle password update
const handlePasswordReset = async () => {
  passwordError.value = '';

  // Validate passwords
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = t('forms.passwordsDoNotMatch');
    return;
  }

  if (newPassword.value.length < 6) {
    passwordError.value = t('forms.passwordTooShort');
    return;
  }

  isUpdating.value = true;

  try {
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword.value,
    });

    if (updateError) {
      throw updateError;
    }

    // Success
    showPasswordForm.value = false;
    isSuccess.value = true;

    // Redirect to login after success
    setTimeout(() => {
      router.push('/login');
    }, 3000);
  } catch (err) {
    console.error('Password update error:', err);
    passwordError.value =
      err.message || t('passwordReset.failedToUpdatePassword');
  } finally {
    isUpdating.value = false;
  }
};

// Redirect to login page
const redirectToLogin = () => {
  router.push('/login');
};

// Initialize on component mount
onMounted(() => {
  handlePasswordResetFlow();
});
</script>
