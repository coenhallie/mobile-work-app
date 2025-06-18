<template>
  <div
    class="w-full max-w-7xl mx-auto px-4 py-6 bg-white dark:bg-gray-900 min-h-screen"
  >
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-normal text-gray-900 dark:text-white mb-2">
        Contractor Dashboard
      </h1>
      <p class="text-gray-600 dark:text-gray-400 text-sm">
        Manage your contractor profile and job applications
      </p>
    </div>

    <h1 class="text-xl font-normal text-destructive">
      Contractor Dashboard Deprecated
    </h1>
    <p class="text-muted-foreground">
      The contractor dashboard functionality has been integrated into the Home
      view. This component is no longer in use and will be removed in a future
      update.
    </p>
    <!--
      Original content removed.
      The dashboard cards (Total Earnings, Active Jobs, New Opportunities)
      and job lists (Current Jobs, Available Opportunities) are now part of HomeView.vue
      for logged-in contractors.
      The Completion Streak & Reputation cards have been removed as per requirements.
    -->
  </div>
</template>

<script setup>
// This component is deprecated. All logic has been moved to HomeView.vue or removed.
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
  console.warn(
    '[ContractorDashboardView] This component is deprecated and should no longer be accessed directly. Redirecting to Home.'
  );
  // Optionally, force redirect if somehow accessed, though router should handle it.
  // router.replace({ name: 'Home' });
});
</script>

<style scoped>
/* Minimal styling for deprecation notice */
.text-destructive {
  color: #ef4444; /* Example destructive color */
}
</style>
