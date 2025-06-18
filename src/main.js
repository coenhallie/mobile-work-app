import { createApp } from 'vue';
import './style.css'; // Import critical CSS first
import App from './App.vue';

// Lazy load non-critical imports
const loadApp = async () => {
  // Show loading state immediately
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'app-loading';
  loadingDiv.innerHTML = '<div class="loading-spinner"></div>';
  document.body.appendChild(loadingDiv);

  try {
    // Parallel import of critical modules
    const [
      { default: router },
      { createPinia },
      // useTheme will be imported directly now
      { default: i18n },
    ] = await Promise.all([
      import('./router'),
      import('pinia'),
      // import('./composables/useTheme'), // No longer part of this Promise.all
      import('./i18n'),
    ]);

    // Composables will be initialized when first used in components
    // No need for eager initialization here

    // Create a global ready state
    window.__APP_READY__ = false;

    // Create the Vue app
    const app = createApp(App);

    // Initialize theme system early by importing its parts
    // currentTheme will be directly available from the imported module
    const { currentTheme } = await import('./composables/useTheme');

    // Initialize Supabase auth

    const pinia = createPinia();

    // Disable Pinia devtools logs in production
    if (!import.meta.env.DEV) {
      pinia._p.forEach((plugin) => {
        if (plugin.id === 'pinia:devtools') {
          plugin.app.config.globalProperties.$pinia = undefined;
        }
      });
    }

    app.use(pinia);
    app.use(router);
    app.use(i18n);

    // Optimized router hooks - minimal logging in production
    const isDev = import.meta.env.DEV;

    if (isDev) {
      router.onError((error) => {
        console.error('[ROUTER] Navigation error:', error.message);
      });
    }

    // Mount the app with Supabase authentication
    const mountApp = async () => {
      try {
        // Mount app
        app.mount('#app');

        // Remove loading state
        document.body.removeChild(loadingDiv);

        // Set ready state after everything is initialized
        window.__APP_READY__ = true;
        window.dispatchEvent(new CustomEvent('app:ready'));

        if (isDev) {
          // Load diagnostic commands for debugging in development
          import('./lib/chatDiagnosticCommands').catch((err) => {
            console.warn('Failed to load chat diagnostic commands:', err);
          });
        }
      } catch (error) {
        console.error('[MAIN] Failed to mount app:', error);
        throw error;
      }
    };

    // Execute the mounting process
    await mountApp();
  } catch (error) {
    console.error('Failed to load app:', error);
    // Remove loading state and continue with basic app
    if (document.body.querySelector('.app-loading')) {
      document.body.removeChild(document.body.querySelector('.app-loading'));
    }

    // Create a minimal Vue app without authentication
    try {
      // Ensure any existing app is unmounted first
      const appElement = document.getElementById('app');
      if (appElement && appElement.__vue_app__) {
        appElement.__vue_app__.unmount();
      }

      const { createApp } = await import('vue');
      const { createPinia } = await import('pinia');
      const { default: router } = await import('./router');
      const { default: i18n } = await import('./i18n');

      const fallbackApp = createApp({
        template:
          '<div>App loaded without authentication. Please check console for errors.</div>',
      });

      fallbackApp.use(createPinia());
      fallbackApp.use(router);
      fallbackApp.use(i18n);
      fallbackApp.mount('#app');

      // Set app ready state for fallback
      window.__APP_READY__ = true;
      window.dispatchEvent(new CustomEvent('app:ready'));

      console.log('Minimal app loaded successfully');
    } catch (fallbackError) {
      console.error('Failed to load minimal app:', fallbackError);
      // Show error state as last resort
      document.body.innerHTML = `
        <div class="app-loading">
          <div style="color: #ff6b6b; text-align: center;">
            <h2>Loading Error</h2>
            <p>Please refresh the page</p>
            <p style="font-size: 12px;">Error: ${error.message}</p>
          </div>
        </div>
      `;
    }
  }
};

// Start loading immediately
loadApp();
