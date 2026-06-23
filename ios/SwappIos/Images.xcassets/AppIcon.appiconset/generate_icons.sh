#!/bin/bash
set -e

# Directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

SRC_ICON="icon.png"

if [ ! -f "$SRC_ICON" ]; then
    echo "Error: Source icon $SRC_ICON not found in $DIR."
    exit 1
fi

echo "Generating icons from $SRC_ICON..."

# Function to generate and convert icon using sips
generate_icon() {
    local size=$1
    local name=$2
    echo "Generating $name (${size}x${size})...."
    sips -z "$size" "$size" -s format png "$SRC_ICON" --out "$name"
}

generate_icon 20 "icon-20.png"
generate_icon 40 "icon-20@2x.png"
generate_icon 60 "icon-20@3x.png"
generate_icon 40 "icon-20@2x-ipad.png"

generate_icon 29 "icon-29.png"
generate_icon 58 "icon-29@2x.png"
generate_icon 87 "icon-29@3x.png"
generate_icon 58 "icon-29@2x-ipad.png"

generate_icon 40 "icon-40.png"
generate_icon 80 "icon-40@2x.png"
generate_icon 120 "icon-40@3x.png"
generate_icon 80 "icon-40@2x-ipad.png"

generate_icon 120 "icon-60@2x.png"
generate_icon 180 "icon-60@3x.png"

generate_icon 76 "icon-76.png"
generate_icon 152 "icon-76@2x.png"
generate_icon 167 "icon-83.5@2x.png"

generate_icon 1024 "icon-1024.png"

echo "Replacing Contents.json..."
cat << 'EOF' > Contents.json
{
  "images" : [
    {
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "20x20",
      "filename" : "icon-20@2x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "20x20",
      "filename" : "icon-20@3x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "29x29",
      "filename" : "icon-29@2x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "29x29",
      "filename" : "icon-29@3x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "40x40",
      "filename" : "icon-40@2x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "40x40",
      "filename" : "icon-40@3x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "60x60",
      "filename" : "icon-60@2x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "60x60",
      "filename" : "icon-60@3x.png"
    },
    {
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "20x20",
      "filename" : "icon-20.png"
    },
    {
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "20x20",
      "filename" : "icon-20@2x-ipad.png"
    },
    {
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "29x29",
      "filename" : "icon-29.png"
    },
    {
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "29x29",
      "filename" : "icon-29@2x-ipad.png"
    },
    {
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "40x40",
      "filename" : "icon-40.png"
    },
    {
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "40x40",
      "filename" : "icon-40@2x-ipad.png"
    },
    {
      "idiom" : "ipad",
      "scale" : "1x",
      "size" : "76x76",
      "filename" : "icon-76.png"
    },
    {
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "76x76",
      "filename" : "icon-76@2x.png"
    },
    {
      "idiom" : "ipad",
      "scale" : "2x",
      "size" : "83.5x83.5",
      "filename" : "icon-83.5@2x.png"
    },
    {
      "idiom" : "ios-marketing",
      "scale" : "1x",
      "size" : "1024x1024",
      "filename" : "icon-1024.png"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
EOF

echo "App icons generated successfully!"
