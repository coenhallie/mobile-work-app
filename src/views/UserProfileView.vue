<template>
  <div class="w-full max-w-7xl mx-auto px-4 py-6 bg-background min-h-screen">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-normal text-foreground mb-2">
        {{ $t('profile.title') }}
      </h1>
      <p class="text-muted-foreground text-sm">
        {{ $t('profile.subtitle') }}
      </p>
    </div>

    <div class="flex flex-col items-center">
      <UserProfile @profileUpdated="handleProfileUpdated" />

      <!-- Notification Permission Guide -->
      <div v-if="permissionState === 'denied'" class="w-full max-w-md mt-8">
        <NotificationPermissionGuide
          :canRequestPermission="canRequestPermission"
          :platformOverride="platform"
          @permissionRequested="handleRequestPermission"
        />
      </div>

      <!-- Notification Preferences Section -->
      <div
        class="w-full max-w-md mt-8 p-4 rounded-lg bg-transparent border border-border"
      >
        <h2 class="text-xl font-normal mb-4 text-foreground">
          {{ $t('profile.notificationPreferences') }}
        </h2>
        <form @submit.prevent="savePreferences" class="space-y-4">
          <div class="flex items-center justify-between">
            <label
              for="enableNotifications"
              class="text-sm font-medium text-foreground"
              >{{ $t('profile.enableNewJobNotifications') }}</label
            >
            <Switch
              id="enableNotifications"
              :checked="preferences.enable_new_job_notifications"
              @update:checked="
                preferences.enable_new_job_notifications = $event
              "
              class="data-[state=checked]:bg-blue-600"
            />
          </div>

          <div>
            <label
              for="quietHoursStart"
              class="block text-sm font-medium text-foreground"
              >{{ $t('profile.quietHoursStart') }}</label
            >
            <Input
              type="time"
              id="quietHoursStart"
              v-model="preferences.quiet_hours_start"
              class="mt-1 block w-full border-border"
              :disabled="!preferences.enable_new_job_notifications"
            />
          </div>

          <div>
            <label
              for="quietHoursEnd"
              class="block text-sm font-medium text-foreground"
              >{{ $t('profile.quietHoursEnd') }}</label
            >
            <Input
              type="time"
              id="quietHoursEnd"
              v-model="preferences.quiet_hours_end"
              class="mt-1 block w-full border-border"
              :disabled="!preferences.enable_new_job_notifications"
            />
          </div>
          <Button type="submit" class="w-full" :disabled="isLoading">
            {{
              isLoading ? $t('profile.saving') : $t('profile.savePreferences')
            }}
          </Button>
          <p v-if="successMessage" class="text-green-600 text-sm mt-2">
            {{ successMessage }}
          </p>
          <p v-if="errorMessage" class="text-destructive text-sm mt-2">
            {{ errorMessage }}
          </p>
        </form>

        <!-- Test Notification Button -->
        <div class="mt-6 pt-4 border-t border-border">
          <h3 class="text-md font-medium mb-2 text-foreground">
            {{ $t('profile.testNotifications') }}
          </h3>
          <p class="text-sm text-muted-foreground mb-3">
            {{ $t('profile.testNotificationDescription') }}
          </p>

          <div class="mb-2 text-sm">
            <span class="font-medium">{{ $t('profile.status') }}: </span>
            <span
              :class="permissionGranted ? 'text-green-600' : 'text-amber-600'"
            >
              {{ permissionStatusText }}
            </span>
          </div>

          <div v-if="canRequestPermission">
            <Button
              @click="handleRequestPermission"
              variant="default"
              class="w-full mb-3"
              :disabled="isRequestingPermission"
            >
              {{
                isRequestingPermission
                  ? $t('profile.requesting')
                  : $t('profile.enableNotifications')
              }}
            </Button>
          </div>

          <Button
            @click="handleTestNotification"
            variant="outline"
            class="w-full"
            :disabled="isTestingNotification || !permissionGranted"
          >
            {{
              isTestingNotification
                ? $t('profile.sending')
                : $t('profile.sendTestNotification')
            }}
          </Button>

          <p
            v-if="notificationTestMessage"
            class="text-sm mt-2"
            :class="
              notificationTestSuccess ? 'text-green-600' : 'text-destructive'
            "
          >
            {{ notificationTestMessage }}
          </p>
        </div>
      </div>

      <!-- Location Settings Section -->
      <div
        class="w-full max-w-md mt-8 p-4 rounded-lg bg-transparent border border-border"
      >
        <h2 class="text-xl font-normal mb-4 text-foreground">
          {{ $t('profile.locationSettings') }}
        </h2>
        <p class="text-sm text-muted-foreground mb-4">
          {{ $t('profile.locationDescription') }}
        </p>

        <!-- Location Status Display -->
        <div class="mb-4 text-sm">
          <div class="flex justify-between items-center mb-2">
            <span class="font-medium"
              >{{ $t('profile.locationPermission') }}:
            </span>
            <span :class="getLocationPermissionColor()">
              {{ getLocationPermissionText() }}
            </span>
          </div>
          <div
            v-if="currentLocation"
            class="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded"
          >
            <h4 class="font-medium text-green-800 dark:text-green-200 mb-2">
              {{ $t('profile.currentLocation') }}:
            </h4>
            <p class="text-sm">
              <strong>{{ $t('profile.latitude') }}:</strong>
              {{ currentLocation.latitude.toFixed(6) }}
            </p>
            <p class="text-sm">
              <strong>{{ $t('profile.longitude') }}:</strong>
              {{ currentLocation.longitude.toFixed(6) }}
            </p>
            <p class="text-sm">
              <strong>{{ $t('profile.accuracy') }}:</strong>
              {{ currentLocation.accuracy }}m
            </p>
            <p class="text-sm">
              <strong>{{ $t('profile.lastUpdated') }}:</strong>
              {{ new Date(currentLocation.timestamp).toLocaleString() }}
            </p>
          </div>
        </div>

        <!-- Location Action Buttons -->
        <div class="space-y-3">
          <Button
            v-if="!locationPermissionGranted"
            @click="handleRequestLocationPermission"
            variant="default"
            class="w-full"
            :disabled="isRequestingLocationPermission || !locationSupported"
          >
            {{
              isRequestingLocationPermission
                ? $t('profile.requesting')
                : $t('profile.enableLocationAccess')
            }}
          </Button>

          <Button
            v-else
            @click="handleGetCurrentLocation"
            variant="outline"
            class="w-full"
            :disabled="isGettingLocation"
          >
            {{
              isGettingLocation
                ? $t('profile.updatingLocation')
                : $t('profile.updateLocation')
            }}
          </Button>
        </div>

        <!-- Location Error/Success Messages -->
        <div v-if="locationMessage" class="mt-4">
          <p
            class="text-sm"
            :class="
              locationMessageSuccess ? 'text-green-600' : 'text-destructive'
            "
          >
            {{ locationMessage }}
          </p>
        </div>
      </div>

      <!-- Theme Settings -->
      <div class="w-full max-w-md mt-8">
        <ThemeSettings />
      </div>

      <!-- Language Settings -->
      <div
        class="w-full max-w-md mt-8 p-4 rounded-lg bg-transparent border border-border"
      >
        <h2 class="text-xl font-normal mb-4 text-foreground">
          {{ $t('profile.language') }}
        </h2>
        <div class="flex flex-col gap-3">
          <p class="text-sm text-muted-foreground">
            {{ $t('profile.preferences') }}
          </p>
          <LanguageToggle />
        </div>
      </div>

      <!-- Biometric Authentication Settings -->
      <div class="w-full max-w-md mt-8">
        <BiometricSettings />
      </div>

      <!-- Payment History Section -->
      <div
        class="w-full max-w-md mt-8 p-4 rounded-lg bg-transparent border border-border"
      >
        <h2 class="text-xl font-normal mb-4 text-foreground">
          {{ $t('payment.paymentHistory') }}
        </h2>

        <!-- Loading State -->
        <div
          v-if="isLoadingPayments"
          class="flex items-center justify-center py-8"
        >
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
          ></div>
          <span class="ml-2 text-sm text-muted-foreground">{{
            $t('payment.loadingHistory')
          }}</span>
        </div>

        <!-- Payment History List -->
        <div v-else-if="paymentHistory.length > 0" class="space-y-3">
          <PaymentHistoryItem
            v-for="payment in paymentHistory"
            :key="payment.id"
            :payment="payment"
            :can-request-refund="false"
            @request-refund="handleRefundRequest"
            @view-receipt="handleViewReceipt"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-8">
          <svg
            class="w-12 h-12 mx-auto text-muted-foreground mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1"
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            ></path>
          </svg>
          <p class="text-muted-foreground text-sm">
            {{ $t('payment.noPaymentHistory') }}
          </p>
        </div>

        <!-- Error State -->
        <div
          v-if="paymentHistoryError"
          class="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mt-4"
        >
          <p class="text-sm text-destructive">{{ paymentHistoryError }}</p>
        </div>
      </div>

      <div v-if="isSignedIn" class="w-full max-w-xs mt-8">
        <Button
          @click="handleSignOut"
          variant="destructive"
          size="sm"
          class="logout-button w-full"
          :disabled="isSigningOut"
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
            class="mr-1"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          {{ isSigningOut ? $t('profile.signingOut') : $t('profile.logout') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import { useCulqi } from '@/composables/useCulqi';
import { useGeolocation } from '@/composables/useGeolocation';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useTauriNotifications } from '@/composables/useTauriNotifications';
import NotificationPermissionGuide from '@/components/notifications/NotificationPermissionGuide.vue';
import BiometricSettings from '@/components/settings/BiometricSettings.vue';
import ThemeSettings from '@/components/settings/ThemeSettings.vue';
import UserProfile from '@/components/UserProfile.vue';
import LanguageToggle from '@/components/ui/LanguageToggle.vue';
import PaymentHistoryItem from '@/components/payments/PaymentHistoryItem.vue';

const { t } = useI18n();
const router = useRouter();
const { userId, getSupabaseClient, isSignedIn, signOut, getToken } = useAuth();
const { fetchPaymentHistory } = useCulqi();

// Initialize geolocation composable
const {
  currentPosition,
  isLoading: isLocationLoading,
  error: locationError,
  permissionStatus: locationPermissionStatus,
  isSupported: locationSupported,
  checkSupport,
  requestPermissions,
  getCurrentPosition,
} = useGeolocation();

// Create a Supabase client using Supabase authentication
let supabase = null;

const preferences = ref({
  enable_new_job_notifications: true,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
});

const isLoading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const isTestingNotification = ref(false);
const isRequestingPermission = ref(false);
const notificationTestMessage = ref('');
const notificationTestSuccess = ref(false);
const isSigningOut = ref(false);

// Payment history state
const paymentHistory = ref([]);
const isLoadingPayments = ref(false);
const paymentHistoryError = ref('');

// Location state
const currentLocation = ref(null);
const isCheckingLocation = ref(false);
const isRequestingLocationPermission = ref(false);
const isGettingLocation = ref(false);
const locationMessage = ref('');
const locationMessageSuccess = ref(false);
const locationPermissionGranted = computed(
  () => locationPermissionStatus.value === 'granted'
);

// Initialize Tauri notifications
const {
  initializeNotifications,
  permissionGranted,
  permissionState,
  isSupported,
  platform,
  canRequestPermission,
  permissionStatusText,
  requestPermission,
  sendNotification,
  sendTestNotification,
} = useTauriNotifications();

const fetchPreferences = async () => {
  if (!isMounted.value) {
    console.log('fetchPreferences: Component unmounted, aborting');
    return;
  }

  if (!userId.value) {
    console.log('fetchPreferences: No user ID available');
    return;
  }

  if (!supabase) {
    console.log('fetchPreferences: Supabase client not initialized');
    return;
  }

  console.log(`fetchPreferences: Fetching for user ID ${userId.value}`);
  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    console.log('Using get_notification_preferences function...');
    const { data, error } = await supabase.rpc('get_notification_preferences', {
      p_user_id: userId.value,
    });

    // Check if component is still mounted before updating state
    if (!isMounted.value) {
      console.log('Component unmounted during fetch, aborting state update');
      return;
    }

    if (error) {
      console.error('Error fetching preferences:', error);
      throw error;
    }

    if (data && Object.keys(data).length > 0) {
      console.log('Preferences data loaded:', data);
      preferences.value = {
        enable_new_job_notifications: data.enable_new_job_notifications,
        // Ensure time is formatted as HH:MM for the input type="time"
        quiet_hours_start: data.quiet_hours_start
          ? data.quiet_hours_start.substring(0, 5)
          : '22:00',
        quiet_hours_end: data.quiet_hours_end
          ? data.quiet_hours_end.substring(0, 5)
          : '08:00',
      };
    } else {
      // If no preferences found, use defaults and potentially create a new record on save
      console.log('No existing preferences found, using defaults.');
    }
  } catch (err) {
    if (isMounted.value) {
      console.error('Error fetching preferences:', err);
      errorMessage.value = t('profile.loadPreferencesError', {
        error: err.message || t('profile.unknownError'),
      });
    }
  } finally {
    if (isMounted.value) {
      isLoading.value = false;
    }
  }
};

