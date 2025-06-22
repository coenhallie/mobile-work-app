<template>
  <div class="px-3 pb-3">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-normal text-gray-900 dark:text-white">
        {{ title }}
      </h2>
      <div class="flex items-center gap-2">
        <!-- View Toggle -->
        <div class="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            @click="$emit('view-mode-change', 'cards')"
            :class="[
              'px-3 py-1 rounded text-sm transition-colors',
              viewMode === 'cards'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400',
            ]"
          >
            <Grid3X3 class="w-4 h-4" />
          </button>
          <button
            @click="$emit('view-mode-change', 'list')"
            :class="[
              'px-3 py-1 rounded text-sm transition-colors',
              viewMode === 'list'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400',
            ]"
          >
            <List class="w-4 h-4" />
          </button>
        </div>

        <!-- Filter Button -->
        <button
          @click="$emit('filter-click')"
          class="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <Filter class="w-4 h-4" />
          <div
            v-if="hasActiveFilters"
            class="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center"
          >
            <span class="text-xs text-white font-bold">{{
              activeFiltersCount
            }}</span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Grid3X3, List, Filter } from 'lucide-vue-next';

defineProps({
  title: {
    type: String,
    required: true,
  },
  viewMode: {
    type: String,
    required: true,
    validator: (value) => ['cards', 'list'].includes(value),
  },
  hasActiveFilters: {
    type: Boolean,
    default: false,
  },
  activeFiltersCount: {
    type: Number,
    default: 0,
  },
});

defineEmits(['view-mode-change', 'filter-click']);
</script>
