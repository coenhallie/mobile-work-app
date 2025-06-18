<template>
  <div
    class="contractor-availability-settings bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
  >
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      Availability Settings
    </h3>

    <!-- Current Status -->
    <div class="mb-6">
      <label
        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        Current Status
      </label>
      <div class="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
        <button
          v-for="status in availabilityOptions"
          :key="status.value"
          @click="updateAvailabilityStatus(status.value)"
          class="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg border transition-colors text-sm font-medium min-w-0 flex-1 sm:flex-initial"
          :class="[
            currentStatus === status.value
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
          ]"
        >
          <div
            class="w-2.5 h-2.5 rounded-full flex-shrink-0"
            :class="status.indicatorClass"
          ></div>
          <span class="truncate">{{ status.label }}</span>
        </button>
      </div>
    </div>

    <!-- Status Message -->
    <div class="mb-6">
      <label
        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        Status Message (Optional)
      </label>
      <input
        v-model="statusMessage"
        type="text"
        placeholder="e.g., Back in 2 hours, Available for urgent jobs only"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        maxlength="100"
      />
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
        This message will be shown to clients when they view your profile
      </p>
    </div>

    <!-- Busy Until -->
    <div v-if="currentStatus === 'busy'" class="mb-6">
      <label
        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        Busy Until (Optional)
      </label>
      <input
        v-model="busyUntil"
        type="datetime-local"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        :min="minDateTime"
      />
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Your status will automatically change to "Available" after this time
      </p>
    </div>

    <!-- Working Hours -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-3">
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Working Hours
        </label>
        <button
          @click="showWorkingHours = !showWorkingHours"
          class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {{ showWorkingHours ? 'Hide' : 'Set Working Hours' }}
        </button>
      </div>

      <div v-if="showWorkingHours" class="space-y-3">
        <div
          v-for="day in daysOfWeek"
          :key="day.key"
          class="flex items-center space-x-4"
        >
          <div class="w-20">
            <label class="flex items-center">
              <input
                v-model="workingHours[day.key].enabled"
                type="checkbox"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {{ day.label }}
              </span>
            </label>
          </div>
          <div
            v-if="workingHours[day.key].enabled"
            class="flex items-center space-x-2"
          >
            <input
              v-model="workingHours[day.key].start"
              type="time"
              class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
            <span class="text-gray-500 dark:text-gray-400">to</span>
            <input
              v-model="workingHours[day.key].end"
              type="time"
              class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Auto Availability -->
    <div class="mb-6">
      <label class="flex items-center">
        <input
          v-model="autoAvailability"
          type="checkbox"
          class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
          Automatically manage my availability based on working hours and busy
          periods
        </span>
      </label>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
        When enabled, your status will automatically change based on your
        working hours and busy periods
      </p>
    </div>

    <!-- Save Button -->
    <div class="flex justify-end space-x-3">
      <button
        @click="resetToDefaults"
        class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
      >
        Reset to Defaults
      </button>
      <button
        @click="saveAvailabilitySettings"
        :disabled="isSaving"
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors flex items-center space-x-2"
      >
        <svg
          v-if="isSaving"
          class="animate-spin w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          ></path>
        </svg>
        <span>{{ isSaving ? 'Saving...' : 'Save Settings' }}</span>
      </button>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="message" class="mt-4">
      <div
        class="p-3 rounded-lg text-sm"
        :class="[
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800',
        ]"
      >
        {{ message.text }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useAuth } from '@/composables/useAuth';

const { getSupabaseClient, userId } = useAuth();
const supabase = getSupabaseClient();

// State
const currentStatus = ref('available');
const statusMessage = ref('');
const busyUntil = ref('');
const autoAvailability = ref(true);
const showWorkingHours = ref(false);
const isSaving = ref(false);
const message = ref(null);