const savePreferences = async () => {
  if (!isMounted.value) {
    console.log('savePreferences: Component unmounted, aborting');
    return;
  }

  if (!userId.value) {
    errorMessage.value = t('profile.userNotAuthenticated');
    console.log('savePreferences: No user ID available');
    return;
  }

  if (!supabase) {
    errorMessage.value = t('profile.dbConnectionError');
    console.log('savePreferences: Supabase client not initialized');
    return;
  }

  console.log(`savePreferences: Saving for user ID ${userId.value}`);
  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  // Ensure time values include seconds if your DB expects TIME WITHOUT TIME ZONE 'HH:MM:SS'
  const prefsToSave = {
    user_id: userId.value,
    enable_new_job_notifications:
      preferences.value.enable_new_job_notifications,
    quiet_hours_start: preferences.value.quiet_hours_start
      ? `${preferences.value.quiet_hours_start}:00`
      : null,
    quiet_hours_end: preferences.value.quiet_hours_end
      ? `${preferences.value.quiet_hours_end}:00`
      : null,
    updated_at: new Date().toISOString(), // Let the DB trigger handle this if preferred
  };

  console.log('Preferences data to save:', prefsToSave);

  // Use the consolidated save_notification_preferences function
  try {
    console.log('Using save_notification_preferences function...');
    const { data, error } = await supabase.rpc(
      'save_notification_preferences',
      {
        p_user_id: userId.value,
        p_enable_notifications: preferences.value.enable_new_job_notifications,
        p_quiet_hours_start: prefsToSave.quiet_hours_start,
        p_quiet_hours_end: prefsToSave.quiet_hours_end,
      }
    );

    // Check if component is still mounted before updating state
    if (!isMounted.value) {
      console.log('Component unmounted during save, aborting state update');
      return;
    }

    if (error) {
      console.error('Error saving preferences:', error);
      throw error;
    }

    console.log('Preferences saved successfully:', data);
    successMessage.value = t('profile.savePreferencesSuccess');
  } catch (err) {
    // Check if component is still mounted before updating error state
    if (!isMounted.value) {
      console.log('Component unmounted during error handling, aborting');
      return;
    }

    console.error('Error saving preferences:', err);
    errorMessage.value = t('profile.savePreferencesError', {
      error: err.message || t('profile.unknownError'),
    });

    // Try direct table access as a fallback
    try {
      console.log('Attempting direct table access as fallback...');
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .upsert(prefsToSave, { onConflict: 'user_id' });

      // Check again if component is still mounted
      if (!isMounted.value) return;

      if (error) {
        console.error('Fallback error:', error);
      } else {
        console.log('Fallback success');
        successMessage.value = t('profile.savePreferencesSuccess');
      }
    } catch (fallbackErr) {
      if (isMounted.value) {
        console.error('Fallback exception:', fallbackErr);
      }
    }
  } finally {
    if (isMounted.value) {
      isLoading.value = false;
    }
  }
};

