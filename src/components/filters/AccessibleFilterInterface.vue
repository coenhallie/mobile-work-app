<template>
  <div
    class="accessible-filter-interface"
    role="region"
    aria-label="Contractor filters"
  >
    <!-- Skip Link for Screen Readers -->
    <a
      href="#filter-results"
      class="skip-link"
      @focus="announceToScreenReader('Skip to filter results')"
    >
      Skip to results
    </a>

    <!-- Filter Status Announcement -->
    <div
      id="filter-status"
      class="sr-only"
      aria-live="polite"
      aria-atomic="true"
      ref="statusAnnouncement"
    >
      {{ statusMessage }}
    </div>

    <!-- Keyboard Shortcuts Help -->
    <div
      v-if="showKeyboardHelp"
      class="keyboard-help"
      role="dialog"
      aria-labelledby="keyboard-help-title"
      aria-describedby="keyboard-help-content"
    >
      <div class="help-content">
        <h3 id="keyboard-help-title" class="help-title">Keyboard Shortcuts</h3>
        <div id="keyboard-help-content" class="help-shortcuts">
          <div class="shortcut-item">
            <kbd>Tab</kbd> <span>Navigate between filters</span>
          </div>
          <div class="shortcut-item">
            <kbd>Space</kbd> <span>Toggle filter options</span>
          </div>
          <div class="shortcut-item">
            <kbd>Enter</kbd> <span>Apply selected filters</span>
          </div>
          <div class="shortcut-item">
            <kbd>Escape</kbd> <span>Close filter panel</span>
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl + /</kbd> <span>Show/hide this help</span>
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl + R</kbd> <span>Clear all filters</span>
          </div>
        </div>
        <Button
          @click="showKeyboardHelp = false"
          class="help-close-btn"
          aria-label="Close keyboard shortcuts help"
        >
          Close
        </Button>
      </div>
    </div>

    <!-- Main Filter Interface -->
    <div class="filter-main">
      <!-- Search Section -->
      <div class="filter-group" role="group" aria-labelledby="search-label">
        <Label id="search-label" for="contractor-search" class="group-label">
          Search Contractors
        </Label>
        <div class="search-container">
          <Input
            id="contractor-search"
            v-model="searchQuery"
            type="search"
            placeholder="Search by name, service, or location..."
            class="search-input"
            @input="handleSearchInput"
            @keydown="handleSearchKeydown"
            aria-describedby="search-help"
            :aria-expanded="showSearchSuggestions"
            aria-autocomplete="list"
            role="combobox"
            :aria-activedescendant="selectedSuggestionId"
          />
          <div id="search-help" class="sr-only">
            Type to search contractors. Use arrow keys to navigate suggestions.
          </div>

          <!-- Search Suggestions -->
          <div
            v-if="showSearchSuggestions && searchSuggestions.length"
            class="search-suggestions"
            role="listbox"
            aria-label="Search suggestions"
          >
            <div
              v-for="(suggestion, index) in searchSuggestions"
              :key="suggestion.id"
              :id="`suggestion-${index}`"
              class="suggestion-item"
              :class="{ selected: selectedSuggestionIndex === index }"
              role="option"
              :aria-selected="selectedSuggestionIndex === index"
              @click="selectSuggestion(suggestion)"
              @mouseenter="selectedSuggestionIndex = index"
            >
              {{ suggestion.text }}
            </div>
          </div>
        </div>
      </div>

      <!-- Filter Categories -->
      <div class="filter-categories">
        <!-- Service Type Filter -->
        <fieldset class="filter-fieldset" aria-describedby="services-help">
          <legend class="filter-legend">Service Types</legend>
          <div id="services-help" class="filter-help">
            Select one or more services you need
          </div>
          <div
            class="filter-options"
            role="group"
            aria-labelledby="services-legend"
          >
            <label
              v-for="service in availableServices"
              :key="service.id"
              class="filter-option-label"
              :class="{ 'high-contrast': highContrastMode }"
            >
              <input
                type="checkbox"
                :value="service.value"
                v-model="localFilters.services"
                class="filter-checkbox"
                @change="handleFilterChange('services')"
                :aria-describedby="`service-${service.id}-desc`"
              />
              <span class="checkbox-custom" aria-hidden="true"></span>
              <span class="option-text">{{ service.label }}</span>
              <span :id="`service-${service.id}-desc`" class="sr-only">
                {{ service.description }}
              </span>
            </label>
          </div>
        </fieldset>

        <!-- Location Filter -->
        <fieldset class="filter-fieldset" aria-describedby="location-help">
          <legend class="filter-legend">Locations</legend>
          <div id="location-help" class="filter-help">
            Choose areas where you need services
          </div>
          <div
            class="filter-options"
            role="group"
            aria-labelledby="location-legend"
          >
            <label
              v-for="location in availableLocations"
              :key="location.id"
              class="filter-option-label"
              :class="{ 'high-contrast': highContrastMode }"
            >
              <input
                type="checkbox"
                :value="location.value"
                v-model="localFilters.locations"
                class="filter-checkbox"
                @change="handleFilterChange('locations')"
              />
              <span class="checkbox-custom" aria-hidden="true"></span>
              <span class="option-text">{{ location.label }}</span>
            </label>
          </div>
        </fieldset>

        <!-- Rating Filter -->
        <fieldset class="filter-fieldset" aria-describedby="rating-help">
          <legend class="filter-legend">Minimum Rating</legend>
          <div id="rating-help" class="filter-help">
            Filter by contractor ratings (1-5 stars)
          </div>
          <div class="rating-slider-container">
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              v-model="localFilters.minRating"
              class="rating-slider"
              @input="handleFilterChange('rating')"
              aria-label="Minimum rating"
              :aria-valuetext="`${localFilters.minRating} stars or higher`"
            />
            <div class="rating-display" aria-live="polite">
              {{
                localFilters.minRating
                  ? `${localFilters.minRating}+ stars`
                  : 'Any rating'
              }}
            </div>
          </div>
        </fieldset>

        <!-- Experience Filter -->
        <fieldset class="filter-fieldset" aria-describedby="experience-help">
          <legend class="filter-legend">Years of Experience</legend>
          <div id="experience-help" class="filter-help">
            Filter by contractor experience level
          </div>
          <div class="experience-options">
            <label
              v-for="range in experienceRanges"
              :key="range.id"
              class="filter-option-label radio-label"
            >
              <input
                type="radio"
                :value="range.value"
                v-model="localFilters.experienceRange"
                name="experience"
                class="filter-radio"
                @change="handleFilterChange('experience')"
              />
              <span class="radio-custom" aria-hidden="true"></span>
              <span class="option-text">{{ range.label }}</span>
            </label>
          </div>
        </fieldset>

        <!-- Availability Filter -->
        <fieldset class="filter-fieldset" aria-describedby="availability-help">
          <legend class="filter-legend">Availability</legend>
          <div id="availability-help" class="filter-help">
            When do you need the service?
          </div>
          <div class="availability-options">
            <label
              v-for="option in availabilityOptions"
              :key="option.id"
              class="filter-option-label radio-label"
            >
              <input
                type="radio"
                :value="option.value"
                v-model="localFilters.availability"
                name="availability"
                class="filter-radio"
                @change="handleFilterChange('availability')"
              />
              <span class="radio-custom" aria-hidden="true"></span>
              <span class="option-text">{{ option.label }}</span>
            </label>
          </div>
        </fieldset>
      </div>

      <!-- Filter Actions -->
      <div class="filter-actions" role="group" aria-label="Filter actions">
        <Button
          @click="clearAllFilters"
          variant="outline"
          class="clear-btn"
          :disabled="!hasActiveFilters"
          aria-describedby="clear-help"
          @keydown="handleActionKeydown($event, 'clear')"
        >
          Clear All Filters
        </Button>
        <div id="clear-help" class="sr-only">
          Remove all active filters and show all contractors
        </div>

        <Button
          @click="applyFilters"
          class="apply-btn"
          aria-describedby="apply-help"
          @keydown="handleActionKeydown($event, 'apply')"
        >
          Apply Filters ({{ resultCount }} results)
        </Button>
        <div id="apply-help" class="sr-only">
          Apply selected filters to contractor list
        </div>
      </div>

      <!-- Active Filters Summary -->
      <div
        v-if="hasActiveFilters"
        class="active-filters-summary"
        role="region"
        aria-label="Active filters"
        aria-live="polite"
      >
        <h3 class="summary-title">Active Filters:</h3>
        <ul class="active-filters-list">
          <li
            v-for="filter in activeFiltersList"
            :key="filter.key"
            class="active-filter-item"
          >
            <span class="filter-label">{{ filter.label }}</span>
            <Button
              @click="removeFilter(filter)"
              variant="ghost"
              size="sm"
              class="remove-filter-btn"
              :aria-label="`Remove ${filter.label} filter`"
            >
              <X class="w-4 h-4" />
            </Button>
          </li>
        </ul>
      </div>
    </div>

    <!-- Accessibility Settings -->
    <div class="accessibility-controls">
      <Button
        @click="toggleHighContrast"
        variant="ghost"
        size="sm"
        class="contrast-btn"
        :aria-pressed="highContrastMode"
        aria-label="Toggle high contrast mode"
      >
        <Eye class="w-4 h-4 mr-2" />
        {{ highContrastMode ? 'Normal' : 'High' }} Contrast
      </Button>

      <Button
        @click="showKeyboardHelp = true"
        variant="ghost"
        size="sm"
        class="help-btn"
        aria-label="Show keyboard shortcuts"
      >
        <HelpCircle class="w-4 h-4 mr-2" />
        Keyboard Help
      </Button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { X, Eye, HelpCircle } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const props = defineProps({
  filters: { type: Object, required: true },
  resultCount: { type: Number, default: 0 },
  availableServices: { type: Array, default: () => [] },
  availableLocations: { type: Array, default: () => [] },
});

