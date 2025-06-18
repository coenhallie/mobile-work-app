<template>
  <div class="minimal-filter-interface">
    <!-- Minimal Search Bar -->
    <div class="search-section">
      <MinimalSearchBar
        v-model="searchQuery"
        :placeholder="searchPlaceholder"
        :suggestions="searchSuggestions"
        :show-suggestions="showSearchSuggestions"
        :is-loading="isSearching"
        @search="handleSearch"
        @suggestion-selected="handleSuggestionSelected"
        @focus="handleSearchFocus"
        @blur="handleSearchBlur"
      />
    </div>

    <!-- Filter Pills Row -->
    <div class="filter-pills-section">
      <FilterPillsRow
        :show-more-pill="hasAdvancedFilters"
        :more-pill-label="morePillLabel"
        :is-more-active="showAdvancedFilters"
        @more-click="toggleAdvancedFilters"
        @scroll="handlePillsScroll"
      >
        <!-- Service Pills -->
        <FilterPill
          v-for="service in activeServices"
          :key="`service-${service}`"
          :label="service"
          :is-active="true"
          @remove="removeFilter('services', service)"
        />

        <!-- Location Pills -->
        <FilterPill
          v-for="location in activeLocations"
          :key="`location-${location}`"
          :label="location"
          :is-active="true"
          @remove="removeFilter('locations', location)"
        />

        <!-- Rating Pill -->
        <FilterPill
          v-if="filters.minRating"
          :key="'rating'"
          :label="`${filters.minRating}+ stars`"
          :is-active="true"
          @remove="removeFilter('minRating', null)"
        />

        <!-- Availability Pill -->
        <FilterPill
          v-if="filters.availability"
          :key="'availability'"
          :label="formatAvailability(filters.availability)"
          :is-active="true"
          @remove="removeFilter('availability', null)"
        />

        <!-- Quick Filter Pills (when no active filters) -->
        <template v-if="!hasActiveFilters">
          <FilterPill
            v-for="quickFilter in quickFilterOptions"
            :key="quickFilter.id"
            :label="quickFilter.label"
            :is-active="false"
            @click="applyQuickFilter(quickFilter)"
          />
        </template>
      </FilterPillsRow>
    </div>

    <!-- Advanced Filters Panel (Progressive Disclosure) -->
    <div
      v-if="showAdvancedFilters"
      class="advanced-filters-panel"
      :class="{ 'advanced-filters-panel--visible': showAdvancedFilters }"
    >
      <div class="advanced-filters-content">
        <div class="advanced-filters-header">
          <h3 class="advanced-filters-title">Advanced Filters</h3>
          <button
            @click="toggleAdvancedFilters"
            class="advanced-filters-close"
            aria-label="Close advanced filters"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="advanced-filters-grid">
          <!-- Location Filter -->
          <div class="filter-group">
            <label class="filter-label">Location</label>
            <LocationFilter
              v-model="filters.locations"
              @update:model-value="handleFilterChange"
            />
          </div>

          <!-- Rating Filter -->
          <div class="filter-group">
            <label class="filter-label">Minimum Rating</label>
            <RatingFilter
              v-model="filters.minRating"
              @update:model-value="handleFilterChange"
            />
          </div>

          <!-- Availability Filter -->
          <div class="filter-group">
            <label class="filter-label">Availability</label>
            <AvailabilityFilter
              v-model="filters.availability"
              @update:model-value="handleFilterChange"
            />
          </div>

          <!-- Sort Options -->
          <div class="filter-group">
            <label class="filter-label">Sort By</label>
            <select
              v-model="sortBy"
              @change="handleSortChange"
              class="sort-select"
            >
              <option value="rating">Highest Rated</option>
              <option value="experience">Most Experienced</option>
              <option value="distance">Nearest</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        <div class="advanced-filters-actions">
          <button
            @click="clearAllFilters"
            class="clear-all-button"
            :disabled="!hasActiveFilters"
          >
            Clear All
          </button>
          <button @click="applyAdvancedFilters" class="apply-filters-button">
            Apply Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Results Summary -->
    <div v-if="showResultsSummary" class="results-summary">
      <span class="results-count">
        {{ resultsCount }}
        {{ resultsCount === 1 ? 'contractor' : 'contractors' }} found
      </span>
      <button
        v-if="hasActiveFilters"
        @click="clearAllFilters"
        class="clear-filters-link"
      >
        Clear filters
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { X } from 'lucide-vue-next';
import MinimalSearchBar from './MinimalSearchBar.vue';
import FilterPill from './FilterPill.vue';
import FilterPillsRow from './FilterPillsRow.vue';
import LocationFilter from './LocationFilter.vue';
import RatingFilter from './RatingFilter.vue';
import AvailabilityFilter from './AvailabilityFilter.vue';

