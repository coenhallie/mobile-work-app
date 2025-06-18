import { createI18n } from 'vue-i18n';
import { getInitialLocale, DEFAULT_LOCALE } from './composables/useI18n.js';

// Import translation files
import enUS from './locales/en-US.json';
import esPE from './locales/es-PE.json';

// Messages object
const messages = {
  'en-US': enUS,
  'es-PE': esPE,
  // Add alias for 'es' to point to 'es-PE' for better compatibility
  es: esPE,
};

// Get initial locale
const initialLocale = getInitialLocale();

// Create i18n instance
const i18n = createI18n({
  // Use Composition API mode
  legacy: false,

  // Global injection
  globalInjection: true,

  // Default locale
  locale: initialLocale,

  // Fallback locale
  fallbackLocale: DEFAULT_LOCALE,

  // Translation messages
  messages,

  // Additional options for better performance and debugging
  silentTranslationWarn: !import.meta.env.DEV,
  silentFallbackWarn: !import.meta.env.DEV,

  // Number formats for different locales
  numberFormats: {
    'en-US': {
      currency: {
        style: 'currency',
        currency: 'USD',
        notation: 'standard',
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
      percent: {
        style: 'percent',
        useGrouping: false,
      },
    },
    'es-PE': {
      currency: {
        style: 'currency',
        currency: 'PEN',
        notation: 'standard',
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
      percent: {
        style: 'percent',
        useGrouping: false,
      },
    },
  },

  // Date time formats for different locales
  datetimeFormats: {
    'en-US': {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      },
      long: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
      },
    },
    'es-PE': {
      short: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      },
      long: {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
      },
    },
  },
});

// Set document language
if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLocale;
}

export default i18n;
