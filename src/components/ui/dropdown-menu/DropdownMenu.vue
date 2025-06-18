<template>
  <div class="relative inline-block text-left" ref="dropdownRef">
    <slot />
  </div>
</template>

<script setup>
import { ref, provide } from 'vue';

const dropdownRef = ref(null);
const isOpen = ref(false);

const toggle = () => {
  isOpen.value = !isOpen.value;
};

const close = () => {
  isOpen.value = false;
};

provide('dropdown', {
  isOpen,
  toggle,
  close,
});
</script>
