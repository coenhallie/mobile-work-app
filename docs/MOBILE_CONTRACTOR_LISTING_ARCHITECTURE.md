# Mobile-First Contractor Listing Component System

## Overview

This document outlines a high-performance Vue 3 component system for displaying contractor cards with infinite scroll, filtering, and search capabilities. The system prioritizes fast initial load times, smooth scrolling performance, and mobile-first design using Tailwind CSS.

## Component Architecture

### Core Components Structure

```
src/components/contractors/
├── ContractorList.vue           # Main container component
├── ContractorCard.vue           # Individual contractor card
├── ContractorCardSkeleton.vue   # Loading skeleton
├── ContractorSearch.vue         # Search input component
├── ContractorFilters.vue        # Filter controls
├── InfiniteScrollContainer.vue  # Infinite scroll wrapper
└── composables/
    ├── useContractorData.js     # Data fetching logic
    ├── useInfiniteScroll.js     # Infinite scroll logic
    └── useContractorFilters.js  # Filter and search logic
```

## 1. ContractorList.vue - Main Container

```vue
<template>
  <div class="contractor-list w-full max-w-7xl mx-auto px-4 py-6">
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
    <div class="mb-4 text-sm text-gray-600">
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
      <div class="text-gray-400 text-6xl mb-4">🔍</div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        No contractors found
      </h3>
      <p class="text-gray-500 mb-4">Try adjusting your search or filters</p>
      <button
        @click="clearFilters"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Clear Filters
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import ContractorCard from './ContractorCard.vue';
import ContractorCardSkeleton from './ContractorCardSkeleton.vue';
import ContractorSearch from './ContractorSearch.vue';
import ContractorFilters from './ContractorFilters.vue';
import InfiniteScrollContainer from './InfiniteScrollContainer.vue';
import { useContractorData } from './composables/useContractorData';
import { useContractorFilters } from './composables/useContractorFilters';

const router = useRouter();

// Data management
const {
  contractors,
  isLoading,
  hasMore,
  totalCount,
  loadContractors,
  loadMoreContractors,
  resetContractors,
} = useContractorData();

// Filtering and search
const {
  searchQuery,
  activeFilters,
  handleSearch,
  handleFilterChange,
  clearFilters,
} = useContractorFilters();

// UI state
const skeletonCount = ref(6);

// Event handlers
const viewContractorProfile = (contractor) => {
  router.push(`/contractors/${contractor.id}`);
};

const handleContact = (contractor) => {
  router.push(`/chat/new?contractor=${contractor.id}`);
};

// Watchers for reactive filtering
watch(
  [searchQuery, activeFilters],
  () => {
    resetContractors();
    loadContractors();
  },
  { deep: true }
);

// Initial load
onMounted(() => {
  loadContractors();
});
</script>
```

## 2. ContractorCard.vue - Individual Card Component

