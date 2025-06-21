<template>
  <div
    class="w-full max-w-7xl mx-auto px-4 py-6 bg-gray-900 min-h-screen pb-32"
  >
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-normal text-gray-900 dark:text-white mb-2">
        {{ $t('contractorProfile.title') }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400 text-sm">
        {{ $t('contractorProfile.subtitle') }}
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center text-muted-foreground py-10">
      {{ $t('contractorProfile.loading') }}
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="text-center text-red-500 dark:text-red-400 py-10"
    >
      {{ $t('contractorProfile.error', { error }) }}
    </div>

    <!-- Profile Display -->
    <div
      v-else-if="contractor"
      class="bg-transparent border border-gray-100 dark:border-gray-800 rounded-lg p-6"
    >
      <div class="flex items-center mb-6">
        <!-- Profile Photo -->
        <div
          class="h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden mr-4 ring-2 ring-border"
        >
          <!-- Show loading indicator while data is loading -->
          <div v-if="!isLoaded" class="text-sm text-muted-foreground">
            {{ $t('common.loading') }}
          </div>
          <!-- Show profile image if available -->
          <img
            v-else-if="profileImageUrl"
            :src="profileImageUrl"
            :alt="
              $t('contractorProfile.profilePhotoAlt', {
                name: contractor.full_name,
              })
            "
            class="h-full w-full object-cover"
            @error="handleImageError"
          />
          <!-- Fallback emoji if no image -->
          <span v-else class="text-4xl">🧑‍🔧</span>
        </div>
        <div class="flex-1">
          <h2 class="text-2xl font-semibold text-foreground mb-2">
            {{ formatDisplayName(contractor.full_name) }}
          </h2>
          <!-- Skills -->
          <div class="mb-3">
            <span class="text-sm font-medium text-foreground">{{
              $t('contractorProfile.skills')
            }}</span>
            <p class="text-muted-foreground text-sm">
              {{
                contractor.skills && contractor.skills.length > 0
                  ? contractor.skills.map(formatSkill).join(', ')
                  : $t('contractorProfile.noSkills')
              }}
            </p>
          </div>
          <!-- Availability Status -->
          <div class="space-y-2">
            <div class="flex items-center" :class="availabilityTextClass">
              <div
                class="w-2 h-2 rounded-full mr-2"
                :class="availabilityIndicatorClass"
              ></div>
              <span class="text-sm font-medium">{{ availabilityText }}</span>
            </div>
            <div
              v-if="contractor.availability_message"
              class="flex items-center text-muted-foreground"
            >
              <span class="text-sm italic">{{
                contractor.availability_message
              }}</span>
            </div>
            <div v-else class="flex items-center text-muted-foreground">
              <span class="text-sm">{{
                $t('contractorProfile.usuallyRespondsQuickly')
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bio Section -->
      <div v-if="contractor.bio" class="mb-6">
        <h3 class="text-lg font-medium text-foreground mb-3">
          {{ $t('contractorProfile.about') }}
        </h3>
        <p class="text-foreground leading-relaxed">
          {{ contractor.bio }}
        </p>
      </div>

      <!-- Additional Info -->
      <div
        v-if="contractor.years_experience || contractor.district"
        class="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div v-if="contractor.years_experience" class="flex items-center">
          <span class="text-blue-500 mr-2">📅</span>
          <span class="text-sm text-muted-foreground">
            {{
              $t('contractorProfile.experience', {
                years: contractor.years_experience,
              })
            }}
          </span>
        </div>
        <div v-if="contractor.district" class="flex items-center">
          <span class="text-red-500 mr-2">📍</span>
          <span class="text-sm text-muted-foreground">
            {{ contractor.district }}
          </span>
        </div>
      </div>

      <!-- Work Showcase Section -->
      <WorkShowcase
        v-if="contractor.id"
        :contractor-id="contractor.id"
        class="mb-8"
      />
    </div>

    <!-- Enhanced Sticky Contact Section -->
    <div
      v-if="contractor"
      class="fixed bottom-16 md:bottom-0 left-0 right-0 bg-gray-900 backdrop-blur-sm border-t border-border shadow-lg z-[90]"
    >
      <div class="max-w-6xl mx-auto p-4">
        <!-- Contact Success Feedback -->
        <div
          v-if="showContactSuccess"
          class="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center"
        >
          <div
            class="flex items-center justify-center text-green-700 dark:text-green-300"
          >
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="text-sm font-medium">{{
              $t('contractorProfile.chatSuccess')
            }}</span>
          </div>
        </div>

        <!-- Main Contact Button -->
        <Button
          @click="contactContractor"
          :disabled="isContactLoading"
          class="w-full font-semibold py-4 px-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-4 focus:ring-primary/20 transition-all duration-200 transform active:scale-[0.98] min-h-[56px]"
          size="lg"
          :aria-label="
            $t('contractorProfile.contactAriaLabel', {
              name: formatDisplayName(contractor.full_name),
            })
          "
        >
          <div class="flex items-center justify-center">
            <!-- Loading State -->
            <template v-if="isContactLoading">
              <svg
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
              {{ $t('contractorProfile.openingChat') }}
            </template>
            <!-- Default State -->
            <template v-else>
              {{
                $t('contractorProfile.contact', {
                  name: formatDisplayName(contractor.full_name),
                })
              }}
            </template>
          </div>
        </Button>

        <!-- Contact Encouragement Text -->
        <div class="mt-2 text-center">
          <p class="text-xs text-muted-foreground">
            {{ $t('contractorProfile.contactEncouragement') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Not Found State (handled by error state now) -->
    <!-- <div v-else class="text-center text-gray-500 py-10">
      Contractor profile not found.
    </div> -->
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'; // Added computed and watch
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuth } from '@/composables/useAuth';
import Button from '@/components/ui/button/Button.vue';
import { useChatStore } from '@/stores/chat';
import { formatDisplayName } from '@/lib/nameFormatter';
import WorkShowcase from '@/components/contractor/WorkShowcase.vue';

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
const { user, isLoaded, isSignedIn, getSupabaseClient } = useAuth(); // Use our composable
const supabase = getSupabaseClient(); // Get client instance from our composable
const chatStore = useChatStore();

const contractor = ref(null);
const isLoading = ref(true);
const error = ref(null);
const isContactLoading = ref(false);
const profileImageUrl = ref(null);
const showContactSuccess = ref(false);

// Fetch actual data from Supabase
onMounted(async () => {
  const contractorUserId = route.params.id; // Get user_id from route
  if (!contractorUserId) {
    console.error(
      'ContractorProfileView: Contractor ID not found in route params.'
    ); // Added log
    error.value = 'Contractor ID not provided in URL.';
    isLoading.value = false;
    return;
  }

  console.log('Fetching profile for contractor user ID:', contractorUserId);
  isLoading.value = true;
  error.value = null;

  console.log('ContractorProfileView: Starting data fetch...'); // Added log
  try {
    const { data, error: fetchError } = await supabase
      .from('contractor_profiles') // Your table name
      .select('*') // Select all columns for now
      .eq('id', contractorUserId) // Filter by id (UUID)
      .maybeSingle(); // Handle missing profiles gracefully

    console.log('ContractorProfileView: Supabase fetch completed.', {
      data,
      fetchError,
    }); // Added log

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // Code for "Not found"
        console.warn(
          `Contractor profile not found for user ID: ${contractorUserId}`
        );
        error.value = 'Contractor profile not found.';
      } else {
        throw fetchError; // Re-throw other errors
      }
    } else {
      contractor.value = data;
      console.log('Fetched contractor profile:', contractor.value);

      // Set profile image (now directly from Supabase or default)
      // Use profile_picture_url to match the column name used in ContractorListView
      if (contractor.value && contractor.value.profile_picture_url) {
        profileImageUrl.value = contractor.value.profile_picture_url;
        console.log(
          `[CONTRACTOR_PROFILE] Using profile image: ${profileImageUrl.value}`
        );
      } else {
        profileImageUrl.value = null; // Fallback to emoji
        console.log(
          `[CONTRACTOR_PROFILE] No profile image found for ${contractor.value?.full_name}`
        );
      }
    }
  } catch (err) {
    console.error('ContractorProfileView: Error caught during fetch:', err); // Enhanced log
    error.value = `Failed to load profile: ${err.message}`;
  } finally {
    isLoading.value = false;
  }
});

// Helper function to format skill display
const formatSkill = (skill) => {
  return skill
    ? skill.charAt(0).toUpperCase() + skill.slice(1)
    : t('common.notSpecified');
};

// Function to contact the contractor
async function contactContractor() {
  if (!contractor.value || !contractor.value.id) {
    console.error('Cannot contact: No contractor ID available');
    return;
  }

  isContactLoading.value = true;
  error.value = null; // Clear any previous errors
  showContactSuccess.value = false; // Reset success state

  try {
    console.log(
      `Attempting to contact contractor with ID: ${contractor.value.id}`
    );

    // Get or create a chat room with this contractor
    const roomId = await chatStore.createOrGetChatRoom(contractor.value.id);

    if (roomId) {
      console.log(`Successfully created/found chat room with ID: ${roomId}`);

      // Show success feedback briefly before navigation
      showContactSuccess.value = true;

      // Add a small delay to show the success message
      setTimeout(() => {
        // Navigate to the conversation view
        router.push({ name: 'Conversation', params: { roomId } });
      }, 800);
    } else {
      // Check if there's an error in the chat store
      if (chatStore.error) {
        throw new Error(`Chat store error: ${chatStore.error}`);
      } else {
        throw new Error(
          'Failed to create or find chat room (no room ID returned)'
        );
      }
    }
  } catch (err) {
    console.error('Error starting chat:', err);
    error.value = `Could not start chat: ${err.message}`;

    // Add more detailed error information for debugging
    if (err.message.includes('chat_rooms_user_order_check')) {
      console.error(
        'This appears to be a user ordering constraint issue in the database.'
      );
      error.value += ' (User ordering constraint issue)';
    }

    // Hide success message on error
    showContactSuccess.value = false;
  } finally {
    // Keep loading state during navigation delay
    if (!showContactSuccess.value) {
      isContactLoading.value = false;
    }
  }
}

// Profile image is now set directly during onMounted or defaults to null.
// The Clerk-dependent updateProfileImage, syncClerkProfileImageToSupabase, and the watcher for isLoaded are no longer needed.

// If in the future, you want to allow users to update their profile images
// from this component, you would implement a Supabase storage upload function here.

// Computed properties for availability display
const availabilityIndicatorClass = computed(() => {
  if (!contractor.value) return 'bg-gray-400';

  const status = contractor.value.availability_status || 'available';
  const isCurrentlyAvailable = isContractorCurrentlyAvailable(contractor.value);

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
});

const availabilityTextClass = computed(() => {
  if (!contractor.value) return 'text-gray-500 dark:text-gray-400';

  const status = contractor.value.availability_status || 'available';
  const isCurrentlyAvailable = isContractorCurrentlyAvailable(contractor.value);

  if (status === 'available' && isCurrentlyAvailable) {
    return 'text-green-600 dark:text-green-400';
  } else if (status === 'busy') {
    return 'text-yellow-600 dark:text-yellow-400';
  } else if (status === 'offline') {
    return 'text-gray-500 dark:text-gray-400';
  } else if (status === 'away') {
    return 'text-orange-600 dark:text-orange-400';
  } else {
    return 'text-gray-500 dark:text-gray-400';
  }
});

const availabilityText = computed(() => {
  if (!contractor.value) return t('contractorProfile.statusUnknown');

  const status = contractor.value.availability_status || 'available';
  const isCurrentlyAvailable = isContractorCurrentlyAvailable(contractor.value);
  const busyUntil = contractor.value.busy_until;

  if (status === 'available' && isCurrentlyAvailable) {
    return t('availability.availableNow');
  } else if (status === 'available' && !isCurrentlyAvailable) {
    return t('availability.outsideWorkingHours');
  } else if (status === 'busy') {
    if (busyUntil) {
      const busyDate = new Date(busyUntil);
      const now = new Date();
      if (busyDate > now) {
        const diffHours = Math.ceil((busyDate - now) / (1000 * 60 * 60));
        return t('contractorProfile.busyFor', { hours: diffHours });
      }
    }
    return t('contractorProfile.currentlyBusy');
  } else if (status === 'offline') {
    return t('contractorProfile.offline');
  } else if (status === 'away') {
    return t('contractorProfile.away');
  } else {
    return t('contractorProfile.statusUnknown');
  }
});

// Helper function to determine if contractor is currently available
const isContractorCurrentlyAvailable = (contractor) => {
  // Check basic availability status
  if (contractor.availability_status !== 'available') {
    return false;
  }

  // Check if busy until a future time
  if (contractor.busy_until && new Date(contractor.busy_until) > new Date()) {
    return false;
  }

  // Check working hours if they exist
  if (contractor.working_hours) {
    const now = new Date();
    const currentDay = now
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    const daySchedule = contractor.working_hours[currentDay];
    if (daySchedule && !daySchedule.enabled) {
      return false;
    }

    if (daySchedule && daySchedule.start && daySchedule.end) {
      if (currentTime < daySchedule.start || currentTime > daySchedule.end) {
        return false;
      }
    }
  }

  return true;
};

// Handle image loading errors
const handleImageError = () => {
  // Log the error in development mode
  if (import.meta.env.DEV) {
    console.log(
      `Failed to load profile image for ${contractor.value?.full_name}`
    );
  }

  // Set to null to trigger the fallback emoji
  profileImageUrl.value = null;
};
</script>

<style scoped>
/* Add any specific styles for this view if needed */
</style>
