<template>
  <div class="space-y-6 py-4">
    <!-- Header -->
    <div class="text-center space-y-2">
      <div
        class="flex items-center justify-center space-x-2 text-blue-600 mb-2"
      >
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
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
        <span class="font-medium">{{ location?.name || 'Your Area' }}</span>
      </div>

      <h2 class="text-2xl font-bold text-gray-900">
        Jobs Available in {{ location?.name || 'Your Area' }}
      </h2>

      <p class="text-gray-600">See what opportunities are waiting for you</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-4">
      <div v-for="i in 4" :key="i" class="animate-pulse">
        <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-gray-200 rounded-lg"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-gray-200 rounded w-3/4"></div>
              <div class="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Job Categories -->
    <div v-else-if="jobStats.length > 0" class="space-y-3">
      <JobCategoryCard
        v-for="category in jobStats"
        :key="category.skill"
        :category="category"
        @click="selectCategory(category)"
        @view-jobs="viewJobs(category)"
      />
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
          No jobs found in this area
        </h3>
        <p class="text-gray-500 text-sm">
          Try selecting a different location or check back later.
        </p>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="space-y-3 pt-4">
      <button
        v-if="jobStats.length > 0"
        @click="$emit('continue')"
        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
      >
        Get Started
      </button>

      <button
        @click="showAllCategories = true"
        class="w-full text-blue-600 hover:text-blue-700 font-medium py-2 transition-colors"
      >
        See All Categories
      </button>
    </div>

    <!-- All Categories Modal -->
    <div
      v-if="showAllCategories"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showAllCategories = false"
    >
      <div
        class="bg-white rounded-xl max-w-md w-full max-h-96 overflow-hidden shadow-2xl"
      >
        <div class="p-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              All Service Categories
            </h3>
            <button
              @click="showAllCategories = false"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div class="p-4 max-h-80 overflow-y-auto">
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="category in allCategories"
              :key="category.id"
              @click="selectCategoryFromModal(category)"
              class="p-3 text-left rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div class="flex items-center space-x-2">
                <span class="text-2xl">{{ category.icon }}</span>
                <div>
                  <div class="font-medium text-sm text-gray-900">
                    {{ category.name }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ category.jobCount || 0 }} jobs
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAuth } from '@/composables/useAuth';
import JobCategoryCard from './JobCategoryCard.vue';

// Props
const props = defineProps({
  location: {
    type: Object,
    required: true,
  },
});

// Emits
const emit = defineEmits(['skill-selected', 'continue']);

// Reactive state
const isLoading = ref(true);
const jobStats = ref([]);
const showAllCategories = ref(false);
const error = ref('');

// All available categories
const allCategories = ref([
  { id: 'plumbing', name: 'Plumbing', icon: '🔧', jobCount: 0 },
  { id: 'electrical', name: 'Electrical', icon: '⚡', jobCount: 0 },
  { id: 'painting', name: 'Painting', icon: '🎨', jobCount: 0 },
  { id: 'carpentry', name: 'Carpentry', icon: '🪚', jobCount: 0 },
  { id: 'gardening', name: 'Gardening', icon: '🌱', jobCount: 0 },
  { id: 'cleaning', name: 'Cleaning', icon: '🧽', jobCount: 0 },
  { id: 'appliance', name: 'Appliance Repair', icon: '🔨', jobCount: 0 },
  { id: 'locksmith', name: 'Locksmith', icon: '🔐', jobCount: 0 },
  { id: 'tutoring', name: 'Tutoring', icon: '📚', jobCount: 0 },
  { id: 'beauty', name: 'Beauty Services', icon: '💅', jobCount: 0 },
  { id: 'fitness', name: 'Fitness Training', icon: '💪', jobCount: 0 },
  { id: 'general', name: 'General Services', icon: '🛠️', jobCount: 0 },
]);

