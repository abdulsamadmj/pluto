#!/usr/bin/env bash
set -euo pipefail

# Release iOS simulator build with the prod API URL, then copy .app to Desktop.
export EXPO_PUBLIC_SERVER_URL="${EXPO_PUBLIC_SERVER_URL:-https://apipluto.abdulsamadmj.dev}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DESKTOP="${HOME}/Desktop/pluto-ios"
SIMULATOR="${IOS_SIMULATOR:-iPhone 16}"

cd "$ROOT"

echo "→ API: $EXPO_PUBLIC_SERVER_URL"
echo "→ Simulator: $SIMULATOR"
echo "→ Output: $DESKTOP"

npx expo run:ios --configuration Release --device "$SIMULATOR"

APP="$(find "$ROOT/ios/build/Build/Products" -maxdepth 2 -name "*.app" -path "*Release*" | head -1)"
if [[ -z "$APP" ]]; then
  echo "Error: no Release .app found under ios/build/Build/Products" >&2
  exit 1
fi

rm -rf "$DESKTOP"
mkdir -p "$DESKTOP"
cp -R "$APP" "$DESKTOP/Pluto.app"

echo "✓ Copied to $DESKTOP/Pluto.app"
