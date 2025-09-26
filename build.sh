#!/usr/bin/env bash
set -e

APP_NAME="Emulsion2"
DIST_DIR="dist"
PKG_DIR="$DIST_DIR/packages"

echo "🔨 Cleaning old build..."
rm -rf "$DIST_DIR"
mkdir -p "$PKG_DIR"

echo "📦 Building Neutralino binaries (all archs, with embedded resources)..."
neu build --release --embed-resources

echo "📦 Building .deb packages..."
./build-deb.sh

# echo "📦 Building AppImages..."
# ./build-appimage.sh

echo "✅ All builds complete. Packages are in $PKG_DIR/"
