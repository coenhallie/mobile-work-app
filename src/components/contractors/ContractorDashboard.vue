<template>
  <DashboardLayout
    :primary-button-text="$t('contractorDashboard.browseJobsButton')"
    :primary-icon="Search"
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
    :empty-action-text="$t('contractorDashboard.browseJobs')"
    :empty-action-icon="Search"
    :has-more-items="hasMoreJobs"
    :is-loading-more="isLoadingMore"
    :loading-text="$t('common.loading')"
    :load-more-text="$t('common.loadMore')"
    :recent-activity="recentActivity"
    :recent-activity-title="$t('dashboard.recentActivity')"
    :format-activity-time="formatActivityTime"
    @primary-action="$router.push('/')"
    @view-change="setActiveView"
    @view-mode-change="viewMode = $event"
    @filter-click="showFilterSheet = true"
    @empty-action="$router.push('/')"
    @load-more="loadMoreJobs"
  >
    <!-- Job Card Item Template -->
    <template #item="{ item: job, viewMode }">
      <ClientJobCard
        :job="job"
        :applications="job.applications || []"
        :view-mode="viewMode"
        :user-role="'contractor'"
        @view-details="viewJobDetails"
        @edit-job="editJob"
        @view-applications="viewApplications"
        @mark-completed="markJobCompleted"
        @delete-job="deleteJob"
        @view-applicant-details="viewApplicantDetails"
        @select-contractor="selectContractor"
        class="border-0 p-0 bg-transparent"
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
import { Search } from 'lucide-vue-next';
import DashboardLayout from '../ui/DashboardLayout.vue';
import ClientJobCard from '../client/ClientJobCard.vue';
import JobFilterBottomSheet from '../client/JobFilterBottomSheet.vue';
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
const contractorJobs = computed(() => jobStore.contractorJobs || []);
const availableJobs = computed(() => jobStore.jobs || []);

// Combine contractor jobs and available opportunities
const allJobs = computed(() => {
  const myJobs = contractorJobs.value.map((job) => ({ ...job, isMyJob: true }));
  const opportunities = availableJobs.value
    .filter(
      (job) =>
        job.status === 'open' &&
        !contractorJobs.value.find((cj) => cj.id === job.id)
    )
    .map((job) => ({ ...job, isMyJob: false }));

  return [...myJobs, ...opportunities];
});

const totalJobsCount = computed(() => contractorJobs.value.length);
const activeJobsCount = computed(
  () =>
    contractorJobs.value.filter((job) =>
      ['assigned', 'in_progress'].includes(job.status)
    ).length
);
const completedJobsCount = computed(
  () => contractorJobs.value.filter((job) => job.status === 'completed').length
);
const opportunitiesCount = computed(
  () => availableJobs.value.filter((job) => job.status === 'open').length
);

