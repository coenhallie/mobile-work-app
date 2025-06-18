<template>
  <div class="location-filter">
    <!-- Search within locations -->
    <div class="location-search mb-3">
      <div class="relative">
        <MapPin
          class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
        />
        <Input
          v-model="searchQuery"
          placeholder="Search districts..."
          class="pl-10"
        />
      </div>
    </div>

    <!-- Popular districts first -->
    <div class="popular-districts mb-4">
      <h4 class="category-title">Popular Districts</h4>
      <div class="district-options grid grid-cols-1 gap-2">
        <label
          v-for="district in popularDistricts"
          :key="district"
          class="district-option"
        >
          <input
            type="checkbox"
            :value="district"
            v-model="selectedLocations"
            class="district-checkbox"
          />
          <span class="district-label">{{ district }}</span>
        </label>
      </div>
    </div>

    <!-- All Lima districts -->
    <div class="all-districts">
      <h4 class="category-title">All Lima Districts</h4>
      <div
        class="district-options grid grid-cols-1 gap-2 max-h-48 overflow-y-auto"
      >
        <label
          v-for="district in filteredDistricts"
          :key="district"
          class="district-option"
        >
          <input
            type="checkbox"
            :value="district"
            v-model="selectedLocations"
            class="district-checkbox"
          />
          <span class="district-label">{{ district }}</span>
        </label>
      </div>
    </div>

    <!-- Selected count -->
    <div v-if="selectedLocations.length > 0" class="mt-3 text-xs text-gray-500">
      {{ selectedLocations.length }} district{{
        selectedLocations.length !== 1 ? 's' : ''
      }}
      selected
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { MapPin } from 'lucide-vue-next';
import { Input } from '@/components/ui/input';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:modelValue']);

const searchQuery = ref('');
const selectedLocations = ref([...props.modelValue]);

// Popular districts that are commonly searched
const popularDistricts = [
  'Miraflores',
  'San Isidro',
  'Santiago de Surco',
  'La Molina',
  'San Borja',
  'Barranco',
  'Jesús María',
  'Magdalena del Mar',
  'Pueblo Libre',
  'San Miguel',
];

// All Lima districts from peruDistricts.js
const allLimaDistricts = [
  'Lima',
  'Ancón',
  'Ate',
  'Barranco',
  'Breña',
  'Carabayllo',
  'Chaclacayo',
  'Chorrillos',
  'Cieneguilla',
  'Comas',
  'El Agustino',
  'Independencia',
  'Jesús María',
  'La Molina',
  'La Victoria',
  'Lince',
  'Los Olivos',
  'Lurigancho',
  'Lurín',
  'Magdalena del Mar',
  'Miraflores',
  'Pachacámac',
  'Pucusana',
  'Pueblo Libre',
  'Puente Piedra',
  'Punta Hermosa',
  'Punta Negra',
  'Rímac',
  'San Bartolo',
  'San Borja',
  'San Isidro',
  'San Juan de Lurigancho',
  'San Juan de Miraflores',
  'San Luis',
  'San Martín de Porres',
  'San Miguel',
  'Santa Anita',
  'Santa María del Mar',
  'Santa Rosa',
  'Santiago de Surco',
  'Surquillo',
  'Villa El Salvador',
  'Villa María del Triunfo',
];

const filteredDistricts = computed(() => {
  if (!searchQuery.value) return allLimaDistricts;

  return allLimaDistricts.filter((district) =>
    district.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

watch(
  selectedLocations,
  (newValue) => {
    emit('update:modelValue', newValue);
  },
  { deep: true }
);

watch(
  () => props.modelValue,
  (newValue) => {
    selectedLocations.value = [...newValue];
  }
);
</script>

<style scoped>
@reference "@/style.css";

.category-title {
  @apply text-sm font-medium text-gray-600 dark:text-gray-300 mb-2;
}

.district-option {
  @apply flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer;
  @apply transition-colors duration-150;
  @apply min-h-[44px]; /* Touch-friendly target */
}

.district-checkbox {
  @apply rounded border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400;
  @apply text-blue-600 dark:text-blue-400;
  @apply w-4 h-4;
}

.district-label {
  @apply text-sm text-gray-700 dark:text-gray-200 flex-1;
}

.district-option:hover .district-label {
  @apply text-gray-900 dark:text-white;
}

/* Custom scrollbar */
.district-options::-webkit-scrollbar {
  @apply w-2;
}

.district-options::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-800 rounded;
}

.district-options::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded;
}

.district-options::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-500;
}
</style>
