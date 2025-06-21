import { ref, computed, watch } from 'vue';
import { usePreferredDark, useStorage } from '@vueuse/core';

// --- Singleton state ---
const preferredDark = usePreferredDark();
const theme = useStorage('theme', 'system'); // 'light', 'dark', 'system'

const isDark = computed(() => {
  if (theme.value === 'system') {
    return preferredDark.value;
  }
  return theme.value === 'dark';
});

const updateHtmlClass = () => {
  const htmlEl = document.documentElement;
  htmlEl.classList.remove('dark');
  if (isDark.value) {
    htmlEl.classList.add('dark');
  }
};

const setTheme = (newTheme) => {
  theme.value = newTheme;
};

// --- Watchers ---
watch(
  isDark,
  () => {
    updateHtmlClass();
  },
  { immediate: true }
);

const updateMetaThemeColor = (isDarkValue) => {
  if (typeof document !== 'undefined') {
    const metaTag = document.getElementById('theme-color-meta');
    if (metaTag) {
      const color = isDarkValue ? '#111827' : '#ffffff';
      metaTag.setAttribute('content', color);
    }
  }
};

watch(isDark, updateMetaThemeColor, { immediate: true });

// --- Computed properties and cycle logic ---
const themes = ['light', 'dark', 'system'];

const getNextTheme = () => {
  const currentIndex = themes.indexOf(theme.value);
  const nextIndex = (currentIndex + 1) % themes.length;
  return themes[nextIndex];
};

const cycleTheme = () => {
  const nextTheme = getNextTheme();
  setTheme(nextTheme);
};

const getThemeDisplayName = (themeVal = theme.value) => {
  const names = {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  };
  return names[themeVal] || 'Unknown';
};

// --- Export ---
export function useTheme() {
  return {
    isDark,
    theme,
    setTheme,
    cycleTheme,
    getThemeDisplayName,
    getNextTheme,
  };
}
