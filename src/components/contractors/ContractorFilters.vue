<template>
  <div class="contractor-filters">
    <!-- Main Filter Row: Quick Filters + Toggle Button + Sort -->
    <div class="main-filter-row flex flex-wrap items-center gap-2 mb-4">
      <!-- Quick Filter Pills -->
      <button
        v-for="quickFilter in quickFilterOptions"
        :key="quickFilter.value"
        @click="toggleQuickFilter(quickFilter.value)"
        class="filter-pill"
        :class="{
          'filter-pill--active': isQuickFilterActive(quickFilter.value),
        }"
      >
        {{ quickFilter.label }}
      </button>

      <!-- Filter Toggle Button -->
      <button
        @click="showAdvancedFilters = !showAdvancedFilters"
        class="filter-pill filter-pill--icon-only"
        :class="{ 'filter-pill--active': showAdvancedFilters }"
        aria-label="More filters"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 4h18M7 12h10m-9 8h8"
          ></path>
        </svg>
        <span v-if="activeFilterCount > 0" class="filter-count-badge-minimal">
          {{ activeFilterCount }}
        </span>
      </button>

      <!-- Sort Dropdown -->
      <div class="relative">
        <select
          v-model="filters.sortBy"
          @change="updateFilters"
          class="filter-pill sort-select-minimal"
        >
          <option
            v-for="sort in sortOptions"
            :key="sort.value"
            :value="sort.value"
          >
            {{ sort.label }}
          </option>
        </select>
      </div>

      <!-- Favorites Toggle -->
      <button
        @click="toggleShowFavoritesOnly"
        class="filter-pill flex items-center"
        :class="{ 'filter-pill--active': filters.showFavoritesOnly }"
        aria-label="Show favorites only"
      >
        <svg
          class="w-4 h-4 mr-1.5"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
            clip-rule="evenodd"
          ></path>
        </svg>
        {{ $t('contractors.showFavoritesOnly') }}
      </button>
    </div>

    <!-- Advanced Filter Controls -->
    <div
      class="filter-controls space-y-6"
      :class="{ hidden: !showAdvancedFilters }"
    >
      <!-- Service Type Filter -->
      <div class="filter-group">
        <label class="filter-group__label"> Service Type </label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="service in serviceOptions"
            :key="service.value"
            @click="toggleService(service.value)"
            class="filter-pill"
            :class="{
              'filter-pill--active': filters.serviceType === service.value,
            }"
          >
            {{ service.label }}
          </button>
        </div>
      </div>

      <!-- Location Filter -->
      <div class="filter-group">
        <label class="filter-group__label"> Location </label>

        <!-- Location Type Toggle -->
        <div class="flex flex-wrap gap-2 mb-3">
          <button
            @click="toggleLocationType('manual')"
            class="filter-pill"
            :class="{
              'filter-pill--active': locationType === 'manual',
            }"
          >
            📍 Select Districts
          </button>
          <button
            @click="toggleLocationType('gps')"
            class="filter-pill"
            :class="{
              'filter-pill--active': locationType === 'gps',
            }"
          >
            🎯 Use My Location
          </button>
          <button
            @click="toggleLocationType('hybrid')"
            class="filter-pill"
            :class="{
              'filter-pill--active': locationType === 'hybrid',
            }"
          >
            🔄 Both
          </button>
        </div>

        <!-- Manual District Selection -->
        <div
          v-if="locationType === 'manual' || locationType === 'hybrid'"
          class="mb-3"
        >
          <div class="flex flex-wrap gap-2">
            <button
              v-for="location in locationOptions"
              :key="location.value"
              @click="toggleLocation(location.value)"
              class="filter-pill"
              :class="{
                'filter-pill--active': selectedDistricts.includes(
                  location.value
                ),
              }"
            >
              {{ location.label }}
            </button>
          </div>
          <div
            v-if="selectedDistricts.length > 0"
            class="mt-2 text-xs text-gray-500"
          >
            {{ selectedDistricts.length }} district{{
              selectedDistricts.length !== 1 ? 's' : ''
            }}
            selected
          </div>
        </div>

        <!-- GPS Location Status -->
        <div
          v-if="locationType === 'gps' || locationType === 'hybrid'"
          class="mb-3"
        >
          <div
            class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <div v-if="isGettingLocation" class="flex items-center gap-2">
              <div
                class="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
              ></div>
              <span class="text-sm text-gray-600 dark:text-gray-400"
                >Getting your location...</span
              >
            </div>
            <div v-else-if="currentGPSLocation" class="flex items-center gap-2">
              <span class="text-green-600 dark:text-green-400">✓</span>
              <span class="text-sm text-gray-600 dark:text-gray-400">
                Location found - showing contractors within {{ gpsRadius }}km
              </span>
              <button
                @click="refreshLocation"
                class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Refresh
              </button>
            </div>
            <div v-else class="flex flex-col gap-3">
              <div class="flex items-center gap-2">
                <span class="text-yellow-600 dark:text-yellow-400">⚠</span>
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  Location access required to show nearby contractors
                </span>
              </div>
              <button
                @click="enableLocationAccess"
                class="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                :disabled="
                  isGettingLocation ||
                  !locationSupported ||
                  isInitializingSupport
                "
              >
                <svg
                  v-if="isGettingLocation"
                  class="animate-spin w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  ></path>
                </svg>
                <svg
                  v-else
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  ></path>
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  ></path>
                </svg>
                {{
                  isInitializingSupport
                    ? 'Initializing location support...'
                    : isGettingLocation
                      ? 'Checking location support...'
                      : 'Enable Location Access'
                }}
              </button>
            </div>
          </div>

          <!-- GPS Radius Control -->
          <div v-if="currentGPSLocation" class="mt-2">
            <label class="text-xs text-gray-600 dark:text-gray-400 block mb-1">
              Search radius: {{ gpsRadius }}km
            </label>
            <input
              v-model.number="gpsRadius"
              type="range"
              min="1"
              max="50"
              step="1"
              class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              @input="updateGPSRadius"
            />
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>1km</span>
              <span>50km</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Rating Filter -->
      <div class="filter-group">
        <label class="filter-group__label"> Minimum Rating </label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="rating in ratingOptions"
            :key="rating.value"
            @click="toggleRating(rating.value)"
            class="filter-pill"
            :class="{
              'filter-pill--active': filters.minRating === rating.value,
            }"
          >
            {{ rating.label }}
          </button>
        </div>
      </div>

      <!-- Sort By -->
      <div class="filter-group">
        <label class="filter-group__label"> Sort By </label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="sort in sortOptions"
            :key="sort.value"
            @click="toggleSort(sort.value)"
            class="filter-pill"
            :class="{ 'filter-pill--active': filters.sortBy === sort.value }"
          >
            {{ sort.label }}
          </button>
        </div>
      </div>

      <!-- Clear Filters -->
      <div v-if="activeFilterCount > 0" class="flex justify-center pt-4">
        <button @click="clearFilters" class="clear-filters-btn">
          Clear All Filters
        </button>
      </div>
    </div>

    <!-- Active Filter Tags removed to simplify, active state shown on pills -->
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted } from 'vue';
import { useGeolocation } from '@/composables/useGeolocation';
import { useAuth } from '@/composables/useAuth';

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

