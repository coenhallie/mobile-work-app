<template>
  <div class="job-image-gallery">
    <!-- No images case -->
    <div
      v-if="!hasImages"
      class="p-4 border border-dashed border-gray-300 rounded text-center text-gray-500"
    >
      <p>No images available</p>
    </div>

    <!-- Image gallery with navigation -->
    <div v-else>
      <!-- Primary image display -->
      <div class="relative">
        <img
          v-if="isLoading"
          src="/images/placeholder-image.png"
          alt="Loading..."
          class="max-w-full h-auto rounded shadow object-cover aspect-video bg-gray-100"
        />
        <img
          v-else
          :src="currentPhoto"
          alt="Job Image"
          class="max-w-full h-auto rounded shadow object-cover aspect-video"
          @error="handleImageError"
          @load="handleImageLoad"
        />

        <!-- Loading overlay -->
        <div
          v-if="isLoading"
          class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20"
        >
          <div
            class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"
          ></div>
        </div>

        <!-- Navigation arrows if multiple photos -->
        <div
          v-if="photos.length > 1"
          class="absolute inset-0 flex justify-between items-center"
        >
          <button
            @click="prevPhoto"
            class="bg-black bg-opacity-30 hover:bg-opacity-50 text-white p-2 rounded-full ml-2 focus:outline-none"
            aria-label="Previous photo"
          >
            ←
          </button>
          <button
            @click="nextPhoto"
            class="bg-black bg-opacity-30 hover:bg-opacity-50 text-white p-2 rounded-full mr-2 focus:outline-none"
            aria-label="Next photo"
          >
            →
          </button>
        </div>

        <!-- Photo counter if multiple photos -->
        <div
          v-if="photos.length > 1"
          class="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs"
        >
          {{ currentPhotoIndex + 1 }} / {{ photos.length }}
        </div>
      </div>

      <!-- Thumbnail strip for multiple photos -->
      <div v-if="photos.length > 1" class="flex mt-2 space-x-2 overflow-x-auto">
        <div
          v-for="(photo, index) in photos"
          :key="index"
          @click="currentPhotoIndex = index"
          class="w-16 h-16 flex-shrink-0 cursor-pointer rounded overflow-hidden"
          :class="{
            'border-2 border-blue-500': currentPhotoIndex === index,
            'opacity-50': thumbnailLoading[index],
          }"
        >
          <img
            :src="photo"
            alt="Thumbnail"
            class="w-full h-full object-cover"
            @error="(e) => handleThumbnailError(e, index)"
            @load="(e) => handleThumbnailLoad(e, index)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

const props = defineProps({
  photos: {
    type: Array,
    default: () => [],
  },
  jobId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['remove-photo']);

// State
const currentPhotoIndex = ref(0);
const isLoading = ref(true);
const thumbnailLoading = ref({});

// Computed properties
const hasImages = computed(() => {
  return props.photos && Array.isArray(props.photos) && props.photos.length > 0;
});

const currentPhoto = computed(() => {
  if (!hasImages.value) return null;
  return props.photos[currentPhotoIndex.value];
});

// Reset current photo index when photos change
watch(
  () => props.photos,
  () => {
    currentPhotoIndex.value = 0;
    isLoading.value = true;

    // Initialize thumbnail loading state
    if (hasImages.value) {
      props.photos.forEach((_, index) => {
        thumbnailLoading.value[index] = true;
      });
    }
  },
  { immediate: true }
);

// Navigation methods
const nextPhoto = () => {
  if (!hasImages.value) return;
  isLoading.value = true;
  currentPhotoIndex.value = (currentPhotoIndex.value + 1) % props.photos.length;
};

const prevPhoto = () => {
  if (!hasImages.value) return;
  isLoading.value = true;
  currentPhotoIndex.value =
    (currentPhotoIndex.value - 1 + props.photos.length) % props.photos.length;
};

// Image handling methods
const handleImageError = (event) => {
  isLoading.value = false;
  const originalSrc =
    event.target.getAttribute('data-original-src') || event.target.src;

  // Store the original URL before replacing with placeholder
  event.target.setAttribute('data-original-src', originalSrc);
  event.target.src = '/images/placeholder-image.png';

  // Emit event to parent to handle database update
  if (isDevelopment) {
    console.log('Image failed to load:', originalSrc);
  }

  emit('remove-photo', originalSrc);
};

const handleImageLoad = () => {
  isLoading.value = false;
};

const handleThumbnailError = (event, index) => {
  thumbnailLoading.value[index] = false;
  const originalSrc =
    event.target.getAttribute('data-original-src') || event.target.src;

  // Store the original URL before replacing with placeholder
  event.target.setAttribute('data-original-src', originalSrc);
  event.target.src = '/images/placeholder-image.png';

  // Emit event to parent to handle database update
  emit('remove-photo', originalSrc);
};

const handleThumbnailLoad = (_, index) => {
  thumbnailLoading.value[index] = false;
};

// Environment check
const isDevelopment = import.meta.env.DEV;

// Preload images for smoother navigation
onMounted(() => {
  if (hasImages.value) {
    props.photos.forEach((photo, index) => {
      const img = new Image();
      img.src = photo;
      img.onload = () => {
        thumbnailLoading.value[index] = false;
        if (index === currentPhotoIndex.value) {
          isLoading.value = false;
        }
      };
      img.onerror = () => {
        thumbnailLoading.value[index] = false;
        if (isDevelopment) {
          console.log('Failed to preload image:', photo);
        }
      };
    });
  }
});
</script>

<style scoped>
.job-image-gallery {
  contain: content;
  will-change: transform;
}

/* Smooth transitions for images */
img {
  transition: opacity 0.2s ease;
}

/* Thumbnail scrollbar styling */
.overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}
</style>
