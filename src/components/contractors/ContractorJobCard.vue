<template>
  <BaseJobCard
    :job="job"
    :card-class="[
      'contractor-job-card group overflow-hidden',
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
      <!-- Show "My Job" indicator for contractor's own jobs -->
      <StatusBadge
        v-if="job.isMyJob"
        status="assigned"
        :label="$t('contractorDashboard.myJob')"
        class="m-2 mt-8"
      />
    </template>

    <template #quick-actions>
      <!-- No dropdown menu -->
    </template>

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
        <div
          v-if="!job.isMyJob"
          class="flex items-center whitespace-nowrap min-w-0"
        >
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
      <!-- Client Information for opportunities -->
      <div v-if="!job.isMyJob && job.client_name" class="mt-3">
        <div class="flex items-center space-x-2 text-sm text-gray-500">
          <div
            class="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center"
          >
            <User class="w-3 h-3 text-gray-500" />
          </div>
          <span>{{ job.client_name || $t('contractorDashboard.client') }}</span>
        </div>
      </div>
    </template>

    <template #actions>
      <!-- No action buttons -->
    </template>
  </BaseJobCard>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import BaseJobCard from '@/components/shared/BaseJobCard.vue';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical,
  Eye,
  Send,
  CheckCircle,
  Calendar,
  Users,
  User,
} from 'lucide-vue-next';
import JobImageCarousel from '@/components/jobs/JobImageCarousel.vue';
import JobLocationDisplay from '@/components/shared/JobLocationDisplay.vue';
import StatusBadge from '@/components/shared/StatusBadge.vue';
import { formatStandardDate } from '@/lib/timeUtils';

const { t } = useI18n();

const props = defineProps({
  job: {
    type: Object,
    required: true,
  },
  viewMode: {
    type: String,
    default: 'cards',
  },
});

const emit = defineEmits(['view-details', 'apply-job', 'mark-completed']);

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

/* Ensure dropdown trigger is visible on image */
.bg-card\/80 {
  background-color: hsla(var(--card), 0.8);
}
.hover\:bg-card:hover {
  background-color: hsl(var(--card));
}
</style>
