<template>
  <div class="service-filter">
    <!-- Search within services -->
    <div class="service-search mb-3">
      <div class="relative">
        <Search
          class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
        />
        <Input
          v-model="searchQuery"
          placeholder="Search services..."
          class="pl-10"
        />
      </div>
    </div>

    <!-- Service categories -->
    <div class="service-categories space-y-3 max-h-64 overflow-y-auto">
      <div
        v-for="category in filteredCategories"
        :key="category.name"
        class="category-group"
      >
        <h4 class="category-title">{{ category.name }}</h4>
        <div class="service-options grid grid-cols-1 gap-2">
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

    <!-- Selected count -->
    <div v-if="selectedServices.length > 0" class="mt-3 text-xs text-gray-500">
      {{ selectedServices.length }} service{{
        selectedServices.length !== 1 ? 's' : ''
      }}
      selected
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Search } from 'lucide-vue-next';
import { Input } from '@/components/ui/input';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:modelValue']);

const searchQuery = ref('');
const selectedServices = ref([...props.modelValue]);

// Service categories based on the existing codebase
const serviceCategories = [
  {
    name: 'Home Repair',
    services: [
      'AC Repair',
      'Electrical Repairs',
      'Plumbing Fixes',
      'Carpentry',
      'Locksmith',
      'Appliance Repair',
      'Roofing',
      'Painting',
    ],
  },
  {
    name: 'Cleaning',
    services: [
      'Deep Cleaning',
      'Standard Home Cleaning',
      'Office Cleaning',
      'Window Cleaning',
      'Carpet Cleaning',
      'Post-Construction Cleaning',
    ],
  },
  {
    name: 'Education',
    services: [
      'Math Tutoring',
      'English Lessons',
      'Guitar Lessons',
      'Piano Lessons',
      'Spanish Tutoring',
      'Computer Skills',
    ],
  },
  {
    name: 'Beauty & Wellness',
    services: [
      'Manicure',
      'Pedicure',
      'Mobile Haircut',
      'Massage Therapy',
      'Personal Training',
    ],
  },
  {
    name: 'Gardening',
    services: [
      'Lawn Mowing',
      'Planting Services',
      'Weed Removal',
      'Tree Trimming',
      'Garden Design',
    ],
  },
  {
    name: 'Technology',
    services: [
      'Computer Repair',
      'Phone Repair',
      'TV Installation',
      'Smart Home Setup',
      'Network Setup',
    ],
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
@reference "@/style.css";

.category-title {
  @apply text-sm font-medium text-gray-600 dark:text-gray-300 mb-2;
}

.service-option {
  @apply flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer;
  @apply transition-colors duration-150;
  @apply min-h-[44px]; /* Touch-friendly target */
}

.service-checkbox {
  @apply rounded border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400;
  @apply text-blue-600 dark:text-blue-400;
  @apply w-4 h-4;
}

.service-label {
  @apply text-sm text-gray-700 dark:text-gray-200 flex-1;
}

.service-option:hover .service-label {
  @apply text-gray-900 dark:text-white;
}

/* Custom scrollbar */
.service-categories::-webkit-scrollbar {
  @apply w-2;
}

.service-categories::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-800 rounded;
}

.service-categories::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded;
}

.service-categories::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-500;
}
</style>
