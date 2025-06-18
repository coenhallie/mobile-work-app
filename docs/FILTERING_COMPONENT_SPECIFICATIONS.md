# Filtering Component Specifications

## Component Breakdown & Implementation Details

### 1. FilterInterface Component

```vue
<!-- FilterInterface.vue -->
<template>
  <div class="filter-interface">
    <!-- Search Bar -->
    <div class="search-section">
      <SearchInput
        v-model="searchQuery"
        placeholder="Search contractors..."
        :suggestions="searchSuggestions"
        @search="handleSearch"
      />
    </div>

    <!-- Quick Filters (Mobile/Tablet) -->
    <div class="quick-filters md:hidden">
      <Button
        variant="outline"
        size="sm"
        @click="toggleFilterPanel"
        class="filter-trigger"
      >
        <Filter class="w-4 h-4 mr-2" />
        Filters
        <Badge v-if="activeFilterCount > 0" class="ml-2">
          {{ activeFilterCount }}
        </Badge>
      </Button>

      <Select v-model="sortBy">
        <SelectTrigger class="w-32">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="rating">Rating</SelectItem>
          <SelectItem value="experience">Experience</SelectItem>
          <SelectItem value="distance">Distance</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Desktop Sidebar Filters -->
    <div class="desktop-filters hidden md:block">
      <FilterSidebar
        v-model:filters="filters"
        :result-count="resultCount"
        @filter-change="handleFilterChange"
      />
    </div>

    <!-- Mobile Bottom Sheet -->
    <FilterBottomSheet
      v-model:open="isFilterPanelOpen"
      v-model:filters="filters"
      @apply="handleApplyFilters"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Filter } from 'lucide-vue-next';

const props = defineProps({
  resultCount: { type: Number, default: 0 },
  isLoading: { type: Boolean, default: false },
});

const emit = defineEmits(['filter-change', 'search']);

// State
const searchQuery = ref('');
const sortBy = ref('rating');
const isFilterPanelOpen = ref(false);
const filters = ref({
  services: [],
  locations: [],
  minRating: null,
  experienceRange: null,
  priceRange: null,
  availability: null,
});

// Computed
const activeFilterCount = computed(() => {
  let count = 0;
  if (filters.value.services.length) count++;
  if (filters.value.locations.length) count++;
  if (filters.value.minRating) count++;
  if (filters.value.experienceRange) count++;
  if (filters.value.priceRange) count++;
  if (filters.value.availability) count++;
  return count;
});

// Methods
const toggleFilterPanel = () => {
  isFilterPanelOpen.value = !isFilterPanelOpen.value;
};

const handleFilterChange = (newFilters) => {
  emit('filter-change', newFilters);
};

const handleSearch = (query) => {
  emit('search', query);
};
</script>
```

### 2. FilterChips Component

```vue
<!-- FilterChips.vue -->
<template>
  <div v-if="hasActiveFilters" class="filter-chips-container">
    <div class="filter-chips">
      <!-- Service Chips -->
      <FilterChip
        v-for="service in activeFilters.services"
        :key="`service-${service}`"
        :label="service"
        :type="'service'"
        @remove="removeFilter('services', service)"
      />

      <!-- Location Chips -->
      <FilterChip
        v-for="location in activeFilters.locations"
        :key="`location-${location}`"
        :label="location"
        :type="'location'"
        @remove="removeFilter('locations', location)"
      />

      <!-- Rating Chip -->
      <FilterChip
        v-if="activeFilters.minRating"
        :label="`${activeFilters.minRating}+ stars`"
        :type="'rating'"
        @remove="removeFilter('minRating', null)"
      />

      <!-- Experience Chip -->
      <FilterChip
        v-if="activeFilters.experienceRange"
        :label="`${activeFilters.experienceRange[0]}-${activeFilters.experienceRange[1]} years`"
        :type="'experience'"
        @remove="removeFilter('experienceRange', null)"
      />

      <!-- Clear All Button -->
      <Button
        variant="ghost"
        size="sm"
        @click="clearAllFilters"
        class="clear-all-btn"
      >
        Clear all
      </Button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  activeFilters: { type: Object, required: true },
});

const emit = defineEmits(['remove-filter', 'clear-all']);

const hasActiveFilters = computed(() => {
  return (
    props.activeFilters.services?.length > 0 ||
    props.activeFilters.locations?.length > 0 ||
    props.activeFilters.minRating ||
    props.activeFilters.experienceRange ||
    props.activeFilters.priceRange ||
    props.activeFilters.availability
  );
});

const removeFilter = (type, value) => {
  emit('remove-filter', { type, value });
};

const clearAllFilters = () => {
  emit('clear-all');
};
</script>

<style scoped>
.filter-chips-container {
  @apply mb-4 p-3 bg-muted/30 rounded-lg;
}

.filter-chips {
  @apply flex flex-wrap gap-2 items-center;
}

.clear-all-btn {
  @apply text-muted-foreground hover:text-foreground;
}
</style>
```

