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
import { useI18n } from 'vue-i18n';
import { Clock, CheckCircle, X, AlertCircle, Eye } from 'lucide-vue-next';

const { t } = useI18n();

const props = defineProps({
  status: {
    type: String,
    required: true,
  },
});

const getStatusClasses = (status) => {
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
};

const getStatusIcon = (status) => {
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
};

const getStatusText = (status) => {
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
};
</script>
