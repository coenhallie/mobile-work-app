<script setup>
import { cn } from '@/lib/utils';

const props = defineProps({
  class: { type: null, required: false },
  hover: { type: Boolean, default: false },
  flat: { type: Boolean, default: false },
  gradient: { type: Boolean, default: false },
});
</script>

<template>
  <div
    data-slot="card"
    :class="
      cn(
        'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border',
        {
          'py-6': !props.class?.includes('p-0'),
          'shadow-none': flat,
          'shadow-sm hover:shadow-md transition-all duration-300':
            !flat && !hover,
          'card-hover shadow-sm': hover,
          'bg-gradient-to-br from-primary/5 to-accent/5': gradient,
        },
        props.class
      )
    "
  >
    <slot />
  </div>
</template>

<style scoped>
/* Additional card styles can be added here */
.card-hover {
  transform: translateY(0);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
</style>
