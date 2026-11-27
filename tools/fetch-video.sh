#!/usr/bin/env bash
# Download the homepage background video from Squarespace (AES-encrypted HLS) and save it as
# public/assets/video/hero.mp4 plus a poster frame. Needs curl and ffmpeg. Run while the
# Squarespace site is still online.
set -euo pipefail
V="https://video.squarespace-cdn.com/content/v1/672a1d85f6e0b932a33db626/8b9739e1-1161-4e66-8d26-88f5d1dfff15"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/assets/video"
WORK="$(mktemp -d)"
mkdir -p "$OUT"
curl -sSf "$V/playlist.m3u8" | grep '1920:1080' | head -1 > "$WORK/url"
curl -sSf "$(cat "$WORK/url")" > "$WORK/remote.m3u8"
curl -sSf -o "$WORK/v.key" "$(grep -o 'URI="[^"]*"' "$WORK/remote.m3u8" | sed 's/URI="//;s/"$//')"
curl -sSf -o "$WORK/v.ts" "$(grep -m1 '^https' "$WORK/remote.m3u8")"
sed -e 's#URI="[^"]*"#URI="v.key"#' -e 's#^https.*#v.ts#' "$WORK/remote.m3u8" > "$WORK/v.m3u8"
# Muted autoplay background video: drop the audio track, keep 1080p.
( cd "$WORK" && ffmpeg -y -loglevel error -allowed_extensions ALL -protocol_whitelist file,crypto \
    -i v.m3u8 -an -c copy -movflags +faststart "$OUT/hero.mp4" )
curl -sSf -o "$OUT/hero-poster.jpg" "$V/thumbnail"
echo "Saved $OUT/hero.mp4 and hero-poster.jpg"
