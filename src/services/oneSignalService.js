// COMMENTED OUT - OneSignal service replaced with FCM
// This file is kept for reference but should not be used

// Placeholder export to prevent import errors
export const oneSignalService = {
  initialize: () => Promise.reject(new Error('OneSignal service disabled')),
  requestPermission: () =>
    Promise.reject(new Error('OneSignal service disabled')),
  canRequestPermission: () => false,
  getDeviceId: () => Promise.reject(new Error('OneSignal service disabled')),
  setExternalUserId: () =>
    Promise.reject(new Error('OneSignal service disabled')),
  addTag: () => Promise.reject(new Error('OneSignal service disabled')),
  getState: () => ({
    isInitialized: false,
    userId: null,
    hasNotificationPermission: false,
    initError: 'Service disabled',
  }),
};
