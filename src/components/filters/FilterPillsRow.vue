<template>
  <div class="filter-pills-row" :class="containerClasses">
    <div
      ref="scrollContainer"
      class="pills-scroll-container"
      @scroll="handleScroll"
    >
      <div class="pills-content">
        <slot />

        <!-- More filters pill for progressive disclosure -->
        <FilterPill
          v-if="showMorePill"
          :label="morePillLabel"
          :is-active="isMoreActive"
          @click="handleMoreClick"
          class="more-pill"
        />
      </div>
    </div>

    <!-- Scroll indicators -->
    <div
      v-if="showScrollIndicators && canScrollLeft"
      class="scroll-indicator scroll-indicator--left"
      @click="scrollLeft"
    >
      <ChevronLeft class="w-4 h-4" />
    </div>

    <div
      v-if="showScrollIndicators && canScrollRight"
      class="scroll-indicator scroll-indicator--right"
      @click="scrollRight"
    >
      <ChevronRight class="w-4 h-4" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import FilterPill from './FilterPill.vue';

const props = defineProps({
  showMorePill: {
    type: Boolean,
    default: false,
  },
  morePillLabel: {
    type: String,
    default: 'More',
  },
  isMoreActive: {
    type: Boolean,
    default: false,
  },
  showScrollIndicators: {
    type: Boolean,
    default: true,
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'compact', 'spacious'].includes(value),
  },
  scrollBehavior: {
    type: String,
    default: 'smooth',
    validator: (value) => ['smooth', 'auto'].includes(value),
  },
});

const emit = defineEmits(['more-click', 'scroll']);

// Refs
const scrollContainer = ref(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

// Computed
const containerClasses = computed(() => [
  'filter-pills-row',
  {
    'filter-pills-row--compact': props.variant === 'compact',
    'filter-pills-row--spacious': props.variant === 'spacious',
  },
]);

// Methods
const updateScrollIndicators = () => {
  if (!scrollContainer.value) return;

  const { scrollLeft, scrollWidth, clientWidth } = scrollContainer.value;

  canScrollLeft.value = scrollLeft > 0;
  canScrollRight.value = scrollLeft < scrollWidth - clientWidth - 1;
};

const handleScroll = () => {
  updateScrollIndicators();
  emit('scroll', {
    scrollLeft: scrollContainer.value?.scrollLeft || 0,
    scrollWidth: scrollContainer.value?.scrollWidth || 0,
    clientWidth: scrollContainer.value?.clientWidth || 0,
  });
};

const scrollLeft = () => {
  if (!scrollContainer.value) return;

  const scrollAmount = scrollContainer.value.clientWidth * 0.8;
  scrollContainer.value.scrollBy({
    left: -scrollAmount,
    behavior: props.scrollBehavior,
  });
};

const scrollRight = () => {
  if (!scrollContainer.value) return;

  const scrollAmount = scrollContainer.value.clientWidth * 0.8;
  scrollContainer.value.scrollBy({
    left: scrollAmount,
    behavior: props.scrollBehavior,
  });
};

const scrollToStart = () => {
  if (!scrollContainer.value) return;

  scrollContainer.value.scrollTo({
    left: 0,
    behavior: props.scrollBehavior,
  });
};

const scrollToEnd = () => {
  if (!scrollContainer.value) return;

  scrollContainer.value.scrollTo({
    left: scrollContainer.value.scrollWidth,
    behavior: props.scrollBehavior,
  });
};

const handleMoreClick = () => {
  emit('more-click');
};

// Keyboard navigation
const handleKeydown = (event) => {
  if (!scrollContainer.value) return;

  switch (event.key) {
    case 'ArrowLeft':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        scrollLeft();
      }
      break;
    case 'ArrowRight':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        scrollRight();
      }
      break;
    case 'Home':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        scrollToStart();
      }
      break;
    case 'End':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        scrollToEnd();
      }
      break;
  }
};

