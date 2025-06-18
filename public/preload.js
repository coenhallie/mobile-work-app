// Critical resource preloader for mobile optimization
(function () {
  'use strict';

  // Preload critical fonts
  const preloadFont = (url, type = 'font/woff2') => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = type;
    link.href = url;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  };

  // Preload critical CSS
  const preloadCSS = (url) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = url;
    document.head.appendChild(link);
  };

  // Preload critical JavaScript modules
  const preloadJS = (url) => {
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = url;
    document.head.appendChild(link);
  };

  // Set up critical CSS variables early to prevent FOUC
  const setCriticalCSS = () => {
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --background: #1a1a1a;
        --foreground: #ffffff;
        --primary: oklch(0.55 0.25 265);
      }
      
      html, body {
        background-color: var(--background);
        color: var(--foreground);
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      #app {
        min-height: 100vh;
        background-color: var(--background);
      }
      
      .loading-state {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background-color: var(--background);
      }
      
      .loading-spinner {
        width: 32px;
        height: 32px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid var(--primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  };

  // Optimize viewport for mobile
  const optimizeViewport = () => {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    viewport.content =
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
  };

  // Add mobile-specific meta tags
  const addMobileMeta = () => {
    const metas = [
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'black-translucent',
      },
      { name: 'theme-color', content: '#1a1a1a' },
      { name: 'msapplication-navbutton-color', content: '#1a1a1a' },
      { name: 'apple-mobile-web-app-title', content: 'HandyApp' },
    ];

    metas.forEach(({ name, content }) => {
      if (!document.querySelector(`meta[name="${name}"]`)) {
        const meta = document.createElement('meta');
        meta.name = name;
        meta.content = content;
        document.head.appendChild(meta);
      }
    });
  };

  // Performance monitoring
  const setupPerformanceMonitoring = () => {
    if ('performance' in window) {
      // Performance monitoring removed for cleaner console output
      window.addEventListener('load', () => {
        // App load complete - performance data available if needed
      });
    }
  };

  // Initialize optimizations
  const init = () => {
    setCriticalCSS();
    optimizeViewport();
    addMobileMeta();
    setupPerformanceMonitoring();

    // Preload critical Google Fonts
    preloadFont(
      'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
    );
    preloadFont(
      'https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecnFHGPc.woff2'
    );
  };

  // Run immediately if DOM is ready, otherwise wait
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
