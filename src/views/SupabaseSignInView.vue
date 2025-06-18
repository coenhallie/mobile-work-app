<template>
  <div
    class="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-4 sm:p-6"
  >
    <div class="w-full max-w-md space-y-8">
      <!-- Initial Loading State for Biometric Check -->
      <div
        v-if="!biometricCheckComplete"
        class="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl"
      >
        <div
          class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"
        ></div>
        <p class="text-slate-600 dark:text-slate-400 text-lg">
          {{ t('auth.checkingAuthOptions') }}
        </p>
      </div>

      <!-- Biometric Auth View -->
      <BiometricAuthView
        v-else-if="showBiometricView"
        @biometricSuccess="handleBiometricLoginSuccess"
        @fallbackToPassword="handleFallbackToPassword"
        @setupBiometric="promptBiometricSetup"
        class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8"
      />

      <!-- Standard Password Login Form -->
      <div
        v-else
        class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 space-y-8"
      >
        <!-- Welcome Section -->
        <div class="text-center">
          <div
            class="w-20 h-20 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-primary-200 dark:ring-primary-800/60"
          >
            <svg
              class="w-10 h-10 text-primary dark:text-primary-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <h1 class="text-4xl font-bold text-slate-800 dark:text-white mb-2">
            {{ t('auth.welcomeBack') }}
          </h1>
          <p class="text-slate-600 dark:text-slate-400 text-lg">
            {{ t('auth.signInToAccount') }}
          </p>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleSignIn" class="space-y-6">
          <!-- Email Input -->
          <div>
            <label
              for="email"
              class="block text-base font-medium text-slate-700 dark:text-slate-300 mb-2 sr-only"
            >
              {{ t('profile.email') }}
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="w-full px-4 py-3.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm transition-all"
              :placeholder="t('auth.enterEmailPlaceholder')"
              :disabled="isLoading"
            />
          </div>

          <!-- Password Input -->
          <div>
            <label
              for="password"
              class="block text-base font-medium text-slate-700 dark:text-slate-300 mb-2 sr-only"
            >
              {{ t('auth.password') }}
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="w-full px-4 py-3.5 pr-12 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm transition-all"
                :placeholder="t('auth.enterPasswordPlaceholder')"
                :disabled="isLoading"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-primary dark:text-slate-500 dark:hover:text-primary-400 transition-colors"
                :disabled="isLoading"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
              >
                <svg
                  v-if="showPassword"
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
                <svg
                  v-else
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            </div>
            <div class="text-right mt-2">
              <button
                type="button"
                @click="showForgotPassword = true"
                class="text-sm font-medium text-primary hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                :disabled="isLoading"
              >
                {{ t('auth.forgotPassword') }}
              </button>
            </div>
          </div>

          <!-- Sign In Button -->
          <button
            type="submit"
            :disabled="isLoading || !email || !password"
            class="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-primary hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700 text-white rounded-xl font-semibold text-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-800 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            <div
              v-if="isLoading"
              class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"
            ></div>
            <span>{{
              isLoading ? t('auth.signingIn') : t('auth.signIn')
            }}</span>
          </button>
        </form>

        <!-- Divider -->
        <div class="relative my-8">
          <div class="absolute inset-0 flex items-center" aria-hidden="true">
            <div
              class="w-full border-t border-slate-200 dark:border-slate-700"
            ></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span
              class="px-3 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium"
              >{{ t('auth.orContinueWith') }}</span
            >
          </div>
        </div>

        <!-- Alternative Options -->
        <div class="space-y-4">
          <!-- Google Sign In Button -->
          <button
            @click="handleGoogleSignIn"
            :disabled="isLoading"
            class="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-800"
          >
            <svg class="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span class="text-base">{{ t('auth.continueWithGoogle') }}</span>
          </button>
        </div>

        <!-- Sign Up Link -->
        <div class="text-center mt-8">
          <p class="text-base text-slate-600 dark:text-slate-400">
            {{ t('auth.dontHaveAccountPrompt') }}
            <button
              @click="showSignUp = true"
              class="font-semibold text-primary hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
              :disabled="isLoading"
            >
              {{ t('auth.signUpNow') }}
            </button>
          </p>
        </div>

        <!-- Terms of Service -->
        <div class="mt-8 text-center">
          <p class="text-sm text-slate-500 dark:text-slate-400">
            {{ t('auth.byContinuingAgree') }}
            <a href="/terms" class="font-medium text-primary hover:underline">{{
              t('auth.termsOfService')
            }}</a>
            &
            <a
              href="/privacy"
              class="font-medium text-primary hover:underline"
              >{{ t('auth.privacyPolicy') }}</a
            >.
          </p>
        </div>
      </div>

      <!-- Error Display -->
      <div
        v-if="error"
        class="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700/50 rounded-xl p-4 mt-6 shadow"
      >
        <div class="flex items-start">
          <svg
            class="w-6 h-6 text-red-500 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p class="text-red-700 dark:text-red-300 text-base">{{ error }}</p>
        </div>
      </div>

      <!-- Success Display -->
      <div
        v-if="successMessage"
        class="bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700/50 rounded-xl p-4 mt-6 shadow"
      >
        <div class="flex items-start">
          <svg
            class="w-6 h-6 text-green-500 dark:text-green-400 mr-3 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p class="text-green-700 dark:text-green-300 text-base">
            {{ successMessage }}
          </p>
        </div>
      </div>
    </div>

    <!-- Sign Up Modal -->
    <div
      v-if="showSignUp"
      class="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      @click.self="showSignUp = false"
    >
      <div
        class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-8 m-4 space-y-6 border border-slate-200 dark:border-slate-700 transform transition-all"
      >
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-2xl font-semibold text-slate-800 dark:text-white">
            {{ t('auth.createAccount') }}
          </h3>
          <button
            @click="showSignUp = false"
            class="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-full p-1 -mr-2 -mt-2"
            :aria-label="t('auth.closeModal')"
          >
            <svg
              class="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSignUp" class="space-y-5">
          <!-- Full Name -->
          <div>
            <label
              for="signupName"
              class="block text-base font-medium text-slate-700 dark:text-slate-300 mb-1.5 sr-only"
            >
              {{ t('profile.firstName') }}
            </label>
            <input
              id="signupName"
              v-model="signUpData.fullName"
              type="text"
              required
              class="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm transition-all"
              :placeholder="t('auth.enterFullNamePlaceholder')"
              :disabled="isLoading"
            />
          </div>

          <!-- Email -->
          <div>
            <label
              for="signupEmail"
              class="block text-base font-medium text-slate-700 dark:text-slate-300 mb-1.5 sr-only"
            >
              {{ t('profile.email') }}
            </label>
            <input
              id="signupEmail"
              v-model="signUpData.email"
              type="email"
              required
              class="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm transition-all"
              :placeholder="t('auth.enterEmailPlaceholder')"
              :disabled="isLoading"
            />
          </div>

          <!-- Password -->
          <div>
            <label
              for="signupPassword"
              class="block text-base font-medium text-slate-700 dark:text-slate-300 mb-1.5 sr-only"
            >
              {{ t('auth.password') }}
            </label>
            <input
              id="signupPassword"
              v-model="signUpData.password"
              type="password"
              required
              minlength="6"
              class="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm transition-all"
              :placeholder="t('auth.enterPasswordMinPlaceholder')"
              :disabled="isLoading"
            />
          </div>

          <!-- Role Selection -->
          <div>
            <label
              for="signupRole"
              class="block text-base font-medium text-slate-700 dark:text-slate-300 mb-1.5 sr-only"
            >
              {{ t('auth.iAmA') }}
            </label>
            <select
              id="signupRole"
              v-model="signUpData.role"
              required
              class="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm transition-all appearance-none"
              :disabled="isLoading"
            >
              <option value="" disabled>{{ t('auth.selectYourRole') }}</option>
              <option value="client">{{ t('auth.clientRole') }}</option>
              <option value="contractor">{{ t('auth.contractorRole') }}</option>
            </select>
          </div>

          <!-- Sign Up Button -->
          <button
            type="submit"
            :disabled="
              isLoading ||
              !signUpData.email ||
              !signUpData.password ||
              !signUpData.fullName ||
              !signUpData.role
            "
            class="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-primary hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700 text-white rounded-xl font-semibold text-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-800 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            <div
              v-if="isLoading"
              class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"
            ></div>
            <span>{{
              isLoading
                ? t('auth.creatingAccount')
                : t('auth.createAccountButton')
            }}</span>
          </button>
        </form>
      </div>
    </div>

    <!-- Forgot Password Modal -->
    <div
      v-if="showForgotPassword"
      class="fixed inset-0 bg-black/70 dark:bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      @click.self="showForgotPassword = false"
    >
      <div
        class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-8 m-4 space-y-6 border border-slate-200 dark:border-slate-700 transform transition-all"
      >
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-2xl font-semibold text-slate-800 dark:text-white">
            {{ t('auth.resetPasswordTitle') }}
          </h3>
          <button
            @click="showForgotPassword = false"
            class="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-full p-1 -mr-2 -mt-2"
            :aria-label="t('auth.closeModal')"
          >
            <svg
              class="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleForgotPassword" class="space-y-5">
          <div>
            <label
              for="resetEmail"
              class="block text-base font-medium text-slate-700 dark:text-slate-300 mb-1.5 sr-only"
            >
              {{ t('profile.email') }}
            </label>
            <input
              id="resetEmail"
              v-model="resetEmail"
              type="email"
              required
              class="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm transition-all"
              :placeholder="t('auth.enterEmailPlaceholder')"
              :disabled="isLoading"
            />
          </div>

          <button
            type="submit"
            :disabled="isLoading || !resetEmail"
            class="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-primary hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700 text-white rounded-xl font-semibold text-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-800 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            <div
              v-if="isLoading"
              class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"
            ></div>
            <span>{{
              isLoading
                ? t('auth.sendingResetLink')
                : t('auth.sendResetLinkButton')
            }}</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import supabaseClientManager from '@/lib/supabaseClientManager';
