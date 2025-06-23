<template>
  <div class="virtual-contractor-list" ref="containerRef">
    <!-- Virtual Scrolling Container -->
    <div
      class="virtual-scroll-container"
      :style="{ height: `${containerHeight}px` }"
      @scroll="handleScroll"
      ref="scrollContainer"
    >
      <!-- Spacer for items before visible range -->
      <div :style="{ height: `${offsetY}px` }"></div>

      <!-- Visible Items -->
      <div
        v-for="(contractor, index) in visibleItems"
        :key="contractor.id || `skeleton-${index}`"
        class="contractor-item"
        :style="{ height: `${itemHeight}px` }"
        @click="contractor.id ? $emit('contractor-selected', contractor) : null"
      >
        <ContractorCard
          v-if="contractor.id && !contractor.loading"
          :contractor="contractor"
          @click="$emit('contractor-selected', contractor)"
        />
        <BaseSkeleton v-else layout="card" />
      </div>

      <!-- Spacer for items after visible range -->
      <div :style="{ height: `${endSpacerHeight}px` }"></div>

      <!-- Loading indicator for additional items -->
      <div v-if="isLoading && items.length > 0" class="loading-indicator">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <span>Loading more contractors...</span>
        </div>
      </div>

      <!-- Skeleton items for initial loading -->
      <div v-if="isLoading && items.length === 0" class="skeleton-container">
        <div
          v-for="n in 6"
          :key="`initial-skeleton-${n}`"
          class="contractor-item"
          :style="{ height: `${itemHeight}px` }"
        >
          <BaseSkeleton layout="card" />
        </div>
      </div>

      <!-- Load more trigger -->
      <div
        v-if="hasMore && !isLoading"
        ref="loadMoreTrigger"
        class="load-more-trigger"
      >
        <!-- Intersection observer target -->
      </div>
    </div>

    <!-- Performance metrics (dev mode) -->
    <div v-if="showMetrics && isDev" class="performance-metrics">
      <div class="metrics-grid">
        <div class="metric">
          <span class="metric-label">{{ $t('filters.totalItemsLabel') }}</span>
          <span class="metric-value">{{ totalItems }}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Visible:</span>
          <span class="metric-value">{{ visibleItems.length }}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Scroll:</span>
          <span class="metric-value">{{ Math.round(scrollTop) }}px</span>
        </div>
        <div class="metric">
          <span class="metric-label">FPS:</span>
          <span class="metric-value">{{ currentFPS }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import ContractorCard from '@/components/shared/ContractorCard.vue';
import BaseSkeleton from '@/components/shared/BaseSkeleton.vue';

const props = defineProps({
  items: { type: Array, default: () => [] },
  itemHeight: { type: Number, default: 280 },
  containerHeight: { type: Number, default: 600 },
  overscan: { type: Number, default: 5 },
  isLoading: { type: Boolean, default: false },
  hasMore: { type: Boolean, default: true },
  showMetrics: { type: Boolean, default: false },
});

const emit = defineEmits(['load-more', 'contractor-selected']);

// Refs
const containerRef = ref(null);
const scrollContainer = ref(null);
const loadMoreTrigger = ref(null);

// State
const scrollTop = ref(0);
const observer = ref(null);
const isDev = import.meta.env.DEV;

// Performance tracking
const frameCount = ref(0);
const lastTime = ref(performance.now());
const currentFPS = ref(60);

// Throttling and debouncing
let scrollThrottleTimer = null;
let loadMoreDebounceTimer = null;
const scrollThrottleDelay = 16; // ~60fps
const loadMoreDebounceDelay = 100;
let isLoadMoreTriggered = ref(false);

// Computed properties
const totalItems = computed(() => props.items.length);

const visibleRange = computed(() => {
  const containerHeight = props.containerHeight;
  const itemHeight = props.itemHeight;
  const overscan = props.overscan;

  const startIndex = Math.max(
    0,
    Math.floor(scrollTop.value / itemHeight) - overscan
  );
  const endIndex = Math.min(
    totalItems.value - 1,
    Math.ceil((scrollTop.value + containerHeight) / itemHeight) + overscan
  );

  return { startIndex, endIndex };
});

const visibleItems = computed(() => {
  const { startIndex, endIndex } = visibleRange.value;
  return props.items.slice(startIndex, endIndex + 1).map((item, index) => ({
    ...item,
    virtualIndex: startIndex + index,
  }));
});

const offsetY = computed(() => {
  return visibleRange.value.startIndex * props.itemHeight;
});

const endSpacerHeight = computed(() => {
  const { endIndex } = visibleRange.value;
  const remainingItems = totalItems.value - endIndex - 1;
  return Math.max(0, remainingItems * props.itemHeight);
});

// Throttled scroll handler
const handleScroll = (event) => {
  if (scrollThrottleTimer) return;

  scrollThrottleTimer = setTimeout(() => {
    const target = event.target;
    scrollTop.value = target.scrollTop;

    // Performance tracking
    trackFPS();

    // Throttled load more check
    checkLoadMore(target);

    scrollThrottleTimer = null;
  }, scrollThrottleDelay);
};

// Debounced load more check to prevent double triggers
const checkLoadMore = (target) => {
  if (isLoadMoreTriggered.value) return;

  const scrollHeight = target.scrollHeight;
  const clientHeight = target.clientHeight;
  const scrollPosition = target.scrollTop;

  // Load more when 85% scrolled (slightly higher threshold)
  if (scrollPosition + clientHeight >= scrollHeight * 0.85) {
    if (props.hasMore && !props.isLoading) {
      isLoadMoreTriggered.value = true;

      clearTimeout(loadMoreDebounceTimer);
      loadMoreDebounceTimer = setTimeout(() => {
        emit('load-more');
        // Reset flag after a delay to allow for new content
        setTimeout(() => {
          isLoadMoreTriggered.value = false;
        }, 1000);
      }, loadMoreDebounceDelay);
    }
  }
};

const trackFPS = () => {
  frameCount.value++;
  const now = performance.now();

  if (now - lastTime.value >= 1000) {
    currentFPS.value = Math.round(
      (frameCount.value * 1000) / (now - lastTime.value)
    );
    frameCount.value = 0;
    lastTime.value = now;
  }
};

const scrollToTop = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const scrollToItem = (index) => {
  if (scrollContainer.value) {
    const targetScrollTop = index * props.itemHeight;
    scrollContainer.value.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth',
    });
  }
};

