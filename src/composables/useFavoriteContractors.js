import { ref, computed, watch } from 'vue';
import { supabase } from '@/composables/useSupabaseAuth'; // Using exported client

/**
 * @typedef {Object} FavoriteOperationResult
 * @property {boolean} success - Whether the operation was successful.
 * @property {any} [data] - Data returned from the operation, if any.
 * @property {Error | string | null} [error] - Error object or message if the operation failed.
 */

// Global state for favorite contractors (renamed to avoid conflicts)
const globalFavoriteContractorIds = ref(new Set());
const globalIsLoading = ref(false); // General loading state for fetching initial set
const globalOperationError = ref(null); // Stores error from the last operation

// Specific loading states for different operations
const globalIsAddingFavorite = ref(false);
const globalIsRemovingFavorite = ref(false);
const globalIsFetchingFavorites = ref(false);

// Helper function to get current user without using composables
const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

// Helper function to get user ID
const getCurrentUserId = async () => {
  const user = await getCurrentUser();
  return user?.id || null;
};

// Helper function to check if user is signed in
const isUserSignedIn = async () => {
  const user = await getCurrentUser();
  return !!user;
};

/**
 * Composable for managing favorite contractors.
 * Provides reactive state and methods for adding, removing, toggling,
 * and fetching favorite contractors for the authenticated user.
 */
export function useFavoriteContractors() {
  // Use helper functions instead of composables to avoid setup context issues

  /**
   * Clears all local favorite data.
   * This function is typically invoked when a user signs out, ensuring that
   * cached favorite contractor IDs are removed from the local state.
   */
  const clearLocalFavorites = () => {
    globalFavoriteContractorIds.value.clear();
    // Potentially reset other local state if needed
  };

  /**
   * Fetches the user's favorite contractors from the Supabase database.
   * It updates the local reactive state (`favoriteContractorIds`) with the fetched data.
   * If the user is not authenticated, it clears local favorites and returns an error.
   * Handles potential errors during the fetch operation and updates `operationError`.
   *
   * @async
   * @returns {Promise<FavoriteOperationResult>} An object indicating success or failure,
   *                                            along with data or an error message.
   */
  const getFavorites = async () => {
    const userId = await getCurrentUserId();
    const isSignedIn = await isUserSignedIn();

    if (!isSignedIn || !userId) {
      clearLocalFavorites();
      return { success: false, error: 'User not authenticated' };
    }

    globalIsFetchingFavorites.value = true;
    globalIsLoading.value = true;
    globalOperationError.value = null;
    try {
      const { data, error } = await supabase
        .from('contractor_favorites')
        .select('contractor_id')
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      const newFavoriteIds = new Set(data.map((fav) => fav.contractor_id));
      globalFavoriteContractorIds.value = newFavoriteIds;
      return { success: true, data: Array.from(newFavoriteIds) };
    } catch (err) {
      console.error('Error fetching favorites:', err);
      globalOperationError.value = err.message || 'Error loading favorites';
      // Don't clear local favorites on fetch error, might be temporary network issue
      return { success: false, error: globalOperationError.value };
    } finally {
      globalIsFetchingFavorites.value = false;
      globalIsLoading.value = false;
    }
  };

  /**
   * Adds a specified contractor to the current user's list of favorites.
   * This function performs an optimistic update to the local state (`favoriteContractorIds`)
   * before attempting to persist the change to the Supabase database.
   * If the database operation fails, the optimistic update is rolled back.
   * Handles cases where the contractor is already favorited or if the user is not authenticated.
   *
   * @async
   * @param {string} contractorId - The unique identifier of the contractor to be added to favorites.
   * @returns {Promise<FavoriteOperationResult>} An object indicating success or failure,
   *                                            along with data or an error message.
   */
  const addFavorite = async (contractorId) => {
    const userId = await getCurrentUserId();
    const isSignedIn = await isUserSignedIn();

    if (!isSignedIn || !userId) {
      return { success: false, error: 'User not authenticated' };
    }
    if (!contractorId) {
      return { success: false, error: 'Contractor ID required' };
    }

    globalIsAddingFavorite.value = true;
    globalOperationError.value = null;
    const currentUserId = userId;

    // Optimistic update
    const alreadyFavorited =
      globalFavoriteContractorIds.value.has(contractorId);
    if (alreadyFavorited) {
      globalIsAddingFavorite.value = false;
      return {
        success: true,
        data: { contractorId },
        message: 'Already favorited',
      };
    }
    globalFavoriteContractorIds.value.add(contractorId);

    try {
      const { error, data } = await supabase
        .from('contractor_favorites')
        .insert({ user_id: currentUserId, contractor_id: contractorId })
        .select('id, contractor_id') // Select to confirm
        .single();

      if (error) {
        // Check for unique constraint violation (already exists, possibly due to race condition)
        if (error.code === '23505') {
          // PostgreSQL unique_violation
          console.warn(
            'Favorite already exists in DB, UI desync possible or race condition:',
            error
          );
          // Ensure local state is consistent if DB says it exists
          if (!globalFavoriteContractorIds.value.has(contractorId)) {
            globalFavoriteContractorIds.value.add(contractorId);
          }
          return {
            success: true,
            data: { contractorId },
            message: 'Already favorited in database',
          };
        }
        throw error;
      }
      return { success: true, data };
    } catch (err) {
      console.error('Error adding favorite:', err);
      globalOperationError.value = err.message || 'Error adding favorite';
      // Rollback optimistic update
      if (!alreadyFavorited) {
        // Only rollback if we actually added it optimistically
        globalFavoriteContractorIds.value.delete(contractorId);
      }
      return { success: false, error: globalOperationError.value };
    } finally {
      globalIsAddingFavorite.value = false;
    }
  };

  /**
   * Removes a specified contractor from the current user's list of favorites.
   * This function performs an optimistic update to the local state (`favoriteContractorIds`)
   * before attempting to persist the change to the Supabase database.
   * If the database operation fails, the optimistic update is rolled back.
   * Handles cases where the contractor was not favorited or if the user is not authenticated.
   *
   * @async
   * @param {string} contractorId - The unique identifier of the contractor to be removed from favorites.
   * @returns {Promise<FavoriteOperationResult>} An object indicating success or failure,
   *                                            along with data (like removedCount) or an error message.
   */
  const removeFavorite = async (contractorId) => {
    const userId = await getCurrentUserId();
    const isSignedIn = await isUserSignedIn();

    if (!isSignedIn || !userId) {
      return { success: false, error: 'User not authenticated' };
    }
    if (!contractorId) {
      return { success: false, error: 'Contractor ID required' };
    }

    globalIsRemovingFavorite.value = true;
    globalOperationError.value = null;
    const currentUserId = userId;

    // Optimistic update
    const wasFavorited = globalFavoriteContractorIds.value.has(contractorId);
    if (!wasFavorited) {
      globalIsRemovingFavorite.value = false;
      // Not an error, just wasn't favorited to begin with.
      return { success: true, message: 'Not favorited' };
    }
    globalFavoriteContractorIds.value.delete(contractorId);

    try {
      const { error, count } = await supabase
        .from('contractor_favorites')
        .delete({ count: 'exact' }) // Request count of deleted rows
        .eq('user_id', currentUserId)
        .eq('contractor_id', contractorId);

      if (error) {
        throw error;
      }

      // If count is 0, it means the record wasn't in the DB (UI desync or race condition)
      if (count === 0) {
        console.warn(
          `Attempted to delete favorite for contractor ${contractorId}, but it was not found in the database.`
        );
      }

      return { success: true, data: { contractorId, removedCount: count } };
    } catch (err) {
      console.error('Error removing favorite:', err);
      globalOperationError.value = err.message || 'Error removing favorite';
      // Rollback optimistic update
      if (wasFavorited) {
        // Only rollback if we actually removed it optimistically
        globalFavoriteContractorIds.value.add(contractorId);
      }
      return { success: false, error: globalOperationError.value };
    } finally {
      globalIsRemovingFavorite.value = false;
    }
  };

  /**
   * Checks if a given contractor is currently in the user's list of favorites.
   *
   * @param {string} contractorId - The unique identifier of the contractor to check.
   * @returns {boolean} `true` if the contractor is favorited, `false` otherwise.
   */
  const isFavorited = (contractorId) => {
    return globalFavoriteContractorIds.value.has(contractorId);
  };

  /**
   * Toggles the favorite status of a specified contractor for the current user.
   * If the contractor is currently favorited, it will be removed; otherwise, it will be added.
   * This function calls `addFavorite` or `removeFavorite` internally.
   *
   * @async
   * @param {string} contractorId - The unique identifier of the contractor whose favorite status is to be toggled.
   * @returns {Promise<FavoriteOperationResult>} The result of the add or remove operation.
   */
  const toggleFavorite = async (contractorId) => {
    if (isFavorited(contractorId)) {
      return removeFavorite(contractorId);
    } else {
      return addFavorite(contractorId);
    }
  };

  // Note: Authentication change watching is removed to avoid composition API issues
  // Components using this composable should handle auth changes themselves

  return {
    favoriteContractorIds: globalFavoriteContractorIds, // Direct ref access
    isLoading: globalIsLoading,
    isAddingFavorite: globalIsAddingFavorite,
    isRemovingFavorite: globalIsRemovingFavorite,
    isFetchingFavorites: globalIsFetchingFavorites,
    operationError: globalOperationError,

    getFavorites,
    addFavorite,
    removeFavorite,
    isFavorited,
    toggleFavorite,
    clearLocalFavorites, // Expose if manual clearing is needed elsewhere
  };
}

