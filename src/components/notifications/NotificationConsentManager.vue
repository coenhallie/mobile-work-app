<template>
  <div class="notification-consent-manager">
    <div
      class="consent-card p-4 bg-white rounded-lg shadow-md border border-gray-200"
    >
      <div class="flex items-start">
        <div class="flex-shrink-0 mt-1">
          <div
            class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
        </div>

        <div class="ml-4 flex-1">
          <h3 class="text-lg font-medium text-gray-900">
            {{ title }}
          </h3>

          <div class="mt-2 text-sm text-gray-600">
            <p>{{ description }}</p>

            <div v-if="showDetails" class="mt-3 space-y-2">
              <div class="flex items-center">
                <span class="font-medium mr-2">Status:</span>
                <span :class="statusClass">{{ permissionStatusText }}</span>
              </div>

              <div class="flex items-center">
                <span class="font-medium mr-2">Mode:</span>
                <span class="text-gray-700">{{ notificationModeText }}</span>
              </div>

              <div v-if="platform" class="flex items-center">
                <span class="font-medium mr-2">Platform:</span>
                <span class="text-gray-700">{{ platform }}</span>
              </div>
            </div>
          </div>

          <div
            class="mt-4 flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0"
          >
            <button
              v-if="canRequestPermission"
              @click="requestPermission"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              :disabled="isLoading"
            >
              <span v-if="isLoading" class="mr-2">
                <svg
                  class="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </span>
              Enable Notifications
            </button>

            <button
              v-if="permissionGranted"
              @click="sendTestNotification"
              class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              :disabled="isLoading"
            >
              Test Notification
            </button>

            <button
              @click="toggleDetails"
              class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {{ showDetails ? 'Hide Details' : 'Show Details' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showHelp && !permissionGranted"
      class="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200"
    >
      <h4 class="text-sm font-medium text-yellow-800">
        Having trouble enabling notifications?
      </h4>
      <ul class="mt-2 text-sm text-yellow-700 list-disc pl-5 space-y-1">
        <li>
          Check your browser settings to ensure notifications are not blocked
        </li>
        <li>
          On mobile devices, you may need to enable notifications in your system
          settings
        </li>
        <li>
          Some browsers require you to interact with the page before allowing
          notification requests
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useNotifications } from '@/composables/useNotifications';

const props = defineProps({
  title: {
    type: String,
    default: 'Enable Notifications',
  },
  description: {
    type: String,
    default: 'Get notified about new jobs, messages, and important updates.',
  },
  showHelp: {
    type: Boolean,
    default: true,
  },
});

const {
  permissionGranted,
  permissionState,
  notificationMode,
  platform,
  canRequestPermission,
  permissionStatusText,
  notificationModeText,
  requestPermission: requestNotificationPermission,
  sendTestNotification: sendTest,
} = useNotifications();

const isLoading = ref(false);
const showDetails = ref(false);

const statusClass = computed(() => {
  switch (permissionState.value) {
    case 'granted':
      return 'text-green-600';
    case 'denied':
      return 'text-red-600';
    case 'unsupported':
      return 'text-orange-600';
    default:
      return 'text-gray-600';
  }
});

const requestPermission = async () => {
  isLoading.value = true;
  try {
    await requestNotificationPermission();
  } catch (error) {
    console.error('Error requesting permission:', error);
  } finally {
    isLoading.value = false;
  }
};

const sendTestNotification = async () => {
  isLoading.value = true;
  try {
    await sendTest();
  } catch (error) {
    console.error('Error sending test notification:', error);
  } finally {
    isLoading.value = false;
  }
};

const toggleDetails = () => {
  showDetails.value = !showDetails.value;
};
</script>

<style scoped>
.notification-consent-manager {
  max-width: 600px;
  margin: 0 auto;
}
</style>
