<template>
  <button
    @click="dropdown.toggle"
    :class="[
      'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'hover:bg-accent hover:text-accent-foreground',
      'h-10 px-4 py-2',
    ]"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup>
import { inject } from 'vue';

const dropdown = inject('dropdown');
</script>
