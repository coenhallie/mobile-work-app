<template>
  <teleport to="body">
    <!-- Backdrop -->
    <transition name="backdrop" @after-leave="onBackdropLeave">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        @click="handleBackdropClick"
      />
    </transition>

    <!-- Modal -->
    <transition name="modal" @after-leave="onModalLeave">
      <div
        v-if="isOpen"
        :class="[
          'fixed z-50 bg-white dark:bg-gray-900 rounded-xl shadow-xl',
          'transform transition-all duration-300 ease-out',
          modalSizeClasses,
          modalPositionClasses,
        ]"
        role="dialog"
        :aria-labelledby="title ? 'modal-title' : undefined"
        aria-modal="true"
        @click.stop
      >
        <!-- Header -->
        <header
          v-if="$slots.header || title"
          class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700"
        >
          <slot name="header">
            <h2
              id="modal-title"
              class="text-xl font-semibold text-gray-900 dark:text-white"
            >
              {{ title }}
            </h2>
          </slot>
          <button
            v-if="showCloseButton"
            @click="handleClose"
            class="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            :aria-label="$t('common.close')"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </header>

        <!-- Content -->
        <main :class="contentClasses">
          <slot name="content">
            <slot />
          </slot>
        </main>

        <!-- Actions/Footer -->
        <footer
          v-if="$slots.actions"
          class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
        >
          <slot name="actions" />
        </footer>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { computed, watch, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) =>
      ['xs', 'sm', 'md', 'lg', 'xl', 'full'].includes(value),
  },
  position: {
    type: String,
    default: 'center',
    validator: (value) => ['center', 'top', 'bottom'].includes(value),
  },
  showCloseButton: {
    type: Boolean,
    default: true,
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true,
  },
  closeOnEscape: {
    type: Boolean,
    default: true,
  },
  scrollable: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'backdrop-click', 'escape']);

// Computed classes
const modalSizeClasses = computed(() => {
  const sizes = {
    xs: 'max-w-xs w-full',
    sm: 'max-w-sm w-full',
    md: 'max-w-md w-full',
    lg: 'max-w-lg w-full',
    xl: 'max-w-xl w-full',
    full: 'max-w-4xl w-full mx-4',
  };
  return sizes[props.size];
});

const modalPositionClasses = computed(() => {
  const positions = {
    center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    top: 'top-20 left-1/2 -translate-x-1/2',
    bottom: 'bottom-20 left-1/2 -translate-x-1/2',
  };
  return positions[props.position];
});

const contentClasses = computed(() => {
  return ['p-6', props.scrollable ? 'overflow-y-auto max-h-[60vh]' : '']
    .filter(Boolean)
    .join(' ');
});

// Event handlers
const handleClose = () => {
  emit('close');
};

const handleBackdropClick = () => {
  emit('backdrop-click');
  if (props.closeOnBackdrop) {
    handleClose();
  }
};

const handleEscape = (event) => {
  if (event.key === 'Escape' && props.isOpen) {
    emit('escape');
    if (props.closeOnEscape) {
      handleClose();
    }
  }
};

const onBackdropLeave = () => {
  // Cleanup after backdrop animation
};

const onModalLeave = () => {
  // Cleanup after modal animation
};

// Body scroll management
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
);

// Keyboard event listeners
onMounted(() => {
  document.addEventListener('keydown', handleEscape);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape);
  document.body.style.overflow = '';
});
</script>

<style scoped>
/* Backdrop transitions */
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.3s ease;
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.95);
}

/* Focus management */
.modal-focus-trap {
  outline: none;
}
</style>
