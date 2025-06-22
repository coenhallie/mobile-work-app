<template>
  <button
    @click="$emit('click')"
    class="text-center p-3 rounded-lg bg-stone-100 dark:bg-gray-800 hover:bg-stone-200 dark:hover:bg-gray-750 transition-colors relative"
    :class="[
      isActive
        ? `bg-stone-200 dark:bg-gray-700 ring-2 ring-${ringColor}-500`
        : '',
    ]"
  >
    <div class="text-2xl font-bold" :class="valueColor">
      {{ value }}
    </div>
    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
      {{ label }}
    </div>
  </button>
</template>

<script setup>
defineProps({
  value: {
    type: [String, Number],
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  ringColor: {
    type: String,
    default: 'blue',
  },
  valueColor: {
    type: String,
    default: 'text-gray-900 dark:text-white',
  },
});

defineEmits(['click']);
</script>