const emit = defineEmits(['filter-change', 'search', 'apply-filters']);

// State
const localFilters = ref({ ...props.filters });
const searchQuery = ref('');
const showSearchSuggestions = ref(false);
const selectedSuggestionIndex = ref(-1);
const searchSuggestions = ref([]);
const statusMessage = ref('');
const statusAnnouncement = ref(null);
const showKeyboardHelp = ref(false);
const highContrastMode = ref(false);

// Computed properties
const hasActiveFilters = computed(() => {
  return Object.values(localFilters.value).some((value) =>
    Array.isArray(value) ? value.length > 0 : value !== null && value !== ''
  );
});

const selectedSuggestionId = computed(() => {
  return selectedSuggestionIndex.value >= 0
    ? `suggestion-${selectedSuggestionIndex.value}`
    : null;
});

const activeFiltersList = computed(() => {
  const filters = [];

  if (localFilters.value.services?.length) {
    filters.push({
      key: 'services',
      label: `Services: ${localFilters.value.services.join(', ')}`,
      type: 'services',
    });
  }

  if (localFilters.value.locations?.length) {
    filters.push({
      key: 'locations',
      label: `Locations: ${localFilters.value.locations.join(', ')}`,
      type: 'locations',
    });
  }

  if (localFilters.value.minRating) {
    filters.push({
      key: 'rating',
      label: `Rating: ${localFilters.value.minRating}+ stars`,
      type: 'minRating',
    });
  }

  return filters;
});

