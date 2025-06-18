import { ref } from 'vue';

// Create singleton state that's shared across all components
const currentPosition = ref(null);
const isLoading = ref(false);
const error = ref(null);
const permissionStatus = ref(null);
const isSupported = ref(false);

export function useGeolocation() {
  // Initialize geolocation support check
  const checkSupport = async () => {
    try {
      // Check if we're in a Tauri environment
      if (typeof window !== 'undefined' && window.__TAURI__) {
        // Import Tauri geolocation plugin
        const { checkPermissions } = await import(
          '@tauri-apps/plugin-geolocation'
        );
        isSupported.value = true;

        // Check current permissions
        const permissions = await checkPermissions();
        permissionStatus.value = permissions.location;

        return true;
      } else {
        // Fallback to browser geolocation
        if ('geolocation' in navigator) {
          isSupported.value = true;
          permissionStatus.value = 'prompt'; // Browser doesn't expose permission status directly
          return true;
        } else {
          throw new Error('Geolocation not supported in browser');
        }
      }
    } catch (err) {
      error.value = 'Geolocation not available';
      isSupported.value = false;
      return false;
    }
  };

  // Request location permissions
  const requestPermissions = async () => {
    if (!isSupported.value) {
      error.value = 'Geolocation is not supported on this device';
      return false;
    }

    try {
      // Check if we're in a Tauri environment
      if (typeof window !== 'undefined' && window.__TAURI__) {
        const { requestPermissions, checkPermissions } = await import(
          '@tauri-apps/plugin-geolocation'
        );

        // First check current permissions
        const currentPermissions = await checkPermissions();
        permissionStatus.value = currentPermissions.location;

        // If already granted, return true
        if (currentPermissions.location === 'granted') {
          return true;
        }

        // Request permissions
        const permissions = await requestPermissions(['location']);
        permissionStatus.value = permissions.location;
        const granted = permissions.location === 'granted';

        return granted;
      } else {
        // Use browser geolocation API
        if ('geolocation' in navigator) {
          // Test if we can access geolocation (this will trigger permission request in browser)
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
              enableHighAccuracy: false,
            });
          });

          permissionStatus.value = 'granted';
          return true;
        } else {
          throw new Error('Geolocation not available in browser');
        }
      }
    } catch (err) {
      // Handle specific error cases
      if (err.code === 1) {
        // PERMISSION_DENIED
        permissionStatus.value = 'denied';
        error.value = 'Location permission was denied by the user';
      } else if (err.code === 2) {
        // POSITION_UNAVAILABLE
        permissionStatus.value = 'prompt';
        error.value = 'Location information is unavailable';
      } else if (err.code === 3) {
        // TIMEOUT
        permissionStatus.value = 'prompt';
        error.value = 'Location request timed out';
      } else {
        permissionStatus.value = 'denied';
        error.value = `Failed to request permissions: ${err.message}`;
      }

      return false;
    }
  };

  // Get current position
  const getCurrentPosition = async (options = {}) => {
    if (!isSupported.value) {
      error.value = 'Geolocation is not supported on this device';
      return null;
    }

    isLoading.value = true;
    error.value = null;

    try {
      // Check if we're in a Tauri environment
      if (typeof window !== 'undefined' && window.__TAURI__) {
        // Use Tauri geolocation plugin
        const { getCurrentPosition: getTauriPosition, checkPermissions } =
          await import('@tauri-apps/plugin-geolocation');

        // Double-check permissions before getting position
        const permissions = await checkPermissions();

        if (permissions.location !== 'granted') {
          throw new Error('Location permission not granted');
        }

        const defaultOptions = {
          enableHighAccuracy: true,
          timeout: 15000, // Increased timeout
          maximumAge: 300000, // 5 minutes
          ...options,
        };

        const position = await getTauriPosition(defaultOptions);

        currentPosition.value = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        return currentPosition.value;
      } else {
        // Use browser geolocation API
        if ('geolocation' in navigator) {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 300000,
              ...options,
            });
          });

          currentPosition.value = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };

          return currentPosition.value;
        } else {
          throw new Error('Geolocation not available in browser');
        }
      }
    } catch (err) {
      // Fallback to browser geolocation API
      try {
        if ('geolocation' in navigator) {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 300000,
            });
          });

          currentPosition.value = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };

          return currentPosition.value;
        }
      } catch (browserErr) {
        // Silent fallback failure
      }

      error.value = `Failed to get location: ${err.message}`;

      // Provide more specific error handling
      if (err.message.includes('permission')) {
        permissionStatus.value = 'denied';
      }

      return null;
    } finally {
      isLoading.value = false;
    }
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  };

  // Get contractors sorted by distance from current location
  const getContractorsByDistance = (contractors, userLocation = null) => {
    const location = userLocation || currentPosition.value;

    if (!location || !contractors) {
      return contractors;
    }

    return contractors
      .map((contractor) => {
        if (contractor.latitude && contractor.longitude) {
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            contractor.latitude,
            contractor.longitude
          );
          return { ...contractor, distance };
        }
        return { ...contractor, distance: Infinity };
      })
      .sort((a, b) => a.distance - b.distance);
  };

  // Format distance for display
  const formatDistance = (distance) => {
    if (distance === Infinity || distance === null || distance === undefined) {
      return 'Distance unknown';
    }

    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else {
      return `${distance.toFixed(1)}km`;
    }
  };

  // Watch position (for real-time updates)
  const watchPosition = async (callback, options = {}) => {
    if (!isSupported.value) {
      error.value = 'Geolocation is not supported on this device';
      return null;
    }

    try {
      const { watchPosition: watchTauriPosition } = await import(
        '@tauri-apps/plugin-geolocation'
      );

      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // 1 minute for watch
        ...options,
      };

      return await watchTauriPosition(defaultOptions, (position) => {
        currentPosition.value = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        callback(currentPosition.value);
      });
    } catch (err) {
      error.value = `Failed to watch location: ${err.message}`;
      return null;
    }
  };

  return {
    // State
    currentPosition,
    isLoading,
    error,
    permissionStatus,
    isSupported,

    // Methods
    checkSupport,
    requestPermissions,
    getCurrentPosition,
    calculateDistance,
    getContractorsByDistance,
    formatDistance,
    watchPosition,
  };
}
