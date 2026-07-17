# Chevvy - Privacy Policy Module

A complete production-ready Privacy Policy module for Flutter mobile application with Firebase integration, Material 3 design, and comprehensive security features.

## 📋 Overview

This Privacy Policy module ensures users accept the privacy policy before accessing any app functionality. If users refuse, they are immediately logged out with all local session information removed.

## ✨ Features

- ✅ Full-screen Privacy Policy screen with Material 3 UI
- ✅ Cherry-themed branding with gradient backgrounds
- ✅ Dark mode and light mode support
- ✅ Complete accessibility support (screen readers, keyboard navigation, large text)
- ✅ Firebase Firestore integration
- ✅ SharedPreferences local caching
- ✅ Flutter Secure Storage for sensitive data
- ✅ GoRouter navigation with privacy guards
- ✅ Route protection for dashboard and protected screens
- ✅ Production-ready error handling and loading states
- ✅ High contrast compatibility
- ✅ Semantics widgets for accessibility

## 🏗️ Architecture

```
lib/
├── models/
│   └── user_privacy_model.dart          # User privacy data model
│
├── services/
│   ├── privacy_service.dart             # Privacy policy management service
│   └── auth_guard_service.dart          # Authentication and privacy guard service
│
├── guards/
│   └── privacy_guard.dart               # Route protection guard
│
├── screens/
│   └── privacy_policy_screen.dart       # Main Privacy Policy UI
│
├── widgets/
│   └── privacy_policy_card.dart         # Reusable card and checkbox widgets
│
├── firebase_options.dart                # Firebase configuration
└── main.dart                            # App entry point with GoRouter setup
```

## 📦 Installation

### Prerequisites

- Flutter 3.0 or higher
- Dart 3.0 or higher
- Firebase project setup
- Git

### Quick Installation

#### Option 1: Automated Installation (Recommended)

**On macOS/Linux:**
```bash
git clone https://github.com/anyaforger123456/chevvy.git
cd chevvy
chmod +x install.sh
./install.sh
```

**On Windows:**
```cmd
git clone https://github.com/anyaforger123456/chevvy.git
cd chevvy
install.bat
```

#### Option 2: Manual Installation

```bash
# Clone repository
git clone https://github.com/anyaforger123456/chevvy.git
cd chevvy

# Install dependencies
flutter clean
flutter pub get

# Format and analyze
dart format lib/
flutter analyze
```

### Step 3: Configure Firebase

**For Android:**
1. Download `google-services.json` from Firebase Console
2. Place in `android/app/google-services.json`

**For iOS:**
1. Download `GoogleService-Info.plist` from Firebase Console
2. Add to iOS Runner project in Xcode

**For All Platforms:**
1. Update `lib/firebase_options.dart` with your credentials

### Step 4: Setup Firestore Security Rules

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

### Step 5: Run the Application

```bash
flutter run
```

## 🔧 Usage

### Basic Integration

```dart
import 'services/privacy_service.dart';

final privacyService = PrivacyService();

// Check if privacy is accepted
bool accepted = await privacyService.checkPrivacyAcceptance();

// Accept privacy policy
await privacyService.acceptPrivacyPolicy();

// Decline privacy policy
await privacyService.declinePrivacyPolicy();
```

### Route Protection

Routes are automatically protected by `PrivacyGuard`. Protected routes:
- `/dashboard`
- `/notes`
- `/scheduler`
- `/spotify`
- `/settings`

## 🎨 Customization

### Modify Privacy Policy Content

Edit `lib/screens/privacy_policy_screen.dart` method `_buildPolicyContent()`

### Change Color Scheme

Update `lib/main.dart` theme configuration

## 🔐 Security Features

- Encrypted storage with Flutter Secure Storage
- Firestore security rules for user-specific access
- Automatic logout on privacy decline
- Session management
- All sensitive data encrypted

## ♿ Accessibility

- Screen Reader Support
- Keyboard Navigation
- High Contrast Compatibility
- Large Text Support
- Semantics Widgets

## 📱 Supported Platforms

- ✅ Android (API 21+)
- ✅ iOS (12.0+)
- ✅ Web
- ✅ Windows
- ✅ macOS
- ✅ Linux

## 📚 Documentation

See `SETUP.md` for detailed setup and installation guide.

## 🐛 Troubleshooting

### Firebase Connection Issues
```bash
flutter clean
flutter pub get
```

### Secure Storage Access Issues
Update `ios/Runner/Info.plist` with Face ID usage description

### Route Redirect Loop
Check redirect logic in `main.dart` - ensure login and privacy screens are not protected

## 📄 License

MIT License - See LICENSE file for details

## 👨‍💻 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

- GitHub: https://github.com/anyaforger123456/chevvy
- Issues: https://github.com/anyaforger123456/chevvy/issues

---

**Made with ❤️ by the Chevvy Team**
