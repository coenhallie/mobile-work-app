# Haptic Feedback Implementation Guide

This guide explains how to use the haptic feedback system in the mobile work app.

## Overview

The haptic feedback system provides native-like tactile feedback for user interactions on mobile devices. It's built using the `tauri-plugin-haptics` plugin and provides a Vue.js composable for easy integration.

## Setup

### 1. Tauri Configuration

The haptic feedback system is already configured in the Tauri application:

- **Cargo.toml**: `tauri-plugin-haptics = "2.0.0"` dependency added
- **lib.rs**: Plugin registered with `.plugin(tauri_plugin_haptics::init())`
- **mobile.json**: Haptics permissions configured for mobile platforms

### 2. JavaScript Composable

The `useHaptics()` composable provides wrapper functions for different types of haptic feedback:

```javascript
import { useHaptics } from '@/composables/useHaptics';

const {
  isHapticsAvailable,
  triggerSelection,
  triggerSuccess,
  triggerWarning,
  triggerError,
  triggerLight,
  triggerMedium,
  triggerHeavy,
  triggerRigid,
  triggerSoft,
} = useHaptics();
```

## Usage Examples

### 1. Button Component with Haptic Feedback

The Button component now supports haptic feedback through the `haptic-feedback` prop:

```vue
<template>
  <!-- Light haptic feedback for gentle interactions -->
  <Button haptic-feedback="light" @click="handleClick"> Light Touch </Button>

  <!-- Medium haptic feedback for standard buttons (default) -->
  <Button haptic-feedback="medium" @click="handleClick">
    Standard Button
  </Button>

  <!-- Heavy haptic feedback for important actions -->
  <Button haptic-feedback="heavy" @click="handleClick">
    Important Action
  </Button>

  <!-- Selection feedback for UI selections -->
  <Button haptic-feedback="selection" @click="handleClick">
    Select Item
  </Button>

  <!-- Success feedback for positive actions -->
  <Button haptic-feedback="success" @click="handleClick">
    Complete Task
  </Button>
</template>
```

### 2. Custom Implementation

For custom components, use the composable directly:

```vue
<script setup>
import { useHaptics } from '@/composables/useHaptics';

const { triggerSelection, triggerSuccess, isHapticsAvailable } = useHaptics();

const handleToggle = async () => {
  // Trigger selection feedback for toggle actions
  await triggerSelection();
  // Your toggle logic here
};

const handleSubmit = async () => {
  try {
    // Your submit logic here
    await triggerSuccess(); // Success feedback on completion
  } catch (error) {
    await triggerError(); // Error feedback on failure
  }
};
</script>
```

### 3. Navigation Feedback

The mobile bottom navigation automatically triggers selection feedback when navigating between screens.

## Haptic Feedback Types

### Impact Feedback

- **Light**: Gentle tap feedback for subtle interactions
- **Medium**: Standard feedback for regular button presses (default)
- **Heavy**: Strong feedback for important actions
- **Rigid**: Very strong feedback for critical actions (iOS 13+)
- **Soft**: Very gentle feedback for minimal interactions (iOS 13+)

### Notification Feedback

- **Success**: Positive feedback for successful actions
- **Warning**: Cautionary feedback for warning states
- **Error**: Negative feedback for error states

### Selection Feedback

- **Selection**: Feedback for UI selections and navigation

## Best Practices

### When to Use Haptic Feedback

✅ **Good Use Cases:**

- Button presses and taps
- Navigation between screens
- Toggle switches and selections
- Form submissions (success/error)
- Important confirmations
- Milestone achievements

❌ **Avoid Overuse:**

- Don't add haptics to every interaction
- Avoid haptics for rapid or repeated actions
- Don't use heavy feedback for minor interactions
- Avoid conflicting haptic patterns

### Feedback Intensity Guidelines

- **Light**: Minor UI interactions, gentle confirmations
- **Medium**: Standard buttons, regular interactions
- **Heavy**: Important actions, confirmations, warnings
- **Selection**: Navigation, toggles, picker selections
- **Success**: Completed tasks, successful submissions
- **Error**: Failed actions, validation errors

## Platform Support

- **iOS**: Full support for all haptic feedback types
- **Android**: Support varies by device and Android version
- **Desktop**: Haptic feedback is not available (gracefully ignored)

The `isHapticsAvailable()` function can be used to check if haptics are supported on the current platform.

## Testing

Visit `/haptic-demo` in the application to test different haptic feedback types and see usage examples.

## Error Handling

The haptic system includes built-in error handling:

- Gracefully fails on unsupported platforms
- Logs warnings for debugging
- Never blocks user interactions if haptics fail

All haptic functions are async but don't require awaiting unless you need to ensure the haptic completes before continuing.

## Integration Examples

### Form Validation

```javascript
const validateForm = async () => {
  if (isValid) {
    await triggerSuccess();
    // Submit form
  } else {
    await triggerError();
    // Show validation errors
  }
};
```

### Counter with Milestones

```javascript
const increment = async () => {
  count.value++;
  if (count.value % 10 === 0) {
    await triggerSuccess(); // Special feedback for milestones
  } else {
    await triggerLight(); // Regular feedback
  }
};
```

### Toggle States

```javascript
const toggle = async () => {
  await triggerSelection();
  isEnabled.value = !isEnabled.value;
};
```
