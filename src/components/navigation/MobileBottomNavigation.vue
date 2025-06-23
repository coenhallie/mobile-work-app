<script setup>
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useChatStore } from '@/stores/chat';
import { useHaptics } from '@/composables/useHaptics';
import { useI18n } from '@/composables/useI18n';

// Props
const props = defineProps({
  isSignedIn: {
    type: Boolean,
    required: true,
  },
  userRole: {
    type: String,
    default: null,
  },
  showMobileNav: {
    type: Boolean,
    default: true,
  },
});

// Emits
const emit = defineEmits(['navigate']);

const route = useRoute();
const router = useRouter();
const chatStore = useChatStore();
const { t } = useI18n();

// Initialize haptics for navigation feedback
const { triggerSelection } = useHaptics();

// Load chat rooms when user signs in
watch(
  () => props.isSignedIn,
  async (newValue) => {
    if (newValue) {
      try {
        await chatStore.fetchChatRooms(true); // Force refresh
      } catch (error) {
        console.error(
          '[MobileBottomNavigation] Error loading chat rooms:',
          error
        );
      }
    }
  }
);

// Check for unread messages using proper unread tracking
const hasUnreadMessages = computed(() => {
  if (!props.isSignedIn) return false;
  return chatStore.hasUnreadMessages;
});

// Get total unread count for display
const totalUnreadCount = computed(() => {
  if (!props.isSignedIn) return 0;
  return chatStore.totalUnreadCount;
});

// Navigation items with minimal recalculation
const navItems = computed(() => {
  const items = [{ name: t('navigation.home'), path: '/', icon: 'home' }];

  if (props.isSignedIn) {
    // Role-specific navigation
    if (props.userRole === 'client' || props.userRole === 'admin') {
      items.push(
        { name: t('navigation.services'), path: '/services', icon: 'services' },
        {
          name: t('navigation.professionals'),
          path: '/find-contractor',
          icon: 'search',
        }
      );
    }

    // Common items for authenticated users
    items.push(
      { name: t('navigation.messages'), path: '/messages', icon: 'messages' },
      { name: t('navigation.profile'), path: '/user-profile', icon: 'profile' }
    );
  } else {
    // Auth items for guests
    items.push(
      { name: 'Login', path: '/login', icon: 'login', isAuth: true },
      { name: 'Sign Up', path: '/signup', icon: 'signup', isAuth: true }
    );
  }

  return items;
});

// Navigation functions
let isNavigating = false;
const navigateTo = async (path) => {
  // Trigger haptic feedback immediately for instant tactile response
  triggerSelection();

  // Prevent multiple rapid navigation calls
  if (isNavigating) {
    return;
  }

  // Check if we're already on the target path
  if (router.currentRoute.value.path === path) {
    return;
  }

  isNavigating = true;

  try {
    // Emit navigation event to parent for any additional handling
    emit('navigate', path);

    await router.push(path);
  } catch (error) {
    console.error(`Navigation error:`, error);
  } finally {
    // Reset navigation flag after a short delay
    setTimeout(() => {
      isNavigating = false;
    }, 100);
  }
};

// Handle auth navigation with special logic for Sign Up
const handleAuthNavigation = async (item) => {
  // Trigger haptic feedback immediately for instant tactile response
  triggerSelection();

  // Prevent multiple rapid navigation calls
  if (isNavigating) {
    return;
  }

  isNavigating = true;

  try {
    // Emit navigation event to parent for any additional handling
    emit('navigate', item.path);

    if (item.name === 'Sign Up') {
      // For Sign Up, navigate to login with signup query parameter
      await router.push({ path: '/login', query: { signup: 'true' } });
    } else {
      // For other auth items (like Login), navigate normally
      await router.push(item.path);
    }
  } catch (error) {
    console.error(`Auth navigation error:`, error);
  } finally {
    // Reset navigation flag after a short delay
    setTimeout(() => {
      isNavigating = false;
    }, 100);
  }
};

// Function to get icon SVG based on name
const getIcon = (iconName) => {
  switch (iconName) {
    case 'home':
      return `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>`;
    case 'services':
      return `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>`;
    case 'search':
      return `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>`;
    case 'dashboard':
      return `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>`;
    case 'messages':
      return `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>`;
    case 'profile':
      return `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>`;
    case 'login':
      return `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>`;
    case 'signup':
      return `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>`;
    case 'logout':
      return `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>`;
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
  }
};
</script>

<template>
  <!-- Mobile Bottom Navigation -->
  <nav
    v-if="showMobileNav"
    class="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-lg border-t border-border mobile-navigation"
  >
    <div class="flex justify-around items-center h-16">
      <template v-for="(item, index) in navItems" :key="index">
        <!-- Regular navigation item -->
        <button
          v-if="!item.isLogout && !item.isAuth"
          @click="navigateTo(item.path)"
          class="flex flex-col items-center justify-center w-full h-full transition-colors relative"
          :class="
            route.path === item.path ? 'text-primary' : 'text-muted-foreground'
          "
        >
          <div class="w-6 h-6 relative" v-html="getIcon(item.icon)"></div>
          <!-- Unread message badge for Messages tab -->
          <div
            v-if="item.name === t('navigation.messages') && hasUnreadMessages"
            class="absolute top-0 right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse"
          >
            {{ totalUnreadCount > 99 ? '99+' : totalUnreadCount }}
          </div>
          <span class="text-xs mt-1">{{ item.name }}</span>
        </button>

        <!-- Auth navigation item -->
        <button
          v-else-if="item.isAuth"
          @click="handleAuthNavigation(item)"
          class="flex flex-col items-center justify-center w-full h-full transition-colors"
          :class="
            route.path === item.path ? 'text-primary' : 'text-muted-foreground'
          "
        >
          <div class="w-6 h-6" v-html="getIcon(item.icon)"></div>
          <span class="text-xs mt-1">{{ item.name }}</span>
        </button>
      </template>
    </div>
  </nav>
</template>

<style scoped>
.mobile-navigation {
  /* Ensure navigation is completely isolated from page scroll */
  position: fixed !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;

  /* Prevent navigation from participating in scroll behavior */
  transform: translateZ(0); /* Force hardware acceleration */
  will-change: transform; /* Optimize for animations */

  /* Ensure it stays above all content */
  z-index: var(--z-navigation) !important;

  /* Prevent any scroll-related movement */
  overscroll-behavior: none !important;
  overscroll-behavior-y: none !important;
  -webkit-overflow-scrolling: auto; /* Disable momentum scrolling for nav */

  /* Native-like backdrop */
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);

  /* Prevent touch events from bubbling to content below */
  touch-action: manipulation;

  /* Ensure consistent height */
  height: 4rem; /* 64px */
  min-height: 4rem;
  max-height: 4rem;
}

/* Enhanced button styling for native feel */
.mobile-navigation button,
.mobile-navigation a {
  /* Immediate visual feedback */
  transition: all 0.1s ease-out;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  user-select: none;

  /* Prevent any scroll interference */
  touch-action: manipulation;

  /* Ensure buttons fill their space properly */
  min-height: 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Active state for immediate feedback */
.mobile-navigation button:active,
.mobile-navigation a:active {
  transform: scale(0.95);
  opacity: 0.7;
}

/* Ensure icons and text don't interfere with touch */
.mobile-navigation .w-6,
.mobile-navigation .text-xs {
  pointer-events: none;
}
</style>
