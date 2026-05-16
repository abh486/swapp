# Mobile Environment Setup

This document outlines the strict environmental requirements and version locks for the Swapp React Native project to ensure a stable and clean build process across Android and iOS.

## Environment Versions
- **Node**: `>= 22.11.0` (as defined in `package.json`)
- **Java**: `JDK 17` (Recommended standard for React Native, though JDK 21 may also be used if mandated by newer Android Studio versions)
- **React Native**: `0.84.0`

### Android Specifics
- **Android Studio**: `Ladybug` (or the latest stable version)
- **Gradle Version**: `9.0.0`
- **NDK Version**: `27.1.12297006`
- **compileSdkVersion**: `36`
- **targetSdkVersion**: `36`
- **minSdkVersion**: `24`

### iOS Specifics
- **XCode**: Latest Stable (15.x or 16.x)
- **CocoaPods**: Ensure you are using the latest version.
- **Deployment Target**: iOS 15.1+

## Setup Steps

### 1. Prerequisites
Ensure Node, JDK 17, Android Studio, and Xcode are installed properly on your system.

### 2. Node Dependencies
We strictly **avoid floating dependency versions**. All versions in `package.json` must be locked to exact versions to prevent unexpected breakages across different machines. 

```bash
# Install dependencies (ensure --save-exact is used when adding new ones)
npm install
```

### 3. iOS Setup
```bash
cd ios
# Install pods based on Podfile.lock
pod install
cd ..
```

### 4. Android Setup
Ensure your `ANDROID_HOME` is set up correctly and the correct SDK packages are installed via SDK Manager in Android Studio. You will specifically need:
- **Android SDK Platform 36**
- **Android SDK Build-Tools 36.0.0**
- **NDK (Side by side) 27.1.12297006**

```bash
# Clean and sync Gradle
cd android
./gradlew clean
cd ..
```

### 5. Running the App
- **iOS**: `npm run ios`
- **Android**: `npm run android`

## Dependency & Patch Guidelines

- **No Floating Versions**: Always install packages with the `--save-exact` flag (`npm install <package> --save-exact`). Do not use `^` or `~` in `package.json`. The package.json has been scrubbed of floating versions to ensure stability.
- **Patch Package**: If a native module or react-native itself requires a fix, DO NOT manually modify `node_modules` permanently or fork unnecessarily. Use `patch-package`:
  ```bash
  # 1. Install patch-package if not already available
  npm install patch-package --save-exact

  # 2. Make your changes in node_modules/package-name
  
  # 3. Create the patch
  npx patch-package package-name
  
  # 4. This will create a patches/ directory. Commit this directory.
  ```
- **Avoid Unnecessary Native Upgrades**: Do not upgrade native dependencies (like Gradle, Kotlin, or buildToolsVersion) unless explicitly required by a new React Native version or a critical security patch. Keep the native environment clean and aligned with the current React Native version (`0.84.0`).
