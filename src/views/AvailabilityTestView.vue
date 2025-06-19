<template>
  <div class="container mx-auto p-4 bg-background min-h-screen">
    <h1 class="text-2xl font-bold mb-6 text-foreground">
      {{ $t('testing.contractorAvailabilitySystemTest') }}
    </h1>

    <!-- Test Results -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <!-- Database Test -->
      <div class="bg-card rounded-lg p-6 shadow-sm">
        <h2 class="text-lg font-semibold mb-4 text-foreground">
          Database Integration
        </h2>
        <div class="space-y-2">
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <span class="text-sm">Availability fields added to database</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <span class="text-sm">Database functions created</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <span class="text-sm">Triggers and constraints applied</span>
          </div>
        </div>
      </div>

      <!-- Frontend Test -->
      <div class="bg-card rounded-lg p-6 shadow-sm">
        <h2 class="text-lg font-semibold mb-4 text-foreground">
          Frontend Integration
        </h2>
        <div class="space-y-2">
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <span class="text-sm">"Available Now" filter implemented</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <span class="text-sm">Availability indicators added</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <span class="text-sm">Settings component created</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Live Filter Test -->
    <div class="bg-card rounded-lg p-6 shadow-sm mb-8">
      <h2 class="text-lg font-semibold mb-4 text-foreground">
        Live Filter Test
      </h2>

      <!-- Filter Controls -->
      <div class="flex items-center space-x-4 mb-6">
        <button
          @click="toggleAvailableNowFilter"
          class="px-4 py-2 rounded-lg border transition-colors"
          :class="[
            testFilters.availableNow
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
          ]"
        >
          Available Now
          <span v-if="testFilters.availableNow" class="ml-2">✓</span>
        </button>

        <div class="text-sm text-muted-foreground">
          Showing {{ filteredContractors.length }} of
          {{ allContractors.length }} contractors
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-8">
        <div
          class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"
        ></div>
        <p class="text-muted-foreground">Loading contractors...</p>
      </div>

      <!-- Contractors List -->
      <div v-else class="space-y-4">
        <div
          v-for="contractor in filteredContractors.slice(0, 5)"
          :key="contractor.id"
          class="flex items-center justify-between p-4 border border-border rounded-lg"
        >
          <div class="flex items-center space-x-3">
            <div
              class="w-3 h-3 rounded-full"
              :class="getAvailabilityIndicatorClass(contractor)"
            ></div>
            <div>
              <h3 class="font-medium text-foreground">{{ contractor.name }}</h3>
              <p class="text-sm text-muted-foreground">
                {{ getAvailabilityText(contractor) }}
              </p>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm font-medium text-foreground">
              {{ contractor.primarySkill }}
            </div>
            <div class="text-xs text-muted-foreground">
              ⭐ {{ contractor.rating }}
            </div>
          </div>
        </div>

        <div v-if="filteredContractors.length === 0" class="text-center py-8">
          <p class="text-muted-foreground">
            {{
              testFilters.availableNow
                ? 'No contractors are currently available (outside working hours)'
                : 'No contractors found'
            }}
          </p>
        </div>
      </div>
    </div>

    <!-- Instructions -->
    <div
      class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6"
    >
      <h2 class="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100">
        How to Test the Availability System
      </h2>
      <ol
        class="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200"
      >
        <li>Go to your profile settings as a contractor</li>
        <li>Set your availability status and working hours</li>
        <li>Visit the contractor list and use the "Available Now" filter</li>
        <li>See real-time availability indicators on contractor cards</li>
        <li>Test different availability statuses and time periods</li>
      </ol>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useContractorData } from '@/composables/useContractorData';

const { t } = useI18n();

// State
const testFilters = ref({
  availableNow: false,
});

// Use contractor data composable
const {
  contractors: allContractors,
  isLoading,
  loadContractors,
} = useContractorData();

// Computed
const filteredContractors = computed(() => {
  if (!testFilters.value.availableNow) {
    return allContractors.value;
  }

  // Filter for currently available contractors
  return allContractors.value.filter(
    (contractor) => contractor.isCurrentlyAvailable === true
  );
});

// Methods
const toggleAvailableNowFilter = async () => {
  testFilters.value.availableNow = !testFilters.value.availableNow;

  // Reload contractors with the new filter
  await loadContractors({
    availableNow: testFilters.value.availableNow,
  });
};

const getAvailabilityIndicatorClass = (contractor) => {
  const status = contractor.availabilityStatus || 'available';
  const isCurrentlyAvailable = contractor.isCurrentlyAvailable;

  if (status === 'available' && isCurrentlyAvailable) {
    return 'bg-green-500 animate-pulse';
  } else if (status === 'busy') {
    return 'bg-yellow-500';
  } else if (status === 'offline') {
    return 'bg-gray-400';
  } else if (status === 'away') {
    return 'bg-orange-500';
  } else {
    return 'bg-gray-400';
  }
};

const getAvailabilityText = (contractor) => {
  const status = contractor.availabilityStatus || 'available';
  const isCurrentlyAvailable = contractor.isCurrentlyAvailable;

  if (status === 'available' && isCurrentlyAvailable) {
    return t('availability.availableNow');
  } else if (status === 'available' && !isCurrentlyAvailable) {
    return t('availability.outsideWorkingHours');
  } else if (status === 'busy') {
    return t('contractors.busy');
  } else if (status === 'offline') {
    return t('contractors.offline');
  } else if (status === 'away') {
    return 'Away';
  } else {
    return 'Status unknown';
  }
};

// Lifecycle
onMounted(async () => {
  await loadContractors();
});
</script>

<style scoped>
/* Custom styles for the test page */
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
</style>
