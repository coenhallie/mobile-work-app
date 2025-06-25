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
      :stats="enhancedDashboardStats"
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

  <!-- Enhanced Dashboard Layout with Priority Sections -->
  <div v-else class="client-dashboard bg-white dark:bg-gray-900 min-h-screen">
    <!-- Dashboard Header -->
    <DashboardHeader
      :primary-button-text="$t('clientDashboard.postJobButton')"
      :primary-icon="Plus"
      :stats="enhancedDashboardStats"
      :active-view="activeView"
      @primary-action="$router.push('/services')"
      @view-change="setActiveView"
    />

    <!-- Actions Bar -->
    <DashboardActionsBar
      :title="getViewTitle()"
      :view-mode="viewMode"
      :has-active-filters="hasActiveFilters"
      :active-filters-count="activeFiltersCount"
      @view-mode-change="viewMode = $event"
      @filter-click="showFilterSheet = true"
    />

    <!-- Main Content Area -->
    <div class="px-3 pb-4 space-y-6">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center py-8">
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
        ></div>
      </div>

      <!-- Simplified Job List -->
      <div v-else-if="prioritizedJobs.length > 0" class="space-y-3">
        <ClientJobCard
          v-for="job in prioritizedJobs"
          :key="job.id"
          :job="job"
          :applications="job.applications || []"
          :view-mode="viewMode"
          :priority-level="getPriorityLevel(job)"
          @view-details="viewJobDetails"
          @edit-job="editJob"
          @view-applications="viewApplications"
          @mark-completed="markJobCompleted"
          @delete-job="deleteJob"
          @view-applicant-details="viewApplicantDetails"
          @select-contractor="selectContractor"
          @job-action="handleJobAction"
        />

        <!-- Load More Button -->
        <div v-if="hasMoreJobs" class="flex justify-center pt-4">
          <button
            @click="loadMoreJobs"
            :disabled="isLoadingMore"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <div
              v-if="isLoadingMore"
              class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
            ></div>
            <span>{{
              isLoadingMore ? $t('common.loading') : $t('common.loadMore')
            }}</span>
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <div class="mx-auto h-12 w-12 text-gray-400">
          <Plus class="h-12 w-12" />
        </div>
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          {{ getEmptyStateTitle() }}
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ getEmptyStateDescription() }}
        </p>
        <div class="mt-6">
          <button
            @click="$router.push('/services')"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus class="h-5 w-5 mr-2" />
            {{ $t('dashboard.postFirstJob') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Filter Bottom Sheet -->
    <JobFilterBottomSheet
      v-model="showFilterSheet"
      :current-sort="sortBy"
      :current-view="activeView"
      :current-statuses="selectedStatuses"
      @apply-filters="handleApplyFilters"
    />
  </div>
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

// Helper functions for priority calculation
const isWithin24Hours = (dateString) => {
  if (!dateString) return false;
  const deadline = new Date(dateString);
  const now = new Date();
  const diffInHours = (deadline - now) / (1000 * 60 * 60);
  return diffInHours > 0 && diffInHours <= 24;
};

const getPriorityScore = (job) => {
  let score = 0;

  // Urgent priority (highest)
  if (job.status === 'completed') score += 1000; // Awaiting finalization
  if (job.deadline && isWithin24Hours(job.deadline)) score += 800; // Approaching deadline

  // High priority
  if (['assigned', 'in_progress'].includes(job.status)) score += 700;
  if ((job.applicant_count || 0) > 0 && job.status === 'open') score += 600;

  // Medium priority
  if (job.status === 'open') score += 500;
  if (job.is_urgent || job.isUrgent) score += 100;

  // Recent activity bonus
  const daysSinceUpdate =
    (new Date() - new Date(job.updated_at || job.created_at)) /
    (1000 * 60 * 60 * 24);
  if (daysSinceUpdate < 1) score += 50;

  return score;
};

const getPriorityLevel = (job) => {
  if (job.is_urgent || job.isUrgent) return 'urgent';
  if (job.status === 'completed') return 'urgent';
  if (['assigned', 'in_progress'].includes(job.status)) return 'high';
  if ((job.applicant_count || 0) > 0 && job.status === 'open') return 'high';
  if (job.deadline && isWithin24Hours(job.deadline)) return 'urgent';
  return 'medium';
};

// Priority-based job categorization
const needsAttentionJobs = computed(() => {
  return jobsWithApplications.value
    .filter((job) => {
      // Jobs requiring immediate client action
      const isCompletedAwaitingReview =
        job.status === 'completed' && !job.reviewed;
      const isCompletedAwaitingFinalization = job.status === 'completed';
      const isInReviewAwaitingFinalization = job.status === 'in_review';
      const hasNewApplications =
        (job.applicant_count || 0) > 0 && job.status === 'open';
      const isApproachingDeadline =
        job.deadline && isWithin24Hours(job.deadline);
      const isUrgent = job.is_urgent || job.isUrgent;

      return (
        isCompletedAwaitingReview ||
        isInReviewAwaitingFinalization ||
        (hasNewApplications && isUrgent) ||
        isApproachingDeadline
      );
    })
    .sort((a, b) => getPriorityScore(b) - getPriorityScore(a));
});

const activeJobs = computed(() => {
  return jobsWithApplications.value
    .filter((job) => {
      const isActive = ['assigned', 'in_progress'].includes(job.status);
      const isNotInAttention = !needsAttentionJobs.value.find(
        (attentionJob) => attentionJob.id === job.id
      );
      return isActive && isNotInAttention;
    })
    .sort(
      (a, b) =>
        new Date(b.updated_at || b.created_at) -
        new Date(a.updated_at || a.created_at)
    );
});

const openJobs = computed(() => {
  return jobsWithApplications.value
    .filter((job) => {
      const isOpen = job.status === 'open';
      const isNotInAttention = !needsAttentionJobs.value.find(
        (attentionJob) => attentionJob.id === job.id
      );
      return isOpen && isNotInAttention;
    })
    .sort((a, b) => {
      // Sort by application count first, then by date
      const appCountDiff = (b.applicant_count || 0) - (a.applicant_count || 0);
      if (appCountDiff !== 0) return appCountDiff;
      return new Date(b.created_at) - new Date(a.created_at);
    });
});

const completedJobs = computed(() => {
  return jobsWithApplications.value
    .filter((job) => {
      const isCompleted = ['finalized', 'cancelled'].includes(job.status);
      const isNotInAttention = !needsAttentionJobs.value.find(
        (attentionJob) => attentionJob.id === job.id
      );
      return isCompleted && isNotInAttention;
    })
    .sort(
      (a, b) =>
        new Date(b.updated_at || b.created_at) -
        new Date(a.updated_at || a.created_at)
    );
});

// Prioritized jobs for the main dashboard view
const prioritizedJobs = computed(() => {
  if (activeView.value === 'applications') {
    return jobsWithApplications.value.filter(
      (job) => (job.applicant_count || 0) > 0
    );
  }

  let filtered = [];

  // Apply view-specific filtering
  switch (activeView.value) {
    case 'active':
      filtered = [...needsAttentionJobs.value, ...activeJobs.value];
      break;
    case 'completed':
      filtered = [
        ...needsAttentionJobs.value.filter((job) => job.status === 'completed'),
        ...completedJobs.value,
      ];
      break;
    case 'all':
    default:
      filtered = [
        ...needsAttentionJobs.value,
        ...activeJobs.value,
        ...openJobs.value,
        ...completedJobs.value,
      ];
      break;
  }

  // Apply status filter if any specific statuses are selected
  if (selectedStatuses.value.length > 0) {
    filtered = filtered.filter((job) =>
      selectedStatuses.value.includes(job.status)
    );
  } else {
    // If no specific statuses are selected, exclude cancelled jobs by default
    filtered = filtered.filter((job) => job.status !== 'cancelled');
  }

  return filtered;
});

const filteredJobs = computed(() => {
  // Use prioritized jobs for the new dashboard layout
  return prioritizedJobs.value;
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

// Enhanced dashboard stats without attention indicator
const enhancedDashboardStats = computed(() => [
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

// Legacy dashboard stats for backward compatibility
const dashboardStats = computed(() => enhancedDashboardStats.value);

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

// Handle job action events from JobActionButton
const handleJobAction = async (action, jobId) => {
  console.log(
    `[ClientDashboard] Handling job action: ${action} for job ID: ${jobId}`
  );

  try {
    switch (action) {
      case 'review':
        await jobStore.markJobInReview(jobId);
        break;
      case 'finalize':
        await jobStore.finalizeJob(jobId);
        break;
      case 'cancel':
        if (confirm(t('dashboard.confirmCancelJob'))) {
          await jobStore.cancelJob(jobId);
        }
        break;
      default:
        console.warn(`[ClientDashboard] Unknown action: ${action}`);
        return;
    }

    // Refresh jobs after successful action
    await jobStore.fetchJobsByUser(props.userId);
    console.log(`[ClientDashboard] Job ${action} completed successfully`);
  } catch (error) {
    console.error(`[ClientDashboard] Error handling ${action} action:`, error);
    alert(`Error ${action}ing job: ${error.message}`);
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

    // Auto-focus on active jobs if they exist and no specific view is set
    if (!router.currentRoute.value.query.view) {
      // Check if there are jobs needing attention or active jobs
      const hasAttentionJobs = needsAttentionJobs.value.length > 0;
      const hasActiveJobs = activeJobs.value.length > 0;

      if (hasAttentionJobs || hasActiveJobs) {
        // Focus on active view to show jobs that need attention
        activeView.value = 'active';
      }
    } else {
      // Set view from URL query parameter
      activeView.value = router.currentRoute.value.query.view || 'all';
    }
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
