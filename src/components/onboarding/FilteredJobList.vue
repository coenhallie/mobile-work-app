<template>
  <div class="space-y-6 py-4">
    <!-- Header -->
    <div class="text-center space-y-2">
      <div
        class="flex items-center justify-center space-x-2 text-blue-600 mb-2"
      >
        <span class="text-2xl">{{ skillIcon }}</span>
        <span class="font-medium">{{ skillName }}</span>
      </div>

      <h2 class="text-2xl font-bold text-gray-900">
        {{ skillName }} Jobs Near You
      </h2>

      <p class="text-gray-600">
        {{
          location?.name
            ? `Available in ${location.name}`
            : 'Available in your area'
        }}
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="animate-pulse">
        <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="h-5 bg-gray-200 rounded w-3/4"></div>
              <div class="h-4 bg-gray-200 rounded w-16"></div>
            </div>
            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
            <div class="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Jobs List -->
    <div v-else-if="jobs.length > 0" class="space-y-3">
      <JobCard
        v-for="job in jobs"
        :key="job.id"
        :job="job"
        @click="selectJob(job)"
        @apply="applyToJob(job)"
      />

      <!-- Load More Button -->
      <button
        v-if="hasMore"
        @click="loadMore"
        :disabled="isLoadingMore"
        class="w-full py-3 text-blue-600 hover:text-blue-700 font-medium transition-colors"
      >
        {{ isLoadingMore ? 'Loading...' : 'See More Jobs' }}
      </button>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-8 space-y-4">
      <div
        class="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center"
      >
        <svg
          class="w-8 h-8 text-gray-400"
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
      </div>
      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          No {{ skillName.toLowerCase() }} jobs found
        </h3>
        <p class="text-gray-500 text-sm">
          Try a different skill or check back later for new opportunities.
        </p>
      </div>

      <button
        @click="$emit('skill-selected', 'general')"
        class="text-blue-600 hover:text-blue-700 font-medium transition-colors"
      >
        View all job categories
      </button>
    </div>

    <!-- Profile Completion Prompt -->
    <div
      class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mt-6"
    >
      <div class="flex items-center space-x-3">
        <div
          class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0"
        >
          <svg
            class="w-5 h-5 text-blue-600"
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
        <div class="flex-1">
          <h4 class="font-semibold text-blue-900 mb-1">
            Complete profile to apply
          </h4>
          <p class="text-sm text-blue-700">
            Add your details to start applying for jobs
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useOnboardingStore } from '@/stores/onboarding';
import JobCard from './JobCard.vue';

// Props
const props = defineProps({
  skill: {
    type: String,
    required: true,
  },
  location: {
    type: Object,
    required: true,
  },
});

// Emits
const emit = defineEmits(['job-selected', 'apply-clicked', 'skill-selected']);

// Store
const onboardingStore = useOnboardingStore();

// Reactive state
const isLoading = ref(true);
const isLoadingMore = ref(false);
const jobs = ref([]);
const hasMore = ref(true);
const currentPage = ref(1);
const pageSize = 10;

// Skill mapping
const skillMapping = {
  plumbing: { name: 'Plumbing', icon: '🔧' },
  electrical: { name: 'Electrical', icon: '⚡' },
  painting: { name: 'Painting', icon: '🎨' },
  carpentry: { name: 'Carpentry', icon: '🪚' },
  gardening: { name: 'Gardening', icon: '🌱' },
  cleaning: { name: 'Cleaning', icon: '🧽' },
  appliance: { name: 'Appliance Repair', icon: '🔨' },
  locksmith: { name: 'Locksmith', icon: '🔐' },
  tutoring: { name: 'Tutoring', icon: '📚' },
  beauty: { name: 'Beauty Services', icon: '💅' },
  fitness: { name: 'Fitness Training', icon: '💪' },
  general: { name: 'General Services', icon: '🛠️' },
};

// Computed
const skillName = computed(
  () => skillMapping[props.skill]?.name || 'General Services'
);
const skillIcon = computed(() => skillMapping[props.skill]?.icon || '🛠️');

// Methods
const fetchJobs = async (page = 1, append = false) => {
  try {
    const { getSupabaseClient } = useAuth();
    const supabase = getSupabaseClient();

    const query = supabase
      .from('job_postings')
      .select(
        `
        id,
        description,
        budget_min,
        budget_max,
        location_text,
        created_at,
        category_name,
        urgency_level
      `
      )
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    // Filter by skill if not general
    if (props.skill !== 'general') {
      query.eq('category_name', props.skill);
    }

    // Filter by location if available
    if (props.location?.name) {
      query.ilike('location_text', `%${props.location.name}%`);
    }

    const { data: jobsData, error } = await query;

    if (error) throw error;

    const formattedJobs = (jobsData || []).map((job) => ({
      id: job.id,
      title: job.description?.substring(0, 50) + '...' || 'Job Posting',
      description: job.description,
      budget:
        job.budget_min && job.budget_max
          ? `S/${job.budget_min}-${job.budget_max}`
          : 'Budget negotiable',
      location: job.location_text,
      postedAt: job.created_at,
      serviceType: job.category_name,
      urgency: job.urgency_level,
      clientName: 'Client',
      isUrgent: job.urgency_level === 'urgent',
    }));

    if (append) {
      jobs.value = [...jobs.value, ...formattedJobs];
    } else {
      jobs.value = formattedJobs;
    }

    hasMore.value = formattedJobs.length === pageSize;
  } catch (error) {
    console.error('Error fetching jobs:', error);

    // Show mock data for demo
    if (!append) {
      jobs.value = generateMockJobs();
    }
  }
};

const generateMockJobs = () => {
  const mockJobs = [
    {
      id: 'mock-1',
      title: `Fix Kitchen Sink`,
      description:
        'Kitchen sink is leaking and needs immediate repair. Located in modern apartment.',
      budget: 'S/150',
      location: props.location?.name || 'Miraflores',
      postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      serviceType: props.skill,
      clientName: 'Maria C.',
      isUrgent: false,
    },
    {
      id: 'mock-2',
      title: `Bathroom Renovation`,
      description:
        'Complete bathroom renovation needed. Includes tile work and fixture installation.',
      budget: 'S/800',
      location: 'San Isidro',
      postedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      serviceType: props.skill,
      clientName: 'Carlos R.',
      isUrgent: false,
    },
    {
      id: 'mock-3',
      title: `Emergency Pipe Repair`,
      description:
        'Urgent pipe repair needed. Water damage prevention required.',
      budget: 'S/120',
      location: 'Surco',
      postedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
      serviceType: props.skill,
      clientName: 'Ana L.',
      isUrgent: true,
    },
  ];

  return mockJobs.filter(
    (job) => props.skill === 'general' || job.serviceType === props.skill
  );
};

const selectJob = (job) => {
  onboardingStore.trackJobView(job.id);
  emit('job-selected', job);
};

const applyToJob = (job) => {
  onboardingStore.trackJobView(job.id);
  emit('apply-clicked', job);
};

const loadMore = async () => {
  isLoadingMore.value = true;
  currentPage.value++;
  await fetchJobs(currentPage.value, true);
  isLoadingMore.value = false;
};

// Watch for skill/location changes
watch(
  [() => props.skill, () => props.location],
  () => {
    currentPage.value = 1;
    hasMore.value = true;
    fetchJobs();
  },
  { immediate: false }
);

// Lifecycle
onMounted(async () => {
  isLoading.value = true;
  await fetchJobs();
  isLoading.value = false;
});
</script>

<style scoped>
/* Ensure smooth loading transitions */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