```vue
<template>
  <div
    class="contractor-card bg-white rounded-xl border border-gray-200 p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-blue-300 active:scale-95"
    @click="$emit('click', contractor)"
  >
    <!-- Header with Avatar and Basic Info -->
    <div class="flex items-start space-x-4 mb-4">
      <!-- Avatar -->
      <div class="flex-shrink-0">
        <img
          v-if="contractor.profileImageUrl"
          :src="contractor.profileImageUrl"
          :alt="contractor.name"
          class="w-14 h-14 rounded-lg object-cover ring-2 ring-blue-100"
          loading="lazy"
          @error="handleImageError"
        />
        <div
          v-else
          class="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center"
        >
          <span class="text-2xl">👷</span>
        </div>
      </div>

      <!-- Basic Info -->
      <div class="flex-1 min-w-0">
        <h3 class="text-lg font-semibold text-gray-900 truncate">
          {{ contractor.name }}
        </h3>

        <p class="text-sm text-blue-600 font-medium mb-2">
          {{ contractor.primarySkill }}
        </p>

        <!-- Rating and Location -->
        <div class="flex items-center space-x-4 text-xs text-gray-500">
          <div class="flex items-center space-x-1">
            <span class="text-yellow-500">⭐</span>
            <span class="font-medium">{{ contractor.rating }}</span>
          </div>
          <div class="flex items-center space-x-1">
            <span>📍</span>
            <span>{{ contractor.location }}</span>
          </div>
        </div>
      </div>

      <!-- Favorite Button -->
      <button
        @click.stop="toggleFavorite"
        class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        :class="{ 'text-red-500': isFavorited, 'text-gray-400': !isFavorited }"
      >
        <span class="text-lg">{{ isFavorited ? '❤️' : '🤍' }}</span>
      </button>
    </div>

    <!-- Bio -->
    <p v-if="contractor.bio" class="text-sm text-gray-600 mb-4 line-clamp-2">
      {{ contractor.bio }}
    </p>

    <!-- Skills -->
    <div class="flex flex-wrap gap-2 mb-4">
      <span
        v-for="skill in displayedSkills"
        :key="skill"
        class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
      >
        {{ skill }}
      </span>
      <span
        v-if="contractor.skills.length > maxSkills"
        class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md"
      >
        +{{ contractor.skills.length - maxSkills }} more
      </span>
    </div>

    <!-- Actions -->
    <div class="flex space-x-2">
      <button
        @click.stop="$emit('contact', contractor)"
        class="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        Contact
      </button>
      <button
        @click.stop="$emit('click', contractor)"
        class="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
      >
        View Profile
      </button>
    </div>

    <!-- Availability Indicator -->
    <div
      v-if="contractor.availability"
      class="mt-3 flex items-center space-x-2"
    >
      <div class="w-2 h-2 rounded-full" :class="availabilityColor"></div>
      <span class="text-xs text-gray-500">{{ availabilityText }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  contractor: {
    type: Object,
    required: true,
  },
});

defineEmits(['click', 'contact']);

// State
const isFavorited = ref(false);
const maxSkills = 3;

// Computed properties
const displayedSkills = computed(() => {
  return props.contractor.skills?.slice(0, maxSkills) || [];
});

const availabilityColor = computed(() => {
  switch (props.contractor.availability) {
    case 'immediate':
      return 'bg-green-500';
    case 'within_week':
      return 'bg-yellow-500';
    case 'flexible':
      return 'bg-blue-500';
    default:
      return 'bg-gray-400';
  }
});

const availabilityText = computed(() => {
  switch (props.contractor.availability) {
    case 'immediate':
      return 'Available now';
    case 'within_week':
      return 'Within a week';
    case 'flexible':
      return 'Flexible schedule';
    default:
      return 'Contact for availability';
  }
});

// Methods
const toggleFavorite = () => {
  isFavorited.value = !isFavorited.value;
  // TODO: Persist to backend
};

const handleImageError = (event) => {
  event.target.style.display = 'none';
};
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
```

## 3. ContractorCardSkeleton.vue - Loading State

```vue
<template>
  <div
    class="contractor-card-skeleton bg-white rounded-xl border border-gray-200 p-6 animate-pulse"
  >
    <!-- Header Skeleton -->
    <div class="flex items-start space-x-4 mb-4">
      <!-- Avatar Skeleton -->
      <div class="w-14 h-14 bg-gray-200 rounded-lg"></div>

      <!-- Info Skeleton -->
      <div class="flex-1 space-y-2">
        <div class="h-4 bg-gray-200 rounded w-32"></div>
        <div class="h-3 bg-gray-200 rounded w-24"></div>
        <div class="h-3 bg-gray-200 rounded w-28"></div>
      </div>

      <!-- Favorite Button Skeleton -->
      <div class="w-8 h-8 bg-gray-200 rounded-lg"></div>
    </div>

    <!-- Bio Skeleton -->
    <div class="space-y-2 mb-4">
      <div class="h-3 bg-gray-200 rounded w-full"></div>
      <div class="h-3 bg-gray-200 rounded w-3/4"></div>
    </div>

    <!-- Skills Skeleton -->
    <div class="flex space-x-2 mb-4">
      <div class="h-6 bg-gray-200 rounded w-16"></div>
      <div class="h-6 bg-gray-200 rounded w-20"></div>
      <div class="h-6 bg-gray-200 rounded w-14"></div>
    </div>

    <!-- Actions Skeleton -->
    <div class="flex space-x-2">
      <div class="flex-1 h-8 bg-gray-200 rounded-lg"></div>
      <div class="w-24 h-8 bg-gray-200 rounded-lg"></div>
    </div>
  </div>
</template>
```

