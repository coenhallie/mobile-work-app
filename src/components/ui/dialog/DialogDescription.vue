<script setup lang="ts">
import { cn } from '@/lib/utils';
import type { DialogDescriptionProps } from 'reka-ui';
import { DialogDescription } from 'reka-ui';

const props = defineProps<DialogDescriptionProps>();
</script>

<template>
  <DialogDescription
    data-slot="dialog-description"
    v-bind="props"
    :class="cn('text-muted-foreground text-sm', $attrs.class)"
  >
    <slot />
  </DialogDescription>
</template>
