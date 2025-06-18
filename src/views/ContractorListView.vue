<template>
  <div
    class="contractor-list w-full max-w-7xl mx-auto px-4 py-6 bg-white dark:bg-gray-900 min-h-screen"
  >
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-normal text-gray-900 dark:text-white mb-2">
        Find Contractors
      </h1>
      <p class="text-gray-600 dark:text-gray-400 text-sm">
        Browse and connect with skilled professionals in your area
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
      {{ totalCount }} contractors found
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
        <!-- Contractor Cards -->
        <ContractorCard
          v-for="contractor in contractors"
          :key="contractor.id"
          :contractor="contractor"
          @click="viewContractorProfile"
          @contact="handleContact"
        />

        <!-- Loading Skeletons -->
        <ContractorCardSkeleton
          v-for="n in skeletonCount"
          :key="`skeleton-${n}`"
          v-show="isLoading"
        />
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
import { getFavorites } from '@/composables/useFavoriteContractors';

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

const updateFiltersAndReload = () => {
  // Convert UI filters to data layer format
  currentFilters.value = {
    search: searchQuery.value,
    serviceType: activeFilters.value.serviceType,
    location: activeFilters.value.location, // This might be complex if using new location filters
    minRating: activeFilters.value.minRating,
    sortBy: activeFilters.value.sortBy,
    sortOrder: 'desc', // Assuming desc, adjust if sort order is also in activeFilters
    showFavoritesOnly: activeFilters.value.showFavoritesOnly,
    // Include new location filter properties from activeFilters if they exist
    locationType: activeFilters.value.locationType,
    selectedDistricts: activeFilters.value.selectedDistricts,
    gpsLocation: activeFilters.value.gpsLocation,
    gpsRadius: activeFilters.value.gpsRadius,
  };

  resetContractors();
  loadContractors(currentFilters.value);
};

const loadMoreContractors = () => {
  loadMore(currentFilters.value);
};

// Watchers for reactive filtering
watch(
  [searchQuery, activeFilters],
  () => {
    updateFiltersAndReload();
  },
  { deep: true }
);

// Initial load
onMounted(async () => {
  console.log('ContractorListView: onMounted started');

  // Load user's favorites first if signed in
  if (isSignedIn.value) {
    try {
      console.log('ContractorListView: Loading favorites...');
      await getFavorites();
      console.log(
        'ContractorListView: Favorites loaded, waiting for reactive state update...'
      );

      // Wait for reactive state to be properly updated
      await nextTick();
      console.log(
        'ContractorListView: Reactive state updated, proceeding with filters'
      );
    } catch (error) {
      console.warn('Failed to load favorites:', error);
    }
  }

  console.log('ContractorListView: Calling updateFiltersAndReload');
  updateFiltersAndReload();
});
</script>

<style scoped>
.contractor-list {
  min-height: 100vh;
}
</style>
