<template>
  <div class="bg-white p-0 rounded-xl shadow-md border overflow-hidden">
    <!-- Job Photo Skeleton -->
    <div class="relative h-48 bg-gray-200 skeleton"></div>

    <!-- Job Content Skeleton -->
    <div class="p-6">
      <!-- Header with title and status -->
      <div class="flex justify-between items-start mb-4">
        <div class="space-y-2 flex-1">
          <!-- Job title skeleton -->
          <div class="skeleton h-6 bg-gray-200 rounded w-3/4"></div>
          <!-- Job category skeleton -->
          <div class="skeleton h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <!-- Status badge skeleton -->
        <div class="skeleton h-8 w-20 bg-gray-200 rounded-full ml-4"></div>
      </div>

      <!-- Job description skeleton -->
      <div class="space-y-2 mb-4">
        <div class="skeleton h-4 bg-gray-200 rounded w-full"></div>
        <div class="skeleton h-4 bg-gray-200 rounded w-4/5"></div>
        <div class="skeleton h-4 bg-gray-200 rounded w-2/3"></div>
      </div>

      <!-- Job details (location, date, etc.) -->
      <div class="space-y-2 mb-4">
        <div class="flex items-center space-x-2">
          <div class="skeleton w-4 h-4 bg-gray-200 rounded"></div>
          <div class="skeleton h-4 bg-gray-200 rounded w-32"></div>
        </div>
        <div class="flex items-center space-x-2">
          <div class="skeleton w-4 h-4 bg-gray-200 rounded"></div>
          <div class="skeleton h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>

      <!-- Footer with price and action button -->
      <div
        class="flex justify-between items-center pt-4 border-t border-gray-100"
      >
        <!-- Price skeleton -->
        <div class="skeleton h-6 bg-gray-200 rounded w-20"></div>
        <!-- Action button skeleton -->
        <div class="skeleton h-10 w-28 bg-gray-200 rounded"></div>
      </div>

      <!-- Applicant counter skeleton (for client view) -->
      <div class="mt-3 pt-3 border-t border-gray-100">
        <div class="flex items-center justify-between">
          <div class="skeleton h-4 bg-gray-200 rounded w-32"></div>
          <div class="skeleton h-4 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// No props needed for skeleton
</script>

<style scoped>
.skeleton {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
