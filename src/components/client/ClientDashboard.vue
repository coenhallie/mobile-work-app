<template>
  <!-- Applications View - Completely separate layout -->
  <div
    v-if="activeView === 'applications'"
    class="client-dashboard bg-white dark:bg-gray-900 min-h-screen"
  >
    <!-- Dashboard Header for Applications View -->
    <DashboardHeader
      :primary-button-text="$t('clientDashboard.postJobButton')"
      :primary-icon="Plus"
      :stats="dashboardStats"
      :active-view="activeView"
      @primary-action="$router.push('/services')"
      @view-change="setActiveView"
    />

    <!-- Actions Bar for Applications View -->
    <DashboardActionsBar
      :title="getViewTitle()"
      :view-mode="viewMode"
      :has-active-filters="hasActiveFilters"
      :active-filters-count="activeFiltersCount"
      @view-mode-change="viewMode = $event"
      @filter-click="showFilterSheet = true"
    />

    <!-- Applications List Content -->
    <div class="px-3 pb-4">
      <ApplicationsList
        :applications="allApplications"
        @select-applicant="selectApplicant"
        @reject-applicant="rejectApplicant"
        @send-message="sendMessageToContractor"
      />
    </div>

    <!-- Filter Bottom Sheet for Applications -->
    <JobFilterBottomSheet
      v-model="showFilterSheet"
      :current-sort="sortBy"
      :current-view="activeView"
      :current-statuses="selectedStatuses"
      @apply-filters="handleApplyFilters"
    />
  </div>

  <!-- Regular Dashboard Layout for other views -->
  <DashboardLayout
    v-else
    :primary-button-text="$t('clientDashboard.postJobButton')"
    :primary-icon="Plus"
    :stats="dashboardStats"
    :active-view="activeView"
    :view-title="getViewTitle()"
    :view-mode="viewMode"
    :has-active-filters="hasActiveFilters"
    :active-filters-count="activeFiltersCount"
    :is-loading="isLoading"
    :items="filteredJobs"
    :empty-state-title="getEmptyStateTitle()"
    :empty-state-description="getEmptyStateDescription()"
    :empty-action-text="$t('dashboard.postFirstJob')"
    :empty-action-icon="Plus"
    :has-more-items="hasMoreJobs"
    :is-loading-more="isLoadingMore"
    :loading-text="$t('common.loading')"
    :load-more-text="$t('common.loadMore')"
    :recent-activity="recentActivity"
    :recent-activity-title="$t('dashboard.recentActivity')"
    :format-activity-time="formatActivityTime"
    @primary-action="$router.push('/services')"
    @view-change="setActiveView"
    @view-mode-change="viewMode = $event"
    @filter-click="showFilterSheet = true"
    @empty-action="$router.push('/services')"
    @load-more="loadMoreJobs"
  >
    <!-- Job Card Item Template -->
    <template #item="{ item: job, viewMode }">
      <ClientJobCard
        :job="job"
        :applications="job.applications || []"
        :view-mode="viewMode"
        @view-details="viewJobDetails"
        @edit-job="editJob"
        @view-applications="viewApplications"
        @mark-completed="markJobCompleted"
        @delete-job="deleteJob"
        @view-applicant-details="viewApplicantDetails"
        @select-contractor="selectContractor"
      />
    </template>

    <!-- Filter Bottom Sheet -->
    <template #filter-sheet>
      <JobFilterBottomSheet
        v-model="showFilterSheet"
        :current-sort="sortBy"
        :current-view="activeView"
        :current-statuses="selectedStatuses"
        @apply-filters="handleApplyFilters"
      />
    </template>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Plus } from 'lucide-vue-next';
import DashboardLayout from '../ui/DashboardLayout.vue';
import DashboardHeader from '../ui/DashboardHeader.vue';
import DashboardActionsBar from '../ui/DashboardActionsBar.vue';
import ClientJobCard from './ClientJobCard.vue';
import ApplicationsList from './ApplicationsList.vue';
import JobFilterBottomSheet from './JobFilterBottomSheet.vue';
import { useJobStore } from '@/stores/job';
import { useJobApplicationsStore } from '@/stores/jobApplications';

const { t } = useI18n();
const router = useRouter();
const jobStore = useJobStore();
const jobApplicationsStore = useJobApplicationsStore();

// Component state
const activeView = ref('all');
const viewMode = ref('list');
const sortBy = ref('date');
const isLoading = ref(false);
const isLoadingMore = ref(false);
const hasMoreJobs = ref(false);
const recentActivity = ref([]);
const jobApplicationsMap = ref(new Map());
const allApplications = ref([]);
const showFilterSheet = ref(false);
const selectedStatuses = ref([]);

// Props
const props = defineProps({
  userId: {
    type: String,
    required: true,
  },
});

// Computed properties
const jobs = computed(() => {
  return jobStore.userJobs || [];
});

