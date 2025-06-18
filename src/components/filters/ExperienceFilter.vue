<template>
  <div class="experience-filter">
    <div class="experience-options space-y-2">
      <label
        v-for="option in experienceOptions"
        :key="option.value"
        class="experience-option"
      >
        <input
          type="radio"
          :value="option.value"
          v-model="selectedExperience"
          class="experience-radio"
        />
        <div class="experience-content">
          <span class="experience-label">{{ option.label }}</span>
          <span class="experience-description">{{ option.description }}</span>
        </div>
      </label>

      <!-- Clear selection option -->
      <label class="experience-option">
        <input
          type="radio"
          :value="null"
          v-model="selectedExperience"
          class="experience-radio"
        />
        <div class="experience-content">
          <span class="experience-label text-gray-500">Any Experience</span>
        </div>
      </label>
    </div>

    <!-- Custom range slider (optional advanced feature) -->
    <div
      v-if="showCustomRange"
      class="custom-range mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
    >
      <Label class="text-sm font-medium mb-2 block">Custom Range</Label>
      <div class="flex items-center space-x-3">
        <Input
          v-model.number="customMin"
          type="number"
          min="0"
          max="50"
          placeholder="Min"
          class="w-20"
        />
        <span class="text-gray-500">to</span>
        <Input
          v-model.number="customMax"
          type="number"
          min="0"
          max="50"
          placeholder="Max"
          class="w-20"
        />
        <span class="text-sm text-gray-500">years</span>
        <Button size="sm" variant="outline" @click="applyCustomRange">
          Apply
        </Button>
      </div>
    </div>

    <Button
      variant="ghost"
      size="sm"
      @click="showCustomRange = !showCustomRange"
      class="mt-2 text-xs text-gray-500 hover:text-gray-700"
    >
      {{ showCustomRange ? 'Hide' : 'Show' }} Custom Range
    </Button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const props = defineProps({
  modelValue: { type: Array, default: () => null },
});

const emit = defineEmits(['update:modelValue']);

const selectedExperience = ref(props.modelValue);
const showCustomRange = ref(false);
const customMin = ref(0);
const customMax = ref(10);

const experienceOptions = [
  {
    value: [0, 2],
    label: 'Entry Level',
    description: '0-2 years',
  },
  {
    value: [2, 5],
    label: 'Some Experience',
    description: '2-5 years',
  },
  {
    value: [5, 10],
    label: 'Experienced',
    description: '5-10 years',
  },
  {
    value: [10, 20],
    label: 'Very Experienced',
    description: '10-20 years',
  },
  {
    value: [20, 50],
    label: 'Expert',
    description: '20+ years',
  },
];

const applyCustomRange = () => {
  if (customMin.value >= 0 && customMax.value > customMin.value) {
    selectedExperience.value = [customMin.value, customMax.value];
    showCustomRange.value = false;
  }
};

watch(
  selectedExperience,
  (newValue) => {
    emit('update:modelValue', newValue);
  },
  { deep: true }
);

watch(
  () => props.modelValue,
  (newValue) => {
    selectedExperience.value = newValue;
  }
);
</script>

<style scoped>
@reference "@/style.css";

.experience-option {
  @apply flex items-start space-x-3 p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer;
  @apply transition-colors duration-150;
  @apply min-h-[44px]; /* Touch-friendly target */
}

.experience-radio {
  @apply w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600;
  @apply focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400;
  @apply mt-0.5; /* Align with first line of text */
}

.experience-content {
  @apply flex flex-col space-y-1 flex-1;
}

.experience-label {
  @apply text-sm font-medium text-gray-700 dark:text-gray-200;
}

.experience-description {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.experience-option:hover .experience-label {
  @apply text-gray-900 dark:text-white;
}

.experience-option:hover .experience-description {
  @apply text-gray-600 dark:text-gray-300;
}

/* Highlight selected option */
.experience-option:has(input:checked) {
  @apply bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800;
}

.experience-option:has(input:checked) .experience-label {
  @apply text-blue-700 dark:text-blue-300 font-semibold;
}

.experience-option:has(input:checked) .experience-description {
  @apply text-blue-600 dark:text-blue-400;
}
</style>
