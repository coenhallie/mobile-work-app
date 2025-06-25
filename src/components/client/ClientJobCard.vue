<template>
  <BaseJobCard
    :job="job"
    :card-class="[
      'client-job-card group overflow-hidden transition-all duration-200',
      job.status === 'completed' ? 'opacity-75' : '',
      viewMode === 'list'
        ? 'rounded-lg shadow-sm hover:shadow-md'
        : 'rounded-xl shadow-sm hover:shadow-md',
    ]"
    :content-class="viewMode === 'list' ? 'px-4 pb-4 pt-2' : 'px-4 pb-4 pt-2'"
    @click="$emit('view-details', job)"
  >
    <template #image-header>
      <JobImageCarousel
        :images="job.photos || []"
        :alt-text="job.service_name || job.category_name || 'Service Request'"
        :height="viewMode === 'list' ? 'h-32' : 'h-40'"
        :show-navigation="false"
        :show-indicators="(job.photos || []).length > 1"
        class="rounded-t-lg -mx-4 -mt-4"
      />
    </template>

    <template #title-overlay>
      <div
        :class="[
          'bg-gradient-to-t from-black/70 via-black/50 to-transparent',
          'p-3 mx-0',
        ]"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0 pr-2">
            <div class="flex items-center space-x-2">
              <h3
                :class="[
                  'font-semibold text-white line-clamp-1 group-hover:text-blue-100 transition-colors',
                  viewMode === 'cards' ? 'text-base' : 'text-lg',
                ]"
              >
                {{ job.service_name || job.category_name || 'Service Request' }}
              </h3>
              <StatusBadge
                v-if="job.is_urgent || job.isUrgent"
                status="urgent"
                :label="$t('common.urgent')"
                class="text-xs"
              />
            </div>
            <div
              v-if="job.deadline || job.preferred_date"
              class="text-xs text-gray-300 mt-1"
            >
              {{ $t('common.deadline') }}:
              {{ formatStandardDate(job.deadline || job.preferred_date) }}
            </div>
          </div>
          <div v-if="job.budget_min && job.budget_max" class="text-right ml-2">
            <div
              :class="[
                'text-green-300 font-medium',
                viewMode === 'cards' ? 'text-xs' : 'text-sm',
              ]"
            >
              S/{{ job.budget_min }}-{{ job.budget_max }}
            </div>
            <div class="text-xs text-gray-300">{{ $t('common.budget') }}</div>
          </div>
        </div>
      </div>
    </template>

    <template #status-overlay>
      <StatusBadge
        v-if="job.status"
        type="job"
        :status="job.status"
        :label="getStatusLabel(job.status)"
        class="m-2"
      />
    </template>

    <template #quick-actions>
      <!-- No dropdown menu - simplified interface -->
    </template>

    <!-- Content below the image header starts here -->
    <!-- The p-4 on card-class provides overall padding. Specific margins (mt-*) are for inter-element spacing -->

    <template #description>
      <p
        :class="[
          'text-gray-600 dark:text-gray-300 mt-3',
          viewMode === 'cards'
            ? 'text-xs line-clamp-2'
            : 'text-sm line-clamp-2',
        ]"
      >
        {{ job.description }}
      </p>
    </template>

    <template #meta-info>
      <div
        :class="[
          'flex items-center text-gray-500 dark:text-gray-400 mt-0 flex-wrap',
          viewMode === 'cards' ? 'gap-3 text-xs' : 'gap-4 text-sm',
        ]"
      >
        <JobLocationDisplay
          :location-text="job.location_text"
          class="min-w-0"
        />
        <div class="flex items-center whitespace-nowrap min-w-0">
          <Calendar
            :class="[viewMode === 'cards' ? 'w-4 h-4' : 'w-4 h-4', 'mr-1.5']"
          />
          <span>{{ formatStandardDate(job.created_at) }}</span>
        </div>
        <div class="flex items-center whitespace-nowrap min-w-0">
          <Users
            :class="[viewMode === 'cards' ? 'w-4 h-4' : 'w-4 h-4', 'mr-1.5']"
          />
          <span class="font-medium"
            >{{ job.applicant_count || 0 }}
            {{
              (job.applicant_count || 0) === 1
                ? $t('dashboard.applicationCount.singular')
                : $t('dashboard.applicationCount.plural')
            }}</span
          >
        </div>
        <span
          v-if="job.budget_min && job.budget_max"
          :class="[
            'text-green-600 dark:text-green-400 font-semibold whitespace-nowrap',
            viewMode === 'cards' ? 'text-xs' : 'text-sm',
          ]"
        >
          S/{{ job.budget_min }}-{{ job.budget_max }}
        </span>
      </div>
    </template>

    <template #content-extra>
      <!-- This section is client-specific, styled to fit -->
      <!-- Applications Summary -->
      <div v-if="(job.applicant_count || 0) > 0" class="mt-3">
        <!-- View Applications Button -->
        <div class="mb-2" @click.stop>
          <button
            @click="toggleApplicationsView"
            class="text-xs text-primary hover:underline flex items-center p-0 m-0 bg-transparent border-none cursor-pointer"
          >
            {{
              showApplications
                ? $t('dashboard.hideApplications')
                : $t('dashboard.viewApplications')
            }}
            ({{ job.applicant_count || 0 }})
            <ChevronDown
              :class="[
                'w-3 h-3 ml-1 transition-transform duration-200',
                showApplications ? 'rotate-180' : '',
              ]"
            />
          </button>
        </div>

        <!-- Expandable Applications Section -->
        <Transition
          name="slide-down"
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 max-h-0 overflow-hidden"
          enter-to-class="opacity-100 max-h-96 overflow-hidden"
          leave-active-class="transition-all duration-300 ease-in"
          leave-from-class="opacity-100 max-h-96 overflow-hidden"
          leave-to-class="opacity-0 max-h-0 overflow-hidden"
        >
          <div v-if="showApplications" class="space-y-2 mb-3" @click.stop>
            <!-- Show up to 3 compact applicant cards -->
            <div v-if="applications.length > 0" class="space-y-2">
              <CompactApplicantCard
                v-for="applicant in applications.slice(0, 3)"
                :key="applicant.id"
                :applicant="applicant"
                @view-details="$emit('view-applicant-details', applicant)"
                @select-contractor="$emit('select-contractor', applicant)"
              />
            </div>

            <!-- Show "View All" button if there are more than 3 applications -->
            <div
              v-if="applications.length > 3"
              class="flex items-center justify-center pt-2"
            >
              <Button
                variant="outline"
                size="sm"
                @click.stop="$emit('view-applications', job)"
                class="text-xs h-7 px-3"
              >
                {{ $t('dashboard.viewAll') }} {{ applications.length }}
                {{ $t('dashboard.applicationCount.plural') }}
                <ChevronRight class="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        </Transition>
      </div>
    </template>

    <template #actions>
      <!-- No action buttons -->
    </template>

    <!-- Bulk Message Modal (remains unchanged) -->
    <BulkMessageModal
      v-if="showBulkMessage"
      :job="job"
      :applications="applications"
      @close="showBulkMessage = false"
      @sent="handleMessageSent"
    />
  </BaseJobCard>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseJobCard from '@/components/shared/BaseJobCard.vue';