### 3. FilterChip Component

```vue
<!-- FilterChip.vue -->
<template>
  <div class="filter-chip" :class="chipClasses">
    <span class="chip-label">{{ label }}</span>
    <Button
      variant="ghost"
      size="icon"
      class="chip-remove"
      @click="handleRemove"
      :aria-label="`Remove ${label} filter`"
    >
      <X class="w-3 h-3" />
    </Button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { X } from 'lucide-vue-next';

const props = defineProps({
  label: { type: String, required: true },
  type: { type: String, required: true },
  removable: { type: Boolean, default: true },
});

const emit = defineEmits(['remove']);

const chipClasses = computed(() => ({
  'chip-service': props.type === 'service',
  'chip-location': props.type === 'location',
  'chip-rating': props.type === 'rating',
  'chip-experience': props.type === 'experience',
  'chip-price': props.type === 'price',
  'chip-availability': props.type === 'availability',
}));

const handleRemove = () => {
  emit('remove');
};
</script>

<style scoped>
.filter-chip {
  @apply inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200;
  @apply bg-primary text-primary-foreground;
  @apply hover:bg-primary/90;
}

.chip-label {
  @apply truncate max-w-32;
}

.chip-remove {
  @apply h-5 w-5 p-0 hover:bg-primary-foreground/20 rounded-full;
}

/* Type-specific styling */
.chip-service {
  @apply bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200;
}

.chip-location {
  @apply bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200;
}

.chip-rating {
  @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200;
}

.chip-experience {
  @apply bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200;
}

.chip-price {
  @apply bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200;
}

.chip-availability {
  @apply bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200;
}
</style>
```

### 4. FilterBottomSheet Component

```vue
<!-- FilterBottomSheet.vue -->
<template>
  <Dialog :open="open" @update:open="updateOpen">
    <DialogContent class="bottom-sheet-content">
      <DialogHeader class="bottom-sheet-header">
        <DialogTitle>Filter Contractors</DialogTitle>
        <DialogDescription>
          Find the perfect contractor for your needs
        </DialogDescription>
      </DialogHeader>

      <div class="filter-sections">
        <!-- Service Filter -->
        <FilterSection
          title="Services"
          :expanded="expandedSections.services"
          @toggle="toggleSection('services')"
        >
          <ServiceFilter
            v-model="localFilters.services"
            :options="serviceOptions"
          />
        </FilterSection>

        <!-- Location Filter -->
        <FilterSection
          title="Location"
          :expanded="expandedSections.locations"
          @toggle="toggleSection('locations')"
        >
          <LocationFilter
            v-model="localFilters.locations"
            :options="locationOptions"
          />
        </FilterSection>

        <!-- Rating Filter -->
        <FilterSection
          title="Rating"
          :expanded="expandedSections.rating"
          @toggle="toggleSection('rating')"
        >
          <RatingFilter v-model="localFilters.minRating" />
        </FilterSection>

        <!-- Experience Filter -->
        <FilterSection
          title="Experience"
          :expanded="expandedSections.experience"
          @toggle="toggleSection('experience')"
        >
          <ExperienceFilter v-model="localFilters.experienceRange" />
        </FilterSection>
      </div>

      <DialogFooter class="bottom-sheet-footer">
        <Button variant="outline" @click="clearFilters"> Clear All </Button>
        <Button @click="applyFilters" class="flex-1">
          Show {{ resultCount }} Results
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  open: { type: Boolean, default: false },
  filters: { type: Object, required: true },
  resultCount: { type: Number, default: 0 },
});

const emit = defineEmits(['update:open', 'update:filters', 'apply']);

// Local state
const localFilters = ref({ ...props.filters });
const expandedSections = ref({
  services: true,
  locations: false,
  rating: false,
  experience: false,
});

// Watch for external filter changes
watch(
  () => props.filters,
  (newFilters) => {
    localFilters.value = { ...newFilters };
  },
  { deep: true }
);

const updateOpen = (value) => {
  emit('update:open', value);
};

const toggleSection = (section) => {
  expandedSections.value[section] = !expandedSections.value[section];
};

const applyFilters = () => {
  emit('update:filters', localFilters.value);
  emit('apply', localFilters.value);
  updateOpen(false);
};

const clearFilters = () => {
  localFilters.value = {
    services: [],
    locations: [],
    minRating: null,
    experienceRange: null,
    priceRange: null,
    availability: null,
  };
};
</script>

<style scoped>
.bottom-sheet-content {
  @apply fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-lg;
  @apply bg-background border-t border-border;
  @apply animate-in slide-in-from-bottom duration-300;
}

.bottom-sheet-header {
  @apply p-4 border-b border-border;
}

.filter-sections {
  @apply flex-1 overflow-y-auto p-4 space-y-4;
}

.bottom-sheet-footer {
  @apply p-4 border-t border-border gap-3;
}
</style>
```

