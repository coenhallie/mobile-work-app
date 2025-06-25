<template>
  <div class="w-full max-w-md mx-auto text-card-foreground p-6 bg-transparent">
    <!-- Profile Header -->
    <div class="flex flex-col items-center mb-6">
      <!-- Profile Picture -->
      <div class="relative mb-4">
        <div
          class="w-24 h-24 rounded-full overflow-hidden border-2 border-border"
        >
          <img
            v-if="getCachedBustedImageUrl"
            :src="getCachedBustedImageUrl"
            :alt="`${displayName || 'User'}'s profile picture`"
            class="w-full h-full object-cover"
            @error="handleImageError"
          />
          <div
            v-else
            class="w-full h-full flex items-center justify-center text-primary"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        </div>

        <!-- Upload Button -->
        <button
          @click="triggerFileInput"
          :disabled="isUploading"
          class="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Change profile picture"
        >
          <svg
            v-if="!isUploading"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"
            ></path>
            <circle cx="12" cy="13" r="3"></circle>
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="animate-spin"
          >
            <path d="M21 12a9 9 0 11-6.219-8.56"></path>
          </svg>
        </button>

        <!-- Hidden file input -->
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          @change="handleFileSelect"
          class="hidden"
        />
      </div>

      <!-- User Name -->
      <div class="text-center">
        <h2 class="text-xl font-semibold text-foreground mb-1">
          {{ displayName || $t('profile.user') }}
        </h2>
        <p class="text-sm text-muted-foreground">
          {{ userEmail || $t('profile.noEmailAvailable') }}
        </p>
      </div>
    </div>

    <!-- User Information -->
    <div class="space-y-4">
      <div class="border-t border-border pt-4">
        <h3 class="text-lg font-medium text-foreground mb-3">
          {{ $t('profile.profileInformation') }}
        </h3>

        <!-- Name Input -->
        <div class="space-y-2">
          <label
            for="displayName"
            class="block text-sm font-medium text-foreground"
          >
            {{ $t('profile.displayName') }}
          </label>
          <Input
            id="displayName"
            v-model="editableDisplayName"
            :placeholder="$t('profile.displayNamePlaceholder')"
            class="w-full border-border"
          />
        </div>

        <!-- Bio Input -->
        <div class="space-y-2 mt-4">
          <label for="bio" class="block text-sm font-medium text-foreground">
            {{ $t('profile.bioLabel') }}
          </label>
          <textarea
            id="bio"
            v-model="editableBio"
            :placeholder="$t('profile.bioPlaceholderProfile')"
            rows="3"
            class="w-full px-3 py-2 rounded-md bg-background text-foreground border border-border placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          ></textarea>
        </div>

        <!-- Phone Input -->
        <div class="space-y-2 mt-4">
          <label for="phone" class="block text-sm font-medium text-foreground">
            {{ $t('profile.phoneNumber') }}
          </label>
          <Input
            id="phone"
            v-model="editablePhone"
            :placeholder="$t('profile.phoneNumberPlaceholder')"
            type="tel"
            class="w-full border-border"
          />
        </div>

        <!-- Location Input -->
        <div class="space-y-2 mt-4">
          <label class="block text-sm font-medium text-foreground">
            {{
              userRole === 'contractor'
                ? $t('profile.workLocations')
                : $t('profile.location')
            }}
          </label>

          <!-- Selected Locations Display -->
          <div v-if="editableLocations.length > 0" class="space-y-2">
            <div class="flex items-center justify-between">
              <div class="text-sm text-muted-foreground">
                {{
                  $t('profile.selectedLocations', {
                    count: editableLocations.length,
                  })
                }}
              </div>
              <!-- Show/Hide toggle button only if more than 5 locations -->
              <button
                v-if="editableLocations.length > 5"
                @click="showAllLocations = !showAllLocations"
                class="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                type="button"
              >
                <span>{{
                  showAllLocations
                    ? $t('profile.showLess')
                    : $t('profile.showAll')
                }}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  :class="[
                    'transition-transform duration-200',
                    showAllLocations ? 'rotate-180' : '',
                  ]"
                >
                  <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
              </button>
            </div>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="location in displayedLocations"
                :key="location.id"
                class="inline-flex items-center gap-2 px-3 py-1 text-primary rounded-full text-sm border border-primary/20"
              >
                <span>{{ location.displayText }}</span>
                <button
                  @click="removeLocation(location.id)"
                  type="button"
                  class="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                  :aria-label="`Remove ${location.displayText}`"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Select Work Areas Button -->
          <Button
            @click="navigateToLocationSelection"
            variant="outline"
            class="w-full"
            type="button"
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
              class="mr-2"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            {{
              editableLocations.length === 0
                ? userRole === 'contractor'
                  ? $t('profile.selectWorkAreas')
                  : $t('profile.selectLocation')
                : userRole === 'contractor'
                  ? $t('profile.editWorkAreas')
                  : $t('profile.changeLocation')
            }}
          </Button>
        </div>

        <!-- Skills Selection for Contractors -->
        <div v-if="userRole === 'contractor'" class="space-y-2 mt-4">
          <label class="block text-sm font-medium text-foreground">
            {{ $t('profile.skillsAndServices') }}
          </label>
          <div class="space-y-3">
            <!-- Selected Skills Display -->
            <div v-if="editableSkills.length > 0" class="flex flex-wrap gap-2">
              <span
                v-for="(skill, index) in editableSkills"
                :key="index"
                class="inline-flex items-center px-3 py-1 text-primary text-sm rounded-full border border-primary/20"
              >
                {{ skill }}
                <button
                  @click="removeSkill(index)"
                  class="ml-2 text-primary/70 hover:text-primary"
                  type="button"
                >
                  ×
                </button>
              </span>
            </div>

            <!-- Add Skills Button -->
            <Button
              @click="openSkillsModal"
              type="button"
              variant="outline"
              class="w-full"
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
                class="mr-2"
              >
                <path d="M12 4v16m8-8H4" />
              </svg>
              {{
                editableSkills.length > 0
                  ? $t('profile.editSkills')
                  : $t('profile.addSkills')
              }}
            </Button>

            <!-- Empty State -->
            <p
              v-if="editableSkills.length === 0"
              class="text-sm text-muted-foreground"
            >
              {{ $t('profile.skillsDescription') }}
            </p>
          </div>
        </div>

        <!-- Availability Settings for Contractors -->
        <div v-if="userRole === 'contractor'" class="mt-6">
          <ContractorAvailabilitySettings />
        </div>
      </div>

      <!-- Member Since -->
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-foreground">{{
          $t('profile.memberSince')
        }}</span>
        <span class="text-sm text-muted-foreground">
          {{ memberSince }}
        </span>
      </div>
    </div>

    <!-- Save Button -->
    <div class="mt-6 pt-4 border-t border-border">
      <Button
        @click="saveProfile"
        :disabled="isSaving || !hasChanges"
        class="w-full"
      >
        {{ isSaving ? $t('profile.saving') : $t('profile.saveChanges') }}
      </Button>
    </div>

    <!-- Status Messages -->
    <div v-if="statusMessage" class="mt-4">
      <p
        :class="[
          'text-sm text-center',
          statusType === 'success' ? 'text-green-600' : 'text-destructive',
        ]"
      >
        {{ statusMessage }}
      </p>
    </div>

    <!-- Skills Selection Modal -->
    <SkillsSelectionModal
      :is-open="isSkillsModalOpen"
      :initial-skills="editableSkills"
      @close="closeSkillsModal"
      @save="handleSkillsSave"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuth } from '@/composables/useAuth';
