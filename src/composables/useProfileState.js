import { ref, computed } from 'vue';

// Global profile state
const profileImageUrl = ref(null);
const profileName = ref(null);
const lastUpdated = ref(Date.now());

export function useProfileState() {
  const updateProfileImage = (newUrl) => {
    profileImageUrl.value = newUrl;
    lastUpdated.value = Date.now();
  };

  const updateProfileName = (newName) => {
    profileName.value = newName;
    lastUpdated.value = Date.now();
  };

  const clearProfile = () => {
    profileImageUrl.value = null;
    profileName.value = null;
    lastUpdated.value = Date.now();
  };

  const getCachedBustedImageUrl = computed(() => {
    if (!profileImageUrl.value) return null;
    // Add cache buster if URL doesn't already have one
    if (profileImageUrl.value.includes('?t=')) {
      return profileImageUrl.value;
    }
    return `${profileImageUrl.value}?t=${lastUpdated.value}`;
  });

  return {
    profileImageUrl: computed(() => profileImageUrl.value),
    profileName: computed(() => profileName.value),
    lastUpdated: computed(() => lastUpdated.value),
    getCachedBustedImageUrl,
    updateProfileImage,
    updateProfileName,
    clearProfile,
  };
}
