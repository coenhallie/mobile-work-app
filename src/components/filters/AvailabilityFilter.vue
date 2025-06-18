<template>
  <div class="availability-filter">
    <div class="availability-options space-y-2">
      <label
        v-for="option in availabilityOptions"
        :key="option.value"
        class="availability-option"
      >
        <input
          type="radio"
          :value="option.value"
          v-model="selectedAvailability"
          class="availability-radio"
        />
        <div class="availability-content">
          <div class="flex items-center space-x-2">
            <component :is="option.icon" class="w-4 h-4 text-gray-500" />
            <span class="availability-label">{{ option.label }}</span>
          </div>
          <span class="availability-description">{{ option.description }}</span>
        </div>
      </label>

      <!-- Clear selection option -->
      <label class="availability-option">
        <input
          type="radio"
          :value="null"
          v-model="selectedAvailability"
          class="availability-radio"
        />
        <div class="availability-content">
          <div class="flex items-center space-x-2">
            <Clock class="w-4 h-4 text-gray-400" />
            <span class="availability-label text-gray-500"
              >Any Availability</span
            >
          </div>
        </div>
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { Clock, Zap, Calendar, Users } from 'lucide-vue-next';

const props = defineProps({
  modelValue: { type: String, default: null },
});

const emit = defineEmits(['update:modelValue']);

const selectedAvailability = ref(props.modelValue);

const availabilityOptions = [
  {
    value: 'immediate',
    label: 'Available Now',
    description: 'Can start immediately',
    icon: Zap,
  },
  {
    value: 'within_week',
    label: 'Within a Week',
    description: 'Available within 7 days',
    icon: Calendar,
  },
  {
    value: 'flexible',
    label: 'Flexible Schedule',
    description: 'Can work around your schedule',
    icon: Users,
  },
];

watch(selectedAvailability, (newValue) => {
  emit('update:modelValue', newValue);
});

watch(
  () => props.modelValue,
  (newValue) => {
    selectedAvailability.value = newValue;
  }
);
</script>

<style scoped>
@reference "@/style.css";

.availability-option {
  @apply flex items-start space-x-3 p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer;
  @apply transition-colors duration-150;
  @apply min-h-[44px]; /* Touch-friendly target */
}

.availability-radio {
  @apply w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600;
  @apply focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400;
  @apply mt-0.5; /* Align with first line of text */
}

.availability-content {
  @apply flex flex-col space-y-1 flex-1;
}

.availability-label {
  @apply text-sm font-medium text-gray-700 dark:text-gray-200;
}

.availability-description {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.availability-option:hover .availability-label {
  @apply text-gray-900 dark:text-white;
}

.availability-option:hover .availability-description {
  @apply text-gray-600 dark:text-gray-300;
}

/* Highlight selected option */
.availability-option:has(input:checked) {
  @apply bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800;
}

.availability-option:has(input:checked) .availability-label {
  @apply text-blue-700 dark:text-blue-300 font-semibold;
}

.availability-option:has(input:checked) .availability-description {
  @apply text-blue-600 dark:text-blue-400;
}
</style>
