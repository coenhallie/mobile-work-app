<template>
  <span
    v-if="locationText"
    class="flex items-center gap-1 whitespace-nowrap text-sm text-muted-foreground"
  >
    <MapPin class="w-4 h-4" />
    <span>{{ locationText }}</span>
  </span>
</template>

<script setup>
import { MapPin } from 'lucide-vue-next';

defineProps({
  locationText: {
    type: String,
    default: '',
  },
});
</script>