### 5. ServiceFilter Component

```vue
<!-- ServiceFilter.vue -->
<template>
  <div class="service-filter">
    <!-- Search within services -->
    <div class="service-search mb-3">
      <Input
        v-model="searchQuery"
        placeholder="Search services..."
        class="w-full"
      />
    </div>

    <!-- Service categories -->
    <div class="service-categories space-y-3">
      <div
        v-for="category in filteredCategories"
        :key="category.name"
        class="category-group"
      >
        <h4 class="category-title">{{ category.name }}</h4>
        <div class="service-options grid grid-cols-2 gap-2">
          <label
            v-for="service in category.services"
            :key="service"
            class="service-option"
          >
            <input
              type="checkbox"
              :value="service"
              v-model="selectedServices"
              class="service-checkbox"
            />
            <span class="service-label">{{ service }}</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  options: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:modelValue']);

const searchQuery = ref('');
const selectedServices = ref([...props.modelValue]);

// Service categories
const serviceCategories = [
  {
    name: 'Home Repair',
    services: [
      'AC Repair',
      'Electrical Repairs',
      'Plumbing Fixes',
      'Carpentry',
      'Locksmith',
    ],
  },
  {
    name: 'Cleaning',
    services: [
      'Deep Cleaning',
      'Standard Home Cleaning',
      'Office Cleaning',
      'Window Cleaning',
    ],
  },
  {
    name: 'Education',
    services: ['Math Tutoring', 'English Lessons', 'Guitar Lessons'],
  },
  {
    name: 'Beauty & Wellness',
    services: ['Manicure', 'Pedicure', 'Mobile Haircut'],
  },
  {
    name: 'Gardening',
    services: ['Lawn Mowing', 'Planting Services', 'Weed Removal'],
  },
];

const filteredCategories = computed(() => {
  if (!searchQuery.value) return serviceCategories;

  return serviceCategories
    .map((category) => ({
      ...category,
      services: category.services.filter((service) =>
        service.toLowerCase().includes(searchQuery.value.toLowerCase())
      ),
    }))
    .filter((category) => category.services.length > 0);
});

watch(
  selectedServices,
  (newValue) => {
    emit('update:modelValue', newValue);
  },
  { deep: true }
);

watch(
  () => props.modelValue,
  (newValue) => {
    selectedServices.value = [...newValue];
  }
);
</script>

<style scoped>
.category-title {
  @apply text-sm font-medium text-muted-foreground mb-2;
}

.service-option {
  @apply flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer;
  @apply transition-colors duration-150;
}

.service-checkbox {
  @apply rounded border-border focus:ring-2 focus:ring-primary;
}

.service-label {
  @apply text-sm text-foreground;
}
</style>
```

### 6. LazyContractorGrid Component

