<template>
  <div class="px-3 pb-3">
    <div class="mb-6">
      <button
        @click="$emit('primary-action')"
        class="w-full bg-black dark:bg-white text-white dark:text-black px-6 py-4 rounded-lg font-medium text-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
      >
        <component :is="primaryIcon" class="w-5 h-5 inline mr-2" />
        {{ primaryButtonText }}
      </button>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 gap-3 mb-6">
      <DashboardStatCard
        v-for="stat in stats"
        :key="stat.key"
        :value="stat.value"
        :label="stat.label"
        :is-active="activeView === stat.key"
        :ring-color="stat.ringColor"
        :value-color="stat.valueColor"
        @click="$emit('view-change', stat.key)"
      />
    </div>
  </div>
</template>

<script setup>
import DashboardStatCard from './DashboardStatCard.vue';

defineProps({
  primaryButtonText: {
    type: String,
    required: true,
  },
  primaryIcon: {
    type: [String, Object, Function],
    required: true,
  },
  stats: {
    type: Array,
    required: true,
    // Expected format: [{ key: 'all', value: 5, label: 'Total', ringColor: 'blue', valueColor: 'text-gray-900 dark:text-white' }]
  },
  activeView: {
    type: String,
    required: true,
  },
});

defineEmits(['primary-action', 'view-change']);
</script>
