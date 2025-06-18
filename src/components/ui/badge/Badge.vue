<template>
  <div :class="badgeClasses">
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (value) =>
      ['default', 'secondary', 'destructive', 'outline'].includes(value),
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'sm', 'lg'].includes(value),
  },
});

const badgeClasses = computed(() => {
  const baseClasses =
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

  const variantClasses = {
    default:
      'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
    secondary:
      'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive:
      'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground',
  };

  const sizeClasses = {
    default: 'px-2.5 py-0.5 text-xs',
    sm: 'px-2 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  return [
    baseClasses,
    variantClasses[props.variant] || variantClasses.default,
    sizeClasses[props.size] || sizeClasses.default,
  ].join(' ');
});
</script>

<style scoped>
@reference "@/style.css";

/* Use Tailwind classes for consistent styling */
.bg-primary {
  @apply bg-blue-600 dark:bg-blue-500;
}

.text-primary-foreground {
  @apply text-white;
}

.hover\:bg-primary\/80:hover {
  @apply bg-blue-500 dark:bg-blue-400;
}

.bg-secondary {
  @apply bg-gray-100 dark:bg-gray-800;
}

.text-secondary-foreground {
  @apply text-gray-900 dark:text-gray-100;
}

.hover\:bg-secondary\/80:hover {
  @apply bg-gray-200 dark:bg-gray-700;
}

.bg-destructive {
  @apply bg-red-600 dark:bg-red-500;
}

.text-destructive-foreground {
  @apply text-white;
}

.hover\:bg-destructive\/80:hover {
  @apply bg-red-500 dark:bg-red-400;
}

.text-foreground {
  @apply text-gray-900 dark:text-gray-100;
}
</style>
