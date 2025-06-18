<template>
  <div
    class="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4"
  >
    <div class="w-full max-w-md">
      <!-- Main Login Card -->
      <div
        class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700"
      >
        <!-- Header with Worker Icon -->
        <div class="text-center mb-8">
          <!-- Minimalist Proud Worker Icon -->
          <div
            class="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <svg
              class="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome Back
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Sign in to your account
          </p>
        </div>

        <!-- Authentication Method Tabs -->
        <div class="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            @click="switchAuthMethod('email')"
            :class="[
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200',
              authMethod === 'email'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
            ]"
          >
            Email
          </button>
          <button
            @click="switchAuthMethod('phone')"
            :class="[
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200',
              authMethod === 'phone'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
            ]"
          >
            Phone
          </button>
        </div>

        <!-- Email Login Form -->
        <form
          v-if="authMethod === 'email'"
          @submit.prevent="handleEmailLogin"
          class="space-y-4"
        >
          <div>
            <label
              for="email"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              v-model="emailForm.email"
              type="email"
              required
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter your email"
              :disabled="isLoading"
            />
          </div>

          <div>
            <label
              for="password"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Password
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="emailForm.password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your password"
                :disabled="isLoading"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
                :disabled="isLoading"
              >
                <svg
                  v-if="showPassword"
                  class="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                  />
                </svg>
                <svg
                  v-else
                  class="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="isLoading || !emailForm.email || !emailForm.password"
            class="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            <div
              v-if="isLoading"
              class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
            ></div>
            <span>{{ isLoading ? 'Signing In...' : 'Sign In' }}</span>
          </button>
        </form>

        <!-- Phone Login Form -->
        <div v-if="authMethod === 'phone'" class="space-y-4">
          <!-- Phone Number Input -->
          <div v-if="!phoneOtpSent">
            <label
              for="phone"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Phone Number
            </label>
            <div class="flex">
              <select
                v-model="phoneForm.countryCode"
                class="px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                :disabled="isLoading"
              >
                <option value="+51">🇵🇪 +51</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+34">🇪🇸 +34</option>
                <option value="+52">🇲🇽 +52</option>
              </select>
              <input
                id="phone"
                v-model="phoneForm.number"
                type="tel"
                required
                class="flex-1 px-4 py-3 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your phone number"
                :disabled="isLoading"
              />
            </div>
            <button
              @click="sendPhoneOtp"
              :disabled="isLoading || !phoneForm.number"
              class="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              <div
                v-if="isLoading"
                class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
              ></div>
              <span>{{
                isLoading ? 'Sending Code...' : 'Send Verification Code'
              }}</span>
            </button>
          </div>

          <!-- OTP Verification -->
          <div v-else>
            <label
              for="otp"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Verification Code
            </label>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enter the 6-digit code sent to {{ phoneForm.countryCode
              }}{{ phoneForm.number }}
            </p>
            <input
              id="otp"
              v-model="phoneForm.otp"
              type="text"
              maxlength="6"
              required
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-center text-2xl tracking-widest"
              placeholder="000000"
              :disabled="isLoading"
            />
            <div class="flex gap-3 mt-4">
              <button
                @click="verifyPhoneOtp"
                :disabled="isLoading || phoneForm.otp.length !== 6"
                class="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                <div
                  v-if="isLoading"
                  class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                ></div>
                <span>{{ isLoading ? 'Verifying...' : 'Verify' }}</span>
              </button>
              <button
                @click="
                  phoneOtpSent = false;
                  phoneForm.otp = '';
                "
                :disabled="isLoading"
                class="px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        </div>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div
              class="w-full border-t border-gray-200 dark:border-gray-600"
            ></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span
              class="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              >or</span
            >
          </div>
        </div>

        <!-- Google Sign In -->
        <button
          @click="handleGoogleLogin"
          :disabled="isLoading"
          class="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
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
          <span>Continue with Google</span>
        </button>

        <!-- Footer Links -->
        <div class="mt-6 space-y-3 text-center">
          <button
            @click="showSignUp = true"
            class="w-full py-2 px-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-sm font-medium"
            :disabled="isLoading"
          >
            Don't have an account? Sign up
          </button>

          <button
            @click="showForgotPassword = true"
            class="w-full py-2 px-4 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-sm"
            :disabled="isLoading"
          >
            Forgot your password?
          </button>
        </div>

        <!-- Terms -->
        <div class="mt-6 text-center">
          <p class="text-xs text-gray-500 dark:text-gray-400">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>

      <!-- Error Display -->
      <div
        v-if="error"
        class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mt-4"
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
        class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mt-4"
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

    <!-- Forgot Password Modal -->
    <div
      v-if="showForgotPassword"
      class="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center p-4 z-50"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Reset Password
          </h3>
          <button
            @click="showForgotPassword = false"
            class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
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

        <form @submit.prevent="handleForgotPassword" class="space-y-4">
          <div>
            <label
              for="resetEmail"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Email Address</label
            >
            <input
              id="resetEmail"
              v-model="resetEmail"
              type="email"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
              :disabled="isLoading"
            />
          </div>

          <button
            type="submit"
            :disabled="isLoading || !resetEmail"
            class="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div
              v-if="isLoading"
              class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
            ></div>
            <span>{{ isLoading ? 'Sending...' : 'Send Reset Link' }}</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSupabaseAuth } from '@/composables/useSupabaseAuth';

