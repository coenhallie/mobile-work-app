<template>
  <div class="location-test p-6 bg-white dark:bg-gray-900 rounded-lg border">
    <h2 class="text-xl font-bold mb-4">Location Test Component</h2>

    <div class="space-y-4">
      <!-- Status Display -->
      <div class="status-info">
        <p><strong>Supported:</strong> {{ isSupported ? 'Yes' : 'No' }}</p>
        <p><strong>Platform:</strong> {{ isTauri ? 'Tauri' : 'Browser' }}</p>
        <p><strong>Permission:</strong> {{ permissionStatus || 'Unknown' }}</p>
        <p v-if="error" class="text-red-600">
          <strong>Error:</strong> {{ error }}
        </p>
      </div>

      <!-- Current Position -->
      <div
        v-if="currentPosition"
        class="position-info bg-green-50 dark:bg-green-900/20 p-4 rounded"
      >
        <h3 class="font-semibold text-green-800 dark:text-green-200 mb-2">
          Current Position:
        </h3>
        <p><strong>Latitude:</strong> {{ currentPosition.latitude }}</p>
        <p><strong>Longitude:</strong> {{ currentPosition.longitude }}</p>
        <p><strong>Accuracy:</strong> {{ currentPosition.accuracy }}m</p>
        <p>
          <strong>Timestamp:</strong>
          {{ new Date(currentPosition.timestamp).toLocaleString() }}
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="actions space-x-2">
        <button
          @click="checkSupport"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          :disabled="isLoading"
        >
          Check Support
        </button>

        <button
          @click="requestPermissions"
          class="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          :disabled="isLoading || !isSupported"
        >
          Request Permissions
        </button>

        <button
          @click="getCurrentPosition"
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          :disabled="isLoading || !isSupported"
        >
          {{ isLoading ? 'Getting Location...' : 'Get Location' }}
        </button>
      </div>

      <!-- Test Distance Calculation -->
      <div
        v-if="currentPosition"
        class="distance-test bg-blue-50 dark:bg-blue-900/20 p-4 rounded"
      >
        <h3 class="font-semibold text-blue-800 dark:text-blue-200 mb-2">
          Distance Test:
        </h3>
        <p>
          Distance to Lima Center (-12.0464, -77.0428):
          <strong
            >{{
              calculateDistance(
                currentPosition.latitude,
                currentPosition.longitude,
                -12.0464,
                -77.0428
              ).toFixed(2)
            }}km</strong
          >
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useGeolocation } from '@/composables/useGeolocation';

const {
  currentPosition,
  isLoading,
  error,
  permissionStatus,
  isSupported,
  checkSupport,
  requestPermissions,
  getCurrentPosition,
  calculateDistance,
} = useGeolocation();

onMounted(async () => {
  await checkSupport();
});
</script>

<style scoped>
.location-test {
  max-width: 600px;
  margin: 0 auto;
}
</style>
