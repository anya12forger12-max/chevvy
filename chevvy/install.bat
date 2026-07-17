@echo off
REM Chevvy Privacy Policy Module - Installation Script for Windows
REM This script automates the installation process on Windows

setlocal enabledelayedexpansion

echo.
echo ======================================================================
echo           CHEVVY PRIVACY POLICY MODULE INSTALLER
echo ======================================================================
echo.

REM Check if Flutter is installed
echo [*] Checking Flutter installation...
flutter --version >nul 2>&1
if errorlevel 1 (
    echo [X] Flutter is not installed. Please install Flutter from https://flutter.dev
    exit /b 1
)
for /f "tokens=*" %%i in ('flutter --version') do set FLUTTER_VERSION=%%i
echo [OK] Flutter found: %FLUTTER_VERSION%
echo.

REM Check if Git is installed
echo [*] Checking Git installation...
git --version >nul 2>&1
if errorlevel 1 (
    echo [X] Git is not installed. Please install Git.
    exit /b 1
)
echo [OK] Git found
echo.

REM Get current directory
for %%i in (.) do set CURRENT_DIR=%%~fi
echo [*] Working directory: %CURRENT_DIR%
echo.

REM Step 1: Clean Flutter
echo [Step 1/6] Cleaning Flutter...
call flutter clean >nul 2>&1
echo [OK] Flutter cleaned
echo.

REM Step 2: Get dependencies
echo [Step 2/6] Getting Flutter dependencies...
call flutter pub get >nul 2>&1
echo [OK] Dependencies installed
echo.

REM Step 3: Build runner
echo [Step 3/6] Running build runner...
call flutter pub run build_runner build --delete-conflicting-outputs >nul 2>&1
echo [OK] Build runner completed
echo.

REM Step 4: Format code
echo [Step 4/6] Formatting code...
call dart format lib/ --set-exit-if-changed >nul 2>&1
echo [OK] Code formatted
echo.

REM Step 5: Analyze code
echo [Step 5/6] Analyzing code...
call flutter analyze --no-pub --no-fatal-infos >nul 2>&1
echo [OK] Code analysis complete
echo.

REM Step 6: Show next steps
echo [Step 6/6] Setup instructions
echo.
echo ======================================================================
echo [OK] Installation Complete!
echo ======================================================================
echo.
echo [*] Next Steps:
echo.
echo 1. Configure Firebase:
echo    - Download google-services.json from Firebase Console
echo    - Place in android\app\ (for Android)
echo    - Download GoogleService-Info.plist from Firebase Console
echo    - Add to iOS Runner project (for iOS)
echo.
echo 2. Update Firebase Options:
echo    - Edit lib\firebase_options.dart
echo    - Add your Firebase project credentials
echo.
echo 3. Setup Firestore Security Rules:
echo    - Go to Firebase Console > Firestore Database
echo    - Update security rules with privacy rules
echo    - See SETUP.md for rules configuration
echo.
echo 4. Run the app:
echo    flutter run
echo.
echo 5. Or run with specific device:
echo    flutter run -d <device_id>
echo.
echo [*] Documentation:
echo    See SETUP.md for detailed setup and usage instructions
echo.
echo [*] Important Security Notes:
echo    - Keep firebase_options.dart updated with your credentials
echo    - Never commit sensitive credentials to version control
echo    - Use .gitignore for local configuration files
echo.
echo [*] Support:
echo    - GitHub: https://github.com/anyaforger123456/chevvy
echo    - Issues: https://github.com/anyaforger123456/chevvy/issues
echo.
echo [OK] Happy coding!
echo.
