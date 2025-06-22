<template>
  <teleport to="body">
    <transition name="backdrop">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/50 z-40"
        @click="handleBackdropClick"
      ></div>
    </transition>
    <transition name="bottom-sheet" @enter="onEnter" @leave="onLeave">
      <div
        v-if="modelValue"
        ref="sheetRef"
        class="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-white dark:bg-gray-800 rounded-t-2xl shadow-lg"
        :style="sheetStyle"
        v-bind="gestureHandlers"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="descriptionId"
      >
        <slot name="header">
          <BottomSheetHeader
            :title="title"
            :show-handle="showHandle"
            @close="close"
            :title-id="titleId"
          />
        </slot>
        <slot></slot>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import BottomSheetHeader from './BottomSheetHeader.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  height: {
    type: String,
    default: 'auto',
    validator: (value) => ['auto', 'half', 'full'].includes(value),
  },
  snapPoints: {
    type: Array,
    default: () => [30, 60, 85],
  },
  backdrop: {
    type: Boolean,
    default: true,
  },
  persistent: {
    type: Boolean,
    default: false,
  },
  swipeToClose: {
    type: Boolean,
    default: true,
  },
  showHandle: {
    type: Boolean,
    default: true,
  },
  title: {
    type: String,
    default: '',
  },
  closeOnEscape: {
    type: Boolean,
    default: true,
  },
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
const sheetHeight = ref(0);

const titleId = `bottom-sheet-title-${Math.random().toString(36).substr(2, 9)}`;
const descriptionId = `bottom-sheet-description-${Math.random().toString(36).substr(2, 9)}`;

const sheetStyle = computed(() => ({
  maxHeight: '90vh',
  transform: `translateY(${currentY.value}px)`,
  transition: isDragging.value
    ? 'none'
    : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
}));

const handleBackdropClick = () => {
  emit('backdrop-click');
  if (!props.persistent) {
    close();
  }
};

const close = () => {
  emit('update:modelValue', false);
};

// Gesture handlers
const handleTouchStart = (event) => {
  if (!props.swipeToClose) return;
  isDragging.value = true;
  startY.value = event.touches[0].clientY;
  sheetHeight.value = sheetRef.value.clientHeight;
};

const handleTouchMove = (event) => {
  if (!isDragging.value) return;
  const deltaY = event.touches[0].clientY - startY.value;
  if (deltaY > 0) {
    currentY.value = deltaY;
  }
};

const handleTouchEnd = () => {
  if (!isDragging.value) return;
  isDragging.value = false;

  if (currentY.value > sheetHeight.value * 0.3) {
    close();
  } else {
    currentY.value = 0;
  }
};

const gestureHandlers = computed(() => ({
  onTouchStart: handleTouchStart,
  onTouchMove: handleTouchMove,
  onTouchEnd: handleTouchEnd,
}));

// Lifecycle and events
const onEnter = () => {
  emit('open');
};

const onLeave = () => {
  emit('close');
};

const handleEscape = (event) => {
  if (props.closeOnEscape && event.key === 'Escape') {
    close();
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleEscape);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEscape);
});

watch(
  () => props.modelValue,
  (newValue) => {
    if (!newValue) {
      currentY.value = 0;
    }
  }
);
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
