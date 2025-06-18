<template>
  <button
    :id="id"
    ref="checkboxRef"
    type="button"
    role="checkbox"
    :aria-checked="isChecked"
    :class="[
      'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      isChecked
        ? 'bg-primary text-primary-foreground'
        : 'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
    ]"
    :disabled="disabled"
    @click="toggle"
    v-bind="$attrs"
  >
    <Check v-if="isChecked" class="h-4 w-4" />
  </button>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Check } from 'lucide-vue-next';

const props = defineProps({
  id: {
    type: String,
    default: undefined,
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const checkboxRef = ref(null);

const isChecked = computed(() => props.modelValue);

const toggle = () => {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue);
  }
};
</script>
