---
name: character-creation
description: Create or modify a HOLT cadet character (MPFB2 in Blender headless -> Mixamo-rigged GLB -> three.js with Mixamo animations). Use when asked to add a character, change a cadet's face, hair, skin, uniform, sleeves or decals, add or retarget a Mixamo pose, shrink character assets, or debug a character rendering problem in dormitory-aaa.html.
---

# Character creation (MPFB2 -> Mixamo rig -> three.js)

Full write-up, in French: `docs/art/CHARACTER-PIPELINE-FINDINGS.md`. Read it for the reasoning behind each
rule below. Builder README: `tools/characters/README.md`. Mixamo downloads: the `mixamo` skill.

## Files

| What | Where |
|---|---|
| One JSON spec per character (body, face, skin, hair, clothes, garment edits) | `tools/characters/specs/<id>.json` |
| Blender builder (reads a spec, exports the GLB) | `tools/characters/build_character.py` |
| Build + optimise wrapper | `tools/characters/run.sh <id>...` |
| Output | `public/assets/mixamo/<id>/<id>.glb` (~2-2.5 MB after optimisation) |
| Paint / rim colour / decals per character | `src/render/characters/cadetLooks.ts` (`LOOKS`, `CAST_ORDER`) |
| Game rig (`CharacterRig`) and preloading/templates | `src/render/characters/mpfbCadetRig.ts`, `mpfbAssets.ts` (ADR 0041) |
| Study-scene loader, poses | `src/dev/cadet.ts` |
| Toon, ink outline, rim light, repaint, decals, braids | `src/render/characters/cadetStyle.ts` |
| Mixamo -> MPFB retarget | `src/render/characters/mixamoRetarget.ts` |
| Scene (cast selector, pose selector) | `src/dev/dormitoryAAA.ts` (`CAST_LABELS` lives there) |
| Extra Mixamo clips | `public/assets/mixamo/exo/*.fbx` |

## Build a character

```bash
export BLENDER_EXE='D:/AgenticCoding/tools/blender/app/blender-4.2.23-windows-x64/blender.exe'
export BLENDER_USER_RESOURCES='D:\AgenticCoding\tools\blender\user'   # MPFB + asset packs live here
tools/characters/run.sh <id>          # ~15 s + optimisation; prints [character] lines
```

- Never pass `--factory-startup` to Blender (it drops the MPFB preferences).
- Run from the Bash tool. Heredocs with nested quotes fail: write scripts with the Write tool, then run them.
- `run.sh` also runs `gltf-transform prune` then `webp`. Keep that: without it a GLB is 10-14 MB.
- After a rebuild, the page needs a reload; the GLB is fetched once per page load.

## Add a new cadet

1. Copy the closest spec in `tools/characters/specs/`, change `id`, `macro`, `skin`, `hair`, `clothes`, `face`.
2. `tools/characters/run.sh <id>`; read the `[character]` log (a missing target or asset is reported, not fatal).
3. Add a `LOOKS` entry in `cadetLooks.ts` (`tint`, `cloth`, `decals`, `rim`, `height`), add the id to
   `CAST_ORDER`, and a label to `CAST_LABELS` in `dormitoryAAA.ts`.
4. Review in the browser: `http://localhost:5173/cyberpunk-holt/dormitory-aaa.html?lead=<id>`, portrait
   toggle `#portrait-toggle`, selector keys 1-7, `?cast=1` for the line-up, `?pose=<name>`.
   Look from the front, the side and the back before iterating.

## Spec keys

- `macro`: `gender, age, muscle, weight, height, proportions, caucasian, african, asian` (0-1). Kid: `age` ~0.15.
- `face`: `"<zone>/<name>": weight` = `targets/<zone>/<name>.target.gz`, multiplied by `faceGain` (2.0). 1 is
  weak, 3 is heavy; Asian-feature targets (epicanthus, nose compression, cheekbones) stay at 0.15-0.35.
- `skin`, `hair`, `eyebrows`, `clothes: [...]` are MakeHuman asset names.
- Garment edits (keys are garment name substrings): `cutBelow` (delete below a height fraction, e.g. a skirt),
  `stretchDown` (lengthen the hem), `slim` (along normals, max ~6 mm, negative inflates), `slimSleeves`
  (recentre sleeves on the arm axis, end them at the wrist).
- Hair edits, use sparingly: `hairCutBelow`, `hairShorten`, `hairBack`, `hairFlip` (avoid).
- `maxTexture` (default 1024).

## Decisions already made (do not redo)