import { useBiometricAuth } from '@/composables/useBiometricAuth';
import BiometricAuthView from '@/components/auth/BiometricAuthView.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
// Import BiometricSetup if we decide to show it directly from this view
// import BiometricSetup from '@/components/auth/BiometricSetup.vue';

const router = useRouter();

// Use centralized Supabase client
const supabase = supabaseClientManager.getClientSync();

// Component state
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const isLoading = ref(false);
const error = ref('');
const successMessage = ref('');

// Biometric related state
const {
  isBiometricAvailable,
  isBiometricEnabled,
  checkBiometricAvailability,
  isLoading: biometricLoadingHook, // aliasing to avoid conflict with local isLoading
} = useBiometricAuth();
const showBiometricView = ref(true); // Attempt biometrics first
const biometricCheckComplete = ref(false);
// const showBiometricSetupModal = ref(false); // For prompting setup later

// Modal states
const showSignUp = ref(false);
const showForgotPassword = ref(false);

// Sign up form data
const signUpData = ref({
  fullName: '',
  email: '',
  password: '',
  role: '',
});

// Reset password email
const resetEmail = ref('');

// Emit events
const emit = defineEmits(['signInSuccess', 'authStateChanged']);

// Check if user is already signed in & biometric status
onMounted(async () => {
  isLoading.value = true; // General loading for the view
  try {
    const {
      data: { session: existingSupabaseSession },
    } = await supabase.auth.getSession();
    if (existingSupabaseSession) {
      // User is already signed in, redirect to home
      // This might need adjustment if biometric check should happen even for existing sessions
      // For now, if Supabase says signed in, we redirect.
      router.push('/');
      isLoading.value = false;
      biometricCheckComplete.value = true; // Mark as complete to avoid showing loading indefinitely
      return;
    }

    // If no existing Supabase session, check biometrics
    await checkBiometricAvailability();
    if (isBiometricAvailable.value && isBiometricEnabled.value) {
      showBiometricView.value = true; // Attempt biometric login
    } else {
      showBiometricView.value = false; // Fallback to password
    }
  } catch (err) {
    console.error('Error during initial auth checks:', err);
    error.value = 'Could not initialize authentication. Please try refreshing.';
    showBiometricView.value = false; // Fallback to password on error
  } finally {
    biometricCheckComplete.value = true;
    isLoading.value = false; // General loading for the view
  }
});

