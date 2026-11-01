#!/usr/bin/env bash
# Convierte una carpeta de PNG (con alfa) en los sets WebP del catálogo.
#
#   scripts/assets/encode-frames.sh <png-dir> <out-dir> [ancho-desktop=960] [ancho-mobile=560]
#
# Desktop: todos los cuadros. Mobile: uno de cada dos, renumerados.
# Necesita cwebp (brew install webp): el ffmpeg de Homebrew no trae libwebp.
set -euo pipefail
src="$1"; out="$2"; dw="${3:-960}"; mw="${4:-560}"
command -v cwebp >/dev/null || { echo "Falta cwebp: brew install webp" >&2; exit 1; }
mkdir -p "$out/desktop" "$out/mobile"
i=0
for f in "$src"/*.png; do
  name="$(printf 'frame-%03d' $((i + 1)))"
  cwebp -quiet -q 76 -alpha_q 80 -resize "$dw" 0 "$f" -o "$out/desktop/$name.webp"
  if [ $((i % 2)) -eq 0 ]; then
    cwebp -quiet -q 72 -alpha_q 75 -resize "$mw" 0 "$f" -o "$out/mobile/$(printf 'frame-%03d' $((i / 2 + 1))).webp"
  fi
  i=$((i + 1))
done
echo "desktop: $(ls "$out/desktop" | wc -l | tr -d ' ') cuadros, $(du -sh "$out/desktop" | cut -f1)"
echo "mobile:  $(ls "$out/mobile" | wc -l | tr -d ' ') cuadros, $(du -sh "$out/mobile" | cut -f1)"