// Singleton instance management with lazy initialization
let instance = null;

/**
 * Gets a singleton instance of the useFavoriteContractors composable.
 * Ensures that reactive state like favoriteContractorIds is shared across the application.
 * @returns {ReturnType<useFavoriteContractors>} The favorite contractors composable instance.
 */
export function getFavoriteContractorsInstance() {
  if (!instance) {
    instance = useFavoriteContractors();
  }
  return instance;
}

// Export individual properties and methods for direct import (lazy)
export const favoriteContractorIds = computed(
  () => getFavoriteContractorsInstance().favoriteContractorIds
);
export const isLoading = computed(
  () => getFavoriteContractorsInstance().isLoading
);
export const isAddingFavorite = computed(
  () => getFavoriteContractorsInstance().isAddingFavorite
);
export const isRemovingFavorite = computed(
  () => getFavoriteContractorsInstance().isRemovingFavorite
);
export const isFetchingFavorites = computed(
  () => getFavoriteContractorsInstance().isFetchingFavorites
);
export const operationError = computed(
  () => getFavoriteContractorsInstance().operationError
);

export const getFavorites = (...args) =>
  getFavoriteContractorsInstance().getFavorites(...args);
export const addFavorite = (...args) =>
  getFavoriteContractorsInstance().addFavorite(...args);
export const removeFavorite = (...args) =>
  getFavoriteContractorsInstance().removeFavorite(...args);
export const isFavorited = (...args) =>
  getFavoriteContractorsInstance().isFavorited(...args);
export const toggleFavorite = (...args) =>
  getFavoriteContractorsInstance().toggleFavorite(...args);
export const clearLocalFavorites = (...args) =>
  getFavoriteContractorsInstance().clearLocalFavorites(...args);
