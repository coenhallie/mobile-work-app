<script setup>
import { ref, watch, computed, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// Use our centralized Supabase auth composable
import { useSupabaseAuth } from '@/composables/useSupabaseAuth';
import { useBiometricAuth } from '@/composables/useBiometricAuth'; // Added
import { useStatusBar } from '@/composables/useStatusBar';
import { useTheme } from '@/composables/useTheme';
import HomeView from '@/views/HomeView.vue';
import MobileBottomNavigation from '@/components/navigation/MobileBottomNavigation.vue';
import BiometricModal from '@/components/auth/BiometricModal.vue'; // Added

// Transition state management
const transitionName = ref('slide-left');
const isTransitioning = ref(false);

// Lazy load non-critical imports
let chatStore = null;
let useFCM = null;
let hapticFeedback = null;

// Load stores and composables lazily
const loadChatStore = async () => {
  if (!chatStore) {
    const { useChatStore } = await import('@/stores/chat');
    chatStore = useChatStore();
  }
  return chatStore;
};

const loadFCM = async () => {
  if (!useFCM) {
    const fcmModule = await import('@/composables/useFCM');
    useFCM = fcmModule.useFCM;
  }
  return useFCM;
};

const loadHaptics = async () => {
  if (!hapticFeedback) {
    hapticFeedback = await import('@tauri-apps/plugin-haptics');
  }
  return hapticFeedback;
};

// Get auth state from our Supabase composable
const auth = useSupabaseAuth();
const {
  isLoaded: supabaseAuthIsLoaded,
  isSignedIn,
  user,
  signOut: supabaseSignOut,
} = auth; // Renamed isLoaded for clarity

const biometricAuth = useBiometricAuth(); // Added
const {
  isBiometricAvailable,
  isBiometricEnabled,
  checkBiometricAvailability,
  isLoading: biometricIsLoading,
  error: biometricError,
} = biometricAuth;

const showBiometricLoginPrompt = ref(false); // Added
const isInitialAuthCheckDone = ref(false); // Added

// Theme variables are now available from useTheme()
const { isDark } = useTheme();

// Initialize status bar composable
const statusBar = useStatusBar();
const {
  initializeStatusBar,
  setLightTheme,
  setDarkTheme,
  setTransparent,
  setStyle,
} = statusBar;

// Create userId computed for compatibility
const userId = computed(() => user.value?.id || null);
const route = useRoute();
const router = useRouter();

// Route hierarchy for direction detection
const routeHierarchy = {
  Home: 0,
  ServiceCategories: 1,
  PostJob: 2,
  EditJob: 2,
  FindContractor: 1,
  JobDetails: 2,
  ContractorProfile: 2,
  UserProfile: 1,
  CompleteProfile: 1,
  Messages: 1,
  Conversation: 2,
  Login: 0,
  AuthCallback: 0,
  PasswordReset: 0,
};

// Tab navigation routes (should use fade transition)
const tabRoutes = ['Home', 'ServiceCategories', 'Messages', 'UserProfile'];

// Determine transition direction based on route hierarchy
const getTransitionName = (to, from) => {
  // Handle initial navigation or missing routes
  if (!from.name || !to.name) {
    return 'fade';
  }

  // Tab navigation should fade
  if (tabRoutes.includes(to.name) && tabRoutes.includes(from.name)) {
    return 'fade';
  }

  // Get hierarchy levels
  const fromLevel = routeHierarchy[from.name] ?? 1;
  const toLevel = routeHierarchy[to.name] ?? 1;

  // Forward navigation (slide left)
  if (toLevel > fromLevel) {
    return 'slide-left';
  }
  // Back navigation (slide right)
  else if (toLevel < fromLevel) {
    return 'slide-right';
  }
  // Same level (fade)
  else {
    return 'fade';
  }
};

// Initialize chat store lazily
let chatStoreInstance = null;
const getChatStore = async () => {
  if (!chatStoreInstance) {
    chatStoreInstance = await loadChatStore();
  }
  return chatStoreInstance;
};

// Development mode flag
const isDevelopment = import.meta.env.DEV;

// Fixed page transition logging to show correct route information
const logTransition = (hook) => {
  if (isDevelopment) {
    // Use router.currentRoute to get the actual current route during transitions
  }
};

// Handle navigation transitions and special cases
router.beforeEach((to, from) => {
  // Set transition name based on navigation direction
  transitionName.value = getTransitionName(to, from);
  isTransitioning.value = true;
});

router.afterEach((to, from) => {
  // Handle special navigation case
  if (from.name === 'FindContractor') {
    nextTick(() => {
      window.dispatchEvent(
        new CustomEvent('app:navigation-complete', {
          detail: { from: from.name, to: to.name },
        })
      );
    });
  }

  // Reset transition state after navigation completes
  nextTick(() => {
    isTransitioning.value = false;
  });
});

// showMinimalSetup ref removed as MinimalSetup component is no longer used
const showMobileNav = computed(() => {
  // Hide navigation on welcome screen for full immersive experience
  return route.name !== 'Welcome';
});
const appRole = ref('default'); // Store the app role from Tauri
const appTheme = ref(''); // CSS class for app theme based on role

// Set app role based on window title
onMounted(async () => {
  // Initial Auth Check Logic
  watch(
    supabaseAuthIsLoaded,
    async (loaded) => {
      if (loaded) {
        if (isSignedIn.value) {
          console.log(
            '[App.vue] User has existing Supabase session. Checking biometrics...'
          );
          await checkBiometricAvailability();
          if (isBiometricAvailable.value && isBiometricEnabled.value) {
            console.log(
              '[App.vue] Biometrics available and enabled. Prompting for biometric login.'
            );
            showBiometricLoginPrompt.value = true;
            // isInitialAuthCheckDone will be set by modal handlers
          } else {
            console.log(
              '[App.vue] Biometrics not available/enabled, or check failed. Proceeding with existing session.'
            );
            if (biometricError.value)
              console.error(
                '[App.vue] Biometric check error:',
                biometricError.value
              );
            isInitialAuthCheckDone.value = true; // Allow app to render
          }
        } else {
          console.log(
            '[App.vue] No existing Supabase session. Proceeding to login or public routes.'
          );
          isInitialAuthCheckDone.value = true; // Allow app to render (router will handle redirect to /login if needed)
          // No need to explicitly redirect here, router guards should handle it.
        }
      }
    },
    { immediate: true }
  );

  // Check window title to determine role
  const windowTitle = document.title;

  if (windowTitle.includes('Contractor')) {
    appRole.value = 'contractor';
    appTheme.value = 'contractor-theme';
    document.documentElement.classList.add('contractor-theme');
  } else if (windowTitle.includes('Client')) {
    appRole.value = 'client';
    appTheme.value = 'client-theme';
    document.documentElement.classList.add('client-theme');
  } else {
    appRole.value = 'default';
  }

  // Initialize status bar with app theme
  const initializeStatusBarWithTheme = async () => {
    try {
      // Determine status bar configuration based on app role/theme
      let statusBarConfig = {
        style: 'dark', // Dark content on light background (default)
        backgroundColor: '#ffffff',
        overlay: false,
      };

      if (appRole.value === 'contractor') {
        statusBarConfig = {
          style: 'light', // Light content on dark background
          backgroundColor: '#3b82f6', // blue-500
          overlay: false,
        };
      } else if (appRole.value === 'client') {
        statusBarConfig = {
          style: 'light', // Light content on dark background
          backgroundColor: '#10b981', // green-500
          overlay: false,
        };
      }

      await initializeStatusBar(statusBarConfig);
    } catch (error) {
      console.error('Failed to initialize status bar:', error);
    }
  };

  // Initialize status bar immediately
  await initializeStatusBarWithTheme();

  // Initialize FCM Push Notifications lazily
  const initializeFCMWhenReady = async () => {
    try {
      const fcmComposable = await loadFCM();
      const { initialize: initializeFCM } = fcmComposable();

      // Initialize FCM when user is authenticated
      watch(
        [isSignedIn, userId],
        async ([signedIn, currentUserId]) => {
          if (signedIn && currentUserId) {
            try {
              await initializeFCM({
                projectId:
                  import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mobile-work-app',
                autoRequestPermission: true,
              });
            } catch (error) {
              console.error('Failed to initialize FCM:', error);
            }
          }
        },
        { immediate: true }
      );
    } catch (error) {
      console.error('Failed to load FCM:', error);
    }
  };

  // Initialize FCM in background after a short delay
  setTimeout(initializeFCMWhenReady, 1000);
});

// Efficient user role computation
const userRole = computed(() => {
  // Test mode override
  if (appRole.value && appRole.value !== 'default') {
    return appRole.value;
  }

  // Get role from user metadata
  return (isSignedIn.value && user.value?.user_metadata?.role) || null;
});

// MinimalSetup component logic removed as it's been replaced by CompleteProfileView

// Reset chat store on user change
watch(
  userId,
  async (newUserId) => {
    const store = await getChatStore();
    store.reset();
  },
  { immediate: false }
);

// Update status bar when app role changes
watch(
  appRole,
  async (newRole) => {
    // Skip if we're on welcome screen (handled by route watcher)
    if (route.name === 'Welcome') return;

    try {
      let newColor = '#ffffff'; // Default color
      if (newRole === 'contractor') {
        newColor = '#3b82f6'; // blue-500 for contractor
      } else if (newRole === 'client') {
        newColor = '#10b981'; // green-500 for client
      }
      await statusBar.setColor(newColor);
    } catch (error) {
      console.error('Failed to update status bar theme:', error);
    }
  },
  { immediate: false } // Initial set is handled by onMounted
);

// Update status bar when route changes (for welcome screen transparency)
watch(
  () => route.name,
  async (newRouteName) => {
    try {
      if (newRouteName === 'Welcome') {
        // Make status bar transparent for immersive welcome experience
        await setTransparent();
        await setStyle('light'); // Light content for dark overlay
      } else {
        // Restore normal status bar for other routes
        let newColor = '#ffffff'; // Default color
        if (appRole.value === 'contractor') {
          newColor = '#3b82f6'; // blue-500 for contractor
        } else if (appRole.value === 'client') {
          newColor = '#10b981'; // green-500 for client
        }
        await statusBar.setColor(newColor);
        await setStyle('default');
      }
    } catch (error) {
      console.error('Failed to update status bar for route:', error);
    }
  },
  { immediate: true } // Apply immediately on mount
);

// Handle navigation with haptic feedback
const handleNavigation = async (path) => {
  try {
    // Haptic feedback is handled by MobileBottomNavigation component
    // This function is kept for potential future navigation handling
    console.log('Navigation handled:', path);
  } catch (error) {
    console.error('Navigation error:', error);
  }
};

// Added: Handlers for the app-load biometric modal
const handleAppLoadBiometricSuccess = (authResult) => {
  console.log('[App.vue] App load biometric success:', authResult);
  showBiometricLoginPrompt.value = false;
  isInitialAuthCheckDone.value = true; // Allow app to render
  // Supabase session should be set by useBiometricAuth. Refresh if needed.
  // router.push('/'); // Or let existing logic handle redirection
};

const handleAppLoadBiometricFailure = async (failureData) => {
  console.warn('[App.vue] App load biometric failure/fallback:', failureData);
  showBiometricLoginPrompt.value = false;
  await supabaseSignOut(); // Sign out from Supabase to ensure clean state
  isInitialAuthCheckDone.value = true; // Allow app to render (will redirect to login)
  if (router.currentRoute.value.path !== '/login') {
    router.push('/login');
  }
};

const handleAppLoadBiometricFallback = async () => {
  // Also used for @close
  console.log('[App.vue] App load biometric fallback/closed.');
  showBiometricLoginPrompt.value = false;
  await supabaseSignOut();
  isInitialAuthCheckDone.value = true;
  if (router.currentRoute.value.path !== '/login') {
    router.push('/login');
  }
};
</script>

<template>
  <!-- Clean Minimalist Loading Screen -->
  <div
    v-if="!isInitialAuthCheckDone && !showBiometricLoginPrompt"
    class="fixed inset-0 flex flex-col items-center justify-center z-[9999] bg-white dark:bg-gray-900"
    :class="isDark ? 'dark' : ''"
  >
    <div
      class="w-8 h-8 border-2 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-white rounded-full animate-spin mb-4"
    ></div>
    <p class="text-sm text-gray-600 dark:text-gray-400 font-medium">
      {{ $t('common.loading') }}
    </p>
  </div>

  <!-- Biometric Login Prompt on App Load -->
  <BiometricModal
    :is-open="showBiometricLoginPrompt"
    :auto-mode="true"
    @authSuccess="handleAppLoadBiometricSuccess"
    @authFailed="handleAppLoadBiometricFailure"
    @fallbackRequested="handleAppLoadBiometricFallback"
    @close="handleAppLoadBiometricFallback"
  />

  <!-- Enhanced Main App Content -->
  <div
    v-if="isInitialAuthCheckDone && !showBiometricLoginPrompt"
    class="flex flex-col min-h-screen bg-white dark:bg-gray-900"
    :class="[appTheme, isDark ? 'dark' : '']"
  >
    <!-- Role Indicator Banner -->
    <div
      v-if="appRole !== 'default' && route.name !== 'Welcome'"
      class="role-indicator py-1 text-center text-sm text-white font-medium"
      :class="{
        'bg-blue-600': appRole === 'contractor',
        'bg-green-600': appRole === 'client',
      }"
    >
      {{ appRole === 'contractor' ? 'CONTRACTOR MODE' : 'CLIENT MODE' }}
    </div>

    <!-- Main Content Area -->
    <main
      :class="[
        'flex-grow relative',
        route.name === 'Welcome'
          ? ''
          : 'container mx-auto p-4 pb-20 md:pb-4 bg-white dark:bg-gray-900',
        { 'overflow-hidden': isTransitioning },
        isDark ? 'dark' : '',
      ]"
    >
      <!-- Page transition wrapper with horizontal sliding animations -->
      <div class="transition-container">
        <router-view v-slot="{ Component, route: slotRoute }">
          <transition
            :name="transitionName"
            mode="default"
            @before-enter="isTransitioning = true"
            @after-enter="isTransitioning = false"
            @before-leave="isTransitioning = true"
            @after-leave="isTransitioning = false"
          >
            <div class="page-wrapper" :key="slotRoute.fullPath">
              <keep-alive
                :max="10"
                v-if="slotRoute.meta.keepAlive && Component"
              >
                <component :is="Component" />
              </keep-alive>
              <component :is="Component" v-else-if="Component" />
            </div>
          </transition>
        </router-view>
      </div>
    </main>

    <!-- Footer (Optional Placeholder) -->
    <footer
      v-if="route.name !== 'Welcome'"
      class="p-2 text-center text-sm hidden md:block"
      :class="
        isDark
          ? 'dark bg-muted text-muted-foreground'
          : 'bg-muted text-muted-foreground'
      "
    >
      © 2025 HandyApp
      {{ appRole !== 'default' ? `- ${appRole.toUpperCase()} MODE` : '' }}
    </footer>

    <!-- Mobile Bottom Navigation -->
    <MobileBottomNavigation
      :is-signed-in="isSignedIn"
      :user-role="userRole"
      :show-mobile-nav="showMobileNav"
      @navigate="handleNavigation"
    />
  </div>
