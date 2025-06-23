<template>
  <div
    :class="[
      'base-card',
      'bg-transparent rounded-xl border border-gray-200 dark:border-gray-700',
      'transition-all duration-300 ease-out',
      cardClasses,
      { 'cursor-pointer': clickable },
      {
        'hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600':
          hoverable,
      },
      { 'transform hover:scale-[1.02]': scalable },
    ]"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable ? 0 : undefined"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <!-- Loading Skeleton -->
    <div v-if="loading" class="animate-pulse p-6">
      <slot name="skeleton">
        <div class="flex items-start space-x-4">
          <!-- Avatar skeleton -->
          <div class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <!-- Content skeleton -->
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </slot>
    </div>

    <!-- Card Content -->
    <div v-else :class="contentClasses">
      <!-- Header -->
      <header v-if="$slots.header" :class="headerClasses">
        <slot name="header" />
      </header>

      <!-- Main Content -->
      <main :class="mainClasses">
        <slot />
      </main>

      <!-- Footer -->
      <footer v-if="$slots.footer" :class="footerClasses">
        <slot name="footer" />
      </footer>

      <!-- Actions Overlay -->
      <div v-if="$slots.actions" class="absolute top-4 right-4">
        <slot name="actions" />
      </div>

      <!-- Status Overlay -->
      <div v-if="$slots.status" class="absolute top-4 left-4">
        <slot name="status" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  clickable: {
    type: Boolean,
    default: false,
  },
  hoverable: {
    type: Boolean,
    default: true,
  },
  scalable: {
    type: Boolean,
    default: false,
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) =>
      ['default', 'compact', 'featured', 'minimal'].includes(value),
  },
  padding: {
    type: String,
    default: 'normal',
    validator: (value) => ['none', 'sm', 'normal', 'lg'].includes(value),
  },
});

const emit = defineEmits(['click']);

// Computed classes
const cardClasses = computed(() => {
  const variants = {
    default: 'shadow-sm',
    compact: 'shadow-sm',
    featured: 'shadow-lg border-2',
    minimal: 'shadow-none border-0',
  };
  return variants[props.variant];
});

const contentClasses = computed(() => {
  const paddings = {
    none: '',
    sm: 'p-3',
    normal: 'p-4',
    lg: 'p-6',
  };
  return ['relative', paddings[props.padding]].filter(Boolean).join(' ');
});

const headerClasses = computed(() => {
  return props.variant === 'compact' ? 'mb-2' : 'mb-3';
});

const mainClasses = computed(() => {
  return props.variant === 'compact' ? 'space-y-1' : 'space-y-2';
});

const footerClasses = computed(() => {
  return props.variant === 'compact' ? 'mt-2' : 'mt-3';
});

// Event handlers
const handleClick = () => {
  if (props.clickable && !props.loading) {
    emit('click');
  }
};
</script>

<style scoped>
.base-card {
  position: relative;
  overflow: hidden;
}

/* Ensure smooth transitions */
.base-card:hover {
  transform: translateY(-1px);
}

.base-card.scalable:hover {
  transform: translateY(-1px) scale(1.02);
}

/* Focus styles for accessibility */
.base-card:focus {
  outline: 2px solid rgb(59 130 246);
  outline-offset: 2px;
}
</style>
