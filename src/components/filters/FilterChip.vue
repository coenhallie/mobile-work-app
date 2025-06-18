<template>
  <div class="filter-chip" :class="chipClasses">
    <span class="chip-label">{{ label }}</span>
    <Button
      variant="ghost"
      size="icon"
      class="chip-remove"
      @click="handleRemove"
      :aria-label="`Remove ${label} filter`"
    >
      <X class="w-3 h-3" />
    </Button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { X } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';

const props = defineProps({
  label: { type: String, required: true },
  type: { type: String, required: true },
  removable: { type: Boolean, default: true },
});

const emit = defineEmits(['remove']);

const chipClasses = computed(() => ({
  'chip-service': props.type === 'service',
  'chip-location': props.type === 'location',
  'chip-rating': props.type === 'rating',
  'chip-experience': props.type === 'experience',
  'chip-price': props.type === 'price',
  'chip-availability': props.type === 'availability',
}));

const handleRemove = () => {
  emit('remove');
};
</script>

<style scoped>
@reference "@/style.css";

.filter-chip {
  @apply inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200;
  @apply bg-blue-600 text-white;
  @apply hover:bg-blue-700;
  @apply opacity-0 transform translate-x-2 animate-pulse;
  animation: slideInScale 0.2s ease-out forwards;
}

.chip-label {
  @apply truncate max-w-32;
}

.chip-remove {
  @apply h-5 w-5 p-0 hover:bg-white/20 rounded-full;
  @apply transition-colors duration-150;
}

/* Type-specific styling */
.chip-service {
  @apply bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200;
}

.chip-service .chip-remove {
  @apply hover:bg-blue-200 dark:hover:bg-blue-800;
}

.chip-location {
  @apply bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200;
}

.chip-location .chip-remove {
  @apply hover:bg-green-200 dark:hover:bg-green-800;
}

.chip-rating {
  @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200;
}

.chip-rating .chip-remove {
  @apply hover:bg-yellow-200 dark:hover:bg-yellow-800;
}

.chip-experience {
  @apply bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200;
}

.chip-experience .chip-remove {
  @apply hover:bg-purple-200 dark:hover:bg-purple-800;
}

.chip-price {
  @apply bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200;
}

/* Keyframe animations */
@keyframes slideInScale {
  from {
    opacity: 0;
    transform: scale(0.95) translateX(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateX(0);
  }
}

@keyframes slideOutScale {
  from {
    opacity: 1;
    transform: scale(1) translateX(0);
  }
  to {
    opacity: 0;
    transform: scale(0.95) translateX(-8px);
  }
}

.chip-price .chip-remove {
  @apply hover:bg-orange-200 dark:hover:bg-orange-800;
}

.chip-availability {
  @apply bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200;
}

.chip-availability .chip-remove {
  @apply hover:bg-pink-200 dark:hover:bg-pink-800;
}

/* Animation for chip removal */
.filter-chip.removing {
  animation: slideOutScale 0.15s ease-in forwards;
}
</style>
