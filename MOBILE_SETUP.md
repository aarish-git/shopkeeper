# Shopkeeper Mobile App - Development Guide

This project has been converted to a native mobile app using **Capacitor**. You can now build and run this app on Android and iOS devices.

## Project Structure

- **src/** - React source code (web app)
- **build/** - Built web assets (auto-generated)
- **android/** - Native Android project
- **ios/** - Native iOS project
- **capacitor.config.ts** - Capacitor configuration

## Prerequisites

### For Android Development

1. **Java Development Kit (JDK) 11+**
   - Download: https://www.oracle.com/java/technologies/javase-jdk11-downloads.html
   - Or use: `choco install openjdk11` (if you have Chocolatey)

2. **Android SDK & Android Studio**
   - Download: https://developer.android.com/studio
   - Install Android SDK, emulator, and build tools

3. **Gradle** (usually included with Android Studio)

### For iOS Development

iOS development requires **macOS** with:
- Xcode 12+
- CocoaPods
- iOS SDK

---

## Building for Mobile

### Step 1: Build the React App

Every time you make changes to the web code, rebuild:

```bash
npm run build
```

### Step 2: Sync Web Assets to Native Projects

Update the native projects with your latest web build:

```bash
npx cap sync
```

Or sync to a specific platform:

```bash
npx cap sync android
npx cap sync ios
```

---

## Running on Android

### Option A: Android Emulator (Recommended for Testing)

1. **Open Android Studio** and launch the Android Virtual Device (AVD) Manager
2. Create and start a virtual device (e.g., Pixel 5 with API 30+)

3. **From the terminal:**

```bash
# Navigate to android folder
cd android

# Build and run on emulator
./gradlew installDebug
```

Or use Android Studio directly:
- Open `android/` folder as a project
- Click **Run** → Select your emulator/device

### Option B: Physical Android Device

1. Enable **Developer Mode** on your Android phone:
   - Settings → About Phone → Tap Build Number 7 times
   - Settings → Developer Options → Enable USB Debugging

2. Connect phone via USB

3. **From terminal:**

```bash
cd android
./gradlew installDebug
```

The app will install and launch on your connected device.

---

## Running on iOS

> ⚠️ **Requires macOS with Xcode**

1. **Open the iOS project:**

```bash
open ios/App/App.xcworkspace
```

2. **In Xcode:**
   - Select your target device (simulator or physical iPhone)
   - Click **Run** (▶ button) or press `Cmd + R`

3. **Or from terminal:**

```bash
cd ios/App
pod install
xcodebuild -workspace App.xcworkspace -scheme App -configuration Release
```

---

## Development Workflow

1. **Make changes to React code** in `src/`
2. **Test in browser:**
   ```bash
   npm start
   ```
3. **Build React app:**
   ```bash
   npm run build
   ```
4. **Sync to native projects:**
   ```bash
   npx cap sync
   ```
5. **Run on mobile device/emulator** (see sections above)

---

## Useful Capacitor Commands

```bash
# Open native IDE
npx cap open android
npx cap open ios

# View logs from app
npx cap run android
npx cap run ios

# Copy web assets without sync (faster)
npx cap copy

# Update Capacitor to latest version
npm update @capacitor/core @capacitor/cli

# Clean Android build
cd android && ./gradlew clean
```

---

## Troubleshooting

### Android Issues

**Build fails: "SDK not found"**
- Set `ANDROID_HOME` environment variable:
  ```bash
  set ANDROID_HOME=C:\Users\[YourUsername]\AppData\Local\Android\Sdk
  ```

**App crashes on launch**
- Check logcat:
  ```bash
  adb logcat | grep shopkeeper
  ```

**Port already in use**
- Change port in `capacitor.config.ts`

### iOS Issues

**Pods not found**
- Navigate to `ios/App` and run:
  ```bash
  pod install
  ```

**Xcode build errors**
- Clean build folder: `Cmd + Shift + K`
- Delete DerivedData:
  ```bash
  rm -rf ~/Library/Developer/Xcode/DerivedData/*
  ```

---

## Key Features in Mobile App

✅ Add products with name, quantity, price, image, size  
✅ View all products  
✅ Add/remove from cart  
✅ Complete sales and track profit  
✅ View sold products with filters (Today, Week, Month, Year)  
✅ Generate PDF and Word bills  
✅ Persistent data storage using localStorage  
✅ Fully responsive mobile UI  

---

## Next Steps

1. **Install Android Studio** or **Xcode** (depending on platform)
2. **Run `npm run build`** to create web assets
3. **Run `npx cap sync`** to update native projects
4. **Open the native IDE** and deploy to device

For more info: https://capacitorjs.com/docs/basics/workflow
