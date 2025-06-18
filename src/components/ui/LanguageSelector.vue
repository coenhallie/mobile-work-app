<template>
  <div class="language-selector">
    <!-- Dropdown trigger -->
    <button
      @click="toggleDropdown"
      class="language-trigger"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      :aria-label="$t('profile.language')"
    >
      <span class="current-locale">
        <span class="flag">{{ currentLocaleInfo.flag }}</span>
        <span class="name">{{ currentLocaleInfo.name }}</span>
      </span>
      <svg
        class="chevron"
        :class="{ 'rotate-180': isOpen }"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="6,9 12,15 18,9"></polyline>
      </svg>
    </button>

    <!-- Dropdown menu -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="dropdown-menu"
        role="menu"
        :aria-labelledby="$t('profile.language')"
      >
        <button
          v-for="locale in availableLocales"
          :key="locale.code"
          @click="selectLocale(locale.code)"
          class="locale-option"
          :class="{ active: locale.code === currentLocaleInfo.code }"
          role="menuitem"
          :aria-current="
            locale.code === currentLocaleInfo.code ? 'true' : 'false'
          "
        >
          <span class="flag">{{ locale.flag }}</span>
          <span class="name">{{ locale.name }}</span>
          <svg
            v-if="locale.code === currentLocaleInfo.code"
            class="check-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
        </button>
      </div>
    </Transition>

    <!-- Backdrop for mobile -->
    <div
      v-if="isOpen"
      class="backdrop"
      @click="closeDropdown"
      aria-hidden="true"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from '@/composables/useI18n.js';

// Composables
const { currentLocaleInfo, availableLocales, setLocale } = useI18n();

// State
const isOpen = ref(false);

// Methods
const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const closeDropdown = () => {
  isOpen.value = false;
};

const selectLocale = (localeCode) => {
  setLocale(localeCode);
  closeDropdown();
};

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  if (!event.target.closest('.language-selector')) {
    closeDropdown();
  }
};

// Close dropdown on escape key
const handleEscape = (event) => {
  if (event.key === 'Escape') {
    closeDropdown();
  }
};

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleEscape);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleEscape);
});
</script>

<style scoped>
.language-selector {
  @apply relative inline-block;
}

.language-trigger {
  @apply flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted/80 focus:outline-none focus:border-transparent transition-colors;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

.language-trigger:focus {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

.current-locale {
  @apply flex items-center gap-2;
}

.flag {
  @apply text-lg;
}

.name {
  @apply hidden sm:inline;
}

.chevron {
  @apply w-4 h-4 text-muted-foreground transition-transform duration-200;
}

.dropdown-menu {
  @apply absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-50 py-1;
}

.locale-option {
  @apply w-full flex items-center justify-between px-4 py-2 text-sm text-foreground hover:bg-muted/80 focus:outline-none focus:bg-muted/80 transition-colors;
}

.locale-option.active {
  @apply bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300;
}

.locale-option .flag {
  @apply text-base;
}

.locale-option .name {
  @apply flex-1 text-left ml-2;
}

.check-icon {
  @apply w-4 h-4 text-blue-600 dark:text-blue-400;
}

.backdrop {
  @apply fixed inset-0 z-40 bg-black bg-opacity-25 sm:hidden;
}

/* Mobile responsive adjustments */
@media (max-width: 640px) {
  .dropdown-menu {
    @apply right-0 left-0 w-auto;
  }

  .language-trigger .name {
    @apply hidden;
  }
}
</style>