// Initialize geolocation composable (same way as UserProfileView)
const {
  currentPosition,
  isLoading: isLocationLoading,
  error: locationError,
  permissionStatus: locationPermissionStatus,
  isSupported: locationSupported,
  checkSupport,
  requestPermissions,
  getCurrentPosition,
} = useGeolocation();
const { isSignedIn } = useAuth();

// State
const showAdvancedFilters = ref(false);
const isMobile = ref(false);
const isInitializingSupport = ref(true);

// Location state
const locationType = ref('manual'); // 'manual', 'gps', 'hybrid'
const selectedDistricts = ref([]);
const currentGPSLocation = ref(null);
const isGettingLocation = ref(false);
const gpsRadius = ref(10); // Default 10km radius

const filters = reactive({
  serviceType: '',
  location: '',
  minRating: '',
  sortBy: 'rating',
  // New location-related filters
  locationType: 'manual',
  selectedDistricts: [],
  gpsLocation: null,
  gpsRadius: 10,
  showFavoritesOnly: false,
  // Availability filter
  availableNow: false,
  ...props.modelValue,
});

// Quick filter options
const quickFilterOptions = [
  { value: 'top-rated', label: 'Top Rated' },
  { value: 'nearby', label: 'Nearby' },
  { value: 'available-now', label: 'Available Now' },
];

