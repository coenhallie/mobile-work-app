<template>
  <div class="card-sm">
    <div class="card-content-sm">
      <h3 class="card-title-sm">Earnings & Rating</h3>
      <div class="data-grid">
        <div class="data-item">
          <span class="data-value-lg">{{ formattedEarnings }}</span>
          <span class="data-label-sm">Total Earnings</span>
        </div>
        <div class="data-item">
          <span class="data-value-lg">{{ averageRating }} / 5</span>
          <span class="data-label-sm">Avg. Rating</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuth } from '@/composables/useAuth';

const totalEarnings = ref(0);
const averageRating = ref(0);
const contractorId = ref(null); // This should be dynamically set, e.g., from auth state or props

// Get auth composable
const auth = useAuth();

// Helper to get current user (contractor)
async function getCurrentUser() {
  const supabase = auth.getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    // Assuming your contractors table has a user_id that matches auth.users.id
    // And you have a 'contractor_profile' table or similar linked to the user
    // This part might need adjustment based on your actual DB schema
    const supabase = auth.getSupabaseClient();
    const { data: profile, error } = await supabase
      .from('profiles') // Or your specific contractor profiles table
      .select('id') // Assuming 'id' in profiles is the contractor_id needed for jobs/ratings
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching contractor profile:', error.message);
      return null;
    }
    return profile ? profile.id : null;
  }
  return null;
}

async function fetchTotalEarnings() {
  if (!contractorId.value) return;

  try {
    const supabase = auth.getSupabaseClient();
    const { data, error } = await supabase
      .from('jobs')
      .select('job_value') // Assuming 'job_value' is the column for earnings
      .eq('contractor_id', contractorId.value)
      .eq('status', 'finalized');

    if (error) throw error;

    totalEarnings.value = data.reduce(
      (sum, job) => sum + (job.job_value || 0),
      0
    );
  } catch (error) {
    console.error('Error fetching total earnings:', error.message);
    totalEarnings.value = 0; // Default to 0 on error
  }
}

async function fetchAverageRating() {
  if (!contractorId.value) return;

  try {
    // This is a placeholder. Actual rating calculation might be more complex.
    // e.g., from a 'reviews' table linked to the contractor
    const supabase = auth.getSupabaseClient();
    const { data, error } = await supabase
      .from('reviews') // Assuming a 'reviews' table
      .select('rating')
      .eq('contractor_id', contractorId.value);

    if (error) throw error;

    if (data && data.length > 0) {
      const sumOfRatings = data.reduce(
        (sum, review) => sum + (review.rating || 0),
        0
      );
      averageRating.value = parseFloat((sumOfRatings / data.length).toFixed(1));
    } else {
      averageRating.value = 0; // Default if no ratings
    }
  } catch (error) {
    console.error('Error fetching average rating:', error.message);
    averageRating.value = 0; // Default to 0 on error
  }
}

const formattedEarnings = computed(() => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(totalEarnings.value);
});

onMounted(async () => {
  contractorId.value = await getCurrentUser();
  if (contractorId.value) {
    await fetchTotalEarnings();
    await fetchAverageRating();
  } else {
    console.warn('Contractor ID not found, cannot fetch earnings or rating.');
    // Potentially redirect or show an error message to the user
  }
});
</script>

<style scoped>
.card-sm {
  background-color: var(--card);
  color: var(--card-foreground);
  border-radius: var(--radius-lg);
  padding: var(--space-4); /* 1rem */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  /* Removed margin-bottom, handle in parent grid/flex layout */
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

.data-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--space-4); /* 1rem */
}

.data-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* Align items to the start for better readability */
  padding: var(--space-3); /* 0.75rem */
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
  line-height: 1.2; /* Adjust line height for larger font */
}

/* Ensure component uses global theme variables from style.css */
/* No need for :root or [data-theme='dark'] here as they are global */
</style>
