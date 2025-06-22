<template>
  <BottomSheet v-model="internalValue" title="Filters">
    <BottomSheetContent>
      <div class="space-y-6">
        <div>
          <h3
            class="text-base font-semibold text-gray-900 dark:text-white mb-3"
          >
            Category
          </h3>
          <div class="flex flex-wrap gap-2">
            <FilterChip
              :active="!localFilters.categoryId"
              @click="localFilters.categoryId = null"
            >
              All
            </FilterChip>
            <FilterChip
              v-for="category in categories"
              :key="category.id"
              :active="localFilters.categoryId === category.id"
              @click="localFilters.categoryId = category.id"
            >
              {{ category.name_es }}
            </FilterChip>
          </div>
        </div>

        <div>
          <h3
            class="text-base font-semibold text-gray-900 dark:text-white mb-3"
          >
            Sort By
          </h3>
          <div class="flex flex-wrap gap-2">
            <FilterChip
              :active="localFilters.sortBy === 'popularity'"
              @click="localFilters.sortBy = 'popularity'"
            >
              Popularity
            </FilterChip>
            <FilterChip
              :active="localFilters.sortBy === 'name'"
              @click="localFilters.sortBy = 'name'"
            >
              Name
            </FilterChip>
            <FilterChip
              :active="localFilters.sortBy === 'newest'"
              @click="localFilters.sortBy = 'newest'"
            >
              Newest
            </FilterChip>
          </div>
        </div>
      </div>
    </BottomSheetContent>
    <BottomSheetActions>
      <div class="flex justify-between items-center">
        <button
          @click="clear"
          class="text-sm font-medium text-gray-700 dark:text-gray-300 hover:underline"
        >
          Clear All
        </button>
        <button
          @click="apply"
          class="px-6 py-2 bg-blue-600 text-white rounded-full font-semibold"
          :disabled="loading"
        >
          <span v-if="loading">Loading...</span>
          <span v-else>Show {{ resultCount }} results</span>
        </button>
      </div>
    </BottomSheetActions>
  </BottomSheet>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import BottomSheet from './BottomSheet/BottomSheet.vue';
import BottomSheetContent from './BottomSheet/BottomSheetContent.vue';
import BottomSheetActions from './BottomSheet/BottomSheetActions.vue';
import FilterChip from './FilterChip.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  filters: {
    type: Object,
    required: true,
  },
  categories: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  resultCount: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(['update:modelValue', 'apply', 'clear']);

const internalValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const localFilters = ref({ ...props.filters });

watch(
  () => props.filters,
  (newFilters) => {
    localFilters.value = { ...newFilters };
  },
  { deep: true }
);

const apply = () => {
  emit('apply', localFilters.value);
};

const clear = () => {
  const clearedFilters = {
    categoryId: null,
    sortBy: 'popularity',
    priceRange: null,
    availability: 'all',
    rating: null,
  };
  localFilters.value = clearedFilters;
  emit('clear');
  emit('apply', clearedFilters);
};
</script>