const handleFallbackToPassword = () => {
  showBiometricView.value = false;
  // Clear any biometric specific errors if needed
  error.value = ''; // Clear general error
};

const handleBiometricLoginSuccess = (authResult) => {
  successMessage.value = 'Biometric sign in successful! Redirecting...';
  emit('signInSuccess', {
    user: authResult.user,
    session: authResult.session,
    method: 'biometric',
  });
  emit('authStateChanged', {
    state: 'authenticated',
    method: 'biometric',
  });
  setTimeout(() => {
    router.push('/');
  }, 1000);
};

const promptBiometricSetup = (credentials) => {
  // This is where you'd trigger the BiometricSetup.vue component/modal
  // For now, let's log it. Implementation of this modal will be a subsequent step.
  console.log('Prompting user to set up biometrics.', credentials);
  // showBiometricSetupModal.value = true;
  // Potentially, after password login, if biometrics are available but not enabled,
  // this function could be called.
  // For now, the main flow is: BiometricAuthView -> Password if fail/not set up.
  // Setup prompt after password login is a UX enhancement.
};

// Clear messages
const clearMessages = () => {
  error.value = '';
  successMessage.value = '';
};

// Handle sign in
const handleSignIn = async () => {
  try {
    isLoading.value = true;
    clearMessages();

    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email: email.value,
        password: password.value,
      }
    );

    if (signInError) {
      throw signInError;
    }

    if (data.user && data.session) {
      successMessage.value = 'Sign in successful! Redirecting...';

      emit('signInSuccess', {
        user: data.user,
        session: data.session,
        method: 'email',
      });
      emit('authStateChanged', {
        state: 'authenticated',
        method: 'email',
      });

      // Check if biometrics can be set up
      // This check should ideally use fresh data from useBiometricAuth
      await checkBiometricAvailability(); // Re-check or ensure hook state is current
      if (isBiometricAvailable.value && !isBiometricEnabled.value) {
        // Here you would typically show a modal or navigate to BiometricSetup.vue
        // For this iteration, we'll log and then redirect.
        console.log(
          'Biometrics available but not enabled. Prompting for setup is the next step.'
        );
        // promptBiometricSetup({ session: data.session, user: data.user });
        // For now, just redirect. The setup prompt can be a separate task.
        setTimeout(() => {
          router.push('/'); // Or to a setup page: router.push('/setup-biometrics');
        }, 1000);
      } else {
        setTimeout(() => {
          router.push('/');
        }, 1000);
      }
    }
  } catch (err) {
    console.error('Sign in error:', err);
    error.value =
      err.message || 'Failed to sign in. Please check your credentials.';

    emit('authStateChanged', {
      state: 'failed',
      method: 'email',
      error: err.message,
    });
  } finally {
    isLoading.value = false;
  }
};

