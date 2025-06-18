<template>
  <BaseJobCard
    :job="job"
    :card-class="[
      'client-job-card group', // Added group for hover effects
      job.status === 'completed' ? 'opacity-75' : '',
      viewMode === 'list'
        ? 'rounded-lg shadow-sm hover:shadow-md'
        : 'rounded-xl shadow-sm hover:shadow-md',
      'bg-transparent !bg-transparent', // Explicitly remove background color
    ]"
    :content-class="viewMode === 'list' ? 'px-3 py-2' : 'px-2 py-1.5'"
    @click="$emit('view-details', job)"
  >
    <template #image-header>
      <JobImageCarousel
        :images="job.photos || []"
        :alt-text="job.service_name || job.category_name || 'Service Request'"
        :height="viewMode === 'list' ? 'h-32' : 'h-40'"
        :show-navigation="false"
        :show-indicators="viewMode === 'cards'"
        :class="viewMode === 'list' ? 'rounded-t-lg' : 'rounded-t-lg'"
      />
    </template>

    <template #title-overlay>
      <div
        :class="[
          'bg-gradient-to-t from-black/70 via-black/50 to-transparent',
          'p-3 mx-0 -mb-2',
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
              <StatusPill
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
      <StatusPill
        v-if="job.status"
        :status="job.status"
        :label="getStatusLabel(job.status)"
      />
    </template>

    <template #quick-actions>
      <DropdownMenu>
        <DropdownMenuTrigger
          class="inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 bg-card/80 hover:bg-card text-white"
        >
          <MoreVertical class="w-4 h-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem @click.stop="$emit('view-details', job)">
            <Eye class="w-4 h-4 mr-2" />
            {{ $t('common.viewDetails') }}
          </DropdownMenuItem>
          <DropdownMenuItem
            v-if="job.status !== 'completed'"
            @click.stop="$emit('edit-job', job)"
          >
            <Edit class="w-4 h-4 mr-2" />
            {{ $t('common.edit') }}
          </DropdownMenuItem>
          <DropdownMenuItem
            v-if="applications.length > 0"
            @click.stop="$emit('view-applications', job)"
          >
            <Users class="w-4 h-4 mr-2" />
            {{ $t('dashboard.viewApplications') }}
          </DropdownMenuItem>
          <DropdownMenuSeparator
            v-if="job.status === 'in_progress'"
            class="my-0"
          />
          <DropdownMenuItem
            v-if="job.status === 'in_progress'"
            @click.stop="$emit('mark-completed', job)"
          >
            <CheckCircle class="w-4 h-4 mr-2" />
            {{ $t('dashboard.markCompleted') }}
          </DropdownMenuItem>
          <DropdownMenuSeparator class="my-0" />
          <DropdownMenuItem
            @click.stop="$emit('delete-job', job)"
            class="text-destructive focus:text-destructive"
          >
            <Trash2 class="w-4 h-4 mr-2" />
            {{ $t('common.delete') }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </template>

    <!-- Content below the image header starts here -->
    <!-- The p-4 on card-class provides overall padding. Specific margins (mt-*) are for inter-element spacing -->

    <template #description>
      <p
        :class="[
          'text-gray-600 dark:text-gray-300 mt-1',
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
          'flex items-center text-gray-500 dark:text-gray-400 mt-1 flex-wrap',
          viewMode === 'cards' ? 'space-x-2 text-xs' : 'space-x-3 text-sm',
        ]"
      >
        <JobLocationDisplay
          :location-text="job.location_text"
          class="min-w-0"
        />
        <div class="flex items-center space-x-1 whitespace-nowrap min-w-0">
          <Calendar :class="viewMode === 'cards' ? 'w-3 h-3' : 'w-4 h-4'" />
          <span>{{ formatStandardDate(job.created_at) }}</span>
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
      <div v-if="applications.length > 0" class="mt-1">
        <div class="flex items-center justify-between mb-2">
          <h4
            :class="[
              'font-semibold text-gray-700 dark:text-gray-200',
              viewMode === 'cards' ? 'text-xs' : 'text-sm',
            ]"
          >
            {{ applications.length }}
            {{
              applications.length === 1
                ? $t('dashboard.applicationCount.singular')
                : $t('dashboard.applicationCount.plural')
            }}
          </h4>
          <Button
            variant="link"
            size="sm"
            @click.stop="$emit('view-applications', job)"
            class="text-xs h-6 px-1 py-0 text-primary hover:underline"
          >
            {{ $t('dashboard.viewAll') }}
            <ChevronRight class="w-3 h-3 ml-1" />
          </Button>
        </div>

        <!-- Application Status Summary - More compact in list view -->
        <div
          :class="
            viewMode === 'list'
              ? 'flex items-center gap-1 mb-2 flex-wrap'
              : 'flex items-center gap-2 mb-3 flex-wrap'
          "
        >
          <StatusPill
            v-if="applicationStats.pending > 0"
            status="pending"
            :label="`${applicationStats.pending} ${$t('dashboard.pending')}`"
          />
          <StatusPill
            v-if="applicationStats.selected > 0"
            status="selected"
            :label="`${applicationStats.selected} ${$t('dashboard.selected')}`"
          />
          <StatusPill
            v-if="applicationStats.rejected > 0"
            status="rejected"
            :label="`${applicationStats.rejected} ${$t('dashboard.rejected')}`"
          />
        </div>

        <!-- Recent Applicants Preview - Show smaller avatars in grid view -->
        <div v-if="viewMode === 'cards'" class="flex -space-x-1 mb-2">
          <img
            v-for="applicant in applications.slice(0, 2)"
            :key="applicant.id"
            :src="
              applicant.contractor_profiles?.avatar_url ||
              '/images/contractor-default.svg'
            "
            :alt="applicant.contractor_profiles?.full_name || 'Contractor'"
            :title="applicant.contractor_profiles?.full_name || 'Contractor'"
            class="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 object-cover"
          />
          <div
            v-if="applications.length > 2"
            class="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400"
          >
            +{{ applications.length - 2 }}
          </div>
        </div>
      </div>

      <!-- No Applications State -->
      <div
        v-else
        :class="
          viewMode === 'list'
            ? 'text-sm text-gray-500 dark:text-gray-400 py-1 text-left mt-1'
            : 'text-sm text-gray-500 dark:text-gray-400 py-2 text-left mt-1'
        "
      >
        <Users class="w-5 h-5 mr-2 mb-1 text-gray-400 inline-block" />
        {{ $t('dashboard.noApplicationsYet') }}
      </div>
    </template>

    <template #actions>
      <div class="flex items-center justify-end">
        <div class="flex items-center gap-2">
          <Button
            v-if="job.status === 'open' && applications.length === 0"
            variant="outline"
            size="sm"
            @click.stop="$emit('edit-job', job)"
            class="h-8 px-3 text-xs"
          >
            <Edit class="w-3 h-3 mr-1.5" />
            {{ $t('common.edit') }}
          </Button>
          <Button
            v-else-if="applications.length > 0"
            size="sm"
            @click.stop="$emit('view-applications', job)"
            class="h-8 px-3 text-xs"
          >
            <Users class="w-3 h-3 mr-1.5" />
            {{ $t('dashboard.viewApplications') }} ({{ applications.length }})
          </Button>
          <!-- Fallback "View Details" button removed as the card itself is clickable -->
        </div>
      </div>
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical,
  Eye,
  Edit,
  Users,
  CheckCircle,
  Trash2,
  Calendar,
  ChevronRight,
  // MessageCircle, // Not used directly in template after changes
  // Briefcase, // Not used
} from 'lucide-vue-next';
import JobImageCarousel from '@/components/jobs/JobImageCarousel.vue';
import BulkMessageModal from './BulkMessageModal.vue';
import JobLocationDisplay from '@/components/shared/JobLocationDisplay.vue';
import StatusPill from '@/components/shared/StatusPill.vue';
import { formatStandardDate, formatStandardDateTime } from '@/lib/timeUtils';
// Card import is no longer needed as BaseJobCard uses it internally
// import { Card } from '@/components/ui/card';

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
  // viewMode is no longer used for styling the card itself as much
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
]);

const showBulkMessage = ref(false);

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

// openBulkMessage is not called from the template anymore, can be removed if not used elsewhere
// const openBulkMessage = () => {
//   showBulkMessage.value = true;
// };

const handleMessageSent = () => {
  showBulkMessage.value = false;
  // Could emit an event to refresh data or show success message
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
  text-overflow: ellipsis; /* Added for better truncation */
}

/* Ensure the carousel image takes the full width of the card header, breaking out of p-4 */
/* This is achieved by adding negative margins to the JobImageCarousel class prop */
/* .rounded-t-xl.-mx-4.-mt-4 for the carousel */

/* Hover effect is now primarily handled by BaseJobCard or specific overrides if needed */
/* .client-job-card:hover { ... } */

/* Ensure dropdown trigger is visible on image */
/* These styles might need to be adjusted if they conflict with BaseJobCard or applied more locally if still needed */
.bg-card\/80 {
  /* More generic selector if this style is for the trigger */
  background-color: hsla(var(--card), 0.8);
}
.hover\:bg-card:hover {
  /* Ensure specificity if needed */
  /* More generic selector */
  background-color: hsl(var(--card));
}
</style>
