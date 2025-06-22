<template>
  <div class="minimal-search-bar" :class="containerClasses">
    <div class="search-input-container">
      <div class="search-icon-wrapper">
        <Search class="search-icon" />
      </div>

      <input
        ref="searchInput"
        v-model="searchQuery"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-label="ariaLabel"
        class="search-input"
        type="text"
        autocomplete="off"
        spellcheck="false"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
      />

      <button
        v-if="searchQuery && showClearButton"
        @click="clearSearch"
        class="clear-button"
        :aria-label="clearAriaLabel"
        type="button"
      >
        <X class="w-4 h-4" />
      </button>

      <div v-if="isLoading" class="loading-indicator">
        <div class="loading-spinner"></div>
      </div>
    </div>

    <!-- Search suggestions dropdown -->
    <div
      v-if="showSuggestions && (suggestions.length > 0 || showNoResults)"
      class="suggestions-dropdown"
      @mousedown.prevent
    >
      <div v-if="suggestions.length > 0" class="suggestions-list">
        <button
          v-for="(suggestion, index) in suggestions"
          :key="`suggestion-${index}`"
          :class="suggestionClasses(index)"
          @click="selectSuggestion(suggestion)"
          @mouseenter="selectedIndex = index"
          type="button"
        >
          <component :is="suggestion.icon || Search" class="suggestion-icon" />
          <span
            class="suggestion-text"
            v-html="highlightMatch(suggestion.text, searchQuery)"
          ></span>
          <span v-if="suggestion.category" class="suggestion-category">
            {{ suggestion.category }}
          </span>
        </button>
      </div>

      <div v-else-if="showNoResults" class="no-results">
        <Search class="no-results-icon" />
        <span class="no-results-text">No suggestions found</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue';
import { Search, X } from 'lucide-vue-next';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Search...',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  suggestions: {
    type: Array,
    default: () => [],
  },
  showSuggestions: {
    type: Boolean,
    default: false,
  },
  showClearButton: {
    type: Boolean,
    default: true,
  },
  showNoResults: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['sm', 'default', 'lg'].includes(value),
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'minimal', 'bordered'].includes(value),
  },
  debounceMs: {
    type: Number,
    default: 300,
  },
});

const emit = defineEmits([
  'update:modelValue',
  'search',
  'focus',
  'blur',
  'suggestion-selected',
  'clear',
]);

// Refs
const searchInput = ref(null);
const searchQuery = ref(props.modelValue);
const selectedIndex = ref(-1);
const debounceTimeout = ref(null);

// Computed
const containerClasses = computed(() => [
  'minimal-search-bar',
  {
    'minimal-search-bar--sm': props.size === 'sm',
    'minimal-search-bar--lg': props.size === 'lg',
    'minimal-search-bar--minimal': props.variant === 'minimal',
    'minimal-search-bar--bordered': props.variant === 'bordered',
    'minimal-search-bar--disabled': props.disabled,
    'minimal-search-bar--loading': props.isLoading,
  },
]);

const ariaLabel = computed(() => {
  return `Search input. ${props.placeholder}`;
});

const clearAriaLabel = computed(() => {
  return `Clear search query: ${searchQuery.value}`;
});

const suggestionClasses = (index) => [
  'suggestion-item',
  {
    'suggestion-item--selected': selectedIndex.value === index,
  },
];

// Methods
const handleInput = () => {
  clearTimeout(debounceTimeout.value);

  debounceTimeout.value = setTimeout(() => {
    emit('update:modelValue', searchQuery.value);
    emit('search', searchQuery.value);
  }, props.debounceMs);

  selectedIndex.value = -1;
};

const handleFocus = () => {
  emit('focus');
};

const handleBlur = () => {
  // Delay to allow for suggestion clicks
  setTimeout(() => {
    emit('blur');
  }, 150);
};

const handleKeydown = (event) => {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      if (props.suggestions.length > 0) {
        selectedIndex.value = Math.min(
          selectedIndex.value + 1,
          props.suggestions.length - 1
        );
      }
      break;

    case 'ArrowUp':
      event.preventDefault();
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1);
      break;

    case 'Enter':
      event.preventDefault();
      if (selectedIndex.value >= 0 && props.suggestions[selectedIndex.value]) {
        selectSuggestion(props.suggestions[selectedIndex.value]);
      } else if (searchQuery.value.trim()) {
        performSearch();
      }
      break;

    case 'Escape':
      searchInput.value?.blur();
      selectedIndex.value = -1;
      break;

    case 'Tab':
      selectedIndex.value = -1;
      break;
  }
};

const selectSuggestion = (suggestion) => {
  searchQuery.value = suggestion.text;
  selectedIndex.value = -1;

  emit('update:modelValue', suggestion.text);
  emit('suggestion-selected', suggestion);
  emit('search', suggestion.text);

  nextTick(() => {
    searchInput.value?.blur();
  });
};

const clearSearch = () => {
  searchQuery.value = '';
  selectedIndex.value = -1;

  emit('update:modelValue', '');
  emit('clear');
  emit('search', '');

  nextTick(() => {
    searchInput.value?.focus();
  });
};

const performSearch = () => {
  if (searchQuery.value.trim()) {
    emit('search', searchQuery.value.trim());
  }
  selectedIndex.value = -1;
};

const highlightMatch = (text, query) => {
  if (!query || !text) return text;

  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    'gi'
  );
  return text.replace(regex, '<mark class="search-highlight">$1</mark>');
};

const focus = () => {
  searchInput.value?.focus();
};

