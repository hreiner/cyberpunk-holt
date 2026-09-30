#!/usr/bin/env bash
# Usage: tools/characters/run.sh <id> [<id> ...]   (needs BLENDER_EXE and BLENDER_USER_RESOURCES)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
for id in "$@"; do
  "${BLENDER_EXE:?set BLENDER_EXE}" --background --python "$HERE/build_character.py" -- "$HERE/specs/$id.json" "$HERE/../../public/assets/mixamo/$id" 2>&1 | grep -E "character\]|Traceback|Error" || true
done