import { useProfileState } from '@/composables/useProfileState';

const { t } = useI18n();
import {
  uploadProfileImage,
  updateUserProfileWithProfileImage,
} from '@/lib/supabaseClientManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Keep Input if used elsewhere, or remove if not
import SkillsSelectionModal from '@/components/profile/SkillsSelectionModal.vue';
import ContractorAvailabilitySettings from '@/components/contractor/ContractorAvailabilitySettings.vue';

// Define emits
const emit = defineEmits(['profileUpdated']);

// Router
const router = useRouter();

// Auth composable
const { user, userId, userEmail, userRole, getSupabaseClient } = useAuth();

// Profile state composable
const {
  profileImageUrl: globalProfileImageUrl,
  profileName: globalProfileName,
  getCachedBustedImageUrl,
  updateProfileImage,
  updateProfileName,
} = useProfileState();

// Refs
const fileInput = ref(null);
const isUploading = ref(false);
const isSaving = ref(false);
const statusMessage = ref('');
const statusType = ref('success');

// Profile data
const displayName = ref('');
const editableDisplayName = ref('');
const editableBio = ref('');
const editablePhone = ref('');
const editableLocations = ref([]); // Will store array of location objects
const editableSkills = ref([]);
const showAllLocations = ref(false); // Controls whether to show all locations or just first 5

