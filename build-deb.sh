#!/usr/bin/env bash
set -e

APP_NAME="emulsion2"
VERSION="1.0.0"
SRC_DIR="dist/emulsion2"
PKG_DIR="dist/packages"

mkdir -p "$PKG_DIR"

build_deb() {
    ARCH=$1
    BIN=$2
    DEB_DIR="dist/${APP_NAME}_${VERSION}_${ARCH}"

    echo "📦 Building .deb for $ARCH..."

    rm -rf "$DEB_DIR"
    mkdir -p "$DEB_DIR/DEBIAN"
    mkdir -p "$DEB_DIR/usr/bin"
    mkdir -p "$DEB_DIR/usr/share/applications"
    mkdir -p "$DEB_DIR/usr/share/icons/hicolor/256x256/apps"

    cp "$SRC_DIR/$BIN" "$DEB_DIR/usr/bin/$APP_NAME"
    chmod 755 "$DEB_DIR/usr/bin/$APP_NAME"

    # control file
    cat > "$DEB_DIR/DEBIAN/control" <<EOF
Package: $APP_NAME
Version: $VERSION
Architecture: $ARCH
Maintainer: You <you@example.com>
Description: Emulsion2 Neutralino App
EOF

    # .desktop file
    cat > "$DEB_DIR/usr/share/applications/$APP_NAME.desktop" <<EOF
[Desktop Entry]
Name=Emulsion2
Exec=$APP_NAME
Icon=$APP_NAME
Type=Application
Categories=Utility;
EOF

    # icon
    cp resources/images/icon.png "$DEB_DIR/usr/share/icons/hicolor/256x256/apps/$APP_NAME.png"

    dpkg-deb --build "$DEB_DIR"
    mv "dist/${APP_NAME}_${VERSION}_${ARCH}.deb" "$PKG_DIR/"
    rm -rf "$DEB_DIR"
}

build_deb "amd64"   "emulsion2-linux_x64"
build_deb "armhf"   "emulsion2-linux_armhf"
build_deb "arm64"   "emulsion2-linux_arm64"

echo "✅ .deb packages are in $PKG_DIR/"
