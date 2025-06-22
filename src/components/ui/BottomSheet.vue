<template>
  <teleport to="body">
    <transition name="backdrop" @after-leave="onBackdropLeave">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black bg-opacity-50 z-40"
        @click="handleBackdropClick"
      />
    </transition>
    <transition name="bottom-sheet" @after-leave="onSheetLeave">
      <div
        v-if="modelValue"
        ref="sheetRef"
        class="fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[85vh] bg-white dark:bg-gray-800 rounded-t-lg shadow-lg"
        :style="sheetStyle"
        v-bind="touchHandlers"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="descriptionId"
      >
        <header class="flex-shrink-0">
          <div
            v-if="showHandle"
            class="w-8 h-1 mx-auto my-2 bg-gray-300 dark:bg-gray-600 rounded-full"
            aria-hidden="true"
          />
          <div
            class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700"
          >
            <h2
              :id="titleId"
              class="text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              {{ title }}
            </h2>
            <button
              @click="close"
              aria-label="Close"
              class="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <svg
                class="w-6 h-6"
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
          </div>
        </header>
        <main class="flex-1 overflow-y-auto p-4" role="main">
          <slot />
        </main>
        <footer
          v-if="$slots.footer"
          class="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700"
        >
          <slot name="footer" />
        </footer>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  height: { type: String, default: 'auto' }, // auto, half, full
  snapPoints: { type: Array, default: () => [30, 60, 85] },
  backdrop: { type: Boolean, default: true },
  persistent: { type: Boolean, default: false },
  swipeToClose: { type: Boolean, default: true },
  showHandle: { type: Boolean, default: true },
  title: { type: String, default: 'Bottom Sheet' },
  closeOnEscape: { type: Boolean, default: true },
});

const emit = defineEmits([
  'update:modelValue',
  'open',
  'close',
  'backdrop-click',
]);

const sheetRef = ref(null);
const startY = ref(0);
const currentY = ref(0);
const isDragging = ref(false);
const sheetStyle = ref({});
const titleId = `bottom-sheet-title-${Math.random().toString(36).substr(2, 9)}`;
const descriptionId = `bottom-sheet-description-${Math.random().toString(36).substr(2, 9)}`;

const close = () => {
  emit('update:modelValue', false);
};

const handleBackdropClick = () => {
  emit('backdrop-click');
  if (!props.persistent) {
    close();
  }
};

const onTouchStart = (e) => {
  if (!props.swipeToClose) return;
  startY.value = e.touches[0].clientY;
  currentY.value = startY.value;
  isDragging.value = true;
  sheetRef.value.style.transition = 'none';
};

const onTouchMove = (e) => {
  if (!isDragging.value) return;
  currentY.value = e.touches[0].clientY;
  const deltaY = currentY.value - startY.value;
  if (deltaY > 0) {
    sheetStyle.value = { transform: `translateY(${deltaY}px)` };
  }
};

const onTouchEnd = () => {
  if (!isDragging.value) return;
  isDragging.value = false;
  sheetRef.value.style.transition = '';
  const deltaY = currentY.value - startY.value;

  if (deltaY > 100) {
    // Swipe threshold
    close();
  } else {
    sheetStyle.value = { transform: 'translateY(0)' };
  }
};

const touchHandlers = computed(() => ({
  onTouchstart: onTouchStart,
  onTouchmove: onTouchMove,
  onTouchend: onTouchEnd,
}));

// Focus Management
const previousActiveElement = ref(null);
const trapFocus = (e) => {
  if (e.key !== 'Tab') return;
  const focusableElements = sheetRef.value?.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (!focusableElements) return;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === firstElement) {
      lastElement.focus();
      e.preventDefault();
    }
  } else {
    if (document.activeElement === lastElement) {
      firstElement.focus();
      e.preventDefault();
    }
  }
};

const handleEscape = (e) => {
  if (props.closeOnEscape && e.key === 'Escape') {
    close();
  }
};

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      emit('open');
      previousActiveElement.value = document.activeElement;
      document.addEventListener('keydown', handleEscape);
      nextTick(() => {
        sheetRef.value?.querySelector('button')?.focus();
        document.addEventListener('keydown', trapFocus);
      });
    } else {
      emit('close');
      previousActiveElement.value?.focus();
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', trapFocus);
    }
  }
);

onMounted(() => {
  // Initial setup if needed
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape);
  document.removeEventListener('keydown', trapFocus);
});

const onBackdropLeave = () => {};
const onSheetLeave = () => {};
</script>

<style scoped>
.bottom-sheet-enter-active,
.bottom-sheet-leave-active {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.bottom-sheet-enter-from,
.bottom-sheet-leave-to {
  transform: translateY(100%);
}

.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.25s ease-out;
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}
</style>