```vue
<!-- LazyContractorGrid.vue -->
<template>
  <div class="contractor-grid-container">
    <!-- Results Summary -->
    <div class="results-summary mb-4">
      <p class="text-sm text-muted-foreground">
        <span v-if="isLoading && contractors.length === 0">
          Loading contractors...
        </span>
        <span v-else>
          Showing {{ contractors.length }} of {{ totalCount }} contractors
        </span>
      </p>
    </div>

    <!-- Contractor Grid -->
    <div class="contractor-grid">
      <ContractorCard
        v-for="contractor in contractors"
        :key="contractor.id"
        :contractor="contractor"
        @click="viewProfile(contractor)"
      />
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && contractors.length > 0" class="loading-more">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <span>Loading more contractors...</span>
      </div>
    </div>

    <!-- Load More Trigger -->
    <div
      ref="loadMoreTrigger"
      class="load-more-trigger"
      v-show="hasMore && !isLoading"
    >
      <!-- Intersection observer target -->
    </div>

    <!-- Empty State -->
    <div v-if="!isLoading && contractors.length === 0" class="empty-state">
      <div class="empty-content">
        <Search class="w-12 h-12 text-muted-foreground mb-4" />
        <h3 class="text-lg font-medium mb-2">No contractors found</h3>
        <p class="text-muted-foreground mb-4">
          Try adjusting your filters or search terms
        </p>
        <Button variant="outline" @click="clearFilters"> Clear Filters </Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { Search } from 'lucide-vue-next';

const props = defineProps({
  contractors: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  hasMore: { type: Boolean, default: true },
  totalCount: { type: Number, default: 0 },
});

const emit = defineEmits(['load-more', 'view-profile', 'clear-filters']);

const loadMoreTrigger = ref(null);
const observer = ref(null);

// Intersection Observer for lazy loading
onMounted(() => {
  observer.value = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && props.hasMore && !props.isLoading) {
        emit('load-more');
      }
    },
    {
      threshold: 0.1,
      rootMargin: '100px',
    }
  );

  if (loadMoreTrigger.value) {
    observer.value.observe(loadMoreTrigger.value);
  }
});

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect();
  }
});

// Re-observe when trigger element changes
watch(loadMoreTrigger, (newTrigger, oldTrigger) => {
  if (observer.value) {
    if (oldTrigger) observer.value.unobserve(oldTrigger);
    if (newTrigger) observer.value.observe(newTrigger);
  }
});

const viewProfile = (contractor) => {
  emit('view-profile', contractor);
};

const clearFilters = () => {
  emit('clear-filters');
};
</script>

<style scoped>
.contractor-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

.loading-more {
  @apply flex justify-center py-8;
}

.loading-spinner {
  @apply flex items-center space-x-3 text-muted-foreground;
}

.spinner {
  @apply w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin;
}

.load-more-trigger {
  @apply h-10 w-full;
}

.empty-state {
  @apply flex justify-center py-16;
}

.empty-content {
  @apply text-center max-w-md;
}
</style>
```

## Integration Example

```vue
<!-- Enhanced ContractorListView.vue -->
<template>
  <div class="contractor-list-view">
    <!-- Header -->
    <div class="page-header">
      <h2 class="page-title">Find a Contractor</h2>

      <!-- Search Results Banner -->
      <div v-if="fromSearch && searchQuery" class="search-banner">
        <p>
          Showing results for: "<strong>{{ searchQuery }}</strong
          >"
        </p>
      </div>
    </div>

    <!-- Filter Interface -->
    <FilterInterface
      :result-count="totalCount"
      :is-loading="isLoading"
      @filter-change="handleFilterChange"
      @search="handleSearch"
    />

    <!-- Active Filter Chips -->
    <FilterChips
      :active-filters="activeFilters"
      @remove-filter="removeFilter"
      @clear-all="clearAllFilters"
    />

    <!-- Contractor Grid with Lazy Loading -->
    <LazyContractorGrid
      :contractors="contractors"
      :is-loading="isLoading"
      :has-more="hasMore"
      :total-count="totalCount"
      @load-more="loadMoreContractors"
      @view-profile="viewContractorProfile"
      @clear-filters="clearAllFilters"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useLazyContractors } from '@/composables/useLazyContractors';
import { useContractorFilters } from '@/composables/useContractorFilters';

const router = useRouter();

// Composables
const {
  contractors,
  isLoading,
  hasMore,
  totalCount,
  loadMore: loadMoreContractors,
  refresh: refreshContractors,
} = useLazyContractors();

const {
  filters: activeFilters,
  updateFilter,
  removeFilter,
  clearAllFilters,
  applyFilters,
} = useContractorFilters();

// Methods
const handleFilterChange = (newFilters) => {
  applyFilters(newFilters);
  refreshContractors();
};

const handleSearch = (query) => {
  updateFilter('search', query);
  refreshContractors();
};

const viewContractorProfile = (contractor) => {
  router.push({
    name: 'ContractorProfile',
    params: { id: contractor.id },
  });
};

// Initialize
onMounted(() => {
  loadMoreContractors();
});
</script>

<style scoped>
.contractor-list-view {
  @apply p-4 space-y-6;
}

.page-header {
  @apply space-y-4;
}

.page-title {
  @apply text-2xl font-semibold text-foreground;
}

.search-banner {
  @apply p-4 bg-primary/10 rounded-lg text-center;
}
</style>
```

This component specification provides detailed implementation guidance for each component in the filtering system, ensuring consistency with the existing design system while implementing modern, accessible, and performant filtering patterns.