// Filter options
const serviceOptions = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'painting', label: 'Painting' },
  { value: 'cleaning', label: 'Cleaning' },
];

const locationOptions = [
  { value: 'lima', label: 'Lima' },
  { value: 'callao', label: 'Callao' },
  { value: 'san-isidro', label: 'San Isidro' },
  { value: 'miraflores', label: 'Miraflores' },
];

const ratingOptions = [
  { value: '4', label: '4+ Stars' },
  { value: '4.5', label: '4.5+ Stars' },
  { value: '5', label: '5 Stars' },
];

const sortOptions = [
  { value: 'rating', label: 'Highest Rated' },
  { value: 'experience', label: 'Most Experienced' },
  { value: 'distance', label: 'Nearest' },
  { value: 'name', label: 'Name A-Z' },
];

// Computed properties
const activeFilterCount = computed(() => {
  let count = 0;
  if (filters.serviceType) count++;
  if (filters.locationType === 'manual' && filters.selectedDistricts.length > 0)
    count++;
  if (filters.locationType === 'gps' && filters.gpsLocation) count++;
  if (
    filters.locationType === 'hybrid' &&
    (filters.selectedDistricts.length > 0 || filters.gpsLocation)
  )
    count++;
  if (filters.minRating) count++;
  if (filters.showFavoritesOnly) count++;
  if (filters.availableNow) count++;
  // sortBy is not counted as a filter in the badge
  return count;
});

const activeFilterTags = computed(() => {
  const tags = [];

  if (filters.serviceType) {
    const service = serviceOptions.find((s) => s.value === filters.serviceType);
    tags.push({
      key: 'serviceType',
      label: `${service?.icon} ${service?.label}`,
    });
  }
  if (filters.location) {
    const location = locationOptions.find((l) => l.value === filters.location);
    tags.push({ key: 'location', label: `📍 ${location?.label}` });
  }
  if (filters.minRating) {
    tags.push({ key: 'minRating', label: `⭐ ${filters.minRating}+ Stars` });
  }

  return tags;
});

// Methods
const updateFilters = () => {
  const activeFiltersPayload = { ...filters };
  // If user is not signed in, ensure showFavoritesOnly is false
  if (!isSignedIn.value) {
    activeFiltersPayload.showFavoritesOnly = false;
    if (filters.showFavoritesOnly) {
      // if it was true, reset it locally
      filters.showFavoritesOnly = false;
    }
  }
  emit('update:modelValue', activeFiltersPayload);
  emit('filter-change', activeFiltersPayload);
};

const toggleService = (value) => {
  filters.serviceType = filters.serviceType === value ? '' : value;
  updateFilters();
};

const toggleLocation = (value) => {
  // Handle district selection for manual/hybrid mode
  const index = selectedDistricts.value.indexOf(value);
  if (index > -1) {
    selectedDistricts.value.splice(index, 1);
  } else {
    selectedDistricts.value.push(value);
  }

  // Update filters
  filters.selectedDistricts = [...selectedDistricts.value];
  updateFilters();
};

const toggleShowFavoritesOnly = () => {
  if (!isSignedIn.value) {
    // Optionally, show a message or redirect to login
    alert('Please log in to see your favorite contractors.');
    filters.showFavoritesOnly = false; // Ensure it's off
    updateFilters();
    return;
  }
  filters.showFavoritesOnly = !filters.showFavoritesOnly;
  updateFilters();
};

// New location-related methods
const toggleLocationType = async (type) => {
  locationType.value = type;
  filters.locationType = type;

  if (type === 'gps' || type === 'hybrid') {
    await enableLocationAccess();
  }

  updateFilters();
};

