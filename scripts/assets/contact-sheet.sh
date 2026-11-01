#!/usr/bin/env bash
# Hoja de contacto de una secuencia sobre el color de fondo del sitio, para revisar antes de usarla:
# cortes en el borde, saltos de luz, forma del producto.
#
#   scripts/assets/contact-sheet.sh <dir-con-cuadros> <salida.jpg> [fondo=0b0c0e] [cada=8]
set -euo pipefail
dir="$1"; out="$2"; bg="${3:-0b0c0e}"; every="${4:-8}"
files=(); i=0
for f in "$dir"/*.{png,webp}; do [ -e "$f" ] || continue; [ $((i % every)) -eq 0 ] && files+=("$f"); i=$((i + 1)); done
[ "${#files[@]}" -gt 0 ] || { echo "No hay cuadros en $dir" >&2; exit 1; }
args=(); filt=""; k=0
for f in "${files[@]}"; do args+=(-i "$f"); filt+="[$k]scale=240:-1,pad=240:300:(ow-iw)/2:(oh-ih)/2:color=$bg[v$k];"; k=$((k + 1)); done
labels=""; for j in $(seq 0 $((k - 1))); do labels+="[v$j]"; done
ffmpeg -loglevel error -y "${args[@]}" -filter_complex "${filt}${labels}xstack=inputs=$k:grid=6x$(( (k + 5) / 6 )):fill=0x$bg" -frames:v 1 "$out" 2>/dev/null \
  || ffmpeg -loglevel error -y "${args[@]}" -filter_complex "${filt}${labels}hstack=inputs=$k" -frames:v 1 "$out"
echo "$out ($k cuadros)"
