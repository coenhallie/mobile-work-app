<template>
  <div
    class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer group"
    @click="$emit('click')"
  >
    <div class="flex items-center justify-between">
      <!-- Category Info -->
      <div class="flex items-center space-x-3 flex-1">
        <!-- Icon -->
        <div
          class="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center group-hover:from-blue-100 group-hover:to-indigo-200 transition-colors"
        >
          <span class="text-2xl">{{ category.icon }}</span>
        </div>

        <!-- Details -->
        <div class="flex-1">
          <h3
            class="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors"
          >
            {{ category.name }}
          </h3>

          <div class="flex items-center space-x-3 mt-1">
            <!-- Job Count -->
            <div class="flex items-center space-x-1 text-sm text-gray-600">
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
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V8m8 0V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2"
                />
              </svg>
              <span
                >{{ category.jobCount }} job{{
                  category.jobCount !== 1 ? 's' : ''
                }}</span
              >
            </div>

            <!-- Budget Range -->
            <div
              v-if="category.budgetRange"
              class="flex items-center space-x-1 text-sm text-green-600"
            >
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{{ category.budgetRange }}/day</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Button -->
      <div class="flex items-center space-x-2">
        <button
          @click.stop="$emit('view-jobs')"
          class="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
        >
          {{ $t('onboarding.viewJobsButton') }}
        </button>

        <!-- Arrow -->
        <svg
          class="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </div>

    <!-- Additional Stats (if available) -->
    <div v-if="showStats" class="mt-3 pt-3 border-t border-gray-100">
      <div class="flex items-center justify-between text-xs text-gray-500">
        <div class="flex items-center space-x-4">
          <span v-if="category.avgBudget">
            Avg: S/{{ category.avgBudget }}/day
          </span>
          <span v-if="category.urgentJobs">
            {{ category.urgentJobs }} urgent
          </span>
        </div>

        <div v-if="category.lastPosted" class="text-right">
          Last posted: {{ formatTimeAgo(category.lastPosted) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// Props
const props = defineProps({
  category: {
    type: Object,
    required: true,
  },
  showStats: {
    type: Boolean,
    default: false,
  },
});

// Emits
defineEmits(['click', 'view-jobs']);

// Methods
const formatTimeAgo = (date) => {
  if (!date) return '';

  const now = new Date();
  const posted = new Date(date);
  const diffInHours = Math.floor((now - posted) / (1000 * 60 * 60));

  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks}w ago`;
};
</script>

<style scoped>
/* Hover effects for better interactivity */
.group:hover .group-hover\:from-blue-100 {
  background: linear-gradient(135deg, #dbeafe 0%, #c7d2fe 100%);
}

/* Smooth transitions for all interactive elements */
* {
  transition-property:
    color, background-color, border-color, transform, box-shadow;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}
</style>
