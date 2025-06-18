<template>
  <div class="enhanced-search-input">
    <div class="search-container" ref="searchContainer">
      <div class="relative">
        <Search
          class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
        />
        <Input
          ref="searchInput"
          v-model="searchQuery"
          :placeholder="placeholder"
          class="pl-10 pr-10"
          @input="handleSearchInput"
          @focus="handleFocus"
          @blur="handleBlur"
          @keydown="handleKeydown"
          autocomplete="off"
        />
        <Button
          v-if="searchQuery"
          variant="ghost"
          size="sm"
          @click="clearSearch"
          class="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
        >
          <X class="w-4 h-4" />
        </Button>
      </div>

      <!-- Search Suggestions Dropdown -->
      <div
        v-if="
          showSuggestions &&
          (suggestions.length > 0 || recentSearches.length > 0)
        "
        class="suggestions-dropdown"
        @mousedown.prevent
      >
        <!-- Autocomplete Suggestions -->
        <div v-if="suggestions.length > 0" class="suggestion-section">
          <div class="suggestion-header">
            <span class="text-xs font-medium text-gray-500">Suggestions</span>
          </div>
          <div
            v-for="(suggestion, index) in suggestions"
            :key="`suggestion-${index}`"
            class="suggestion-item"
            :class="{ 'suggestion-active': selectedIndex === index }"
            @click="selectSuggestion(suggestion)"
            @mouseenter="selectedIndex = index"
          >
            <component :is="suggestion.icon" class="w-4 h-4 text-gray-400" />
            <div class="suggestion-content">
              <span
                class="suggestion-text"
                v-html="highlightMatch(suggestion.text, searchQuery)"
              ></span>
              <span v-if="suggestion.category" class="suggestion-category">{{
                suggestion.category
              }}</span>
            </div>
            <Badge
              v-if="suggestion.count"
              variant="secondary"
              class="suggestion-count"
            >
              {{ suggestion.count }}
            </Badge>
          </div>
        </div>

        <!-- Recent Searches -->
        <div
          v-if="recentSearches.length > 0 && !searchQuery"
          class="suggestion-section"
        >
          <div class="suggestion-header">
            <span class="text-xs font-medium text-gray-500"
              >Recent Searches</span
            >
            <Button
              variant="ghost"
              size="sm"
              @click="clearRecentSearches"
              class="h-6 px-2 text-xs"
            >
              Clear
            </Button>
          </div>
          <div
            v-for="(recent, index) in recentSearches"
            :key="`recent-${index}`"
            class="suggestion-item"
            :class="{
              'suggestion-active': selectedIndex === suggestions.length + index,
            }"
            @click="selectRecentSearch(recent)"
            @mouseenter="selectedIndex = suggestions.length + index"
          >
            <Clock class="w-4 h-4 text-gray-400" />
            <span class="suggestion-text">{{ recent }}</span>
            <Button
              variant="ghost"
              size="sm"
              @click.stop="removeRecentSearch(recent)"
              class="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
            >
              <X class="w-3 h-3" />
            </Button>
          </div>
        </div>

        <!-- Popular Searches -->
        <div
          v-if="popularSearches.length > 0 && !searchQuery"
          class="suggestion-section"
        >
          <div class="suggestion-header">
            <span class="text-xs font-medium text-gray-500"
              >Popular Searches</span
            >
          </div>
          <div
            v-for="(popular, index) in popularSearches"
            :key="`popular-${index}`"
            class="suggestion-item"
            @click="selectSuggestion(popular)"
          >
            <TrendingUp class="w-4 h-4 text-gray-400" />
            <span class="suggestion-text">{{ popular.text }}</span>
            <Badge variant="outline" class="suggestion-count">{{
              popular.count
            }}</Badge>
          </div>
        </div>

        <!-- No Results -->
        <div
          v-if="searchQuery && suggestions.length === 0"
          class="suggestion-section"
        >
          <div class="suggestion-item">
            <Search class="w-4 h-4 text-gray-400" />
            <span class="suggestion-text text-gray-500"
              >No suggestions found</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Search Filters Quick Access -->
    <div
      v-if="showQuickFilters && quickFilters.length > 0"
      class="quick-filters mt-3"
    >
      <div class="flex flex-wrap gap-2">
        <Button
          v-for="filter in quickFilters"
          :key="filter.id"
          variant="outline"
          size="sm"
          @click="applyQuickFilter(filter)"
          class="quick-filter-btn"
        >
          <component :is="filter.icon" class="w-3 h-3 mr-1" />
          {{ filter.label }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import {
  Search,
  X,
  Clock,
  TrendingUp,
  User,
  MapPin,
  Wrench,
  Star,
  Filter,
} from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const props = defineProps({
  placeholder: {
    type: String,
    default: 'Search contractors, services, or locations...',
  },
  modelValue: { type: String, default: '' },
  contractorData: { type: Array, default: () => [] },
  showQuickFilters: { type: Boolean, default: true },
  debounceMs: { type: Number, default: 200 },
});

const emit = defineEmits([
  'update:modelValue',
  'search',
  'suggestion-selected',
  'quick-filter-applied',
]);

// State
const searchQuery = ref(props.modelValue);
const showSuggestions = ref(false);
const selectedIndex = ref(-1);
const searchInput = ref(null);
const searchContainer = ref(null);
const recentSearches = ref([]);
const searchTimeout = ref(null);

// Computed suggestions with fuzzy matching
const suggestions = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < 2) return [];

  const query = searchQuery.value.toLowerCase();
  const results = [];

  // Contractor name suggestions
  const contractorMatches = props.contractorData
    .filter((contractor) => {
      const name = contractor.full_name?.toLowerCase() || '';
      return fuzzyMatch(name, query);
    })
    .slice(0, 5)
    .map((contractor) => ({
      text: contractor.full_name,
      category: 'Contractor',
      icon: User,
      type: 'contractor',
      data: contractor,
    }));

  // Service/skill suggestions
  const allSkills = new Set();
  props.contractorData.forEach((contractor) => {
    contractor.skills?.forEach((skill) => {
      if (fuzzyMatch(skill.toLowerCase(), query)) {
        allSkills.add(skill);
      }
    });
  });

  const skillMatches = Array.from(allSkills)
    .slice(0, 5)
    .map((skill) => ({
      text: skill,
      category: 'Service',
      icon: Wrench,
      type: 'service',
      count: props.contractorData.filter((c) => c.skills?.includes(skill))
        .length,
    }));

  // Location suggestions
  const allLocations = new Set();
  props.contractorData.forEach((contractor) => {
    if (
      contractor.district &&
      fuzzyMatch(contractor.district.toLowerCase(), query)
    ) {
      allLocations.add(contractor.district);
    }
  });

  const locationMatches = Array.from(allLocations)
    .slice(0, 3)
    .map((location) => ({
      text: location,
      category: 'Location',
      icon: MapPin,
      type: 'location',
      count: props.contractorData.filter((c) => c.district === location).length,
    }));

  return [...contractorMatches, ...skillMatches, ...locationMatches];
});

