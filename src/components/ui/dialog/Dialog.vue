<script setup lang="ts">
import type { DialogRootProps, DialogRootEmits } from 'reka-ui';
import { DialogRoot } from 'reka-ui';

const props = defineProps<DialogRootProps>();
const emits = defineEmits<DialogRootEmits>();
</script>

<template>
  <DialogRoot
    v-bind="props"
    @update:open="(newOpenState) => emits('update:open', newOpenState)"
  >
    <slot />
  </DialogRoot>
</template>
