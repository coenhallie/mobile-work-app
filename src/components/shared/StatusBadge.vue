<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      getStatusClasses(status, type),
    ]"
  >
    <component :is="getStatusIcon(status, type)" class="w-3 h-3 mr-1" />
    {{ getStatusText(status, type) }}
  </span>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import {
  Clock,
  Play,
  CheckCircle,
  XCircle,
  Pause,
  AlertCircle,
  UserCheck,
  Eye,
  X,
} from 'lucide-vue-next';

const { t } = useI18n();

const props = defineProps({
  status: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: 'generic',
    validator: (value) => ['application', 'job', 'generic'].includes(value),
  },
  customLabel: {
    type: String,
    default: null,
  },
});

const getStatusClasses = (status, type) => {
  // Application-specific status styles (with borders)
  if (type === 'application') {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
      case 'selected':
        return 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
      case 'rejected':
        return 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
      case 'reviewed':
        return 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      case 'shortlisted':
        return 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800';
    }
  }

  // Job-specific status styles (no borders)
  if (type === 'job') {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100';
      case 'assigned':
        return 'bg-sky-100 text-sky-800 dark:bg-sky-700 dark:text-sky-100';
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
  }

  // Generic status styles (from StatusPill - no borders)
  const genericStyles = {
    urgent: 'bg-red-100 text-red-800',
    open: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    assigned: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    selected: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    default: 'bg-gray-100 text-gray-800',
  };

  return genericStyles[status] || genericStyles.default;
};

const getStatusIcon = (status, type) => {
  // Application-specific icons
  if (type === 'application') {
    switch (status) {
      case 'pending':
        return Clock;
      case 'selected':
        return CheckCircle;
      case 'rejected':
        return X;
      case 'reviewed':
        return Eye;
      case 'shortlisted':
        return AlertCircle;
      default:
        return Clock;
    }
  }

  // Job-specific icons
  if (type === 'job') {
    switch (status) {
      case 'open':
        return Clock;
      case 'assigned':
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
  }

  // Generic icons (from StatusPill)
  const genericIcons = {
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

  return genericIcons[status] || Clock;
};

const getStatusText = (status, type) => {
  // Use custom label if provided
  if (props.customLabel) {
    return props.customLabel;
  }

  // Application-specific text
  if (type === 'application') {
    switch (status) {
      case 'pending':
        return t('applicationStatus.pending');
      case 'selected':
        return t('applicationStatus.selected');
      case 'rejected':
        return t('applicationStatus.rejected');
      case 'reviewed':
        return t('applicationStatus.reviewed');
      case 'shortlisted':
        return t('applicationStatus.shortlisted');
      default:
        return status || t('applicationStatus.unknown');
    }
  }

  // Job-specific text
  if (type === 'job') {
    switch (status) {
      case 'open':
        return t('jobStatus.open');
      case 'assigned':
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
  }

  // Generic text - capitalize and replace underscores
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};
</script>
