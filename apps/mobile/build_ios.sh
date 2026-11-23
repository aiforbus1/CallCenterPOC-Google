#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🍏 Building iOS Release App / IPA for 122Nagda"
echo "=========================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Flutter dependencies
echo "📦 Fetching Flutter dependencies..."
flutter pub get

# 2. CocoaPods setup
echo "📦 Installing CocoaPods dependencies..."
cd ios
pod install --repo-update
cd ..

# 3. Build iOS release
echo "⚙️ Building iOS Release (Unsigned)..."
flutter build ios --release --no-codesign

# 4. Packaging into IPA format
echo "📦 Packaging into IPA..."
PAYLOAD_DIR="build/ios/iphoneos/Payload"
mkdir -p "$PAYLOAD_DIR"
cp -r "build/ios/iphoneos/Runner.app" "$PAYLOAD_DIR/"

cd build/ios/iphoneos
zip -r -q 122Nagda-release.ipa Payload
cd ../../..

OUTPUT_IPA="$SCRIPT_DIR/build/ios/iphoneos/122Nagda-release.ipa"
echo "=========================================================="
echo "🎉 iOS IPA successfully generated at:"
echo "   $OUTPUT_IPA"
echo "=========================================================="
