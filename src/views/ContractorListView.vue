<template>
  <div
    class="contractor-list w-full max-w-7xl mx-auto px-4 py-6 bg-white dark:bg-gray-900 min-h-screen"
  >
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-normal text-gray-900 dark:text-white mb-2">
        {{ $t('contractors.findContractors') }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400 text-sm">
        {{ $t('contractors.browseAndConnect') }}
      </p>
    </div>

    <!-- Search and Filters -->
    <div class="mb-6 space-y-4">
      <ContractorSearch
        v-model="searchQuery"
        @search="handleSearch"
        class="w-full"
      />

      <ContractorFilters
        v-model="activeFilters"
        @filter-change="handleFilterChange"
        :loading="isLoading"
      />
    </div>

    <!-- Results Count -->
    <div class="mb-4 text-sm text-gray-600 dark:text-gray-400">
      {{ $t('contractors.contractorsFound', { count: totalCount }) }}
    </div>

    <!-- Contractor Grid with Infinite Scroll -->
    <InfiniteScrollContainer
      @load-more="loadMoreContractors"
      :loading="isLoading"
      :has-more="hasMore"
    >
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
      >
        <!-- Show either contractor cards OR skeleton cards, never both -->
        <template v-if="isLoading && contractors.length === 0">
          <!-- Loading Skeletons -->
          <ContractorCardSkeleton
            v-for="n in skeletonCount"
            :key="`skeleton-${n}`"
          />
        </template>
        <template v-else-if="!isLoading && contractors.length > 0">
          <!-- Contractor Cards -->
          <ContractorCard
            v-for="contractor in contractors"
            :key="contractor.id"
            :contractor="contractor"
            @click="viewContractorProfile"
            @contact="handleContact"
          />
        </template>
      </div>
    </InfiniteScrollContainer>

    <!-- Empty State -->
    <div
      v-if="!isLoading && contractors.length === 0"
      class="text-center py-12"
    >
      <div class="text-gray-400 text-6xl mb-4">
        {{ activeFilters.showFavoritesOnly ? '⭐' : '🔍' }}
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {{
          activeFilters.showFavoritesOnly
            ? $t('contractors.noFavoritesFound')
            : $t('contractors.noContractorsFound')
        }}
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-4">
        {{
          activeFilters.showFavoritesOnly
            ? $t('contractors.noFavoritesFoundWithFilter')
            : $t('common.tryAdjustingFilters')
        }}
      </p>
      <button
        @click="clearFilters"
        class="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
      >
        {{ $t('buttons.clearFilters') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import ContractorCard from '@/components/contractors/ContractorCard.vue';
import ContractorCardSkeleton from '@/components/contractors/ContractorCardSkeleton.vue';
import ContractorSearch from '@/components/contractors/ContractorSearch.vue';
import ContractorFilters from '@/components/contractors/ContractorFilters.vue';
import InfiniteScrollContainer from '@/components/contractors/InfiniteScrollContainer.vue';
import { useContractorData } from '@/composables/useContractorData';
import { useAuth } from '@/composables/useAuth';
import {
  getFavorites,
  favoriteContractorIds,
} from '@/composables/useFavoriteContractors';

const router = useRouter();
const route = useRoute();
const { isSignedIn } = useAuth();

// Props from router
const props = defineProps({
  preSelectedService: { type: String, default: 'any' },
  preSelectedLocation: { type: String, default: 'any' },
  fromSearch: { type: Boolean, default: false },
  searchQuery: { type: String, default: '' },
});

// Data management
const {
  contractors,
  isLoading,
  hasMore,
  totalCount,
  loadContractors,
  loadMoreContractors: loadMore,
  resetContractors,
} = useContractorData();

// Filter state
const searchQuery = ref(props.searchQuery || '');
const activeFilters = ref({
  serviceType:
    props.preSelectedService !== 'any' ? props.preSelectedService : '',
  location:
    props.preSelectedLocation !== 'any' ? props.preSelectedLocation : '',
  minRating: '',
  sortBy: 'rating',
  showFavoritesOnly: false,
});

// UI state
const skeletonCount = ref(6);
const isMounted = ref(false);

// Current filters for data fetching
const currentFilters = ref({});

// Event handlers
const viewContractorProfile = (contractor) => {
  if (!isSignedIn.value) {
    // Show login prompt or redirect to login
    router.push({ name: 'Login', query: { redirect: route.fullPath } });
    return;
  }
  router.push(`/contractors/${contractor.id}`);
};

const handleContact = (contractor) => {
  if (!isSignedIn.value) {
    router.push({ name: 'Login', query: { redirect: route.fullPath } });
    return;
  }
  router.push(`/chat/new?contractor=${contractor.id}`);
};

const handleSearch = (query) => {
  searchQuery.value = query;
  updateFiltersAndReload();
};

const handleFilterChange = (filters) => {
  console.log('🔍 [DEBUG] Filter change detected:', {
    newFilters: filters,
    currentActiveFilters: activeFilters.value,
    showFavoritesOnly: filters.showFavoritesOnly,
    isSignedIn: isSignedIn.value,
  });

  activeFilters.value = { ...activeFilters.value, ...filters };
  updateFiltersAndReload();
};

const clearFilters = () => {
  searchQuery.value = '';
  activeFilters.value = {
    serviceType: '',
    location: '',
    minRating: '',
    sortBy: 'rating',
    showFavoritesOnly: false,
  };
  updateFiltersAndReload();
};

const updateFiltersAndReload = async () => {
  // Lazy load favorites if the filter is active and user is signed in
  if (activeFilters.value.showFavoritesOnly && isSignedIn.value) {
    try {
      console.log(
        'ContractorListView: Favorites filter active, ensuring favorites are loaded...'
      );
      await getFavorites(); // From useFavoriteContractors
      await nextTick(); // Ensure reactive changes from getFavorites propagate
      console.log('ContractorListView: Favorites loaded/updated.');
    } catch (error) {
      console.warn(
        'ContractorListView: Failed to load favorites for filter:',
        error
      );
      // Optionally, handle this error, e.g., by turning off the favorites filter
      // activeFilters.value.showFavoritesOnly = false;
    }
  }

  // Convert UI filters to data layer format
  currentFilters.value = {
    search: searchQuery.value,
    serviceType: activeFilters.value.serviceType,
    location: activeFilters.value.location,
    minRating: activeFilters.value.minRating,
    sortBy: activeFilters.value.sortBy,
    sortOrder: 'desc',
    showFavoritesOnly: activeFilters.value.showFavoritesOnly,
    locationType: activeFilters.value.locationType,
    selectedDistricts: activeFilters.value.selectedDistricts,
    gpsLocation: activeFilters.value.gpsLocation,
    gpsRadius: activeFilters.value.gpsRadius,
  };

  // Reset state without triggering multiple renders (this part was from a previous fix)
  contractors.value = [];
  hasMore.value = true;
  // totalCount is handled by loadContractors

  await loadContractors(currentFilters.value); // From useContractorData
};

const loadMoreContractors = () => {
  loadMore(currentFilters.value);
};

// Watchers for reactive filtering (only for user interactions, not initial load)
watch(
  [searchQuery, activeFilters],
  (newValues, oldValues) => {
    console.log('🔍 [DEBUG] Watcher triggered!');
    console.log('🔍 [DEBUG] isMounted:', isMounted.value);
    console.log('🔍 [DEBUG] New values:', newValues);
    console.log('🔍 [DEBUG] Old values:', oldValues);
    console.log('🔍 [DEBUG] Current state:', {
      isLoading: isLoading.value,
      contractors: contractors.value.length,
      totalCount: totalCount.value,
    });

    // Only reload if component is already mounted to avoid double loading
    if (isMounted.value) {
      console.log('🔍 [DEBUG] Watcher calling updateFiltersAndReload...');
      updateFiltersAndReload();
    } else {
      console.log('🔍 [DEBUG] Watcher skipped - component not mounted yet');
    }
  },
  { deep: true, immediate: false }
);

// Watch isLoading state changes to track template rendering logic
watch(
  isLoading,
  (newValue, oldValue) => {
    console.log('🔍 [DEBUG] isLoading changed:', {
      from: oldValue,
      to: newValue,
      contractors: contractors.value.length,
      totalCount: totalCount.value,
      templateCondition1: !newValue && contractors.value.length > 0,
      templateCondition2: newValue,
      templateCondition3: !newValue && contractors.value.length === 0,
    });
  },
  { immediate: true }
);

// Watch contractors array changes
watch(
  contractors,
  (newValue, oldValue) => {
    console.log('🔍 [DEBUG] contractors array changed:', {
      from: oldValue?.length || 0,
      to: newValue?.length || 0,
      isLoading: isLoading.value,
      totalCount: totalCount.value,
    });
  },
  { immediate: true }
);

// Watch totalCount changes
watch(
  totalCount,
  (newValue, oldValue) => {
    console.log('🔍 [DEBUG] totalCount changed:', {
      from: oldValue,
      to: newValue,
      isLoading: isLoading.value,
      contractors: contractors.value.length,
    });
  },
  { immediate: true }
);

// Initial load
onMounted(async () => {
  console.log('🔍 [DEBUG] ContractorListView onMounted - START');
  console.log('🔍 [DEBUG] Initial state:', {
    isLoading: isLoading.value,
    contractors: contractors.value.length,
    totalCount: totalCount.value,
    isSignedIn: isSignedIn.value,
  });

  // Don't load favorites on mount to prevent flicker - they'll be loaded when needed

  console.log('🔍 [DEBUG] About to call updateFiltersAndReload...');
  await updateFiltersAndReload();
  console.log('🔍 [DEBUG] updateFiltersAndReload completed, final state:', {
    isLoading: isLoading.value,
    contractors: contractors.value.length,
    totalCount: totalCount.value,
  });

  // Mark as mounted to enable watchers
  isMounted.value = true;
  console.log(
    '🔍 [DEBUG] ContractorListView onMounted - END, isMounted set to true'
  );
});
</script>

<style scoped>
.contractor-list {
  min-height: 100vh;
}
</style>
