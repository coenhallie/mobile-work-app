# Mobile Installation Guide for Tauri 2 App

This guide will help you install your Tauri 2 mobile work app on your phone.

## Prerequisites

### For Android

- Android Studio with Android SDK
- USB Debugging enabled on your Android device
- Or ability to install APK files from unknown sources

### For iOS

- Xcode (full version, not just Command Line Tools)
- Apple Developer account ($99/year for device installation)
- iPhone with iOS 13.0 or later

## Installation Methods

### Android Installation

#### Method 1: Direct Development Install (Recommended for testing)

1. **Initialize Android target** (first time only):

   ```bash
   npm run mobile:android:init
   ```

2. **Connect your Android device**:

   - Enable Developer Options on your phone
   - Enable USB Debugging
   - Connect via USB cable

3. **Install and run on device**:
   ```bash
   npm run mobile:android:dev
   ```

#### Method 2: Build APK for Manual Installation

1. **Build the APK**:

   ```bash
   npm run mobile:android:build
   ```

2. **Locate the APK file**:

   - Find it in: `src-tauri/gen/android/app/build/outputs/apk/debug/app-debug.apk`

3. **Install on your phone**:
   - Transfer APK to your phone
   - Enable "Install from Unknown Sources" in Settings
   - Tap the APK file to install

### iOS Installation

#### Method 1: Development Install (Requires Apple Developer Account)

1. **Initialize iOS target** (first time only):

   ```bash
   npm run mobile:ios:init
   ```

2. **Connect your iPhone**:

   - Connect via USB cable
   - Trust this computer when prompted

3. **Install and run on device**:

   ```bash
   npm run mobile:ios:dev
   ```

4. **Trust the developer certificate**:
   - Go to Settings > General > VPN & Device Management
   - Trust your developer certificate

#### Method 2: TestFlight Distribution (For wider testing)

1. **Build for release**:

   ```bash
   npm run mobile:ios:build
   ```

2. **Upload to App Store Connect**:

   - Use Xcode or Application Loader
   - Submit for TestFlight review

3. **Distribute via TestFlight**:
   - Add testers in App Store Connect
   - Send TestFlight invitations

## Troubleshooting

### Android Issues

**"Command not found" errors:**

- Make sure Android Studio and SDK are properly installed
- Set ANDROID_HOME environment variable
- Add Android SDK tools to your PATH

**Device not detected:**

- Enable USB Debugging
- Install proper USB drivers for your device
- Try different USB cables/ports

**Build failures:**

- Check that you have the correct Android SDK version
- Ensure Java 11 or later is installed
- Clear build cache: `cd src-tauri/gen/android && ./gradlew clean`

### iOS Issues

**No Developer Teams found:**

- Sign in to Xcode with your Apple ID
- Join the Apple Developer Program
- Configure your team in Xcode preferences

**Code signing errors:**

- Ensure your Apple Developer account is active
- Check provisioning profiles in Xcode
- Verify bundle identifier matches your app ID

**Device not trusted:**

- Trust the computer on your iPhone
- Trust the developer certificate in iPhone settings

## App Features on Mobile

Your app includes these mobile-specific features:

- ✅ Biometric authentication (fingerprint/face unlock)
- ✅ Haptic feedback
- ✅ Push notifications
- ✅ Geolocation services
- ✅ Status bar customization
- ✅ Local storage

## Development Tips

1. **Hot Reload**: Use `npm run mobile:android:dev` or `npm run mobile:ios:dev` for development with hot reload

2. **Debugging**:

   - Android: Use Chrome DevTools or Android Studio logcat
   - iOS: Use Safari Web Inspector or Xcode console

3. **Testing**: Test on multiple devices and screen sizes

4. **Performance**: Monitor app performance on actual devices, not just simulators

## Next Steps

1. Choose your target platform (Android/iOS)
2. Install the required development tools
3. Run the initialization command for your platform
4. Build and install on your device
5. Test all app features on the mobile device

## Support

If you encounter issues:

1. Check the Tauri documentation: https://tauri.app/v1/guides/building/mobile
2. Review the troubleshooting section above
3. Check device compatibility requirements
4. Ensure all prerequisites are properly installed
