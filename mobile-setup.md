# Mobile App Deployment Guide (Capacitor)

This project is configured with **Capacitor** to allow you to build native Android and iOS apps using the same web codebase.

## Prerequisites
1. **Android:** Install [Android Studio](https://developer.android.com/studio).
2. **iOS:** Install [Xcode](https://developer.apple.com/xcode/) (requires a Mac).
3. **Node.js:** Already installed in your environment.

## One-Time Setup
Run these commands in your terminal:

```bash
# Initialize Capacitor (Only if not already done)
npx cap init asonedealer com.asonedealer.app --web-dir dist

# Add the platforms
npx cap add android
npx cap add ios
```

## Building the App for Play Store / App Store

Every time you make changes to your React code and want to see them in the mobile app, follow these steps:

### 1. Build the Web App
```bash
npm run build
```

### 2. Sync to Native Platforms
This copies the `dist` folder into the Android and iOS projects.
```bash
npx cap sync
```

### 3. Open in IDE
#### Android (Play Store)
```bash
npx cap open android
```
- In Android Studio: **Build > Build Bundle(s) / APK(s) > Build Bundle(s)**.
- This gives you an `.aab` file ready for the Play Store.

#### iOS (App Store)
```bash
npx cap open ios
```
- In Xcode: Select a generic iOS device, then **Product > Archive**.
- Once archived, you can upload to App Store Connect.

## Instant Mobile Preview (No IDE Required)

If you want to test the app on your physical device immediately without installing Android Studio or Xcode:

1. **Use the Shared App URL:** Copy the **Shared App URL** from your project settings.
2. **Open on Phone:** Send this link to your mobile device and open it in Chrome (Android) or Safari (iOS).
3. **PWA Experience:** 
   - On **Android**: Tap the menu (three dots) and select "Add to Home screen".
   - On **iOS**: Tap the Share button and select "Add to Home Screen".
4. **Result:** The app will install on your home screen and function like a native app, allowing you to test interactions and layout instantly.

## Important Configurations
- **App Name:** You can change the name in `capacitor.config.ts`.
- **App Icon:** Use `@capacitor/assets` to generate icons and splash screens.
  ```bash
  npx @capacitor/assets generate
  ```
