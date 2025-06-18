<template>
  <div class="w-full p-4 border rounded-lg shadow bg-gray-50 dark:bg-gray-800">
    <h2 class="text-xl font-semibold mb-4 text-center text-foreground">
      {{ $t('theme.themeSettings') }}
    </h2>

    <div class="space-y-4">
      <!-- Theme Options -->
      <div class="space-y-3">
        <h3 class="text-sm font-medium text-foreground mb-2">
          {{ $t('theme.chooseTheme') }}
        </h3>

        <!-- Light Theme Option -->
        <div
          @click="() => setTheme('light')"
          class="flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all hover:bg-accent hover:border-accent-foreground/20"
          :class="{
            'border-primary bg-primary/5':
              currentTheme === 'light' && !isSystemPreference,
            'border-border': !(currentTheme === 'light' && !isSystemPreference),
          }"
        >
          <div class="flex items-center gap-3">
            <Sun class="size-5 text-amber-500" />
            <div>
              <p class="font-medium text-foreground">{{ $t('theme.light') }}</p>
              <p class="text-sm text-muted-foreground">
                {{ $t('theme.lightDescription') }}
              </p>
            </div>
          </div>
          <div
            v-if="currentTheme === 'light' && !isSystemPreference"
            class="size-2 bg-primary rounded-full"
          ></div>
        </div>

        <!-- Dark Theme Option -->
        <div
          @click="() => setTheme('dark')"
          class="flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all hover:bg-accent hover:border-accent-foreground/20"
          :class="{
            'border-primary bg-primary/5':
              currentTheme === 'dark' && !isSystemPreference,
            'border-border': !(currentTheme === 'dark' && !isSystemPreference),
          }"
        >
          <div class="flex items-center gap-3">
            <Moon class="size-5 text-blue-400" />
            <div>
              <p class="font-medium text-foreground">{{ $t('theme.dark') }}</p>
              <p class="text-sm text-muted-foreground">
                {{ $t('theme.darkDescription') }}
              </p>
            </div>
          </div>
          <div
            v-if="currentTheme === 'dark' && !isSystemPreference"
            class="size-2 bg-primary rounded-full"
          ></div>
        </div>

        <!-- System Theme Option -->
        <div
          @click="() => setTheme('system')"
          class="flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all hover:bg-accent hover:border-accent-foreground/20"
          :class="{
            'border-primary bg-primary/5': isSystemPreference,
            'border-border': !isSystemPreference,
          }"
        >
          <div class="flex items-center gap-3">
            <Smartphone class="size-5 text-purple-500" />
            <div>
              <p class="font-medium text-foreground">
                {{ $t('theme.system') }}
              </p>
              <p class="text-sm text-muted-foreground">
                {{
                  $t('theme.systemDescription', {
                    mode: preferredDark
                      ? $t('theme.dark').toLowerCase()
                      : $t('theme.light').toLowerCase(),
                  })
                }}
              </p>
            </div>
          </div>
          <div
            v-if="isSystemPreference"
            class="size-2 bg-primary rounded-full"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  isDark,
  currentTheme,
  isSystemPreference,
  preferredDark,
  setTheme,
  getThemeDisplayName,
} from '@/composables/useTheme';
import { Sun, Moon, Smartphone } from 'lucide-vue-next';

const { t } = useI18n();

// Theme variables are now directly imported
// isDark, currentTheme, isSystemPreference, preferredDark, setTheme, getThemeDisplayName are already available

// Get the appropriate icon based on current theme state
const currentIcon = computed(() => {
  if (isSystemPreference.value) {
    return Smartphone;
  }
  return isDark.value ? Moon : Sun;
});

// Get the display label for current theme
const currentThemeLabel = computed(() => {
  if (isSystemPreference.value) {
    return `System (${preferredDark.value ? 'Dark' : 'Light'})`;
  }
  return getThemeDisplayName(currentTheme.value);
});
</script>

<style scoped>
/* Add smooth transitions for theme changes */
.transition-all {
  transition: all 0.2s ease;
}

/* Hover effects for theme options */
.cursor-pointer:hover {
  transform: translateY(-1px);
}

.cursor-pointer:active {
  transform: translateY(0);
}
</style>
