<template>
  <div class="inline-flex items-center">
    <span
      :class="[
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
        statusClasses,
      ]"
    >
      <div :class="['w-1.5 h-1.5 rounded-full mr-1.5', dotClasses]"></div>
      {{ statusText }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Props
const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (value) =>
      [
        'unpaid',
        'pending',
        'processing',
        'paid',
        'completed',
        'failed',
        'cancelled',
        'refunded',
      ].includes(value),
  },
  size: {
    type: String,
    default: 'sm',
    validator: (value) => ['xs', 'sm', 'md', 'lg'].includes(value),
  },
  showIcon: {
    type: Boolean,
    default: true,
  },
});

// Computed properties
const statusClasses = computed(() => {
  const baseClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const statusStyles = {
    unpaid: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    pending:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
    processing:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    completed:
      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    refunded:
      'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
  };

  return [baseClasses[props.size], statusStyles[props.status]];
});

const dotClasses = computed(() => {
  const statusDots = {
    unpaid: 'bg-gray-400',
    pending: 'bg-yellow-400 animate-pulse',
    processing: 'bg-blue-400 animate-pulse',
    paid: 'bg-green-400',
    completed: 'bg-green-400',
    failed: 'bg-red-400',
    cancelled: 'bg-gray-400',
    refunded: 'bg-orange-400',
  };

  return statusDots[props.status];
});

const statusText = computed(() => {
  const statusTranslations = {
    unpaid: t('payment.status.unpaid'),
    pending: t('payment.status.pending'),
    processing: t('payment.status.processing'),
    paid: t('payment.status.paid'),
    completed: t('payment.status.completed'),
    failed: t('payment.status.failed'),
    cancelled: t('payment.status.cancelled'),
    refunded: t('payment.status.refunded'),
  };

  return statusTranslations[props.status] || props.status;
});

// Icon component for different statuses
const statusIcon = computed(() => {
  const icons = {
    unpaid:
      'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
    pending: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    processing:
      'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    paid: 'M5 13l4 4L19 7',
    completed: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    failed: 'M6 18L18 6M6 6l12 12',
    cancelled:
      'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    refunded: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6',
  };

  return icons[props.status];
});
</script>

<style scoped>
/* Custom animations for status indicators */
.status-indicator {
  transition: all 0.2s ease-in-out;
}

.status-indicator:hover {
  transform: scale(1.05);
}

/* Pulsing animation for pending/processing states */
@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse-dot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Success state animation */
@keyframes success-bounce {
  0%,
  20%,
  53%,
  80%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  40%,
  43% {
    transform: translate3d(0, -2px, 0);
  }
  70% {
    transform: translate3d(0, -1px, 0);
  }
  90% {
    transform: translate3d(0, -1px, 0);
  }
}

.status-paid .status-dot,
.status-completed .status-dot {
  animation: success-bounce 1s ease-in-out;
}

/* Error state shake */
@keyframes error-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-1px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(1px);
  }
}

.status-failed .status-dot {
  animation: error-shake 0.5s ease-in-out;
}
</style>