- **Hair**: prefer native MPFB hair (`short01-04`, `bob01/02`, `braid01`, `long01`, `ponytail01`, `afro01`).
  Community-pack hair caused most defects. Braids are built in code and sit at the BACK.
- **Men's uniform**: `mindfront_m_suit_01` (repainted navy) + boots. **Women's**: `female_elegantsuit01` blouse
  (skirt cut) + `toigo_wool_pants` + `toigo_ankle_boots_female`, with `stretchDown`, `slim`, `slimSleeves`.
- **No painted mouth** (ugly, removed) and no expression control: MPFB gives at most a slight smile.
- Skin tint is a multiplier in `cadetLooks.ts` (`tint.skin`): Asian textures are yellow, so keep it low-saturation;
  dark skins need a near-white tint. Hair recolour: `hairPaint`; clothes recolour: `cloth`.
- Rim colour = the portrait halo of the character (`docs/art/image-generation/briefs/P*.md`).
- Packs: MakeHuman community packs from `static.makehumancommunity.org/assets/assetpacks.html`, CC-BY needs
  attribution in `public/assets/mixamo/ATTRIBUTION.md`.

## Pitfalls

- **Decals** (patches, tapes, tie...) must be skinned like the cloth (`makeCloth`/`stick`), never parented to a
  bone (they drift off the sleeve). Skin-mesh raw geometry is not in the skinned rest frame: use `inverseSkin`.
- **Sleeves**: the blouse ring is ~10 cm off the forearm axis and overhangs the wrist by ~5 cm; a radial shrink
  does not fix that. Use `slimSleeves`; its log prints the ring offset and the cuff radius.
- **Gap between blouse and trousers**: `stretchDown` plus a small negative `slim`.
- **Ink outline** only on cloth (0.0042 m); none on skin or hair, or you get black patches at neck and wrists.
- **GLB size**: export with `export_apply=True` and `export_morph=False`; the face-target shape keys are ~8 MB
  and unused at runtime. Never switch morphs off with `export_apply=False` (you would export the base human).
- **Retarget**: A-pose rig vs T-pose Mixamo. Arms, forearms and HANDS are aimed along the source bone; fingers
  curl in the hand's own frame (do not set finger world rotation). Forearm twist is not transferred.
- **Mixamo downloads** only work with `MIXAMO_HEADLESS=1` in `.mcp.json`; headed mode fails with "browser has
  been closed". Clips: `skin=false`, FBX 2019 (`fbx`), 30 fps, `inplace` for locomotion.

## In the game (ADR 0041)

- `createCadetExplorationRig` / `createHumanExplorationRig` return an `MpfbCadetRig` when the actor has a look
  in `LOOKS` (or `mpfbLook` is passed); otherwise the Quaternius `CadetRig`. `?rig=quaternius` forces the old one.
- Dressing runs once per character at preload (template), rigs clone it: keep `dressCadet` synchronous.
- Game clips: `MPFB_CLIP_FILES` in `mpfbAssets.ts` (idle/walk/run required; shoot, down, getup, talk, look, lean,
  dance1-3). Clips whose hips travel are fixed at load: `PINNED` (fall, get-up: hips held at rest x=z=0),
  dances detrended, `TRIM` cuts dead time (get-up kept 3.3-6.6 s). Measure hips travel before adding a clip.
- Map NPC cadets take `pose` in map data (`NpcEntity.pose`: talk/dance/lean/inspect); the ball sets Abigail to dance.
- Check: `?scene=ch1.vers-cantine` (exploration), `?scene=ch1.affrontement` (tactical),
  `__game.tacticalRenderStats()` / `exploreRenderStats()` for cost.

## Poses

`POSES` in `cadet.ts`: talk, argue, disappointed, salute, look, nervous, sad, wave, run. Add one by downloading
the clip to `public/assets/mixamo/exo/<name>.fbx` and adding it to `POSES` and to `POSE_LABELS` in
`dormitoryAAA.ts`. `cadet.play(name | null)` crossfades; walking always overrides a pose.

## Verify a change

- Console: `window.__franklyn` is the playable cadet, `window.__cast` the line-up; `.pose`, `.stats`, `.debug.mixer`.
- Measure instead of guessing: sample skinned vertices with `mesh.getVertexPosition(i, v)` and compare to bone
  positions (for a cloth problem, vertices weighted >= 0.9 to the relevant bones vs the bone axis).
- `npx tsc --noEmit -p . && npx eslint src/dev` for code; `npm run verify` before committing (repo rule).
- Use the built-in browser pane (`preview`/`navigate`); the dev server on :5173 is usually already running.
