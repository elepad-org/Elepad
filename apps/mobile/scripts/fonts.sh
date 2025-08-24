#!/usr/bin/env bash
set -euo pipefail

# Script to fetch Josefin Sans Bold and Montserrat Regular into apps/mobile/assets/fonts
# Sources: GoogleFonts repository (raw github)

OUT_DIR="$(dirname "$0")/../assets/fonts"
mkdir -p "$OUT_DIR"

fetch() {
  local url="$1"
  local out="$2"
  echo "Downloading $url -> $out"
  if command -v curl >/dev/null 2>&1; then
    curl -fLo "$out" -L "$url"
  elif command -v wget >/dev/null 2>&1; then
    wget -O "$out" "$url"
  else
    echo "Error: neither curl nor wget is installed. Please install one or download the files manually." >&2
    exit 2
  fi
}

# URLs point to the Google Fonts repository raw files
JOSEFIN_URL="https://github.com/google/fonts/raw/main/ofl/josefinsans/JosefinSans%5Bwght%5D.ttf"
MONTSERRAT_URL="https://github.com/google/fonts/raw/main/ofl/montserrat/Montserrat%5Bwght%5D.ttf"

fetch "$JOSEFIN_URL" "$OUT_DIR/JosefinSans-Variable.ttf"
fetch "$MONTSERRAT_URL" "$OUT_DIR/Montserrat-Regular.ttf"

echo "Fonts downloaded to $OUT_DIR"

# Ensure readable
chmod 644 "$OUT_DIR"/*.ttf || true
