"""Inspect one Mixamo FBX and make an editable Blender master plus a web GLB.

Run with Blender, for example:
  blender -b --factory-startup --python scripts/prepare-mixamo-pilot.py -- \
    art-masters/mixamo/franklyn-walk.fbx art-masters/mixamo/franklyn-walk.blend \
    art-masters/mixamo/franklyn-walk.glb

The FBX must contain the character skin and one in-place animation. This script
does not decide visual quality, retarget clips, or publish the resulting GLB.
"""

import json
import math
import pathlib
import sys

import bpy
from mathutils import Vector


def fail(message):
    raise SystemExit(f"ERREUR MIXAMO : {message}")


def bounds(meshes):
    points = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
    return ([min(point[axis] for point in points) for axis in range(3)],
            [max(point[axis] for point in points) for axis in range(3)])


args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
if len(args) != 3:
    fail("trois chemins requis : entrée.fbx master.blend sortie.glb")

source, master, output = map(lambda value: pathlib.Path(value).resolve(), args)
if not source.is_file() or source.suffix.lower() != ".fbx":
    fail(f"FBX introuvable : {source}")
master.parent.mkdir(parents=True, exist_ok=True)
output.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.fbx(filepath=str(source), use_anim=True, use_image_search=True)

armatures = [obj for obj in bpy.data.objects if obj.type == "ARMATURE"]
meshes = [obj for obj in bpy.data.objects if obj.type == "MESH"]
if len(armatures) != 1:
    fail(f"un seul squelette attendu, {len(armatures)} trouvé(s)")
if not meshes or not any(mod.type == "ARMATURE" for mesh in meshes for mod in mesh.modifiers):
    fail("personnage skinné absent ; télécharger le clip avec la peau (With Skin)")
armature = armatures[0]
actions = list(bpy.data.actions)
if not actions:
    fail("aucune animation ; télécharger un clip avec la peau (With Skin)")

# Keep the source scale and orientation until they can be reviewed on the real
# character. Blindly applying transforms here can silently change root motion.
bpy.context.scene.frame_set(bpy.context.scene.frame_start)
minimum, maximum = bounds(meshes)
height = maximum[2] - minimum[2]
if not math.isfinite(height) or height < 0.5 or height > 3.0:
    fail(f"hauteur incohérente : {height:.3f} m ; vérifier l'échelle FBX dans Blender")

hips = next((bone for bone in armature.pose.bones if bone.name.lower().endswith("hips")), None)
root_drift = None
if hips:
    def hip_position(frame):
        bpy.context.scene.frame_set(frame)
        return armature.matrix_world @ hips.head

    start = hip_position(bpy.context.scene.frame_start)
    end = hip_position(bpy.context.scene.frame_end)
    root_drift = (Vector((end.x - start.x, end.y - start.y))).length
    bpy.context.scene.frame_set(bpy.context.scene.frame_start)

for obj in bpy.data.objects:
    obj.select_set(False)
armature.select_set(True)
for mesh in meshes:
    mesh.select_set(True)
bpy.context.view_layer.objects.active = armature
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(master))
bpy.ops.export_scene.gltf(
    filepath=str(output), export_format="GLB", use_selection=True,
    export_animations=True, export_animation_mode="ACTIONS", export_skins=True,
)

report = {
    "source": str(source),
    "master": str(master),
    "glb": str(output),
    "bones": len(armature.data.bones),
    "meshes": len(meshes),
    "triangles_approx": sum(len(poly.vertices) - 2 for mesh in meshes for poly in mesh.data.polygons),
    "height_m": round(height, 3),
    "actions": [action.name for action in actions],
    "hips_start_end_drift_m": round(root_drift, 3) if root_drift is not None else None,
    "glb_bytes": output.stat().st_size,
}
print("MIXAMO_PILOT_REPORT " + json.dumps(report, ensure_ascii=False))
if root_drift is not None and root_drift > 0.2:
    print("ATTENTION MIXAMO : déplacement racine > 0,2 m ; réexporter avec In Place")
