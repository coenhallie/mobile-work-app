<script setup lang="ts">
import { cn } from '@/lib/utils';

// No props needed, class will be inherited via $attrs
</script>

<template>
  <div
    data-slot="dialog-footer"
    :class="
      cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', $attrs.class)
    "
  >
    <slot />
  </div>
</template>
