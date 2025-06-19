<template>
  <div class="card-sm">
    <div class="card-content-sm">
      <h3 class="card-title-sm">
        {{ $t('contractorDashboard.activeJobsLabel') }}
      </h3>
      <div v-if="loading" class="loading-text">{{ $t('common.loading') }}</div>
      <div v-else-if="error" class="error-text">Error loading.</div>
      <div v-else class="data-grid">
        <div class="data-item">
          <span class="data-value-lg">{{ activeJobsCount }}</span>
          <span class="data-label-sm">{{
            $t('contractorDashboard.activeLabel')
          }}</span>
        </div>
        <div class="data-item">
          <span class="data-value-lg"
            >${{ combinedEstimatedValue.toFixed(2) }}</span
          >
          <span class="data-label-sm">Est. Value</span>
        </div>
      </div>
      <button
        v-if="!loading && !error && activeJobsCount > 0"
        @click="viewActiveJobs"
        class="button-secondary-sm mt-2"
      >
        {{ $t('contractorDashboard.viewActiveJobsButton') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';

const activeJobs = ref([]);
const loading = ref(true);
const error = ref(null);
const router = useRouter();
const auth = useAuth();
const { userId } = auth; // Get current contractor's ID

const fetchActiveJobs = async () => {
  if (!userId.value) {
    error.value = 'User not authenticated.';
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;
  try {
    // Assuming jobs are assigned to contractors via a 'selected_contractor_id' or similar field
    // and job statuses are 'in_progress', 'assigned', 'completed' (pending review)
    const supabase = auth.getSupabaseClient();
    const { data, error: supabaseError } = await supabase
      .from('job_postings')
      .select('id, title, estimated_budget, status')
      .eq('selected_contractor_id', userId.value) // Filter by current contractor
      .in('status', ['in_progress', 'assigned', 'completed']);

    if (supabaseError) throw supabaseError;

    activeJobs.value = data || [];
  } catch (err) {
    console.error('Error fetching active jobs:', err);
    error.value = err.message || 'Failed to fetch active jobs.';
    activeJobs.value = []; // Ensure it's an empty array on error
  } finally {
    loading.value = false;
  }
};

onMounted(fetchActiveJobs);

const activeJobsCount = computed(() => activeJobs.value.length);

const combinedEstimatedValue = computed(() => {
  return activeJobs.value.reduce((total, job) => {
    const budget = parseFloat(job.estimated_budget);
    return total + (isNaN(budget) ? 0 : budget);
  }, 0);
});

const viewActiveJobs = () => {
  // Placeholder: Navigate to a general jobs list or a specific active jobs view
  // For now, let's assume a route named 'JobList' or similar exists
  // You might need to pass query params to filter for active jobs
  router.push({ name: 'JobList', query: { filter: 'active_contractor' } });
  // console.log('Navigating to view active jobs...');
};
</script>

<style scoped>
.card-sm {
  background-color: var(--card);
  color: var(--card-foreground);
  border-radius: var(--radius-lg);
  padding: var(--space-4); /* 1rem */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.card-content-sm {
  display: flex;
  flex-direction: column;
  gap: var(--space-3); /* 0.75rem */
}

.card-title-sm {
  font-size: 1.125rem; /* text-lg */
  font-weight: 600; /* semibold */
  color: var(--foreground);
  margin: 0;
}

.loading-text,
.error-text {
  font-size: 0.875rem; /* text-sm */
  color: var(--muted-foreground);
  text-align: center;
  padding: var(--space-4) 0;
}

.error-text {
  color: var(--destructive);
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: var(--space-3); /* 0.75rem */
}

.data-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: var(--space-3);
  background-color: var(--muted);
  border-radius: var(--radius-md);
}

.data-label-sm {
  font-size: 0.875rem; /* text-sm */
  color: var(--muted-foreground);
  font-weight: 500; /* medium */
}

.data-value-lg {
  font-size: 1.5rem; /* text-2xl */
  font-weight: 700; /* bold */
  color: var(--primary);
  line-height: 1.2;
}

.button-secondary-sm {
  background-color: var(--secondary);
  color: var(--secondary-foreground);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
  transition: background-color 0.2s;
}

.button-secondary-sm:hover {
  background-color: hsl(
    var(--secondary-h) var(--secondary-s) calc(var(--secondary-l) * 0.9)
  ); /* Slightly darken */
}

.mt-2 {
  margin-top: var(--space-2);
}
</style>
