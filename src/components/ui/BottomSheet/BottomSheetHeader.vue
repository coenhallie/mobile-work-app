<template>
  <div
    class="relative text-center py-3 border-b border-gray-200 dark:border-gray-700"
  >
    <div
      v-if="showHandle"
      class="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"
    ></div>
    <h2
      :id="titleId"
      class="text-lg font-semibold text-gray-900 dark:text-white"
    >
      {{ title }}
    </h2>
    <button
      @click="$emit('close')"
      class="absolute top-1/2 -translate-y-1/2 right-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      <svg
        class="w-6 h-6 text-gray-500 dark:text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        ></path>
      </svg>
    </button>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '',
  },
  showHandle: {
    type: Boolean,
    default: true,
  },
  titleId: {
    type: String,
    required: true,
  },
});

defineEmits(['close']);
</script>
