import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Check if code is running in a client environment (browser)
 * @returns {boolean} True if running in a browser
 */
export function isClient() {
  return typeof window !== 'undefined';
}

/**
 * Check if the current environment is a mobile device
 * @returns {boolean} True if running on a mobile device
 */
export function isMobile() {
  if (!isClient()) return false;

  try {
    // Try to detect from Tauri environment first
    const userAgent = navigator.userAgent.toLowerCase();
    return (
      userAgent.includes('android') ||
      userAgent.includes('iphone') ||
      userAgent.includes('ipad') ||
      userAgent.includes('ipod')
    );
  } catch (e) {
    return false;
  }
}

/**
 * Check if the current environment is iOS
 * @returns {boolean} True if running on iOS
 */
export function isIOS() {
  if (!isClient()) return false;

  try {
    const userAgent = navigator.userAgent.toLowerCase();
    return (
      userAgent.includes('iphone') ||
      userAgent.includes('ipad') ||
      userAgent.includes('ipod')
    );
  } catch (e) {
    return false;
  }
}

/**
 * Check if the current environment is Android
 * @returns {boolean} True if running on Android
 */
export function isAndroid() {
  if (!isClient()) return false;

  try {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('android');
  } catch (e) {
    return false;
  }
}