// Methods
const fetchJobStats = async () => {
  if (!props.location) return;

  isLoading.value = true;
  error.value = '';

  try {
    const { getSupabaseClient } = useAuth();
    const supabase = getSupabaseClient();

    // Fetch job statistics for the location
    const { data: jobs, error: jobError } = await supabase
      .from('job_postings')
      .select(
        'category_name as service_type, budget_min, budget_max, description'
      )
      .eq('status', 'open')
      .ilike('location_text', `%${props.location.name}%`)
      .limit(100);

    if (jobError) throw jobError;

    // Aggregate job statistics by service type
    const stats = aggregateJobStats(jobs || []);
    jobStats.value = stats.slice(0, 4); // Show top 4 categories

    // Update all categories with job counts
    updateAllCategoriesCount(jobs || []);
  } catch (err) {
    console.error('Error fetching job stats:', err);
    error.value = 'Unable to load job data';

    // Show mock data for demo purposes
    jobStats.value = [
      {
        skill: 'plumbing',
        name: 'Plumbing',
        icon: '🔧',
        jobCount: 12,
        avgBudget: 175,
        budgetRange: 'S/150-200',
      },
      {
        skill: 'electrical',
        name: 'Electrical',
        icon: '⚡',
        jobCount: 8,
        avgBudget: 215,
        budgetRange: 'S/180-250',
      },
      {
        skill: 'painting',
        name: 'Painting',
        icon: '🎨',
        jobCount: 15,
        avgBudget: 150,
        budgetRange: 'S/120-180',
      },
      {
        skill: 'carpentry',
        name: 'Carpentry',
        icon: '🪚',
        jobCount: 6,
        avgBudget: 190,
        budgetRange: 'S/160-220',
      },
    ];
  } finally {
    isLoading.value = false;
  }
};

const aggregateJobStats = (jobs) => {
  const statsMap = new Map();

  jobs.forEach((job) => {
    const serviceType = job.service_type || 'general';
    const category = allCategories.value.find(
      (cat) => cat.id === serviceType
    ) || { id: serviceType, name: serviceType, icon: '🛠️' };

    if (!statsMap.has(serviceType)) {
      statsMap.set(serviceType, {
        skill: serviceType,
        name: category.name,
        icon: category.icon,
        jobCount: 0,
        totalBudget: 0,
        budgets: [],
      });
    }

    const stat = statsMap.get(serviceType);
    stat.jobCount++;

    if (job.budget_min && job.budget_max) {
      const avgBudget = (job.budget_min + job.budget_max) / 2;
      stat.budgets.push(avgBudget);
      stat.totalBudget += avgBudget;
    }
  });

  // Convert to array and calculate averages
  return Array.from(statsMap.values())
    .map((stat) => ({
      ...stat,
      avgBudget:
        stat.budgets.length > 0
          ? Math.round(stat.totalBudget / stat.budgets.length)
          : 0,
      budgetRange:
        stat.budgets.length > 0
          ? `S/${Math.min(...stat.budgets).toFixed(0)}-${Math.max(...stat.budgets).toFixed(0)}`
          : 'Budget varies',
    }))
    .sort((a, b) => b.jobCount - a.jobCount);
};

const updateAllCategoriesCount = (jobs) => {
  const countMap = new Map();

  jobs.forEach((job) => {
    const serviceType = job.service_type || 'general';
    countMap.set(serviceType, (countMap.get(serviceType) || 0) + 1);
  });

  allCategories.value = allCategories.value.map((category) => ({
    ...category,
    jobCount: countMap.get(category.id) || 0,
  }));
};

const selectCategory = (category) => {
  emit('skill-selected', category.skill);
};

const viewJobs = (category) => {
  emit('skill-selected', category.skill);
};

const selectCategoryFromModal = (category) => {
  showAllCategories.value = false;
  emit('skill-selected', category.id);
};

// Watch for location changes
watch(() => props.location, fetchJobStats, { immediate: true });

// Lifecycle
onMounted(() => {
  if (props.location) {
    fetchJobStats();
  }
});
</script>

<style scoped>
/* Custom scrollbar for modal */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