## 4. ContractorSearch.vue - Search Component

```vue
<template>
  <div class="contractor-search relative">
    <div class="relative">
      <!-- Search Input -->
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search contractors by name, skill, or location..."
        class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        @input="handleInput"
        @focus="showSuggestions = true"
        @blur="hideSuggestions"
      />

      <!-- Search Icon -->
      <div
        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
      >
        <span class="text-gray-400 text-lg">🔍</span>
      </div>

      <!-- Clear Button -->
      <button
        v-if="searchQuery"
        @click="clearSearch"
        class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
      >
        <span class="text-lg">✕</span>
      </button>
    </div>

    <!-- Search Suggestions -->
    <div
      v-if="showSuggestions && suggestions.length > 0"
      class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto"
    >
      <div
        v-for="suggestion in suggestions"
        :key="suggestion.id"
        @mousedown="selectSuggestion(suggestion)"
        class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
      >
        <div class="flex items-center space-x-3">
          <span class="text-lg">{{ suggestion.icon }}</span>
          <div>
            <div class="font-medium text-gray-900">{{ suggestion.title }}</div>
            <div class="text-sm text-gray-500">{{ suggestion.subtitle }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue', 'search']);

// State
const searchQuery = ref(props.modelValue);
const showSuggestions = ref(false);
const suggestions = ref([]);

// Watchers
watch(
  () => props.modelValue,
  (newValue) => {
    searchQuery.value = newValue;
  }
);

watch(searchQuery, (newValue) => {
  emit('update:modelValue', newValue);
  if (newValue.length > 2) {
    generateSuggestions(newValue);
  } else {
    suggestions.value = [];
  }
});

// Methods
const handleInput = () => {
  emit('search', searchQuery.value);
};

const clearSearch = () => {
  searchQuery.value = '';
  suggestions.value = [];
  emit('search', '');
};

const selectSuggestion = (suggestion) => {
  searchQuery.value = suggestion.title;
  showSuggestions.value = false;
  emit('search', suggestion.title);
};

const hideSuggestions = () => {
  setTimeout(() => {
    showSuggestions.value = false;
  }, 200);
};

const generateSuggestions = (query) => {
  // Mock suggestions - replace with actual API call
  suggestions.value = [
    {
      id: 1,
      title: 'Plumber',
      subtitle: 'Service category',
      icon: '🔧',
    },
    {
      id: 2,
      title: 'Lima',
      subtitle: 'Location',
      icon: '📍',
    },
    {
      id: 3,
      title: 'Electrician',
      subtitle: 'Service category',
      icon: '⚡',
    },
  ].filter((item) => item.title.toLowerCase().includes(query.toLowerCase()));
};
</script>
```

## 5. ContractorFilters.vue - Filter Controls

