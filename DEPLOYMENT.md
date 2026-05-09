# Deployment Guide for AsOne Dealer

This guide explains how to take this project and publish it to the Google Play Store and Apple App Store.

## Prerequisites
1. **Developer Accounts**:
   - [Google Play Console](https://play.google.com/console) account ($25 one-time fee).
   - [Apple Developer Program](https://developer.apple.com/programs/) account ($99/year).
2. **Tools Installed**:
   - [Android Studio](https://developer.android.com/studio) for Android deployment.
   - [Xcode](https://developer.apple.com/xcode/) (macOS only) for iOS deployment.

## Step-by-Step Instructions

### 1. Build and Sync
Run the following command to prepare your web files and sync them to native projects:
```bash
npm run mobile:sync
```

### 2. Android Deployment (Play Store)
1. **Open Android Studio**:
   ```bash
   npm run mobile:android
   ```
2. **Generate Signed Bundle**:
   - In Android Studio, go to `Build > Generate Signed Bundle / APK`.
   - Select `Android App Bundle`.
   - Create a new Key Store (keep this safe!).
   - Follow prompts to generate the `.aab` file.
3. **Upload to Play Console**:
   - Create a new app in Play Console.
   - Go to `Testing > Production` and upload your `.aab` file.

### 3. iOS Deployment (App Store) - macOS required
1. **Open Xcode**:
   ```bash
   npm run mobile:ios
   ```
2. **Set Bundle Identifier**:
   - In Xcode, go to the `Signing & Capabilities` tab.
   - Ensure your Team is selected and the Bundle Identifier matches `com.asonedealer.app`.
3. **Archive and Upload**:
   - Select `Product > Archive`.
   - Once finished, click `Distribute App` and follow the App Store Connect prompts.

## Professional Checklist
- [ ] **Icons**: Replace `public/assets/icon.png` and `splash.png` with your branding.
- [ ] **Privacy Policy**: Required by both stores. Host it on your website.
- [ ] **Firebase Setup**: Ensure your Android and iOS app IDs are registered in the Firebase Console.
- [ ] **Key Management**: NEVER share your `.jks` (Android) or distribution certificates (iOS) publicly.

---
*Generated for AsOne Dealer Production Deployment*
