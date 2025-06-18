<template>
  <Transition
    enter-active-class="transition ease-out duration-100"
    enter-from-class="transform opacity-0 scale-95"
    enter-to-class="transform opacity-100 scale-100"
    leave-active-class="transition ease-in duration-75"
    leave-from-class="transform opacity-100 scale-100"
    leave-to-class="transform opacity-0 scale-95"
  >
    <div
      v-if="dropdown.isOpen.value"
      :class="[
        'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
        'data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        alignmentClasses,
      ]"
      @click.stop
    >
      <slot />
    </div>
  </Transition>
</template>

<script setup>
import { inject, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  align: {
    type: String,
    default: 'center',
    validator: (value) => ['start', 'center', 'end'].includes(value),
  },
});

const dropdown = inject('dropdown');

const alignmentClasses = computed(() => {
  switch (props.align) {
    case 'start':
      return 'left-0';
    case 'end':
      return 'right-0';
    default:
      return 'left-1/2 transform -translate-x-1/2';
  }
});

const handleClickOutside = (event) => {
  if (!event.target.closest('.relative')) {
    dropdown.close();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