// Location handler functions
const getLocationPermissionColor = () => {
  switch (locationPermissionStatus.value) {
    case 'granted':
      return 'text-green-600';
    case 'denied':
      return 'text-red-600';
    case 'prompt':
    case 'prompt-with-rationale':
      return 'text-yellow-600';
    default:
      return 'text-gray-600';
  }
};

const getLocationPermissionText = () => {
  switch (locationPermissionStatus.value) {
    case 'granted':
      return t('profile.granted');
    case 'denied':
      return t('profile.denied');
    case 'prompt':
      return t('profile.notRequested');
    case 'prompt-with-rationale':
      return t('profile.needsRationale');
    default:
      return t('profile.unknown');
  }
};

const handleCheckLocationSupport = async () => {
  isCheckingLocation.value = true;
  locationMessage.value = '';

  try {
    const supported = await checkSupport();
    locationMessageSuccess.value = true;
    locationMessage.value = supported
      ? t('profile.locationSupportConfirmed')
      : t('profile.locationNotSupported');
  } catch (error) {
    locationMessageSuccess.value = false;
    locationMessage.value = t('profile.errorCheckingLocation', {
      error: error.message,
    });
  } finally {
    isCheckingLocation.value = false;
  }
};

const handleRequestLocationPermission = async () => {
  isRequestingLocationPermission.value = true;
  locationMessage.value = '';

  try {
    // First, ensure support is checked, similar to ContractorFilters
    const supported = await checkSupport();
    if (!supported) {
      locationMessageSuccess.value = false;
      locationMessage.value = t('profile.locationNotSupported');
      isRequestingLocationPermission.value = false;
      return;
    }

    const granted = await requestPermissions();
    locationMessageSuccess.value = granted;
    locationMessage.value = granted
      ? t('profile.locationPermissionGranted')
      : t('profile.locationPermissionDenied');
  } catch (error) {
    locationMessageSuccess.value = false;
    locationMessage.value = t('profile.errorRequestingLocationPermission', {
      error: error.message,
    });
  } finally {
    isRequestingLocationPermission.value = false;
  }
};

