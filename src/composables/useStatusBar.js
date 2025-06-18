import { ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';

// Status bar functionality - only available on mobile platforms
const isStatusBarAvailable = ref(false);

// Check if we're running on mobile platform
const checkMobilePlatform = async () => {
  try {
    const { platform } = await import('@tauri-apps/plugin-os');
    const currentPlatform = await platform();
    isStatusBarAvailable.value =
      currentPlatform === 'android' || currentPlatform === 'ios';
  } catch (error) {
    console.log('OS plugin not available, assuming desktop platform');
    isStatusBarAvailable.value = false;
  }
};

// Initialize platform check
checkMobilePlatform();

export function useStatusBar() {
  const isInitialized = ref(false);

  /**
   * Set the status bar color
   * @param {string} color - The background color (hex format)
   */
  const setColor = async (color) => {
    if (!isStatusBarAvailable.value) {
      console.warn('Status bar not available on this platform');
      return;
    }

    try {
      await invoke('plugin:status-bar-color|set_color', { color });
    } catch (error) {
      console.error('Failed to set status bar color:', error);
    }
  };

  /**
   * Initialize status bar with app theme
   * @param {Object} options - Configuration options
   * @param {string} options.backgroundColor - Background color
   */
  const initializeStatusBar = async (options = {}) => {
    if (!isStatusBarAvailable.value) {
      console.log('Status bar not available - skipping initialization');
      return;
    }

    const { backgroundColor = '#ffffff' } = options;

    try {
      // Set background color to match app header
      await setColor(backgroundColor);

      isInitialized.value = true;
      console.log('Status bar initialized successfully');
    } catch (error) {
      console.error('Failed to initialize status bar:', error);
    }
  };

  /**
   * Configure status bar for light theme
   */
  const setLightTheme = async () => {
    await setColor('#ffffff');
  };

  /**
   * Configure status bar for dark theme
   */
  const setDarkTheme = async () => {
    await setColor('#000000');
  };

  /**
   * Set status bar to transparent (for immersive experiences)
   */
  const setTransparent = async () => {
    if (!isStatusBarAvailable.value) {
      console.warn('Status bar not available on this platform');
      return;
    }

    try {
      // Use transparent color
      await invoke('plugin:status-bar-color|set_color', {
        color: '#00000000', // Fully transparent
      });
    } catch (error) {
      console.error('Failed to set transparent status bar:', error);
    }
  };

  /**
   * Set status bar style (light/dark content)
   */
  const setStyle = async (style = 'default') => {
    if (!isStatusBarAvailable.value) {
      console.warn('Status bar not available on this platform');
      return;
    }

    try {
      await invoke('plugin:status-bar-color|set_style', { style });
    } catch (error) {
      console.error('Failed to set status bar style:', error);
    }
  };

  return {
    isStatusBarAvailable,
    isInitialized,
    setColor,
    initializeStatusBar,
    setLightTheme,
    setDarkTheme,
    setTransparent,
    setStyle,
  };
}
