<template>
  <div class="filter-presets">
    <!-- Preset Filters Section -->
    <div class="presets-section mb-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Quick Filters</h3>
        <Button
          v-if="canSaveCurrentFilters"
          variant="outline"
          size="sm"
          @click="showSavePresetDialog = true"
          class="save-preset-btn"
        >
          <Bookmark class="w-4 h-4 mr-2" />
          Save Current
        </Button>
      </div>

      <!-- Popular Presets -->
      <div class="preset-grid mb-4">
        <Button
          v-for="preset in popularPresets"
          :key="preset.id"
          variant="outline"
          size="sm"
          @click="applyPreset(preset)"
          class="preset-button"
          :class="{ 'preset-active': isPresetActive(preset) }"
        >
          <component :is="preset.icon" class="w-4 h-4 mr-2" />
          {{ preset.name }}
          <Badge v-if="preset.count" variant="secondary" class="ml-2">
            {{ preset.count }}
          </Badge>
        </Button>
      </div>

      <!-- Saved Presets -->
      <div v-if="savedPresets.length > 0" class="saved-presets">
        <h4 class="text-sm font-medium mb-3 text-muted-foreground">
          Your Saved Filters
        </h4>
        <div class="preset-grid">
          <div
            v-for="preset in savedPresets"
            :key="preset.id"
            class="saved-preset-item"
          >
            <Button
              variant="outline"
              size="sm"
              @click="applyPreset(preset)"
              class="preset-button flex-1"
              :class="{ 'preset-active': isPresetActive(preset) }"
            >
              <Star class="w-4 h-4 mr-2" />
              {{ preset.name }}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              @click="deletePreset(preset.id)"
              class="delete-preset-btn"
            >
              <X class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Smart Suggestions -->
    <div v-if="smartSuggestions.length > 0" class="suggestions-section mb-6">
      <h4 class="text-sm font-medium mb-3 text-muted-foreground">
        <Lightbulb class="w-4 h-4 inline mr-2" />
        Suggested for you
      </h4>
      <div class="suggestion-chips">
        <Button
          v-for="suggestion in smartSuggestions"
          :key="suggestion.id"
          variant="ghost"
          size="sm"
          @click="applySuggestion(suggestion)"
          class="suggestion-chip"
        >
          {{ suggestion.label }}
          <ChevronRight class="w-3 h-3 ml-1" />
        </Button>
      </div>
    </div>

    <!-- Filter Analytics (Development Mode) -->
    <div v-if="showAnalytics && filterAnalytics" class="analytics-section">
      <h4 class="text-sm font-medium mb-3 text-muted-foreground">
        <BarChart class="w-4 h-4 inline mr-2" />
        Popular Filters
      </h4>
      <div class="analytics-grid">
        <div
          v-for="(count, filter) in filterAnalytics"
          :key="filter"
          class="analytics-item"
        >
          <span class="analytics-label">{{ formatFilterName(filter) }}</span>
          <Badge variant="outline" class="analytics-count">{{ count }}</Badge>
        </div>
      </div>
    </div>

    <!-- Save Preset Dialog -->
    <Dialog
      :open="showSavePresetDialog"
      @update:open="showSavePresetDialog = $event"
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Filter Preset</DialogTitle>
          <DialogDescription>
            Give your current filter combination a name to save it for quick
            access later.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <div>
            <Label for="preset-name">Preset Name</Label>
            <Input
              id="preset-name"
              v-model="newPresetName"
              placeholder="e.g., Top Rated Plumbers"
              class="mt-1"
              @keyup.enter="saveCurrentPreset"
            />
          </div>

          <!-- Preview of current filters -->
          <div class="current-filters-preview">
            <Label class="text-sm">Current Filters:</Label>
            <div class="flex flex-wrap gap-2 mt-2">
              <Badge
                v-for="filter in currentFiltersPreview"
                :key="filter"
                variant="secondary"
              >
                {{ filter }}
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showSavePresetDialog = false">
            Cancel
          </Button>
          <Button @click="saveCurrentPreset" :disabled="!newPresetName.trim()">
            Save Preset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import {
  Star,
  Bookmark,
  X,
  Lightbulb,
  ChevronRight,
  BarChart,
  Wrench,
  Zap,
  Home,
  Car,
  Paintbrush,
  Hammer,
} from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const props = defineProps({
  currentFilters: { type: Object, required: true },
  userLocation: { type: String, default: null },
  showAnalytics: { type: Boolean, default: false },
});

