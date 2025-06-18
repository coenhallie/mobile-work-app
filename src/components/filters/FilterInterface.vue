<template>
  <div class="filter-interface">
    <!-- Ultra Minimal Filter Interface -->
    <div class="ultra-minimal-filter-section mb-6">
      <UltraMinimalFilterInterface
        :contractor-data="contractorData"
        :initial-filters="filters"
        :results-count="filteredContractors.length"
        @filters-changed="handleFiltersChanged"
        @search="handleSearch"
        @sort-changed="handleSortChange"
        @suggestion-selected="handleSuggestionSelected"
      />
    </div>

    <!-- Quick Filters (Mobile/Tablet) -->
    <div class="quick-filters md:hidden mb-4">
      <div class="flex gap-2 items-center">
        <Button
          variant="outline"
          size="sm"
          @click="toggleFilterPanel"
          class="filter-trigger"
        >
          <Filter class="w-4 h-4 mr-2" />
          Filters
          <Badge v-if="activeFilterCount > 0" class="ml-2" variant="secondary">
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
    </div>

    <!-- Desktop Sidebar Filters -->
    <div class="desktop-filters hidden md:block">
      <div class="bg-card rounded-lg border p-4 space-y-6">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Filters</h3>
          <Button
            v-if="activeFilterCount > 0"
            variant="ghost"
            size="sm"
            @click="clearAllFilters"
            class="text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </div>

        <!-- Service Filter (Removed - handled by main search) -->
        <!-- <div class="filter-section">
          <Label class="text-sm font-medium mb-3 block">Services</Label>
          <ServiceTypeFilter
            v-model="filters.services"
            @update:model-value="handleFilterChange"
          />
        </div> -->

        <!-- Location Filter -->
        <div class="filter-section">
          <Label class="text-sm font-medium mb-3 block">Location</Label>
          <LocationFilter
            v-model="filters.locations"
            @update:model-value="handleFilterChange"
          />
        </div>

        <!-- Rating Filter -->
        <div class="filter-section">
          <Label class="text-sm font-medium mb-3 block">Rating</Label>
          <RatingFilter
            v-model="filters.minRating"
            @update:model-value="handleFilterChange"
          />
        </div>

        <!-- Experience Filter (Removed) -->

        <!-- Price Range Filter (Removed) -->

        <!-- Availability Filter -->
        <div class="filter-section">
          <Label class="text-sm font-medium mb-3 block">Availability</Label>
          <AvailabilityFilter
            v-model="filters.availability"
            @update:model-value="handleFilterChange"
          />
        </div>

        <!-- Results Count -->
        <div class="pt-4 border-t">
          <p class="text-sm text-muted-foreground">
            <span v-if="isLoading">Loading...</span>
            <span v-else>{{ resultCount }} contractors found</span>
          </p>
        </div>
      </div>
    </div>

    <!-- Mobile Bottom Sheet -->
    <Dialog :open="isFilterPanelOpen" @update:open="updateFilterPanelOpen">
      <DialogContent class="bottom-sheet-content">
        <DialogHeader class="bottom-sheet-header">
          <DialogTitle>Filter Contractors</DialogTitle>
          <DialogDescription>
            Find the perfect contractor for your needs
          </DialogDescription>
        </DialogHeader>

        <div class="filter-sections">
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

          <!-- Experience Filter -->
          <div class="filter-section">
            <Label class="text-sm font-medium mb-3 block">Experience</Label>
            <!-- <ExperienceFilter v-model="localFilters.experienceRange" /> -->
          </div>

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

        <DialogFooter class="bottom-sheet-footer">
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
import { ref, computed, watch, onMounted } from 'vue';
import { Filter } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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

// Import ultra minimal filter components
import UltraMinimalFilterInterface from './UltraMinimalFilterInterface.vue';
import LocationFilter from './LocationFilter.vue';
import RatingFilter from './RatingFilter.vue';
import AvailabilityFilter from './AvailabilityFilter.vue';

const props = defineProps({
  resultCount: { type: Number, default: 0 },
  isLoading: { type: Boolean, default: false },
  contractorData: { type: Array, default: () => [] },
  userLocation: { type: String, default: null },
  showAnalytics: { type: Boolean, default: false },
});

const emit = defineEmits([
  'filter-change',
  'search',
  'sort-change',
  'preset-applied',
  'suggestion-selected',
  'quick-filter-applied',
]);

// State
const searchQuery = ref('');
const sortBy = ref('rating');
const isFilterPanelOpen = ref(false);

// Main filters state
const filters = ref({
  services: [],
  locations: [],
  minRating: null,
  // experienceRange: null, // Removed
  // priceRange: null, // Removed
  availability: null,
});

