<script setup lang="ts">
import { cn } from '@/lib/utils';

// No props needed, class will be inherited via $attrs
</script>

<template>
  <div
    data-slot="dialog-header"
    :class="cn('flex flex-col gap-2 text-center sm:text-left', $attrs.class)"
  >
    <slot />
  </div>
</template>
