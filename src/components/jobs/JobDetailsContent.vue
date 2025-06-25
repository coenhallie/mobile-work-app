<template>
  <div>
    <!-- Job Images -->
    <JobImageGallery
      :photos="job.photos || []"
      :job-id="job.id"
      @remove-photo="handleRemovePhoto"
      class="mb-4"
    />

    <!-- Job Description -->
    <div class="mb-4">
      <p class="text-muted-foreground whitespace-pre-wrap">
        {{ job.description }}
      </p>
    </div>

    <!-- Job Status and Date -->
    <div class="space-y-2 mb-4">
      <div>
        <span class="font-medium text-foreground"
          >{{ $t('jobs.status') }}:
        </span>
        <span
          :class="statusBadgeClass(job.status)"
          class="px-2 py-1 rounded text-sm font-medium"
        >
          {{ $t(getJobStatusTranslationKey(job.status)) }}
        </span>
      </div>
      <div v-if="job.preferred_datetime">
        <span class="font-medium text-foreground"
          >{{ $t('jobs.preferredDateTime') }}:
        </span>
        <span class="text-muted-foreground">
          {{ formatDateTime(job.preferred_datetime) }}
        </span>
      </div>
    </div>

    <!-- Action Buttons (Conditional based on role) -->
    <div class="mt-6 border-t pt-4">
      <!-- Contractor Actions -->
      <div v-if="userRole === 'contractor' && job.status === 'open'">
        <Button
          @click="$emit('apply')"
          :disabled="isLoading || hasApplied"
          class="w-full sm:w-auto"
        >
          <span v-if="isLoading">{{ $t('jobs.applying') }}</span>
          <span v-else-if="hasApplied">{{ $t('jobs.alreadyApplied') }}</span>
          <span v-else>{{ $t('jobs.applyForThisJob') }}</span>
        </Button>
      </div>

      <!-- Client Actions -->
      <div
        v-else-if="userRole === 'client' && isJobOwner && job.status === 'open'"
      >
        <Button
          @click="$emit('edit')"
          variant="warning"
          class="w-full sm:w-auto mr-2"
        >
          {{ $t('jobs.editJob') }}
        </Button>
        <Button
          @click="$emit('cancel')"
          variant="destructive"
          class="w-full sm:w-auto mt-2 sm:mt-0"
        >
          {{ $t('jobs.cancelJob') }}
        </Button>
      </div>

      <!-- No actions for cancelled jobs -->
      <div v-else-if="job.status === JOB_STATUS.CANCELLED">
        <!-- No action buttons -->
      </div>

      <!-- Display apply error message -->
      <p v-if="errorMessage" class="mt-2 text-sm text-destructive">
        {{ errorMessage }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { Button } from '@/components/ui/button';
import JobActionButton from './JobActionButton.vue';
import JobImageGallery from './JobImageGallery.vue';
import { JOB_STATUS } from '@/stores/job';

const { t } = useI18n();

const props = defineProps({
  job: {
    type: Object,
    required: true,
  },
  userRole: {
    type: String,
    default: null,
  },
  isJobOwner: {
    type: Boolean,
    default: false,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  hasApplied: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['apply', 'edit', 'cancel', 'action', 'remove-photo']);

const getJobStatusTranslationKey = (status) => {
  const statusKey = Object.keys(JOB_STATUS).find(
    (key) => JOB_STATUS[key] === status
  );
  return statusKey
    ? `jobStatus.${statusKey.toLowerCase()}`
    : 'jobStatus.unknown';
};

// Format timestamp to a readable time
const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return 'Not specified';
  try {
    return new Date(dateTimeString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

// Get the appropriate CSS class for a job status badge
const statusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'open':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'assigned':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'in_progress':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'finalized':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
};

// Handle photo removal
const handleRemovePhoto = (photoUrl) => {
  emit('remove-photo', photoUrl);
};
</script>
