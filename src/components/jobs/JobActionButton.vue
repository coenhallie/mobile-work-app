<template>
  <div>
    <!--
      JobActionButton Component
      
      This component displays different action buttons based on:
      1. The current job status
      2. The user's role (contractor or client)
      3. The application status for contractors
      
      It implements the complete job status workflow by showing appropriate
      actions at each stage and emitting events when actions are taken.
    -->

    <!-- Contractor Actions -->
    <template v-if="userRole === 'contractor'">
      <!-- For assigned jobs that need to be started (ASSIGNED → IN_PROGRESS) -->
      <Button
        v-if="
          job.status === JOB_STATUS.ASSIGNED ||
          job.status === 'pending_assignment'
        "
        size="sm"
        variant="default"
        @click="$emit('action', 'start')"
      >
        {{ $t('jobs.startJob') }}
      </Button>

      <!-- For in-progress jobs that can be marked as completed (IN_PROGRESS → COMPLETED) -->
      <Button
        v-else-if="job.status === JOB_STATUS.IN_PROGRESS"
        size="sm"
        variant="default"
        @click="$emit('action', 'complete')"
      >
        {{ $t('jobs.markComplete') }}
      </Button>

      <!-- For jobs in review (waiting for client) - no action available -->
      <Button
        v-else-if="job.status === JOB_STATUS.IN_REVIEW"
        size="sm"
        variant="outline"
        disabled
      >
        {{ $t('jobs.awaitingReview') }}
      </Button>

      <!-- For cancelled jobs that can be removed -->
      <!-- <Button
        v-else-if="job.status === JOB_STATUS.CANCELLED"
        size="sm"
        variant="destructive"
        @click="$emit('action', 'remove')"
      >
        Remove Job
      </Button> -->
    </template>

    <!-- Client Actions -->
    <template v-else-if="userRole === 'client'">
      <!-- For completed jobs that need review (COMPLETED → IN_REVIEW) -->
      <Button
        v-if="job.status === JOB_STATUS.COMPLETED"
        size="sm"
        variant="default"
        @click="$emit('action', 'review')"
      >
        {{ $t('jobs.reviewWork') }}
      </Button>

      <!-- For jobs in review that can be finalized (IN_REVIEW → FINALIZED) -->
      <Button
        v-else-if="job.status === JOB_STATUS.IN_REVIEW"
        size="sm"
        variant="default"
        @click="$emit('action', 'finalize')"
      >
        {{ $t('jobs.finalizeJob') }}
      </Button>

      <!-- For in-progress jobs (waiting for contractor to complete) - no action available -->
      <Button
        v-else-if="job.status === JOB_STATUS.IN_PROGRESS"
        size="sm"
        variant="outline"
        disabled
      >
        {{ $t('jobs.inProgress') }}
      </Button>

      <!-- For cancelled jobs that can be removed -->
      <Button
        v-else-if="
          job.status === JOB_STATUS.CANCELLED && props.isJobDetailsView
        "
        size="sm"
        variant="destructive"
        @click="$emit('action', 'remove')"
      >
        {{ $t('jobs.removeJob') }}
      </Button>
    </template>

    <!-- Open job actions for contractors -->
    <template
      v-else-if="userRole === 'contractor' && job.status === JOB_STATUS.OPEN"
    >
      <!-- Show "You've Applied" state if contractor has already applied -->
      <Button v-if="hasApplied" size="sm" variant="outline" disabled>
        {{ $t('jobs.youveApplied') }}
      </Button>
      <!-- Show "Apply" button if contractor hasn't applied yet -->
      <Button
        v-else
        size="sm"
        variant="default"
        :disabled="isApplying"
        @click="handleApply"
      >
        {{ isApplying ? $t('jobs.applying') : $t('buttons.apply') }}
      </Button>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useJobStore, JOB_STATUS } from '../../stores/job';
import { useAuth } from '../../composables/useAuth';
import Button from '../ui/button/Button.vue';

const { t } = useI18n();

const props = defineProps({
  job: {
    type: Object,
    required: true,
  },
  userRole: {
    type: String,
    required: true,
    validator: (value) => ['contractor', 'client', 'admin'].includes(value),
  },
  // Optional prop to indicate if the contractor has already applied
  // If not provided, we'll check automatically
  hasAppliedProp: {
    type: Boolean,
    default: null,
  },
  // Prop to indicate if the component is rendered in the job details view
  isJobDetailsView: {
    type: Boolean,
    default: false, // Default to false, so it's hidden on job cards unless specified
  },
});

const emit = defineEmits(['action', 'applied', 'application-error']);

// Get the job store and user info
const jobStore = useJobStore();
const { user } = useAuth();
const userId = computed(() => user.value?.id);

// Local state
const isApplying = ref(false);
const hasApplied = ref(props.hasAppliedProp);

// Check if the contractor has already applied for this job
const checkIfUserHasApplied = async () => {
  if (props.hasAppliedProp !== null) {
    // Use the prop value if provided
    hasApplied.value = props.hasAppliedProp;
    return;
  }

  if (!props.job.id || !userId.value || props.userRole !== 'contractor') {
    return;
  }

  try {
    // Use the auth composable to get the Supabase client
    const { getSupabaseClient } = useAuth();
    const supabase = getSupabaseClient();

    const { data: applications } = await supabase
      .from('job_applications')
      .select('*')
      .eq('job_id', props.job.id)
      .eq('contractor_user_id', userId.value)
      .limit(1);

    hasApplied.value = applications && applications.length > 0;
  } catch (err) {
    console.error('Error checking if user has applied:', err);
  }
};

// Handle apply button click
const handleApply = async () => {
  if (isApplying.value || hasApplied.value) return;

  isApplying.value = true;

  try {
    // Emit the action event for parent components that need it
    emit('action', 'apply');

    // If the parent component doesn't handle the application process,
    // we can handle it directly here
    if (!props.job.id || !userId.value) {
      throw new Error('Missing job ID or user ID');
    }

    // Call the job store's applyToJob function
    const { success, applicationId, error } = await jobStore.applyToJob(
      props.job.id,
      userId.value
    );

    if (success) {
      hasApplied.value = true;
      emit('applied', { applicationId });
    } else {
      emit('application-error', error || 'Failed to apply for job');
    }
  } catch (err) {
    console.error('Error applying for job:', err);
    emit('application-error', err.message);
  } finally {
    isApplying.value = false;
  }
};

// Check if the user has already applied when the component mounts
onMounted(() => {
  checkIfUserHasApplied();
});
</script>
