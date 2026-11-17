#!/bin/bash
# Renders scripts/og-image.html to public/og-image.png (1200x630) with
# headless Microsoft Edge. Needs network access for the Google Fonts.
set -e
cd "$(dirname "$0")/.."

EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
SRC="file:///$(cygpath -m "$PWD/scripts/og-image.html")"
OUT="$(cygpath -w "$PWD/public/og-image.png")"
# its own profile, so a running Edge doesn't swallow the headless call
PROFILE="$(mktemp -d)"

"$EDGE" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --user-data-dir="$(cygpath -w "$PROFILE")" \
  --window-size=1200,630 --virtual-time-budget=8000 \
  --screenshot="$OUT" "$SRC"
rm -rf "$PROFILE"
[ -f public/og-image.png ] && echo "wrote public/og-image.png"