const jobsWithApplications = computed(() => {
  const result = jobs.value.map((job) => ({
    ...job,
    applications: jobApplicationsMap.value.get(job.id) || [],
  }));
  return result;
});

const totalJobsCount = computed(() => jobs.value.length);
const activeJobsCount = computed(
  () =>
    jobs.value.filter((job) => ['open', 'in_progress'].includes(job.status))
      .length
);
const completedJobsCount = computed(
  () => jobs.value.filter((job) => job.status === 'completed').length
);
const totalApplicationsCount = computed(() =>
  jobs.value.reduce((total, job) => total + (job.applicant_count || 0), 0)
);

const filteredJobs = computed(() => {
  let filtered = [...jobsWithApplications.value];

  // First apply view filter
  switch (activeView.value) {
    case 'active':
      filtered = filtered.filter((job) =>
        ['open', 'in_progress', 'assigned'].includes(job.status)
      );
      break;
    case 'completed':
      filtered = filtered.filter((job) => job.status === 'completed');
      break;
    case 'applications':
      // For applications view, show jobs that have applications
      filtered = filtered.filter((job) => (job.applicant_count || 0) > 0);
      break;
    case 'all':
    default:
      // 'all' shows everything - no additional filtering needed
      break;
  }

  // Then apply status filter if any specific statuses are selected
  if (selectedStatuses.value.length > 0) {
    filtered = filtered.filter((job) =>
      selectedStatuses.value.includes(job.status)
    );
  } else {
    // If no specific statuses are selected, exclude cancelled jobs by default
    filtered = filtered.filter((job) => job.status !== 'cancelled');
  }

  // Sort jobs
  switch (sortBy.value) {
    case 'date':
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
    case 'applications':
      filtered.sort(
        (a, b) => (b.applicant_count || 0) - (a.applicant_count || 0)
      );
      break;
    case 'status':
      filtered.sort((a, b) => a.status.localeCompare(b.status));
      break;
  }

  return filtered;
});

// Filter state computed properties
const hasActiveFilters = computed(() => {
  return (
    selectedStatuses.value.length > 0 ||
    sortBy.value !== 'date' ||
    activeView.value !== 'all'
  );
});

const activeFiltersCount = computed(() => {
  let count = 0;
  if (selectedStatuses.value.length > 0) count++;
  if (sortBy.value !== 'date') count++;
  if (activeView.value !== 'all') count++;
  return count;
});

// Dashboard stats for the reusable component
const dashboardStats = computed(() => [
  {
    key: 'all',
    value: totalJobsCount.value,
    label: t('clientDashboard.totalLabel'),
    ringColor: 'blue',
    valueColor: 'text-gray-900 dark:text-white',
  },
  {
    key: 'active',
    value: activeJobsCount.value,
    label: t('clientDashboard.activeLabel'),
    ringColor: 'green',
    valueColor: 'text-green-600',
  },
  {
    key: 'applications',
    value: totalApplicationsCount.value,
    label: t('clientDashboard.applicationsLabel'),
    ringColor: 'blue',
    valueColor: 'text-blue-600',
  },
  {
    key: 'completed',
    value: completedJobsCount.value,
    label: t('clientDashboard.doneLabel'),
    ringColor: 'gray',
    valueColor: 'text-gray-600',
  },
]);

// Methods
const setActiveView = async (view) => {
  activeView.value = view;

  // Fetch all applications when switching to applications view
  if (view === 'applications') {
    await fetchAllApplications();
  }
};

// Fetch all applications for the client's jobs
const fetchAllApplications = async () => {
  try {
    isLoading.value = true;
    const applications = await jobApplicationsStore.getAllApplicationsForClient(
      props.userId
    );
    allApplications.value = applications;
  } catch (error) {
    console.error('Error fetching all applications:', error);
    allApplications.value = [];
  } finally {
    isLoading.value = false;
  }
};

const getViewTitle = () => {
  switch (activeView.value) {
    case 'all':
      return t('dashboard.allJobs');
    case 'active':
      return t('dashboard.activeJobs');
    case 'completed':
      return t('dashboard.completedJobs');
    case 'applications':
      return t('dashboard.jobsWithApplications');
    default:
      return t('dashboard.allJobs');
  }
};

const getEmptyStateTitle = () => {
  switch (activeView.value) {
    case 'active':
      return t('dashboard.noActiveJobs');
    case 'completed':
      return t('dashboard.noCompletedJobs');
    case 'applications':
      return t('dashboard.noApplications');
    default:
      return t('dashboard.noJobsYet');
  }
};

const getEmptyStateDescription = () => {
  switch (activeView.value) {
    case 'active':
      return t('dashboard.noActiveJobsDescription');
    case 'completed':
      return t('dashboard.noCompletedJobsDescription');
    case 'applications':
      return t('dashboard.noApplicationsDescription');
    default:
      return t('dashboard.noJobsYetDescription');
  }
};

