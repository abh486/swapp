#!/bin/bash
set -e

FRAMEWORK_DIR="ios/Pods/MLImage/Frameworks/MLImage.framework"
BINARY_PATH="${FRAMEWORK_DIR}/MLImage"

if [ ! -f "${BINARY_PATH}" ]; then
  echo "Error: MLImage binary not found at ${BINARY_PATH}"
  exit 1
fi

echo "Patching MLImage static archive at ${BINARY_PATH}..."

# Navigate to the framework directory
cd "${FRAMEWORK_DIR}"

# Clean up any remnants
rm -rf arm64_objs MLImage_arm64_device MLImage_x86_64_sim MLImage_arm64_sim || true

# 1. Thin out the arm64 slice
lipo -thin arm64 MLImage -output MLImage_arm64_device

# 2. Thin out the x86_64 slice
lipo -thin x86_64 MLImage -output MLImage_x86_64_sim

# 3. Extract the arm64 ar archive and patch each object file
mkdir -p arm64_objs
cd arm64_objs
ar -x ../MLImage_arm64_device

echo "Patching object files..."
for f in *.o; do
  vtool -set-build-version 7 15.1 15.1 -replace "$f" -output "$f.patched"
  mv "$f.patched" "$f"
done

# Pack them back into a static archive
ar -rcs ../MLImage_arm64_sim *.o
cd ..

# 4. Merge them back into a new fat binary supporting both x86_64 and arm64 simulator
lipo -create MLImage_x86_64_sim MLImage_arm64_sim -output MLImage_new

# 5. Replace the original binary
mv MLImage_new MLImage

# 6. Clean up temporary files
rm -rf arm64_objs MLImage_arm64_device MLImage_x86_64_sim MLImage_arm64_sim

echo "Successfully patched MLImage for arm64 simulator!"