const blur = () => {
  searchInput.value?.blur();
};

// Watch for external changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== searchQuery.value) {
      searchQuery.value = newValue;
    }
  }
);

// Expose methods
defineExpose({
  focus,
  blur,
  clear: clearSearch,
});
</script>

<style scoped>
.minimal-search-bar {
  @apply relative w-full;
}

.search-input-container {
  @apply relative flex items-center;
  @apply bg-white border border-gray-300 rounded-full;
  @apply transition-all duration-150 ease-out;
  @apply hover:border-gray-400;
  @apply focus-within:border-gray-500 focus-within:ring-1 focus-within:ring-gray-400;

  /* Minimum height for touch targets */
  min-height: 40px;
}

.search-icon-wrapper {
  @apply absolute left-3 flex items-center pointer-events-none;
}

.search-icon {
  @apply w-4 h-4 text-gray-400;
}

.search-input {
  @apply w-full pl-10 pr-10 py-3 bg-transparent;
  @apply text-gray-900 placeholder-gray-500;
  @apply border-0 outline-none;
  @apply font-medium;

  /* System font stack */
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
    Arial, sans-serif;
  font-size: 16px; /* Prevents zoom on iOS */
}

.clear-button {
  @apply absolute right-2 flex items-center justify-center;
  @apply w-8 h-8 rounded-full text-gray-400;
  @apply hover:text-gray-600 hover:bg-gray-100;
  @apply transition-colors duration-150;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1;
}

.loading-indicator {
  @apply absolute right-3 flex items-center;
}

.loading-spinner {
  @apply w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full;
  animation: spin 1s linear infinite;
}

/* Size variants */
.minimal-search-bar--sm .search-input-container {
  min-height: 36px;
}

.minimal-search-bar--sm .search-input {
  @apply py-2 text-sm;
  font-size: 14px;
}

.minimal-search-bar--lg .search-input-container {
  min-height: 52px;
}

.minimal-search-bar--lg .search-input {
  @apply py-4 text-lg;
  font-size: 18px;
}

/* Style variants */
.minimal-search-bar--minimal .search-input-container {
  @apply border-0 bg-gray-50;
  @apply hover:bg-gray-100;
  @apply focus-within:bg-white focus-within:ring-1 focus-within:ring-blue-500;
}

.minimal-search-bar--bordered .search-input-container {
  @apply border-2;
}

/* Disabled state */
.minimal-search-bar--disabled .search-input-container {
  @apply bg-gray-50 border-gray-200 cursor-not-allowed;
}

.minimal-search-bar--disabled .search-input {
  @apply text-gray-400 cursor-not-allowed;
}

/* Suggestions dropdown */
.suggestions-dropdown {
  @apply absolute top-full left-0 right-0 mt-1 z-50;
  @apply bg-white border border-gray-200 rounded-xl shadow-lg;
  @apply max-h-64 overflow-y-auto;
}

.suggestions-list {
  @apply py-2;
}

.suggestion-item {
  @apply w-full flex items-center gap-3 px-4 py-2.5;
  @apply text-left hover:bg-gray-50;
  @apply transition-colors duration-150;
  @apply focus:outline-none focus:bg-gray-50;
}

.suggestion-item--selected {
  @apply bg-blue-50 text-blue-900;
}

.suggestion-icon {
  @apply w-4 h-4 text-gray-400 flex-shrink-0;
}

.suggestion-text {
  @apply flex-1 text-sm font-medium;
}

.suggestion-category {
  @apply text-xs text-gray-500 flex-shrink-0;
}

.no-results {
  @apply flex items-center gap-3 px-4 py-6 text-gray-500;
}

.no-results-icon {
  @apply w-4 h-4;
}

.no-results-text {
  @apply text-sm;
}

/* Search highlight */
:deep(.search-highlight) {
  @apply bg-yellow-200 font-semibold;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .search-input-container {
    @apply bg-gray-800 border-gray-700;
    @apply hover:border-gray-600;
    @apply focus-within:border-blue-500;
  }

  .search-input {
    @apply text-gray-100 placeholder-gray-400;
  }

  .clear-button {
    @apply text-gray-400 hover:text-gray-200 hover:bg-gray-700;
  }

  .suggestions-dropdown {
    @apply bg-gray-800 border-gray-700;
  }
}

/* Class-based dark mode support */
.dark .search-input-container {
  @apply bg-gray-800 border-gray-700;
  @apply hover:border-gray-600;
  @apply focus-within:border-blue-500;
}

.dark .search-input {
  @apply text-gray-100 placeholder-gray-400;
}

.dark .clear-button {
  @apply text-gray-400 hover:text-gray-200 hover:bg-gray-700;
}

.dark .suggestions-dropdown {
  @apply bg-gray-800 border-gray-700;

  .suggestion-item {
    @apply hover:bg-gray-700;
  }

  .suggestion-item--selected {
    @apply bg-blue-900 text-blue-100;
  }

  .minimal-search-bar--minimal .search-input-container {
    @apply bg-gray-700;
    @apply hover:bg-gray-600;
    @apply focus-within:bg-gray-800;
  }

  :deep(.search-highlight) {
    @apply bg-yellow-800 text-yellow-100;
  }
}

/* Animations */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .search-input-container,
  .clear-button,
  .suggestion-item {
    @apply transition-none;
  }

  .loading-spinner {
    animation: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .search-input-container {
    @apply border-2 border-gray-900;
  }

  .suggestions-dropdown {
    @apply border-2 border-gray-900;
  }
}
</style>