// Combined function that checks support first, then requests permissions and location
const enableLocationAccess = async () => {
  if (isGettingLocation.value) return;

  isGettingLocation.value = true;

  try {
    // Step 1: Check if geolocation is supported
    const isSupported = await checkSupport();

    if (!isSupported) {
      alert(
        'Location services are not available on this device. This feature requires a mobile device with GPS capabilities.'
      );
      return;
    }

    // Step 2: Request permissions
    const hasPermission = await requestPermissions();

    if (!hasPermission) {
      const statusMessage =
        locationPermissionStatus.value === 'denied'
          ? 'Location permission was denied. Please enable location access in your device settings and try again.'
          : 'Location permission is required to show nearby contractors. Please allow location access when prompted.';
      alert(statusMessage);
      return;
    }

    // Step 3: Get current position
    const position = await getCurrentPosition();

    if (position) {
      currentGPSLocation.value = position;
      filters.gpsLocation = position;
      updateFilters();
    } else {
      alert(
        'Unable to get your current location. Please ensure location services are enabled and try again.'
      );
    }
  } catch (error) {
    // Provide more specific error messages
    let errorMessage = 'Unable to access location services.';
    if (error.message.includes('permission')) {
      errorMessage =
        'Location permission was denied. Please enable location access in your device settings.';
    } else if (error.message.includes('timeout')) {
      errorMessage =
        'Location request timed out. Please ensure you have a good GPS signal and try again.';
    } else if (error.message.includes('unavailable')) {
      errorMessage =
        'Location services are currently unavailable. Please check your device settings.';
    }

    alert(`${errorMessage}\n\nError details: ${error.message}`);
  } finally {
    isGettingLocation.value = false;
  }
};

// Keep the original function for backward compatibility (refresh functionality)
const requestGPSLocation = async () => {
  await enableLocationAccess();
};

const refreshLocation = async () => {
  await requestGPSLocation();
};

const updateGPSRadius = () => {
  filters.gpsRadius = gpsRadius.value;
  updateFilters();
};

const toggleRating = (value) => {
  filters.minRating = filters.minRating === value ? '' : value;
  updateFilters();
};

const toggleSort = (value) => {
  filters.sortBy = value;
  updateFilters();
};

const clearFilters = () => {
  // Reset location state
  locationType.value = 'manual';
  selectedDistricts.value = [];
  currentGPSLocation.value = null;
  gpsRadius.value = 10;

  // Reset filters
  Object.keys(filters).forEach((key) => {
    if (key === 'sortBy') {
      filters[key] = 'rating';
    } else if (key === 'locationType') {
      filters[key] = 'manual';
    } else if (key === 'selectedDistricts') {
      filters[key] = [];
    } else if (key === 'gpsLocation') {
      filters[key] = null;
    } else if (key === 'gpsRadius') {
      filters[key] = 10;
    } else if (key === 'showFavoritesOnly' || key === 'availableNow') {
      filters[key] = false; // Explicitly set boolean
    } else {
      filters[key] = ''; // For other string based filters
    }
  });
  updateFilters();
};

const removeFilter = (filterKey) => {
  if (filterKey === 'sortBy') {
    filters[filterKey] = 'rating';
  } else {
    filters[filterKey] = '';
  }
  updateFilters();
};

// Quick filter methods
const toggleQuickFilter = async (value) => {
  switch (value) {
    case 'top-rated':
      filters.minRating = filters.minRating === '4.5' ? '' : '4.5';
      filters.sortBy = 'rating';
      break;
    case 'nearby':
      if (
        filters.sortBy === 'distance' &&
        (locationType.value === 'gps' || locationType.value === 'hybrid')
      ) {
        // If already using GPS nearby, turn it off
        filters.sortBy = 'rating';
        locationType.value = 'manual';
        filters.locationType = 'manual';
      } else {
        // Switch to GPS mode and request location
        locationType.value = 'gps';
        filters.locationType = 'gps';
        filters.sortBy = 'distance';
        await enableLocationAccess();
      }
      break;
    case 'available-now':
      // Toggle the available now filter
      filters.availableNow = !filters.availableNow;
      break;
  }
  updateFilters();
};

