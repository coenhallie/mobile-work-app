<template>
  <BaseJobCard
    :job="job"
    :card-class="[
      'onboarding-job-card group', // Added group for hover effect
      'bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200',
    ]"
    @click="$emit('click')"
  >
    <template #image-header>
      <div
        class="h-48 bg-gradient-to-br from-blue-500 to-blue-600 rounded-t-xl -mx-4 -mt-4"
      ></div>
    </template>

    <template #title-overlay>
      <div
        class="p-3 bg-gradient-to-t from-black/70 via-black/50 to-transparent -mx-4"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-2">
              <h3
                class="font-semibold text-white group-hover:text-blue-100 transition-colors line-clamp-1"
              >
                {{ job.title }}
              </h3>
              <StatusPill v-if="job.isUrgent" status="urgent" label="Urgent" />
            </div>
          </div>
          <!-- Budget -->
          <div class="text-right ml-4">
            <div class="font-semibold text-green-400">{{ job.budget }}</div>
            <div class="text-xs text-gray-300">Budget</div>
          </div>
        </div>
      </div>
    </template>

    <template #meta-info>
      <div class="flex items-center space-x-3 text-sm text-gray-500">
        <JobLocationDisplay :location-text="job.location" />
        <div class="flex items-center space-x-1">
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{{ formatTimeAgo(job.postedAt) }}</span>
        </div>
      </div>
    </template>

    <template #description>
      <p class="text-gray-600 text-sm line-clamp-2">
        {{ job.description }}
      </p>
    </template>

    <template #actions>
      <div class="flex items-center justify-between">
        <!-- Client Info -->
        <div class="flex items-center space-x-2 text-sm text-gray-500">
          <div
            class="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center"
          >
            <svg
              class="w-3 h-3 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <span>{{ job.clientName }}</span>
        </div>

        <!-- Apply Button -->
        <button
          @click.stop="$emit('apply')"
          class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
        >
          Apply Now
        </button>
      </div>
    </template>
  </BaseJobCard>
</template>

<script setup>
import { formatRelativeTime } from '@/lib/timeUtils';
import JobLocationDisplay from '@/components/shared/JobLocationDisplay.vue';
import BaseJobCard from '@/components/shared/BaseJobCard.vue';
import StatusPill from '@/components/shared/StatusPill.vue';

// Props
const props = defineProps({
  job: {
    type: Object,
    required: true,
  },
});

// Emits
defineEmits(['click', 'apply']);

// Methods
const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Recently';

  const posted = new Date(dateString);
  const now = new Date();
  const diffInMilliseconds = now - posted;
  const fourWeeksInMilliseconds = 4 * 7 * 24 * 60 * 60 * 1000;

  // If older than 4 weeks, use toLocaleDateString()
  if (diffInMilliseconds > fourWeeksInMilliseconds) {
    return posted.toLocaleDateString('en-US', {
      // Assuming 'en-US' or make it dynamic
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  // Otherwise, use the centralized formatRelativeTime
  // 'en-US' can be replaced with a dynamic locale if needed
  return formatRelativeTime(dateString, 'en-US');
};
</script>

<style scoped>
/* Line clamp utilities */
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Smooth transitions */
.transform {
  transition: transform 0.2s ease-in-out;
}

/* .group class is now on the BaseJobCard via card-class prop. */
/* Hover overlay logic might need adjustment if it was critical and not covered by BaseJobCard's hover. */
</style>
