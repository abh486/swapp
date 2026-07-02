#!/bin/bash
# Exit on error
set -e

echo "=== React Native iOS Clean & Rebuild Script ==="

echo "1. Stopping any running packagers and clearing watchman..."
killall node 2>/dev/null || true
watchman watch-del-all 2>/dev/null || true

echo "2. Deleting build folders and local caches..."
rm -rf ios/build
rm -rf ios/Pods
rm -rf ~/Library/Developer/Xcode/DerivedData/SwappIos-* 2>/dev/null || true
rm -rf ~/Library/Caches/CocoaPods

echo "3. Installing CocoaPods dependencies..."
cd ios
pod install
cd ..

echo "==========================================================="
echo "Clean completed! Please follow these steps:"
echo "1. If using Xcode, close it and open 'ios/SwappIos.xcworkspace' (NOT .xcodeproj)."
echo "2. Run a fresh build using: npm run ios"
echo "==========================================================="
