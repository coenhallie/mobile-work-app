<template>
  <div class="client-dashboard bg-white dark:bg-gray-900 min-h-screen">
    <!-- Clean Header -->
    <div class="px-3 pt-4 pb-3">
      <div class="mb-6">
        <button
          @click="$router.push('/services')"
          class="w-full bg-black dark:bg-white text-white dark:text-black px-6 py-4 rounded-lg font-medium text-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          <Plus class="w-5 h-5 inline mr-2" />
          Post Job
        </button>
      </div>

      <!-- Minimalist Stats -->
      <div class="grid grid-cols-2 gap-3 mb-6">
        <button
          @click="setActiveView('all')"
          class="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors relative"
          :class="{
            'bg-gray-100 dark:bg-gray-700 ring-2 ring-blue-500':
              activeView === 'all',
          }"
        >
          <div class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ totalJobsCount }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Total</div>
        </button>

        <button
          @click="setActiveView('active')"
          class="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors relative"
          :class="{
            'bg-gray-100 dark:bg-gray-700 ring-2 ring-green-500':
              activeView === 'active',
          }"
        >
          <div class="text-2xl font-bold text-green-600">
            {{ activeJobsCount }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Active
          </div>
        </button>

        <button
          @click="setActiveView('applications')"
          class="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors relative"
          :class="{
            'bg-gray-100 dark:bg-gray-700 ring-2 ring-blue-500':
              activeView === 'applications',
          }"
        >
          <div class="text-2xl font-bold text-blue-600">
            {{ totalApplicationsCount }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Applications
          </div>
        </button>

        <button
          @click="setActiveView('completed')"
          class="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors relative"
          :class="{
            'bg-gray-100 dark:bg-gray-700 ring-2 ring-gray-500':
              activeView === 'completed',
          }"
        >
          <div class="text-2xl font-bold text-gray-600">
            {{ completedJobsCount }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Done</div>
        </button>
      </div>
    </div>

    <!-- Clean Actions Bar -->
    <div class="px-3 pb-3">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-normal text-gray-900 dark:text-white">
          {{ getViewTitle() }}
        </h2>
        <div class="flex items-center gap-2">
          <!-- Simple View Toggle -->
          <div class="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              @click="viewMode = 'cards'"
              :class="[
                'px-3 py-1 rounded text-sm transition-colors',
                viewMode === 'cards'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400',
              ]"
            >
              <Grid3X3 class="w-4 h-4" />
            </button>
            <button
              @click="viewMode = 'list'"
              :class="[
                'px-3 py-1 rounded text-sm transition-colors',
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400',
              ]"
            >
              <List class="w-4 h-4" />
            </button>
          </div>

          <!-- Simple Filter -->
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                class="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <Filter class="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="sortBy = 'date'">
                {{ $t('dashboard.sortByDate') }}
              </DropdownMenuItem>
              <DropdownMenuItem @click="sortBy = 'applications'">
                {{ $t('dashboard.sortByApplications') }}
              </DropdownMenuItem>
              <DropdownMenuItem @click="sortBy = 'status'">
                {{ $t('dashboard.sortByStatus') }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="px-3">
      <Transition name="fade" mode="out-in">
        <div :key="activeView">
          <!-- Loading State -->
          <div v-if="isLoading" class="space-y-3">
            <div v-for="i in 3" :key="i" class="animate-pulse">
              <div class="bg-gray-100 dark:bg-gray-800 h-20 rounded-lg"></div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else-if="filteredJobs.length === 0" class="text-center py-16">
            <div
              class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Sparkles class="w-8 h-8 text-gray-400" />
            </div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {{ getEmptyStateTitle() }}
            </h3>
            <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              {{ getEmptyStateDescription() }}
            </p>
            <button
              @click="$router.push('/services')"
              class="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              <Plus class="w-4 h-4 inline mr-1" />
              {{ $t('dashboard.postFirstJob') }}
            </button>
          </div>

          <!-- Jobs List -->
          <div v-else>
            <!-- Grid View (Cards) -->
            <div v-if="viewMode === 'cards'" class="grid grid-cols-2 gap-2">
              <div
                v-for="job in filteredJobs"
                :key="job.id"
                class="border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <ClientJobCard
                  :job="job"
                  :view-mode="viewMode"
                  :applications="jobApplicationsData[job.id] || []"
                  @view-details="viewJobDetails"
                  @edit-job="editJob"
                  @view-applications="viewApplications"
                  @mark-completed="markJobCompleted"
                  @delete-job="deleteJob"
                  class="border-0 p-0 bg-transparent"
                />
              </div>
            </div>

            <!-- List View -->
            <div v-else class="space-y-3">
              <div
                v-for="job in filteredJobs"
                :key="job.id"
                class="border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <ClientJobCard
                  :job="job"
                  :view-mode="viewMode"
                  :applications="jobApplicationsData[job.id] || []"
                  @view-details="viewJobDetails"
                  @edit-job="editJob"
                  @view-applications="viewApplications"
                  @mark-completed="markJobCompleted"
                  @delete-job="deleteJob"
                  class="border-0 p-0 bg-transparent"
                />
              </div>
            </div>

            <!-- Load More -->
            <div v-if="hasMoreJobs" class="text-center pt-6">
              <button
                @click="loadMoreJobs"
                :disabled="isLoadingMore"
                class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium"
              >
                <div
                  v-if="isLoadingMore"
                  class="animate-spin w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full inline-block"
                ></div>
                {{
                  isLoadingMore ? $t('common.loading') : $t('common.loadMore')
                }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Recent Activity -->
    <div v-if="recentActivity.length > 0" class="px-3 pt-6 pb-4">
      <h3 class="text-lg font-normal text-gray-900 dark:text-white mb-4">
        {{ $t('dashboard.recentActivity') }}
      </h3>
      <div class="space-y-3">
        <div
          v-for="activity in recentActivity.slice(0, 5)"
          :key="activity.id"
          class="flex items-center gap-3 text-sm py-2"
        >
          <div class="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0"></div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">
            {{ formatActivityTime(activity.created_at) }}
          </span>
          <span class="text-gray-900 dark:text-white">
            {{ activity.description }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Sparkles,
  Activity,
  Users,
  CheckCircle,
  Grid3X3,
  List,
  Filter,
} from 'lucide-vue-next';
import ClientJobCard from './ClientJobCard.vue';
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

// Props
const props = defineProps({
  userId: {
    type: String,
    required: true,
  },
});

// Computed properties
const jobs = computed(() => jobStore.userJobs || []);
const jobApplicationsData = computed(
  () => jobApplicationsStore.applicationsByJob || {}
);

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
  Object.values(jobApplicationsData.value).reduce(
    (total, apps) => total + apps.length,
    0
  )
);

const filteredJobs = computed(() => {
  let filtered = [...jobs.value];

  // Filter by active view
  switch (activeView.value) {
    case 'active':
      filtered = filtered.filter((job) =>
        ['open', 'in_progress'].includes(job.status)
      );
      break;
    case 'completed':
      filtered = filtered.filter((job) => job.status === 'completed');
      break;
    case 'applications':
      filtered = filtered.filter(
        (job) => (jobApplicationsData.value[job.id]?.length || 0) > 0
      );
      break;
    // 'all' shows everything
  }

  // Sort jobs
  switch (sortBy.value) {
    case 'date':
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
    case 'applications':
      filtered.sort(
        (a, b) =>
          (jobApplicationsData.value[b.id]?.length || 0) -
          (jobApplicationsData.value[a.id]?.length || 0)
      );
      break;
    case 'status':
      filtered.sort((a, b) => a.status.localeCompare(b.status));
      break;
  }

  return filtered;
});

// Methods
const setActiveView = (view) => {
  activeView.value = view;
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
  isLoading.value = true;
  try {
    await jobStore.fetchJobsByUser(props.userId);
  } finally {
    isLoading.value = false;
  }
});

// Watch for view changes to update URL
watch(activeView, (newView) => {
  router.replace({
    query: { ...router.currentRoute.value.query, view: newView },
  });
});
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
