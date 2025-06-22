<template>
  <div class="flex flex-col gap-3">
    <div class="flex gap-1 rounded-lg border border-border bg-background p-1">
      <!-- Spanish Option -->
      <button
        @click="selectLanguage('es-PE')"
        :class="[
          'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 outline-none focus:ring-2 focus:ring-blue-500',
          currentLocale === 'es-PE'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-muted-foreground hover:bg-muted/50',
        ]"
        :aria-pressed="currentLocale === 'es-PE'"
        :aria-label="
          $t('profile.selectLanguage', { language: 'Español (Perú)' })
        "
      >
        <span class="text-lg">🇵🇪</span>
        <span class="font-medium sm:text-xs">Español</span>
      </button>

      <!-- English Option -->
      <button
        @click="selectLanguage('en-US')"
        :class="[
          'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 outline-none focus:ring-2 focus:ring-blue-500',
          currentLocale === 'en-US'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-muted-foreground hover:bg-muted/50',
        ]"
        :aria-pressed="currentLocale === 'en-US'"
        :aria-label="
          $t('profile.selectLanguage', { language: 'English (American)' })
        "
      >
        <span class="text-lg">🇺🇸</span>
        <span class="font-medium sm:text-xs">English</span>
      </button>
    </div>

    <!-- Current Selection Indicator -->
    <div class="text-center">
      <div class="text-sm text-muted-foreground">
        {{ $t('profile.currentLanguage') }}:
        <span class="font-medium text-foreground">
          {{ currentLocaleInfo.flag }} {{ currentLocaleInfo.name }}
        </span>
      </div>

      <!-- Language Change Confirmation -->
      <div
        v-if="showConfirmation"
        class="mt-2 rounded-md bg-green-500 px-3 py-2 text-center text-sm font-medium text-white confirmation-animation"
      >
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

.confirmation-animation {
  animation: fadeInOut 2s ease-in-out;
}
</style>
