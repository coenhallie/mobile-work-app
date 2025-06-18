<template>
  <div class="mobile-filter-interface">
    <!-- Quick Actions Bar -->
    <div class="quick-actions-bar">
      <div class="flex items-center justify-between p-4 bg-card border-b">
        <div class="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            @click="toggleFilterModal"
            class="filter-trigger"
          >
            <Filter class="w-4 h-4 mr-2" />
            Filters
            <Badge
              v-if="activeFilterCount > 0"
              class="ml-2"
              variant="secondary"
            >
              {{ activeFilterCount }}
            </Badge>
          </Button>

          <Select v-model="sortBy" @update:model-value="handleSortChange">
            <SelectTrigger class="w-32">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="experience">Experience</SelectItem>
              <SelectItem value="distance">Distance</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="ghost"
          size="sm"
          @click="handleRefresh"
          class="refresh-btn"
        >
          <RotateCcw class="w-4 h-4" />
        </Button>
      </div>
    </div>

    <!-- Active Filter Chips -->
    <div v-if="activeFilterCount > 0" class="active-filters-mobile">
      <FilterChips
        :active-filters="filters"
        @remove-filter="removeFilter"
        @clear-all="clearAllFilters"
        class="p-4 bg-muted/50"
      />
    </div>

    <!-- Results Summary (Removed as per user request) -->
    <!--
    <div class="results-summary">
      <div class="px-4 py-2 text-sm text-muted-foreground bg-card border-b">
        <span v-if="isLoading">Loading contractors...</span>
        <span v-else>{{ resultCount }} contractors found</span>
      </div>
    </div>
    -->

    <!-- Filter Modal -->
    <Dialog :open="isFilterModalOpen" @update:open="updateFilterModalOpen">
      <DialogContent class="mobile-filter-modal">
        <DialogHeader>
          <DialogTitle>Filter Contractors</DialogTitle>
          <DialogDescription>
            Find the perfect contractor for your needs
          </DialogDescription>
        </DialogHeader>

        <div class="filter-sections">
          <!-- Search Section -->
          <div class="filter-section">
            <Label class="text-sm font-medium mb-3 block">Search</Label>
            <div class="relative">
              <Search
                class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
              />
              <Input
                v-model="localSearchQuery"
                placeholder="Search contractors, services..."
                class="pl-10"
                @input="handleSearchInput"
              />
            </div>
          </div>

          <!-- Service Filter (Removed - handled by main search) -->
          <!-- <div class="filter-section">
            <Label class="text-sm font-medium mb-3 block">Services</Label>
            <ServiceTypeFilter v-model="localFilters.services" />
          </div> -->

          <!-- Location Filter -->
          <div class="filter-section">
            <Label class="text-sm font-medium mb-3 block">Location</Label>
            <LocationFilter v-model="localFilters.locations" />
          </div>

          <!-- Rating Filter -->
          <div class="filter-section">
            <Label class="text-sm font-medium mb-3 block">Rating</Label>
            <RatingFilter v-model="localFilters.minRating" />
          </div>

          <!-- Experience Filter (Removed) -->
          <!-- <div class="filter-section">
            <Label class="text-sm font-medium mb-3 block">Experience</Label>
            <ExperienceFilter v-model="localFilters.experienceRange" />
          </div> -->

          <!-- Price Range Filter (Removed) -->
          <!-- <div class="filter-section">
            <Label class="text-sm font-medium mb-3 block">Price Range</Label>
            <PriceRangeFilter v-model="localFilters.priceRange" />
          </div> -->

          <!-- Availability Filter -->
          <div class="filter-section">
            <Label class="text-sm font-medium mb-3 block">Availability</Label>
            <AvailabilityFilter v-model="localFilters.availability" />
          </div>
        </div>

        <DialogFooter class="mobile-filter-footer">
          <Button variant="outline" @click="clearLocalFilters">
            Clear All
          </Button>
          <Button @click="applyLocalFilters" class="flex-1">
            Show {{ resultCount }} Results
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Filter, Search, RotateCcw } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Import filter components
import FilterChips from './FilterChips.vue';
// import ServiceTypeFilter from './ServiceTypeFilter.vue'; // Removed
import LocationFilter from './LocationFilter.vue';
import RatingFilter from './RatingFilter.vue';
// import ExperienceFilter from './ExperienceFilter.vue'; // Removed
// import PriceRangeFilter from './PriceRangeFilter.vue'; // Removed
import AvailabilityFilter from './AvailabilityFilter.vue';

