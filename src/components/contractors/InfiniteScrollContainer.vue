<template>
  <div class="infinite-scroll-container">
    <!-- Content Slot -->
    <slot></slot>

    <!-- Loading Indicator -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div class="flex items-center space-x-3">
        <div
          class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"
        ></div>
        <span class="text-gray-600 dark:text-gray-400"
          >Loading more contractors...</span
        >
      </div>
    </div>

    <!-- Load More Trigger -->
    <div
      ref="loadMoreTrigger"
      class="h-4 w-full"
      v-show="hasMore && !loading"
    ></div>

    <!-- End Message -->
    <div
      v-if="!hasMore && !loading"
      class="text-center py-8 text-gray-500 dark:text-gray-400"
    >
      You've reached the end of the list
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  hasMore: {
    type: Boolean,
    default: true,
  },
  threshold: {
    type: Number,
    default: 0.1,
  },
});

const emit = defineEmits(['load-more']);

// Refs
const loadMoreTrigger = ref(null);
const observer = ref(null);

// Methods
const setupIntersectionObserver = () => {
  if (!loadMoreTrigger.value) return;

  observer.value = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && props.hasMore && !props.loading) {
        emit('load-more');
      }
    },
    {
      threshold: props.threshold,
      rootMargin: '100px',
    }
  );

  observer.value.observe(loadMoreTrigger.value);
};

const cleanup = () => {
  if (observer.value) {
    observer.value.disconnect();
  }
};

// Lifecycle
onMounted(() => {
  setupIntersectionObserver();
});

onUnmounted(() => {
  cleanup();
});
</script>