const handleGetCurrentLocation = async () => {
  isGettingLocation.value = true;
  locationMessage.value = '';

  try {
    const position = await getCurrentPosition();
    if (position) {
      currentLocation.value = position;
      locationMessageSuccess.value = true;
      locationMessage.value = t('profile.locationRetrievedSuccessfully');
    } else {
      locationMessageSuccess.value = false;
      locationMessage.value = t('profile.failedToGetLocation');
    }
  } catch (error) {
    locationMessageSuccess.value = false;
    locationMessage.value = t('profile.errorGettingLocation', {
      error: error.message,
    });
  } finally {
    isGettingLocation.value = false;
  }
};

// Function to request notification permission
const handleRequestPermission = async () => {
  if (!isMounted.value) {
    console.log('handleRequestPermission: Component unmounted, aborting');
    return;
  }

  isRequestingPermission.value = true;
  try {
    console.log('Requesting Tauri notification permission...');
    const granted = await requestPermission();
    console.log('Permission request result:', granted);

    // Check if component is still mounted before updating state
    if (!isMounted.value) {
      console.log(
        'Component unmounted during permission request, aborting state update'
      );
      return;
    }

    if (granted) {
      notificationTestMessage.value = t('profile.permissionGrantedSuccess');
      notificationTestSuccess.value = true;
    } else {
      notificationTestMessage.value = t('profile.permissionDeniedError');
      notificationTestSuccess.value = false;
    }
  } catch (error) {
    // Check if component is still mounted before updating error state
    if (!isMounted.value) {
      console.log('Component unmounted during error handling, aborting');
      return;
    }

    console.error('Error requesting permission:', error);
    notificationTestMessage.value = t('profile.permissionRequestError', {
      error: error.message || t('profile.unknownError'),
    });
    notificationTestSuccess.value = false;
  } finally {
    if (isMounted.value) {
      isRequestingPermission.value = false;
    }
  }
};

