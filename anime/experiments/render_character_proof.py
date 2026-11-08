"""Preuve isolée d'import et rendu d'un GLB HOLT, sans modifier l'asset."""
import bpy
from mathutils import Vector
from pathlib import Path
import sys

args = sys.argv[sys.argv.index('--') + 1:]
source, output = map(lambda value: str(Path(value).resolve()), args)
if Path(output).exists():
    raise FileExistsError(f'Rendu déjà présent : {output}')
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=source)
meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
if not meshes:
    raise RuntimeError('GLB sans maillage')
points = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
lo = Vector(tuple(min(p[i] for p in points) for i in range(3)))
hi = Vector(tuple(max(p[i] for p in points) for i in range(3)))
center = (lo + hi) / 2
height = hi.z - lo.z
print('HOLT_BOUNDS', tuple(lo), tuple(hi), 'MESHES', len(meshes))
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 16
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.world.color = (0.18, 0.18, 0.18)
bpy.ops.object.camera_add(location=(center.x, lo.y - height * 2.5, center.z))
camera = bpy.context.object
camera.rotation_euler = (center - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.type = 'ORTHO'
camera.data.ortho_scale = height * 1.12
scene.camera = camera
for position, energy, color in [((4,-5,7), 800, (0.5,0.65,1)), ((-4,-2,5), 600, (1,0.35,0.55))]:
    bpy.ops.object.light_add(type='AREA', location=position)
    lamp = bpy.context.object
    lamp.data.energy = energy
    lamp.data.color = color
    lamp.data.shape = 'DISK'
    lamp.data.size = 5
    lamp.rotation_euler = (center - lamp.location).to_track_quat('-Z','Y').to_euler()
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = output
bpy.ops.render.render(write_still=True)
