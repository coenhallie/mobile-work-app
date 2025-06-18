<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      getStatusClasses(status),
    ]"
  >
    <component :is="getStatusIcon(status)" class="w-3 h-3 mr-1" />
    {{ getStatusText(status) }}
  </span>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Clock,
  Play,
  CheckCircle,
  XCircle,
  Pause,
  AlertCircle,
  UserCheck, // Added for 'assigned' status
} from 'lucide-vue-next';

const { t } = useI18n();

const props = defineProps({
  status: {
    type: String,
    required: true,
  },
});

const getStatusClasses = (status) => {
  switch (status) {
    case 'open':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100';
    case 'assigned': // Added assigned status
      return 'bg-sky-100 text-sky-800 dark:bg-sky-700 dark:text-sky-100'; // Using sky color for assigned
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100';
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100';
    case 'paused':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    case 'pending_review':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-100';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'open':
      return Clock;
    case 'assigned': // Added assigned status
      return UserCheck;
    case 'in_progress':
      return Play;
    case 'completed':
      return CheckCircle;
    case 'cancelled':
      return XCircle;
    case 'paused':
      return Pause;
    case 'pending_review':
      return AlertCircle;
    default:
      return Clock;
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'open':
      return t('jobStatus.open');
    case 'assigned': // Added assigned status
      return t('jobStatus.assigned');
    case 'in_progress':
      return t('jobStatus.inProgress');
    case 'completed':
      return t('jobStatus.completed');
    case 'cancelled':
      return t('jobStatus.cancelled');
    case 'paused':
      return t('jobStatus.paused');
    case 'pending_review':
      return t('jobStatus.pendingReview');
    default:
      return status || t('jobStatus.unknown');
  }
};
</script>
