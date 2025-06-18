<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// Props to control visibility
const props = defineProps({
  show: {
    type: Boolean,
    default: true,
  },
  minDisplayTime: {
    type: Number,
    default: 1500, // Minimum time to show splash screen in ms
  },
});

// Emit events when animation completes
const emit = defineEmits(['complete']);

// Animation state
const fadeOut = ref(false);
const isMounted = ref(false);

// Timer references for cleanup
let fadeOutTimer = null;
let minTimeTimer = null;
let failsafeTimer = null;
let appReadyListener = null;

// Function to start fade out animation
const startFadeOut = () => {
  if (!isMounted.value) return;

  fadeOut.value = true;

  // Clear any existing fade out timer
  if (fadeOutTimer) {
    clearTimeout(fadeOutTimer);
  }

  // Emit complete event after animation finishes
  fadeOutTimer = setTimeout(() => {
    if (isMounted.value) {
      emit('complete');
    }
    fadeOutTimer = null;
  }, 500); // Match the CSS transition duration
};

// Track app initialization
onMounted(() => {
  isMounted.value = true;

  // Start a timer for minimum display time
  minTimeTimer = setTimeout(() => {
    if (!isMounted.value) return;

    // If app is already loaded, fade out immediately
    if (window.__APP_READY__) {
      startFadeOut();
    } else {
      // Otherwise, set up a listener for when app becomes ready
      appReadyListener = () => {
        if (isMounted.value) {
          startFadeOut();
        }
      };
      window.addEventListener('app:ready', appReadyListener, { once: true });
    }
    minTimeTimer = null;
  }, props.minDisplayTime);

  // Failsafe - ensure splash screen doesn't stay forever
  failsafeTimer = setTimeout(() => {
    if (!isMounted.value) return;

    if (!fadeOut.value) {
      console.log('Splash screen failsafe triggered');
      startFadeOut();
    }
    failsafeTimer = null;
  }, 5000);
});

// Clean up timers and listeners when component unmounts
onUnmounted(() => {
  isMounted.value = false;

  // Clear all timers
  if (fadeOutTimer) {
    clearTimeout(fadeOutTimer);
    fadeOutTimer = null;
  }
  if (minTimeTimer) {
    clearTimeout(minTimeTimer);
    minTimeTimer = null;
  }
  if (failsafeTimer) {
    clearTimeout(failsafeTimer);
    failsafeTimer = null;
  }

  // Remove event listener
  if (appReadyListener) {
    window.removeEventListener('app:ready', appReadyListener);
    appReadyListener = null;
  }
});
</script>

<template>
  <div v-if="show" class="splash-screen" :class="{ 'fade-out': fadeOut }">
    <div class="splash-content">
      <img src="/tauri.svg" alt="App Logo" class="logo" />
      <div class="loading-indicator">
        <div class="loading-bar"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.splash-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #2c2c2c;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  transition: opacity 0.5s ease-out;
}

.fade-out {
  opacity: 0;
}

.splash-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.logo {
  width: 150px;
  height: 150px;
  animation: pulse 2s infinite;
}

.loading-indicator {
  width: 200px;
  height: 4px;
  background-color: var(--muted);
  border-radius: 2px;
  overflow: hidden;
}

.loading-bar {
  height: 100%;
  width: 30%;
  background-color: #fff;
  border-radius: 2px;
  animation: loading 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
    transform: scale(0.98);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0.6;
    transform: scale(0.98);
  }
}

@keyframes loading {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(400%);
  }
}
</style>