// Function to send a test notification
const handleTestNotification = async () => {
  if (!isMounted.value) {
    console.log('handleTestNotification: Component unmounted, aborting');
    return;
  }

  isTestingNotification.value = true;
  notificationTestMessage.value = '';
  notificationTestSuccess.value = false;

  console.log('=== TEST NOTIFICATION DIAGNOSTICS ===');
  console.log('Notification Support:', isSupported.value);
  console.log('Permission Granted:', permissionGranted.value);
  console.log('Permission State:', permissionState.value);
  console.log('Platform:', platform.value);
  console.log('User ID:', userId.value || 'Not set');

  try {
    // Check if notifications are supported
    if (!isSupported.value) {
      throw new Error(t('profile.notificationsNotSupported'));
    }

    if (!permissionGranted.value) {
      console.log('Notification permission not granted');

      if (isMounted.value) {
        notificationTestMessage.value = t('profile.permissionNotGrantedError');
      }
      return;
    }

    // Send test notification with more details
    console.log('Sending test notification...');
    const result = await sendTestNotification();

    // Check if component is still mounted before updating state
    if (!isMounted.value) {
      console.log(
        'Component unmounted during notification test, aborting state update'
      );
      return;
    }

    notificationTestSuccess.value = true;
    notificationTestMessage.value = t(
      'profile.testNotificationSentSuccessfully'
    );
    console.log('Test notification result:', result);
  } catch (error) {
    // Check if component is still mounted before updating error state
    if (!isMounted.value) {
      console.log('Component unmounted during error handling, aborting');
      return;
    }

    console.error('Error sending test notification:', error);
    notificationTestMessage.value = t('profile.failedToSendTestNotification', {
      error: error.message || 'Unknown error',
    });

    // Provide more helpful error message based on platform
    if (platform.value) {
      const platformName =
        platform.value === 'darwin'
          ? t('profile.macOS')
          : platform.value === 'win32'
            ? t('profile.windows')
            : platform.value === 'android'
              ? t('profile.android')
              : platform.value === 'ios'
                ? t('profile.iOS')
                : t('profile.system');
      notificationTestMessage.value += ` ${t('profile.checkNotificationSettings', { platform: platformName })}`;
    }
  } finally {
    if (isMounted.value) {
      isTestingNotification.value = false;
    }
    console.log('=== END TEST NOTIFICATION DIAGNOSTICS ===');
  }
};

