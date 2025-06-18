<template>
  <div class="text-center space-y-8 py-8">
    <!-- App Icon and Welcome -->
    <div class="space-y-4">
      <div
        class="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"
      >
        <svg
          class="w-10 h-10 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h10M7 15h10"
          />
        </svg>
      </div>

      <div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">
          Welcome to HandyApp
        </h1>
        <p class="text-gray-600 text-lg leading-relaxed">
          Find skilled work opportunities<br />
          in your neighborhood
        </p>
      </div>
    </div>

    <!-- Location Selection Options -->
    <div class="space-y-4">
      <!-- GPS Location Option -->
      <button
        @click="detectLocation"
        :disabled="isDetectingLocation"
        class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl p-4 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
      >
        <div class="flex items-center justify-center space-x-3">
          <div
            v-if="isDetectingLocation"
            class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"
          ></div>
          <svg
            v-else
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <div class="text-left">
            <div class="font-semibold">
              {{
                isDetectingLocation
                  ? 'Detecting Location...'
                  : 'Detect My Location'
              }}
            </div>
            <div class="text-sm text-blue-100">Auto-detect using GPS</div>
          </div>
        </div>
      </button>

      <!-- Manual Location Selection -->
      <button
        @click="showLocationPicker = true"
        class="w-full bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-gray-300 rounded-xl p-4 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
      >
        <div class="flex items-center justify-center space-x-3">
          <svg
            class="w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"
            />
          </svg>
          <div class="text-left">
            <div class="font-semibold">Choose My District</div>
            <div class="text-sm text-gray-500">Manual selection</div>
          </div>
        </div>
      </button>
    </div>

    <!-- Skip Option -->
    <div class="pt-4">
      <button
        @click="$emit('skip')"
        class="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
      >
        Skip for now
      </button>
    </div>

    <!-- Location Picker Modal -->
    <div
      v-if="showLocationPicker"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showLocationPicker = false"
    >
      <div
        class="bg-white rounded-xl max-w-sm w-full max-h-96 overflow-hidden shadow-2xl"
      >
        <div class="p-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              Select Your District
            </h3>
            <button
              @click="showLocationPicker = false"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div class="p-4">
          <!-- Search Input -->
          <div class="mb-4">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search districts..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <!-- Districts List -->
          <div class="max-h-64 overflow-y-auto space-y-1">
            <button
              v-for="district in filteredDistricts"
              :key="district.id"
              @click="selectDistrict(district)"
              class="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div class="font-medium text-gray-900">{{ district.name }}</div>
              <div class="text-sm text-gray-500">{{ district.province }}</div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div
      v-if="locationError"
      class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700"
    >
      <div class="flex items-center space-x-2">
        <svg
          class="w-5 h-5 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span class="text-sm">{{ locationError }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { peruDistricts } from '@/data/peruDistricts';

// Emits
const emit = defineEmits(['location-selected', 'skip']);

// Reactive state
const isDetectingLocation = ref(false);
const showLocationPicker = ref(false);
const searchQuery = ref('');
const locationError = ref('');

// Available districts (using existing data)
const availableDistricts = ref(
  peruDistricts || [
    { id: 'miraflores', name: 'Miraflores', province: 'Lima' },
    { id: 'san_isidro', name: 'San Isidro', province: 'Lima' },
    { id: 'surco', name: 'Surco', province: 'Lima' },
    { id: 'san_borja', name: 'San Borja', province: 'Lima' },
    { id: 'barranco', name: 'Barranco', province: 'Lima' },
    { id: 'la_molina', name: 'La Molina', province: 'Lima' },
    { id: 'pueblo_libre', name: 'Pueblo Libre', province: 'Lima' },
    { id: 'magdalena', name: 'Magdalena del Mar', province: 'Lima' },
    { id: 'jesus_maria', name: 'Jesús María', province: 'Lima' },
    { id: 'lince', name: 'Lince', province: 'Lima' },
  ]
);

// Computed
const filteredDistricts = computed(() => {
  if (!searchQuery.value) return availableDistricts.value;

  const query = searchQuery.value.toLowerCase();
  return availableDistricts.value.filter(
    (district) =>
      district.name.toLowerCase().includes(query) ||
      district.province.toLowerCase().includes(query)
  );
});

// Methods
const detectLocation = async () => {
  if (!navigator.geolocation) {
    locationError.value = 'Geolocation is not supported by this browser';
    return;
  }

  isDetectingLocation.value = true;
  locationError.value = '';

  try {
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;

    // Find nearest district based on coordinates
    const nearestDistrict = await findNearestDistrict(latitude, longitude);

    if (nearestDistrict) {
      emit('location-selected', nearestDistrict, 'gps');
    } else {
      locationError.value =
        'Could not determine your district. Please select manually.';
      showLocationPicker.value = true;
    }
  } catch (error) {
    console.error('Geolocation error:', error);

    switch (error.code) {
      case error.PERMISSION_DENIED:
        locationError.value =
          'Location access denied. Please select your district manually.';
        break;
      case error.POSITION_UNAVAILABLE:
        locationError.value =
          'Location information unavailable. Please select manually.';
        break;
      case error.TIMEOUT:
        locationError.value =
          'Location request timed out. Please select manually.';
        break;
      default:
        locationError.value =
          'Unable to detect location. Please select manually.';
        break;
    }

    showLocationPicker.value = true;
  } finally {
    isDetectingLocation.value = false;
  }
};

const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
    });
  });
};

const findNearestDistrict = async (latitude, longitude) => {
  // Simple distance calculation to find nearest district
  // In a real app, you'd use a proper geocoding service

  // Lima center coordinates for basic distance calculation
  const districtCoordinates = {
    miraflores: { lat: -12.1211, lng: -77.0282 },
    san_isidro: { lat: -12.0931, lng: -77.0465 },
    surco: { lat: -12.1391, lng: -76.9938 },
    san_borja: { lat: -12.1089, lng: -77.0003 },
    barranco: { lat: -12.1464, lng: -77.0206 },
    la_molina: { lat: -12.0865, lng: -76.9581 },
    pueblo_libre: { lat: -12.0742, lng: -77.0631 },
    magdalena: { lat: -12.0964, lng: -77.0748 },
    jesus_maria: { lat: -12.0742, lng: -77.0489 },
    lince: { lat: -12.0889, lng: -77.0364 },
  };

  let nearestDistrict = null;
  let minDistance = Infinity;

  for (const [districtId, coords] of Object.entries(districtCoordinates)) {
    const distance = calculateDistance(
      latitude,
      longitude,
      coords.lat,
      coords.lng
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestDistrict = availableDistricts.value.find(
        (d) => d.id === districtId
      );
    }
  }

  // Only return if within reasonable distance (50km)
  return minDistance < 50 ? nearestDistrict : null;
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const selectDistrict = (district) => {
  showLocationPicker.value = false;
  searchQuery.value = '';
  emit('location-selected', district, 'manual');
};

// Lifecycle
onMounted(() => {
  // Clear any previous errors
  locationError.value = '';
});
</script>

<style scoped>
/* Custom scrollbar for districts list */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
