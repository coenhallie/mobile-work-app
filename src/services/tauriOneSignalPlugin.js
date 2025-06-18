// COMMENTED OUT - OneSignal Tauri plugin replaced with FCM
// This file is kept for reference but should not be used

// Placeholder export to prevent import errors
export const tauriOneSignalPlugin = {
  initialize: () =>
    Promise.reject(new Error('OneSignal Tauri plugin disabled')),
  requestPermission: () =>
    Promise.reject(new Error('OneSignal Tauri plugin disabled')),
  registerDevice: () =>
    Promise.reject(new Error('OneSignal Tauri plugin disabled')),
  sendTag: () => Promise.reject(new Error('OneSignal Tauri plugin disabled')),
  onNotificationOpened: () => console.warn('OneSignal Tauri plugin disabled'),
};