// Handle sign out
const handleSignOut = async () => {
  isSigningOut.value = true;
  try {
    const result = await signOut();
    if (result.success) {
      // Redirect to home page after successful sign out
      window.location.href = '/';
    } else {
      console.error('Sign out failed:', result.error);
    }
  } catch (error) {
    console.error('Sign out error:', error);
  } finally {
    isSigningOut.value = false;
  }
};

// Handle profile updates from UserProfile component
const handleProfileUpdated = (updateData) => {
  console.log('Profile updated:', updateData);
  // The UserProfile component already handles the local state update
  // This could be used to trigger other actions if needed
};

// Payment history functions
const loadPaymentHistory = async () => {
  if (!userId.value) return;

  isLoadingPayments.value = true;
  paymentHistoryError.value = '';

  try {
    const history = await fetchPaymentHistory();
    paymentHistory.value = history;
  } catch (error) {
    console.error('Error loading payment history:', error);
    paymentHistoryError.value = t('payment.historyError', {
      error: error.message,
    });
  } finally {
    isLoadingPayments.value = false;
  }
};

const handleRefundRequest = (payment) => {
  console.log('Refund requested for payment:', payment);
  // TODO: Implement refund request functionality
  alert(t('payment.refundNotImplemented'));
};

const handleViewReceipt = (payment) => {
  console.log('View receipt for payment:', payment);
  // TODO: Implement receipt viewing functionality
  alert(t('payment.receiptNotImplemented'));
};

