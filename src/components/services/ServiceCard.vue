<template>
  <div
    @click="$emit('select', service)"
    class="service-card group relative overflow-hidden rounded-lg shadow-md cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 flex flex-col"
  >
    <!-- Background Image -->
    <div
      v-if="service.backgroundImageUrl"
      class="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
      :style="{ backgroundImage: `url(${service.backgroundImageUrl})` }"
    ></div>
    <!-- Overlay for readability -->
    <div
      class="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300"
    ></div>

    <!-- Content -->
    <div
      class="relative z-10 p-4 flex flex-col justify-center h-full text-white"
    >
      <!-- Name -->
      <h4
        class="font-normal text-lg mb-0.5 text-shadow leading-tight text-left"
      >
        {{ localizedName }}
      </h4>
    </div>
    <!-- Summary removed -->
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  service: {
    type: Object,
    required: true,
  },
  // You might pass a locale prop if you have a more robust i18n system
  // currentLocale: { type: String, default: 'es' }
});

defineEmits(['select']);

// Basic localization, assuming 'es' for Peru as primary
const localizedName = computed(() => {
  // Prioritize Spanish name if available
  return props.service.name_es || props.service.name_en;
});
</script>

<style scoped>
.service-card {
  min-height: 150px; /* Adjusted height for cards with background images */
  display: flex;
  flex-direction: column;
  justify-content: center; /* Center content vertically */
}
.service-card img {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}
.text-shadow {
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}
.text-shadow-sm {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}
</style>
