#!/usr/bin/env bash
set -e

APP_NAME="emulsion2"
VERSION="1.0.0"
ARCH="x86_64"

BUILD_DIR="dist/${APP_NAME}-linux"
RESOURCES_DIR="resources"

echo "🔨 Cleaning previous builds..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/DEBIAN"
mkdir -p "$BUILD_DIR/usr/bin"
mkdir -p "$BUILD_DIR/usr/share/$APP_NAME"

echo "📦 Copying binary..."
cp "dist/${APP_NAME}-linux_x64" "$BUILD_DIR/usr/bin/$APP_NAME"
chmod +x "$BUILD_DIR/usr/bin/$APP_NAME"

echo "📦 Copying resources..."
cp -r "$RESOURCES_DIR/"* "$BUILD_DIR/usr/share/$APP_NAME/"

echo "📄 Creating DEBIAN/control..."
cat > "$BUILD_DIR/DEBIAN/control" <<EOL
Package: $APP_NAME
Version: $VERSION
Section: base
Priority: optional
Architecture: $ARCH
Maintainer: Your Name <you@example.com>
Description: $APP_NAME - Neutralino app
Depends: libgtk-3-0, libc6
EOL

echo "📦 Building .deb package..."
dpkg-deb --build "$BUILD_DIR" "dist/${APP_NAME}_${VERSION}_${ARCH}.deb"

# Optional: .rpm using fpm
if command -v fpm >/dev/null 2>&1; then
    echo "📦 Building .rpm package..."
    fpm -s dir -t rpm \
        -n "$APP_NAME" \
        -v "$VERSION" \
        -a "$ARCH" \
        -C "$BUILD_DIR" \
        usr/bin usr/share \
        --description "$APP_NAME - Neutralino app"
else
    echo "⚠️ fpm not found, skipping .rpm package"
fi

# Optional: AppImage (requires appimagetool)
if command -v appimagetool >/dev/null 2>&1; then
    echo "📦 Building AppImage..."
    mkdir -p "$BUILD_DIR/AppDir"
    cp -r "$BUILD_DIR/usr"/* "$BUILD_DIR/AppDir/"
    cp "$BUILD_DIR/usr/bin/$APP_NAME" "$BUILD_DIR/AppDir/AppRun"
    chmod +x "$BUILD_DIR/AppDir/AppRun"
    appimagetool "$BUILD_DIR/AppDir" "dist/${APP_NAME}-${VERSION}.AppImage"
else
    echo "⚠️ appimagetool not found, skipping AppImage"
fi

echo "✅ Done! Packages are in dist/"