const loadMoreJobs = async () => {
  isLoadingMore.value = true;
  try {
    await jobStore.fetchJobsByUser(props.userId);
  } catch (error) {
    console.error('Error loading more jobs:', error);
  } finally {
    isLoadingMore.value = false;
  }
};

const viewJobDetails = (job) => {
  router.push(`/job/${job.id}`);
};

const editJob = (job) => {
  router.push(`/edit-job/${job.id}/${job.service_id}`);
};

const viewApplications = (job) => {
  router.push(`/job/${job.id}?tab=applications`);
};

const markJobCompleted = async (job) => {
  try {
    await jobStore.updateJobStatus(job.id, 'completed');
    await jobStore.fetchJobsByUser(props.userId);
  } catch (error) {
    console.error('Error marking job as completed:', error);
  }
};

const deleteJob = async (job) => {
  if (confirm(t('dashboard.confirmDeleteJob'))) {
    try {
      await jobStore.deleteJob(job.id);
      await jobStore.fetchJobsByUser(props.userId);
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  }
};

const viewApplicantDetails = (applicant) => {
  router.push(`/contractor/${applicant.contractor_user_id}`);
};

// New methods for ApplicationsList component
const selectApplicant = async (application) => {
  try {
    const result = await jobApplicationsStore.selectContractor(
      application.jobId,
      application.id
    );

    if (result.success) {
      // Refresh applications list
      await fetchAllApplications();
      // Optionally show success message
      console.log('Contractor selected successfully');
    }
  } catch (error) {
    console.error('Error selecting applicant:', error);
  }
};

const rejectApplicant = async (application) => {
  if (confirm(t('dashboard.confirmRejectApplication'))) {
    try {
      await jobApplicationsStore.updateApplicationStatus(
        application.id,
        'rejected'
      );
      // Refresh applications list
      await fetchAllApplications();
    } catch (error) {
      console.error('Error rejecting applicant:', error);
    }
  }
};

const sendMessageToContractor = async (application) => {
  // Navigate to chat with the contractor
  router.push(`/messages?contractor=${application.contractor.userId}`);
};

const selectContractor = async (applicant) => {
  try {
    const result = await jobApplicationsStore.selectContractor(
      applicant.job_id,
      applicant.id
    );

    if (result.success) {
      // Refresh applications for this job
      await fetchApplicationsForJob(applicant.job_id);
      // Optionally show success message
    } else {
      console.error('Error selecting contractor:', result.error);
    }
  } catch (error) {
    console.error('Error selecting contractor:', error);
  }
};

const fetchApplicationsForJob = async (jobId) => {
  try {
    const applications = await jobApplicationsStore.getJobApplications(jobId);
    jobApplicationsMap.value.set(jobId, applications);
  } catch (error) {
    console.error(`Error fetching applications for job ${jobId}:`, error);
  }
};

const fetchApplicationsForJobsWithApplications = async () => {
  const jobsWithApps = jobs.value.filter(
    (job) => (job.applicant_count || 0) > 0
  );

  for (const job of jobsWithApps) {
    await fetchApplicationsForJob(job.id);
  }
};

const formatActivityTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

  if (diffInHours < 1) {
    return t('common.justNow');
  } else if (diffInHours < 24) {
    return t('common.hoursAgo', { hours: diffInHours });
  } else {
    return date.toLocaleDateString();
  }
};

// Filter handling
const handleApplyFilters = (filters) => {
  console.log('Dashboard: Applying filters', JSON.stringify(filters));
  sortBy.value = filters.sort;
  activeView.value = filters.view;
  selectedStatuses.value = filters.statuses;
  console.log(
    'Dashboard: Statuses set to',
    JSON.stringify(selectedStatuses.value)
  );
};

// Lifecycle
onMounted(async () => {
  isLoading.value = true;
  try {
    await jobStore.fetchJobsByUser(props.userId);

    // Fetch applications for jobs that have applications
    await fetchApplicationsForJobsWithApplications();
  } catch (error) {
    console.error('Error in ClientDashboard onMounted:', error);
  } finally {
    isLoading.value = false;
  }
});

// Watch for view changes to update URL and clear status filters
watch(activeView, (newView) => {
  console.log(
    'Dashboard: activeView changed to',
    newView,
    '. Clearing status filters.'
  );
  // Clear status filters when view changes
  selectedStatuses.value = [];

  router.replace({
    query: { ...router.currentRoute.value.query, view: newView },
  });
});

// Watch for filter changes
watch(
  [sortBy, activeView, selectedStatuses],
  ([newSort, newView, newStatuses]) => {
    console.log('Filter state changed:', {
      sortBy: newSort,
      activeView: newView,
      selectedStatuses: newStatuses,
    });
  },
  { deep: true }
);
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