const props = defineProps({
  contractorData: {
    type: Array,
    default: () => [],
  },
  initialFilters: {
    type: Object,
    default: () => ({
      services: [],
      locations: [],
      minRating: null,
      availability: null,
    }),
  },
  resultsCount: {
    type: Number,
    default: 0,
  },
  showResultsSummary: {
    type: Boolean,
    default: true,
  },
  searchPlaceholder: {
    type: String,
    default: 'Search contractors, services, or locations...',
  },
});

const emit = defineEmits([
  'filters-changed',
  'search',
  'sort-changed',
  'suggestion-selected',
]);

// State
const searchQuery = ref('');
const filters = ref({ ...props.initialFilters });
const sortBy = ref('rating');
const showAdvancedFilters = ref(false);
const showSearchSuggestions = ref(false);
const isSearching = ref(false);

// Computed
const activeServices = computed(() => filters.value.services || []);
const activeLocations = computed(() => filters.value.locations || []);

const hasActiveFilters = computed(() => {
  return (
    activeServices.value.length > 0 ||
    activeLocations.value.length > 0 ||
    filters.value.minRating ||
    filters.value.availability
  );
});

const hasAdvancedFilters = computed(() => {
  // Show "More" pill if there are available advanced filter options
  return true; // Always show for now, can be made dynamic based on available filters
});

const morePillLabel = computed(() => {
  return showAdvancedFilters.value ? 'Less' : 'More';
});

const quickFilterOptions = computed(() => [
  {
    id: 'top-rated',
    label: 'Top Rated',
    filter: { minRating: 4.5 },
  },
  {
    id: 'available-now',
    label: 'Available Now',
    filter: { availability: 'immediate' },
  },
  {
    id: 'nearby',
    label: 'Nearby',
    filter: { sortBy: 'distance' },
  },
]);

const searchSuggestions = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < 2) return [];

  const query = searchQuery.value.toLowerCase();
  const suggestions = [];

  // Add contractor suggestions
  props.contractorData
    .filter((contractor) => contractor.full_name?.toLowerCase().includes(query))
    .slice(0, 3)
    .forEach((contractor) => {
      suggestions.push({
        text: contractor.full_name,
        category: 'Contractor',
        type: 'contractor',
        data: contractor,
      });
    });

  // Add service suggestions
  const services = new Set();
  props.contractorData.forEach((contractor) => {
    contractor.skills?.forEach((skill) => {
      if (skill.toLowerCase().includes(query)) {
        services.add(skill);
      }
    });
  });

  Array.from(services)
    .slice(0, 3)
    .forEach((service) => {
      suggestions.push({
        text: service,
        category: 'Service',
        type: 'service',
      });
    });

  return suggestions;
});

// Methods
const handleSearch = (query) => {
  searchQuery.value = query;
  isSearching.value = true;

  // Simulate search delay
  setTimeout(() => {
    isSearching.value = false;
  }, 300);

  emit('search', query);
};

const handleSuggestionSelected = (suggestion) => {
  if (suggestion.type === 'service') {
    // Add service to filters
    if (!filters.value.services.includes(suggestion.text)) {
      filters.value.services.push(suggestion.text);
      handleFilterChange();
    }
  }

  emit('suggestion-selected', suggestion);
};

const handleSearchFocus = () => {
  showSearchSuggestions.value = true;
};

const handleSearchBlur = () => {
  showSearchSuggestions.value = false;
};

const removeFilter = (type, value) => {
  if (type === 'services') {
    filters.value.services = filters.value.services.filter((s) => s !== value);
  } else if (type === 'locations') {
    filters.value.locations = filters.value.locations.filter(
      (l) => l !== value
    );
  } else {
    filters.value[type] = null;
  }

  handleFilterChange();
};

