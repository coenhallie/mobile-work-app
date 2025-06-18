<template>
  <div class="card-sm">
    <div class="card-content-sm">
      <h3 class="card-title-sm">New Opportunities</h3>
      <div v-if="loading" class="loading-text">Loading...</div>
      <div v-else-if="error" class="error-text">{{ error }}</div>
      <div v-else class="data-grid">
        <div class="data-item">
          <span class="data-value-lg">{{ openJobCount }}</span>
          <span class="data-label-sm">Available</span>
        </div>
        <div class="data-item">
          <span class="data-value-lg">{{ newJobCount }}</span>
          <span class="data-label-sm">New Today</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuth } from '@/composables/useAuth';

const openJobCount = ref(0);
const newJobCount = ref(0);
const loading = ref(true);
const error = ref(null);

// Get auth composable
const auth = useAuth();

async function fetchOpenJobs() {
  loading.value = true;
  error.value = null;
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    // Fetch open jobs
    const supabase = auth.getSupabaseClient();
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, created_at', { count: 'exact' })
      .eq('status', 'open');

    if (jobsError) throw jobsError;

    openJobCount.value = jobs.length;

    // Filter for new jobs
    newJobCount.value = jobs.filter(
      (job) => new Date(job.created_at) > new Date(twentyFourHoursAgo)
    ).length;
  } catch (e) {
    console.error('Error fetching open jobs:', e);
    error.value = 'Failed to load new opportunities.';
    // Consider more specific error messages based on e.message or e.code
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchOpenJobs();
});
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
</style>
