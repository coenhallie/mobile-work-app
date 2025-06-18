import { createRouter, createWebHistory } from 'vue-router';
import { useSupabaseAuth } from '../composables/useSupabaseAuth.js';
import HomeView from '../views/HomeView.vue';

// Get Supabase client instance
const { getSupabaseClient } = useSupabaseAuth();
const supabase = getSupabaseClient();

// Implement lazy loading for all routes
// All routes now use dynamic imports for optimal code splitting

const routes = [
  {
    path: '/',
    name: 'Welcome',
    component: () => import('../views/WelcomeView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/home',
    name: 'Home',
    component: HomeView,
    meta: {
      requiresAuth: true,
      keepAlive: false,
    },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/signup',
    name: 'SignUp',
    redirect: (to) => {
      // Redirect to login with signup query parameter to open modal directly
      return { path: '/login', query: { signup: 'true' } };
    },
    meta: { guestOnly: true },
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: () => import('../views/AuthCallbackView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/auth/reset-password',
    name: 'PasswordReset',
    component: () => import('../views/PasswordResetView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/reset-password',
    name: 'ResetPasswordRedirect',
    redirect: '/auth/reset-password',
    meta: { requiresAuth: false },
  },
  {
    path: '/services',
    name: 'ServiceCategories',
    component: () => import('../views/ServiceCategoriesView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['client'],
      keepAlive: true, // Enable component caching
    },
  },
  {
    path: '/post-job/:serviceId', // Dynamic segment for service ID
    name: 'PostJob',
    component: () => import('../views/PostJobView.vue'),
    props: true,
    meta: { requiresAuth: true, roles: ['client'] }, // Requires auth + client role
  },
  {
    path: '/edit-job/:jobId/:serviceId', // Dynamic segments for job ID and service ID
    name: 'EditJob',
    component: () => import('../views/PostJobView.vue'),
    props: true,
    meta: { requiresAuth: true, roles: ['client'] }, // Requires auth + client role
  },
  {
    path: '/contractor-dashboard',
    name: 'ContractorDashboard',
    redirect: '/', // Redirect to home since functionality is integrated there
    meta: { requiresAuth: true, roles: ['contractor'] },
  },
  {
    path: '/find-contractor',
    name: 'FindContractor',
    component: () => import('../views/ContractorListView.vue'),
    meta: {
      requiresAuth: false,
      keepAlive: true, // Enable component caching
    },
    props: (route) => ({
      preSelectedService: route.query.service,
      preSelectedLocation: route.query.zipcode,
      fromSearch: route.query.fromSearch === 'true',
      searchQuery: route.query.query,
    }),
  },
  {
    path: '/contractors',
    name: 'ContractorList',
    component: () => import('../views/ContractorListView.vue'),
    meta: {
      requiresAuth: false,
      keepAlive: true, // Enable component caching
    },
    props: (route) => ({
      preSelectedService: route.query.service,
      preSelectedLocation: route.query.zipcode,
      fromSearch: route.query.fromSearch === 'true',
      searchQuery: route.query.query,
    }),
  },
  {
    path: '/job/:jobId', // Dynamic segment for job ID
    name: 'JobDetails',
    component: () => import('../views/JobDetailsView.vue'),
    props: true, // Pass route params as props
    meta: {
      requiresAuth: true, // Accessible by any logged-in user (client or contractor)
      keepAlive: false, // Disable component caching to ensure proper cleanup
    },
  },
  {
    path: '/user-profile',
    name: 'UserProfile',
    component: () => import('../views/UserProfileView.vue'),
    meta: { requiresAuth: true }, // Requires login
  },
  {
    path: '/availability-test',
    name: 'AvailabilityTest',
    component: () => import('../views/AvailabilityTestView.vue'),
    meta: { requiresAuth: false }, // Public test page
  },
  {
    path: '/select-locations',
    name: 'LocationSelection',
    component: () => import('../views/LocationSelectionView.vue'),
    meta: { requiresAuth: true }, // Requires login
  },
  {
    path: '/contractors/:id', // Dynamic segment for contractor ID
    name: 'ContractorProfile',
    component: () => import('../views/ContractorProfileView.vue'),
    props: true, // Pass route params (id) as props
    meta: { requiresAuth: true }, // Requires login to view profiles
  },
  {
    path: '/complete-profile',
    name: 'CompleteProfile',
    component: () => import('../views/CompleteProfileView.vue'),
    meta: { requiresAuth: true, roles: ['contractor'] }, // Requires auth + contractor role
  },
  {
    path: '/onboarding',
    name: 'OnboardingFlow',
    component: () => import('../views/OnboardingFlow.vue'),
    meta: {
      requiresAuth: true,
      roles: ['contractor'],
      keepAlive: false, // Disable caching for fresh state
    },
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('../views/MessagesView.vue'),
    meta: { requiresAuth: true }, // Requires login
  },
  {
    path: '/messages/:roomId',
    name: 'Conversation',
    component: () => import('../views/ConversationView.vue'),
    props: true, // Pass route params as props
    meta: { requiresAuth: true }, // Requires login
  },
  // Commented out Clerk debug route removed.
  // Add other routes later
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // Using web history mode
  routes,
  scrollBehavior(to, from, savedPosition) {
    // If navigating to chat-related views, let the components manage scroll.
    // This prevents the global scroll-to-top from interfering with chat auto-scroll.
    if (to.name === 'Conversation' || to.name === 'Messages') {
      return false;
    }

    // If a saved position exists (e.g., when using browser back/forward buttons),
    // restore that position.
    if (savedPosition) {
      return savedPosition;
    }

    // For all other navigations (new route visits), scroll to the top-left of the page.
    // Use a Promise to delay the scroll slightly, allowing transitions to settle.
    return new Promise((resolve) => {
      const appElement = document.getElementById('app');

      // Ensure the function is executed after the DOM update cycle that renders the new route
      // and potentially after transitions have started/finished.
      setTimeout(() => {
        if (appElement && typeof appElement.scrollTo === 'function') {
          // Check if the element is actually scrollable.
          // This is a basic check; a more robust one might compare scrollHeight > clientHeight.
          const isScrollable =
            appElement.scrollHeight > appElement.clientHeight ||
            appElement.scrollWidth > appElement.clientWidth;
          // Or, more simply, trust that if it's #app, it's our main scroller.

          appElement.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          // Resolve with an empty object or specific coordinates for the #app element
          // to indicate that we've handled the scroll.
          // Returning `false` also works to prevent default router scroll.
          resolve({ el: '#app', top: 0, left: 0, behavior: 'instant' });
        } else {
          // Fallback to window scrolling if #app is not found or not scrollable
          // This also ensures that if the #app targeting fails, we still try to scroll the window.
          resolve({ top: 0, left: 0, behavior: 'instant' });
        }
      }, 60); // Slightly increased delay to wait for transitions
    });
  },
});

/**
 * Enhanced authentication check using Supabase
 */
async function isUserAuthenticated() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('[ROUTER] Error checking authentication:', error);
      return null; // Allow navigation on error
    }

    return !!session?.user;
  } catch (error) {
    console.error('[ROUTER] Error checking authentication:', error);
    return null; // Allow navigation on error
  }
}

