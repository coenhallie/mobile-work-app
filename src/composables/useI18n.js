import { ref, computed } from 'vue';
import { useI18n as useVueI18n } from 'vue-i18n';

// Available locales
export const AVAILABLE_LOCALES = [
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'es-PE', name: 'Español (Perú)', flag: '🇵🇪' },
];

// Default locale
export const DEFAULT_LOCALE = 'es-PE';

// Storage key for locale persistence
const LOCALE_STORAGE_KEY = 'app-locale';

/**
 * Get browser language with fallback
 * @returns {string} Locale code
 */
export function getBrowserLocale() {
  try {
    // Get browser language
    const browserLang = navigator.language || navigator.userLanguage;

    // Check if we support the exact locale
    if (AVAILABLE_LOCALES.some((locale) => locale.code === browserLang)) {
      return browserLang;
    }

    // Check if we support the language part (e.g., 'es' from 'es-ES')
    const langCode = browserLang.split('-')[0];
    const matchingLocale = AVAILABLE_LOCALES.find((locale) =>
      locale.code.startsWith(langCode)
    );

    if (matchingLocale) {
      return matchingLocale.code;
    }

    // Fallback to default
    return DEFAULT_LOCALE;
  } catch (error) {
    console.warn('Error detecting browser locale:', error);
    return DEFAULT_LOCALE;
  }
}

/**
 * Get stored locale from localStorage
 * @returns {string} Locale code
 */
export function getStoredLocale() {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && AVAILABLE_LOCALES.some((locale) => locale.code === stored)) {
      return stored;
    }
  } catch (error) {
    console.warn('Error reading stored locale:', error);
  }
  return null;
}

/**
 * Store locale in localStorage
 * @param {string} locale - Locale code to store
 */
export function setStoredLocale(locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch (error) {
    console.warn('Error storing locale:', error);
  }
}

/**
 * Get initial locale with priority: stored > browser > default
 * @returns {string} Locale code
 */
export function getInitialLocale() {
  // Priority: stored locale > default locale > browser locale
  return getStoredLocale() || DEFAULT_LOCALE || getBrowserLocale();
}

/**
 * Enhanced i18n composable with locale management
 * @returns {object} i18n utilities
 */
export function useI18n() {
  const { locale, t, te, tm, rt, d, n, ...rest } = useVueI18n();

  // Current locale info
  const currentLocaleInfo = computed(
    () =>
      AVAILABLE_LOCALES.find((l) => l.code === locale.value) ||
      AVAILABLE_LOCALES[0]
  );

  // Available locales
  const availableLocales = computed(() => AVAILABLE_LOCALES);

  /**
   * Change locale and persist it
   * @param {string} newLocale - New locale code
   */
  const setLocale = (newLocale) => {
    if (AVAILABLE_LOCALES.some((l) => l.code === newLocale)) {
      locale.value = newLocale;
      setStoredLocale(newLocale);

      // Update document language
      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLocale;
      }
    } else {
      console.warn(`Locale ${newLocale} is not available`);
    }
  };

  /**
   * Toggle between available locales
   */
  const toggleLocale = () => {
    const currentIndex = AVAILABLE_LOCALES.findIndex(
      (l) => l.code === locale.value
    );
    const nextIndex = (currentIndex + 1) % AVAILABLE_LOCALES.length;
    setLocale(AVAILABLE_LOCALES[nextIndex].code);
  };

  /**
   * Check if a locale is available
   * @param {string} localeCode - Locale code to check
   * @returns {boolean}
   */
  const isLocaleAvailable = (localeCode) => {
    return AVAILABLE_LOCALES.some((l) => l.code === localeCode);
  };

  /**
   * Get locale display name
   * @param {string} localeCode - Locale code
   * @returns {string} Display name
   */
  const getLocaleDisplayName = (localeCode) => {
    const localeInfo = AVAILABLE_LOCALES.find((l) => l.code === localeCode);
    return localeInfo ? localeInfo.name : localeCode;
  };

  /**
   * Safe translation with fallback
   * @param {string} key - Translation key
   * @param {object} params - Translation parameters
   * @returns {string} Translated text
   */
  const $t = (key, params = {}) => {
    try {
      return t(key, params);
    } catch (error) {
      console.warn(`Translation error for key "${key}":`, error);
      return key;
    }
  };

  /**
   * Check if translation exists
   * @param {string} key - Translation key
   * @returns {boolean}
   */
  const $te = (key) => {
    try {
      return te(key);
    } catch (error) {
      console.warn(`Translation check error for key "${key}":`, error);
      return false;
    }
  };

  return {
    // Vue i18n core
    locale,
    t: $t,
    te: $te,
    tm,
    rt,
    d,
    n,
    ...rest,

    // Enhanced functionality
    currentLocaleInfo,
    availableLocales,
    setLocale,
    toggleLocale,
    isLocaleAvailable,
    getLocaleDisplayName,

    // Utilities
    DEFAULT_LOCALE,
    AVAILABLE_LOCALES,
  };
}

export default useI18n;
