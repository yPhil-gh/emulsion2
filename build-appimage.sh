#!/usr/bin/env bash
set -e

APP_NAME="Emulsion2"
VERSION="1.0.0"
ARCH="x86_64"
BUILD_DIR="AppDir"
ICON_PATH="resources/images/icon.png"
EXECUTABLE="dist/emulsion2/emulsion2-linux_x64"
DESKTOP_FILE="$BUILD_DIR/$APP_NAME.desktop"

echo "🔨 Cleaning previous AppImage build..."
rm -rf "$BUILD_DIR" *.AppImage

echo "📦 Creating AppDir structure..."
mkdir -p "$BUILD_DIR/usr/bin"
mkdir -p "$BUILD_DIR/usr/share/icons/hicolor/256x256/apps"

echo "📦 Copying executable..."
cp "$EXECUTABLE" "$BUILD_DIR/usr/bin/$APP_NAME"
chmod +x "$BUILD_DIR/usr/bin/$APP_NAME"

echo "📦 Copying icon..."
cp "$ICON_PATH" "$BUILD_DIR/usr/share/icons/hicolor/256x256/apps/$APP_NAME.png"

echo "📦 Creating desktop file..."
cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Name=$APP_NAME
Exec=$APP_NAME
Icon=$APP_NAME
Type=Application
Categories=Utility;
EOF

echo "📥 Downloading linuxdeploy..."
LINUXDEPLOY=linuxdeploy-x86_64.AppImage
if [ ! -f "$LINUXDEPLOY" ]; then
    wget -q "https://github.com/linuxdeploy/linuxdeploy/releases/download/continuous/linuxdeploy-x86_64.AppImage"
    chmod +x "$LINUXDEPLOY"
fi

echo "📦 Building AppImage..."
./$LINUXDEPLOY --appdir "$BUILD_DIR" \
    -d "$DESKTOP_FILE" \
    -i "$ICON_PATH" \
    -e "$BUILD_DIR/usr/bin/$APP_NAME" \
    --output appimage

echo "🧹 Cleaning temporary files..."
rm -rf "$BUILD_DIR"

echo "✅ Done! AppImage created: $APP_NAME-$ARCH.AppImage"
