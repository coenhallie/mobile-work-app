<template>
  <div class="language-toggle">
    <div class="toggle-container">
      <!-- Spanish Option -->
      <button
        @click="selectLanguage('es-PE')"
        class="language-option"
        :class="{
          active: currentLocale === 'es-PE',
          inactive: currentLocale !== 'es-PE',
        }"
        :aria-pressed="currentLocale === 'es-PE'"
        :aria-label="
          $t('profile.selectLanguage', { language: 'Español (Perú)' })
        "
      >
        <span class="flag">🇵🇪</span>
        <span class="language-name">Español</span>
      </button>

      <!-- English Option -->
      <button
        @click="selectLanguage('en-US')"
        class="language-option"
        :class="{
          active: currentLocale === 'en-US',
          inactive: currentLocale !== 'en-US',
        }"
        :aria-pressed="currentLocale === 'en-US'"
        :aria-label="
          $t('profile.selectLanguage', { language: 'English (American)' })
        "
      >
        <span class="flag">🇺🇸</span>
        <span class="language-name">English</span>
      </button>
    </div>

    <!-- Current Selection Indicator -->
    <div class="selection-indicator">
      <div class="indicator-text">
        {{ $t('profile.currentLanguage') }}:
        <span class="current-lang">
          {{ currentLocaleInfo.flag }} {{ currentLocaleInfo.name }}
        </span>
      </div>

      <!-- Language Change Confirmation -->
      <div v-if="showConfirmation" class="confirmation-message">
        ✓ {{ $t('profile.language') }} {{ $t('buttons.save') }}d!
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, ref } from 'vue';
import { useI18n } from '@/composables/useI18n.js';

// Composables
const { currentLocaleInfo, setLocale, locale } = useI18n();

// State
const showConfirmation = ref(false);

// Computed
const currentLocale = computed(() => locale.value);

// Watch for locale changes and log them
watch(
  currentLocale,
  (newLocale, oldLocale) => {
    console.log('Language changed from', oldLocale, 'to', newLocale);
    if (oldLocale && newLocale !== oldLocale) {
      showConfirmation.value = true;
      setTimeout(() => {
        showConfirmation.value = false;
      }, 2000);
    }
  },
  { immediate: true }
);

// Methods
const selectLanguage = (localeCode) => {
  console.log('Attempting to switch language to:', localeCode);
  console.log('Current language:', currentLocale.value);

  if (localeCode !== currentLocale.value) {
    setLocale(localeCode);
    console.log('Language switch completed. New language:', locale.value);
  } else {
    console.log('Language is already set to:', localeCode);
  }
};
</script>

<style scoped>
.language-toggle {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toggle-container {
  display: flex;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  padding: 4px;
  gap: 4px;
  background-color: white;
}

.dark .toggle-container {
  border-color: #4b5563;
  background-color: #1f2937;
}

.language-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
  outline: none;
}

.language-option:focus {
  box-shadow: 0 0 0 2px #3b82f6;
}

.language-option.active {
  background-color: #2563eb;
  color: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.language-option.inactive {
  color: #6b7280;
  background-color: transparent;
}

.language-option.inactive:hover {
  color: #111827;
  background-color: #f3f4f6;
}

.dark .language-option.inactive {
  color: #d1d5db;
}

.dark .language-option.inactive:hover {
  color: white;
  background-color: #374151;
}

.flag {
  font-size: 18px;
}

.language-name {
  font-weight: 500;
}

.selection-indicator {
  text-align: center;
}

.indicator-text {
  font-size: 14px;
  color: #6b7280;
}

.dark .indicator-text {
  color: #9ca3af;
}

.current-lang {
  font-weight: 500;
  color: #111827;
}

.dark .current-lang {
  color: white;
}

.confirmation-message {
  margin-top: 8px;
  padding: 8px 12px;
  background-color: #10b981;
  color: white;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  animation: fadeInOut 2s ease-in-out;
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  15% {
    opacity: 1;
    transform: translateY(0);
  }
  85% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-10px);
  }
}

/* Mobile responsive adjustments */
@media (max-width: 640px) {
  .language-name {
    font-size: 12px;
  }

  .language-option {
    padding: 8px;
    gap: 4px;
  }

  .flag {
    font-size: 16px;
  }
}
</style>
