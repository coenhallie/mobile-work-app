<template>
  <div class="bg-white shadow-lg rounded-lg p-6">
    <h2 class="text-xl font-semibold mb-4 text-gray-800">
      Completion Streak & Reputation
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="text-center p-4 bg-green-50 rounded-lg">
        <p class="text-3xl font-bold text-green-600">{{ currentStreak }}</p>
        <p class="text-sm text-gray-600">Current Streak</p>
      </div>
      <div class="text-center p-4 bg-blue-50 rounded-lg">
        <p class="text-3xl font-bold text-blue-600">{{ totalCompletedJobs }}</p>
        <p class="text-sm text-gray-600">Total Completed Jobs</p>
      </div>
      <div class="text-center p-4 bg-yellow-50 rounded-lg">
        <p class="text-3xl font-bold text-yellow-600">
          {{ averageCompletionTime }}
        </p>
        <p class="text-sm text-gray-600">Avg. Completion Time</p>
      </div>
    </div>
    <!-- More detailed reputation metrics or achievement visuals can be added here -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuth } from '../../../composables/useAuth'; // Use centralized auth system

console.log('[ContractorCompletionStreakCard] Component loading...');

const { user, getSupabaseClient } = useAuth();
const currentStreak = ref(0);
const totalCompletedJobs = ref(0);
const averageCompletionTime = ref('N/A'); // Default to N/A

const fetchCompletedJobs = async () => {
  console.log('[ContractorCompletionStreakCard] Fetching completed jobs...');

  if (!user.value) {
    console.error(
      '[ContractorCompletionStreakCard] User not available for fetching jobs.'
    );
    return;
  }

  try {
    const supabase = getSupabaseClient();

    // Fetch jobs where status is 'finalized' or 'completed' (adjust based on your schema)
    // and contractor_id matches the current user's ID.
    const { data: jobs, error } = await supabase
      .from('job_postings')
      .select(
        'id, created_at, preferred_datetime, status, selected_contractor_id'
      )
      .eq('selected_contractor_id', user.value.id)
      .in('status', ['finalized', 'completed']) // Adjust status values as per your DB
      .order('created_at', { ascending: false });

    if (error) {
      console.error(
        '[ContractorCompletionStreakCard] Error fetching completed jobs:',
        error
      );
      return;
    }

    console.log(
      '[ContractorCompletionStreakCard] Fetched jobs:',
      jobs?.length || 0
    );

    if (jobs && jobs.length > 0) {
      totalCompletedJobs.value = jobs.length;
      calculateCurrentStreak(jobs);
      calculateAverageCompletionTime(jobs);
    } else {
      currentStreak.value = 0;
      totalCompletedJobs.value = 0;
      averageCompletionTime.value = 'N/A';
    }
  } catch (err) {
    console.error(
      '[ContractorCompletionStreakCard] Exception fetching completed jobs:',
      err
    );
  }
};

const calculateCurrentStreak = (completedJobs) => {
  // Simplified streak calculation - just count completed jobs for now
  // A more sophisticated implementation would check for consecutive completions
  currentStreak.value = completedJobs.length;
  console.log(
    '[ContractorCompletionStreakCard] Calculated streak:',
    currentStreak.value
  );
};

const calculateAverageCompletionTime = (jobs) => {
  // Since we don't have started_at and completed_at fields in the current schema,
  // we'll use a placeholder calculation or set to N/A
  averageCompletionTime.value = 'N/A';
  console.log(
    '[ContractorCompletionStreakCard] Average completion time set to N/A (no timing data available)'
  );
};

onMounted(() => {
  console.log('[ContractorCompletionStreakCard] Component mounted');
  fetchCompletedJobs();
});
</script>

<style scoped>
/* Add any specific styles for this card if needed */
.bg-white {
  /* Tailwind class */
}
.shadow-lg {
  /* Tailwind class */
}
.rounded-lg {
  /* Tailwind class */
}
.p-6 {
  /* Tailwind class */
}
.text-xl {
  /* Tailwind class */
}
.font-semibold {
  /* Tailwind class */
}
.mb-4 {
  /* Tailwind class */
}
.text-gray-800 {
  /* Tailwind class */
}
.grid {
  /* Tailwind class */
}
.grid-cols-1 {
  /* Tailwind class */
}
.md\:grid-cols-3 {
  /* Tailwind class */
}
.gap-4 {
  /* Tailwind class */
}
.text-center {
  /* Tailwind class */
}
.p-4 {
  /* Tailwind class */
}
.bg-green-50 {
  /* Tailwind class */
}
.text-3xl {
  /* Tailwind class */
}
.font-bold {
  /* Tailwind class */
}
.text-green-600 {
  /* Tailwind class */
}
.text-sm {
  /* Tailwind class */
}
.text-gray-600 {
  /* Tailwind class */
}
.bg-blue-50 {
  /* Tailwind class */
}
.text-blue-600 {
  /* Tailwind class */
}
.bg-yellow-50 {
  /* Tailwind class */
}
.text-yellow-600 {
  /* Tailwind class */
}
</style>
