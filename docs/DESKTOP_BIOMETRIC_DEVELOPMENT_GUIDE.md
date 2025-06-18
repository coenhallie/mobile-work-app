# Desktop Biometric Development Guide

This guide explains how to test biometric authentication (Touch ID) on macOS during development.

## Overview

The biometric authentication system has been updated to support desktop environments, specifically macOS Touch ID, in addition to mobile platforms. The system now properly detects whether it's running in a Tauri environment vs a web browser and provides appropriate feedback.

## Environment Detection

The app now detects three environments:

1. **Web Browser** (`npm run dev`) - Biometric authentication is not available
2. **Tauri Desktop** (`npm run tauri:dev`) - Touch ID available on macOS
3. **Tauri Mobile** - Fingerprint/Face ID available on mobile devices

## Development Commands

### For Biometric Testing (macOS Touch ID)

```bash
npm run tauri:dev
```

### For Web Development (No Biometric Support)

```bash
npm run dev
```

### For Fast Tauri Development (No File Watching)

```bash
npm run tauri:dev:fast
```

## Biometric Support by Platform

| Platform    | Biometric Type | Support Status   |
| ----------- | -------------- | ---------------- |
| macOS       | Touch ID       | ✅ Supported     |
| iOS         | Face ID        | ✅ Supported     |
| Android     | Fingerprint    | ✅ Supported     |
| Windows     | Windows Hello  | ❌ Not yet       |
| Linux       | -              | ❌ Not supported |
| Web Browser | -              | ❌ Not supported |

## Testing Touch ID on macOS

1. **Start the Tauri development server:**

   ```bash
   npm run tauri:dev
   ```

2. **Navigate to a biometric authentication component** (e.g., BiometricSettings, BiometricSetup)

3. **The app will:**
   - Detect that it's running in Tauri environment
   - Check if the platform is macOS
   - Show "Touch ID" as the biometric type
   - Allow you to test Touch ID authentication

## Error Messages and Troubleshooting

### "Biometric authentication is only available in the Tauri app environment"

- **Cause:** Running `npm run dev` instead of `npm run tauri:dev`
- **Solution:** Use `npm run tauri:dev` to test biometric features

### "Tauri biometric modules not available"

- **Cause:** Failed to load Tauri plugins
- **Solution:** Ensure you're running in Tauri environment and dependencies are installed

### "Biometric authentication is only supported on mobile devices and macOS"

- **Cause:** Running on unsupported platform (Windows/Linux)
- **Solution:** Test on macOS or mobile device

### "Failed to load Tauri biometric modules"

- **Cause:** Missing dependencies or configuration issues
- **Solution:** Run `npm install` and check Tauri configuration

## Implementation Details

### Dynamic Module Loading

The biometric composable now uses dynamic imports to load Tauri modules only when in Tauri environment:

```javascript
const getTauriModules = async () => {
  if (!isTauriEnvironment()) {
    return null;
  }

  const [biometric, os, store] = await Promise.all([
    import('@tauri-apps/plugin-biometric'),
    import('@tauri-apps/plugin-os'),
    import('@tauri-apps/plugin-store'),
  ]);

  return {
    authenticate: biometric.authenticate,
    platform: os.platform,
    Store: store.Store,
  };
};
```

### Environment Detection

```javascript
const isTauriEnvironment = () => {
  return typeof window !== 'undefined' && window.__TAURI__ !== undefined;
};
```

### Platform-Specific Biometric Types

- **macOS:** Touch ID (`biometricType: 'touch'`)
- **iOS:** Face ID (`biometricType: 'face'`)
- **Android:** Fingerprint (`biometricType: 'fingerprint'`)

## Configuration Files Updated

1. **`src-tauri/Cargo.toml`** - Added macOS to biometric plugin targets
2. **`src-tauri/capabilities/default.json`** - Added biometric permissions
3. **`src/composables/useBiometricAuth.js`** - Updated for environment detection and dynamic loading
4. **`package.json`** - Added `tauri:dev` script

## Best Practices

1. **Always test biometric features in Tauri environment** (`npm run tauri:dev`)
2. **Handle graceful fallbacks** when biometric authentication is not available
3. **Provide clear error messages** to guide users to the correct environment
4. **Test on actual devices** for the most accurate biometric behavior

## Next Steps

1. Test Touch ID authentication on your MacBook Pro
2. Verify error handling when running in web browser
3. Test the complete authentication flow
4. Consider adding Windows Hello support in the future

## Debugging Tips

1. **Check console logs** for detailed error messages
2. **Verify Tauri environment** by checking `window.__TAURI__`
3. **Test platform detection** by logging the detected platform
4. **Ensure proper permissions** in Tauri capabilities configuration

This setup allows you to properly test biometric authentication during development while providing clear feedback when the feature is not available.
