<template>
  <div class="welcome-container">
    <!-- Random Background Image -->
    <div
      class="background-image"
      :style="{
        backgroundImage: `url(/images/${selectedBackground})`,
      }"
    ></div>

    <!-- Dark overlay for better text readability -->
    <div class="overlay"></div>

    <!-- Content Container -->
    <div class="content-container">
      <!-- Tagline Section - Positioned at Top -->
      <div class="tagline-section">
        <h1 class="tagline-text">
          {{ $t('welcome.tagline') }}
        </h1>
      </div>

      <!-- Action Buttons Section - Positioned at Bottom -->
      <div class="buttons-section">
        <!-- Continue with Apple -->
        <button
          @click="signInWithApple"
          :disabled="isLoading"
          class="w-full bg-white/95 backdrop-blur-sm text-black py-4 px-6 rounded-2xl font-semibold text-lg flex items-center justify-center space-x-3 shadow-lg hover:bg-white transition-all duration-200 active:scale-95"
        >
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
            />
          </svg>
          <span>{{ $t('auth.continueWithApple') }}</span>
        </button>

        <!-- Continue with Google -->
        <button
          @click="signInWithGoogle"
          :disabled="isLoading"
          class="w-full bg-white/95 backdrop-blur-sm text-black py-4 px-6 rounded-2xl font-semibold text-lg flex items-center justify-center space-x-3 shadow-lg hover:bg-white transition-all duration-200 active:scale-95"
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
          <span>{{ $t('auth.continueWithGoogle') }}</span>
        </button>

        <!-- Continue with Email -->
        <button
          @click="continueWithEmail"
          class="w-full bg-white/20 backdrop-blur-sm text-white py-4 px-6 rounded-2xl font-semibold text-lg flex items-center justify-center space-x-3 border border-white/30 hover:bg-white/30 transition-all duration-200 active:scale-95"
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
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <span>{{ $t('auth.continueWithEmail') }}</span>
        </button>

        <!-- Terms and Privacy -->
        <div class="text-center pt-4">
          <p class="text-white/80 text-sm drop-shadow-sm">
            {{ $t('auth.byContinuingAgree') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div
      v-if="isLoading"
      class="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div
        class="bg-white rounded-2xl p-6 flex flex-col items-center space-y-4"
      >
        <div
          class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"
        ></div>
        <p class="text-gray-700 font-medium">{{ $t('auth.signingIn') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSupabaseAuth } from '@/composables/useSupabaseAuth';

const router = useRouter();
const { signInWithOAuth } = useSupabaseAuth();

const isLoading = ref(false);

// Random background selection
const welcomeBackgrounds = ['welcome-1.png', 'welcome-2.png', 'welcome-3.png'];
const selectedBackground = ref('');

// Select random background on component mount
onMounted(() => {
  const randomIndex = Math.floor(Math.random() * welcomeBackgrounds.length);
  selectedBackground.value = welcomeBackgrounds[randomIndex];
  console.log(`Selected welcome background: ${selectedBackground.value}`);
});

const signInWithApple = async () => {
  isLoading.value = true;
  try {
    await signInWithOAuth('apple');
  } catch (error) {
    console.error('Apple sign-in error:', error);
  } finally {
    isLoading.value = false;
  }
};

const signInWithGoogle = async () => {
  isLoading.value = true;
  try {
    await signInWithOAuth('google');
  } catch (error) {
    console.error('Google sign-in error:', error);
  } finally {
    isLoading.value = false;
  }
};

const continueWithEmail = () => {
  router.push('/login');
};
</script>

<style scoped>
/* Main container - fixed to viewport */
.welcome-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Background image */
.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  animation: subtle-zoom 20s ease-in-out infinite;
}

/* Dark overlay */
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
}

/* Content container */
.content-container {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 85vh;
  width: 100vw;
}

/* Tagline section */
.tagline-section {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 5rem 1.5rem 0 1.5rem;
}

/* Tagline text */
.tagline-text {
  font-size: 1.875rem;
  font-weight: 400;
  color: white;
  text-align: left;
  text-shadow: 0 4px 6px rgba(0, 0, 0, 0.5);
  line-height: 1.2;
  width: 100%;
}

/* Buttons section */
.buttons-section {
  padding: 0 1.5rem 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Add subtle animation to the background */
@keyframes subtle-zoom {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* Ensure buttons are easily reachable on small screens */
@media (max-height: 700px) {
  .tagline-section {
    padding-top: 3rem;
  }
  .buttons-section {
    padding-bottom: 1.5rem;
  }
}
</style>
