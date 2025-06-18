# Vue i18n Setup Guide

This guide documents the internationalization (i18n) setup for the mobile work app using Vue i18n v11 with Composition API.

## Overview

The application supports multiple languages with the following configuration:

- **English (en-US)** - Default locale
- **Spanish (es-PE)** - Peruvian Spanish with local expressions
- Automatic browser language detection
- Locale persistence in localStorage
- Fallback to English for missing translations

## File Structure

```
src/
├── i18n.js                     # i18n configuration
├── locales/                    # Translation files
│   ├── en-US.json             # English translations
│   └── es-PE.json             # Peruvian Spanish translations
├── composables/
│   └── useI18n.js             # Enhanced i18n composable
└── components/
    ├── ui/
    │   └── LanguageSelector.vue # Language switcher component
    └── examples/
        └── I18nDemo.vue        # Demo component
```

## Configuration

### Main Configuration (`src/i18n.js`)

```javascript
import { createI18n } from 'vue-i18n';
import { getInitialLocale, DEFAULT_LOCALE } from './composables/useI18n.js';

const i18n = createI18n({
  legacy: false, // Use Composition API
  globalInjection: true, // Global $t, $d, $n functions
  locale: getInitialLocale(), // Auto-detected locale
  fallbackLocale: 'es-PE', // Fallback language
  messages: {
    /* ... */
  }, // Translation messages
});
```

### Integration in main.js

The i18n instance is loaded asynchronously and integrated into the Vue app:

```javascript
const [{ default: i18n }] = await Promise.all([
  import('./i18n'),
  // ... other imports
]);

app.use(i18n);
```

## Usage

### Basic Translation

```vue
<template>
  <!-- Using global $t function -->
  <h1>{{ $t('navigation.home') }}</h1>

  <!-- Using composable -->
  <p>{{ t('jobs.title') }}</p>
</template>

<script setup>
import { useI18n } from '@/composables/useI18n.js';

const { t } = useI18n();
</script>
```

### Number and Date Formatting

```vue
<template>
  <!-- Currency formatting -->
  <span>{{ $n(1234.56, 'currency') }}</span>

  <!-- Date formatting -->
  <span>{{ $d(new Date(), 'short') }}</span>
</template>
```

### Locale Management

```vue
<script setup>
import { useI18n } from '@/composables/useI18n.js';

const { currentLocaleInfo, availableLocales, setLocale, toggleLocale } =
  useI18n();

// Change locale
const changeLanguage = (localeCode) => {
  setLocale(localeCode);
};
</script>
```

## Translation Keys Structure

### Navigation

```json
{
  "navigation": {
    "home": "Home",
    "messages": "Messages",
    "profile": "Profile",
    "jobs": "Jobs"
  }
}
```

### Buttons

```json
{
  "buttons": {
    "save": "Save",
    "cancel": "Cancel",
    "submit": "Submit",
    "edit": "Edit"
  }
}
```

### Jobs

```json
{
  "jobs": {
    "title": "Jobs",
    "postJob": "Post Job",
    "findJobs": "Find Jobs",
    "status": "Status",
    "pending": "Pending"
  }
}
```

### Forms & Validation

```json
{
  "forms": {
    "required": "This field is required",
    "invalidEmail": "Please enter a valid email",
    "passwordTooShort": "Password must be at least 8 characters"
  }
}
```

## Features

### 1. Automatic Language Detection

- Detects browser language on first visit
- Falls back to supported language if exact match not found
- Defaults to English if no match found

### 2. Locale Persistence

- Saves selected language in localStorage
- Restores language preference on app reload
- Priority: stored > browser > default

### 3. Enhanced Composable

The `useI18n` composable provides additional functionality:

```javascript
const {
  // Core i18n functions
  t,
  te,
  tm,
  rt,
  d,
  n,

  // Locale management
  locale,
  currentLocaleInfo,
  availableLocales,
  setLocale,
  toggleLocale,

  // Utilities
  isLocaleAvailable,
  getLocaleDisplayName,
} = useI18n();
```

### 4. Error Handling

- Safe translation with fallback to key name
- Console warnings for missing translations (dev only)
- Graceful handling of localStorage errors

### 5. Performance Optimizations

- Lazy loading of i18n configuration
- Silent warnings in production
- Minimal bundle impact

## Components

### LanguageSelector Component

A ready-to-use language switcher with:

- Dropdown interface
- Flag icons
- Mobile-responsive design
- Accessibility features
- Keyboard navigation

```vue
<template>
  <LanguageSelector />
</template>

<script setup>
import LanguageSelector from '@/components/ui/LanguageSelector.vue';
</script>
```

## Localization Guidelines

### For Peruvian Spanish (es-PE)

- Use local currency symbol: "S/" instead of "$"
- Include Peruvian expressions where appropriate
- Use "gasfitería" instead of "plomería" for plumbing
- Use "delivery" (commonly used in Peru) for delivery services

### Translation Best Practices

1. Keep keys descriptive and hierarchical
2. Use interpolation for dynamic content: `{{ $t('message', { name: 'John' }) }}`
3. Provide context in key names: `buttons.save` vs `forms.save`
4. Use consistent terminology across the app
5. Test all translations in context

## Adding New Languages

1. Create new translation file: `src/locales/[locale].json`
2. Add locale to `AVAILABLE_LOCALES` in `useI18n.js`:
   ```javascript
   export const AVAILABLE_LOCALES = [
     { code: 'en-US', name: 'English', flag: '🇺🇸' },
     { code: 'es-PE', name: 'Español (Perú)', flag: '🇵🇪' },
     { code: 'fr-FR', name: 'Français', flag: '🇫🇷' }, // New language
   ];
   ```
3. Import and add to messages in `i18n.js`
4. Add number/date formats if needed

## Testing

Use the I18nDemo component to test translations:

```vue
<template>
  <I18nDemo />
</template>

<script setup>
import I18nDemo from '@/components/examples/I18nDemo.vue';
</script>
```

## Troubleshooting

### Common Issues

1. **Missing translations show as keys**

   - Check if translation key exists in JSON files
   - Verify correct key path syntax

2. **Language not persisting**

   - Check localStorage permissions
   - Verify browser supports localStorage

3. **Formatting not working**
   - Ensure number/date formats are defined in i18n.js
   - Check locale-specific formatting rules

### Debug Mode

Enable detailed logging in development:

```javascript
// In i18n.js
const i18n = createI18n({
  silentTranslationWarn: false, // Show missing translation warnings
  silentFallbackWarn: false, // Show fallback warnings
  // ...
});
```

## Performance Considerations

- Translation files are loaded synchronously for better UX
- Consider code-splitting for large translation files
- Use `te()` to check translation existence before rendering
- Minimize translation key nesting for better performance

## Browser Support

- Modern browsers with ES6+ support
- localStorage support required for persistence
- Intl API support for number/date formatting
