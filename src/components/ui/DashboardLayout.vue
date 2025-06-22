<template>
  <div class="client-dashboard bg-white dark:bg-gray-900 min-h-screen">
    <!-- Dashboard Header -->
    <DashboardHeader
      :primary-button-text="primaryButtonText"
      :primary-icon="primaryIcon"
      :stats="stats"
      :active-view="activeView"
      @primary-action="$emit('primary-action')"
      @view-change="$emit('view-change', $event)"
    />

    <!-- Actions Bar -->
    <DashboardActionsBar
      :title="viewTitle"
      :view-mode="viewMode"
      :has-active-filters="hasActiveFilters"
      :active-filters-count="activeFiltersCount"
      @view-mode-change="$emit('view-mode-change', $event)"
      @filter-click="$emit('filter-click')"
    />

    <!-- Main Content -->
    <DashboardContent
      :active-view="activeView"
      :is-loading="isLoading"
      :items="items"
      :view-mode="viewMode"
      :empty-state-title="emptyStateTitle"
      :empty-state-description="emptyStateDescription"
      :empty-action-text="emptyActionText"
      :empty-action-icon="emptyActionIcon"
      :has-more-items="hasMoreItems"
      :is-loading-more="isLoadingMore"
      :loading-text="loadingText"
      :load-more-text="loadMoreText"
      @empty-action="$emit('empty-action')"
      @load-more="$emit('load-more')"
    >
      <!-- Custom content slot (e.g., for applications view) -->
      <template #custom>
        <slot name="custom-content" />
      </template>

      <!-- Item slot for rendering individual items -->
      <template #item="{ item, viewMode }">
        <slot name="item" :item="item" :view-mode="viewMode" />
      </template>
    </DashboardContent>

    <!-- Recent Activity -->
    <div v-if="recentActivity.length > 0" class="px-3 pt-6 pb-4">
      <h3 class="text-lg font-normal text-gray-900 dark:text-white mb-4">
        {{ recentActivityTitle }}
      </h3>
      <div class="space-y-3">
        <div
          v-for="activity in recentActivity.slice(0, 5)"
          :key="activity.id"
          class="flex items-center gap-3 text-sm py-2"
        >
          <div class="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0"></div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">
            {{ formatActivityTime(activity.created_at) }}
          </span>
          <span class="text-gray-900 dark:text-white">
            {{ activity.description }}
          </span>
        </div>
      </div>
    </div>

    <!-- Filter Bottom Sheet Slot -->
    <slot name="filter-sheet" />
  </div>
</template>

<script setup>
import DashboardHeader from './DashboardHeader.vue';
import DashboardActionsBar from './DashboardActionsBar.vue';
import DashboardContent from './DashboardContent.vue';

defineProps({
  // Header props
  primaryButtonText: {
    type: String,
    required: true,
  },
  primaryIcon: {
    type: [String, Object],
    required: true,
  },
  stats: {
    type: Array,
    required: true,
  },
  activeView: {
    type: String,
    required: true,
  },

  // Actions bar props
  viewTitle: {
    type: String,
    required: true,
  },
  viewMode: {
    type: String,
    required: true,
  },
  hasActiveFilters: {
    type: Boolean,
    default: false,
  },
  activeFiltersCount: {
    type: Number,
    default: 0,
  },

  // Content props
  isLoading: {
    type: Boolean,
    default: false,
  },
  items: {
    type: Array,
    default: () => [],
  },
  emptyStateTitle: {
    type: String,
    required: true,
  },
  emptyStateDescription: {
    type: String,
    required: true,
  },
  emptyActionText: {
    type: String,
    required: true,
  },
  emptyActionIcon: {
    type: [String, Object],
    required: true,
  },
  hasMoreItems: {
    type: Boolean,
    default: false,
  },
  isLoadingMore: {
    type: Boolean,
    default: false,
  },
  loadingText: {
    type: String,
    default: 'Loading...',
  },
  loadMoreText: {
    type: String,
    default: 'Load More',
  },

  // Recent activity props
  recentActivity: {
    type: Array,
    default: () => [],
  },
  recentActivityTitle: {
    type: String,
    default: 'Recent Activity',
  },
  formatActivityTime: {
    type: Function,
    default: (timestamp) => new Date(timestamp).toLocaleDateString(),
  },
});

defineEmits([
  'primary-action',
  'view-change',
  'view-mode-change',
  'filter-click',
  'empty-action',
  'load-more',
]);
</script>