// Resize observer for responsive updates
let resizeObserver = null;

const setupResizeObserver = () => {
  if (typeof ResizeObserver !== 'undefined' && scrollContainer.value) {
    resizeObserver = new ResizeObserver(() => {
      nextTick(() => {
        updateScrollIndicators();
      });
    });

    resizeObserver.observe(scrollContainer.value);
  }
};

const cleanupResizeObserver = () => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
};

// Lifecycle
onMounted(() => {
  nextTick(() => {
    updateScrollIndicators();
    setupResizeObserver();

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeydown);
  });
});

onUnmounted(() => {
  cleanupResizeObserver();
  document.removeEventListener('keydown', handleKeydown);
});

// Expose methods for parent components
defineExpose({
  scrollLeft,
  scrollRight,
  scrollToStart,
  scrollToEnd,
  updateScrollIndicators,
});
</script>

<style scoped>
.filter-pills-row {
  @apply relative;
}

.pills-scroll-container {
  @apply overflow-x-auto;
  @apply px-4 py-2;

  /* Hide scrollbar but keep functionality */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.pills-scroll-container::-webkit-scrollbar {
  display: none;
}

.pills-content {
  @apply flex items-center gap-2 min-w-max;
}

/* Variant styles */
.filter-pills-row--compact .pills-scroll-container {
  @apply px-3 py-1.5;
}

.filter-pills-row--compact .pills-content {
  @apply gap-1.5;
}

.filter-pills-row--spacious .pills-scroll-container {
  @apply px-6 py-3;
}

.filter-pills-row--spacious .pills-content {
  @apply gap-3;
}

/* Scroll indicators */
.scroll-indicator {
  @apply absolute top-1/2 transform -translate-y-1/2;
  @apply w-8 h-8 rounded-full bg-white shadow-md border border-gray-200;
  @apply flex items-center justify-center cursor-pointer;
  @apply hover:bg-gray-50 hover:shadow-lg transition-all duration-150;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1;
  @apply z-10;
}

.scroll-indicator--left {
  @apply left-2;
}

.scroll-indicator--right {
  @apply right-2;
}

/* More pill styling */
.more-pill {
  @apply ml-2 border-dashed;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .scroll-indicator {
    @apply bg-gray-800 border-gray-700 text-gray-200;
    @apply hover:bg-gray-700;
  }
}

/* Fade edges for visual scroll indication */
.filter-pills-row::before,
.filter-pills-row::after {
  content: '';
  @apply absolute top-0 bottom-0 w-4 pointer-events-none z-10;
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 1),
    rgba(255, 255, 255, 0)
  );
}

.filter-pills-row::before {
  @apply left-0;
}

.filter-pills-row::after {
  @apply right-0;
  background: linear-gradient(
    to left,
    rgba(255, 255, 255, 1),
    rgba(255, 255, 255, 0)
  );
}

/* Dark mode fade edges */
@media (prefers-color-scheme: dark) {
  .filter-pills-row::before {
    background: linear-gradient(
      to right,
      rgba(17, 24, 39, 1),
      rgba(17, 24, 39, 0)
    );
  }

  .filter-pills-row::after {
    background: linear-gradient(
      to left,
      rgba(17, 24, 39, 1),
      rgba(17, 24, 39, 0)
    );
  }
}

/* Hide fade edges when not needed */
.filter-pills-row:not(.can-scroll)::before,
.filter-pills-row:not(.can-scroll)::after {
  display: none;
}

/* Smooth scrolling for supported browsers */
.pills-scroll-container {
  scroll-behavior: smooth;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .pills-scroll-container {
    scroll-behavior: auto;
  }

  .scroll-indicator {
    @apply transition-none;
  }
}

/* Touch scrolling improvements for mobile */
.pills-scroll-container {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
}

/* Focus management for accessibility */
.pills-scroll-container:focus-within {
  @apply outline-none;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .scroll-indicator {
    @apply border-2 border-gray-900;
  }
}
</style>