const filteredJobs = computed(() => {
  let filtered = [...allJobs.value];

  // Apply view filter
  switch (activeView.value) {
    case 'active':
      filtered = filtered.filter(
        (job) => job.isMyJob && ['assigned', 'in_progress'].includes(job.status)
      );
      break;
    case 'completed':
      filtered = filtered.filter(
        (job) => job.isMyJob && job.status === 'completed'
      );
      break;
    case 'opportunities':
      filtered = filtered.filter(
        (job) => !job.isMyJob && job.status === 'open'
      );
      break;
    // 'all' shows everything
  }

  // Apply status filter if any specific statuses are selected
  if (selectedStatuses.value.length > 0) {
    filtered = filtered.filter((job) =>
      selectedStatuses.value.includes(job.status)
    );
  }

  // Sort jobs
  switch (sortBy.value) {
    case 'date':
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
    case 'budget':
      filtered.sort(
        (a, b) => (b.estimated_budget || 0) - (a.estimated_budget || 0)
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
    label: t('contractorDashboard.totalJobsLabel'),
    ringColor: 'blue',
    valueColor: 'text-gray-900 dark:text-white',
  },
  {
    key: 'active',
    value: activeJobsCount.value,
    label: t('contractorDashboard.activeJobsLabel'),
    ringColor: 'green',
    valueColor: 'text-green-600',
  },
  {
    key: 'opportunities',
    value: opportunitiesCount.value,
    label: t('contractorDashboard.opportunitiesLabel'),
    ringColor: 'blue',
    valueColor: 'text-blue-600',
  },
  {
    key: 'completed',
    value: completedJobsCount.value,
    label: t('contractorDashboard.completedLabel'),
    ringColor: 'gray',
    valueColor: 'text-gray-600',
  },
]);

// Methods
const setActiveView = async (view) => {
  activeView.value = view;

  // Load appropriate data based on view
  if (view === 'opportunities') {
    await loadAvailableJobs();
  } else {
    await loadContractorJobs();
  }
};

const loadContractorJobs = async () => {
  try {
    isLoading.value = true;
    await jobStore.fetchContractorJobs(props.userId);
  } catch (error) {
    console.error('Error loading contractor jobs:', error);
  } finally {
    isLoading.value = false;
  }
};

const loadAvailableJobs = async () => {
  try {
    isLoading.value = true;
    await jobStore.fetchJobs();
  } catch (error) {
    console.error('Error loading available jobs:', error);
  } finally {
    isLoading.value = false;
  }
};

const getViewTitle = () => {
  switch (activeView.value) {
    case 'all':
      return t('contractorDashboard.allJobs');
    case 'active':
      return t('contractorDashboard.activeJobs');
    case 'completed':
      return t('contractorDashboard.completedJobs');
    case 'opportunities':
      return t('contractorDashboard.opportunities');
    default:
      return t('contractorDashboard.allJobs');
  }
};

const getEmptyStateTitle = () => {
  switch (activeView.value) {
    case 'active':
      return t('contractorDashboard.noActiveJobs');
    case 'completed':
      return t('contractorDashboard.noCompletedJobs');
    case 'opportunities':
      return t('contractorDashboard.noOpportunities');
    default:
      return t('contractorDashboard.noJobsYet');
  }
};

const getEmptyStateDescription = () => {
  switch (activeView.value) {
    case 'active':
      return t('contractorDashboard.noActiveJobsDescription');
    case 'completed':
      return t('contractorDashboard.noCompletedJobsDescription');
    case 'opportunities':
      return t('contractorDashboard.noOpportunitiesDescription');
    default:
      return t('contractorDashboard.noJobsYetDescription');
  }
};

const loadMoreJobs = async () => {
  isLoadingMore.value = true;
  try {
    if (activeView.value === 'opportunities') {
      await jobStore.fetchJobs();
    } else {
      await jobStore.fetchContractorJobs(props.userId);
    }
  } catch (error) {
    console.error('Error loading more jobs:', error);
  } finally {
    isLoadingMore.value = false;
  }
};

const viewJobDetails = (job) => {
  router.push(`/jobs/${job.id}`);
};

const editJob = (job) => {
  // For contractors, this could redirect to job details or be disabled
  router.push(`/jobs/${job.id}`);
};

const viewApplications = (job) => {
  // For contractors, this could show their application status
  router.push(`/jobs/${job.id}`);
};

const markJobCompleted = async (job) => {
  try {
    await jobStore.updateJobStatus(job.id, 'completed');
    await loadContractorJobs();
  } catch (error) {
    console.error('Error marking job complete:', error);
  }
};

const deleteJob = (job) => {
  // For contractors, this would not be available
  console.log('Delete not available for contractors');
};

const viewApplicantDetails = (applicant) => {
  // For contractors, this would not be available
  console.log('View applicant details not available for contractors');
};

const selectContractor = (applicant) => {
  // For contractors, this would not be available
  console.log('Select contractor not available for contractors');
};

const handleApplyFilters = (filters) => {
  sortBy.value = filters.sortBy;
  selectedStatuses.value = filters.statuses;
  showFilterSheet.value = false;
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

// Lifecycle
onMounted(async () => {
  await Promise.all([loadContractorJobs(), loadAvailableJobs()]);
});

// Watch for user changes
watch(
  () => props.userId,
  async (newUserId) => {
    if (newUserId) {
      await loadContractorJobs();
    }
  }
);
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
