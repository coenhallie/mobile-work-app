<template>
  <div class="space-y-4">
    <!-- Loading State -->
    <div v-if="loading" class="text-center text-muted-foreground py-6">
      <div
        class="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mr-2"
      ></div>
      Loading jobs...
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center text-destructive py-6">
      Error loading jobs: {{ error }}
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!jobs || jobs.length === 0"
      class="border border-dashed border-border p-6 text-center text-muted-foreground rounded bg-card"
    >
      <!-- Conditional CTA -->
      <div v-if="showPostJobCTA">
        <p class="mb-4 text-lg text-foreground">
          Ready to find the right help?
        </p>
        <Button
          @click="navigateToPostJob"
          variant="primary"
          size="lg"
          class="inline-flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Post New Job
        </Button>
      </div>
      <!-- Default Empty Message -->
      <div v-else>
        {{ emptyMessage }}
      </div>
    </div>

    <!-- Job List with Virtual Scrolling for better performance -->
    <div v-else class="space-y-4">
      <Card
        v-for="job in visibleJobs"
        :key="job.id"
        class="overflow-hidden cursor-pointer bg-transparent transition-colors duration-150 ease-in-out p-0 border-0"
        @click="$emit('view', job)"
        style="border: none; box-shadow: none"
      >
        <!-- Job Photo Section with ShadCN Carousel -->
        <div class="relative">
          <JobImageCarousel
            :images="job.photos || []"
            :alt-text="`${job.category_name} job`"
            height="h-48"
            :show-navigation="false"
            :show-indicators="true"
            @image-error="handleImageError"
            @slide-change="handleSlideChange(job.id, $event)"
          />

          <!-- Status Indicator Overlay -->
          <div class="absolute top-2 right-2 flex gap-2">
            <JobStatusIndicator :status="job.status" />
            <!-- Application Status Indicator for Contractors -->
            <div
              v-if="userRole === 'contractor' && hasApplied(job.id)"
              class="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {{ $t('jobs.applied') }}
            </div>
          </div>
        </div>

        <!-- Job Content Section -->
        <div class="px-0 flex flex-col h-full">
          <!-- Job Title -->
          <h3 class="text-lg font-medium text-foreground mb-1 pr-4 pl-0">
            Needs {{ job.category_name }}
            {{ job.location_text ? 'in ' + job.location_text : '' }}
          </h3>

          <!-- Job Description -->
          <p
            class="text-sm text-muted-foreground mb-3 line-clamp-2 flex-grow pr-4 pl-0"
          >
            {{ job.description }}
          </p>

          <!-- Job Details (Location, Budget, etc.) -->
          <div
            class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mb-3 pr-4 pl-0"
          >
            <span v-if="job.location_text" class="inline-flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3.5 w-3.5 mr-1 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {{ job.location_text }}
            </span>

            <span
              v-if="job.budget_min && job.budget_max"
              class="inline-flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3.5 w-3.5 mr-1 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
              S/{{ job.budget_min }} - S/{{ job.budget_max }}
            </span>

            <span class="inline-flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3.5 w-3.5 mr-1 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {{ job.applicant_count || 0 }} applicants
            </span>

            <span class="inline-flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3.5 w-3.5 mr-1 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {{ formatDate(job.created_at) }}
            </span>
          </div>

          <!-- Posted By / Assigned To Information -->
          <div
            v-if="showPostedBy || showAssignedTo"
            class="flex items-center text-xs text-muted-foreground mb-3 pr-4 pl-0"
          >
            <span v-if="showPostedBy && job.client_name" class="mr-3">
              Posted by: {{ job.client_name }}
            </span>
            <span v-if="showAssignedTo && job.assigned_contractor_name">
              Assigned to: {{ job.assigned_contractor_name }}
            </span>
          </div>

          <!-- Action Buttons -->
          <div
            v-if="showActions"
            class="flex items-center justify-between pr-4 pl-0"
          >
            <div class="flex items-center space-x-2">
              <!-- Job Action Button -->
              <JobActionButton
                :job="job"
                :user-role="userRole"
                @action="$emit('action', $event, job.id)"
                @applied="$emit('applied', $event)"
                @application-error="$emit('application-error', $event)"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Card } from '@/components/ui/card';
import Button from '@/components/ui/button/Button.vue';
import JobStatusIndicator from './JobStatusIndicator.vue';
import JobActionButton from './JobActionButton.vue';
import JobImageCarousel from './JobImageCarousel.vue';
import { useJobApplicationsStore } from '@/stores/jobApplications';
import { useAuth } from '@/composables/useAuth';

const props = defineProps({
  jobs: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: null,
  },
  userRole: {
    type: String,
    default: 'client',
  },
  emptyMessage: {
    type: String,
    default: 'No jobs found.',
  },
  showPostedBy: {
    type: Boolean,
    default: false,
  },
  showAssignedTo: {
    type: Boolean,
    default: false,
  },
  showActions: {
    type: Boolean,
    default: true,
  },
  showPostJobCTA: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['view', 'action', 'applied', 'application-error']);

const router = useRouter();
const jobApplicationsStore = useJobApplicationsStore();
const { user } = useAuth();

// Track application status for each job
const appliedJobs = ref(new Set());

// Handle image loading errors
const handleImageError = (imageSrc) => {
  console.warn('Failed to load job image:', imageSrc);
};

// Handle slide changes in carousel
const handleSlideChange = (jobId, slideIndex) => {
  // Optional: track analytics or other slide change events
  console.debug(`Job ${jobId} carousel changed to slide ${slideIndex}`);
};

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
};

// Navigate to post job page
const navigateToPostJob = () => {
  router.push({ name: 'PostJob' });
};

// Check if contractor has applied to a specific job
const hasApplied = (jobId) => {
  return appliedJobs.value.has(jobId);
};

// Load application status for all visible jobs
const loadApplicationStatus = async () => {
  if (
    props.userRole !== 'contractor' ||
    !user.value?.id ||
    !props.jobs.length
  ) {
    return;
  }

  try {
    const newAppliedJobs = new Set();

    // Check application status for each job
    for (const job of props.jobs) {
      const hasAppliedToJob = await jobApplicationsStore.hasAppliedToJob(
        job.id,
        user.value.id
      );
      if (hasAppliedToJob) {
        newAppliedJobs.add(job.id);
      }
    }

    appliedJobs.value = newAppliedJobs;
  } catch (error) {
    console.error('Error loading application status:', error);
  }
};

// Virtual scrolling for better performance with large lists
const visibleJobs = computed(() => {
  // For now, show all jobs. In the future, implement virtual scrolling
  return props.jobs;
});

// Watch for changes in jobs and reload application status
watch(
  () => [props.jobs, props.userRole, user.value?.id],
  async ([newJobs, newUserRole, newUserId]) => {
    if (newUserRole === 'contractor' && newUserId && newJobs.length > 0) {
      await loadApplicationStatus();
    }
  },
  { immediate: true }
);
</script>

<style scoped>
/* Line clamp utility for description */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Smooth transitions for cards */
.card-transition {
  transition: all 0.2s ease-in-out;
}

/* Hover effects */
.card-transition:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Ensure proper spacing and alignment */
.space-y-4 > * + * {
  margin-top: 1rem;
}
</style>
