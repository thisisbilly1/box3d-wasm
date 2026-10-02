#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT="$(mktemp -d)"
trap 'rm -f -- "$OUTPUT/contact-guards.mjs" "$OUTPUT/contact-guards.wasm"; rmdir -- "$OUTPUT"' EXIT
LIB="${BOX3D_CONTACT_TEST_LIBRARY:-$ROOT/build/cmake-standard-Release/src/libbox3d.a}"
emcc "$ROOT/test/fixtures/supported-convex-edge-guards.c" "$LIB" \
  -I "$ROOT/deps/box3d/include" -std=c17 -O3 -msimd128 -msse2 \
  -DB3_NO_PROFILE_TIMERS -sENVIRONMENT=node -o "$OUTPUT/contact-guards.mjs"
node --input-type=module - "$OUTPUT/contact-guards.mjs" <<'JS'
import { pathToFileURL } from 'node:url';
const { default: initialize } = await import(pathToFileURL(process.argv[2]).href);
await initialize();
JS
