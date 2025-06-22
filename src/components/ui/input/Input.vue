<script setup>
import { cn } from '@/lib/utils';
import { useVModel } from '@vueuse/core';
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
  defaultValue: { type: [String, Number], required: false },
  modelValue: { type: [String, Number], required: false },
  class: { type: null, required: false },
  label: { type: String, required: false },
  placeholder: { type: String, required: false },
  type: { type: String, default: 'text' },
  error: { type: String, required: false },
  id: { type: String, required: false },
});

const emits = defineEmits(['update:modelValue', 'focus', 'blur']);

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
});

const inputId = computed(
  () => props.id || `input-${Math.random().toString(36).substring(2, 9)}`
);
const isFocused = ref(false);
const hasValue = computed(() => !!modelValue.value);

const handleFocus = (e) => {
  isFocused.value = true;
  emits('focus', e);
};

const handleBlur = (e) => {
  isFocused.value = false;
  emits('blur', e);
};
</script>

<template>
  <div class="relative w-full">
    <!-- Floating label -->
    <label
      v-if="label"
      :for="inputId"
      :class="[
        'absolute left-3 transition-all duration-200 pointer-events-none',
        isFocused || hasValue
          ? 'text-xs -top-2 text-primary'
          : 'text-muted-foreground top-2',
      ]"
    >
      {{ label }}
    </label>

    <input
      :id="inputId"
      v-model="modelValue"
      :type="type"
      :placeholder="isFocused || !label ? placeholder : ''"
      @focus="handleFocus"
      @blur="handleBlur"
      data-slot="input"
      :class="
        cn(
          'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input flex h-10 w-full min-w-0 rounded-md border bg-background px-3 py-2 text-base shadow-sm transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-foreground',
          'focus:border-primary focus:ring-2 focus:ring-primary/20',
          'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
          { 'pt-4': label },
          props.class
        )
      "
    />

    <!-- Error message -->
    <p v-if="error" class="mt-1 text-sm text-destructive animate-fade-in">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
/* Additional input styles can be added here */
</style>
