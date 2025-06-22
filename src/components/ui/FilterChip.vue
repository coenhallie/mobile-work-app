<template>
  <button
    class="px-4 py-2 border rounded-full text-sm font-medium transition-colors"
    :class="{
      'bg-blue-600 text-white border-blue-600': active,
      'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600':
        !active,
      'hover:bg-gray-100 dark:hover:bg-gray-700': !active,
    }"
    @click="$emit('click')"
  >
    <slot></slot>
  </button>
</template>

<script setup>
defineProps({
  active: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['click']);
</script>