// Filter options
const experienceRanges = ref([
  { id: 'exp-1', value: [0, 2], label: '0-2 years (Beginner)' },
  { id: 'exp-2', value: [3, 5], label: '3-5 years (Intermediate)' },
  { id: 'exp-3', value: [6, 10], label: '6-10 years (Experienced)' },
  { id: 'exp-4', value: [11, 20], label: '11+ years (Expert)' },
]);

const availabilityOptions = ref([
  { id: 'avail-1', value: 'immediate', label: 'Available immediately' },
  { id: 'avail-2', value: 'within_week', label: 'Within a week' },
  { id: 'avail-3', value: 'flexible', label: 'Flexible schedule' },
]);

// Methods
const announceToScreenReader = (message) => {
  statusMessage.value = message;

  // Clear after announcement
  setTimeout(() => {
    statusMessage.value = '';
  }, 1000);
};

const handleSearchInput = () => {
  // Simulate search suggestions
  if (searchQuery.value.length >= 2) {
    searchSuggestions.value = [
      { id: 1, text: `${searchQuery.value} contractors` },
      { id: 2, text: `${searchQuery.value} services` },
      { id: 3, text: `${searchQuery.value} in your area` },
    ];
    showSearchSuggestions.value = true;
  } else {
    showSearchSuggestions.value = false;
  }

  emit('search', searchQuery.value);
};

