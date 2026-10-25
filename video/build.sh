#!/usr/bin/env bash
# Полная сборка: субтитры → звук → кадры → финальный mp4 (out/metro72.mp4)
set -euo pipefail
cd "$(dirname "$0")"
python3 -I align.py
export DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 voice.mp3 | awk '{printf "%.2f", $1 + 0.5}')
python3 -I audio.py
[ "${SKIP_RENDER:-0}" = 1 ] || node render.mjs video
ffmpeg -y -v error -i out/video_silent.mp4 -i voice.mp3 -i out/sfx.wav -filter_complex \
  "[1:a]aresample=44100,pan=stereo|c0=c0|c1=c0,adelay=0|0[v];[2:a]volume=0.55[s];[v][s]amix=inputs=2:duration=longest:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart out/metro72.mp4
echo "готово: out/metro72.mp4"
