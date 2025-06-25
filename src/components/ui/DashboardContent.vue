<template>
  <div class="px-3">
    <Transition name="fade" mode="out-in">
      <div :key="activeView">
        <!-- Loading State -->
        <div v-if="isLoading">
          <!-- Grid View Skeleton (Cards) -->
          <div v-if="viewMode === 'cards'" class="grid grid-cols-2 gap-3">
            <div v-for="i in 4" :key="i" class="animate-pulse">
              <!-- Job Card Skeleton -->
              <div
                class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <!-- Image Header Skeleton -->
                <div class="relative">
                  <div class="bg-gray-200 dark:bg-gray-700 h-40 w-full"></div>
                  <!-- Status Badge Skeleton -->
                  <div class="absolute top-2 right-2">
                    <div
                      class="bg-gray-300 dark:bg-gray-600 h-6 w-16 rounded-full"
                    ></div>
                  </div>
                  <!-- Quick Actions Skeleton -->
                  <div class="absolute top-2 left-2">
                    <div
                      class="bg-gray-300 dark:bg-gray-600 h-8 w-8 rounded-full"
                    ></div>
                  </div>
                  <!-- Title Overlay Skeleton -->
                  <div
                    class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3"
                  >
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <div class="bg-gray-300 h-4 w-3/4 rounded mb-1"></div>
                        <div class="bg-gray-400 h-3 w-1/2 rounded"></div>
                      </div>
                      <div class="ml-2">
                        <div class="bg-gray-300 h-3 w-12 rounded mb-1"></div>
                        <div class="bg-gray-400 h-2 w-8 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Content Section Skeleton -->
                <div class="px-4 pb-4 pt-2">
                  <!-- Description Skeleton -->
                  <div class="mt-3 space-y-1">
                    <div
                      class="bg-gray-200 dark:bg-gray-700 h-3 w-full rounded"
                    ></div>
                    <div
                      class="bg-gray-200 dark:bg-gray-700 h-3 w-4/5 rounded"
                    ></div>
                  </div>
                  <!-- Meta Info Skeleton -->
                  <div class="mt-3 flex items-center gap-3">
                    <div
                      class="bg-gray-200 dark:bg-gray-700 h-3 w-16 rounded"
                    ></div>
                    <div
                      class="bg-gray-200 dark:bg-gray-700 h-3 w-12 rounded"
                    ></div>
                    <div
                      class="bg-gray-200 dark:bg-gray-700 h-3 w-14 rounded"
                    ></div>
                  </div>
                  <!-- Actions Skeleton -->
                  <div class="mt-3 flex justify-end">
                    <div
                      class="bg-gray-200 dark:bg-gray-700 h-8 w-20 rounded"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- List View Skeleton -->
          <div v-else class="space-y-3">
            <div v-for="i in 3" :key="i" class="animate-pulse">
              <!-- Job Card Skeleton -->
              <div
                class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <!-- Image Header Skeleton -->
                <div class="relative">
                  <div class="bg-gray-200 dark:bg-gray-700 h-32 w-full"></div>
                  <!-- Status Badge Skeleton -->
                  <div class="absolute top-2 right-2">
                    <div
                      class="bg-gray-300 dark:bg-gray-600 h-6 w-16 rounded-full"
                    ></div>
                  </div>
                  <!-- Quick Actions Skeleton -->
                  <div class="absolute top-2 left-2">
                    <div
                      class="bg-gray-300 dark:bg-gray-600 h-8 w-8 rounded-full"
                    ></div>
                  </div>
                  <!-- Title Overlay Skeleton -->
                  <div
                    class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3"
                  >
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <div class="bg-gray-300 h-5 w-3/4 rounded mb-1"></div>
                        <div class="bg-gray-400 h-3 w-1/2 rounded"></div>
                      </div>
                      <div class="ml-2">
                        <div class="bg-gray-300 h-4 w-16 rounded mb-1"></div>
                        <div class="bg-gray-400 h-3 w-10 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Content Section Skeleton -->
                <div class="px-4 pb-4 pt-2">
                  <!-- Description Skeleton -->
                  <div class="mt-3 space-y-2">
                    <div
                      class="bg-gray-200 dark:bg-gray-700 h-3 w-full rounded"
                    ></div>
                    <div
                      class="bg-gray-200 dark:bg-gray-700 h-3 w-5/6 rounded"
                    ></div>
                  </div>
                  <!-- Meta Info Skeleton -->
                  <div class="mt-3 flex items-center gap-4">
                    <div
                      class="bg-gray-200 dark:bg-gray-700 h-4 w-20 rounded"
                    ></div>
                    <div
                      class="bg-gray-200 dark:bg-gray-700 h-4 w-16 rounded"
                    ></div>
                    <div
                      class="bg-gray-200 dark:bg-gray-700 h-4 w-18 rounded"
                    ></div>
                    <div
                      class="bg-gray-200 dark:bg-gray-700 h-4 w-16 rounded"
                    ></div>
                  </div>
                  <!-- Actions Skeleton -->
                  <div class="mt-3 flex justify-end">
                    <div
                      class="bg-gray-200 dark:bg-gray-700 h-8 w-24 rounded"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
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

        <!-- Items List -->
        <div v-else>
          <!-- Grid View (Cards) -->
          <div v-if="viewMode === 'cards'" class="grid grid-cols-2 gap-3">
            <slot
              name="item"
              v-for="item in items"
              :key="item.id"
              :item="item"
              :view-mode="viewMode"
            />
          </div>

          <!-- List View -->
          <div v-else class="space-y-3">
            <slot
              name="item"
              v-for="item in items"
              :key="item.id"
              :item="item"
              :view-mode="viewMode"
            />
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

const props = defineProps({
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
    type: [String, Object, Function],
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