const isQuickFilterActive = (value) => {
  switch (value) {
    case 'top-rated':
      return filters.minRating === '4.5' && filters.sortBy === 'rating';
    case 'nearby':
      return (
        filters.sortBy === 'distance' &&
        (locationType.value === 'gps' || locationType.value === 'hybrid') &&
        currentGPSLocation.value
      );
    case 'available-now':
      return filters.availableNow;
    default:
      return false;
  }
};

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

// Watchers
watch(
  () => props.modelValue,
  (newVal) => {
    Object.assign(filters, newVal);
    // Sync internal location state if modelValue changes it
    if (newVal.locationType) locationType.value = newVal.locationType;
    if (newVal.selectedDistricts)
      selectedDistricts.value = [...newVal.selectedDistricts];
    if (newVal.gpsLocation) currentGPSLocation.value = newVal.gpsLocation;
    if (newVal.gpsRadius) gpsRadius.value = newVal.gpsRadius;
    if (typeof newVal.showFavoritesOnly === 'boolean') {
      filters.showFavoritesOnly = newVal.showFavoritesOnly;
    }
  },
  { deep: true }
);

// Watch for sign-in state changes to potentially disable/reset favorites filter
watch(isSignedIn, (signedIn) => {
  if (!signedIn && filters.showFavoritesOnly) {
    filters.showFavoritesOnly = false;
    updateFilters();
  }
});

// Lifecycle
onMounted(async () => {
  checkMobile();
  window.addEventListener('resize', checkMobile);

  // CRITICAL: Initialize geolocation support on component mount
  // This is required for permission requests to work properly
  try {
    await checkSupport();
  } catch (error) {
    // Silent initialization failure
  } finally {
    isInitializingSupport.value = false;
  }
});
</script>

<style scoped>
/* Ultra-minimal filter chip design inspired by Airbnb - Tailwind v4 Compatible */
.filter-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 1rem;
  font-size: var(--font-size-sm);
  font-weight: 400;
  border: 1px solid;
  border-radius: 9999px;
  transition: all 0.2s;
  transform-origin: center;
  gap: 0.375rem;

  /* Light mode styles using Tailwind v4 variables */
  border-color: rgba(229, 231, 235, 0.6);
  background-color: rgba(255, 255, 255, 0.8);
  color: #4b5563; /* gray-600 */
  /* backdrop-filter and -webkit-backdrop-filter removed for simplicity, can be added if needed */
}

/* Removed .filter-chip__icon and .filter-chip__label as they are no longer used */

.filter-pill {
  display: inline-flex;
  align-items: center;
  padding: 0px 12px; /* Adjusted padding for 32px height with 1px border */
  height: 32px;
  font-size: 0.875rem; /* 14px */
  font-weight: 400;
  border: 1px solid #d1d5db; /* gray-300 */
  border-radius: 9999px; /* rounded-full */
  transition: all 0.15s ease-out;
  gap: 0.375rem; /* gap-1.5 */
  background-color: transparent;
  color: #4b5563; /* gray-600 */
  cursor: pointer;
  box-sizing: border-box;
}

.filter-pill:hover {
  border-color: #9ca3af; /* gray-400 */
  background-color: #f9fafb; /* gray-50 */
}

.filter-pill:focus {
  outline: none;
  box-shadow: 0 0 0 2px #9ca3af; /* ring-1 ring-gray-400 */
}

.filter-pill--active {
  background-color: #111827; /* black */
  color: white;
  border-color: #111827; /* black */
}

.filter-pill--active:hover {
  background-color: #1f2937; /* gray-800 */
  border-color: #1f2937; /* gray-800 */
}

.filter-pill--icon-only {
  padding: 0px 8px; /* Adjust padding for icon-only button */
  width: 32px; /* Ensure it's square-ish for icon */
  justify-content: center;
  position: relative; /* Added for badge positioning */
}

.filter-pill--icon-only svg {
  margin: 0; /* Remove any default margins from SVG if it's a direct child */
}

.filter-count-badge-minimal {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #111827; /* black */
  color: white;
  border-radius: 50%;
  font-size: 0.65rem; /* smaller font */
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  border: 1px solid white; /* To make it pop on dark backgrounds */
}

