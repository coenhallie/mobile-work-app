<template>
  <!--
    JobStatusIndicator Component
    
    This component visually represents a job's status with:
    1. A colored dot indicator
    2. A text label with matching color
    
    Each status has a unique color to make it easily identifiable:
    - OPEN: Blue
    - ASSIGNED: Purple
    - IN_PROGRESS: Amber
    - COMPLETED: Green
    - IN_REVIEW: Teal
    - FINALIZED: Gray
    - CANCELLED: Red
  -->
  <div
    class="inline-flex items-center px-3 py-1.5 rounded-full shadow-lg"
    :class="pillBackgroundColor"
  >
    <span
      class="inline-block w-2 h-2 rounded-full mr-1.5"
      :class="statusColor"
    ></span>
    <span class="text-xs font-semibold" :class="pillTextColor">
      {{ statusLabel }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { JOB_STATUS } from '../../stores/job';

const { t } = useI18n();

const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (value) => {
      // Handle legacy 'pending_assignment' status as 'assigned'
      if (value === 'pending_assignment') {
        console.warn(
          "Legacy status 'pending_assignment' detected. Consider updating to 'assigned'."
        );
        return true;
      }
      return Object.values(JOB_STATUS).includes(value);
    },
  },
});

// Map status codes to human-readable labels
const statusLabel = computed(() => {
  const labels = {
    [JOB_STATUS.OPEN]: t('jobs.status.open'),
    [JOB_STATUS.ASSIGNED]: t('jobs.status.assigned'),
    [JOB_STATUS.IN_PROGRESS]: t('jobs.inProgress'),
    [JOB_STATUS.COMPLETED]: t('jobs.completed'),
    [JOB_STATUS.IN_REVIEW]: t('jobs.status.inReview'),
    [JOB_STATUS.FINALIZED]: t('jobs.status.finalized'),
    [JOB_STATUS.CANCELLED]: t('jobs.cancelled'),
    pending_assignment: t('jobs.status.assigned'), // Handle legacy status
  };
  return labels[props.status] || t('common.unknown');
});

// Map status codes to background colors for the indicator dot
const statusColor = computed(() => {
  const colors = {
    [JOB_STATUS.OPEN]: 'bg-blue-600', // Darker blue for open jobs
    [JOB_STATUS.ASSIGNED]: 'bg-indigo-500', // Indigo for assigned jobs (more distinct from blue)
    [JOB_STATUS.IN_PROGRESS]: 'bg-amber-500', // Amber for in-progress jobs
    [JOB_STATUS.COMPLETED]: 'bg-green-500', // Green for completed jobs
    [JOB_STATUS.IN_REVIEW]: 'bg-teal-500', // Teal for jobs in review
    [JOB_STATUS.FINALIZED]: 'bg-gray-500', // Gray for finalized jobs
    [JOB_STATUS.CANCELLED]: 'bg-red-500', // Red for cancelled jobs
    pending_assignment: 'bg-indigo-500', // Same as ASSIGNED for legacy status
  };
  return colors[props.status] || 'bg-gray-400';
});

// Map status codes to pill background colors for high contrast
const pillBackgroundColor = computed(() => {
  const colors = {
    [JOB_STATUS.OPEN]: 'bg-blue-100 dark:bg-blue-900/80',
    [JOB_STATUS.ASSIGNED]: 'bg-indigo-100 dark:bg-indigo-900/80',
    [JOB_STATUS.IN_PROGRESS]: 'bg-amber-100 dark:bg-amber-900/80',
    [JOB_STATUS.COMPLETED]: 'bg-green-100 dark:bg-green-900/80',
    [JOB_STATUS.IN_REVIEW]: 'bg-teal-100 dark:bg-teal-900/80',
    [JOB_STATUS.FINALIZED]: 'bg-gray-100 dark:bg-gray-900/80',
    [JOB_STATUS.CANCELLED]: 'bg-red-100 dark:bg-red-900/80',
    pending_assignment: 'bg-indigo-100 dark:bg-indigo-900/80',
  };
  return colors[props.status] || 'bg-gray-100 dark:bg-gray-900/80';
});

// Map status codes to pill text colors for high contrast
const pillTextColor = computed(() => {
  const colors = {
    [JOB_STATUS.OPEN]: 'text-blue-900 dark:text-blue-100',
    [JOB_STATUS.ASSIGNED]: 'text-indigo-900 dark:text-indigo-100',
    [JOB_STATUS.IN_PROGRESS]: 'text-amber-900 dark:text-amber-100',
    [JOB_STATUS.COMPLETED]: 'text-green-900 dark:text-green-100',
    [JOB_STATUS.IN_REVIEW]: 'text-teal-900 dark:text-teal-100',
    [JOB_STATUS.FINALIZED]: 'text-gray-900 dark:text-gray-100',
    [JOB_STATUS.CANCELLED]: 'text-red-900 dark:text-red-100',
    pending_assignment: 'text-indigo-900 dark:text-indigo-100',
  };
  return colors[props.status] || 'text-gray-900 dark:text-gray-100';
});

// Map status codes to text colors that match the indicator colors (kept for backward compatibility)
const textColor = computed(() => {
  const colors = {
    [JOB_STATUS.OPEN]: 'text-blue-800',
    [JOB_STATUS.ASSIGNED]: 'text-indigo-700',
    [JOB_STATUS.IN_PROGRESS]: 'text-amber-700',
    [JOB_STATUS.COMPLETED]: 'text-green-700',
    [JOB_STATUS.IN_REVIEW]: 'text-teal-700',
    [JOB_STATUS.FINALIZED]: 'text-gray-700',
    [JOB_STATUS.CANCELLED]: 'text-red-700',
    pending_assignment: 'text-indigo-700', // Same as ASSIGNED for legacy status
  };
  return colors[props.status] || 'text-gray-600';
});
</script>
