<template>
  <div
    class="w-full p-4 rounded-lg bg-transparent border border-gray-100 dark:border-gray-800"
  >
    <h2 class="text-xl font-normal mb-4 text-foreground">
      {{ $t('theme.themeSettings') }}
    </h2>

    <div class="space-y-4">
      <!-- Theme Options -->
      <div class="space-y-3">
        <h3 class="text-sm font-medium text-muted-foreground mb-2">
          {{ $t('theme.chooseTheme') }}
        </h3>

        <!-- Light Theme Option -->
        <div
          @click="() => setTheme('light')"
          class="flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all hover:bg-accent hover:border-accent-foreground/20"
          :class="{
            'border-primary bg-primary/5': theme === 'light',
            'border-border': theme !== 'light',
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
            v-if="theme === 'light'"
            class="size-2 bg-primary rounded-full"
          ></div>
        </div>

        <!-- Dark Theme Option -->
        <div
          @click="() => setTheme('dark')"
          class="flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all hover:bg-accent hover:border-accent-foreground/20"
          :class="{
            'border-primary bg-primary/5': theme === 'dark',
            'border-border': theme !== 'dark',
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
            v-if="theme === 'dark'"
            class="size-2 bg-primary rounded-full"
          ></div>
        </div>

        <!-- System Theme Option -->
        <div
          @click="() => setTheme('system')"
          class="flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all hover:bg-accent hover:border-accent-foreground/20"
          :class="{
            'border-primary bg-primary/5': theme === 'system',
            'border-border': theme !== 'system',
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
            v-if="theme === 'system'"
            class="size-2 bg-primary rounded-full"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { useTheme } from '@/composables/useTheme';
import { Sun, Moon, Smartphone, Palette } from 'lucide-vue-next';
import { usePreferredDark } from '@vueuse/core';

const { t } = useI18n();
const { theme, setTheme } = useTheme();
const preferredDark = usePreferredDark();
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