const router = useRouter();
const route = useRoute();
const { signIn, signUp, resetPassword, getSupabaseClient } = useSupabaseAuth();

// Get Supabase client for phone auth
const supabase = getSupabaseClient();

// Component state
const authMethod = ref('email');
const isLoading = ref(false);
const error = ref('');
const successMessage = ref('');
const showPassword = ref(false);
const showSignUp = ref(false);
const showForgotPassword = ref(false);
const phoneOtpSent = ref(false);

// Form data
const emailForm = ref({
  email: '',
  password: '',
});

const phoneForm = ref({
  countryCode: '+51',
  number: '',
  otp: '',
});

const signUpData = ref({
  fullName: '',
  email: '',
  password: '',
  role: '',
});

const resetEmail = ref('');

// Clear messages
const clearMessages = () => {
  error.value = '';
  successMessage.value = '';
};

// Email login
const handleEmailLogin = async () => {
  clearMessages();
  isLoading.value = true;

  try {
    const result = await signIn(
      emailForm.value.email,
      emailForm.value.password
    );

    if (result.success) {
      successMessage.value = 'Successfully signed in!';
      // Redirect will be handled by router guard
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } else {
      error.value = result.error || 'Failed to sign in';
    }
  } catch (err) {
    error.value = 'An unexpected error occurred';
    console.error('Email login error:', err);
  } finally {
    isLoading.value = false;
  }
};

// Phone OTP - Send
const sendPhoneOtp = async () => {
  clearMessages();
  isLoading.value = true;

  try {
    const fullPhoneNumber =
      phoneForm.value.countryCode + phoneForm.value.number;

    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: fullPhoneNumber,
    });

    if (otpError) {
      throw otpError;
    }

    phoneOtpSent.value = true;
    successMessage.value = 'Verification code sent to your phone!';
  } catch (err) {
    error.value = err.message || 'Failed to send verification code';
    console.error('Phone OTP send error:', err);
  } finally {
    isLoading.value = false;
  }
};

// Phone OTP - Verify
const verifyPhoneOtp = async () => {
  clearMessages();
  isLoading.value = true;

  try {
    const fullPhoneNumber =
      phoneForm.value.countryCode + phoneForm.value.number;

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone: fullPhoneNumber,
      token: phoneForm.value.otp,
      type: 'sms',
    });

    if (verifyError) {
      throw verifyError;
    }

    if (data.user) {
      successMessage.value = 'Successfully signed in!';
      setTimeout(() => {
        router.push('/');
      }, 1000);
    }
  } catch (err) {
    error.value = err.message || 'Invalid verification code';
    console.error('Phone OTP verify error:', err);
  } finally {
    isLoading.value = false;
  }
};

// Google login
const handleGoogleLogin = async () => {
  clearMessages();
  isLoading.value = true;

  try {
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (googleError) {
      throw googleError;
    }

    // OAuth redirect will handle the rest
  } catch (err) {
    error.value = err.message || 'Failed to sign in with Google';
    console.error('Google login error:', err);
    isLoading.value = false;
  }
};

// Sign up
const handleSignUp = async () => {
  clearMessages();
  isLoading.value = true;

  try {
    const result = await signUp(
      signUpData.value.email,
      signUpData.value.password,
      {
        fullName: signUpData.value.fullName,
        role: signUpData.value.role,
      }
    );

    if (result.success) {
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
    } else {
      error.value = result.error || 'Failed to create account';
    }
  } catch (err) {
    error.value = 'An unexpected error occurred';
    console.error('Sign up error:', err);
  } finally {
    isLoading.value = false;
  }
};

// Forgot password
const handleForgotPassword = async () => {
  clearMessages();
  isLoading.value = true;

  try {
    const result = await resetPassword(resetEmail.value);

    if (result.success) {
      successMessage.value = 'Password reset link sent to your email!';
      showForgotPassword.value = false;
      resetEmail.value = '';
    } else {
      error.value = result.error || 'Failed to send reset email';
    }
  } catch (err) {
    error.value = 'An unexpected error occurred';
    console.error('Forgot password error:', err);
  } finally {
    isLoading.value = false;
  }
};

// Watch for auth method changes to clear forms
const resetForms = () => {
  emailForm.value = { email: '', password: '' };
  phoneForm.value = { countryCode: '+51', number: '', otp: '' };
  phoneOtpSent.value = false;
  clearMessages();
};

// Reset forms when switching auth methods
const switchAuthMethod = (method) => {
  authMethod.value = method;
  resetForms();
};

onMounted(() => {
  clearMessages();
});
</script>
