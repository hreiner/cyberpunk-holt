#!/usr/bin/env bash
# Usage: tools/characters/run.sh <id> [<id> ...]   (needs BLENDER_EXE and BLENDER_USER_RESOURCES)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
for id in "$@"; do
  out="$HERE/../../public/assets/mixamo/$id"
  "${BLENDER_EXE:?set BLENDER_EXE}" --background --python "$HERE/build_character.py" -- "$HERE/specs/$id.json" "$out" 2>&1 | grep -E "character\]|Traceback|Error" || true
  # Drop unreferenced data and re-encode textures as WebP (three's GLTFLoader reads it natively).
  npx --yes @gltf-transform/cli prune "$out/$id.glb" "$out/$id.glb" > /dev/null
  npx --yes @gltf-transform/cli webp "$out/$id.glb" "$out/$id.glb" --quality 85 > /dev/null
  echo "[character] optimised $id: $(( $(stat -c %s "$out/$id.glb") / 1000 )) KB"
done
