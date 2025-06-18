<template>
  <div class="rating-filter">
    <div class="rating-options space-y-2">
      <label
        v-for="rating in ratingOptions"
        :key="rating.value"
        class="rating-option"
      >
        <input
          type="radio"
          :value="rating.value"
          v-model="selectedRating"
          class="rating-radio"
        />
        <div class="rating-content">
          <div class="stars">
            <Star
              v-for="star in 5"
              :key="star"
              :class="[
                'star',
                star <= rating.value ? 'star-filled' : 'star-empty',
              ]"
            />
          </div>
          <span class="rating-label">{{ rating.label }}</span>
        </div>
      </label>

      <!-- Clear selection option -->
      <label class="rating-option">
        <input
          type="radio"
          :value="null"
          v-model="selectedRating"
          class="rating-radio"
        />
        <div class="rating-content">
          <span class="rating-label text-gray-500">Any Rating</span>
        </div>
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { Star } from 'lucide-vue-next';

const props = defineProps({
  modelValue: { type: Number, default: null },
});

const emit = defineEmits(['update:modelValue']);

const selectedRating = ref(props.modelValue);

const ratingOptions = [
  { value: 5, label: '5 Stars Only' },
  { value: 4, label: '4 Stars & Up' },
  { value: 3, label: '3 Stars & Up' },
  { value: 2, label: '2 Stars & Up' },
  { value: 1, label: '1 Star & Up' },
];

watch(selectedRating, (newValue) => {
  emit('update:modelValue', newValue);
});

watch(
  () => props.modelValue,
  (newValue) => {
    selectedRating.value = newValue;
  }
);
</script>

<style scoped>
@reference "@/style.css";

.rating-option {
  @apply flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer;
  @apply transition-colors duration-150;
  @apply min-h-[44px]; /* Touch-friendly target */
}

.rating-radio {
  @apply w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600;
  @apply focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400;
}

.rating-content {
  @apply flex items-center space-x-2 flex-1;
}

.stars {
  @apply flex space-x-1;
}

.star {
  @apply w-4 h-4 transition-colors duration-150;
}

.star-filled {
  @apply text-yellow-400 fill-current;
}

.star-empty {
  @apply text-gray-300 dark:text-gray-600;
}

.rating-label {
  @apply text-sm text-gray-700 dark:text-gray-200;
}

.rating-option:hover .rating-label {
  @apply text-gray-900 dark:text-white;
}

/* Highlight selected option */
.rating-option:has(input:checked) {
  @apply bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800;
}

.rating-option:has(input:checked) .rating-label {
  @apply text-blue-700 dark:text-blue-300 font-medium;
}
</style>