const handleSearchKeydown = (event) => {
  if (!showSearchSuggestions.value) return;

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      selectedSuggestionIndex.value = Math.min(
        selectedSuggestionIndex.value + 1,
        searchSuggestions.value.length - 1
      );
      announceToScreenReader(
        `Suggestion ${selectedSuggestionIndex.value + 1} of ${searchSuggestions.value.length}: ${searchSuggestions.value[selectedSuggestionIndex.value]?.text}`
      );
      break;
    case 'ArrowUp':
      event.preventDefault();
      selectedSuggestionIndex.value = Math.max(
        selectedSuggestionIndex.value - 1,
        -1
      );
      if (selectedSuggestionIndex.value >= 0) {
        announceToScreenReader(
          `Suggestion ${selectedSuggestionIndex.value + 1} of ${searchSuggestions.value.length}: ${searchSuggestions.value[selectedSuggestionIndex.value]?.text}`
        );
      }
      break;
    case 'Enter':
      event.preventDefault();
      if (selectedSuggestionIndex.value >= 0) {
        selectSuggestion(
          searchSuggestions.value[selectedSuggestionIndex.value]
        );
      }
      break;
    case 'Escape':
      showSearchSuggestions.value = false;
      selectedSuggestionIndex.value = -1;
      break;
  }
};

const selectSuggestion = (suggestion) => {
  searchQuery.value = suggestion.text;
  showSearchSuggestions.value = false;
  selectedSuggestionIndex.value = -1;
  announceToScreenReader(`Selected: ${suggestion.text}`);
  emit('search', suggestion.text);
};

const handleFilterChange = (filterType) => {
  announceToScreenReader(`${filterType} filter updated`);
  emit('filter-change', localFilters.value);
};

const handleActionKeydown = (event, action) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    if (action === 'clear') {
      clearAllFilters();
    } else if (action === 'apply') {
      applyFilters();
    }
  }
};

const clearAllFilters = () => {
  localFilters.value = {
    services: [],
    locations: [],
    minRating: null,
    experienceRange: null,
    availability: null,
  };
  searchQuery.value = '';
  announceToScreenReader('All filters cleared');
  emit('filter-change', localFilters.value);
};

const applyFilters = () => {
  announceToScreenReader(
    `Filters applied. ${props.resultCount} contractors found.`
  );
  emit('apply-filters', localFilters.value);
};

const removeFilter = (filter) => {
  if (filter.type === 'services' || filter.type === 'locations') {
    localFilters.value[filter.type] = [];
  } else {
    localFilters.value[filter.type] = null;
  }

  announceToScreenReader(`${filter.label} filter removed`);
  emit('filter-change', localFilters.value);
};

const toggleHighContrast = () => {
  highContrastMode.value = !highContrastMode.value;
  document.body.classList.toggle('high-contrast', highContrastMode.value);
  announceToScreenReader(
    `High contrast mode ${highContrastMode.value ? 'enabled' : 'disabled'}`
  );
};

// Keyboard shortcuts
const handleGlobalKeydown = (event) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case '/':
        event.preventDefault();
        showKeyboardHelp.value = !showKeyboardHelp.value;
        break;
      case 'r':
        event.preventDefault();
        clearAllFilters();
        break;
    }
  }

  if (event.key === 'Escape') {
    showKeyboardHelp.value = false;
    showSearchSuggestions.value = false;
  }
};

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown);

  // Load accessibility preferences
  const savedContrast = localStorage.getItem('high-contrast-mode');
  if (savedContrast === 'true') {
    toggleHighContrast();
  }
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown);
});

// Watch for changes
watch(
  () => props.filters,
  (newFilters) => {
    localFilters.value = { ...newFilters };
  },
  { deep: true }
);

watch(highContrastMode, (newValue) => {
  localStorage.setItem('high-contrast-mode', newValue.toString());
});
</script>

<style scoped>
.accessible-filter-interface {
  @apply space-y-6;
}

.skip-link {
  @apply absolute -top-10 left-4 bg-blue-600 text-white px-4 py-2 rounded;
  @apply focus:top-4 transition-all duration-200 z-50;
}

