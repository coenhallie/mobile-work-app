<template>
  <span
    :class="[
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      statusClasses[status] || statusClasses.default,
    ]"
  >
    <component v-if="iconComponent" :is="iconComponent" class="w-3 h-3 mr-1" />
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup>
import { computed } from 'vue';
import { Clock, Play, CheckCircle, XCircle, UserCheck } from 'lucide-vue-next';

const props = defineProps({
  status: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    default: '',
  },
  icon: {
    type: [Object, String],
    default: null,
  },
});

// Status color mappings based on contractor JobCard.vue styling pattern
// All colors follow the same pattern: bg-{color}-100 text-{color}-800
const statusClasses = {
  urgent: 'bg-red-100 text-red-800',
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  assigned: 'bg-blue-100 text-blue-800', // Changed from sky to blue to match contractor pattern
  pending: 'bg-yellow-100 text-yellow-800',
  selected: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  default: 'bg-gray-100 text-gray-800',
};

// Default icons for common statuses
const defaultIcons = {
  urgent: Clock,
  open: Clock,
  in_progress: Play,
  completed: CheckCircle,
  cancelled: XCircle,
  assigned: UserCheck,
  pending: Clock,
  selected: CheckCircle,
  rejected: XCircle,
};

// Use provided icon or default icon for the status
const iconComponent = computed(() => {
  return props.icon || defaultIcons[props.status] || null;
});
</script>
