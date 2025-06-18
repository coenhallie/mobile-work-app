<template>
  <div
    :class="[
      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
      'transition-colors focus:bg-accent focus:text-accent-foreground',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      'hover:bg-accent hover:text-accent-foreground cursor-pointer',
    ]"
    @click="handleClick"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>

<script setup>
import { inject } from 'vue';

const dropdown = inject('dropdown');

const handleClick = (event) => {
  dropdown.close();
  // Allow the click event to propagate to parent handlers
};
</script>