/* Dark mode styles for filter-pill */
.dark .filter-pill {
  border-color: #4b5563; /* gray-600 */
  background-color: #2d3748; /* A slightly lighter dark gray, e.g., gray-750 if it existed */
  color: #a0aec0; /* gray-400 or 500 for text */
}

.dark .filter-pill:hover {
  border-color: #6b7280; /* gray-500 */
  background-color: #4a5568; /* gray-600 or similar */
}

.dark .filter-pill--active {
  background-color: #1a202c; /* black or very dark gray, e.g., gray-900 */
  color: #f7fafc; /* white or very light gray, e.g., gray-100 */
  border-color: #1a202c; /* same as background */
}

.dark .filter-pill--active:hover {
  background-color: #2d3748; /* gray-800 or similar */
  border-color: #2d3748; /* gray-800 or similar */
}

.dark .filter-count-badge-minimal {
  background-color: #f9fafb; /* gray-50 */
  color: #1f2937; /* gray-800 */
  border-color: #1f2937; /* gray-800 */
}

/* Styles for the sort dropdown to look like a pill */
.sort-select-minimal {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1.25em 1.25em;
  padding-right: 2.5rem; /* Make space for the arrow */
}

.dark .sort-select-minimal {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
}

/* Advanced Filter Controls (Modal) Styling */
.filter-controls {
  /* Basic modal styling, can be enhanced */
  background-color: white;
  border: 1px solid #e5e7eb; /* gray-200 */
  border-radius: 0.5rem; /* rounded-lg */
  padding: 1.5rem; /* p-6 */
  margin-top: 0.5rem;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05); /* shadow-lg */
}

.dark .filter-controls {
  background-color: #1f2937; /* gray-800, modal background */
  border-color: #374151; /* gray-700 */
}

/* Specific styles for pills inside the dark mode modal */
.dark .filter-controls .filter-pill {
  border-color: #4a5568; /* gray-600, darker border for pills */
  background-color: #2d3748; /* gray-700, slightly lighter than modal bg for inactive pills */
  color: #cbd5e0; /* gray-400, light text for inactive pills */
}

.dark .filter-controls .filter-pill:hover {
  border-color: #606f7b; /* gray-550 (example) */
  background-color: #374151; /* gray-700 but distinct from default */
}

.dark .filter-controls .filter-pill.filter-pill--active {
  background-color: #a0aec0; /* gray-400, light background for active pills */
  color: #1a202c; /* gray-900, dark text for active pills */
  border-color: #a0aec0; /* gray-400 */
}

.dark .filter-controls .filter-pill.filter-pill--active:hover {
  background-color: #cbd5e0; /* gray-300 */
  border-color: #cbd5e0; /* gray-300 */
}

.filter-group {
  margin-bottom: 1.5rem; /* space-y-6 equivalent for groups */
}
.filter-group:last-child {
  margin-bottom: 0;
}

.filter-group__label {
  display: block;
  font-size: 0.875rem; /* text-sm */
  font-weight: 500; /* font-medium */
  color: #374151; /* text-gray-700 */
  margin-bottom: 0.5rem; /* space-y-2 on parent */
}
.dark .filter-group__label {
  color: #d1d5db; /* gray-300 */
}

/* Style for buttons inside the advanced filter modal */
.filter-controls .filter-pill {
  /* Use existing pill styles, maybe with slight variation if needed */
}

.clear-filters-btn {
  /* Style for clear button */
  display: inline-block;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563; /* gray-600 */
  background-color: transparent;
  border: 1px solid #d1d5db; /* gray-300 */
  border-radius: 0.375rem; /* rounded-md */
  transition: all 0.15s ease-out;
}
.clear-filters-btn:hover {
  background-color: #f3f4f6; /* gray-100 */
  border-color: #9ca3af; /* gray-400 */
}
.dark .clear-filters-btn {
  color: #d1d5db; /* gray-300 */
  border-color: #4b5563; /* gray-600 */
}
.dark .clear-filters-btn:hover {
  background-color: #374151; /* gray-700 */
  border-color: #6b7280; /* gray-500 */
}