// Helper functions for location handling
const arraysEqual = (a, b) => {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
};

const getOriginalLocationIds = () => {
  if (userRole.value === 'contractor') {
    // For contractors, convert service_areas to location IDs
    const serviceAreas = originalProfile.value.service_areas || [];
    if (Array.isArray(serviceAreas)) {
      return serviceAreas;
    }
    return typeof serviceAreas === 'string'
      ? serviceAreas.split(',').map((s) => s.trim())
      : [];
  } else {
    // For clients, convert single location to array
    const location = originalProfile.value.location || '';
    return location ? [location] : [];
  }
};

const convertLegacyLocationData = async (locationData) => {
  // Load locations data for conversion
  try {
    const { peruDistricts } = await import('@/data/peruDistricts.js');
    const allLocations = [];
    let uniqueIdCounter = 0;

    for (const department in peruDistricts) {
      for (const province in peruDistricts[department]) {
        peruDistricts[department][province].forEach((district) => {
          allLocations.push({
            id: `${district}-${province}-${department}-${uniqueIdCounter++}`,
            displayText: `${district}, ${province}, ${department}`,
            department,
            province,
            district,
          });
        });
      }
    }

    const result = [];
    if (Array.isArray(locationData)) {
      // Handle array of location strings/IDs
      locationData.forEach((item) => {
        if (typeof item === 'string') {
          if (item.includes('-') && item.split('-').length >= 3) {
            // Looks like a proper ID, find matching location
            const found = allLocations.find((loc) => loc.id === item);
            if (found) {
              result.push(found);
            }
          } else {
            // Legacy text format, try to match by display text
            const found = allLocations.find(
              (loc) =>
                loc.displayText.toLowerCase().includes(item.toLowerCase()) ||
                loc.district.toLowerCase() === item.toLowerCase()
            );
            if (found) {
              result.push(found);
            }
          }
        }
      });
    } else if (typeof locationData === 'string' && locationData) {
      // Handle single location string
      if (locationData.includes('-') && locationData.split('-').length >= 3) {
        // Looks like a proper ID
        const found = allLocations.find((loc) => loc.id === locationData);
        if (found) {
          result.push(found);
        }
      } else {
        // Legacy text format or comma-separated
        const locations = locationData.split(',').map((s) => s.trim());
        locations.forEach((item) => {
          const found = allLocations.find(
            (loc) =>
              loc.displayText.toLowerCase().includes(item.toLowerCase()) ||
              loc.district.toLowerCase() === item.toLowerCase()
          );
          if (found) {
            result.push(found);
          }
        });
      }
    }

    return result;
  } catch (error) {
    console.error('Error converting legacy location data:', error);
    return [];
  }
};
const isSkillsModalOpen = ref(false);
const originalProfile = ref({});

// Computed properties
const memberSince = computed(() => {
  if (user.value?.created_at) {
    return new Date(user.value.created_at).toLocaleDateString();
  }
  return t('profile.unknown');
});

