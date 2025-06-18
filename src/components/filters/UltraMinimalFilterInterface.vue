<template>
  <div class="ultra-minimal-filter">
    <!-- Minimal Search Input -->
    <div class="search-section">
      <div class="search-container">
        <div class="search-icon">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <input
          v-model="searchQuery"
          :placeholder="searchPlaceholder"
          class="search-input"
          type="text"
          @input="handleSearchInput"
          @focus="showSuggestions = true"
          @blur="handleSearchBlur"
        />
        <button v-if="searchQuery" @click="clearSearch" class="clear-button">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Filter Pills Row -->
    <div class="pills-section" v-if="hasActiveFilters || showQuickFilters">
      <div class="pills-container">
        <!-- Active Filter Pills -->
        <template v-if="hasActiveFilters">
          <div
            v-for="service in activeServices"
            :key="`service-${service}`"
            class="filter-pill active"
          >
            <span>{{ service }}</span>
            <button
              @click="removeFilter('services', service)"
              class="remove-btn"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div
            v-for="location in activeLocations"
            :key="`location-${location}`"
            class="filter-pill active"
          >
            <span>{{ location }}</span>
            <button
              @click="removeFilter('locations', location)"
              class="remove-btn"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div v-if="filters.minRating" class="filter-pill active">
            <span>{{ filters.minRating }}+ stars</span>
            <button @click="removeFilter('minRating', null)" class="remove-btn">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div v-if="filters.availability" class="filter-pill active">
            <span>{{ formatAvailability(filters.availability) }}</span>
            <button
              @click="removeFilter('availability', null)"
              class="remove-btn"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </template>

        <!-- Quick Filter Pills (when no active filters) -->
        <template v-else-if="showQuickFilters">
          <button
            v-for="quickFilter in quickFilterOptions"
            :key="quickFilter.id"
            @click="applyQuickFilter(quickFilter)"
            class="filter-pill"
          >
            {{ quickFilter.label }}
          </button>
        </template>

        <!-- More Filters Button -->
        <button
          v-if="hasActiveFilters"
          @click="toggleAdvancedFilters"
          class="filter-pill more-pill"
        >
          {{ showAdvancedFilters ? 'Less' : 'More' }}
        </button>
      </div>
    </div>

    <!-- Advanced Filters Panel -->
    <div v-if="showAdvancedFilters" class="advanced-panel">
      <div class="panel-content">
        <div class="panel-header">
          <span class="panel-title">Filters</span>
          <button @click="toggleAdvancedFilters" class="close-btn">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div class="filter-groups">
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
            <label class="filter-label">Rating</label>
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
            <label class="filter-label">Sort</label>
            <select
              v-model="sortBy"
              @change="handleSortChange"
              class="sort-select"
            >
              <option value="rating">Highest Rated</option>
              <option value="experience">Most Experienced</option>
              <option value="distance">Nearest</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>

        <div class="panel-actions">
          <button
            @click="clearAllFilters"
            class="action-btn secondary"
            :disabled="!hasActiveFilters"
          >
            Clear All
          </button>
          <button @click="applyAdvancedFilters" class="action-btn primary">
            Apply
          </button>
        </div>
      </div>
    </div>

    <!-- Results Summary -->
    <div v-if="showResultsSummary && resultsCount > 0" class="results-summary">
      {{ resultsCount }} {{ resultsCount === 1 ? 'contractor' : 'contractors' }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
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
    default: 'Search contractors...',
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
const showSuggestions = ref(false);
const showQuickFilters = ref(true);

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

// Methods
const handleSearchInput = () => {
  emit('search', searchQuery.value);
  showQuickFilters.value = !searchQuery.value;
};

const handleSearchBlur = () => {
  setTimeout(() => {
    showSuggestions.value = false;
  }, 150);
};

const clearSearch = () => {
  searchQuery.value = '';
  showQuickFilters.value = true;
  emit('search', '');
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
  showQuickFilters.value = false;
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
  showQuickFilters.value = true;
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
.ultra-minimal-filter > * + * {
  margin-top: 0.75rem;
}

/* Search Section */
.search-section {
  width: 100%;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 9999px;
  transition: all 0.2s;
  min-height: 40px;
}

.search-container:hover {
  border-color: #9ca3af;
}

.search-container:focus-within {
  border-color: #6b7280;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  color: #9ca3af;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.5rem 2.5rem;
  background-color: transparent;
  color: #111827;
  border: 0;
  outline: none;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.search-input::placeholder {
  color: #6b7280;
}

.clear-button {
  position: absolute;
  right: 0.75rem;
  color: #9ca3af;
  transition: color 0.15s;
}

.clear-button:hover {
  color: #4b5563;
}

/* Pills Section */
.pills-section {
  width: 100%;
}

.pills-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 400;
  transition: all 0.15s;
  border: 1px solid #d1d5db;
  background-color: transparent;
  color: #4b5563;
  min-height: 32px;
  cursor: pointer;
}

.filter-pill:hover {
  border-color: #9ca3af;
  background-color: #f9fafb;
}

.filter-pill:focus {
  outline: none;
  box-shadow: 0 0 0 1px #9ca3af;
}

.filter-pill.active {
  background-color: #111827;
  color: white;
  border-color: #111827;
}

.filter-pill.active:hover {
  background-color: #1f2937;
  border-color: #1f2937;
}

.filter-pill.more-pill {
  border-style: dashed;
  border-color: #9ca3af;
  color: #6b7280;
}

.filter-pill.more-pill:hover {
  border-color: #6b7280;
  color: #4b5563;
}

.remove-btn {
  margin-left: 0.25rem;
  color: rgba(255, 255, 255, 0.7);
  transition: color 0.15s;
}

.remove-btn:hover {
  color: white;
}

/* Advanced Panel */
.advanced-panel {
  position: relative; /* Changed from fixed */
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  background-color: white;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -10px 25px -3px rgba(0, 0, 0, 0.1);
  transform: translateY(0);
  transition: transform 0.3s ease-out;
  margin-top: 1rem; /* Add some space above */
}

.panel-content {
  padding: 1.5rem;
  /* max-height: 24rem; */ /* Removed max-height */
  overflow-y: auto;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.panel-title {
  font-size: 1.125rem;
  font-weight: 500;
  color: #111827;
}

.close-btn {
  padding: 0.5rem;
  color: #9ca3af;
  transition: color 0.15s;
}

.close-btn:hover {
  color: #4b5563;
}

.filter-groups {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .filter-groups {
    grid-template-columns: 1fr 1fr;
  }
}

.filter-group > * + * {
  margin-top: 0.5rem;
}

.filter-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.sort-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background-color: white;
  color: #111827;
  font-size: 0.875rem;
}

.sort-select:focus {
  outline: none;
  box-shadow: 0 0 0 1px #9ca3af;
  border-color: #9ca3af;
}

.panel-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.action-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition:
    color 0.15s,
    background-color 0.15s;
  cursor: pointer;
  border: none;
}

.action-btn.secondary {
  color: #4b5563;
  background-color: transparent;
}

.action-btn.secondary:hover {
  color: #1f2937;
}

.action-btn.secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.primary {
  flex: 1;
  background-color: #111827;
  color: white;
}

.action-btn.primary:hover {
  background-color: #1f2937;
}

/* Results Summary */
.results-summary {
  font-size: 0.875rem;
  color: #6b7280;
  padding-top: 0.5rem;
  /* border-top: 1px solid #f3f4f6; */ /* Removed to fix white line issue */
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .search-container {
    background-color: #1f2937; /* gray-800 */
    border-color: #4b5563; /* gray-600 */
  }

  .search-container:hover {
    border-color: #6b7280; /* gray-500 */
  }

  .search-container:focus-within {
    border-color: #9ca3af; /* gray-400 */
  }

  .search-input {
    color: #f3f4f6; /* gray-100 */
  }

  .search-input::placeholder {
    color: #9ca3af; /* gray-400 */
  }

  .clear-button {
    color: #9ca3af; /* gray-400 */
  }
  .clear-button:hover {
    color: #d1d5db; /* gray-300 */
  }

  .filter-pill {
    border-color: #4b5563; /* gray-600 */
    color: #d1d5db; /* gray-300 */
    background-color: #374151; /* gray-700 */
  }

  .filter-pill:hover {
    border-color: #6b7280; /* gray-500 */
    background-color: #4b5563; /* gray-600 */
  }

  .filter-pill.active {
    background-color: #f9fafb; /* gray-50 */
    color: #1f2937; /* gray-800 */
    border-color: #f9fafb; /* gray-50 */
  }

  .filter-pill.active:hover {
    background-color: #e5e7eb; /* gray-200 */
    border-color: #e5e7eb; /* gray-200 */
  }

  .filter-pill.more-pill {
    border-color: #6b7280; /* gray-500 */
    color: #9ca3af; /* gray-400 */
  }

  .filter-pill.more-pill:hover {
    border-color: #9ca3af; /* gray-400 */
    color: #d1d5db; /* gray-300 */
  }

  .remove-btn {
    color: rgba(31, 41, 55, 0.7); /* gray-800 with opacity */
  }
  .remove-btn:hover {
    color: #1f2937; /* gray-800 */
  }

  .advanced-panel {
    background-color: #1f2937; /* gray-800 */
    border-color: #374151; /* gray-700 */
  }

  .panel-title {
    color: #f3f4f6; /* gray-100 */
  }

  .close-btn {
    color: #9ca3af; /* gray-400 */
  }
  .close-btn:hover {
    color: #d1d5db; /* gray-300 */
  }

  .filter-label {
    color: #d1d5db; /* gray-300 */
  }

  .sort-select {
    background-color: #374151; /* gray-700 */
    border-color: #4b5563; /* gray-600 */
    color: #f3f4f6; /* gray-100 */
  }

  .sort-select:focus {
    border-color: #6b7280; /* gray-500 */
  }

  .panel-actions {
    border-color: #374151; /* gray-700 */
  }

  .action-btn.secondary {
    color: #d1d5db; /* gray-300 */
  }
  .action-btn.secondary:hover {
    color: #f9fafb; /* gray-50 */
  }

  .action-btn.primary {
    background-color: #f9fafb; /* gray-50 */
    color: #1f2937; /* gray-800 */
  }
  .action-btn.primary:hover {
    background-color: #e5e7eb; /* gray-200 */
  }

  .results-summary {
    color: #9ca3af; /* gray-400 */
    /* border-color: #374151; */ /* gray-700 */ /* Removed to fix white line issue */
  }
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .advanced-panel {
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
    border-radius: 0.75rem;
    /* max-height: 20rem; */ /* Removed max-height */
  }

  .panel-content {
    padding: 1rem;
  }

  .filter-groups {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .filter-pill,
  .search-container,
  .clear-button,
  .remove-btn,
  .close-btn,
  .action-btn {
    transition: none;
  }

  .advanced-panel {
    animation: none;
  }
}
</style>
