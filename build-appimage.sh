#!/usr/bin/env bash
set -e

APP_NAME="Emulsion2"
VERSION="1.0.0"
ARCH="x86_64"
DIST_DIR="dist"
APPDIR="$DIST_DIR/AppDir"
EXECUTABLE="$DIST_DIR/emulsion2-linux_x64"
ICON_PATH="resources/images/icon.png"
OUTPUT="$DIST_DIR/packages/${APP_NAME}-${VERSION}-${ARCH}.AppImage"

echo "🔨 Cleaning previous AppImage build..."
rm -rf "$APPDIR"
mkdir -p "$APPDIR/usr/bin"
mkdir -p "$APPDIR/usr/share/icons/hicolor/256x256/apps"
mkdir -p "$DIST_DIR/packages"

echo "📦 Copying executable..."
cp "$EXECUTABLE" "$APPDIR/usr/bin/$APP_NAME"
chmod +x "$APPDIR/usr/bin/$APP_NAME"

echo "📦 Copying icon..."
cp "$ICON_PATH" "$APPDIR/usr/share/icons/hicolor/256x256/apps/$APP_NAME.png"
cp "$ICON_PATH" "$APPDIR/$APP_NAME.png"

echo "📦 Creating desktop file..."
cat > "$APPDIR/$APP_NAME.desktop" <<EOF
[Desktop Entry]
Name=$APP_NAME
Exec=$APP_NAME
Icon=$APP_NAME
Type=Application
Categories=Utility;
EOF

echo "📥 Downloading appimagetool..."
APPIMAGETOOL=appimagetool-x86_64.AppImage
if [ ! -f "$APPIMAGETOOL" ]; then
    wget -q "https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage"
    chmod +x "$APPIMAGETOOL"
fi

echo "📦 Building AppImage..."
./$APPIMAGETOOL "$APPDIR" "$OUTPUT"

echo "🧹 Cleaning temporary files..."
rm -rf "$APPDIR"

echo "✅ Done! AppImage created: $OUTPUT"
