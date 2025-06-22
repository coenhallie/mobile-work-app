<template>
  <div
    class="notification-guide rounded-lg border bg-warning p-4 text-warning-foreground shadow-sm"
  >
    <div class="flex items-start">
      <div class="mt-1 flex-shrink-0 text-warning-foreground/80">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
          />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <div class="ml-3">
        <h3 class="text-sm font-medium text-warning-foreground">
          Notification Permission Required
        </h3>
        <div class="mt-2 text-sm text-warning-foreground/90">
          <p>
            Notifications are currently blocked for this application. To receive
            job alerts and important updates, you'll need to enable
            notifications in your system settings.
          </p>

          <div class="mt-3">
            <button
              class="flex items-center font-medium text-warning-foreground"
              @click="showInstructions = !showInstructions"
            >
              <span
                >{{ showInstructions ? 'Hide' : 'Show' }} system
                instructions</span
              >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                :class="showInstructions ? 'rotate-180' : ''"
                class="ml-1 transition-transform"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          <div v-if="showInstructions" class="mt-3 space-y-3">
            <div v-if="platform === 'darwin'" class="space-y-2">
              <h4 class="font-medium">macOS Instructions:</h4>
              <ol class="list-decimal space-y-1 pl-5">
                <li>
                  Click on the Apple menu (top left) and select "System
                  Settings"
                </li>
                <li>Select "Notifications" from the sidebar</li>
                <li>Find "Mobile Work App" in the application list</li>
                <li>Toggle notifications to "On"</li>
                <li>Restart the application</li>
              </ol>
            </div>

            <div v-else-if="platform === 'win32'" class="space-y-2">
              <h4 class="font-medium">Windows Instructions:</h4>
              <ol class="list-decimal space-y-1 pl-5">
                <li>Click Start and select "Settings"</li>
                <li>Go to "System" > "Notifications"</li>
                <li>Scroll down to find "Mobile Work App"</li>
                <li>Toggle notifications to "On"</li>
                <li>Restart the application</li>
              </ol>
            </div>

            <div v-else-if="platform === 'linux'" class="space-y-2">
              <h4 class="font-medium">Linux Instructions:</h4>
              <ol class="list-decimal space-y-1 pl-5">
                <li>Open your desktop environment's settings</li>
                <li>Look for "Notifications" or "Applications"</li>
                <li>Find "Mobile Work App" in the list</li>
                <li>Enable notifications for the application</li>
                <li>
                  You may need to install a notification server if not already
                  present
                </li>
                <li>Restart the application</li>
              </ol>
            </div>

            <div v-else-if="platform === 'android'" class="space-y-2">
              <h4 class="font-medium">Android Instructions:</h4>
              <ol class="list-decimal space-y-1 pl-5">
                <li>Open your device Settings</li>
                <li>Tap "Apps" or "Applications"</li>
                <li>Find and tap "Mobile Work App"</li>
                <li>Tap "Notifications"</li>
                <li>Toggle "Allow notifications" to On</li>
                <li>Optionally, customize notification categories</li>
              </ol>
            </div>

            <div v-else-if="platform === 'ios'" class="space-y-2">
              <h4 class="font-medium">iOS Instructions:</h4>
              <ol class="list-decimal space-y-1 pl-5">
                <li>Open the Settings app</li>
                <li>Scroll down and tap "Mobile Work App"</li>
                <li>Tap "Notifications"</li>
                <li>Toggle "Allow Notifications" to On</li>
                <li>Customize alert style and options as desired</li>
              </ol>
            </div>

            <div v-else class="space-y-2">
              <h4 class="font-medium">General Instructions:</h4>
              <ol class="list-decimal space-y-1 pl-5">
                <li>Open your system or device settings</li>
                <li>Navigate to application or notification settings</li>
                <li>Find "Mobile Work App" in the list</li>
                <li>Enable notifications for the app</li>
                <li>Restart the application</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="canRequestPermission" class="mt-4">
      <button
        class="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        @click="requestPermission"
      >
        Request Notification Permission
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';

const props = defineProps({
  canRequestPermission: {
    type: Boolean,
    default: false,
  },
  platformOverride: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['permissionRequested']);

const showInstructions = ref(false);
const platform = ref('unknown');
const appName = ref('Mobile Work App');

// Detect platform using user agent
onMounted(() => {
  try {
    // Use platform override if provided
    if (props.platformOverride) {
      platform.value = props.platformOverride;
      console.log('Using platform override:', platform.value);
      return;
    }

    // Detect platform from user agent
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('mac')) {
      platform.value = 'darwin';
    } else if (userAgent.includes('win')) {
      platform.value = 'win32';
    } else if (userAgent.includes('linux')) {
      platform.value = 'linux';
    } else if (userAgent.includes('android')) {
      platform.value = 'android';
    } else if (
      userAgent.includes('iphone') ||
      userAgent.includes('ipad') ||
      userAgent.includes('ipod')
    ) {
      platform.value = 'ios';
    }
    console.log('Detected platform from user agent:', platform.value);
  } catch (error) {
    console.warn('Could not detect platform:', error);
  }
});

// Watch for platform override changes
watch(
  () => props.platformOverride,
  (newValue) => {
    if (newValue) {
      platform.value = newValue;
      console.log('Platform override changed:', platform.value);
    }
  }
);

// Request permission if possible
const requestPermission = async () => {
  emit('permissionRequested');
};
</script>
