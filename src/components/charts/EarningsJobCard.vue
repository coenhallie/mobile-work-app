<template>
  <BaseJobCard
    :job="job"
    :card-class="[
      'earnings-job-card',
      'p-4', // Retain specific padding
    ]"
    @click="$emit('view-details', job)"
  >
    <template #title>
      <div class="flex items-start justify-between">
        <h4 class="text-lg font-medium text-foreground">
          {{ job.category_name }}
        </h4>
        <!-- Earnings Amount -->
        <div class="text-right ml-4">
          <div class="text-2xl font-bold text-green-600">
            {{ $t('common.currency')
            }}{{
              (job.final_payment_amount || job.budget_max || 0).toLocaleString()
            }}
          </div>
          <div class="text-xs text-muted-foreground">
            {{ $t('dashboard.earned') }}
          </div>
        </div>
      </div>
    </template>

    <template #description>
      <p class="text-sm text-muted-foreground line-clamp-2">
        {{ job.description }}
      </p>
    </template>

    <template #meta-info>
      <div class="flex items-center gap-4 text-xs text-muted-foreground">
        <JobLocationDisplay
          :location-text="job.location_text"
          class="text-xs"
        />
        <span> 📅 {{ formatDate(job.completed_at || job.updated_at) }} </span>
      </div>
    </template>

    <template #actions>
      <!-- Job Details -->
      <div class="flex items-center gap-4 text-xs">
        <span class="px-2 py-1 bg-green-100 text-green-800 rounded-full">
          {{ $t('jobs.completed') }}
        </span>
        <span v-if="job.client_name" class="text-muted-foreground">
          {{ $t('dashboard.client') }}: {{ job.client_name }}
        </span>
      </div>
    </template>
  </BaseJobCard>
</template>

<script setup>
import { useI18n } from '../../composables/useI18n';
import { formatStandardDate } from '@/lib/timeUtils';
import JobLocationDisplay from '@/components/shared/JobLocationDisplay.vue';
import BaseJobCard from '@/components/shared/BaseJobCard.vue';

const { t } = useI18n();

defineProps({
  job: {
    type: Object,
    required: true,
  },
});

defineEmits(['view-details']);

const formatDate = (dateString) => {
  if (!dateString) return t('common.notAvailable');
  // Using the centralized function
  return formatStandardDate(dateString, 'en-US'); // Assuming 'en-US' or make it dynamic
};
</script>

<style scoped>
.earnings-job-card {
  transition: all 0.2s ease;
}

/* Hover effect now handled by BaseJobCard or specific overrides if needed */
/* .earnings-job-card:hover {
  transform: translateY(-1px);
} */

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Dark mode adjustments */
.dark .earnings-job-card {
  border-color: rgba(255, 255, 255, 0.1);
}

.dark .earnings-job-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>