const props = defineProps({
  filters: { type: Object, required: true },
  resultCount: { type: Number, default: 0 },
  contractorData: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
});

const emit = defineEmits([
  'filter-change',
  'search',
  'refresh',
  'quick-filter-applied',
]);

// State
const isFilterModalOpen = ref(false);
const sortBy = ref('rating');
const localSearchQuery = ref('');
const searchTimeout = ref(null);

// Local filters for modal
const localFilters = ref({
  services: [],
  locations: [],
  minRating: null,
  // experienceRange: null, // Removed
  // priceRange: null, // Removed
  availability: null,
});

// Computed
const activeFilterCount = computed(() => {
  let count = 0;
  if (props.filters.search) count++;
  if (props.filters.services?.length) count++;
  if (props.filters.locations?.length) count++;
  if (props.filters.minRating) count++;
  // if (props.filters.experienceRange) count++; // Removed
  // if (props.filters.priceRange) count++; // Removed
  if (props.filters.availability) count++;
  return count;
});

// Methods
const toggleFilterModal = () => {
  isFilterModalOpen.value = !isFilterModalOpen.value;
  if (isFilterModalOpen.value) {
    // Sync local filters with current filters
    localFilters.value = { ...props.filters };
    localSearchQuery.value = props.filters.search || '';
  }
};

const updateFilterModalOpen = (value) => {
  isFilterModalOpen.value = value;
};

const handleSortChange = (value) => {
  emit('filter-change', { ...props.filters, sortBy: value });
};

const handleRefresh = () => {
  emit('refresh');
};

const handleSearchInput = () => {
  clearTimeout(searchTimeout.value);
  searchTimeout.value = setTimeout(() => {
    emit('search', localSearchQuery.value);
  }, 300);
};

const removeFilter = (filterInfo) => {
  const newFilters = { ...props.filters };

  if (filterInfo.type === 'services') {
    newFilters.services = newFilters.services.filter(
      (s) => s !== filterInfo.value
    );
  } else if (filterInfo.type === 'locations') {
    newFilters.locations = newFilters.locations.filter(
      (l) => l !== filterInfo.value
    );
  } else {
    newFilters[filterInfo.type] = null;
  }

  emit('filter-change', newFilters);
};

const clearAllFilters = () => {
  const clearedFilters = {
    search: '',
    services: [],
    locations: [],
    minRating: null,
    // experienceRange: null, // Removed
    // priceRange: null, // Removed
    availability: null,
  };
  emit('filter-change', clearedFilters);
};

const clearLocalFilters = () => {
  localFilters.value = {
    services: [],
    locations: [],
    minRating: null,
    // experienceRange: null, // Removed
    // priceRange: null, // Removed
    availability: null,
  };
  localSearchQuery.value = '';
};

const applyLocalFilters = () => {
  const newFilters = {
    ...localFilters.value,
    search: localSearchQuery.value,
  };
  emit('filter-change', newFilters);
  isFilterModalOpen.value = false;
};

// Watch for external filter changes
watch(
  () => props.filters,
  (newFilters) => {
    localFilters.value = { ...newFilters };
    localSearchQuery.value = newFilters.search || '';
  },
  { deep: true }
);
</script>

<style scoped>
@reference "@/style.css";

.mobile-filter-interface {
  @apply bg-white dark:bg-gray-900;
}

.filter-trigger {
  @apply min-h-[44px];
}

.refresh-btn {
  @apply min-h-[44px] min-w-[44px];
}

.mobile-filter-modal {
  @apply fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-lg;
  @apply bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700;
}

.filter-sections {
  @apply flex-1 overflow-y-auto p-4 space-y-6 max-h-[60vh];
}

.filter-section {
  @apply space-y-3;
}

.mobile-filter-footer {
  @apply p-4 border-t border-gray-200 dark:border-gray-700 gap-3;
}

.active-filters-mobile {
  @apply border-b border-gray-200 dark:border-gray-700;
}

.results-summary {
  @apply border-b border-gray-200 dark:border-gray-700;
}
</style>
