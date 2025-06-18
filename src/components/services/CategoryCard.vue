<template>
  <div
    @click="$emit('select', category)"
    class="category-card relative overflow-hidden rounded-xl shadow-md cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
  >
    <!-- Background Image with lazy loading -->
    <div
      class="absolute inset-0 bg-cover bg-center bg-gray-200"
      :style="{
        backgroundImage: imageLoaded ? `url(${category.imageUrl})` : 'none',
      }"
    ></div>

    <!-- Dark Overlay for better text readability -->
    <div
      class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10"
    ></div>

    <!-- Content -->
    <div
      class="relative z-10 p-5 flex flex-col items-center justify-end h-full text-white"
    >
      <span
        class="px-2 py-1 bg-white/20 rounded-full text-xs mb-2 backdrop-blur-sm"
        >{{ category.badge }}</span
      >
      <h3 class="font-semibold text-lg text-center text-shadow">
        {{ category.name }}
      </h3>
    </div>

    <!-- Hidden image for preloading -->
    <img :src="category.imageUrl" class="hidden" @load="onImageLoaded" alt="" />
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  category: {
    type: Object,
    required: true,
  },
});

defineEmits(['select']);

// Track image loading state
const imageLoaded = ref(false);

// Handle image load event
function onImageLoaded() {
  imageLoaded.value = true;
}
</script>

<style scoped>
.category-card {
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Add text shadow for better readability */
.text-shadow {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

/* Add a subtle zoom effect on hover - optimized for performance */
.category-card:hover .bg-cover {
  transform: scale(1.05);
  transition: transform 0.2s ease;
  will-change: transform;
}

/* Ensure the background image transitions smoothly - with hardware acceleration */
.category-card .bg-cover {
  transition:
    transform 0.2s ease,
    background-image 0.2s ease;
  backface-visibility: hidden;
  transform: translateZ(0);
  will-change: transform;
}
</style>
