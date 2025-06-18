#!/bin/bash

# Script to sign Android APK for installation on Samsung S23
set -e

echo "🔐 Setting up Android APK signing for Samsung S23..."

# Navigate to Android project directory
cd src-tauri/gen/android

# Check if keystore exists, if not create it
if [ ! -f "debug.keystore" ]; then
    echo "📱 Creating debug keystore..."
    keytool -genkey -v -keystore debug.keystore \
        -alias androiddebugkey \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -storepass android \
        -keypass android \
        -dname "CN=Android Debug,O=Android,C=US"
    echo "✅ Debug keystore created"
fi

# Create keystore.properties if it doesn't exist
if [ ! -f "keystore.properties" ]; then
    echo "📝 Creating keystore.properties..."
    cat > keystore.properties << EOF
storeFile=debug.keystore
keyAlias=androiddebugkey
storePassword=android
keyPassword=android
EOF
    echo "✅ Keystore properties created"
fi

# Find the unsigned APK
UNSIGNED_APK="app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk"
SIGNED_APK="app/build/outputs/apk/universal/release/app-universal-release-signed.apk"

if [ ! -f "$UNSIGNED_APK" ]; then
    echo "❌ Unsigned APK not found at: $UNSIGNED_APK"
    echo "Please run: npm run mobile:android:build-apk first"
    exit 1
fi

echo "🔏 Signing APK..."

# Sign the APK using jarsigner
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
    -keystore debug.keystore \
    -storepass android \
    -keypass android \
    "$UNSIGNED_APK" \
    androiddebugkey

# Rename to signed APK
cp "$UNSIGNED_APK" "$SIGNED_APK"

echo "✅ APK signed successfully!"
echo "📱 Signed APK location: $(pwd)/$SIGNED_APK"

# Verify the signature
echo "🔍 Verifying APK signature..."
jarsigner -verify -verbose -certs "$SIGNED_APK"

if [ $? -eq 0 ]; then
    echo "✅ APK signature verified - ready for Samsung S23!"
    echo ""
    echo "📋 Installation instructions:"
    echo "1. Enable USB Debugging on your Samsung S23"
    echo "2. Connect via USB cable"
    echo "3. Run: adb install '$SIGNED_APK'"
    echo "   OR"
    echo "4. Transfer APK to phone and install manually"
    echo ""
    echo "🎉 Your app should now install without the 'invalid package' error!"
else
    echo "❌ APK signature verification failed"
    exit 1
fi