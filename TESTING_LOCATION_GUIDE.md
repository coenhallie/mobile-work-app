# How to Test Location Permissions & Get Location Prompts

## 🚀 Step-by-Step Testing Guide

### 1. **Build and Run the App**

First, you need to build the Tauri app to compile the Rust dependencies:

```bash
# Build and run in development mode
npm run tauri dev
```

**Important**: The location plugin only works in the compiled Tauri app, not in the browser!

### 2. **Test Location Functionality**

#### Option A: Use the Test Component

1. Navigate to `/location-test` in your app
2. Click the buttons in this order:
   - **"Check Support"** - Should show "Supported: Yes"
   - **"Request Permissions"** - This will trigger the location permission prompt
   - **"Get Location"** - Will get your GPS coordinates

#### Option B: Test the Real "Nearby" Filter

1. Go to `/contractors` or `/find-contractor`
2. Click the **"Nearby"** filter button
3. You should see a permission prompt asking for location access

### 3. **What You Should See**

#### On Android:

- A system dialog asking: "Allow [App Name] to access this device's location?"
- Options: "Allow" / "Deny" / "Allow only while using the app"

#### On iOS:

- A system dialog asking: "Allow [App Name] to use your location?"
- Options: "Don't Allow" / "Allow While Using App" / "Allow Once"

### 4. **If You Don't See Permission Prompts**

#### Check 1: Are you running the compiled app?

```bash
# Make sure you're running this, not just the web version
npm run tauri dev
```

#### Check 2: Verify plugin installation

Check that these files were updated:

- `src-tauri/Cargo.toml` - Should have `tauri-plugin-geolocation = "2.0.0"`
- `src-tauri/src/lib.rs` - Should have `.plugin(tauri_plugin_geolocation::init())`

#### Check 3: Check capabilities files

Verify these files have geolocation permissions:

- `src-tauri/capabilities/default.json`
- `src-tauri/capabilities/mobile.json`

### 5. **For Android - Additional Setup**

If building for Android, you need to add permissions to the manifest:

**File**: `src-tauri/gen/android/app/src/main/AndroidManifest.xml`

Add these lines inside the `<manifest>` tag:

```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

### 6. **Troubleshooting Common Issues**

#### Issue: "Geolocation plugin not available" error

**Solution**:

1. Clean and rebuild: `npm run tauri build --debug`
2. Make sure you're not testing in a browser

#### Issue: Permission prompt doesn't appear

**Solution**:

1. Check device location settings are enabled
2. Try on a physical device (emulators sometimes have issues)
3. Reset app permissions in device settings

#### Issue: "Permission denied" even after allowing

**Solution**:

1. Go to device Settings > Apps > [Your App] > Permissions
2. Manually enable Location permission
3. Restart the app

### 7. **Testing on Different Platforms**

#### Android Testing:

```bash
# Build for Android
npm run tauri android dev
```

#### iOS Testing:

```bash
# Build for iOS (requires macOS and Xcode)
npm run tauri ios dev
```

### 8. **Expected Behavior After Permission Granted**

1. **Location Test Component**: Should show your GPS coordinates
2. **Nearby Filter**: Should sort contractors by distance
3. **Contractor Cards**: Should display distances like "2.3km", "850m"

### 9. **Debug Console Output**

Open the developer console to see debug messages:

- Permission status changes
- Location coordinates
- Any error messages

### 10. **Manual Permission Reset (for testing)**

If you want to test the permission flow again:

#### Android:

1. Settings > Apps > [Your App] > Permissions > Location > Remove permission
2. Restart app and try again

#### iOS:

1. Settings > Privacy & Security > Location Services > [Your App] > Never
2. Restart app and try again

## 🎯 Quick Test Checklist

- [ ] App built with `npm run tauri dev`
- [ ] Navigate to `/location-test`
- [ ] Click "Check Support" (should show "Yes")
- [ ] Click "Request Permissions" (should show system prompt)
- [ ] Allow location access
- [ ] Click "Get Location" (should show coordinates)
- [ ] Test "Nearby" filter on contractor list
- [ ] Verify distance display in contractor cards

## 📱 Platform-Specific Notes

### Android:

- Requires `ACCESS_FINE_LOCATION` permission in manifest
- May need to enable "High accuracy" location mode in device settings
- Works on Android 6.0+ (API level 23+)

### iOS:

- Automatically handles permission requests
- Requires iOS 11.0+
- May need to enable Location Services in device settings

The location prompts are handled by the native platform, so they'll look and behave exactly like other apps requesting location permission on your device!
