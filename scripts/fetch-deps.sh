#!/usr/bin/env bash
# Fetch upstream Box3D source at the SHA pinned in scripts/versions.json.
# Idempotent: skips the fetch when deps/box3d is already at the pin.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
ROOT="$(dirname "$DIR")"

SHA="$(cd "$ROOT" && node -p "JSON.parse(require('fs').readFileSync('scripts/versions.json','utf8')).box3d.sha")"
REPO="$(cd "$ROOT" && node -p "JSON.parse(require('fs').readFileSync('scripts/versions.json','utf8')).box3d.repo")"
DEST="$ROOT/deps/box3d"
PATCHES=(
  "$ROOT/patches/box3d-flat-patch-ghost-contact.patch"
  "$ROOT/patches/box3d-no-profile-timers.patch"
)

if [ -d "$DEST/.git" ] && [ "$(git -C "$DEST" rev-parse HEAD 2>/dev/null)" = "$SHA" ]; then
  echo "box3d already at $SHA"
else
  rm -rf "$DEST"
  mkdir -p "$DEST"
  git -C "$DEST" init -q
  git -C "$DEST" remote add origin "$REPO"
  git -C "$DEST" fetch -q --depth 1 origin "$SHA"
  git -C "$DEST" checkout -q FETCH_HEAD
  echo "box3d fetched at $SHA"
fi

for PATCH in "${PATCHES[@]}"; do
  NAME="$(basename "$PATCH")"
  if git -C "$DEST" apply --reverse --check "$PATCH" >/dev/null 2>&1; then
    echo "box3d patch $NAME already applied"
  elif git -C "$DEST" apply --check "$PATCH"; then
    git -C "$DEST" apply "$PATCH"
    echo "box3d patch $NAME applied"
  else
    echo "box3d patch $NAME does not apply cleanly" >&2
    exit 1
  fi
done