const applyQuickFilter = (quickFilter) => {
  Object.assign(filters.value, quickFilter.filter);

  if (quickFilter.filter.sortBy) {
    sortBy.value = quickFilter.filter.sortBy;
    emit('sort-changed', sortBy.value);
  }

  handleFilterChange();
};

const handleFilterChange = () => {
  emit('filters-changed', { ...filters.value });
};

const handleSortChange = () => {
  emit('sort-changed', sortBy.value);
};

const toggleAdvancedFilters = () => {
  showAdvancedFilters.value = !showAdvancedFilters.value;
};

const applyAdvancedFilters = () => {
  handleFilterChange();
  showAdvancedFilters.value = false;
};

const clearAllFilters = () => {
  filters.value = {
    services: [],
    locations: [],
    minRating: null,
    availability: null,
  };
  searchQuery.value = '';
  handleFilterChange();
  emit('search', '');
};

const formatAvailability = (availability) => {
  const availabilityMap = {
    immediate: 'Available Now',
    within_week: 'Within a Week',
    flexible: 'Flexible Schedule',
  };
  return availabilityMap[availability] || availability;
};

const handlePillsScroll = (scrollData) => {
  // Handle scroll events if needed for analytics or UX
};

// Watch for external filter changes
watch(
  () => props.initialFilters,
  (newFilters) => {
    filters.value = { ...newFilters };
  },
  { deep: true }
);
</script>

<style scoped>
.minimal-filter-interface {
  @apply space-y-4;
}

.search-section {
  @apply w-full;
}

.filter-pills-section {
  @apply w-full;
}

/* Advanced Filters Panel */
.advanced-filters-panel {
  @apply fixed inset-x-0 bottom-0 z-50;
  @apply bg-white border-t border-gray-200 shadow-xl;
  @apply transform translate-y-full transition-transform duration-300 ease-out;
}

.advanced-filters-panel--visible {
  @apply translate-y-0;
}

.advanced-filters-content {
  @apply p-6 max-h-96 overflow-y-auto;
}

.advanced-filters-header {
  @apply flex items-center justify-between mb-6;
}

.advanced-filters-title {
  @apply text-lg font-semibold text-gray-900;
}

.advanced-filters-close {
  @apply p-2 rounded-full hover:bg-gray-100;
  @apply transition-colors duration-150;
}

.advanced-filters-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6 mb-6;
}

.filter-group {
  @apply space-y-2;
}

.filter-label {
  @apply block text-sm font-medium text-gray-700;
}

.sort-select {
  @apply w-full px-3 py-2 border border-gray-200 rounded-lg;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
  @apply bg-white text-gray-900;
}

.advanced-filters-actions {
  @apply flex gap-3 pt-4 border-t border-gray-200;
}

.clear-all-button {
  @apply px-4 py-2 text-gray-600 hover:text-gray-800;
  @apply transition-colors duration-150;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.apply-filters-button {
  @apply flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg;
  @apply hover:bg-blue-700 transition-colors duration-150;
  @apply font-medium;
}

/* Results Summary */
.results-summary {
  @apply flex items-center justify-between text-sm text-gray-600;
  @apply pt-2 border-t border-gray-100;
}

.results-count {
  @apply font-medium;
}

.clear-filters-link {
  @apply text-blue-600 hover:text-blue-700;
  @apply transition-colors duration-150;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .advanced-filters-panel {
    @apply bg-gray-800 border-gray-700;
  }

  .advanced-filters-title {
    @apply text-gray-100;
  }

  .advanced-filters-close {
    @apply hover:bg-gray-700 text-gray-400;
  }

  .filter-label {
    @apply text-gray-300;
  }

  .sort-select {
    @apply bg-gray-700 border-gray-600 text-gray-100;
    @apply focus:ring-blue-400 focus:border-blue-400;
  }

  .clear-all-button {
    @apply text-gray-400 hover:text-gray-200;
  }

  .results-summary {
    @apply text-gray-400 border-gray-700;
  }

  .clear-filters-link {
    @apply text-blue-400 hover:text-blue-300;
  }
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .advanced-filters-panel {
    @apply inset-x-4 bottom-4 rounded-xl;
    @apply max-h-80;
  }

  .advanced-filters-content {
    @apply p-4;
  }

  .advanced-filters-grid {
    @apply grid-cols-1 gap-4;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .advanced-filters-panel {
    @apply transition-none;
  }
}
</style>
