<template>
  <div class="applicant-management-section">
    <!-- Section Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-foreground">
          Job Applicants
          <span
            v-if="applicantCount > 0"
            class="text-lg font-normal text-muted-foreground"
          >
            ({{ applicantCount }})
          </span>
        </h2>
        <p class="text-sm text-muted-foreground mt-1">
          Manage and communicate with contractors who applied for this job
        </p>
      </div>

      <!-- Quick Actions -->
      <div v-if="isJobOwner && applicantCount > 0" class="flex gap-2">
        <button
          @click="refreshApplicants"
          :disabled="isRefreshing"
          class="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center"
        >
          <svg
            class="w-4 h-4 mr-1"
            :class="{ 'animate-spin': isRefreshing }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            ></path>
          </svg>
          Refresh
        </button>
      </div>
    </div>

    <!-- Applicants List -->
    <JobApplicantsList
      :job-id="jobId"
      :is-job-owner="isJobOwner"
      :has-unread-applications="hasUnreadApplications"
      @applicant-selected="handleApplicantSelected"
    />

    <!-- Success/Error Messages -->
    <div
      v-if="successMessage"
      class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg"
    >
      <div class="flex items-center">
        <svg
          class="w-5 h-5 text-green-600 mr-2"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd"
          ></path>
        </svg>
        <p class="text-green-800 text-sm">{{ successMessage }}</p>
      </div>
    </div>

    <div
      v-if="errorMessage"
      class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
    >
      <div class="flex items-center">
        <svg
          class="w-5 h-5 text-red-600 mr-2"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd"
          ></path>
        </svg>
        <p class="text-red-800 text-sm">{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import JobApplicantsList from './JobApplicantsList.vue';

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
  applicantCount: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(['applicant-selected', 'refresh-needed']);

// State
const isRefreshing = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

// Methods
async function refreshApplicants() {
  isRefreshing.value = true;
  try {
    emit('refresh-needed');
    successMessage.value = 'Applicants refreshed successfully';
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  } catch (error) {
    errorMessage.value = 'Failed to refresh applicants';
    setTimeout(() => {
      errorMessage.value = '';
    }, 5000);
  } finally {
    isRefreshing.value = false;
  }
}

function handleApplicantSelected(applicationId) {
  successMessage.value = 'Contractor selected successfully!';
  setTimeout(() => {
    successMessage.value = '';
  }, 3000);
  emit('applicant-selected', applicationId);
}

function handleStatusChanged({ applicationId, status }) {
  const statusMessages = {
    shortlisted: 'Applicant shortlisted',
    rejected: 'Applicant declined',
    selected: 'Contractor selected',
  };

  successMessage.value = statusMessages[status] || 'Status updated';
  setTimeout(() => {
    successMessage.value = '';
  }, 3000);
}
</script>

<style scoped>
.applicant-management-section {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
}
</style>