const emit = defineEmits(['apply-preset', 'filters-changed']);

// State
const savedPresets = ref([]);
const showSavePresetDialog = ref(false);
const newPresetName = ref('');
const filterAnalytics = ref(null);

// Popular preset configurations
const popularPresets = ref([
  {
    id: 'top-rated-cleaners',
    name: 'Top Rated Cleaners',
    icon: Star,
    filters: {
      services: ['Cleaning'],
      minRating: 4.5,
    },
    count: null,
  },
  {
    id: 'nearby-electricians',
    name: 'Nearby Electricians',
    icon: Zap,
    filters: {
      services: ['Electrical'],
      locations: props.userLocation ? [props.userLocation] : [],
    },
    count: null,
  },
  {
    id: 'experienced-plumbers',
    name: 'Experienced Plumbers',
    icon: Wrench,
    filters: {
      services: ['Plumbing'],
      experienceRange: [5, 20],
      minRating: 4.0,
    },
    count: null,
  },
  {
    id: 'home-improvement',
    name: 'Home Improvement',
    icon: Home,
    filters: {
      services: ['Carpentry', 'Painting', 'Renovation'],
    },
    count: null,
  },
  {
    id: 'automotive-services',
    name: 'Auto Services',
    icon: Car,
    filters: {
      services: ['Auto Repair', 'Car Wash'],
    },
    count: null,
  },
  {
    id: 'painting-contractors',
    name: 'Painting Contractors',
    icon: Paintbrush,
    filters: {
      services: ['Painting'],
      minRating: 4.0,
    },
    count: null,
  },
]);

// Computed properties
const canSaveCurrentFilters = computed(() => {
  const filters = props.currentFilters;
  return (
    filters.services?.length > 0 ||
    filters.locations?.length > 0 ||
    filters.minRating ||
    filters.experienceRange ||
    filters.priceRange ||
    filters.availability
  );
});

const currentFiltersPreview = computed(() => {
  const filters = props.currentFilters;
  const preview = [];

  if (filters.services?.length) {
    preview.push(`Services: ${filters.services.join(', ')}`);
  }
  if (filters.locations?.length) {
    preview.push(`Locations: ${filters.locations.join(', ')}`);
  }
  if (filters.minRating) {
    preview.push(`Rating: ${filters.minRating}+ stars`);
  }
  if (filters.experienceRange) {
    preview.push(
      `Experience: ${filters.experienceRange[0]}-${filters.experienceRange[1]} years`
    );
  }
  if (filters.priceRange) {
    preview.push(
      `Price: S/${filters.priceRange[0]}-S/${filters.priceRange[1]}`
    );
  }
  if (filters.availability) {
    preview.push(`Availability: ${filters.availability}`);
  }

  return preview;
});

const smartSuggestions = computed(() => {
  const suggestions = [];
  const filters = props.currentFilters;

  // Location-based suggestions
  if (props.userLocation && !filters.locations?.includes(props.userLocation)) {
    suggestions.push({
      id: 'add-location',
      label: `Add ${props.userLocation}`,
      filters: {
        locations: [...(filters.locations || []), props.userLocation],
      },
    });
  }

  // Service combination suggestions
  if (
    filters.services?.includes('Plumbing') &&
    !filters.services.includes('Electrical')
  ) {
    suggestions.push({
      id: 'add-electrical',
      label: 'Add Electrical services',
      filters: { services: [...filters.services, 'Electrical'] },
    });
  }

  // Rating suggestions
  if (!filters.minRating) {
    suggestions.push({
      id: 'add-rating',
      label: 'Show only 4+ star rated',
      filters: { minRating: 4.0 },
    });
  }

  // Experience suggestions
  if (filters.services?.length && !filters.experienceRange) {
    suggestions.push({
      id: 'add-experience',
      label: 'Add experience filter',
      filters: { experienceRange: [3, 15] },
    });
  }

  return suggestions.slice(0, 3); // Limit to 3 suggestions
});

