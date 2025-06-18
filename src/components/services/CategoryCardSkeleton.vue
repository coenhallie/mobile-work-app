<template>
  <div
    class="category-card-skeleton relative overflow-hidden rounded-xl shadow-md bg-muted/50 dark:bg-neutral-800/50"
  >
    <!-- Animated background for skeleton loading effect -->
    <div
      class="absolute inset-0 bg-muted/70 dark:bg-neutral-700/70 animate-pulse"
    ></div>

    <!-- Skeleton content -->
    <div
      class="relative z-10 p-5 flex flex-col items-center justify-end h-full"
    >
      <!-- Badge skeleton -->
      <div
        class="w-16 h-5 bg-muted dark:bg-neutral-600 rounded-full mb-2"
      ></div>

      <!-- Title skeleton -->
      <div class="w-24 h-6 bg-muted dark:bg-neutral-600 rounded"></div>
    </div>
  </div>
</template>

<script setup>
// No props or state needed for the skeleton
</script>

<style scoped>
.category-card-skeleton {
  aspect-ratio: 1 / 1;
  /* Remove flex properties that might interfere with grid layout */
  /* The parent grid container will handle the layout */
}

/* Pulse animation is provided by Tailwind's animate-pulse */
</style>