const displayedLocations = computed(() => {
  if (showAllLocations.value || editableLocations.value.length <= 5) {
    return editableLocations.value;
  }
  return editableLocations.value.slice(0, 5);
});

const hasChanges = computed(() => {
  const skillsChanged =
    JSON.stringify(editableSkills.value.sort()) !==
    JSON.stringify((originalProfile.value.skills || []).sort());

  return (
    editableDisplayName.value !== originalProfile.value.display_name ||
    editableBio.value !== originalProfile.value.bio ||
    editablePhone.value !== originalProfile.value.phone ||
    !arraysEqual(
      editableLocations.value.map((loc) => loc.id),
      getOriginalLocationIds()
    ) ||
    skillsChanged
  );
});

// Methods
const triggerFileInput = () => {
  if (!isUploading.value) {
    fileInput.value?.click();
  }
};

// Skills Management Methods
const openSkillsModal = () => {
  isSkillsModalOpen.value = true;
};

const closeSkillsModal = () => {
  isSkillsModalOpen.value = false;
};

const handleSkillsSave = (newSkills) => {
  editableSkills.value = [...newSkills];
};

const removeSkill = (index) => {
  editableSkills.value.splice(index, 1);
};

// Location Management Methods
const navigateToLocationSelection = () => {
  // Store current selections in sessionStorage to pass to the new page
  sessionStorage.setItem(
    'currentLocations',
    JSON.stringify(editableLocations.value)
  );
  router.push('/select-locations');
};

const removeLocation = (locationId) => {
  editableLocations.value = editableLocations.value.filter(
    (loc) => loc.id !== locationId
  );
};

// Check for returning location selections
const checkForLocationSelections = () => {
  const selectedLocations = sessionStorage.getItem('selectedLocations');
  if (selectedLocations) {
    try {
      const locations = JSON.parse(selectedLocations);
      editableLocations.value = locations;
      sessionStorage.removeItem('selectedLocations');
    } catch (error) {
      console.error('Error parsing selected locations:', error);
    }
  }
};

const handleFileSelect = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showStatus(t('profile.pleaseSelectValidImage'), 'error');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showStatus(t('profile.imageSizeTooLarge'), 'error');
    return;
  }
  await uploadProfilePicture(file);
};

