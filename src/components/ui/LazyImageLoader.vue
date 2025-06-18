<template>
  <div
    class="lazy-image-container"
    :class="[
      containerClass,
      { 'lazy-image-loading': isLoading, 'lazy-image-error': hasError },
    ]"
    :style="containerStyle"
  >
    <!-- Loading skeleton -->
    <div
      v-if="isLoading && !hasError"
      class="lazy-image-skeleton"
      :style="{ aspectRatio }"
    >
      <slot name="loading">
        <div class="lazy-image-skeleton-animation"></div>
      </slot>
    </div>

    <!-- Error state -->
    <div
      v-if="hasError"
      class="lazy-image-error-container"
      :style="{ aspectRatio }"
    >
      <slot name="error">
        <div class="lazy-image-error-icon">!</div>
        <div class="lazy-image-error-text">Failed to load image</div>
      </slot>
    </div>

    <!-- Actual image (hidden until loaded) -->
    <img
      v-show="!isLoading && !hasError"
      :src="currentSrc"
      :alt="alt"
      :style="imageStyle"
      class="lazy-image"
      :class="imageClass"
      @load="handleImageLoaded"
      @error="handleImageError"
      ref="imageRef"
      loading="lazy"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { createLogger } from '@/lib/loggerService';

const logger = createLogger('LazyImageLoader');

const props = defineProps({
  // Image source URL
  src: {
    type: String,
    required: true,
  },
  // Fallback image to use if the main image fails to load
  fallbackSrc: {
    type: String,
    default: '',
  },
  // Alt text for accessibility
  alt: {
    type: String,
    default: '',
  },
  // Width of the container (CSS value)
  width: {
    type: String,
    default: '100%',
  },
  // Height of the container (CSS value)
  height: {
    type: String,
    default: 'auto',
  },
  // Aspect ratio for the container (width/height)
  aspectRatio: {
    type: String,
    default: '1/1',
  },
  // Object fit property for the image
  objectFit: {
    type: String,
    default: 'cover',
  },
  // Object position property for the image
  objectPosition: {
    type: String,
    default: 'center',
  },
  // Additional classes for the container
  containerClass: {
    type: String,
    default: '',
  },
  // Additional classes for the image
  imageClass: {
    type: String,
    default: '',
  },
  // Whether to retry loading the image on error
  retryOnError: {
    type: Boolean,
    default: true,
  },
  // Maximum number of retries
  maxRetries: {
    type: Number,
    default: 2,
  },
  // Delay between retries (in ms)
  retryDelay: {
    type: Number,
    default: 1000,
  },
});

const emit = defineEmits(['load', 'error']);

// State
const isLoading = ref(true);
const hasError = ref(false);
const retryCount = ref(0);
const currentSrc = ref(props.src);
const imageRef = ref(null);
const isMounted = ref(false);

// Timer reference for cleanup
let retryTimer = null;

// Computed styles
const containerStyle = computed(() => ({
  width: props.width,
  height: props.height,
}));

const imageStyle = computed(() => ({
  objectFit: props.objectFit,
  objectPosition: props.objectPosition,
}));

// Watch for src changes
watch(
  () => props.src,
  (newSrc) => {
    if (newSrc !== currentSrc.value) {
      currentSrc.value = newSrc;
      isLoading.value = true;
      hasError.value = false;
      retryCount.value = 0;
    }
  }
);

// Handle image loaded event
function handleImageLoaded() {
  isLoading.value = false;
  hasError.value = false;
  emit('load', { src: currentSrc.value });
}

// Handle image error event
function handleImageError() {
  // If we have a fallback and haven't tried it yet
  if (props.fallbackSrc && currentSrc.value !== props.fallbackSrc) {
    logger.warn(`Image failed to load: ${currentSrc.value}, trying fallback`);
    currentSrc.value = props.fallbackSrc;
    return;
  }

  // If we should retry and haven't exceeded max retries
  if (props.retryOnError && retryCount.value < props.maxRetries) {
    retryCount.value++;
    logger.warn(
      `Image failed to load: ${currentSrc.value}, retrying (${retryCount.value}/${props.maxRetries})`
    );

    // Add a cache buster to the URL
    const url = new URL(currentSrc.value, window.location.href);
    url.searchParams.set('_retry', retryCount.value);

    // Clear any existing retry timer
    if (retryTimer) {
      clearTimeout(retryTimer);
    }

    // Retry after delay
    retryTimer = setTimeout(() => {
      if (isMounted.value) {
        currentSrc.value = url.toString();
      }
      retryTimer = null;
    }, props.retryDelay);

    return;
  }

  // If we've exhausted all options, show error state
  isLoading.value = false;
  hasError.value = true;
  emit('error', { src: currentSrc.value });
}

// Check if the image is already cached
onMounted(() => {
  isMounted.value = true;

  // If the image is already in the browser cache, it might load immediately
  // In that case, the load event might fire before we attach the listener
  if (imageRef.value && imageRef.value.complete) {
    // If the image has a natural size, it's loaded successfully
    if (imageRef.value.naturalWidth > 0) {
      handleImageLoaded();
    } else {
      // If the image has no natural size, it failed to load
      handleImageError();
    }
  }
});

// Clean up timer when component unmounts
onUnmounted(() => {
  isMounted.value = false;

  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
});
</script>

<style scoped>
.lazy-image-container {
  position: relative;
  overflow: hidden;
  background-color: #f3f4f6; /* Light gray background */
}

.lazy-image {
  width: 100%;
  height: 100%;
  transition: opacity 0.3s ease;
}

.lazy-image-skeleton {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
}

.lazy-image-skeleton-animation {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--muted) 0%,
    var(--border) 50%,
    var(--muted) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.lazy-image-error-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
  color: #6b7280;
}

.lazy-image-error-icon {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lazy-image-error-text {
  font-size: 12px;
  text-align: center;
  max-width: 80%;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>
