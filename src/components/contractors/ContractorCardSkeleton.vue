<template>
  <div
    class="contractor-card-skeleton bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
  >
    <!-- Header Skeleton -->
    <div class="flex items-start space-x-4 mb-4">
      <!-- Avatar Skeleton -->
      <div class="w-14 h-14 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>

      <!-- Info Skeleton -->
      <div class="flex-1 space-y-2">
        <div class="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
        <div class="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
        <div class="h-3 bg-gray-200 dark:bg-gray-600 rounded w-28"></div>
      </div>

      <!-- Favorite Button Skeleton -->
      <div class="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
    </div>

    <!-- Bio Skeleton -->
    <div class="space-y-2 mb-4">
      <div class="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
      <div class="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
    </div>

    <!-- Skills Skeleton -->
    <div class="flex space-x-2 mb-4">
      <div class="h-6 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
      <div class="h-6 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
      <div class="h-6 bg-gray-200 dark:bg-gray-600 rounded w-14"></div>
    </div>

    <!-- Actions Skeleton -->
    <div class="flex space-x-2">
      <div class="flex-1 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
      <div class="w-24 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
    </div>
  </div>
</template>