// Methods
const loadSavedPresets = () => {
  try {
    const saved = localStorage.getItem('contractor-filter-presets');
    if (saved) {
      savedPresets.value = JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading saved presets:', error);
    savedPresets.value = [];
  }
};

const savePresets = () => {
  try {
    localStorage.setItem(
      'contractor-filter-presets',
      JSON.stringify(savedPresets.value)
    );
  } catch (error) {
    console.error('Error saving presets:', error);
  }
};

const saveCurrentPreset = () => {
  if (!newPresetName.value.trim()) return;

  const preset = {
    id: `custom-${Date.now()}`,
    name: newPresetName.value.trim(),
    filters: { ...props.currentFilters },
    createdAt: new Date().toISOString(),
  };

  savedPresets.value.push(preset);
  savePresets();

  // Track usage
  trackFilterUsage('preset_saved', preset.name);

  // Reset dialog
  newPresetName.value = '';
  showSavePresetDialog.value = false;
};

const deletePreset = (presetId) => {
  savedPresets.value = savedPresets.value.filter((p) => p.id !== presetId);
  savePresets();
};

const applyPreset = (preset) => {
  emit('apply-preset', preset.filters);
  trackFilterUsage('preset_applied', preset.name);
};

const applySuggestion = (suggestion) => {
  const newFilters = { ...props.currentFilters, ...suggestion.filters };
  emit('apply-preset', newFilters);
  trackFilterUsage('suggestion_applied', suggestion.label);
};

const isPresetActive = (preset) => {
  const current = props.currentFilters;
  const presetFilters = preset.filters;

  // Check if current filters match the preset
  return Object.keys(presetFilters).every((key) => {
    if (Array.isArray(presetFilters[key])) {
      return (
        JSON.stringify(current[key]?.sort()) ===
        JSON.stringify(presetFilters[key].sort())
      );
    }
    return current[key] === presetFilters[key];
  });
};

const trackFilterUsage = (action, filterName) => {
  try {
    const analytics = JSON.parse(
      localStorage.getItem('filter-analytics') || '{}'
    );
    const key = `${action}_${filterName}`;
    analytics[key] = (analytics[key] || 0) + 1;
    localStorage.setItem('filter-analytics', JSON.stringify(analytics));

    if (props.showAnalytics) {
      loadFilterAnalytics();
    }
  } catch (error) {
    console.error('Error tracking filter usage:', error);
  }
};

const loadFilterAnalytics = () => {
  try {
    const analytics = JSON.parse(
      localStorage.getItem('filter-analytics') || '{}'
    );
    filterAnalytics.value = analytics;
  } catch (error) {
    console.error('Error loading filter analytics:', error);
  }
};

const formatFilterName = (filterKey) => {
  return filterKey.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

// Update preset counts based on current results
const updatePresetCounts = async () => {
  // This would typically fetch counts from the API
  // For now, we'll simulate with random numbers
  popularPresets.value.forEach((preset) => {
    preset.count = Math.floor(Math.random() * 50) + 10;
  });
};

// Lifecycle
onMounted(() => {
  loadSavedPresets();
  if (props.showAnalytics) {
    loadFilterAnalytics();
  }
  updatePresetCounts();
});

// Watch for filter changes to track usage
watch(
  () => props.currentFilters,
  (newFilters, oldFilters) => {
    if (JSON.stringify(newFilters) !== JSON.stringify(oldFilters)) {
      trackFilterUsage('filter_changed', 'manual');
    }
  },
  { deep: true }
);
</script>

<style scoped>
@reference "@/style.css";

.filter-presets {
  @apply space-y-6;
}

.preset-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2;
}

.preset-button {
  @apply justify-start text-left h-auto py-2 px-3;
  @apply transition-all duration-200;
}

.preset-button:hover {
  @apply scale-105 shadow-md;
}

.preset-active {
  @apply bg-blue-600 text-white;
}

.saved-preset-item {
  @apply flex items-center gap-1;
}

.delete-preset-btn {
  @apply h-8 w-8 p-0 text-gray-500 hover:text-red-600;
}

.suggestion-chips {
  @apply flex flex-wrap gap-2;
}

.suggestion-chip {
  @apply h-8 px-3 text-sm;
  @apply bg-blue-50 hover:bg-blue-100 text-blue-700;
  @apply dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-300;
}

.analytics-section {
  @apply p-4 bg-gray-100 dark:bg-gray-800 rounded-lg;
}

.analytics-grid {
  @apply grid grid-cols-2 gap-2;
}

.analytics-item {
  @apply flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded;
}

.analytics-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.analytics-count {
  @apply text-xs;
}

.current-filters-preview {
  @apply p-3 bg-gray-100 dark:bg-gray-800 rounded-lg;
}

.save-preset-btn {
  @apply h-8;
}

@media (max-width: 640px) {
  .preset-grid {
    @apply grid-cols-1;
  }

  .suggestion-chips {
    @apply flex-col items-stretch;
  }

  .suggestion-chip {
    @apply justify-center;
  }
}
</style>
