<template>
  <div class="job-image-carousel">
    <!-- No images case -->
    <div
      v-if="!images || images.length === 0"
      class="w-full bg-muted rounded-lg flex items-center justify-center"
      :class="heightClass"
    >
      <div class="text-center text-muted-foreground">
        <svg
          class="mx-auto h-12 w-12 mb-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z"
          />
        </svg>
        <p class="text-sm">No images available</p>
      </div>
    </div>

    <!-- Single image case -->
    <div
      v-else-if="images.length === 1"
      class="relative overflow-hidden rounded-lg"
      :class="heightClass"
    >
      <img
        :src="images[0]"
        :alt="altText || 'Job image'"
        class="w-full h-full object-cover"
        @error="handleImageError"
      />
    </div>

    <!-- Multiple images carousel -->
    <div v-else class="relative">
      <Carousel
        class="w-full"
        :opts="{
          align: 'start',
          loop: true,
          dragFree: false,
        }"
        @init-api="setApi"
      >
        <CarouselContent class="ml-0">
          <CarouselItem
            v-for="(image, index) in images"
            :key="index"
            class="pl-0"
          >
            <div
              class="relative overflow-hidden rounded-lg"
              :class="heightClass"
            >
              <img
                :src="image"
                :alt="`${altText || 'Job image'} ${index + 1}`"
                class="w-full h-full object-cover"
                @error="handleImageError"
              />
            </div>
          </CarouselItem>
        </CarouselContent>

        <!-- Navigation Buttons (only show if more than 1 image) -->
        <CarouselPrevious
          v-if="showNavigation && images.length > 1"
          class="left-2 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background"
        />
        <CarouselNext
          v-if="showNavigation && images.length > 1"
          class="right-2 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background"
        />
      </Carousel>

      <!-- Dots Indicator -->
      <div
        v-if="showIndicators && images.length > 1"
        class="absolute bottom-2 left-0 right-0 flex justify-center space-x-1"
      >
        <button
          v-for="(_, index) in images"
          :key="index"
          class="w-1.5 h-1.5 rounded-full transition-colors duration-200"
          :class="
            currentSlide === index
              ? 'bg-white shadow-sm'
              : 'bg-white/50 hover:bg-white/70'
          "
          @click="goToSlide(index)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

const props = defineProps({
  images: {
    type: Array,
    default: () => [],
  },
  altText: {
    type: String,
    default: 'Job image',
  },
  height: {
    type: String,
    default: 'h-48', // Default height class
  },
  showNavigation: {
    type: Boolean,
    default: true,
  },
  showIndicators: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['imageError', 'slideChange']);

const currentSlide = ref(0);
const carouselApi = ref(null);

// Computed height class
const heightClass = computed(() => props.height);

// Set carousel API and track slide changes
const setApi = (api) => {
  carouselApi.value = api;
  if (api) {
    api.on('select', () => {
      currentSlide.value = api.selectedScrollSnap();
      emit('slideChange', currentSlide.value);
    });
  }
};

// Navigate to specific slide
const goToSlide = (index) => {
  if (carouselApi.value) {
    carouselApi.value.scrollTo(index);
  }
};

// Handle image loading errors
const handleImageError = (event) => {
  console.warn('Failed to load image:', event.target.src);
  emit('imageError', event.target.src);

  // Replace with placeholder
  event.target.style.display = 'none';
  const placeholder =
    event.target.parentElement.querySelector('.image-placeholder');
  if (!placeholder) {
    const placeholderDiv = document.createElement('div');
    placeholderDiv.className =
      'image-placeholder w-full h-full bg-muted flex items-center justify-center';
    placeholderDiv.innerHTML = `
      <div class="text-center text-muted-foreground">
        <svg class="mx-auto h-8 w-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p class="text-xs">Image unavailable</p>
      </div>
    `;
    event.target.parentElement.appendChild(placeholderDiv);
  }
};

// Expose methods for parent components
defineExpose({
  goToSlide,
  currentSlide: () => currentSlide.value,
  totalSlides: () => props.images.length,
});
</script>

<style scoped>
.job-image-carousel {
  contain: content;
}

/* Ensure smooth transitions */
.job-image-carousel img {
  transition: transform 0.3s ease-out;
}

/* Hover effect for navigation buttons */
.job-image-carousel :deep(.carousel-button) {
  transition: all 0.2s ease-in-out;
}

.job-image-carousel :deep(.carousel-button:hover) {
  transform: scale(1.05);
}
</style>