```vue
<template>
  <div class="contractor-filters">
    <!-- Mobile Filter Toggle -->
    <div class="md:hidden mb-4">
      <button
        @click="showMobileFilters = !showMobileFilters"
        class="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span class="text-lg">🔽</span>
        <span>Filters</span>
        <span
          v-if="activeFilterCount > 0"
          class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
        >
          {{ activeFilterCount }}
        </span>
      </button>
    </div>

    <!-- Filter Controls -->
    <div
      class="filter-controls space-y-4 md:space-y-0 md:flex md:items-center md:space-x-4"
      :class="{ hidden: !showMobileFilters && isMobile }"
    >
      <!-- Service Type Filter -->
      <div class="filter-group">
        <label class="block text-sm font-medium text-gray-700 mb-2 md:hidden">
          Service Type
        </label>
        <select
          v-model="filters.serviceType"
          @change="updateFilters"
          class="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Services</option>
          <option value="plumbing">Plumbing</option>
          <option value="electrical">Electrical</option>
          <option value="carpentry">Carpentry</option>
          <option value="painting">Painting</option>
          <option value="cleaning">Cleaning</option>
        </select>
      </div>

      <!-- Location Filter -->
      <div class="filter-group">
        <label class="block text-sm font-medium text-gray-700 mb-2 md:hidden">
          Location
        </label>
        <select
          v-model="filters.location"
          @change="updateFilters"
          class="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Locations</option>
          <option value="lima">Lima</option>
          <option value="callao">Callao</option>
          <option value="san-isidro">San Isidro</option>
          <option value="miraflores">Miraflores</option>
        </select>
      </div>

      <!-- Rating Filter -->
      <div class="filter-group">
        <label class="block text-sm font-medium text-gray-700 mb-2 md:hidden">
          Minimum Rating
        </label>
        <select
          v-model="filters.minRating"
          @change="updateFilters"
          class="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Any Rating</option>
          <option value="4">4+ Stars</option>
          <option value="4.5">4.5+ Stars</option>
          <option value="5">5 Stars</option>
        </select>
      </div>

      <!-- Availability Filter -->
      <div class="filter-group">
        <label class="block text-sm font-medium text-gray-700 mb-2 md:hidden">
          Availability
        </label>
        <select
          v-model="filters.availability"
          @change="updateFilters"
          class="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Any Time</option>
          <option value="immediate">Available Now</option>
          <option value="within_week">Within a Week</option>
          <option value="flexible">Flexible</option>
        </select>
      </div>

      <!-- Sort By -->
      <div class="filter-group">
        <label class="block text-sm font-medium text-gray-700 mb-2 md:hidden">
          Sort By
        </label>
        <select
          v-model="filters.sortBy"
          @change="updateFilters"
          class="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="rating">Highest Rated</option>
          <option value="experience">Most Experienced</option>
          <option value="distance">Nearest</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>

      <!-- Clear Filters -->
      <button
        v-if="activeFilterCount > 0"
        @click="clearFilters"
        class="w-full md:w-auto px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        Clear All
      </button>
    </div>

    <!-- Active Filter Tags -->
    <div v-if="activeFilterCount > 0" class="mt-4 flex flex-wrap gap-2">
      <span
        v-for="filter in activeFilterTags"
        :key="filter.key"
        class="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
      >
        {{ filter.label }}
        <button
          @click="removeFilter(filter.key)"
          class="ml-2 text-blue-600 hover:text-blue-800"
        >
          ✕
        </button>
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue', 'filter-change']);

// State
const showMobileFilters = ref(false);
const isMobile = ref(false);

const filters = reactive({
  serviceType: '',
  location: '',
  minRating: '',
  availability: '',
  sortBy: 'rating',
  ...props.modelValue,
});

// Computed properties
const activeFilterCount = computed(() => {
  return (
    Object.values(filters).filter((value) => value && value !== '').length - 1
  ); // Exclude sortBy
});

const activeFilterTags = computed(() => {
  const tags = [];

  if (filters.serviceType) {
    tags.push({ key: 'serviceType', label: `Service: ${filters.serviceType}` });
  }
  if (filters.location) {
    tags.push({ key: 'location', label: `Location: ${filters.location}` });
  }
  if (filters.minRating) {
    tags.push({ key: 'minRating', label: `${filters.minRating}+ Stars` });
  }
  if (filters.availability) {
    tags.push({
      key: 'availability',
      label: `Availability: ${filters.availability}`,
    });
  }

  return tags;
});

// Methods
const updateFilters = () => {
  emit('update:modelValue', { ...filters });
  emit('filter-change', { ...filters });
};

const clearFilters = () => {
  Object.keys(filters).forEach((key) => {
    if (key !== 'sortBy') {
      filters[key] = '';
    }
  });
  updateFilters();
};

const removeFilter = (filterKey) => {
  filters[filterKey] = '';
  updateFilters();
};

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

// Watchers
watch(
  () => props.modelValue,
  (newValue) => {
    Object.assign(filters, newValue);
  },
  { deep: true }
);

// Lifecycle
onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});
</script>
```

