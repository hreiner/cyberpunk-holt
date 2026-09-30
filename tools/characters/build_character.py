"""Build one HOLT character with MPFB2 (Blender, headless) and export a Mixamo-rigged GLB.

Run (see README.md):
    blender --background --python build_character.py -- <spec.json> <out_dir>

The spec is a JSON file (specs/*.json). The skeleton carries the real `mixamorig:*` bone names so
Mixamo clips play on it after src/dev/mixamoRetarget.ts.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import bmesh  # noqa: E402
import math  # noqa: E402
import bpy  # noqa: E402
from _mpfb import dynamic_import  # noqa: E402

args = sys.argv[sys.argv.index("--") + 1:]
SPEC = json.load(open(args[0], encoding="utf-8"))
OUT = args[1]
os.makedirs(OUT, exist_ok=True)

HumanService = dynamic_import("mpfb.services.humanservice", "HumanService")
TargetService = dynamic_import("mpfb.services.targetservice", "TargetService")
AssetService = dynamic_import("mpfb.services.assetservice", "AssetService")
ExportService = dynamic_import("mpfb.services.exportservice", "ExportService")
ObjectService = dynamic_import("mpfb.services.objectservice", "ObjectService")
LocationService = dynamic_import("mpfb.services.locationservice", "LocationService")
HumanObjectProperties = dynamic_import("mpfb.entities.objectproperties", "HumanObjectProperties")

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()

basemesh = HumanService.create_human()
basemesh.name = SPEC["id"]

for key, value in SPEC["macro"].items():
    HumanObjectProperties.set_value(key, value, entity_reference=basemesh)
TargetService.reapply_macro_details(basemesh)

targets_root = LocationService.get_mpfb_data("targets")
gain = float(SPEC.get("faceGain", 2.0))
for rel, weight in SPEC.get("face", {}).items():
    path = os.path.join(targets_root, *(rel + ".target.gz").split("/"))
    if not os.path.exists(path):
        print(f"[character] target manquante: {rel}")
        continue
    TargetService.load_target(basemesh, path, weight=weight * gain)


def find(name, subdir):
    path = AssetService.find_asset_absolute_path(name, asset_subdir=subdir)
    if path is None:
        print(f"[character] asset introuvable: {subdir}/{name}")
    return path


skin = find(SPEC["skin"] + ".mhmat", "skins")
if skin:
    HumanService.set_character_skin(skin, basemesh, skin_type="GAMEENGINE")

HumanService.add_builtin_rig(basemesh, "mixamo")

assets = [
    ("eyes", SPEC.get("eyes", "low-poly"), "Eyes"),
    ("eyebrows", SPEC.get("eyebrows", "eyebrow004"), "Eyebrows"),
    ("eyelashes", SPEC.get("eyelashes", "eyelashes02"), "Eyelashes"),
    ("teeth", "teeth_base", "Teeth"),
    ("hair", SPEC["hair"], "Hair"),
] + [("clothes", name, "Clothes") for name in SPEC["clothes"]]
for subdir, name, kind in assets:
    path = find(name + ".mhclo", subdir)
    if path:
        HumanService.add_mhclo_asset(path, basemesh, asset_type=kind, material_type="GAMEENGINE")

# ---- optional hair reshaping (spec keys hairFlip / hairShorten / hairBack) ------------------
def clamp01(x):
    return max(0.0, min(1.0, x))


def reshape_hair():
    if not any(k in SPEC for k in ("hairFlip", "hairShorten", "hairBack")):
        return
    body_z = [v.co.z for v in basemesh.data.vertices]
    H = max(body_z)
    for obj in bpy.data.objects:
        if obj.type != "MESH" or SPEC["hair"].lower() not in obj.name.lower():
            continue
        verts = obj.data.vertices
        crown = [v.co.y for v in verts if v.co.z > 0.9 * H]
        yc = sum(crown) / max(1, len(crown))
        for v in verts:
            x, y, z = v.co.x, v.co.y, v.co.z
            if "hairShorten" in SPEC:  # bowl cut: compress everything below the ear line
                p = SPEC["hairShorten"]
                z_ear = p["fromZ"] * H
                if z < z_ear:
                    z = z_ear + (z - z_ear) * p["factor"]
            if "hairFlip" in SPEC:  # braids that fell behind now hang over the chest
                p = SPEC["hairFlip"]
                t = clamp01((p["belowZ"] * H - z) / (p.get("band", 0.08) * H))
                y = y * (1 - t) + (2 * yc - y - p.get("bias", 0.035)) * t
                x += (1 if x >= 0 else -1) * t * p.get("shift", 0.0)
            if "hairBack" in SPEC:  # sweep the fringe up and back off the forehead
                p = SPEC["hairBack"]
                front = clamp01((yc - y) / 0.06)
                band = clamp01(1 - abs(z - p["z"] * H) / (0.07 * H))
                w = front * band
                y += p["back"] * w
                z += p["up"] * w
            v.co.x, v.co.y, v.co.z = x, y, z
        obj.data.update()
        print("[character] reshaped hair", obj.name)


reshape_hair()

# Optional: cut a garment off below a height (fraction of body height), e.g. drop a skirt.
def cut_below(match, fraction):
    H = max(v.co.z for v in basemesh.data.vertices)
    for obj in bpy.data.objects:
        if obj.type == "MESH" and match in obj.name.lower():
            bm = bmesh.new()
            bm.from_mesh(obj.data)
            doomed = [v for v in bm.verts if v.co.z < fraction * H]
            bmesh.ops.delete(bm, geom=doomed, context="VERTS")
            bm.to_mesh(obj.data)
            bm.free()
            print("[character] cut", obj.name, len(doomed), "verts")


for garment, fraction in SPEC.get("cutBelow", {}).items():
    cut_below(garment, fraction)
if "hairCutBelow" in SPEC:
    cut_below(SPEC["hair"].lower(), SPEC["hairCutBelow"])

# Optional: lengthen a garment's hem downward (fraction of height + factor), e.g. to cover a waist gap.
for garment, params in SPEC.get("stretchDown", {}).items():
    H = max(v.co.z for v in basemesh.data.vertices)
    for obj in bpy.data.objects:
        if obj.type == "MESH" and garment in obj.name.lower():
            z0 = params["from"] * H
            for v in obj.data.vertices:
                if v.co.z < z0:
                    v.co.z = z0 + (v.co.z - z0) * (1 + params["factor"])
            obj.data.update()
            print("[character] stretched", obj.name)

# Optional: pull a bulky garment in along its normals (metres).
for garment, amount in SPEC.get("slim", {}).items():
    for obj in bpy.data.objects:
        if obj.type == "MESH" and garment in obj.name.lower():
            bm = bmesh.new()
            bm.from_mesh(obj.data)
            bm.normal_update()
            for v in bm.verts:
                v.co -= v.normal * amount
            bm.to_mesh(obj.data)
            bm.free()
            print("[character] slimmed", obj.name)

# Optional: make a garment's sleeves follow the arm rig. The blouse mesh is not fitted to the Mixamo
# forearm axis (the cuff ring can sit several cm off it and flare like a bell), which shows as soon
# as the arm bends or hangs: skin peeks out beside the cuff. Two steps, per slab along the arm:
#   1. recentre the ring on the shoulder-elbow-wrist axis (fading in from `from` to `centre`),
#   2. narrow it (radius kept at the cuff = `factor`).
# {"garment": {"from": 0.3, "centre": 0.55, "factor": 0.6}}: positions are fractions of the
# shoulder-to-wrist length.
def arm_axis(side):
    rig = next(o for o in bpy.data.objects if o.type == "ARMATURE")
    pts = []
    for bone in ("Arm", "ForeArm", "Hand"):
        b = rig.data.bones["mixamorig:" + side + bone]
        pts.append(rig.matrix_world @ b.head_local)
    return pts


def locate_on_arm(p, pts):
    """Nearest arm segment: (sideways distance, point on its axis, 0..1+ position along the arm).

    The axis point is not clamped past the wrist, so the cuff (which overhangs the wrist joint) keeps
    its position along the arm; only sideways offsets are edited."""
    lengths = [(pts[i + 1] - pts[i]).length for i in range(2)]
    total = sum(lengths)
    best = None
    run = 0.0
    for i in range(2):
        a, b = pts[i], pts[i + 1]
        ab = b - a
        s = (p - a).dot(ab) / ab.length_squared
        t = max(0.0, min(1.0, s))
        clamped = (p - (a + ab * t)).length
        if best is None or clamped < best[0]:
            position = (run + (s if i == 1 and s > 1.0 else t) * lengths[i]) / total
            best = (clamped, a + ab * s, position)
        run += lengths[i]
    return best


def smooth(x):
    x = clamp01(x)
    return x * x * (3 - 2 * x)


SLAB = 0.05
for garment, params in SPEC.get("slimSleeves", {}).items():
    axes = {1: arm_axis("Left"), -1: arm_axis("Right")}
    for obj in bpy.data.objects:
        if obj.type != "MESH" or garment not in obj.name.lower():
            continue
        world = obj.matrix_world
        inverse = world.inverted()
        found = []  # (vertex, world position, side, axis point, position along the arm)
        for v in obj.data.vertices:
            p = world @ v.co
            side = 1 if p.x >= 0 else -1
            if abs(p.x) < 0.2:  # torso side: not a sleeve
                continue
            d, q, t = locate_on_arm(p, axes[side])
            if d <= 0.25:
                found.append((v, p, side, q, t))
        # Ring centre per (side, slab): mean sideways offset of the garment vertices in the slab.
        slabs = {}
        for v, p, side, q, t in found:
            slabs.setdefault((side, int(t / SLAB)), []).append(p - q)
        centres = {key: sum(offsets, type(offsets[0])((0, 0, 0))) / len(offsets) for key, offsets in slabs.items()}

        def centre_at(side, t):
            """Ring centre interpolated between neighbouring slab centres (no steps along the tube)."""
            x = t / SLAB - 0.5
            i = int(math.floor(x))
            f = x - i
            lo, hi = centres.get((side, i)), centres.get((side, i + 1))
            if lo is None or hi is None:
                return lo or hi or centres[(side, int(t / SLAB))]
            return lo * (1 - f) + hi * f

        cuff_before = []
        cuff_after = []
        # Cuff length: the blouse sleeve overhangs the wrist onto the hand. Squash the stretch from
        # `squashFrom` to the sleeve end so that it ends at `endAt` (1.0 = wrist joint).
        tmax = {side: max(t for _, _, sd, _, t in found if sd == side) for side in (1, -1)}
        end_at = params.get("endAt", 1.0)
        squash_from = params.get("squashFrom", 0.75)
        for v, p, side, q, t in found:
            move = centre_at(side, t) * smooth((t - params["from"]) / max(1e-4, params["centre"] - params["from"]))
            radial = p - q - move  # sideways offset once the ring is centred
            keep = 1.0 + (params["factor"] - 1.0) * smooth((t - params["from"]) / max(1e-4, 1.0 - params["from"]))
            if t > 0.9:
                cuff_before.append((p - q).length)
                cuff_after.append((radial * keep).length)
            if tmax[side] > end_at and t > squash_from:
                t_new = squash_from + (t - squash_from) * (end_at - squash_from) / (tmax[side] - squash_from)
                pts = axes[side]
                forearm = (pts[2] - pts[1]).normalized()
                total = (pts[1] - pts[0]).length + (pts[2] - pts[1]).length
                q = q + forearm * ((t_new - t) * total)
            v.co = inverse @ (q + radial * keep)
        obj.data.update()
        if cuff_before:
            near = [c.length for (side, slab), c in centres.items() if slab * SLAB > 0.85]
            print("[character] sleeve end at %.2f of the arm (wrist = 1.00) -> %.2f" % (max(tmax.values()), min(end_at, max(tmax.values()))))
            print("[character] sleeves cuff radius %.3f -> %.3f, ring centre was %.3f off the axis (%d verts)" % (
                sum(cuff_before) / len(cuff_before), sum(cuff_after) / len(cuff_after),
                sum(near) / max(1, len(near)), len(cuff_before)))

export_root = ExportService.create_character_copy(basemesh, name_suffix="_export")
export_basemesh = ObjectService.find_object_of_type_amongst_nearest_relatives(export_root, "Basemesh")
ExportService.bake_modifiers_remove_helpers(
    export_basemesh, bake_masks=True, bake_subdiv=True, remove_helpers=True, also_proxy=True
)

# Keep the GLB light: no texture larger than MAX_TEXTURE px.
MAX_TEXTURE = int(SPEC.get("maxTexture", 1024))
for image in bpy.data.images:
    if image.size[0] > MAX_TEXTURE or image.size[1] > MAX_TEXTURE:
        ratio = MAX_TEXTURE / max(image.size[0], image.size[1])
        image.scale(max(1, int(image.size[0] * ratio)), max(1, int(image.size[1] * ratio)))

bpy.ops.object.select_all(action="DESELECT")
export_root.select_set(True)
for child in ObjectService.get_list_of_children(export_root):
    child.select_set(True)
bpy.context.view_layer.objects.active = export_root
glb = os.path.join(OUT, SPEC["id"] + ".glb")
bpy.ops.export_scene.gltf(
    filepath=glb,
    export_format="GLB",
    use_selection=True,
    export_apply=False,
    export_skins=True,
    export_animations=False,
    export_yup=True,
    export_image_format="AUTO",
)
print("[character] GLB ->", glb, os.path.getsize(glb) // 1024, "KB")
