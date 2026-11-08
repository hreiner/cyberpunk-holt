"""Banc Wendy 3D : Seed-san modifié en témoin, pas un modèle HOLT définitif."""
import bpy, json, math, sys
from pathlib import Path
from mathutils import Vector
ROOT=Path.cwd(); OUT=ROOT/'art-masters/anime/experiments/wendy3d'; OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str((ROOT/'art-masters/anime/experiments/vrm/Seed-san.glb').resolve()))
scene=bpy.context.scene
for obj in list(scene.objects):
 if obj.type=='MESH' and obj.name in ('hair_tail','robo_arm'):obj.hide_render=True
scene.render.engine='CYCLES';scene.cycles.samples=8
scene.render.resolution_x=960;scene.render.resolution_y=540;scene.render.resolution_percentage=100
scene.render.fps=12;scene.frame_start=1;scene.frame_end=72
scene.world.color=(.008,.009,.025)
scene.view_settings.view_transform='Standard'
def mat(name,color,emission=0,metal=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=.65;bs.inputs['Metallic'].default_value=metal
 if emission: bs.inputs['Emission Color'].default_value=(*color,1);bs.inputs['Emission Strength'].default_value=emission
 return m
jacket=mat('Wendy jacket purple',(.005,.002,.022));edge=mat('Wendy collar highlight',(.014,.004,.038)); cyan=mat('Cyan neon',(.0,.35,.9),3);pink=mat('Pink neon',(.75,.0,.28),3);dark=mat('Back wall',(.007,.012,.03));shelf=mat('Shelf',(.025,.015,.06),0,.2)
def poly(name,verts,material):
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],[list(range(len(verts)))]);mesh.update();o=bpy.data.objects.new(name,mesh);scene.collection.objects.link(o);o.data.materials.append(material); return o
def cube(name,loc,size,material):
 bpy.ops.mesh.primitive_cube_add(size=1, location=loc);o=bpy.context.object;o.name=name;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material);return o
# Outer jacket overlay and high collar in front of body; masks robot props but not the face.
poly('jacket front',[(-.42,-.162,1.09),(-.26,-.16,1.28),(-.13,-.15,1.32),(0,-.16,1.23),(.13,-.15,1.32),(.26,-.16,1.28),(.42,-.162,1.09)],jacket)
# Crude triangular collar removed: shape did not match reference.
# Costume remains a provisional dark silhouette.
# Environmental elements in the bar, intentionally out of focus.
cube('wall',(0,.8,1.5),(5,.05,2.5),dark)
for z in [1.2,1.39,1.58,1.77]:
 cube('shelf',(0,.69,z),(2.7,.13,.014),shelf)
 for i in range(19):
  x=-1.26+i*.14; cube('bottle',(x,.68,z+.048),(.035,.04,.085),cyan if i%3==0 else pink if i%4==0 else shelf)
 cube('strip',(0,.615,z+.005),(2.7,.014,.009),cyan if z in (1.2,1.58) else pink)
# Angular side-swept locks in navy hair, not a finished Wendy model.
hairmat=mat('Deep blue graphic fringe',(.004,.014,.11));highlight=mat('Blue edge light',(.008,.06,.38),.15)
# Native hair retained: generated wedge was rejected in image review.
# Narrow off-face wedge hints at the asymmetric blue sweep, kept out of eyes and mouth.
# Blue tint preserves native hair geometry; pointed wedge rejected after visual review.
# Seed-san's texture remains original; tint the hair via a material node rather than editing assets.
hm=bpy.data.materials.get('hair')
if hm and hm.use_nodes:
 nodes=hm.node_tree.nodes;links=hm.node_tree.links;tex=next((n for n in nodes if n.type=='TEX_IMAGE'),None);em=next((n for n in nodes if n.type=='EMISSION'),None)
 if tex and em:
  mix=nodes.new('ShaderNodeMixRGB');mix.blend_type='MIX';mix.inputs[0].default_value=.45;mix.inputs[2].default_value=(.005,.015,.2,1)
  links.new(tex.outputs['Color'],mix.inputs[1]);links.new(mix.outputs[0],em.inputs['Color'])
# Vowels from existing Rhubarb JSON. Values are approximate animation shapes, not phonetic alignment.
head=bpy.data.objects.get('head');keys=head.data.shape_keys.key_blocks
keys['eye_brow_down'].value=.65
keys['eye_angry'].value=.35
mapping={'A':None,'B':'lip_i','C':'lip_e','D':'lip_a','E':'lip_o','F':'lip_u','G':'lip_w','H':'lip_a','X':None}
cues=json.loads((ROOT/'art-masters/anime/experiments/rhubarb/wendy-01.json').read_text(encoding='utf-8'))['mouthCues']
vowels=['lip_a','lip_i','lip_u','lip_e','lip_o','lip_w']
for cue in cues:
 frame=max(1,round(float(cue['start'])*scene.render.fps)+1)
 for name in vowels:
  k=keys[name];k.value=.8 if mapping.get(cue['value'])==name else 0;k.keyframe_insert(data_path='value',frame=frame)
for name in ('blink_L','blink_R'):
 k=keys[name]
 for f,v in [(1,0),(25,0),(27,1),(29,0),(56,0),(58,1),(60,0),(68,0)]: k.value=v;k.keyframe_insert(data_path='value',frame=f)
# Gentle animated attention shifts via camera, with no shape hallucination.
def aim(obj,point): obj.rotation_euler=(Vector(point)-obj.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.light_add(type='AREA',location=(-.8,-1.3,2.2));key=bpy.context.object;key.data.energy=140;key.data.size=2;key.data.color=(1,.48,.25);aim(key,(0,0,1.4))
bpy.ops.object.light_add(type='AREA',location=(1,-.6,1.5));fill=bpy.context.object;fill.data.energy=60;fill.data.size=1;fill.data.color=(.08,.18,1);aim(fill,(0,0,1.4))
bpy.ops.object.camera_add(location=(.03,-2.1,1.47));cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=.85;aim(cam,(0,0,1.36));scene.camera=cam
for f,x in [(1,.03),(68,.045)]:cam.location.x=x;cam.keyframe_insert(data_path='location',frame=f)
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(OUT/'preview-v4.png');scene.frame_set(20)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'wendy-3d-v4.blend'));bpy.ops.render.render(write_still=True)