// Handle sign up
const handleSignUp = async () => {
  try {
    isLoading.value = true;
    clearMessages();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: signUpData.value.email,
      password: signUpData.value.password,
      options: {
        data: {
          full_name: signUpData.value.fullName,
          role: signUpData.value.role,
        },
      },
    });

    if (signUpError) {
      throw signUpError;
    }

    if (data.user) {
      successMessage.value =
        'Account created successfully! Please check your email to verify your account.';
      showSignUp.value = false;

      // Reset form
      signUpData.value = {
        fullName: '',
        email: '',
        password: '',
        role: '',
      };

      emit('authStateChanged', {
        state: 'signup_success',
        method: 'email',
      });
    }
  } catch (err) {
    console.error('Sign up error:', err);
    error.value = err.message || 'Failed to create account. Please try again.';

    emit('authStateChanged', {
      state: 'signup_failed',
      method: 'email',
      error: err.message,
    });
  } finally {
    isLoading.value = false;
  }
};

// Handle forgot password
const handleForgotPassword = async () => {
  try {
    isLoading.value = true;
    clearMessages();

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      resetEmail.value,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    if (resetError) {
      throw resetError;
    }

    successMessage.value = 'Password reset link sent! Please check your email.';
    showForgotPassword.value = false;
    resetEmail.value = '';

    emit('authStateChanged', {
      state: 'password_reset_sent',
      method: 'email',
    });
  } catch (err) {
    console.error('Password reset error:', err);
    error.value =
      err.message || 'Failed to send password reset email. Please try again.';

    emit('authStateChanged', {
      state: 'password_reset_failed',
      method: 'email',
      error: err.message,
    });
  } finally {
    isLoading.value = false;
  }
};

// Handle Google Sign In
const handleGoogleSignIn = async () => {
  try {
    isLoading.value = true;
    clearMessages();

    const { data, error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (googleError) {
      throw googleError;
    }

    // The redirect will happen automatically
    // No need to handle success here as the user will be redirected
    emit('authStateChanged', {
      state: 'oauth_redirect',
      method: 'google',
    });
  } catch (err) {
    console.error('Google sign in error:', err);
    error.value =
      err.message || 'Failed to sign in with Google. Please try again.';

    emit('authStateChanged', {
      state: 'oauth_failed',
      method: 'google',
      error: err.message,
    });
  } finally {
    isLoading.value = false;
  }
};

// Handle guest access
const handleGuestAccess = async () => {
  try {
    isLoading.value = true;
    clearMessages();

    emit('authStateChanged', { state: 'guest_access' });

    // For now, just redirect to home with guest mode
    setTimeout(() => {
      router.push('/?mode=guest');
    }, 1000);
  } catch (err) {
    console.error('Error setting up guest access:', err);
    error.value = 'Failed to set up guest access';
  } finally {
    isLoading.value = false;
  }
};

// Expose methods for parent components
defineExpose({
  handleSignIn,
  handleSignUp,
  resetToInitialState: () => {
    clearMessages();
    isLoading.value = false;
    showSignUp.value = false;
    showForgotPassword.value = false;
  },
});
</script>
