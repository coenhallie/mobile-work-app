<template>
  <button
    :class="pillClasses"
    @click="handleClick"
    @keydown="handleKeydown"
    :aria-label="ariaLabel"
    :aria-pressed="isActive"
    type="button"
  >
    <span class="pill-label">{{ label }}</span>
    <button
      v-if="isActive && removable"
      @click.stop="handleRemove"
      class="pill-remove"
      :aria-label="`Remove ${label} filter`"
      type="button"
    >
      <X class="w-3 h-3" />
    </button>
  </button>
</template>

<script setup>
import { computed } from 'vue';
import { X } from 'lucide-vue-next';

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  removable: {
    type: Boolean,
    default: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['sm', 'default', 'lg'].includes(value),
  },
});

const emit = defineEmits(['click', 'remove']);

const pillClasses = computed(() => [
  'filter-pill',
  {
    'filter-pill--active': props.isActive,
    'filter-pill--disabled': props.disabled,
    'filter-pill--sm': props.size === 'sm',
    'filter-pill--lg': props.size === 'lg',
  },
]);

const ariaLabel = computed(() => {
  if (props.isActive) {
    return `${props.label} filter is active. Press to remove.`;
  }
  return `Apply ${props.label} filter`;
});

const handleClick = () => {
  if (!props.disabled) {
    emit('click');
  }
};

const handleRemove = () => {
  if (!props.disabled) {
    emit('remove');
  }
};

const handleKeydown = (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handleClick();
  } else if (event.key === 'Backspace' || event.key === 'Delete') {
    if (props.isActive && props.removable) {
      event.preventDefault();
      handleRemove();
    }
  }
};
</script>

<style scoped>
.filter-pill {
  /* Ultra-minimal monochrome design */
  @apply inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full;
  @apply text-sm font-normal transition-all duration-150 ease-out;
  @apply border border-gray-300 bg-transparent text-gray-600;
  @apply hover:border-gray-400 hover:bg-gray-50;
  @apply focus:outline-none focus:ring-1 focus:ring-gray-400;
  @apply active:scale-98;

  /* Minimum touch target for accessibility */
  min-height: 32px;
  min-width: 40px;

  /* System font stack */
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
    Arial, sans-serif;
}

.filter-pill--active {
  @apply bg-gray-900 text-white border-gray-900;
  @apply hover:bg-gray-800 hover:border-gray-800;
}

.filter-pill--disabled {
  @apply opacity-50 cursor-not-allowed;
  @apply hover:border-gray-200 hover:bg-white;
}

.filter-pill--disabled.filter-pill--active {
  @apply hover:bg-blue-600 hover:border-blue-600;
}

.filter-pill--sm {
  @apply px-3 py-1.5 text-xs;
  min-height: 32px;
}

.filter-pill--lg {
  @apply px-5 py-2.5 text-base;
  min-height: 44px;
}

.pill-label {
  @apply truncate max-w-32;
  line-height: 1.2;
}

.pill-remove {
  @apply flex items-center justify-center w-5 h-5 rounded-full;
  @apply hover:bg-white/20 transition-colors duration-150;
  @apply focus:outline-none focus:ring-1 focus:ring-white/50;
  @apply active:scale-90;
  margin-left: 2px;
  margin-right: -2px;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .filter-pill {
    @apply border-gray-700 bg-gray-800 text-gray-200;
    @apply hover:border-gray-600 hover:bg-gray-700;
  }

  .filter-pill--active {
    @apply bg-blue-600 text-white border-blue-600;
    @apply hover:bg-blue-700 hover:border-blue-700;
  }

  .filter-pill--disabled {
    @apply hover:border-gray-700 hover:bg-gray-800;
  }
}

/* Animation for pill appearance */
@keyframes pillSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateX(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateX(0);
  }
}

.filter-pill {
  animation: pillSlideIn 0.2s ease-out;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .filter-pill {
    @apply border-2;
  }

  .filter-pill--active {
    @apply border-2 border-blue-800;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .filter-pill {
    @apply transition-none;
    animation: none;
  }

  .filter-pill:active {
    transform: none;
  }

  .pill-remove:active {
    transform: none;
  }
}
</style>
