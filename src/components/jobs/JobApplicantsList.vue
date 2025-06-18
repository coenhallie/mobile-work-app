<template>
  <div class="job-applicants-list">
    <!-- Loading State -->
    <div v-if="loading" class="text-center text-muted-foreground py-6">
      <div
        class="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mr-2"
      ></div>
      {{ $t('jobs.loadingApplicants') }}
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="text-center text-red-500 dark:text-red-400 py-6"
    >
      {{ $t('jobs.errorLoadingApplicants') }}: {{ error }}
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!applicants || applicants.length === 0"
      class="border border-dashed border-gray-300 dark:border-gray-600 p-6 text-center text-gray-500 dark:text-gray-400 rounded"
    >
      <p class="text-lg">{{ $t('jobs.noApplicantsYet') }}</p>
      <p class="text-sm mt-2">
        {{ $t('jobs.noApplicantsDescription') }}
      </p>
    </div>

    <!-- Applicants List -->
    <div v-else class="space-y-4">
      <JobApplicantCard
        v-for="applicant in applicants"
        :key="applicant.id"
        :applicant="applicant"
        :is-job-owner="isJobOwner"
        @select="selectApplicant"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useJobStore } from '../../stores/job';
import { useJobApplicationsStore } from '../../stores/jobApplications';
import JobApplicantCard from './JobApplicantCard.vue';

const { t } = useI18n();

const props = defineProps({
  jobId: {
    type: String,
    required: true,
  },
  isJobOwner: {
    type: Boolean,
    default: false,
  },
  hasUnreadApplications: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['applicant-selected']);

const jobStore = useJobStore();
const jobApplicationsStore = useJobApplicationsStore();
const applicants = ref([]);
const loading = ref(true);
const error = ref(null);

// Fetch applicants when component mounts
onMounted(async () => {
  await fetchApplicants();

  // If there are unread applications, mark them as read
  if (props.hasUnreadApplications && props.isJobOwner) {
    await jobApplicationsStore.markJobApplicationsAsRead(props.jobId);
  }
});

// Watch for changes in hasUnreadApplications prop
watch(
  () => props.hasUnreadApplications,
  async (newVal) => {
    if (newVal && props.isJobOwner) {
      await jobApplicationsStore.markJobApplicationsAsRead(props.jobId);
    }
  }
);

// Fetch applicants from the job applications store
async function fetchApplicants() {
  loading.value = true;
  error.value = null;

  try {
    const data = await jobApplicationsStore.getJobApplications(props.jobId);

    if (data && Array.isArray(data)) {
      applicants.value = data;
    } else {
      applicants.value = [];
    }
  } catch (err) {
    console.error('Error fetching applicants:', err);
    error.value = err.message || 'Failed to load applicants';
    applicants.value = [];
  } finally {
    loading.value = false;
  }
}

// Select an applicant for the job
async function selectApplicant(applicationId) {
  if (!props.isJobOwner) return;

  try {
    // Show loading state
    loading.value = true;
    error.value = null;

    const result = await jobApplicationsStore.selectContractor(
      props.jobId,
      applicationId
    );

    if (result.success) {
      // Emit success event with detailed information
      emit('applicant-selected', {
        applicationId,
        contractorId: result.selectedContractor,
        jobStatus: result.updatedJob?.status,
      });

      // Clear any previous errors
      error.value = null;

      // Refresh the applicants list to show updated statuses
      await fetchApplicants();
    } else {
      console.error('[JobApplicantsList] Selection failed:', result.error);
      error.value = result.error || 'Failed to select contractor';
    }
  } catch (err) {
    console.error('[JobApplicantsList] ===== APPLICANT SELECTION ERROR =====');
    console.error('[JobApplicantsList] Error selecting contractor:', err);
    error.value = err.message || 'An unexpected error occurred';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.job-applicants-list {
  display: flex;
  flex-direction: column;
  gap: 1rem; /* Equivalent to space-y-4 */
}
</style>
