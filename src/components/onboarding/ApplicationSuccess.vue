<template>
  <div class="text-center space-y-8 py-8">
    <!-- Success Icon -->
    <div
      class="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center"
    >
      <svg
        class="w-10 h-10 text-green-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>

    <!-- Success Message -->
    <div class="space-y-2">
      <h2 class="text-2xl font-bold text-gray-900">
        {{ $t('onboarding.applicationSubmittedTitle') }}
      </h2>
      <p class="text-gray-600">Your application has been sent successfully</p>
    </div>

    <!-- Applied Job Details -->
    <div
      v-if="applicationData?.job"
      class="bg-green-50 border border-green-200 rounded-xl p-4"
    >
      <div class="flex items-center space-x-3">
        <div
          class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0"
        >
          <svg
            class="w-5 h-5 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V8m8 0V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2"
            />
          </svg>
        </div>
        <div class="flex-1 text-left">
          <h4 class="font-semibold text-green-900">
            {{ applicationData.job.title }}
          </h4>
          <p class="text-sm text-green-700">
            Application sent to {{ applicationData.job.clientName || 'client' }}
          </p>
          <p class="text-xs text-green-600 mt-1">
            Expected response: 2-4 hours
          </p>
        </div>
      </div>
    </div>

    <!-- Profile Enhancement Prompt -->
    <div
      class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 space-y-4"
    >
      <div class="flex items-center justify-center space-x-2 text-blue-600">
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        <h3 class="text-lg font-semibold text-blue-900">
          Boost your chances by 3x
        </h3>
      </div>

      <p class="text-blue-700 text-sm">
        Add a profile photo and bio to stand out from other applicants
      </p>

      <div class="flex items-center justify-center space-x-2 text-sm">
        <svg
          class="w-4 h-4 text-yellow-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          />
        </svg>
        <span class="text-yellow-600 font-medium"
          >+50 credits for completion</span
        >
      </div>

      <button
        @click="$emit('enhance-profile')"
        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
      >
        Add Photo & Bio
      </button>
    </div>

    <!-- Notification Permission Prompt -->
    <div class="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
      <div class="flex items-center justify-center space-x-2">
        <svg
          class="w-6 h-6 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 17h5l-5 5v-5zM4.868 19.718l8.485-8.485a2 2 0 012.829 0l1.414 1.414a2 2 0 010 2.829l-8.485 8.485A2 2 0 017.697 24H4a1 1 0 01-1-1v-3.697a2 2 0 01.586-1.414z"
          />
        </svg>
        <h3 class="text-lg font-semibold text-gray-900">
          Get notified instantly
        </h3>
      </div>

      <p class="text-gray-600 text-sm">
        Enable push notifications to know when clients respond to your
        applications
      </p>

      <button
        @click="enableNotifications"
        :disabled="notificationStatus === 'requesting'"
        class="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
      >
        <span v-if="notificationStatus === 'requesting'"
          >Requesting Permission...</span
        >
        <span v-else-if="notificationStatus === 'granted'"
          >✓ Notifications Enabled</span
        >
        <span v-else>Enable Notifications</span>
      </button>
    </div>

    <!-- Action Buttons -->
    <div class="space-y-3 pt-4">
      <button
        @click="$emit('continue-to-dashboard')"
        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
      >
        Continue to Dashboard
      </button>

      <button
        @click="$emit('continue-to-dashboard')"
        class="w-full text-gray-500 hover:text-gray-700 font-medium py-2 transition-colors"
      >
        Maybe Later
      </button>
    </div>

    <!-- Completion Stats -->
    <div class="bg-white border border-gray-200 rounded-lg p-4">
      <div class="grid grid-cols-3 gap-4 text-center">
        <div>
          <div class="text-2xl font-bold text-blue-600">1</div>
          <div class="text-xs text-gray-500">Application</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-green-600">40%</div>
          <div class="text-xs text-gray-500">Profile Complete</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-yellow-600">
            {{ totalCredits }}
          </div>
          <div class="text-xs text-gray-500">Credits Earned</div>
        </div>
      </div>
    </div>

    <!-- Progress Indicator -->
    <div class="text-center">
      <div class="inline-flex items-center space-x-2 text-sm text-gray-500">
        <div class="flex space-x-1">
          <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
          <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
          <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
          <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
          <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
          <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
        </div>
        <span>Onboarding Complete!</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// Props
const props = defineProps({
  applicationData: {
    type: Object,
    default: null,
  },
});

// Emits
const emit = defineEmits(['continue-to-dashboard', 'enhance-profile']);

// Reactive state
const notificationStatus = ref('default'); // 'default', 'requesting', 'granted', 'denied'

// Computed
const totalCredits = computed(() => {
  // Base credits for completing onboarding
  let credits = 25;

  // Additional credits for first application
  credits += 15;

  return credits;
});

// Methods
const enableNotifications = async () => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return;
  }

  if (Notification.permission === 'granted') {
    notificationStatus.value = 'granted';
    return;
  }

  if (Notification.permission === 'denied') {
    // Show alternative method or skip
    return;
  }

  notificationStatus.value = 'requesting';

  try {
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      notificationStatus.value = 'granted';

      // Show a test notification
      new Notification('HandyApp Notifications Enabled!', {
        body: "You'll now receive updates about your job applications.",
        icon: '/favicon.ico',
      });
    } else {
      notificationStatus.value = 'denied';
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    notificationStatus.value = 'default';
  }
};

// Lifecycle
onMounted(() => {
  // Check current notification permission
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      notificationStatus.value = 'granted';
    }
  }
});
</script>

<style scoped>
/* Smooth transitions for all interactive elements */
* {
  transition-property:
    color, background-color, border-color, transform, box-shadow;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

/* Ensure proper button states */
button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

button:disabled:hover {
  transform: none !important;
}

/* Custom gradient backgrounds */
.bg-gradient-to-r {
  background-image: linear-gradient(to right, var(--tw-gradient-stops));
}

.from-blue-50 {
  --tw-gradient-from: #eff6ff;
  --tw-gradient-stops:
    var(--tw-gradient-from), var(--tw-gradient-to, rgba(239, 246, 255, 0));
}

.to-indigo-50 {
  --tw-gradient-to: #eef2ff;
}
</style>
