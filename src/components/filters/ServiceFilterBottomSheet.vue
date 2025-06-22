<template>
  <BottomSheet
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Filter & Sort"
    height="half"
  >
    <div class="space-y-6">
      <!-- Sort Options -->
      <div>
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          Sort by
        </h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            v-for="option in sortOptions"
            :key="option.value"
            @click="localFilters.sortBy = option.value"
            :class="[
              'px-4 py-2 text-sm rounded-lg transition-colors',
              localFilters.sortBy === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600',
            ]"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <!-- Category Filter -->
      <div>
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          Category
        </h3>
        <div class="max-h-60 overflow-y-auto -mr-4 pr-4 space-y-2">
          <button
            @click="selectCategory(null)"
            :class="[
              'w-full text-left px-4 py-2 text-sm rounded-lg transition-colors',
              !localFilters.categoryId
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700',
            ]"
          >
            All Categories
          </button>
          <button
            v-for="category in categories"
            :key="category.id"
            @click="selectCategory(category.id)"
            :class="[
              'w-full text-left px-4 py-2 text-sm rounded-lg transition-colors',
              localFilters.categoryId === category.id
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700',
            ]"
          >
            {{ category.name_es }}
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between items-center">
        <button
          @click="clearFilters"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          Clear All
        </button>
        <button
          @click="applyFilters"
          class="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
          :disabled="loading"
        >
          {{ loading ? 'Loading...' : `Show ${resultCount} results` }}
        </button>
      </div>
    </template>
  </BottomSheet>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import BottomSheet from '@/components/ui/BottomSheet.vue';

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  filters: { type: Object, required: true },
  categories: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  resultCount: { type: Number, default: 0 },
});

const emit = defineEmits(['update:modelValue', 'apply', 'clear']);

const localFilters = ref({ ...props.filters });

watch(
  () => props.filters,
  (newFilters) => {
    localFilters.value = { ...newFilters };
  },
  { deep: true }
);

const sortOptions = [
  { label: 'Popularity', value: 'popularity' },
  { label: 'Name', value: 'name' },
  { label: 'Newest', value: 'newest' },
];

const applyFilters = () => {
  emit('apply', localFilters.value);
};

const selectCategory = (categoryId) => {
  localFilters.value.categoryId = categoryId;
  // Automatically apply the filter when a category is selected
  emit('apply', localFilters.value);
};

const clearFilters = () => {
  const freshFilters = {
    categoryId: null,
    sortBy: 'popularity',
  };
  localFilters.value = freshFilters;
  emit('clear');
};
</script>
