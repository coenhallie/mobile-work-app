<template>
  <div class="auth-cache-clearer">
    <!-- Debug Info Panel -->
    <div
      v-if="showDebugInfo"
      class="debug-panel bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4"
    >
      <h3 class="text-lg font-semibold text-yellow-800 mb-2">
        🔍 Authentication Debug Info
      </h3>
      <div class="space-y-2 text-sm">
        <div><strong>User ID:</strong> {{ user?.id || 'Not signed in' }}</div>
        <div><strong>Email:</strong> {{ user?.email || 'N/A' }}</div>
        <div>
          <strong>User Metadata Role:</strong>
          {{ user?.user_metadata?.role || 'None' }}
        </div>
        <div>
          <strong>App Metadata Role:</strong>
          {{ user?.app_metadata?.role || 'None' }}
        </div>
        <div><strong>Computed User Role:</strong> {{ userRole || 'None' }}</div>
        <div><strong>App Role:</strong> {{ appRole || 'default' }}</div>
        <div><strong>Session Exists:</strong> {{ !!session }}</div>
        <div><strong>Is Signed In:</strong> {{ isSignedIn }}</div>
      </div>
    </div>

    <!-- Cache Clearing Panel -->
    <div class="cache-panel bg-red-50 border border-red-200 rounded-lg p-4">
      <h3 class="text-lg font-semibold text-red-800 mb-2">
        🔄 Clear Authentication Cache
      </h3>
      <p class="text-sm text-red-700 mb-4">
        If you're not seeing your updated role (Services tab missing), clear the
        authentication cache to force a fresh login.
      </p>

      <div class="space-y-3">
        <button
          @click="clearCacheAndReload"
          :disabled="isClearing"
          class="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {{ isClearing ? 'Clearing Cache...' : 'Clear Cache & Reload' }}
        </button>

        <button
          @click="signOutAndClear"
          :disabled="isClearing || !isSignedIn"
          class="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {{ isClearing ? 'Processing...' : 'Sign Out & Clear Cache' }}
        </button>

        <button
          @click="showDebugInfo = !showDebugInfo"
          class="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {{ showDebugInfo ? 'Hide Debug Info' : 'Show Debug Info' }}
        </button>
      </div>

      <!-- Progress indicator -->
      <div v-if="isClearing" class="mt-4 text-center">
        <div class="inline-flex items-center space-x-2">
          <div
            class="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"
          ></div>
          <span class="text-sm text-red-700">{{ clearingStatus }}</span>
        </div>
      </div>
    </div>

    <!-- Manual Steps Panel -->
    <div
      class="manual-steps bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4"
    >
      <h3 class="text-lg font-semibold text-blue-800 mb-2">
        📋 Manual Steps (if needed)
      </h3>
      <ol class="text-sm text-blue-700 space-y-1 list-decimal list-inside">
        <li>Open browser DevTools (F12)</li>
        <li>Go to Application/Storage tab</li>
        <li>Clear all localStorage and sessionStorage</li>
        <li>Clear all cookies for this domain</li>
        <li>Reload the page and sign in again</li>
      </ol>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useSupabaseAuth } from '@/composables/useSupabaseAuth';

// Get auth state
const auth = useSupabaseAuth();
const { user, session, isSignedIn, userRole, signOut } = auth;

// Component state
const showDebugInfo = ref(false);
const isClearing = ref(false);
const clearingStatus = ref('');

// Get app role from document title (matching App.vue logic)
const appRole = computed(() => {
  const windowTitle = document.title;
  if (windowTitle.includes('Contractor')) return 'contractor';
  if (windowTitle.includes('Client')) return 'client';
  return 'default';
});

/**
 * Clear all authentication-related cache
 */
async function clearAuthCache() {
  console.log('🔄 Starting authentication cache clearing process...');

  // Clear localStorage
  const localStorageKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key &&
      (key.includes('supabase') || key.includes('sb-') || key.includes('auth'))
    ) {
      localStorageKeys.push(key);
    }
  }

  localStorageKeys.forEach((key) => {
    localStorage.removeItem(key);
    console.log(`🗑️ Removed localStorage: ${key}`);
  });

  // Clear sessionStorage
  const sessionStorageKeys = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (
      key &&
      (key.includes('supabase') || key.includes('sb-') || key.includes('auth'))
    ) {
      sessionStorageKeys.push(key);
    }
  }

  sessionStorageKeys.forEach((key) => {
    sessionStorage.removeItem(key);
    console.log(`🗑️ Removed sessionStorage: ${key}`);
  });

  // Clear app-specific cache
  const appKeys = ['user', 'session', 'userRole', 'appRole'];
  appKeys.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });

  // Clear IndexedDB if possible
  try {
    if ('indexedDB' in window && indexedDB.databases) {
      const databases = await indexedDB.databases();
      for (const db of databases) {
        if (
          db.name &&
          (db.name.includes('supabase') || db.name.includes('sb'))
        ) {
          indexedDB.deleteDatabase(db.name);
          console.log(`🗑️ Cleared IndexedDB: ${db.name}`);
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ IndexedDB clearing failed:', error);
  }

  console.log('✅ Authentication cache cleared');
}

/**
 * Clear cache and reload the page
 */
async function clearCacheAndReload() {
  isClearing.value = true;
  clearingStatus.value = 'Clearing authentication cache...';

  try {
    await clearAuthCache();

    clearingStatus.value = 'Reloading page...';

    // Countdown before reload
    for (let i = 3; i > 0; i--) {
      clearingStatus.value = `Reloading in ${i} seconds...`;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    window.location.reload();
  } catch (error) {
    console.error('❌ Error during cache clearing:', error);
    clearingStatus.value = 'Error occurred. Try manual steps below.';
    isClearing.value = false;
  }
}

/**
 * Sign out and clear cache
 */
async function signOutAndClear() {
  isClearing.value = true;
  clearingStatus.value = 'Signing out...';

  try {
    // Sign out from Supabase
    const result = await signOut();
    if (!result.success) {
      console.warn('⚠️ Sign out warning:', result.error);
    }

    clearingStatus.value = 'Clearing cache...';
    await clearAuthCache();

    clearingStatus.value = 'Redirecting to login...';

    // Small delay then redirect to login
    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
  } catch (error) {
    console.error('❌ Error during sign out and cache clearing:', error);
    clearingStatus.value = 'Error occurred. Try manual steps below.';
    isClearing.value = false;
  }
}
</script>

<style scoped>
.auth-cache-clearer {
  max-width: 600px;
  margin: 0 auto;
}

.debug-panel,
.cache-panel,
.manual-steps {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
