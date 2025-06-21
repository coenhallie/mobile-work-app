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
    <div
      v-if="filteredApplications.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <article
        v-for="application in filteredApplications"
        :key="application.id"
        class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-sm hover:border-gray-200 dark:hover:border-gray-700 hover:transform hover:-translate-y-0.5"
        @click="viewContractorProfile(application.contractor.userId)"
        role="button"
        :aria-label="`View ${application.contractor.fullName}'s application`"
        tabindex="0"
      >
        <!-- Header Section -->
        <div class="flex items-start space-x-4 p-4">
          <!-- Profile Image -->
          <div class="relative">
            <img
              v-if="getAvatarUrl(application.contractor)"
              :src="getAvatarUrl(application.contractor)"
              :alt="`${application.contractor.fullName}'s profile picture`"
              class="w-14 h-14 rounded-full object-cover border border-gray-200 dark:border-gray-700 shrink-0"
              loading="lazy"
              @error="(e) => handleImageError(e, application.contractor)"
            />
            <!-- Fallback Avatar -->
            <div
              v-else
              class="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 shrink-0"
            >
              {{ getContractorInitial(application.contractor) }}
            </div>
            <!-- Online status indicator -->
            <div
              class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"
            ></div>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <h3
              class="text-lg font-semibold text-gray-900 dark:text-white mb-0.5 leading-tight truncate"
            >
              {{ application.contractor.fullName }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
              Applied to: {{ application.jobTitle }}
            </p>
          </div>

          <!-- Status Badge -->
          <div class="shrink-0">
            <ApplicationStatusBadge :status="application.status" />
          </div>
        </div>

        <!-- Card Content -->
        <div class="p-4">
          <!-- Rating and Applied Time -->
          <div class="flex items-center justify-between mb-2">
            <div
              class="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400"
            >
              <div
                v-if="application.contractor.rating"
                class="flex items-center space-x-1"
              >
                <span class="text-yellow-400">★</span>
                <span>{{ application.contractor.rating.toFixed(1) }}</span>
              </div>
              <div class="flex items-center space-x-1">
                <span>📍</span>
                <span>{{
                  application.contractor.location || 'Location not specified'
                }}</span>
              </div>
            </div>
          </div>

          <!-- Experience and Applied Time -->
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-2">
              <div class="flex items-center space-x-1">
                <div class="w-2 h-2 rounded-full bg-green-500"></div>
                <span
                  class="text-xs font-medium text-green-600 dark:text-green-400"
                >
                  {{
                    application.contractor.experienceLevel ||
                    'Experience not specified'
                  }}
                </span>
              </div>
            </div>
            <span class="text-xs text-gray-500 dark:text-gray-400">
              Applied {{ formatRelativeTime(application.appliedAt) }}
            </span>
          </div>

          <!-- Application Message -->
          <p
            v-if="application.message"
            class="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2 leading-relaxed italic"
          >
            "{{ application.message }}"
          </p>

          <!-- Skills -->
          <div class="flex flex-wrap gap-1.5 mb-4">
            <span
              v-for="skill in (application.contractor.skills || []).slice(0, 3)"
              :key="skill"
              class="px-2.5 py-1 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-lg font-medium"
            >
              {{ skill }}
            </span>
            <span
              v-if="(application.contractor.skills || []).length > 3"
              class="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-lg font-medium"
            >
              +{{ (application.contractor.skills || []).length - 3 }}
            </span>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-2">
            <Button
              v-if="application.status === 'pending'"
              size="sm"
              @click.stop="selectApplicant(application)"
              class="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs"
            >
              <Check class="w-3 h-3 mr-1.5" />
              {{ $t('dashboard.actions.select') }}
            </Button>

            <Button
              v-if="application.status === 'pending'"
              size="sm"
              variant="outline"
              @click.stop="rejectApplicant(application)"
              class="flex-1 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 text-xs"
            >
              <X class="w-3 h-3 mr-1.5" />
              {{ $t('dashboard.actions.reject') }}
            </Button>
          </div>

          <!-- Secondary Action Buttons -->
          <div class="flex flex-wrap gap-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              @click.stop="viewContractorProfile(application.contractor.userId)"
              class="flex-1 text-xs dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <User class="w-3 h-3 mr-1.5" />
              {{ $t('dashboard.actions.profile') }}
            </Button>

            <Button
              size="sm"
              variant="outline"
              @click.stop="viewJobDetails(application.jobId)"
              class="flex-1 text-xs dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <Eye class="w-3 h-3 mr-1.5" />
              {{ $t('dashboard.actions.job') }}
            </Button>

            <Button
              size="sm"
              variant="outline"
              @click.stop="sendMessage(application)"
              class="flex-1 text-xs dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <MessageCircle class="w-3 h-3 mr-1.5" />
              {{ $t('dashboard.actions.message') }}
            </Button>
          </div>
        </div>
      </article>
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

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Ensure smooth transitions for hover effects */
article {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Enhanced hover effect for the entire card */
article:hover {
  transform: translateY(-2px);
  box-shadow:
    0 10px 25px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Ensure backdrop blur works properly */
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
</style>
