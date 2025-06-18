<template>
  <div class="contractor-card-skeleton">
    <div class="skeleton-content">
      <!-- Header Section -->
      <div class="skeleton-header">
        <!-- Profile Photo -->
        <div class="skeleton-avatar"></div>

        <!-- Basic Info -->
        <div class="skeleton-info">
          <div class="skeleton-line skeleton-name"></div>
          <div class="skeleton-line skeleton-service"></div>
          <div class="skeleton-meta">
            <div class="skeleton-line skeleton-rating"></div>
            <div class="skeleton-line skeleton-experience"></div>
          </div>
          <div class="skeleton-line skeleton-location"></div>
        </div>

        <!-- Action Button -->
        <div class="skeleton-action"></div>
      </div>

      <!-- Bio Section -->
      <div class="skeleton-bio">
        <div class="skeleton-line skeleton-bio-line"></div>
        <div class="skeleton-line skeleton-bio-line-short"></div>
      </div>

      <!-- Skills Section -->
      <div class="skeleton-skills">
        <div class="skeleton-chip"></div>
        <div class="skeleton-chip"></div>
        <div class="skeleton-chip"></div>
        <div class="skeleton-chip skeleton-chip-small"></div>
      </div>

      <!-- Footer -->
      <div class="skeleton-footer">
        <div class="skeleton-button"></div>
        <div class="skeleton-button"></div>
        <div class="skeleton-availability"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
// No props needed for skeleton
</script>

<style scoped>
@reference "@/style.css";

.contractor-card-skeleton {
  @apply relative bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700;
  @apply p-6;
  will-change: transform;
  box-shadow:
    0 1px 3px 0 rgba(0, 0, 0, 0.1),
    0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.skeleton-content {
  @apply animate-pulse space-y-4;
}

.skeleton-header {
  @apply flex items-start space-x-4;
}

.skeleton-avatar {
  @apply flex-shrink-0 w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-lg;
}

.skeleton-info {
  @apply flex-1 space-y-2;
}

.skeleton-line {
  @apply bg-gray-200 dark:bg-gray-700 rounded;
}

.skeleton-name {
  @apply h-5 w-32;
}

.skeleton-service {
  @apply h-4 w-24;
}

.skeleton-meta {
  @apply flex space-x-4;
}

.skeleton-rating {
  @apply h-3 w-16;
}

.skeleton-experience {
  @apply h-3 w-20;
}

.skeleton-location {
  @apply h-3 w-24;
}

.skeleton-action {
  @apply flex-shrink-0 w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded;
}

.skeleton-bio {
  @apply space-y-2;
}

.skeleton-bio-line {
  @apply h-3 w-full;
}

.skeleton-bio-line-short {
  @apply h-3 w-3/4;
}

.skeleton-skills {
  @apply flex flex-wrap gap-2;
}

.skeleton-chip {
  @apply h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded;
}

.skeleton-chip-small {
  @apply w-12;
}

.skeleton-footer {
  @apply flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800;
}

.skeleton-button {
  @apply h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded;
}

.skeleton-availability {
  @apply h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded;
}

/* Optimize animation performance */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
