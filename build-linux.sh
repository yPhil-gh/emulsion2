#!/usr/bin/env bash
set -e

APP_NAME="emulsion2"
VERSION="1.0.0"
BIN_DIR="dist/emulsion2"
DEB_OUT_DIR="dist/debs"

# Map Neutralino arch to Debian arch
declare -A ARCH_MAP
ARCH_MAP[emulsion2-linux_x64]="amd64"
ARCH_MAP[emulsion2-linux_armhf]="armhf"
ARCH_MAP[emulsion2-linux_arm64]="arm64"

echo "🔨 Cleaning previous .deb builds..."
rm -rf "$DEB_OUT_DIR"
mkdir -p "$DEB_OUT_DIR"

for BIN_NAME in "${!ARCH_MAP[@]}"; do
    ARCH=${ARCH_MAP[$BIN_NAME]}
    SRC_BIN="$BIN_DIR/$BIN_NAME"
    BUILD_DIR="$DEB_OUT_DIR/${APP_NAME}-${ARCH}"

    echo "📦 Building .deb for $ARCH..."

    # Clean & create folder structure
    rm -rf "$BUILD_DIR"
    mkdir -p "$BUILD_DIR/DEBIAN"
    mkdir -p "$BUILD_DIR/usr/bin"
    mkdir -p "$BUILD_DIR/usr/share/$APP_NAME"

    # Copy binary
    cp "$SRC_BIN" "$BUILD_DIR/usr/bin/$APP_NAME"
    chmod +x "$BUILD_DIR/usr/bin/$APP_NAME"

    # Copy resources
    cp -r "$BIN_DIR/resources.neu" "$BUILD_DIR/usr/share/$APP_NAME/"

    # Optional: copy other resources (icons, etc.)
    cp -r "$BIN_DIR"/*.png "$BUILD_DIR/usr/share/$APP_NAME/" 2>/dev/null || true

    # Write control file
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

    # Build .deb
    dpkg-deb --build "$BUILD_DIR" "$DEB_OUT_DIR/${APP_NAME}_${VERSION}_${ARCH}.deb"
done

echo "✅ All .deb packages built in $DEB_OUT_DIR"
