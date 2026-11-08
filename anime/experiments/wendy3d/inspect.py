import bpy
from pathlib import Path
from mathutils import Vector
bpy.ops.import_scene.gltf(filepath=str(Path('art-masters/anime/experiments/vrm/Seed-san.glb').resolve()))
for o in bpy.context.scene.objects:
 if o.type=='MESH':
  print('MESH',o.name,'bounds', [(tuple(round(v,3) for v in (o.matrix_world @ Vector(corner)))) for corner in [o.bound_box[0],o.bound_box[6]]], 'mats', [m.name for m in o.data.materials])
 if o.type=='ARMATURE':
  print('BONES',o.name,[b.name for b in o.data.bones if 'head' in b.name.lower() or 'neck' in b.name.lower()])