/**
 * Get user role from Supabase user metadata
 */
async function getUserRole() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.user) {
      return null;
    }

    // Check user metadata for role
    const role = session.user.user_metadata?.role;
    if (role) {
      return role;
    }

    // Fallback: check client_profiles table
    const { data: profile } = await supabase
      .from('client_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    return profile?.role || null;
  } catch (error) {
    console.error('[ROUTER] Error getting user role:', error);
    return null;
  }
}

// Streamlined navigation guard with better error handling
router.beforeEach(async (to, from) => {
  // Prevent infinite loops by checking if we're already on the target route
  if (to.name === from.name && to.path === from.path) {
    return false;
  }

  // Special case for FindContractor navigation
  if (
    from.name === 'FindContractor' &&
    (to.name === 'Home' || to.name === 'ServiceCategories')
  ) {
    // Clean up component if needed
    if (from.instance?.$cleanup) from.instance.$cleanup();
  }

  // Allow normal navigation flow without interference

  // Skip auth checks for public routes
  if (to.meta.requiresAuth !== true) {
    return true;
  }

  // Authentication check for protected routes
  try {
    const isAuthenticated = await isUserAuthenticated();

    // Allow navigation if auth isn't initialized yet (null means not ready)
    if (isAuthenticated === null) {
      console.log('[ROUTER] Auth not ready, allowing navigation to continue');
      return true;
    }

    // Redirect to welcome if not authenticated
    if (!isAuthenticated) {
      console.log('[ROUTER] User not authenticated, redirecting to welcome');
      // Prevent redirect loops
      if (to.name === 'Welcome' || to.name === 'Login') {
        return true;
      }
      return {
        name: 'Welcome',
        query: { redirect: to.fullPath },
      };
    }

    // Role-based access check
    if (to.meta.roles?.length > 0) {
      const userRole = await getUserRole();

      if (!userRole || !to.meta.roles.includes(userRole)) {
        console.log(
          `[ROUTER] Access denied. Required: ${to.meta.roles[0]}, Current: ${userRole || 'none'}`
        );

        // Store minimal error info for feedback
        sessionStorage.setItem(
          'accessError',
          JSON.stringify({
            requiredRole: to.meta.roles[0],
            currentRole: userRole || 'none',
          })
        );

        // Prevent redirect loops
        if (to.name === 'Home') {
          return true;
        }

        return {
          name: 'Home',
          query: { accessDenied: 'true', requiredRole: to.meta.roles[0] },
        };
      }
    }

    return true;
  } catch (error) {
    console.error('[ROUTER] Navigation guard error:', error);
    // Allow navigation on error to prevent blocking
    return true;
  }
});

// Handle authenticated users trying to access auth pages
router.beforeEach(async (to, from) => {
  if (to.name === 'Login' || to.name === 'Welcome') {
    try {
      const isAuthenticated = await isUserAuthenticated();
      if (isAuthenticated === true) {
        console.log(
          '[ROUTER] Authenticated user accessing auth page, redirecting to home'
        );
        return { name: 'Home' };
      }
    } catch (error) {
      console.error('[ROUTER] Error checking auth for auth pages:', error);
    }
  }
  return true;
});

export default router;
