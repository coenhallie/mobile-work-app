import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue(), tailwindcss()],

  // Optimize build for mobile performance
  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: false,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'tauri-vendor': [
            '@tauri-apps/api',
            '@tauri-apps/plugin-haptics',
            '@tauri-apps/plugin-notification',
            '@tauri-apps/plugin-opener',
            '@tauri-apps/plugin-os',
            '@tauri-apps/plugin-store',
          ],
          'ui-vendor': [
            'lucide-vue-next',
            'reka-ui',
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
          ],
          'supabase-vendor': ['@supabase/supabase-js'],
          'i18n-vendor': ['vue-i18n'],
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
  },

  // Development server optimization
  server: {
    port: 1420,
    strictPort: true,
    host: '0.0.0.0',
    hmr: {
      port: 1421,
    },
  },

  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  // CSS optimization
  css: {
    devSourcemap: false,
    preprocessorOptions: {
      css: {
        charset: false,
      },
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      '@vueuse/core',
      'lucide-vue-next',
      'fuse.js',
      '@supabase/supabase-js',
      'vue-i18n',
      'reka-ui',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
    ],
    exclude: [
      '@tauri-apps/api',
      '@tauri-apps/plugin-haptics',
      '@tauri-apps/plugin-notification',
      '@tauri-apps/plugin-opener',
      '@tauri-apps/plugin-os',
      '@tauri-apps/plugin-store',
    ],
  },

  // Enable modern features
  esbuild: {
    target: 'es2020',
    format: 'esm',
  },

  // Performance optimizations
  define: {
    __VUE_OPTIONS_API__: false,
    __VUE_PROD_DEVTOOLS__: false,
  },

  // Vitest configuration
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    server: {
      deps: {
        inline: ['@vue', '@vueuse', 'vue-i18n'],
      },
    },
  },
});
