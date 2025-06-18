<template>
  <div
    :class="[
      'shrink-0 bg-border',
      orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
    ]"
    :role="decorative ? undefined : 'separator'"
    :aria-orientation="decorative ? undefined : orientation"
    v-bind="$attrs"
  >
    <span v-if="label" class="px-2 text-xs text-muted-foreground">{{
      label
    }}</span>
  </div>
</template>

<script setup>
const props = defineProps({
  orientation: {
    type: String,
    default: 'horizontal',
    validator: (value) => ['horizontal', 'vertical'].includes(value),
  },
  decorative: {
    type: Boolean,
    default: true,
  },
  label: {
    type: String,
    default: undefined,
  },
});
</script>
