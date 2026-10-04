#!/usr/bin/env bash
# Usage: tools/characters/run.sh <id> [<id> ...]   (needs BLENDER_EXE and BLENDER_USER_RESOURCES)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
if [[ $# -eq 0 ]]; then
  echo "Usage: tools/characters/run.sh <id> [<id> ...]" >&2
  exit 2
fi
for id in "$@"; do
  if [[ ! "$id" =~ ^[a-z0-9-]+$ || ! -f "$HERE/specs/$id.json" ]]; then
    echo "[character] spec absente ou identifiant invalide: $id" >&2
    exit 2
  fi
  out="$HERE/../../public/assets/mixamo/$id"
  log="$(mktemp)"
  if "${BLENDER_EXE:?set BLENDER_EXE}" --background --python-exit-code 1 --python "$HERE/build_character.py" -- "$HERE/specs/$id.json" "$out" > "$log" 2>&1; then
    grep -E "character\]|Traceback|Error" "$log" || true
  else
    cat "$log" >&2
    rm -- "$log"
    exit 1
  fi
  rm -- "$log"
  if [[ ! -s "$out/$id.glb" ]]; then
    echo "[character] GLB absent ou vide: $id" >&2
    exit 1
  fi
  # Drop unreferenced data and re-encode textures as WebP (three's GLTFLoader reads it natively).
  npx --yes @gltf-transform/cli prune "$out/$id.glb" "$out/$id.glb" > /dev/null
  npx --yes @gltf-transform/cli webp "$out/$id.glb" "$out/$id.glb" --quality 85 > /dev/null
  echo "[character] optimised $id: $(( $(stat -c %s "$out/$id.glb") / 1000 )) KB"
done