// Flag to track if component is mounted
const isMounted = ref(true);
let unwatchUserId = null;

onMounted(async () => {
  // Set mounted flag
  isMounted.value = true;

  try {
    // Initialize Supabase client with more debugging
    const tokenFn = typeof getToken === 'function' ? getToken : getToken.value;

    // Log token information
    try {
      const token = await tokenFn();
      console.log('Supabase token available:', !!token);
      console.log('Token length:', token ? token.length : 0);
      if (token) {
        console.log('Token prefix:', token.substring(0, 15) + '...');
      }
    } catch (err) {
      console.error('Error getting token:', err);
    }

    // Create client with debug info
    if (isMounted.value) {
      supabase = getSupabaseClient();
      console.log('Supabase client initialized with auth');
      console.log('Supabase client type:', supabase ? typeof supabase : 'null');
    }

    // Test a simple query to verify connection
    if (isMounted.value && supabase) {
      try {
        const { data, error } = await supabase
          .from('job_postings')
          .select('id')
          .limit(1);
        console.log('Test query result:', { data, error });
      } catch (err) {
        console.error('Test query error:', err);
      }
    }

    // Supabase userId might take a moment to be available
    unwatchUserId = watch(
      userId,
      (newVal) => {
        if (newVal && supabase && isMounted.value) {
          console.log(`User ID is now available: ${newVal}`);
          fetchPreferences();
          loadPaymentHistory();
          // Don't unwatch here - we'll do it in onUnmounted
        }
      },
      { immediate: true }
    );

    // Fallback if userId is already available on mount but watch didn't catch it immediately
    if (userId.value && supabase && !isLoading.value && isMounted.value) {
      console.log(`User ID already available on mount: ${userId.value}`);
      fetchPreferences();
    }

    // Initialize Tauri notifications
    initializeNotifications();

    // Initialize Geolocation Support
    console.log(
      '[UserProfileView] onMounted: Initializing geolocation support...'
    );
    await handleCheckLocationSupport(); // This already calls checkSupport and sets messages
    // Alternatively, call checkSupport() directly if messages aren't needed immediately:
    // await checkSupport();
    // console.log('[UserProfileView] onMounted: Geolocation support check complete. Status:', locationPermissionStatus.value, 'Supported:', locationSupported.value);
  } catch (err) {
    console.error('Error during component initialization:', err);
  }
});

// Clean up resources when component is unmounted
onUnmounted(() => {
  console.log('UserProfileView unmounting, cleaning up resources');
  isMounted.value = false;

  // Stop watching for userId changes
  if (unwatchUserId) {
    unwatchUserId();
  }

  // Clear any pending state
  isLoading.value = false;
  isTestingNotification.value = false;
  isRequestingPermission.value = false;
});
</script>

<style scoped>
/* Optional: Add custom styles for the container if needed */
.user-profile {
  /* Target user profile component if necessary */
  /* Example: width: 100%; max-width: 600px; */
}
/* Add any additional styles for the preferences form */
</style>
