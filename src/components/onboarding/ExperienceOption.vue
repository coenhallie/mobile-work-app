<template>
  <div
    class="relative bg-white rounded-lg p-3 border-2 transition-all duration-200 cursor-pointer group"
    :class="[
      selected
        ? 'border-blue-500 bg-blue-50 shadow-md'
        : 'border-gray-200 hover:border-blue-300 hover:shadow-sm',
    ]"
    @click="$emit('click')"
  >
    <!-- Selection Indicator -->
    <div
      v-if="selected"
      class="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"
    >
      <svg
        class="w-3 h-3 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 13l4 4L19 7"
        />
      </svg>
    </div>

    <!-- Content -->
    <div class="text-center space-y-1">
      <!-- Years -->
      <div
        class="font-semibold transition-colors"
        :class="[
          selected
            ? 'text-blue-700'
            : 'text-gray-900 group-hover:text-blue-700',
        ]"
      >
        {{ option.label }}
      </div>

      <!-- Description -->
      <div
        class="text-xs transition-colors"
        :class="[
          selected
            ? 'text-blue-600'
            : 'text-gray-500 group-hover:text-blue-600',
        ]"
      >
        {{ option.description }}
      </div>
    </div>

    <!-- Hover Effect Overlay -->
    <div
      class="absolute inset-0 rounded-lg bg-blue-500 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none"
    ></div>
  </div>
</template>

<script setup>
// Props
const props = defineProps({
  option: {
    type: Object,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
});

// Emits
defineEmits(['click']);
</script>

<style scoped>
/* Smooth transitions for all interactive elements */
* {
  transition-property:
    color, background-color, border-color, transform, box-shadow;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

/* Ensure proper positioning for selection indicator */
.relative {
  position: relative;
}
</style>
