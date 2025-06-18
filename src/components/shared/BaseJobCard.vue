<template>
  <Card
    :class="[
      'base-job-card overflow-hidden bg-card transition-all duration-200',
      clickable ? 'cursor-pointer hover:shadow-lg hover:border-primary/20' : '',
      cardClass,
    ]"
    @click="handleClick"
  >
    <!-- Optional Image/Header Section -->
    <div
      v-if="
        $slots['image-header'] ||
        $slots['status-overlay'] ||
        $slots['quick-actions'] ||
        $slots['title-overlay']
      "
      class="relative"
    >
      <slot name="image-header"></slot>
      <div
        v-if="$slots['status-overlay']"
        class="absolute top-1 right-1 z-10 flex gap-2"
      >
        <slot name="status-overlay"></slot>
      </div>
      <div v-if="$slots['quick-actions']" class="absolute top-2 left-2 z-10">
        <slot name="quick-actions"></slot>
      </div>
      <div
        v-if="$slots['title-overlay']"
        class="absolute bottom-0 left-0 right-0 z-10"
      >
        <slot name="title-overlay"></slot>
      </div>
    </div>

    <!-- Content Section -->
    <div
      class="flex flex-col h-full"
      :class="[$slots['image-header'] ? '' : '', contentClass]"
    >
      <!-- Title (only if title-overlay is not used) -->
      <div v-if="$slots.title && !$slots['title-overlay']" class="mb-0.5">
        <slot name="title"></slot>
      </div>

      <!-- Meta Info (Location, Date, Budget etc.) -->
      <div v-if="$slots['meta-info']" class="mb-1">
        <slot name="meta-info"></slot>
      </div>

      <!-- Description -->
      <div v-if="$slots.description" class="mb-0.5 flex-grow">
        <slot name="description"></slot>
      </div>

      <!-- Extra Content Area -->
      <div v-if="$slots['content-extra']" class="mb-1">
        <slot name="content-extra"></slot>
      </div>

      <!-- Footer/Actions -->
      <div v-if="$slots.actions" class="pt-1 mt-auto">
        <slot name="actions"></slot>
      </div>
    </div>
  </Card>
</template>

<script setup>
import { Card } from '@/components/ui/card';

const props = defineProps({
  job: {
    type: Object,
    required: true,
  },
  clickable: {
    type: Boolean,
    default: true,
  },
  cardClass: {
    type: [String, Array, Object],
    default: 'p-3 border border-border', // Tighter padding for modern app design
  },
  contentClass: {
    type: [String, Array, Object],
    default: '',
  },
});

const emit = defineEmits(['click']);

const handleClick = () => {
  if (props.clickable) {
    emit('click', props.job);
  }
};
</script>

<style scoped>
.base-job-card:hover {
  /* Default hover transform, can be overridden by specific cards */
  /* transform: translateY(-2px); */
}
</style>
