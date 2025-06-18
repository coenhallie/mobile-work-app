<template>
  <div class="mb-8">
    <!-- Title skeleton -->
    <div class="skeleton h-8 bg-gray-200 rounded w-80 mx-auto mb-6"></div>

    <!-- Search form skeleton -->
    <div class="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-md">
      <div class="space-y-4">
        <!-- Search field skeleton -->
        <div>
          <div class="skeleton h-4 bg-gray-200 rounded w-32 mb-2"></div>
          <div class="skeleton h-12 bg-gray-200 rounded w-full"></div>
        </div>

        <!-- Zipcode field skeleton -->
        <div>
          <div class="skeleton h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div class="skeleton h-12 bg-gray-200 rounded w-full"></div>
        </div>

        <!-- Search button skeleton -->
        <div class="pt-2">
          <div class="skeleton h-12 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    </div>

    <!-- How It Works Section Skeleton -->
    <div class="mt-12">
      <!-- Section title skeleton -->
      <div class="skeleton h-6 bg-gray-200 rounded w-32 mx-auto mb-6"></div>

      <!-- Steps skeleton -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div v-for="i in 3" :key="i" class="text-center p-4">
          <!-- Step icon skeleton -->
          <div
            class="skeleton w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3"
          ></div>
          <!-- Step title skeleton -->
          <div class="skeleton h-5 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
          <!-- Step description skeleton -->
          <div class="space-y-1">
            <div class="skeleton h-4 bg-gray-200 rounded w-full mx-auto"></div>
            <div class="skeleton h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
          </div>
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