// Popular searches (could be fetched from analytics)
const popularSearches = ref([
  { text: 'Plumber', count: 45 },
  { text: 'Electrician', count: 38 },
  { text: 'Cleaner', count: 52 },
  { text: 'Painter', count: 29 },
]);

// Quick filter buttons
const quickFilters = computed(() => [
  {
    id: 'top-rated',
    label: 'Top Rated',
    icon: Star,
    filter: { minRating: 4.5 },
  },
  {
    id: 'nearby',
    label: 'Nearby',
    icon: MapPin,
    filter: { sortBy: 'distance' },
  },
  {
    id: 'available-now',
    label: 'Available Now',
    icon: Clock,
    filter: { availability: 'immediate' },
  },
]);

// Methods
const fuzzyMatch = (text, query) => {
  // Simple fuzzy matching algorithm
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  // Exact match
  if (textLower.includes(queryLower)) return true;

  // Character-by-character fuzzy match
  let queryIndex = 0;
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++;
    }
  }

  return queryIndex === queryLower.length;
};

const highlightMatch = (text, query) => {
  if (!query) return text;

  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(
    regex,
    '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>'
  );
};

const handleSearchInput = () => {
  clearTimeout(searchTimeout.value);
  searchTimeout.value = setTimeout(() => {
    emit('update:modelValue', searchQuery.value);
    emit('search', searchQuery.value);
  }, props.debounceMs);

  selectedIndex.value = -1;
  showSuggestions.value = true;
};

const handleFocus = () => {
  showSuggestions.value = true;
  loadRecentSearches();
};

const handleBlur = () => {
  // Delay hiding to allow for clicks
  setTimeout(() => {
    showSuggestions.value = false;
  }, 150);
};

