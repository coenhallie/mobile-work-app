<template>
  <div class="flex flex-col min-h-screen">
    <!-- Welcome Banner Skeleton -->
    <div class="welcome-banner w-full text-white p-6 mb-8 rounded-xl">
      <div class="max-w-6xl mx-auto">
        <div class="flex items-center justify-between">
          <!-- Welcome text skeleton -->
          <div class="space-y-2">
            <div class="skeleton w-48 h-7 rounded bg-white/30"></div>
            <div class="skeleton w-32 h-5 rounded bg-white/20"></div>
          </div>
          <!-- Profile image skeleton -->
          <div class="skeleton w-20 h-20 rounded-full bg-white/30"></div>
        </div>
      </div>
    </div>

    <!-- Main Content Skeleton -->
    <div class="space-y-8">
      <!-- Dashboard Title Skeleton -->
      <div class="mb-8">
        <div
          class="skeleton h-8 bg-gray-200 rounded-lg w-64 mx-auto mb-6"
        ></div>
      </div>

      <!-- Job Sections Skeleton -->
      <div class="space-y-8">
        <!-- First Section (Current Jobs / Posted Jobs) -->
        <div class="mb-8">
          <!-- Section title skeleton -->
          <div class="skeleton h-6 bg-gray-200 rounded w-48 mb-4"></div>

          <!-- Job cards skeleton -->
          <div class="space-y-4">
            <JobCardSkeleton v-for="i in 2" :key="`current-${i}`" />
          </div>
        </div>

        <!-- Second Section (Available Jobs) -->
        <div class="mb-8" v-if="showSecondSection">
          <!-- Section title skeleton -->
          <div class="skeleton h-6 bg-gray-200 rounded w-56 mb-4"></div>

          <!-- Job cards skeleton -->
          <div class="space-y-4">
            <JobCardSkeleton v-for="i in 3" :key="`available-${i}`" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import JobCardSkeleton from './JobCardSkeleton.vue';

defineProps({
  showSecondSection: {
    type: Boolean,
    default: true,
  },
});
</script>

<style scoped>
.welcome-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

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
