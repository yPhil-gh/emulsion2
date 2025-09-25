#!/usr/bin/env bash
set -e

APP_NAME="emulsion2"
VERSION="1.0.0"
ARCH="amd64"   # corresponds to x64
SRC_BIN="dist/emulsion2/emulsion2-linux_x64"
BUILD_DIR="dist/${APP_NAME}-deb"

echo "🔨 Cleaning previous .deb build..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/DEBIAN"
mkdir -p "$BUILD_DIR/usr/bin"
mkdir -p "$BUILD_DIR/usr/share/$APP_NAME"

echo "📦 Copying binary..."
cp "$SRC_BIN" "$BUILD_DIR/usr/bin/$APP_NAME"
chmod +x "$BUILD_DIR/usr/bin/$APP_NAME"

echo "📦 Copying resources..."
cp -r dist/emulsion2/resources.neu "$BUILD_DIR/usr/share/$APP_NAME/"
cp -r dist/emulsion2/*.png "$BUILD_DIR/usr/share/$APP_NAME/" 2>/dev/null || true

echo "📄 Creating DEBIAN/control..."
cat > "$BUILD_DIR/DEBIAN/control" <<EOL
Package: $APP_NAME
Version: $VERSION
Section: base
Priority: optional
Architecture: $ARCH
Maintainer: Your Name <you@example.com>
Description: $APP_NAME - Neutralino app
Depends: libc6, libgtk-3-0
EOL

echo "📦 Building .deb package..."
dpkg-deb --build "$BUILD_DIR" "dist/${APP_NAME}_${VERSION}_${ARCH}.deb"

echo "✅ Done! Your .deb is at dist/${APP_NAME}_${VERSION}_${ARCH}.deb"
