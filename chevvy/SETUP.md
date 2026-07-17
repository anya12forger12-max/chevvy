# Chevvy Privacy Policy Module - Setup Guide

## 🚀 Quick Start

### Option 1: Automated Installation (Recommended)

#### On macOS/Linux:
```bash
chmod +x install.sh
./install.sh
```

#### On Windows:
```cmd
install.bat
```

### Option 2: Manual Installation

#### Prerequisites
- Flutter 3.0+
- Dart 3.0+
- Git
- Firebase account

#### Step 1: Clone Repository
```bash
git clone https://github.com/anyaforger123456/chevvy.git
cd chevvy
```

#### Step 2: Install Dependencies
```bash
flutter clean
flutter pub get
```

#### Step 3: Run Build Runner (if needed)
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

#### Step 4: Format and Analyze
```bash
dart format lib/
flutter analyze
```

## 🔧 Firebase Configuration

### Android Setup

1. **Download Configuration File**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project
   - Click on Android app
   - Download `google-services.json`

2. **Add to Project**
   - Place file in: `android/app/google-services.json`
   - Update `android/build.gradle`

### iOS Setup

1. **Download Configuration File**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project
   - Click on iOS app
   - Download `GoogleService-Info.plist`

2. **Add to Project**
   - Open `ios/Runner.xcworkspace` in Xcode
   - Drag `GoogleService-Info.plist` into Runner project

### Update Firebase Options

Edit `lib/firebase_options.dart` with your credentials:

```dart
static const FirebaseOptions android = FirebaseOptions(
  apiKey: 'YOUR_ANDROID_API_KEY',
  appId: 'YOUR_ANDROID_APP_ID',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  projectId: 'your-project-id',
  storageBucket: 'your-project-id.appspot.com',
);
```

## 🗄️ Firestore Database Setup

### Create Collections

In Firebase Console:
1. Click "Create Collection"
2. Name: `users`
3. Click "Auto ID" for first document

### Set Security Rules

In Firebase Console → Firestore → Rules:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
      allow create: if request.auth.uid == uid;
      allow update: if request.auth.uid == uid && 
                       request.resource.data.privacyAccepted == true;
    }
  }
}
```

## ▶️ Running the Application

### List Available Devices
```bash
flutter devices
```

### Run on Default Device
```bash
flutter run
```

### Run on Specific Device
```bash
flutter run -d <device_id>
```

### Run on Specific Platforms
```bash
# Android
flutter run -d android

# iOS
flutter run -d ios

# Web
flutter run -d chrome

# Windows
flutter run -d windows

# macOS
flutter run -d macos

# Linux
flutter run -d linux
```

## 📱 Device Setup

### Android Device Setup

```bash
# Enable Developer Mode
# Settings → About Phone → Tap Build Number 7 times

# Enable USB Debugging
# Settings → Developer Options → USB Debugging
```

### iOS Device Setup

```bash
# Enable Developer Mode
# Settings → Privacy & Security → Developer Mode (toggle ON)

# Trust Developer Certificate
# Settings → General → VPN & Device Management
```

## ✅ Post-Installation Checklist

- [ ] Flutter installed and in PATH
- [ ] All dependencies installed
- [ ] Firebase project created
- [ ] Firebase credentials configured
- [ ] Firestore database created
- [ ] Security rules deployed
- [ ] Android setup complete
- [ ] iOS setup complete
- [ ] Firebase options updated
- [ ] App runs successfully

## 🎯 Next Steps

1. **Customize Privacy Policy**
   - Edit `lib/screens/privacy_policy_screen.dart`
   - Modify policy content sections

2. **Customize UI**
   - Update colors in `lib/main.dart`
   - Customize gradients and themes

3. **Implement Authentication**
   - Add Spotify login
   - Configure OAuth

4. **Build Protected Screens**
   - Implement Dashboard
   - Build Notes, Scheduler screens

## 📞 Support

For issues:
1. Check [GitHub Issues](https://github.com/anyaforger123456/chevvy/issues)
2. Review [Firebase Documentation](https://firebase.google.com/docs)
3. Check [Flutter Documentation](https://flutter.dev/docs)

---

**Happy coding! 🚀**
