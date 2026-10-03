# Cast builder (MPFB2 → Mixamo-rigged GLB)

One JSON spec per character (`specs/*.json`: macro body, face targets, skin, hair, clothes) →
`public/assets/mixamo/<id>/<id>.glb`. The rig carries the real `mixamorig:*` bone names, so the
Mixamo idle/walk clips play on it through `src/render/characters/mixamoRetarget.ts`. How each one is painted and
dressed (palette, rim colour, patches) lives in `src/render/characters/cadetLooks.ts`.

Needs Blender 4.2 with the MPFB2 extension and its system assets, plus the MakeHuman community
packs `suits03`, `shoes01`, `shirts01`, `hair01` (see `public/assets/mixamo/ATTRIBUTION.md`).

```bash
export BLENDER_EXE=/path/to/blender.exe
export BLENDER_USER_RESOURCES=/path/to/blender/user   # where MPFB and the packs are installed
tools/characters/run.sh franklyn abigail zachary letitia john grover enfant
```

Findings, pitfalls and recipes: `docs/art/CHARACTER-PIPELINE-FINDINGS.md`.

Study scene: `dormitory-aaa.html?lead=<id>` plays that cadet, `?cast=1` lines up the others.
