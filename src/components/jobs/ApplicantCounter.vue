<template>
  <button
    class="applicant-counter"
    :class="{ 'has-unread': hasUnread, clickable: clickable }"
    @click="handleClick"
    :disabled="!clickable || count === 0"
  >
    <span class="counter-text"
      >{{ count }}
      {{ count === 1 ? t('jobs.applicant') : t('jobs.applicants') }}</span
    >
    <span class="counter-icon">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="w-3 h-3"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    </span>
    <span v-if="clickable && count > 0" class="click-indicator">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="w-3 h-3"
      >
        <path d="M9 18l6-6-6-6"></path>
      </svg>
    </span>
  </button>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  count: {
    type: Number,
    default: 0,
  },
  hasUnread: {
    type: Boolean,
    default: false,
  },
  clickable: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['click']);

function handleClick() {
  if (props.clickable && props.count > 0) {
    emit('click');
  }
}
</script>

<style scoped>
.applicant-counter {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem; /* Equivalent to gap-1.5 */
  padding: 0.375rem 0.75rem; /* Equivalent to px-3 py-1.5 - matching status pill */
  background-color: var(
    --muted
  ); /* Using theme variable instead of bg-gray-100 */
  color: var(--foreground); /* Using theme variable instead of text-gray-800 */
  border-radius: 9999px; /* Equivalent to rounded-full */
  font-size: 0.75rem; /* Equivalent to text-xs */
  font-weight: 500; /* Equivalent to font-medium */
  transition: all 0.2s ease;
  border: none;
  cursor: default;
}

.applicant-counter.clickable {
  cursor: pointer;
}

.applicant-counter.clickable:hover {
  background-color: var(--muted-foreground);
  color: var(--background);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.applicant-counter:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.click-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
}

.applicant-counter.has-unread {
  background-color: oklch(0.95 0.05 265); /* Light blue background */
  color: oklch(0.55 0.25 265); /* Blue text color */
  animation: pulse 2s infinite;
}

.counter-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(59, 130, 246, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
}
</style>