import { Button } from '@/components/ui/button';
import {
  Eye,
  Edit,
  Users,
  Calendar,
  ChevronRight,
  ChevronDown,
} from 'lucide-vue-next';
import JobImageCarousel from '@/components/jobs/JobImageCarousel.vue';
import BulkMessageModal from './BulkMessageModal.vue';
import JobLocationDisplay from '@/components/shared/JobLocationDisplay.vue';
import StatusBadge from '@/components/shared/StatusBadge.vue';
import CompactApplicantCard from './CompactApplicantCard.vue';
import JobActionButton from '@/components/jobs/JobActionButton.vue';
import { formatStandardDate, formatStandardDateTime } from '@/lib/timeUtils';

const { t } = useI18n();

const props = defineProps({
  job: {
    type: Object,
    required: true,
  },
  applications: {
    type: Array,
    default: () => [],
  },
  viewMode: {
    type: String,
    default: 'cards',
  },
});

const emit = defineEmits([
  'view-details',
  'edit-job',
  'view-applications',
  'mark-completed',
  'delete-job',
  'view-applicant-details',
  'select-contractor',
  'job-action',
]);

const showBulkMessage = ref(false);
const showApplications = ref(false);

// Simplified urgency level for enhanced JobActionButton
const getSimpleUrgencyLevel = () => {
  if (props.job.is_urgent || props.job.isUrgent) return 'urgent';
  if (props.job.status === 'completed') {
    return 'high';
  }
  if ((props.job.applicant_count || 0) > 0 && props.job.status === 'open') {
    return 'high';
  }
  if (props.job.status === 'assigned') return 'normal';
  return 'normal';
};

const handleAction = (action) => {
  // Emit specific events for actions that are handled by parent components
  if (action === 'viewApplications') {
    emit('view-applications', props.job);
  } else if (action === 'edit') {
    emit('edit-job', props.job);
  } else {
    emit('job-action', action, props.job.id);
  }
};

// Computed properties
const applicationStats = computed(() => {
  const stats = {
    pending: 0,
    selected: 0,
    rejected: 0,
  };

  props.applications.forEach((app) => {
    if (app.status === 'selected') stats.selected++;
    else if (app.status === 'rejected') stats.rejected++;
    else stats.pending++;
  });

  return stats;
});

const handleMessageSent = () => {
  showBulkMessage.value = false;
  // Could emit an event to refresh data or show success message
};

const toggleApplicationsView = () => {
  showApplications.value = !showApplications.value;
};

// Method to get translated status labels
const getStatusLabel = (status) => {
  const statusMap = {
    open: t('jobStatus.open'),
    in_progress: t('jobStatus.inProgress'),
    completed: t('jobStatus.completed'),
    cancelled: t('jobStatus.cancelled'),
    assigned: t('jobStatus.assigned'),
  };
  return statusMap[status] || status || t('jobStatus.unknown');
};
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Ensure the carousel image takes the full width of the card header, breaking out of p-4 */
/* This is achieved by adding negative margins to the JobImageCarousel class prop */
/* .rounded-t-xl.-mx-4.-mt-4 for the carousel */

/* Hover effect is now primarily handled by BaseJobCard or specific overrides if needed */
/* .client-job-card:hover { ... } */

/* Simplified card styles without dropdown menu */
</style>