## 6. InfiniteScrollContainer.vue - Infinite Scroll Wrapper

```vue
<template>
  <div class="infinite-scroll-container">
    <!-- Content Slot -->
    <slot></slot>

    <!-- Loading Indicator -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div class="flex items-center space-x-3">
        <div
          class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"
        ></div>
        <span class="text-gray-600">Loading more contractors...</span>
      </div>
    </div>

    <!-- Load More Trigger -->
    <div
      ref="loadMoreTrigger"
      class="h-4 w-full"
      v-show="hasMore && !loading"
    ></div>

    <!-- End Message -->
    <div v-if="!hasMore && !loading" class="text-center py-8 text-gray-500">
      You've reached the end of the list
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  hasMore: {
    type: Boolean,
    default: true,
  },
  threshold: {
    type: Number,
    default: 0.1,
  },
});

const emit = defineEmits(['load-more']);

// Refs
const loadMoreTrigger = ref(null);
const observer = ref(null);

// Methods
const setupIntersectionObserver = () => {
  if (!loadMoreTrigger.value) return;

  observer.value = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && props.hasMore && !props.loading) {
        emit('load-more');
      }
    },
    {
      threshold: props.threshold,
      rootMargin: '100px',
    }
  );

  observer.value.observe(loadMoreTrigger.value);
};

const cleanup = () => {
  if (observer.value) {
    observer.value.disconnect();
  }
};

// Lifecycle
onMounted(() => {
  setupIntersectionObserver();
});

onUnmounted(() => {
  cleanup();
});
</script>
```

## 7. useContractorData.js - Data Management Composable

```javascript
import { ref, reactive } from 'vue'
import { useAuth } from '@/composables/useAuth'

export function useContractorData() {
  const { getSupabaseClient } = useAuth()
  const supabase = getSupabaseClient()

  // State
  const contractors = ref([])
  const isLoading = ref(false)
  const hasMore = ref(true)
  const totalCount = ref(0)
  const currentPage = ref(0)
  const pageSize = 20

  // Cache for performance
  const cache = new Map()
  const cacheTimeout = 5 * 60 * 1000 // 5 minutes

  // Apply filters to Supabase query
  const applyFilters = (query, filters) => {
    // Search filter
    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,bio.ilike.%${filters.search}%`)
    }

    // Service type filter
    if (filters.serviceType) {
      query = query.contains('skills', [filters.serviceType])
    }

    // Location filter
    if (filters.location) {
      query = query.contains('service_areas', [filters.location])
    }

    // Rating filter
    if (filters.minRating) {
      query = query.gte('average_rating', parseFloat(filters.minRating))
    }

    // Availability filter
    if (filters.availability) {
      query = query.eq('availability', filters.availability)
    }

    // Sorting
    const sortField = getSortField(filters.sortBy || 'rating')
    const ascending = filters.sortOrder === 'asc'
    query = query.order(sortField, { ascending })

    return query
  }

  // Get sort field mapping
  const getSortField = (sortBy) => {
    switch (sortBy) {
      case 'rating': return 'average_rating'
      case 'experience': return 'years_experience'
      case 'name': return 'full_name'
      case 'distance': return 'service_areas' // Placeholder
      default: return 'average_rating'
    }
  }

  // Transform contractor data
  const transformContractorData = (contractors) => {
    return contractors.map(contractor => ({
      id: contractor.id,
      name: contractor.full_name,
      bio: contractor.bio,
      skills: contractor.skills || [],
      primarySkill: contractor.skills?.[0] || 'General Services',
      rating: contractor.average_rating || 4.5,
      location: contractor.service_areas?.[0] || 'Lima',
      profileImageUrl: contractor.profile_picture_url,
      yearsExperience: contractor.years_experience,
      contactPhone: contractor.contact_phone,
      availability: contractor.availability
    }))
  }

  // Load contractors with filters
  const loadContractors = async (filters = {
```
