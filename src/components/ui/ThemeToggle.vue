<script setup>
import { computed } from 'vue';
import { useTheme } from '@/composables/useTheme';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Monitor, Palette } from 'lucide-vue-next';

const props = defineProps({
  variant: {
    type: String,
    default: 'ghost',
  },
  size: {
    type: String,
    default: 'icon',
  },
  showLabel: {
    type: Boolean,
    default: false,
  },
});

const { isDark, theme, cycleTheme, getThemeDisplayName, getNextTheme } =
  useTheme();

const currentIcon = computed(() => {
  switch (theme.value) {
    case 'light':
      return Sun;
    case 'dark':
      return Moon;
    case 'system':
      return Monitor;
    default:
      return Sun;
  }
});

const themeLabel = computed(() => getThemeDisplayName(theme.value));

const tooltipText = computed(() => {
  const nextThemeName = getThemeDisplayName(getNextTheme());
  return `Switch to ${nextThemeName}`;
});

const handleToggle = () => {
  cycleTheme();
};
</script>

<template>
  <Button
    :variant="variant"
    :size="size"
    @click="handleToggle"
    :title="tooltipText"
    class="theme-toggle transition-all duration-200 hover:scale-105 active:scale-95"
    :class="{
      'gap-2': showLabel,
      'w-auto px-3': showLabel && size === 'icon',
    }"
  >
    <!-- Icon with smooth transition -->
    <component
      :is="currentIcon"
      class="transition-all duration-300 ease-in-out"
      :class="{
        'size-4': size === 'sm' || size === 'icon',
        'size-5': size === 'default',
        'size-6': size === 'lg',
        'rotate-180': isDark,
        'scale-110': theme === 'system',
      }"
    />

    <!-- Optional label -->
    <span
      v-if="showLabel"
      class="text-sm font-medium transition-opacity duration-200"
    >
      {{ themeLabel }}
    </span>
  </Button>
</template>

<style scoped>
.theme-toggle {
  position: relative;
  overflow: hidden;
}

/* Add a subtle glow effect for the active theme */
.theme-toggle:hover {
  box-shadow: 0 0 0 1px var(--ring);
}

/* Smooth icon transitions */
.theme-toggle svg {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Add a subtle background pulse on theme change */
.theme-toggle:active {
  background-color: var(--accent);
}

/* Dark mode specific styling */
.dark .theme-toggle:hover {
  box-shadow:
    0 0 0 1px var(--ring),
    0 0 8px rgba(99, 102, 241, 0.2);
}
</style>
