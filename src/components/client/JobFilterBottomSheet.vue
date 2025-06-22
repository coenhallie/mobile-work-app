<template>
  <BottomSheet
    v-model="isOpen"
    :title="$t('dashboard.filterJobs')"
    height="auto"
    @close="handleClose"
  >
    <div class="p-6 space-y-6">
      <!-- Sort Options -->
      <div class="space-y-3">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white">
          {{ $t('dashboard.sortBy') }}
        </h3>
        <div class="space-y-2">
          <button
            v-for="option in sortOptions"
            :key="option.value"
            @click="selectSort(option.value)"
            class="w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200"
            :class="[
              selectedSort === option.value
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300',
            ]"
          >
            <div class="flex items-center space-x-3">
              <component
                :is="option.icon"
                class="w-5 h-5"
                :class="[
                  selectedSort === option.value
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400',
                ]"
              />
              <div class="text-left">
                <div class="font-medium">{{ option.label }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ option.description }}
                </div>
              </div>
            </div>
            <div
              v-if="selectedSort === option.value"
              class="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"
            >
              <Check class="w-3 h-3 text-white" />
            </div>
          </button>
        </div>
      </div>

      <!-- View Filter -->
      <div class="space-y-3">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white">
          {{ $t('dashboard.showJobs') }}
        </h3>
        <div class="space-y-2">
          <button
            v-for="view in viewOptions"
            :key="view.value"
            @click="selectView(view.value)"
            class="w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200"
            :class="[
              selectedView === view.value
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300',
            ]"
          >
            <div class="flex items-center space-x-3">
              <component
                :is="view.icon"
                class="w-5 h-5"
                :class="[
                  selectedView === view.value
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400',
                ]"
              />
              <div class="text-left">
                <div class="font-medium">{{ view.label }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ view.description }}
                </div>
              </div>
            </div>
            <div
              v-if="selectedView === view.value"
              class="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"
            >
              <Check class="w-3 h-3 text-white" />
            </div>
          </button>
        </div>
      </div>

      <!-- Status Filter -->
      <div class="space-y-3">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white">
          {{ $t('dashboard.jobStatus') }}
        </h3>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="status in statusOptions"
            :key="status.value"
            @click="toggleStatus(status.value)"
            class="flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200"
            :class="[
              selectedStatuses.includes(status.value)
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300',
            ]"
          >
            <div
              class="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors"
              :class="[
                selectedStatuses.includes(status.value)
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 dark:border-gray-600',
              ]"
            >
              <Check
                v-if="selectedStatuses.includes(status.value)"
                class="w-3 h-3 text-white"
              />
            </div>
            <span class="text-sm font-medium">{{ status.label }}</span>
          </button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div
        class="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700"
      >
        <button
          @click="clearFilters"
          class="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {{ $t('common.clear') }}
        </button>
        <button
          @click="applyFilters"
          class="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {{ $t('common.apply') }}
        </button>
      </div>
    </div>
  </BottomSheet>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import BottomSheet from '@/components/ui/BottomSheet/BottomSheet.vue';
import {
  Calendar,
  Users,
  Activity,
  Layers,
  CheckCircle,
  Clock,
  AlertCircle,
  Check,
} from 'lucide-vue-next';

const { t } = useI18n();

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  currentSort: {
    type: String,
    default: 'date',
  },
  currentView: {
    type: String,
    default: 'all',
  },
  currentStatuses: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue', 'apply-filters']);

// Local state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const selectedSort = ref(props.currentSort);
const selectedView = ref(props.currentView);
const selectedStatuses = ref([...props.currentStatuses]);

// Filter options
const sortOptions = computed(() => [
  {
    value: 'date',
    label: t('dashboard.sortByDate'),
    description: t('dashboard.sortByDateDesc'),
    icon: Calendar,
  },
  {
    value: 'applications',
    label: t('dashboard.sortByApplications'),
    description: t('dashboard.sortByApplicationsDesc'),
    icon: Users,
  },
  {
    value: 'status',
    label: t('dashboard.sortByStatus'),
    description: t('dashboard.sortByStatusDesc'),
    icon: Activity,
  },
]);

const viewOptions = computed(() => [
  {
    value: 'all',
    label: t('dashboard.allJobs'),
    description: t('dashboard.allJobsDesc'),
    icon: Layers,
  },
  {
    value: 'active',
    label: t('dashboard.activeJobs'),
    description: t('dashboard.activeJobsDesc'),
    icon: Clock,
  },
  {
    value: 'completed',
    label: t('dashboard.completedJobs'),
    description: t('dashboard.completedJobsDesc'),
    icon: CheckCircle,
  },
  {
    value: 'applications',
    label: t('dashboard.jobsWithApplications'),
    description: t('dashboard.jobsWithApplicationsDesc'),
    icon: Users,
  },
]);

const statusOptions = computed(() => [
  {
    value: 'open',
    label: t('jobStatus.open'),
  },
  {
    value: 'in_progress',
    label: t('jobStatus.inProgress'),
  },
  {
    value: 'completed',
    label: t('jobStatus.completed'),
  },
  {
    value: 'cancelled',
    label: t('jobStatus.cancelled'),
  },
]);

// Methods
const selectSort = (value) => {
  console.log('BottomSheet: Selecting sort:', value);
  selectedSort.value = value;
};

const selectView = (value) => {
  console.log('BottomSheet: Selecting view:', value);
  selectedView.value = value;
};

const toggleStatus = (value) => {
  console.log('BottomSheet: Toggling status:', value);
  const index = selectedStatuses.value.indexOf(value);
  if (index > -1) {
    selectedStatuses.value.splice(index, 1);
  } else {
    selectedStatuses.value.push(value);
  }
  console.log('BottomSheet: Updated statuses:', selectedStatuses.value);
};

const clearFilters = () => {
  selectedSort.value = 'date';
  selectedView.value = 'all';
  selectedStatuses.value = [];
};

const applyFilters = () => {
  const filters = {
    sort: selectedSort.value,
    view: selectedView.value,
    statuses: [...selectedStatuses.value],
  };
  console.log('BottomSheet: Emitting filters:', filters);
  emit('apply-filters', filters);
  isOpen.value = false;
};

const handleClose = () => {
  isOpen.value = false;
};

// Watch for prop changes to sync local state
watch(
  () => props.currentSort,
  (newSort) => {
    selectedSort.value = newSort;
  }
);

watch(
  () => props.currentView,
  (newView) => {
    selectedView.value = newView;
  }
);

watch(
  () => props.currentStatuses,
  (newStatuses) => {
    selectedStatuses.value = [...newStatuses];
  }
);
</script>

<style scoped>
/* Custom animations for smooth interactions */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Haptic feedback simulation */
@media (hover: hover) {
  button:active {
    transform: scale(0.98);
  }
}

/* Enhanced focus states for accessibility */
button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
</style>