// Optimized Intersection Observer for load more
const setupIntersectionObserver = () => {
  if (observer.value) {
    observer.value.disconnect();
  }

  observer.value = new IntersectionObserver(
    (entries) => {
      if (
        entries[0].isIntersecting &&
        props.hasMore &&
        !props.isLoading &&
        !isLoadMoreTriggered.value
      ) {
        isLoadMoreTriggered.value = true;
        emit('load-more');
        // Reset flag after delay
        setTimeout(() => {
          isLoadMoreTriggered.value = false;
        }, 1000);
      }
    },
    {
      threshold: 0.1,
      rootMargin: '50px', // Reduced margin for better control
    }
  );

  if (loadMoreTrigger.value) {
    observer.value.observe(loadMoreTrigger.value);
  }
};

// Lifecycle
onMounted(() => {
  nextTick(() => {
    setupIntersectionObserver();
  });
});

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect();
  }
  if (scrollThrottleTimer) {
    clearTimeout(scrollThrottleTimer);
  }
  if (loadMoreDebounceTimer) {
    clearTimeout(loadMoreDebounceTimer);
  }
});

// Optimized watch for items changes
watch(
  () => props.items.length,
  (newLength, oldLength) => {
    // Reset load more trigger when items change significantly
    isLoadMoreTriggered.value = false;

    // If items were reset (new search/filter), scroll to top
    if (newLength < oldLength || (newLength > 0 && oldLength === 0)) {
      nextTick(() => {
        scrollToTop();
        setupIntersectionObserver();
      });
    }
  }
);

// Expose methods
defineExpose({
  scrollToTop,
  scrollToItem,
});
</script>

<style scoped>
@reference "@/style.css";

.virtual-contractor-list {
  @apply relative w-full;
}

.virtual-scroll-container {
  @apply overflow-auto;
  scroll-behavior: smooth;
}

.contractor-item {
  @apply w-full;
}

.loading-indicator {
  @apply flex justify-center items-center py-8;
}

.loading-spinner {
  @apply flex items-center gap-3;
}

.spinner {
  @apply w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin;
}

.load-more-trigger {
  @apply h-4 w-full;
}

.performance-metrics {
  @apply fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs;
  @apply backdrop-blur-sm z-50;
}

.metrics-grid {
  @apply grid grid-cols-2 gap-2;
}

.metric {
  @apply flex justify-between gap-2;
}

.metric-label {
  @apply text-gray-300;
}

.metric-value {
  @apply font-mono font-bold;
}

/* Custom scrollbar */
.virtual-scroll-container::-webkit-scrollbar {
  @apply w-2;
}

.virtual-scroll-container::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-800;
}

.virtual-scroll-container::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-600 rounded-full;
}

.virtual-scroll-container::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-500;
}

/* Smooth scrolling performance */
.virtual-scroll-container {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

/* Optimize rendering */
.contractor-item {
  contain: layout style paint;
  will-change: transform;
}
</style>
