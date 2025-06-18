<template>
  <div class="space-y-2">
    <Label :for="inputId">{{ label }}</Label>
    <div class="relative">
      <Input
        :id="inputId"
        v-model="localValue"
        :placeholder="placeholder"
        :disabled="disabled"
        class="pr-10"
        @input="handleInput"
        @blur="handleBlur"
      />
      <div class="absolute inset-y-0 right-0 flex items-center pr-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </div>
    </div>
    <p v-if="helpText" class="text-xs text-muted-foreground">
      {{ helpText }}
    </p>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { Input } from './input';
import { Label } from './label';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: 'Location',
  },
  placeholder: {
    type: String,
    default: 'Enter location (e.g., Surco, Lima)',
  },
  helpText: {
    type: String,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  id: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue']);

const localValue = ref(props.modelValue);

const inputId = computed(() => props.id || 'location-input');

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    localValue.value = newValue;
  }
);

// Handle input changes
const handleInput = () => {
  emit('update:modelValue', localValue.value);
};

// Handle blur event (optional validation could be added here)
const handleBlur = () => {
  // Trim whitespace on blur
  localValue.value = localValue.value.trim();
  emit('update:modelValue', localValue.value);
};
</script>
