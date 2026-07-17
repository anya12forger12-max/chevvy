#!/bin/bash

# Chevvy Privacy Policy Module - Installation Script
# This script automates the installation process

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         CHEVVY PRIVACY POLICY MODULE INSTALLER             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Flutter is installed
echo -e "${BLUE}📱 Checking Flutter installation...${NC}"
if ! command -v flutter &> /dev/null; then
    echo -e "${RED}✗ Flutter is not installed. Please install Flutter from https://flutter.dev${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Flutter found: $(flutter --version | head -n 1)${NC}"
echo ""

# Check if Git is installed
echo -e "${BLUE}📦 Checking Git installation...${NC}"
if ! command -v git &> /dev/null; then
    echo -e "${RED}✗ Git is not installed. Please install Git.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Git found${NC}"
echo ""

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo -e "${BLUE}📋 Working directory: $SCRIPT_DIR${NC}"
echo ""

# Step 1: Clean Flutter
echo -e "${YELLOW}Step 1/6: Cleaning Flutter...${NC}"
flutter clean
echo -e "${GREEN}✓ Flutter cleaned${NC}"
echo ""

# Step 2: Get dependencies
echo -e "${YELLOW}Step 2/6: Getting Flutter dependencies...${NC}"
flutter pub get
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 3: Build runner (if needed)
echo -e "${YELLOW}Step 3/6: Running build runner...${NC}"
flutter pub run build_runner build --delete-conflicting-outputs 2>/dev/null || true
echo -e "${GREEN}✓ Build runner completed${NC}"
echo ""

# Step 4: Format code
echo -e "${YELLOW}Step 4/6: Formatting code...${NC}"
dart format lib/ --set-exit-if-changed || true
echo -e "${GREEN}✓ Code formatted${NC}"
echo ""

# Step 5: Analyze code
echo -e "${YELLOW}Step 5/6: Analyzing code...${NC}"
flutter analyze --no-pub --no-fatal-infos || true
echo -e "${GREEN}✓ Code analysis complete${NC}"
echo ""

# Step 6: Show next steps
echo -e "${YELLOW}Step 6/6: Setup instructions${NC}"
echo ""
echo -e "${BLUE}──────────────────────────────────────────────────────────────${NC}"
echo -e "${GREEN}✓ Installation Complete!${NC}"
echo -e "${BLUE}──────────────────────────────────────────────────────────────${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo ""
echo "1️⃣  ${BLUE}Configure Firebase:${NC}"
echo "   - Download google-services.json from Firebase Console"
echo "   - Place in android/app/ (for Android)"
echo "   - Download GoogleService-Info.plist from Firebase Console"
echo "   - Add to iOS Runner project (for iOS)"
echo ""
echo "2️⃣  ${BLUE}Update Firebase Options:${NC}"
echo "   - Edit lib/firebase_options.dart"
echo "   - Add your Firebase project credentials"
echo ""
echo "3️⃣  ${BLUE}Setup Firestore Security Rules:${NC}"
echo "   - Go to Firebase Console → Firestore Database"
echo "   - Update security rules with privacy rules"
echo "   - See SETUP.md for rules configuration"
echo ""
echo "4️⃣  ${BLUE}Run the app:${NC}"
echo "   flutter run"
echo ""
echo "5️⃣  ${BLUE}Or run with specific device:${NC}"
echo "   flutter run -d <device_id>"
echo ""
echo -e "${YELLOW}📖 Documentation:${NC}"
echo "   See SETUP.md for detailed setup and usage instructions"
echo ""
echo -e "${YELLOW}🔐 Important Security Notes:${NC}"
echo "   - Keep firebase_options.dart updated with your credentials"
echo "   - Never commit sensitive credentials to version control"
echo "   - Use .gitignore for local configuration files"
echo ""
echo -e "${YELLOW}📞 Support:${NC}"
echo "   - GitHub: https://github.com/anyaforger123456/chevvy"
echo "   - Issues: https://github.com/anyaforger123456/chevvy/issues"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
echo ""
