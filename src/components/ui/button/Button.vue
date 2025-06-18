<script setup>
import { cn } from '@/lib/utils';
import { Primitive } from 'reka-ui';
import { buttonVariants } from '.';
import { ref, computed } from 'vue';
import { useHaptics } from '@/composables/useHaptics';

const props = defineProps({
  variant: { type: null, required: false },
  size: { type: null, required: false },
  class: { type: null, required: false },
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false, default: 'button' },
  loading: { type: Boolean, required: false, default: false },
  disabled: { type: Boolean, required: false, default: false },
  hapticFeedback: { type: String, required: false, default: 'medium' }, // light, medium, heavy, selection, success
});

const isDisabled = computed(() => props.disabled || props.loading);

// Initialize haptics
const {
  triggerLight,
  triggerMedium,
  triggerHeavy,
  triggerSelection,
  triggerSuccess,
} = useHaptics();

// Handle button click with haptic feedback
const emit = defineEmits(['click']);

const handleClick = async (event) => {
  if (isDisabled.value) return;

  // Trigger appropriate haptic feedback based on prop
  switch (props.hapticFeedback) {
    case 'light':
      await triggerLight();
      break;
    case 'heavy':
      await triggerHeavy();
      break;
    case 'selection':
      await triggerSelection();
      break;
    case 'success':
      await triggerSuccess();
      break;
    case 'medium':
    default:
      await triggerMedium();
      break;
  }

  // Emit the click event to parent components
  emit('click', event);
};
</script>

<template>
  <Primitive
    data-slot="button"
    :as="as"
    :as-child="asChild"
    :disabled="isDisabled"
    :class="
      cn(buttonVariants({ variant, size }), props.class, {
        'opacity-70 cursor-wait': loading,
      })
    "
    @click="handleClick($event)"
  >
    <!-- Loading spinner -->
    <span v-if="loading" class="mr-2 inline-block animate-spin">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </span>
    <slot />

    <!-- Ripple effect for primary and gradient buttons -->
    <span
      v-if="variant === 'default' || variant === 'gradient'"
      class="ripple-effect"
    ></span>
  </Primitive>
</template>

<style scoped>
.ripple-effect {
  position: absolute;
  border-radius: 50%;
  background-color: var(--primary-foreground);
  opacity: 0.3;
  transform: scale(0);
  animation: ripple 0.6s linear;
  pointer-events: none;
}

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

/* Add ripple effect on click */
button:active .ripple-effect {
  animation: ripple 0.6s linear;
}
</style>
