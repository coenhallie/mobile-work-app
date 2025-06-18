<template>
  <div class="price-range-filter">
    <div class="price-options space-y-2">
      <label
        v-for="option in priceOptions"
        :key="option.value"
        class="price-option"
      >
        <input
          type="radio"
          :value="option.value"
          v-model="selectedPriceRange"
          class="price-radio"
        />
        <div class="price-content">
          <span class="price-label">{{ option.label }}</span>
          <span class="price-description">{{ option.description }}</span>
        </div>
      </label>

      <!-- Clear selection option -->
      <label class="price-option">
        <input
          type="radio"
          :value="null"
          v-model="selectedPriceRange"
          class="price-radio"
        />
        <div class="price-content">
          <span class="price-label text-gray-500">Any Price</span>
        </div>
      </label>
    </div>

    <!-- Custom range slider -->
    <div
      v-if="showCustomRange"
      class="custom-range mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
    >
      <Label class="text-sm font-medium mb-2 block">Custom Price Range</Label>
      <div class="flex items-center space-x-3">
        <div class="flex items-center">
          <span class="text-sm text-gray-500 mr-1">S/</span>
          <Input
            v-model.number="customMin"
            type="number"
            min="0"
            max="10000"
            placeholder="Min"
            class="w-24"
          />
        </div>
        <span class="text-gray-500">to</span>
        <div class="flex items-center">
          <span class="text-sm text-gray-500 mr-1">S/</span>
          <Input
            v-model.number="customMax"
            type="number"
            min="0"
            max="10000"
            placeholder="Max"
            class="w-24"
          />
        </div>
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

const selectedPriceRange = ref(props.modelValue);
const showCustomRange = ref(false);
const customMin = ref(0);
const customMax = ref(500);

const priceOptions = [
  {
    value: [0, 100],
    label: 'Budget Friendly',
    description: 'S/0 - S/100',
  },
  {
    value: [100, 300],
    label: 'Moderate',
    description: 'S/100 - S/300',
  },
  {
    value: [300, 500],
    label: 'Premium',
    description: 'S/300 - S/500',
  },
  {
    value: [500, 1000],
    label: 'High-End',
    description: 'S/500 - S/1,000',
  },
  {
    value: [1000, 10000],
    label: 'Luxury',
    description: 'S/1,000+',
  },
];

const applyCustomRange = () => {
  if (customMin.value >= 0 && customMax.value > customMin.value) {
    selectedPriceRange.value = [customMin.value, customMax.value];
    showCustomRange.value = false;
  }
};

watch(
  selectedPriceRange,
  (newValue) => {
    emit('update:modelValue', newValue);
  },
  { deep: true }
);

watch(
  () => props.modelValue,
  (newValue) => {
    selectedPriceRange.value = newValue;
  }
);
</script>

<style scoped>
@reference "@/style.css";

.price-option {
  @apply flex items-start space-x-3 p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer;
  @apply transition-colors duration-150;
  @apply min-h-[44px]; /* Touch-friendly target */
}

.price-radio {
  @apply w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600;
  @apply focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400;
  @apply mt-0.5; /* Align with first line of text */
}

.price-content {
  @apply flex flex-col space-y-1 flex-1;
}

.price-label {
  @apply text-sm font-medium text-gray-700 dark:text-gray-200;
}

.price-description {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.price-option:hover .price-label {
  @apply text-gray-900 dark:text-white;
}

.price-option:hover .price-description {
  @apply text-gray-600 dark:text-gray-300;
}

/* Highlight selected option */
.price-option:has(input:checked) {
  @apply bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800;
}

.price-option:has(input:checked) .price-label {
  @apply text-blue-700 dark:text-blue-300 font-semibold;
}

.price-option:has(input:checked) .price-description {
  @apply text-blue-600 dark:text-blue-400;
}
</style>
