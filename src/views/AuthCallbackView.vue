<template>
  <div class="min-h-screen bg-background flex items-center justify-center">
    <div class="max-w-md w-full mx-auto p-6">
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center"
      >
        <!-- Loading State -->
        <div v-if="isProcessing" class="space-y-4">
          <div
            class="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto"
          >
            <div
              class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"
            ></div>
          </div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Completing Sign In...
          </h2>
          <p class="text-gray-600 dark:text-gray-300">
            Please wait while we finish setting up your account.
          </p>
        </div>

        <!-- Success State -->
        <div v-else-if="isSuccess" class="space-y-4">
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
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Welcome!
          </h2>
          <p class="text-gray-600 dark:text-gray-300">
            You've successfully signed in with Google. Redirecting to your
            dashboard...
          </p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="space-y-4">
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
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Sign In Failed
          </h2>
          <p class="text-gray-600 dark:text-gray-300">
            {{ error }}
          </p>
          <button
            @click="redirectToLogin"
            class="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import supabaseClientManager from '@/lib/supabaseClientManager';

const router = useRouter();

// Use centralized Supabase client
const supabase = supabaseClientManager.getClientSync();

// Component state
const isProcessing = ref(true);
const isSuccess = ref(false);
const error = ref('');

// Handle OAuth callback
const handleAuthCallback = async () => {
  try {
    // Check if this is a password reset flow
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');

    // If this is a password reset, redirect to the password reset page
    if (type === 'recovery') {
      console.log(
        'Password reset flow detected, redirecting to password reset page'
      );
      router.push('/auth/reset-password' + window.location.hash);
      return;
    }

    // Check for auth errors in URL
    const errorParam = hashParams.get('error');
    if (errorParam) {
      const errorDescription = hashParams.get('error_description');
      throw new Error(errorDescription || 'Authentication failed');
    }

    // Get the session from the URL hash
    const { data, error: authError } = await supabase.auth.getSession();

    if (authError) {
      throw authError;
    }

    if (data.session) {
      // Successfully authenticated
      isSuccess.value = true;
      isProcessing.value = false;

      // Check if user needs to complete profile setup
      const user = data.session.user;
      const userMetadata = user.user_metadata;

      // If this is a new Google user, we might need to set up their role
      if (!userMetadata.role) {
        // Redirect to a role selection page or complete profile
        setTimeout(() => {
          router.push('/complete-profile?source=google');
        }, 2000);
        return;
      }

      // Redirect to home after successful authentication
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } else {
      // No session found, might be an error
      throw new Error('No authentication session found');
    }
  } catch (err) {
    console.error('Auth callback error:', err);
    error.value = err.message || 'Authentication failed. Please try again.';
    isProcessing.value = false;
  }
};

// Redirect to login page
const redirectToLogin = () => {
  router.push('/login');
};

// Initialize on component mount
onMounted(() => {
  handleAuthCallback();
});
</script>
