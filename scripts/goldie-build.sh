#!/usr/bin/env bash
# goldie capture icin release simulator build'i alir ve goldie/build/ altina kopyalar.
#
# Neden kopyaliyoruz: macOS disk baskisi altinda ~/Library/Developer/Xcode/DerivedData
# dizinini purgeable cache sayip siliyor. 6 Eylul 2026'da capture'in ortasinda
# sildi ve butun akislar "FBSApplicationLibrary returned nil" ile patladi.
# goldie/build/ repo icinde ve gitignore'lu, oraya dokunmuyor.
#
# LANG sart: yoksa CocoaPods UTF-8 hatasiyla cokuyor.
set -euo pipefail

cd "$(dirname "$0")/.."
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8

npx expo run:ios --configuration Release --no-bundler

SRC=$(ls -td "$HOME"/Library/Developer/Xcode/DerivedData/bluma-*/Build/Products/Release-iphonesimulator/bluma.app 2>/dev/null | head -1)
[ -n "$SRC" ] || { echo "HATA: release build urunu bulunamadi" >&2; exit 1; }

rm -rf goldie/build
mkdir -p goldie/build
ditto "$SRC" goldie/build/bluma.app

echo "goldie/build/bluma.app hazir ($(du -sh goldie/build/bluma.app | cut -f1))"