.sr-only {
  @apply absolute w-px h-px p-0 -m-px overflow-hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.keyboard-help {
  @apply fixed inset-0 bg-black/50 flex items-center justify-center z-50;
}

.help-content {
  @apply bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4;
  @apply border border-gray-200 dark:border-gray-700;
}

.help-title {
  @apply text-lg font-semibold mb-4;
}

.help-shortcuts {
  @apply space-y-2 mb-4;
}

.shortcut-item {
  @apply flex items-center justify-between;
}

.shortcut-item kbd {
  @apply bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono;
}

.help-close-btn {
  @apply w-full;
}

.filter-group {
  @apply space-y-3;
}

.group-label {
  @apply text-lg font-semibold;
}

.search-container {
  @apply relative;
}

.search-input {
  @apply w-full;
}

.search-suggestions {
  @apply absolute top-full left-0 right-0 bg-white dark:bg-gray-900;
  @apply border border-gray-200 dark:border-gray-700 rounded-b-lg;
  @apply max-h-48 overflow-y-auto z-10;
}

.suggestion-item {
  @apply px-4 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800;
}

.suggestion-item.selected {
  @apply bg-blue-50 dark:bg-blue-900/20;
}

.filter-fieldset {
  @apply border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3;
}

.filter-legend {
  @apply text-base font-medium px-2;
}

.filter-help {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.filter-options {
  @apply space-y-2;
}

.filter-option-label {
  @apply flex items-center gap-3 p-2 rounded cursor-pointer;
  @apply hover:bg-gray-50 dark:hover:bg-gray-800;
  @apply transition-colors duration-200;
}

.filter-option-label.high-contrast {
  @apply border-2 border-gray-400 bg-white text-black;
}

.filter-checkbox,
.filter-radio {
  @apply sr-only;
}

.checkbox-custom,
.radio-custom {
  @apply w-4 h-4 border-2 border-gray-300 dark:border-gray-600;
  @apply transition-all duration-200;
}

.checkbox-custom {
  @apply rounded;
}

.radio-custom {
  @apply rounded-full;
}

.filter-checkbox:checked + .checkbox-custom {
  @apply bg-blue-600 border-blue-600;
}

.filter-checkbox:checked + .checkbox-custom::after {
  content: '✓';
  @apply text-white text-xs flex items-center justify-center;
}

.filter-radio:checked + .radio-custom {
  @apply bg-blue-600 border-blue-600;
}

.filter-checkbox:focus + .checkbox-custom,
.filter-radio:focus + .radio-custom {
  @apply ring-2 ring-blue-500 ring-offset-2;
}

.option-text {
  @apply flex-1 text-sm;
}

.rating-slider-container {
  @apply space-y-2;
}

.rating-slider {
  @apply w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none;
  @apply focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
}

.rating-slider::-webkit-slider-thumb {
  @apply appearance-none w-4 h-4 bg-blue-600 rounded-full cursor-pointer;
}

.rating-display {
  @apply text-sm font-medium text-center;
}

.filter-actions {
  @apply flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700;
}

.clear-btn {
  @apply flex-1;
}

.apply-btn {
  @apply flex-1 bg-blue-600 hover:bg-blue-700 text-white;
}

.active-filters-summary {
  @apply bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4;
}

.summary-title {
  @apply font-medium mb-2;
}

.active-filters-list {
  @apply space-y-2;
}

.active-filter-item {
  @apply flex items-center justify-between bg-white dark:bg-gray-800;
  @apply rounded px-3 py-2 border border-gray-200 dark:border-gray-700;
}

.filter-label {
  @apply text-sm;
}

.remove-filter-btn {
  @apply h-6 w-6 p-0;
}

.accessibility-controls {
  @apply flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700;
}

.contrast-btn,
.help-btn {
  @apply text-sm;
}

/* High contrast mode styles */
:global(.high-contrast) .filter-option-label {
  @apply border-2 border-black bg-white text-black;
}

:global(.high-contrast) .filter-checkbox:checked + .checkbox-custom,
:global(.high-contrast) .filter-radio:checked + .radio-custom {
  @apply bg-black border-black;
}

/* Focus styles for better accessibility */
.filter-option-label:focus-within {
  @apply ring-2 ring-blue-500 ring-offset-2;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    @apply transition-none;
  }
}
</style>