// Working hours reactive object
const workingHours = reactive({
  monday: { start: '08:00', end: '18:00', enabled: true },
  tuesday: { start: '08:00', end: '18:00', enabled: true },
  wednesday: { start: '08:00', end: '18:00', enabled: true },
  thursday: { start: '08:00', end: '18:00', enabled: true },
  friday: { start: '08:00', end: '18:00', enabled: true },
  saturday: { start: '09:00', end: '17:00', enabled: true },
  sunday: { start: '09:00', end: '17:00', enabled: false },
});

// Constants
const availabilityOptions = [
  {
    value: 'available',
    label: 'Available',
    indicatorClass: 'bg-green-500 animate-pulse',
  },
  {
    value: 'busy',
    label: 'Busy',
    indicatorClass: 'bg-yellow-500',
  },
  {
    value: 'away',
    label: 'Away',
    indicatorClass: 'bg-orange-500',
  },
  {
    value: 'offline',
    label: 'Offline',
    indicatorClass: 'bg-gray-400',
  },
];

const daysOfWeek = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

// Computed
const minDateTime = computed(() => {
  const now = new Date();
  return now.toISOString().slice(0, 16);
});

// Methods
const loadCurrentSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('contractor_profiles')
      .select(
        'availability_status, availability_message, working_hours, busy_until, auto_availability'
      )
      .eq('user_id', userId.value)
      .single();

    if (error) throw error;

    if (data) {
      currentStatus.value = data.availability_status || 'available';
      statusMessage.value = data.availability_message || '';
      autoAvailability.value = data.auto_availability !== false;

      if (data.busy_until) {
        const busyDate = new Date(data.busy_until);
        busyUntil.value = busyDate.toISOString().slice(0, 16);
      }

      if (data.working_hours) {
        Object.assign(workingHours, data.working_hours);
      }
    }
  } catch (error) {
    console.error('Error loading availability settings:', error);
    showMessage('Failed to load current settings', 'error');
  }
};

const updateAvailabilityStatus = (status) => {
  currentStatus.value = status;
  if (status !== 'busy') {
    busyUntil.value = '';
  }
};

const saveAvailabilitySettings = async () => {
  isSaving.value = true;
  message.value = null;

  try {
    const updateData = {
      availability_status: currentStatus.value,
      availability_message: statusMessage.value || null,
      working_hours: workingHours,
      auto_availability: autoAvailability.value,
      availability_updated_at: new Date().toISOString(),
    };

    if (currentStatus.value === 'busy' && busyUntil.value) {
      updateData.busy_until = new Date(busyUntil.value).toISOString();
    } else {
      updateData.busy_until = null;
    }

    const { error } = await supabase
      .from('contractor_profiles')
      .update(updateData)
      .eq('user_id', userId.value);

    if (error) throw error;

    showMessage('Availability settings saved successfully!', 'success');
  } catch (error) {
    console.error('Error saving availability settings:', error);
    showMessage('Failed to save settings. Please try again.', 'error');
  } finally {
    isSaving.value = false;
  }
};

const resetToDefaults = () => {
  currentStatus.value = 'available';
  statusMessage.value = '';
  busyUntil.value = '';
  autoAvailability.value = true;

  // Reset working hours to defaults
  Object.assign(workingHours, {
    monday: { start: '08:00', end: '18:00', enabled: true },
    tuesday: { start: '08:00', end: '18:00', enabled: true },
    wednesday: { start: '08:00', end: '18:00', enabled: true },
    thursday: { start: '08:00', end: '18:00', enabled: true },
    friday: { start: '08:00', end: '18:00', enabled: true },
    saturday: { start: '09:00', end: '17:00', enabled: true },
    sunday: { start: '09:00', end: '17:00', enabled: false },
  });
};

const showMessage = (text, type) => {
  message.value = { text, type };
  setTimeout(() => {
    message.value = null;
  }, 5000);
};

// Lifecycle
onMounted(() => {
  loadCurrentSettings();
});
</script>

<style scoped>
/* Custom styles for better dark mode support */
input[type='time']::-webkit-calendar-picker-indicator {
  filter: invert(1);
}

.dark input[type='time']::-webkit-calendar-picker-indicator {
  filter: invert(0);
}
</style>