/* Remove old filter-toggle-btn and filter-count-badge styles if no longer used */
.filter-toggle-btn,
.filter-count-badge {
  /* These might be obsolete now, review and remove if not used by other elements */
}

/* Ensure the advanced filter controls are hidden by default */
.filter-controls.hidden {
  display: none;
}

/* Sort select styles are now handled by .sort-select-minimal and .filter-pill */

.dark .sort-select:hover {
  border-color: rgba(75, 85, 99, 0.8);
}

.dark .sort-select:focus {
  box-shadow: 0 0 0 2px rgba(55, 65, 81, 0.5);
  border-color: rgba(107, 114, 128, 0.8);
}

.dark .sort-select {
  border-color: rgba(55, 65, 81, 0.6);
  background-color: rgba(17, 24, 39, 0.8);
}

/* Filter group labels */
.filter-group__label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
  letter-spacing: -0.025em;
  color: var(--color-gray-600);
}

.dark .filter-group__label {
  color: var(--color-gray-400);
}

/* Clear filters button */
.clear-filters-btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid;
  border-radius: 9999px;
  transition: all 0.2s;

  /* Light mode styles */
  color: var(--color-gray-700);
  border-color: rgba(229, 231, 235, 0.6);
  background-color: rgba(243, 244, 246, 0.8);
}

.clear-filters-btn:hover {
  border-color: rgba(209, 213, 219, 0.8);
  background-color: rgba(229, 231, 235, 0.8);
}

.clear-filters-btn:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(229, 231, 235, 0.5);
}

/* Dark mode styles */
.dark .clear-filters-btn {
  color: var(--color-gray-300);
  border-color: rgba(55, 65, 81, 0.6);
  background-color: rgba(31, 41, 55, 0.8);
}

.dark .clear-filters-btn:hover {
  border-color: rgba(75, 85, 99, 0.8);
  background-color: rgba(55, 65, 81, 0.8);
}

.dark .clear-filters-btn:focus {
  box-shadow: 0 0 0 2px rgba(55, 65, 81, 0.5);
}

/* Active filter tags */
.active-filter-tag {
  display: inline-flex;
  align-items: center;
  font-size: 0.875rem;
  border: 1px solid;
  border-radius: 9999px;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;

  /* Light mode styles */
  color: var(--color-gray-700);
  border-color: rgba(229, 231, 235, 0.6);
  background-color: rgba(243, 244, 246, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.dark .active-filter-tag {
  color: var(--color-gray-300);
  border-color: rgba(55, 65, 81, 0.6);
  background-color: rgba(31, 41, 55, 0.8);
}

.active-filter-tag__remove {
  font-size: 0.75rem;
  transition: color 0.15s;
  color: var(--color-gray-500);
}

.active-filter-tag__remove:hover {
  color: var(--color-gray-700);
}

.active-filter-tag__remove:focus {
  outline: none;
}

.dark .active-filter-tag__remove {
  color: var(--color-gray-400);
}

.dark .active-filter-tag__remove:hover {
  color: var(--color-gray-200);
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .filter-chip {
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
  }

  .filter-chip__label {
    font-size: 0.8125rem;
  }

  .filter-toggle-btn,
  .sort-select {
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
  }
}

/* Smooth animations */
.filter-chip,
.filter-toggle-btn,
.sort-select,
.clear-filters-btn {
  transform-origin: center;
  will-change: transform, background-color, border-color;
}

/* Focus states for accessibility */
.filter-chip:focus-visible,
.filter-toggle-btn:focus-visible,
.sort-select:focus-visible,
.clear-filters-btn:focus-visible {
  box-shadow:
    0 0 0 2px var(--color-white),
    0 0 0 4px var(--color-gray-400);
}

.dark .filter-chip:focus-visible,
.dark .filter-toggle-btn:focus-visible,
.dark .sort-select:focus-visible,
.dark .clear-filters-btn:focus-visible {
  box-shadow:
    0 0 0 2px var(--color-gray-900),
    0 0 0 4px var(--color-gray-500);
}
</style>