const handleKeydown = (event) => {
  const totalItems = suggestions.value.length + recentSearches.value.length;

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      selectedIndex.value = Math.min(selectedIndex.value + 1, totalItems - 1);
      break;
    case 'ArrowUp':
      event.preventDefault();
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1);
      break;
    case 'Enter':
      event.preventDefault();
      if (selectedIndex.value >= 0) {
        if (selectedIndex.value < suggestions.value.length) {
          selectSuggestion(suggestions.value[selectedIndex.value]);
        } else {
          const recentIndex = selectedIndex.value - suggestions.value.length;
          selectRecentSearch(recentSearches.value[recentIndex]);
        }
      } else if (searchQuery.value) {
        performSearch();
      }
      break;
    case 'Escape':
      showSuggestions.value = false;
      searchInput.value?.blur();
      break;
  }
};

const selectSuggestion = (suggestion) => {
  searchQuery.value = suggestion.text;
  showSuggestions.value = false;

  // Save to recent searches
  saveRecentSearch(suggestion.text);

  emit('update:modelValue', suggestion.text);
  emit('suggestion-selected', suggestion);
  emit('search', suggestion.text);
};

const selectRecentSearch = (search) => {
  searchQuery.value = search;
  showSuggestions.value = false;

  emit('update:modelValue', search);
  emit('search', search);
};

const clearSearch = () => {
  searchQuery.value = '';
  emit('update:modelValue', '');
  emit('search', '');
  nextTick(() => {
    searchInput.value?.focus();
  });
};

const performSearch = () => {
  if (searchQuery.value.trim()) {
    saveRecentSearch(searchQuery.value.trim());
    emit('search', searchQuery.value.trim());
  }
  showSuggestions.value = false;
};

const applyQuickFilter = (filter) => {
  emit('quick-filter-applied', filter);
};

// Recent searches management
const loadRecentSearches = () => {
  try {
    const saved = localStorage.getItem('contractor-recent-searches');
    if (saved) {
      recentSearches.value = JSON.parse(saved).slice(0, 5);
    }
  } catch (error) {
    console.error('Error loading recent searches:', error);
  }
};

const saveRecentSearch = (search) => {
  try {
    const current = [...recentSearches.value];
    const index = current.indexOf(search);

    if (index > -1) {
      current.splice(index, 1);
    }

    current.unshift(search);
    recentSearches.value = current.slice(0, 5);

    localStorage.setItem(
      'contractor-recent-searches',
      JSON.stringify(recentSearches.value)
    );
  } catch (error) {
    console.error('Error saving recent search:', error);
  }
};

const clearRecentSearches = () => {
  recentSearches.value = [];
  localStorage.removeItem('contractor-recent-searches');
};

const removeRecentSearch = (search) => {
  recentSearches.value = recentSearches.value.filter((s) => s !== search);
  localStorage.setItem(
    'contractor-recent-searches',
    JSON.stringify(recentSearches.value)
  );
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

// Lifecycle
onMounted(() => {
  loadRecentSearches();
});

onUnmounted(() => {
  clearTimeout(searchTimeout.value);
});
</script>

<style scoped>
@reference "@/style.css";

.enhanced-search-input {
  @apply relative;
}

.search-container {
  @apply relative;
}

.suggestions-dropdown {
  @apply absolute top-full left-0 right-0 z-50 mt-1;
  @apply bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700;
  @apply rounded-lg shadow-lg max-h-80 overflow-y-auto;
}

.suggestion-section {
  @apply border-b border-gray-100 dark:border-gray-800 last:border-b-0;
}

.suggestion-header {
  @apply flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800;
}

.suggestion-item {
  @apply flex items-center gap-3 px-3 py-2 cursor-pointer;
  @apply hover:bg-gray-50 dark:hover:bg-gray-800;
  @apply transition-colors duration-150;
}

.suggestion-active {
  @apply bg-blue-50 dark:bg-blue-900/20;
}

.suggestion-content {
  @apply flex-1 min-w-0;
}

.suggestion-text {
  @apply block text-sm font-medium truncate;
}

.suggestion-category {
  @apply block text-xs text-gray-500 dark:text-gray-400;
}

.suggestion-count {
  @apply text-xs;
}

.quick-filters {
  @apply border-t border-gray-200 dark:border-gray-700 pt-3;
}

.quick-filter-btn {
  @apply h-8 text-xs;
}

/* Custom scrollbar for suggestions */
.suggestions-dropdown::-webkit-scrollbar {
  @apply w-2;
}

.suggestions-dropdown::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-800;
}

.suggestions-dropdown::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded-full;
}

.suggestions-dropdown::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-500;
}

/* Highlight styling */
:deep(mark) {
  @apply bg-yellow-200 dark:bg-yellow-800 px-0 rounded-sm;
}
</style>
