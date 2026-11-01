#!/usr/bin/env bash
# Video (Higgsfield, mesa giratoria, render) → cuadros PNG a fps fijo, o → video para video-scrub.
#
#   scripts/assets/video-to-frames.sh frames <video> <png-dir> [fps=24]
#   scripts/assets/video-to-frames.sh scrub  <video> <out.mp4> [ancho=1280] [fondo=0b0c0e]
#
# "scrub" exporta con un keyframe por cuadro (-g 1): saltar a cualquier tiempo es instantáneo.
set -euo pipefail
mode="$1"; src="$2"; dst="$3"
case "$mode" in
  frames)
    mkdir -p "$dst"
    ffmpeg -loglevel error -y -i "$src" -vf "fps=${4:-24}" "$dst/frame-%03d.png"
    echo "$(ls "$dst" | wc -l | tr -d ' ') cuadros en $dst" ;;
  scrub)
    w="${4:-1280}"; bg="${5:-0b0c0e}"
    ffmpeg -loglevel error -y -i "$src" -an -vf "scale=$w:-2,format=yuv420p" -c:v libx264 -crf 24 -g 1 -movflags +faststart "$dst"
    ffmpeg -loglevel error -y -i "$dst" -frames:v 1 -q:v 4 "${dst%.*}-poster.jpg"
    echo "$dst ($(du -h "$dst" | cut -f1)) + póster" ;;
  *) echo "Modo: frames | scrub" >&2; exit 1 ;;
esac
