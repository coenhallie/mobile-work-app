# Navigation Issue Diagnosis - JobDetailsView.vue

## Problem Summary

After visiting JobDetailsView, other routes (profile, messages, homepage) lose their content even though:

- Debug header shows route changes correctly
- User remains signed in
- Navigation appears to work

## Root Cause Analysis

### 1. **Primary Issue: Supabase Client State Pollution** ⭐ MOST LIKELY

**Location**: `JobDetailsView.vue` lines 604, 635, 1304, 1311

**Problem**: The component creates a local `supabaseRef.value` and nullifies it in cleanup functions:

```javascript
// Lines 604, 635
const supabaseRef = ref(null);
const initSupabase = () => {
  supabaseRef.value = getSupabaseClient(); // Creates local reference
};

// Lines 1301-1312 - PROBLEMATIC CLEANUP
onBeforeUnmount(() => {
  supabaseRef.value = null; // This might affect global state
});

onDeactivated(() => {
  supabaseRef.value = null; // This might affect global state
});
```

**Why this causes issues**:

- The `getSupabaseClient()` returns a reference to the global Supabase client
- Setting `supabaseRef.value = null` might be affecting the global client state
- Other components that depend on the same Supabase client lose functionality

### 2. **Secondary Issue: Global State Management in useSupabaseAuth**

**Location**: `src/composables/useSupabaseAuth.js` lines 10-13, 296-300

**Problem**: Global state variables and singleton pattern:

```javascript
// Global state - shared across all components
const user = ref(null);
const session = ref(null);
const isLoaded = ref(false);
const isLoading = ref(true);

// Singleton pattern
let authInstance = null;
export function getAuthInstance() {
  if (!authInstance) {
    authInstance = useSupabaseAuth();
  }
  return authInstance;
}
```

**Why this could cause issues**:

- If JobDetailsView's cleanup affects these global refs, all components lose auth state
- The singleton pattern means all components share the same auth instance

### 3. **Tertiary Issue: Job Store State Caching**

**Location**: `src/stores/job.js` lines 30-56

**Problem**: The job store uses centralized auth and caching:

```javascript
const auth = useAuthenticatedDataFetching(); // Shared auth instance
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
```

**Why this could cause issues**:

- If auth state is corrupted, the store can't fetch data
- Cached state might become stale after auth issues

## Validation Steps

### Step 1: Test with Debug Version

1. Replace `JobDetailsView.vue` with `JobDetailsView-debug.vue` temporarily
2. Navigate: Home → Job Details → Other routes
3. Check browser console for detailed logs
4. Look for patterns in auth state changes during navigation

### Step 2: Run Diagnostic Script

1. Open browser console
2. Load the debug script: `<script src="/debug-navigation-issue.js"></script>`
3. Run: `window.debugNavigation.runDiagnostics()`
4. Compare results before and after visiting JobDetailsView

### Step 3: Monitor Global State

Add this to browser console to monitor global state changes:

```javascript
// Monitor global auth state
let originalUser = window.__VUE_APP__?.user;
setInterval(() => {
  const currentUser = window.__VUE_APP__?.user;
  if (originalUser !== currentUser) {
    console.log('Global user state changed:', {
      from: originalUser,
      to: currentUser,
    });
    originalUser = currentUser;
  }
}, 1000);
```

## Proposed Fixes

### Fix 1: Remove Local Supabase Client Management (RECOMMENDED)

**File**: `src/views/JobDetailsView.vue`

Remove the problematic local Supabase client management:

```javascript
// REMOVE THESE LINES:
const supabaseRef = ref(null);

const initSupabase = () => {
  if (isLoaded.value) {
    try {
      supabaseRef.value = getSupabaseClient();
      console.log('[JobDetailsView] Created Supabase client with auth');
    } catch (err) {
      console.error('[JobDetailsView] Error creating Supabase client:', err);
    }
  }
};

const getSupabase = () => {
  return supabaseRef.value || getSupabaseClient();
};

// REMOVE CLEANUP FUNCTIONS:
onBeforeUnmount(() => {
  console.log('[JobDetailsView] Component unmounting, cleaning up resources');
  supabaseRef.value = null; // PROBLEMATIC
});

onDeactivated(() => {
  console.log('[JobDetailsView] Component deactivated, cleaning up resources');
  supabaseRef.value = null; // PROBLEMATIC
});

// REPLACE WITH:
const getSupabase = () => {
  return getSupabaseClient(); // Always use global client
};

// SIMPLIFIED CLEANUP (if needed):
onBeforeUnmount(() => {
  console.log('[JobDetailsView] Component unmounting');
  // Only clean up component-specific resources, not global ones
});
```

### Fix 2: Improve Global State Protection

**File**: `src/composables/useSupabaseAuth.js`

Add protection against accidental state corruption:

```javascript
// Make global state read-only for external access
export function useSupabaseAuth() {
  // ... existing code ...

  return {
    // Return computed refs to prevent external mutation
    user: computed(() => user.value),
    session: computed(() => session.value),
    isLoaded: computed(() => isLoaded.value),
    isLoading: computed(() => isLoading.value),
    // ... rest of the interface
  };
}
```

### Fix 3: Add State Recovery Mechanism

**File**: `src/composables/useAuth.js`

Add automatic state recovery:

```javascript
export function useAuth() {
  const supabaseAuth = useSupabaseAuth();

  // Add state validation and recovery
  const validateAuthState = () => {
    if (!supabaseAuth.isLoaded.value && !supabaseAuth.isLoading.value) {
      console.warn('[useAuth] Auth state appears corrupted, reinitializing...');
      supabaseAuth.initializeAuth();
    }
  };

  return {
    // ... existing interface ...
    validateAuthState,

    // Enhanced getSupabaseClient with validation
    getSupabaseClient: () => {
      validateAuthState();
      return supabaseAuth.getSupabaseClient();
    },
  };
}
```

## Testing Plan

### Phase 1: Confirm Diagnosis

1. Deploy debug version
2. Reproduce issue with enhanced logging
3. Confirm root cause from logs

### Phase 2: Apply Fix 1

1. Remove local Supabase client management
2. Test navigation flow
3. Verify other routes work correctly

### Phase 3: Apply Additional Fixes (if needed)

1. Implement state protection (Fix 2)
2. Add recovery mechanism (Fix 3)
3. Comprehensive testing

### Phase 4: Cleanup

1. Remove debug logging
2. Remove debug files
3. Document solution

## Expected Outcome

After applying Fix 1, the navigation issue should be resolved because:

1. No local Supabase client references to corrupt
2. All components use the same global client consistently
3. No cleanup functions interfering with global state
4. Simpler, more predictable component lifecycle

## Risk Assessment

**Low Risk**: Fix 1 is a simplification that removes problematic code without changing core functionality.

**Medium Risk**: Fixes 2 & 3 add complexity but provide better protection against future issues.

**High Risk**: Not fixing this issue will continue to cause user experience problems and potential data inconsistencies.
