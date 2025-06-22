<template>
  <div class="px-3">
    <Transition name="fade" mode="out-in">
      <div :key="activeView">
        <!-- Loading State -->
        <div v-if="isLoading" class="space-y-3">
          <div v-for="i in 3" :key="i" class="animate-pulse">
            <div class="bg-gray-100 dark:bg-gray-800 h-20 rounded-lg"></div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="items.length === 0" class="text-center py-16">
          <div
            class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Sparkles class="w-8 h-8 text-gray-400" />
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {{ emptyStateTitle }}
          </h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
            {{ emptyStateDescription }}
          </p>
          <button
            @click="$emit('empty-action')"
            class="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            <component :is="emptyActionIcon" class="w-4 h-4 inline mr-1" />
            {{ emptyActionText }}
          </button>
        </div>

        <!-- Custom Content Slot (e.g., Applications View) -->
        <div v-else-if="$slots.custom">
          <slot name="custom" />
        </div>

        <!-- Items List -->
        <div v-else>
          <!-- Grid View (Cards) -->
          <div v-if="viewMode === 'cards'" class="grid grid-cols-2 gap-2">
            <div
              v-for="item in items"
              :key="item.id"
              class="border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <slot name="item" :item="item" :view-mode="viewMode" />
            </div>
          </div>

          <!-- List View -->
          <div v-else class="space-y-3">
            <div
              v-for="item in items"
              :key="item.id"
              class="border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <slot name="item" :item="item" :view-mode="viewMode" />
            </div>
          </div>

          <!-- Load More -->
          <div v-if="hasMoreItems" class="text-center pt-6">
            <button
              @click="$emit('load-more')"
              :disabled="isLoadingMore"
              class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium"
            >
              <div
                v-if="isLoadingMore"
                class="animate-spin w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full inline-block"
              ></div>
              {{ isLoadingMore ? loadingText : loadMoreText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { Sparkles } from 'lucide-vue-next';

defineProps({
  activeView: {
    type: String,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  items: {
    type: Array,
    default: () => [],
  },
  viewMode: {
    type: String,
    required: true,
    validator: (value) => ['cards', 'list'].includes(value),
  },
  emptyStateTitle: {
    type: String,
    required: true,
  },
  emptyStateDescription: {
    type: String,
    required: true,
  },
  emptyActionText: {
    type: String,
    required: true,
  },
  emptyActionIcon: {
    type: [String, Object],
    required: true,
  },
  hasMoreItems: {
    type: Boolean,
    default: false,
  },
  isLoadingMore: {
    type: Boolean,
    default: false,
  },
  loadingText: {
    type: String,
    default: 'Loading...',
  },
  loadMoreText: {
    type: String,
    default: 'Load More',
  },
});

defineEmits(['empty-action', 'load-more']);
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
