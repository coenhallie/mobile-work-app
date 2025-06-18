import { useDark, useToggle, usePreferredDark } from '@vueuse/core';
import { computed, watch } from 'vue'; // Removed onMounted as it's not ideal for singleton

// --- Start of singleton instantiation ---
const preferredDark = usePreferredDark();
const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: '',
  storageKey: 'theme-preference',
});

// Initialize with system preference if no stored preference exists
const storedPreference = localStorage.getItem('theme-preference');
if (storedPreference === null) {
  isDark.value = preferredDark.value;
}

const toggleDark = useToggle(isDark);

const currentTheme = computed(() => {
  return isDark.value ? 'dark' : 'light';
});

const isSystemPreference = computed(() => {
  const stored = localStorage.getItem('theme-preference');
  return stored === null || stored === 'auto';
});

const updateMetaThemeColor = (isDarkValue) => {
  if (typeof document !== 'undefined') {
    const metaTag = document.getElementById('theme-color-meta');
    if (metaTag) {
      metaTag.setAttribute('content', isDarkValue ? '#0A0A0A' : '#FFFFFF');
    }
  }
};

const setTheme = (theme) => {
  if (theme === 'system' || theme === 'auto') {
    localStorage.removeItem('theme-preference');
    isDark.value = preferredDark.value;
  } else if (theme === 'dark') {
    isDark.value = true;
  } else if (theme === 'light') {
    isDark.value = false;
  }
};

// Watch for system preference changes when using auto mode
watch(preferredDark, (newPreference) => {
  if (isSystemPreference.value) {
    isDark.value = newPreference;
  }
});

// Watch for theme changes and update meta tag
// Set immediate to true to run on initialization
watch(
  isDark,
  (newIsDark) => {
    updateMetaThemeColor(newIsDark);
  },
  { immediate: true }
);

// Function to get theme display name
const getThemeDisplayName = (themeVal = currentTheme.value) => {
  // Renamed param to avoid conflict
  const names = {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    auto: 'System',
  };
  return names[themeVal] || 'Unknown';
};

// Function to get next theme in cycle (light -> dark -> system)
const getNextTheme = () => {
  if (isSystemPreference.value) {
    return 'light';
  } else if (currentTheme.value === 'light') {
    return 'dark';
  } else {
    return 'system';
  }
};

// Enhanced toggle that cycles through light -> dark -> system
const cycleTheme = () => {
  const next = getNextTheme();
  setTheme(next);
};

// Export the reactive properties and methods directly
export {
  isDark,
  currentTheme,
  isSystemPreference,
  preferredDark,
  toggleDark,
  setTheme,
  cycleTheme,
  getThemeDisplayName,
  getNextTheme,
};
// --- End of singleton instantiation ---
