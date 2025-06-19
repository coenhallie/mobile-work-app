<template>
  <div class="applications-list">
    <!-- Header removed as it became empty -->
    <!-- Filters -->
    <div class="flex flex-wrap gap-2 mb-4 pt-1">
      <!-- Added pt-1 for a small top padding -->
      <button
        v-for="status in statusFilters"
        :key="status.value"
        @click="
          selectedStatus =
            selectedStatus === status.value ? 'all' : status.value
        "
        :class="[
          'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
          selectedStatus === status.value
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
        ]"
      >
        {{ status.label }} ({{ getStatusCount(status.value) }})
      </button>
    </div>

    <!-- Applications Grid -->
    <div v-if="filteredApplications.length > 0" class="space-y-3">
      <div
        v-for="application in filteredApplications"
        :key="application.id"
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-lg transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600"
      >
        <div class="flex gap-4">
          <!-- Contractor Avatar -->
          <div class="flex-shrink-0">
            <div class="relative">
              <img
                v-if="getAvatarUrl(application.contractor)"
                :src="getAvatarUrl(application.contractor)"
                :alt="application.contractor.fullName"
                class="w-16 h-16 rounded-full object-cover border-2 border-gray-100 dark:border-gray-700"
                @error="(e) => handleImageError(e, application.contractor)"
              />
              <!-- Fallback Avatar with Initial -->
              <div
                v-else
                class="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl font-semibold text-gray-500 dark:text-gray-400 border-2 border-gray-100 dark:border-gray-700"
              >
                {{ getContractorInitial(application.contractor) }}
              </div>
              <!-- Online status indicator -->
              <div
                class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"
              ></div>
            </div>
          </div>

          <!-- Main Content Column -->
          <div class="flex-1 min-w-0">
            <!-- Row 1: Name, Rating, and Status Badge -->
            <div class="flex items-start justify-between mb-1">
              <div class="flex-1 min-w-0">
                <h4
                  class="font-semibold text-gray-900 dark:text-white text-lg truncate inline mr-2"
                >
                  {{ application.contractor.fullName }}
                </h4>
                <div
                  v-if="application.contractor.rating"
                  class="inline-flex items-center align-middle"
                >
                  <Star
                    class="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 mr-0.5"
                  />
                  <span
                    class="text-xs font-medium text-yellow-700 dark:text-yellow-300 pt-px"
                  >
                    {{ application.contractor.rating.toFixed(1) }}
                  </span>
                </div>
              </div>
              <div class="flex-shrink-0 ml-2">
                <ApplicationStatusBadge :status="application.status" />
              </div>
            </div>

            <!-- Row 2: Job Title -->
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-0.5 mb-2">
              Applied to:
              <span class="font-medium text-gray-800 dark:text-gray-200">{{
                application.jobTitle
              }}</span>
            </div>

            <!-- Row 3: Experience & Applied Time -->
            <div
              class="flex flex-wrap items-center text-xs text-gray-500 dark:text-gray-400 mb-3"
            >
              <span v-if="application.contractor.experienceLevel">
                {{ application.contractor.experienceLevel }}
              </span>
              <span
                v-if="
                  application.contractor.experienceLevel &&
                  application.appliedAt
                "
                class="mx-1.5"
                >&bull;</span
              >
              <span>
                Applied {{ formatRelativeTime(application.appliedAt) }}
              </span>
            </div>

            <!-- Application Message -->
            <div
              v-if="application.message"
              class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-3"
            >
              <p class="text-sm text-gray-700 dark:text-gray-300 italic">
                "{{ application.message }}"
              </p>
            </div>

            <!-- Skills -->
            <div v-if="application.contractor.skills?.length" class="mb-4">
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="skill in application.contractor.skills.slice(0, 4)"
                  :key="skill"
                  class="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full"
                >
                  {{ skill }}
                </span>
                <span
                  v-if="application.contractor.skills.length > 4"
                  class="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full"
                >
                  +{{ application.contractor.skills.length - 4 }} more
                </span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-wrap gap-2">
              <Button
                v-if="application.status === 'pending'"
                size="sm"
                @click="selectApplicant(application)"
                class="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white text-xs"
              >
                <Check class="w-3 h-3 mr-1.5" />
                {{ $t('dashboard.actions.select') }}
              </Button>

              <Button
                v-if="application.status === 'pending'"
                size="sm"
                variant="outline"
                @click="rejectApplicant(application)"
                class="flex-shrink-0 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 text-xs"
              >
                <X class="w-3 h-3 mr-1.5" />
                {{ $t('dashboard.actions.reject') }}
              </Button>

              <Button
                size="sm"
                variant="outline"
                @click="viewContractorProfile(application.contractor.userId)"
                class="flex-shrink-0 text-xs dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                <User class="w-3 h-3 mr-1.5" />
                {{ $t('dashboard.actions.profile') }}
              </Button>

              <Button
                size="sm"
                variant="outline"
                @click="viewJobDetails(application.jobId)"
                class="flex-shrink-0 text-xs dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                <Eye class="w-3 h-3 mr-1.5" />
                {{ $t('dashboard.actions.job') }}
              </Button>

              <Button
                size="sm"
                variant="outline"
                @click="sendMessage(application)"
                class="flex-shrink-0 text-xs dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                <MessageCircle class="w-3 h-3 mr-1.5" />
                {{ $t('dashboard.actions.message') }}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <div class="text-gray-400 dark:text-gray-500 mb-2">
        <Users class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p class="text-lg font-medium text-gray-600 dark:text-gray-400">
          {{ $t('dashboard.noApplicationsFound') }}
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-500">
          {{ $t('dashboard.noApplicationsFoundDescription') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Button } from '@/components/ui/button';
import ApplicationStatusBadge from './ApplicationStatusBadge.vue';
import {
  Star,
  User,
  Eye,
  Check,
  X,
  MessageCircle,
  Users,
} from 'lucide-vue-next';

const props = defineProps({
  applications: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits([
  'select-applicant',
  'reject-applicant',
  'send-message',
]);

const router = useRouter();
const { t } = useI18n();

// State
const selectedStatus = ref('all');

// Status filters
const statusFilters = computed(() => [
  { value: 'all', label: t('dashboard.allStatuses') },
  { value: 'pending', label: t('applicationStatus.pending') },
  { value: 'selected', label: t('applicationStatus.selected') },
  { value: 'rejected', label: t('applicationStatus.rejected') },
]);

// Computed
const filteredApplications = computed(() => {
  if (selectedStatus.value === 'all') {
    return props.applications;
  }
  return props.applications.filter(
    (app) => app.status === selectedStatus.value
  );
});

// Methods
const getStatusCount = (status) => {
  if (status === 'all') return props.applications.length;
  return props.applications.filter((app) => app.status === status).length;
};

const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

  if (diffInHours < 1) return t('time.justNow');
  if (diffInHours < 24) return t('time.hoursAgo', { hours: diffInHours });

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return t('time.daysAgo', { days: diffInDays });

  return date.toLocaleDateString();
};

const getAvatarUrl = (contractor) => {
  // Handle Proxy objects and extract actual data
  const contractorData = contractor?._value || contractor;

  // Use profileImageUrl like ContractorCard does
  return contractorData?.profileImageUrl || null;
};

const handleImageError = (event, contractor) => {
  console.log(
    'Avatar load failed, using default for:',
    contractor?.fullName || 'Unknown contractor'
  );
  event.target.src = '/images/contractor-default.svg';
};

const getContractorInitial = (contractor) => {
  const contractorData = contractor?._value || contractor;
  const name = contractorData?.fullName || contractorData?.name || '';
  return name.charAt(0).toUpperCase() || '?';
};

const viewContractorProfile = (userId) => {
  router.push(`/contractors/${userId}`);
};

const viewJobDetails = (jobId) => {
  router.push(`/job/${jobId}`);
};

const selectApplicant = (application) => {
  emit('select-applicant', application);
};

const rejectApplicant = (application) => {
  emit('reject-applicant', application);
};

const sendMessage = (application) => {
  emit('send-message', application);
};
</script>

<style scoped>
.applications-list {
  /* Component styles */
}
</style>