</template>

<style scoped>
/* Container positioning for smooth transitions */
main {
  position: relative;
  min-height: 60vh;
}

/* Transition container */
.transition-container {
  position: relative;
  width: 100%;
  height: 100%;
}

/* Page wrapper for consistent sizing */
.page-wrapper {
  width: 100%;
  min-height: inherit;
}

/* Base transition styles */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.16s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  will-change: transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

/* Forward navigation (slide left) */
.slide-left-enter-from {
  transform: translate3d(100%, 0, 0);
}
.slide-left-leave-to {
  transform: translate3d(-100%, 0, 0);
}

/* Back navigation (slide right) */
.slide-right-enter-from {
  transform: translate3d(-100%, 0, 0);
}
.slide-right-leave-to {
  transform: translate3d(100%, 0, 0);
}

/* Fade transition for tab navigation */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.12s ease-out;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Ensure content doesn't shift during transitions */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active,
.fade-enter-active,
.fade-leave-active {
  overflow-x: hidden;
  overflow-y: auto;
}

/* Mobile optimizations for better performance */
@media (max-width: 768px) {
  .slide-left-enter-active,
  .slide-left-leave-active,
  .slide-right-enter-active,
  .slide-right-leave-active {
    transition: transform 0.14s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Prevent content scaling issues on mobile */
  .slide-left-enter-active *,
  .slide-left-leave-active *,
  .slide-right-enter-active *,
  .slide-right-leave-active * {
    transform: translateZ(0);
  }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .slide-left-enter-active,
  .slide-left-leave-active,
  .slide-right-enter-active,
  .slide-right-leave-active {
    transition: opacity 0.12s ease-out !important;
    transform: none !important;
  }

  .slide-left-enter-from,
  .slide-left-leave-to,
  .slide-right-enter-from,
  .slide-right-leave-to {
    opacity: 0 !important;
    transform: none !important;
  }
}

/* Role indicator styles */
.role-indicator {
  position: sticky;
  top: 0;
  z-index: 50;
}
</style>

<style>
/* Global styles for role-based themes */
:root.contractor-theme {
  --theme-primary: #3b82f6; /* blue-500 */
  --theme-accent: #1d4ed8; /* blue-700 */
  --theme-border: #93c5fd; /* blue-300 */
}

:root.client-theme {
  --theme-primary: #10b981; /* green-500 */
  --theme-accent: #047857; /* green-700 */
  --theme-border: #6ee7b7; /* green-300 */
}

/* Apply theme colors to UI elements */
:root.contractor-theme .text-primary,
:root.contractor-theme .bg-primary {
  color: var(--theme-primary) !important;
}

:root.client-theme .text-primary,
:root.client-theme .bg-primary {
  color: var(--theme-primary) !important;
}

/* Border colors for themed elements */
:root.contractor-theme .border-primary {
  border-color: var(--theme-border) !important;
}

:root.client-theme .border-primary {
  border-color: var(--theme-border) !important;
}
</style>
