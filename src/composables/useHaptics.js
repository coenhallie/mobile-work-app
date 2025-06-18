import {
  vibrate,
  impactFeedback,
  notificationFeedback,
  selectionFeedback,
} from '@tauri-apps/plugin-haptics';

/**
 * Composable for haptic feedback functionality
 * Provides wrapper functions for different types of haptic feedback
 */
export function useHaptics() {
  /**
   * Check if haptics are available on the current platform
   */
  const isHapticsAvailable = () => {
    try {
      // Check if we're in a Tauri environment and haptics are supported
      return (
        typeof window !== 'undefined' &&
        window.__TAURI__ &&
        typeof impactFeedback === 'function'
      );
    } catch (error) {
      console.warn('Haptics not available:', error);
      return false;
    }
  };

  /**
   * Trigger selection haptic feedback
   * Used for UI selections like tapping buttons, selecting items
   */
  const triggerSelection = async () => {
    if (!isHapticsAvailable()) return;

    try {
      await selectionFeedback();
    } catch (error) {
      console.warn('Selection haptic failed:', error);
    }
  };

  /**
   * Trigger success notification haptic
   * Used for successful actions like form submissions, completions
   */
  const triggerSuccess = async () => {
    if (!isHapticsAvailable()) return;

    try {
      await notificationFeedback('success');
    } catch (error) {
      console.warn('Success haptic failed:', error);
    }
  };

  /**
   * Trigger warning notification haptic
   * Used for warning states or cautionary actions
   */
  const triggerWarning = async () => {
    if (!isHapticsAvailable()) return;

    try {
      await notificationFeedback('warning');
    } catch (error) {
      console.warn('Warning haptic failed:', error);
    }
  };

  /**
   * Trigger error notification haptic
   * Used for error states or failed actions
   */
  const triggerError = async () => {
    if (!isHapticsAvailable()) return;

    try {
      await notificationFeedback('error');
    } catch (error) {
      console.warn('Error haptic failed:', error);
    }
  };

  /**
   * Trigger light impact haptic
   * Used for gentle tap feedback, subtle interactions
   */
  const triggerLight = async () => {
    if (!isHapticsAvailable()) return;

    try {
      await impactFeedback('light');
    } catch (error) {
      console.warn('Light impact haptic failed:', error);
    }
  };

  /**
   * Trigger medium impact haptic
   * Used for standard button presses, moderate interactions
   */
  const triggerMedium = async () => {
    if (!isHapticsAvailable()) return;

    try {
      await impactFeedback('medium');
    } catch (error) {
      console.warn('Medium impact haptic failed:', error);
    }
  };

  /**
   * Trigger heavy impact haptic
   * Used for strong feedback, important actions, confirmations
   */
  const triggerHeavy = async () => {
    if (!isHapticsAvailable()) return;

    try {
      await impactFeedback('heavy');
    } catch (error) {
      console.warn('Heavy impact haptic failed:', error);
    }
  };

  /**
   * Trigger rigid impact haptic (iOS 13+)
   * Used for very strong feedback, critical actions
   */
  const triggerRigid = async () => {
    if (!isHapticsAvailable()) return;

    try {
      await impactFeedback('rigid');
    } catch (error) {
      console.warn('Rigid impact haptic failed:', error);
    }
  };

  /**
   * Trigger soft impact haptic (iOS 13+)
   * Used for very gentle feedback, minimal interactions
   */
  const triggerSoft = async () => {
    if (!isHapticsAvailable()) return;

    try {
      await impactFeedback('soft');
    } catch (error) {
      console.warn('Soft impact haptic failed:', error);
    }
  };

  /**
   * Trigger vibration with duration
   * Used for basic vibration feedback
   */
  const triggerVibrate = async (duration = 100) => {
    if (!isHapticsAvailable()) return;

    try {
      await vibrate(duration);
    } catch (error) {
      console.warn('Vibration haptic failed:', error);
    }
  };

  return {
    // Availability check
    isHapticsAvailable,

    // Selection feedback
    triggerSelection,

    // Notification feedback
    triggerSuccess,
    triggerWarning,
    triggerError,

    // Impact feedback
    triggerLight,
    triggerMedium,
    triggerHeavy,
    triggerRigid,
    triggerSoft,

    // Vibration
    triggerVibrate,
  };
}
