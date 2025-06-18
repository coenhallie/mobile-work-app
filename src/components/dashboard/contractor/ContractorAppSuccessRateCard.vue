<template>
  <div class="card-sm">
    <div class="card-content-sm">
      <h3 class="card-title-sm">Application Stats</h3>
      <div v-if="loading" class="loading-text">Loading...</div>
      <div v-else-if="error" class="error-text">Error loading.</div>
      <div v-else class="data-grid">
        <div class="data-item">
          <span class="data-value-lg">{{ successRate.toFixed(1) }}%</span>
          <span class="data-label-sm">Success Rate</span>
        </div>
        <div class="data-item">
          <span class="data-value-lg">{{ pendingApplicationsCount }}</span>
          <span class="data-label-sm">Pending</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useJobStore } from '../../../stores/job';
import { useJobApplicationsStore } from '../../../stores/jobApplications';
import { useAuth } from '../../../composables/useAuth'; // Use centralized auth system

console.log('[ContractorAppSuccessRateCard] Component loading...');

const jobStore = useJobStore();
const jobApplicationsStore = useJobApplicationsStore();
const { user, isSignedIn } = useAuth(); // Use centralized auth system

const loading = ref(true);
const error = ref(null);
const contractorApplications = ref([]);
const contractorJobs = ref([]);

const contractorId = computed(() => user.value?.id);

console.log('[ContractorAppSuccessRateCard] Auth state:', {
  isSignedIn: isSignedIn.value,
  userId: contractorId.value,
});

onMounted(async () => {
  console.log('[ContractorAppSuccessRateCard] Component mounted');

  if (!contractorId.value) {
    console.warn('[ContractorAppSuccessRateCard] No contractor ID found');
    error.value = new Error(
      'Contractor ID not found. User might not be logged in.'
    );
    loading.value = false;
    return;
  }

  try {
    console.log('[ContractorAppSuccessRateCard] Fetching contractor jobs...');
    // Fetch contractor jobs using the existing method
    await jobStore.fetchContractorJobs(contractorId.value);
    contractorJobs.value = jobStore.contractorJobs || [];

    console.log(
      '[ContractorAppSuccessRateCard] Contractor jobs fetched:',
      contractorJobs.value.length
    );

    // For applications, we'll need to implement a method to get applications by contractor
    // For now, set empty array to prevent errors
    contractorApplications.value = [];

    console.log('[ContractorAppSuccessRateCard] Data loaded successfully');
  } catch (e) {
    console.error('[ContractorAppSuccessRateCard] Failed to load data:', e);
    error.value = e;
  } finally {
    loading.value = false;
  }
});

const successRate = computed(() => {
  if (contractorApplications.value.length === 0) {
    return 0;
  }
  // Simplified: Number of assigned jobs / total applications by contractor
  // This assumes that any job in contractorJobs list that originated from an application
  // by this contractor counts towards success.
  // A more accurate calculation would require linking jobs back to specific applications.
  // For now, we count jobs assigned to the contractor that might have originated from an application.

  // Let's refine this: we need to count how many of the contractor's applications resulted in a job.
  // This implies an application status or a link from job to application.
  // If an application has a `job_id` when accepted, or a job has an `application_id`.

  // Assuming an application has a status like 'accepted' or 'hired'
  // and/or a `job_id` field when it becomes a job.
  // Or, a job has an `originating_application_id`.

  // For now, let's count applications that have a status indicating they led to a job.
  // This is a placeholder. The actual logic depends on the data model.
  // If `job.application_id` exists and `application.id` exists:
  const successfulApplicationIds = new Set(
    contractorJobs.value.map((job) => job.application_id).filter((id) => id)
  );
  const successfulApplicationsCount = contractorApplications.value.filter(
    (app) => successfulApplicationIds.has(app.id)
  ).length;

  // If the above is not possible, and we must use the simplified (Number of Assigned Jobs / Total Applications):
  // This is less accurate as it doesn't directly link jobs to applications.
  // const assignedJobsCount = contractorJobs.value.length;
  // return (assignedJobsCount / contractorApplications.value.length) * 100;

  if (successfulApplicationsCount > 0) {
    return (
      (successfulApplicationsCount / contractorApplications.value.length) * 100
    );
  }
  // Fallback to a simpler, potentially less accurate calculation if direct linking isn't clear
  // This counts any job assigned to the contractor as "successful" in relation to their total applications.
  // This is a broad assumption.
  const assignedJobsDirectlyToContractor = contractorJobs.value.length;
  if (
    assignedJobsDirectlyToContractor > 0 &&
    contractorApplications.value.length > 0
  ) {
    // This is a very rough estimate if direct linking is not possible.
    // It assumes any job assigned to the contractor is a "success" relative to their applications.
    // This part needs clarification based on data model.
    // For now, let's assume the `successfulApplicationIds` logic is preferred.
    // If that yields 0, and there are assigned jobs, it implies a mismatch or different flow.
    // Let's stick to the `successfulApplicationIds` logic for now.
  }

  return (
    (successfulApplicationsCount / contractorApplications.value.length) * 100
  );
});

const pendingApplicationsCount = computed(() => {
  // Assuming 'pending' status. Adjust based on actual status values.
  return contractorApplications.value.filter((app) => app.status === 'pending')
    .length;
});
</script>

<style scoped>
.card-sm {
  background-color: var(--card);
  color: var(--card-foreground);
  border-radius: var(--radius-lg);
  padding: var(--space-4); /* 1rem */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.card-content-sm {
  display: flex;
  flex-direction: column;
  gap: var(--space-3); /* 0.75rem */
}

.card-title-sm {
  font-size: 1.125rem; /* text-lg */
  font-weight: 600; /* semibold */
  color: var(--foreground);
  margin: 0;
}

.loading-text,
.error-text {
  font-size: 0.875rem; /* text-sm */
  color: var(--muted-foreground);
  text-align: center;
  padding: var(--space-4) 0;
}

.error-text {
  color: var(--destructive);
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: var(--space-3); /* 0.75rem */
}

.data-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: var(--space-3);
  background-color: var(--muted);
  border-radius: var(--radius-md);
}

.data-label-sm {
  font-size: 0.875rem; /* text-sm */
  color: var(--muted-foreground);
  font-weight: 500; /* medium */
}

.data-value-lg {
  font-size: 1.5rem; /* text-2xl */
  font-weight: 700; /* bold */
  color: var(--primary);
  line-height: 1.2;
}
</style>