const uploadProfilePicture = async (file) => {
  if (!userId.value) {
    showStatus(t('profile.userNotAuthenticated'), 'error');
    return;
  }
  isUploading.value = true;
  statusMessage.value = '';
  try {
    const supabase = getSupabaseClient();
    const uploadResult = await uploadProfileImage(supabase, file, userId.value);
    if (!uploadResult) {
      throw new Error('Failed to upload image');
    }
    const updateResult = await updateUserProfileWithProfileImage(
      supabase,
      userId.value,
      uploadResult.url
    );
    if (!updateResult) {
      throw new Error('Failed to update profile with new image');
    }
    updateProfileImage(uploadResult.url);
    showStatus(t('profile.profilePictureUpdated'), 'success');
    await loadUserProfile(); // Reload to ensure consistency
    emit('profileUpdated', {
      profileImageUrl: getCachedBustedImageUrl.value,
      type: 'image',
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    showStatus(t('profile.failedToUploadProfilePicture'), 'error');
  } finally {
    isUploading.value = false;
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
};

const handleImageError = () => {
  console.warn('Failed to load profile image, clearing global state.');
  updateProfileImage(null);
};

const loadUserProfile = async () => {
  if (!userId.value) return;
  try {
    const supabase = getSupabaseClient();
    let profileData = null;
    let error = null;

    if (userRole.value === 'contractor') {
      const { data, error: contractorError } = await supabase
        .from('contractor_profiles')
        .select('*')
        .eq('user_id', userId.value)
        .maybeSingle(); // Use maybeSingle() to handle missing profiles gracefully
      profileData = data;
      error = contractorError;
    } else {
      const { data, error: clientError } = await supabase
        .from('client_profiles')
        .select('*, profile_picture_url') // Ensure profile_picture_url is fetched
        .eq('id', userId.value)
        .maybeSingle(); // Use maybeSingle() to handle missing profiles gracefully
      profileData = data;
      error = clientError;
    }

    if (profileData && !error) {
      updateProfileImage(profileData.profile_picture_url || null);
      const name =
        profileData.full_name ||
        profileData.name ||
        userEmail.value?.split('@')[0] ||
        '';
      displayName.value = name;
      updateProfileName(name);
      editableDisplayName.value = displayName.value;
      editableBio.value = profileData.bio || '';
      editablePhone.value =
        profileData.contact_phone || profileData.phone || '';

      if (userRole.value === 'contractor') {
        const rawLocation = profileData.service_areas;
        // Convert legacy location data to new format
        editableLocations.value = await convertLegacyLocationData(rawLocation);
        editableSkills.value = profileData.skills || [];
      } else {
        // For clients, convert single location to array
        editableLocations.value = await convertLegacyLocationData(
          profileData.location
        );
        editableSkills.value = []; // Clients don't have skills in this model
      }

      originalProfile.value = {
        display_name: displayName.value,
        bio: editableBio.value,
        phone: editablePhone.value,
        service_areas: editableLocations.value.map((loc) => loc.id),
        location:
          editableLocations.value.length > 0
            ? editableLocations.value[0].displayText
            : '',
        skills: [...editableSkills.value],
      };
    } else if (error && error.code === 'PGRST116') {
      // No profile found
      console.log('No profile found for user, setting defaults.');
      const defaultName = userEmail.value?.split('@')[0] || 'New User';
      displayName.value = defaultName;
      updateProfileName(defaultName);
      updateProfileImage(null); // Clear image if no profile
      editableDisplayName.value = defaultName;
      editableBio.value = '';
      editablePhone.value = '';
      editableLocations.value = [];
      editableSkills.value = [];
      originalProfile.value = {
        display_name: defaultName,
        bio: '',
        phone: '',
        location: '',
        skills: [],
      };
    } else if (error) {
      console.error('Error loading profile:', error);
      showStatus('Failed to load profile data.', 'error');
    }
  } catch (err) {
    console.error('Unexpected error in loadUserProfile:', err);
    showStatus(
      'An unexpected error occurred while loading profile data.',
      'error'
    );
  } finally {
    if (!originalProfile.value.hasOwnProperty('location'))
      originalProfile.value.location = '';
    if (!originalProfile.value.hasOwnProperty('skills'))
      originalProfile.value.skills = [];
  }
};

const showStatus = (message, type = 'success', duration = 3000) => {
  statusMessage.value = message;
  statusType.value = type;
  setTimeout(() => {
    statusMessage.value = '';
  }, duration);
};

const saveProfile = async () => {
  if (!userId.value) {
    showStatus('User not authenticated.', 'error');
    return;
  }
  if (!hasChanges.value) {
    showStatus('No changes to save.', 'info');
    return;
  }
  isSaving.value = true;
  statusMessage.value = '';
  try {
    const supabase = getSupabaseClient();
    const profileUpdates = { updated_at: new Date().toISOString() };

    if (
      editableDisplayName.value !== originalProfile.value.display_name ||
      !originalProfile.value.display_name
    ) {
      // Also save if original was empty
      profileUpdates.full_name = editableDisplayName.value;
    }
    if (editableBio.value !== originalProfile.value.bio) {
      profileUpdates.bio = editableBio.value;
    }
    if (editablePhone.value !== originalProfile.value.phone) {
      if (userRole.value === 'contractor')
        profileUpdates.contact_phone = editablePhone.value;
      else profileUpdates.phone = editablePhone.value;
    }
    // Handle location updates
    const currentLocationIds = editableLocations.value.map((loc) => loc.id);
    const originalLocationIds = getOriginalLocationIds();

    if (!arraysEqual(currentLocationIds, originalLocationIds)) {
      if (userRole.value === 'contractor') {
        profileUpdates.service_areas = currentLocationIds;
      } else {
        // For clients, store the first location's display text or empty string
        profileUpdates.location =
          editableLocations.value.length > 0
            ? editableLocations.value[0].displayText
            : '';
      }
    }
    if (
      userRole.value === 'contractor' &&
      JSON.stringify(editableSkills.value.sort()) !==
        JSON.stringify((originalProfile.value.skills || []).sort())
    ) {
      profileUpdates.skills = editableSkills.value;
    }

    Object.keys(profileUpdates).forEach(
      (key) => profileUpdates[key] === undefined && delete profileUpdates[key]
    );
    if (Object.keys(profileUpdates).length === 1 && profileUpdates.updated_at) {
      showStatus('No effective changes to save.', 'info');
      isSaving.value = false;
      return;
    }

    let tableName =
      userRole.value === 'contractor'
        ? 'contractor_profiles'
        : 'client_profiles';
    let savedData;

    const { data, error } = await supabase
      .from(tableName)
      .update(profileUpdates)
      .eq('id', userId.value)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116' && tableName === 'client_profiles') {
        const clientUpsertData = {
          id: userId.value,
          email: userEmail.value,
          full_name: editableDisplayName.value,
          bio: editableBio.value || null,
          phone: editablePhone.value || null,
          location:
            editableLocations.value.length > 0
              ? editableLocations.value[0].displayText
              : null,
          updated_at: new Date().toISOString(),
        };
        Object.keys(clientUpsertData).forEach(
          (key) =>
            clientUpsertData[key] === undefined &&
            (clientUpsertData[key] = null)
        );
        const { data: upsertData, error: upsertError } = await supabase
          .from('client_profiles')
          .upsert(clientUpsertData, { onConflict: 'id' })
          .select()
          .single();
        if (upsertError) throw upsertError;
        savedData = upsertData;
      } else {
        throw error;
      }
    } else {
      savedData = data;
    }

    if (savedData) {
      originalProfile.value.display_name =
        savedData.full_name ||
        savedData.display_name ||
        editableDisplayName.value;
      originalProfile.value.bio = savedData.bio || editableBio.value;
      originalProfile.value.phone =
        savedData.contact_phone || savedData.phone || editablePhone.value;
      if (userRole.value === 'contractor') {
        originalProfile.value.service_areas = savedData.service_areas || [];
        originalProfile.value.skills = savedData.skills
          ? [...savedData.skills]
          : [...editableSkills.value];
      } else {
        originalProfile.value.location = savedData.location || '';
        originalProfile.value.skills = [];
      }
      updateProfileName(originalProfile.value.display_name);
    }
    showStatus('Profile updated successfully!', 'success');
    emit('profileUpdated', {
      name: editableDisplayName.value,
      type: 'details',
    });
  } catch (error) {
    console.error('Error saving profile:', error);
    showStatus(
      `Failed to save profile: ${error.message || 'Unknown error'}`,
      'error'
    );
  } finally {
    isSaving.value = false;
  }
};

const handleLocationChange = (locationArray) => {
  // locationArray is the new array of selected locations
  // No additional processing needed as editableLocations is already updated by v-model
};

watch(globalProfileImageUrl, (newUrl) => {
  /* Handled by getCachedBustedImageUrl */
});
watch(globalProfileName, (newName) => {
  if (newName && displayName.value !== newName) {
    // Check if it's actually different
    displayName.value = newName;
    if (editableDisplayName.value === originalProfile.value.display_name) {
      // Only update if not actively being edited
      editableDisplayName.value = newName;
      originalProfile.value.display_name = newName;
    }
  }
});

onMounted(async () => {
  await loadUserProfile();
  checkForLocationSelections();
});
</script>

<style scoped>
/* Add any specific styles for UserProfile.vue here */
.logout-button svg {
  transition: transform 0.2s ease-in-out;
}
.logout-button:hover svg {
  transform: translateX(3px);
}
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