// Local filters for mobile modal
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
  if (filters.value.services.length) count++;
  if (filters.value.locations.length) count++;
  if (filters.value.minRating) count++;
  // if (filters.value.experienceRange) count++; // Removed
  // if (filters.value.priceRange) count++; // Removed
  if (filters.value.availability) count++;
  return count;
});

// Watch for external filter changes
watch(
  () => filters.value,
  (newFilters) => {
    localFilters.value = { ...newFilters };
  },
  { deep: true }
);

// Enhanced methods for new functionality
const handlePresetApplied = (presetFilters) => {
  filters.value = { ...filters.value, ...presetFilters };
  localFilters.value = { ...filters.value };
  emit('preset-applied', presetFilters);
  emit('filter-change', filters.value);
};

const handleSearch = (query) => {
  searchQuery.value = query;
  emit('search', query);
};

const handleSuggestionSelected = (suggestion) => {
  emit('suggestion-selected', suggestion);

  // Apply suggestion-based filters
  if (suggestion.type === 'service') {
    const currentServices = [...filters.value.services];
    if (!currentServices.includes(suggestion.text)) {
      currentServices.push(suggestion.text);
      filters.value.services = currentServices;
      localFilters.value.services = currentServices;
      emit('filter-change', filters.value);
    }
  } else if (suggestion.type === 'location') {
    const currentLocations = [...filters.value.locations];
    if (!currentLocations.includes(suggestion.text)) {
      currentLocations.push(suggestion.text);
      filters.value.locations = currentLocations;
      localFilters.value.locations = currentLocations;
      emit('filter-change', filters.value);
    }
  }
};

const handleQuickFilterApplied = (quickFilter) => {
  filters.value = { ...filters.value, ...quickFilter.filter };
  localFilters.value = { ...filters.value };
  emit('quick-filter-applied', quickFilter);
  emit('filter-change', filters.value);
};

// New handlers for MinimalFilterInterface
const handleFiltersChanged = (newFilters) => {
  filters.value = { ...newFilters };
  localFilters.value = { ...newFilters };
  emit('filter-change', filters.value);
};

const handleSortChange = (newSortBy) => {
  sortBy.value = newSortBy;
  emit('sort-change', newSortBy);
};

// Computed for filtered contractors (needed by MinimalFilterInterface)
const filteredContractors = computed(() => {
  // This should be passed from parent component or computed based on filters
  // For now, return the contractor data as-is
  return props.contractorData || [];
});

// Debounced search (kept for compatibility)
let searchTimeout;
const handleSearchInput = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    emit('search', searchQuery.value);
  }, 300);
};

// Methods
const toggleFilterPanel = () => {
  isFilterPanelOpen.value = !isFilterPanelOpen.value;
};

const updateFilterPanelOpen = (value) => {
  isFilterPanelOpen.value = value;
};

const handleFilterChange = () => {
  emit('filter-change', filters.value);
};

const clearAllFilters = () => {
  filters.value = {
    services: [],
    locations: [],
    minRating: null,
    // experienceRange: null, // Removed
    // priceRange: null, // Removed
    availability: null,
  };
  localFilters.value = { ...filters.value };
  searchQuery.value = '';
  handleFilterChange();
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
};

const applyLocalFilters = () => {
  filters.value = { ...localFilters.value };
  handleFilterChange();
  isFilterPanelOpen.value = false;
};

// Initialize component
onMounted(() => {
  // Load any saved filter preferences
  try {
    const savedFilters = localStorage.getItem('contractor-filter-preferences');
    if (savedFilters) {
      const parsed = JSON.parse(savedFilters);
      // Apply non-intrusive saved preferences (like sort order)
      if (parsed.sortBy) {
        sortBy.value = parsed.sortBy;
      }
    }
  } catch (error) {
    console.error('Error loading filter preferences:', error);
  }
});

// Save filter preferences
watch([sortBy], () => {
  try {
    const preferences = {
      sortBy: sortBy.value,
    };
    localStorage.setItem(
      'contractor-filter-preferences',
      JSON.stringify(preferences)
    );
  } catch (error) {
    console.error('Error saving filter preferences:', error);
  }
});
</script>

<style scoped>
@reference "@/style.css";

.filter-interface {
  @apply space-y-4;
}

.filter-section {
  @apply space-y-3;
}

.bottom-sheet-content {
  @apply fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-lg;
  @apply bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700;
  @apply transform transition-transform duration-300 ease-out;
}

.bottom-sheet-header {
  @apply p-4 border-b border-gray-200 dark:border-gray-700;
}

.filter-sections {
  @apply flex-1 overflow-y-auto p-4 space-y-6;
}

.bottom-sheet-footer {
  @apply p-4 border-t border-gray-200 dark:border-gray-700 gap-3;
}

.filter-trigger {
  @apply min-h-[44px];
}
</style>
