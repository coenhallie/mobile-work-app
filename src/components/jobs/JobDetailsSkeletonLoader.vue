<template>
  <div class="bg-white p-6 rounded shadow animate-pulse">
    <!-- Title skeleton -->
    <div class="flex justify-between items-center mb-4">
      <div class="h-8 bg-gray-200 rounded w-2/3"></div>
      <div class="h-6 w-12 bg-gray-200 rounded"></div>
    </div>

    <!-- Tab navigation skeleton -->
    <div class="border-b border-gray-200 mb-4">
      <div class="flex -mb-px">
        <div
          class="py-2 px-4 border-b-2 border-blue-500 font-medium text-sm w-24 h-8 bg-gray-200 rounded"
        ></div>
        <div
          class="py-2 px-4 ml-4 font-medium text-sm w-24 h-8 bg-gray-200 rounded"
        ></div>
      </div>
    </div>

    <!-- Image skeleton -->
    <div class="mb-4">
      <div class="relative">
        <div class="w-full h-64 bg-gray-200 rounded shadow"></div>
      </div>
      <!-- Thumbnail skeleton -->
      <div class="flex mt-2 space-x-2">
        <div
          v-for="i in 3"
          :key="i"
          class="w-16 h-16 bg-gray-200 rounded"
        ></div>
      </div>
    </div>

    <!-- Description skeleton -->
    <div class="mb-4">
      <div class="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
      <div class="h-4 bg-gray-200 rounded w-full mb-2"></div>
      <div class="h-4 bg-gray-200 rounded w-full mb-2"></div>
      <div class="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>

    <!-- Status and date skeleton -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      <div>
        <div class="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div class="h-6 bg-gray-200 rounded w-1/3"></div>
      </div>
      <div>
        <div class="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div class="h-6 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>

    <!-- Action buttons skeleton -->
    <div class="mt-6 border-t pt-4">
      <div class="flex">
        <div class="h-10 bg-gray-200 rounded w-1/3 mr-2"></div>
        <div class="h-10 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
// No props or state needed for this component
</script>

<style scoped>
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Skeleton loader background elements */
.bg-gray-200 {
  background-color: #e5e7eb;
  border-radius: 0.25rem;
}
</style>
