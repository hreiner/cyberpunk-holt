"""Scene locale Blue Purple : blocage 3D, sans modifier les GLB du jeu.
Usage : blender -b --python anime/blender/scene.py -- <repertoire-sortie>
"""
import bpy, json, math, sys
from pathlib import Path
from mathutils import Vector, Matrix

root = Path.cwd()
out = Path(sys.argv[sys.argv.index('--') + 1]).resolve()
out.mkdir(parents=True, exist_ok=True)
blend = out/'blue-purple-blocking.blend'
if blend.exists(): raise FileExistsError(blend)

bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.samples=12
scene.render.resolution_x=960; scene.render.resolution_y=540; scene.render.resolution_percentage=100
scene.render.fps=24; scene.frame_start=1; scene.frame_end=math.ceil(62.3*24)
scene.world.color=(.018,.018,.035)
scene.view_settings.view_transform='Standard'

def mat(name,color,metal=0,rough=.55,emission=0):
 m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1); p.inputs['Metallic'].default_value=metal; p.inputs['Roughness'].default_value=rough
 if emission: p.inputs['Emission Color'].default_value=(*color,1); p.inputs['Emission Strength'].default_value=emission
 return m
wall=mat('Walls',(.026,.033,.052)); dark=mat('Charcoal metal',(.025,.033,.052),.5,.3)
wood=mat('Table satin',(.12,.055,.044),.25,.4); brass=mat('Warm brass',(.28,.13,.045),.7,.25)
blue=mat('Cyan neon',(.02,.40,1),emission=4); purple=mat('Violet neon',(.48,.04,.8),emission=3)

def cube(name,loc,scale,material):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object; o.name=name; o.scale=scale; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); o.data.materials.append(material)
 bevel=o.modifiers.new('soft bevel','BEVEL'); bevel.width=.025; bevel.segments=2
 return o

def cylinder(name,loc,radius,depth,material,vertices=48):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc); o=bpy.context.object; o.name=name; o.data.materials.append(material)
 b=o.modifiers.new('edge bevel','BEVEL'); b.width=.018; b.segments=2
 return o

cube('Floor',(0,0,-.08),(11,10,.16),dark)
cube('Back wall',(0,3.5,2.1),(11,.15,4.2),wall)
cube('Wall left',(-5.5,0,2.1),(.15,7,4.2),wall)
cube('Wall right',(5.5,0,2.1),(.15,7,4.2),wall)
cube('Bar counter',(0,2.9,.53),(6,.8,1.06),wood)
cube('Magenta bar neon',(0,2.42,1.08),(5.9,.035,.045),purple)
cube('Blue bar neon',(0,2.45,.9),(5.8,.025,.025),blue)
for h in (1.4,1.95,2.5):
 cube('Shelf',(0,3.32,h),(6,.3,.05),dark)
 for i in range(15):
  x=-2.8+i*.4
  cylinder('Bottle',(x,3.3,h+.16),.04,.27, brass if i%3==0 else dark,12)
for x in (-3.7,3.7): cube('Vertical neon',(x,3.35,1.9),(.025,.03,2.0),purple)
cylinder('Tabletop',(0,0,.79),1.08,.10,wood,64)
cylinder('Table foot',(0,0,.39),.10,.75,dark,24)
cylinder('Table metal ring',(0,0,.735),1.09,.035,brass,64)
for x,y in [(-.4,.2),(.28,.3),(.5,-.3),(-.5,-.25)]: cylinder('Glass',(x,y,.87),.055,.14,brass,24)
cube('Cryptic note',(.05,.08,.85),(.34,.21,.005),mat('Paper',(.75,.74,.65)))

# The characters are intentionally arranged on the far side and flanks, camera side clear.
placements={'wendy':(-.43,1.30,0.0), 'john':(.43,1.30,0.0), 'abigail':(1.12,.78,0.0),
            'grover':(-1.12,.78,0.0), 'enfant':(1.40,-.42,0.0), 'franklyn':(-1.40,-.42,0.0)}
characters={}
for name,(x,y,z) in placements.items():
 src='abigail' if name=='wendy' else name
 before=set(bpy.context.scene.objects)
 bpy.ops.import_scene.gltf(filepath=str(root/f'public/assets/mixamo/{src}/{src}.glb'))
 new=list(set(bpy.context.scene.objects)-before)
 rigs=[o for o in new if o.type=='ARMATURE']
 if len(rigs)!=1: raise RuntimeError('Armature inattendue '+name)
 rig=rigs[0]; rig.name='HOLT_'+name; characters[name]=rig
 # At this position camera-facing direction is kept approximate; far side faces camera.
 rig.location=(x,y,0 if name=='enfant' else -.46)
 # GLB faces local -Y. Side characters turn toward the table.
 rig.rotation_euler.z = (.72 if x < -1 else -.72 if x > 1 else 0)
 # Aim upper arms towards the table using a rotation in armature coordinates.
 for side in ('Left','Right'):
  bone=rig.pose.bones.get('mixamorig:'+side+'Arm')
  if bone:
   bone.rotation_mode='QUATERNION'
   rest=bone.bone.tail_local-bone.bone.head_local
   target=Vector((.30 if side=='Left' else -.30,-.50,-.75))
   delta=rest.rotation_difference(target)
   base=bone.bone.matrix_local.to_quaternion()
   bone.rotation_quaternion=base.inverted() @ delta @ base
  elbow=rig.pose.bones.get('mixamorig:'+side+'ForeArm')
  if elbow:
   elbow.rotation_mode='XYZ'; elbow.rotation_euler.x=-.2
 # tinted clothing only; duplicate materials to avoid changing other cast.
 for obj in new:
  if obj.type!='MESH': continue
  for index,m in enumerate(obj.data.materials):
   if m and ('suit' in m.name.lower() or 'pants' in m.name.lower()):
    cp=m.copy(); obj.data.materials[index]=cp
    bs=cp.node_tree.nodes.get('Principled BSDF') if cp.use_nodes else None
    if bs:
     for link in list(bs.inputs['Base Color'].links): cp.node_tree.links.remove(link)
     bs.inputs['Base Color'].default_value=(.018,.035,.085,1)
 # A distinct approximation only; not a validated Wendy model.
 if name=='wendy': rig['identity_note']='Placeholder Abigail GLB; Wendy design not built'
 cylinder('Seat_'+name,(x,y,.46),.28,.09,dark,32)

# Head/torso motion is modest and synchronised to the existing subtitle timing.
project=json.loads((root/'art-masters/anime/blue-purple/scene-v1.json').read_text(encoding='utf-8'))
lines=json.loads((root/'anime/projects/blue-purple/lines.json').read_text(encoding='utf-8'))
for cue,line in zip(project['subtitles'], lines):
 rig=characters[line['speaker']]
 for bone_name in ('Head','Spine2'):
  b=rig.pose.bones.get('mixamorig:'+bone_name)
  if not b: continue
  b.rotation_mode='XYZ'
  start=max(1,round(float(cue['start'])*24)); end=min(scene.frame_end,round(float(cue['end'])*24))
  amp=.055 if bone_name=='Head' else .025
  for frame,value in [(max(1,start-1),0),(start,0),(start+(end-start)//3,amp),(start+2*(end-start)//3,-amp*.55),(end,0)]:
   b.rotation_euler.x=value; b.keyframe_insert(data_path='rotation_euler',frame=frame,group=bone_name)

def aim(obj, target): obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
def area(name, pos,target,color,energy,size):
 bpy.ops.object.light_add(type='AREA',location=pos); o=bpy.context.object;o.name=name;o.data.color=color;o.data.energy=energy;o.data.shape='DISK';o.data.size=size;aim(o,target)
area('Key warm',(0,-3,4),(0,0,1), (1,.67,.40),700,5)
area('Cyan fill',(-3,1,3),(0,0,1),(.2,.5,1),600,4)
area('Violet rim',(3,2.5,3),(0,0,1),(.6,.15,1),750,3)
bpy.ops.object.camera_add(location=(0,-3.10,1.18)); cam=bpy.context.object;cam.name='Camera_Wide';aim(cam,(0,.2,.98));cam.data.lens=29;scene.camera=cam
# Build a camera in front of each face, without relying on absent facial morphs.
# Preserve the wide master camera and switch cameras through markers at 24 fps.
bpy.context.view_layer.update()
cameras={}
for name, rig in characters.items():
 head=rig.pose.bones['mixamorig:Head']
 headpos=rig.matrix_world @ head.head
 forward=rig.rotation_euler.to_matrix() @ Vector((0,-1,0))
 location=headpos + 1.15*forward + Vector((0,0,.12))
 bpy.ops.object.camera_add(location=location)
 close=bpy.context.object; close.name='Camera_'+name.capitalize(); close.data.lens=52
 aim(close,headpos+Vector((0,0,.11)))
 cameras[name]=close
# A second of wide shot establishes the bar; cut each following take on cue.
marker=scene.timeline_markers.new('Establishing',frame=1); marker.camera=cam
for number,(cue,line) in enumerate(zip(project['subtitles'],lines),1):
 frame=max(25,round(float(cue['start'])*24)+1)
 marker=scene.timeline_markers.new(f"{number:02}_{line['speaker']}",frame=frame)
 marker.camera=cameras[line['speaker']]
scene.camera=cam

# Use measured envelopes for speech-aligned head motion, when helper is available.
sys.path.insert(0, str(root/'anime/blender'))
try:
 from lipsync import analyse_project, animate_head
 ffmpeg = root/'art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'
 envelopes=analyse_project(root/'art-masters/anime/blue-purple/scene-v1.json',root,ffmpeg,fps=24)
 for name, rig in characters.items():
  if name in envelopes: animate_head(rig,envelopes[name])
 print('HOLT_AUDIO_MOTION', sorted(envelopes))
except (ImportError, FileNotFoundError) as exc:
 print('HOLT_AUDIO_MOTION_UNAVAILABLE', exc)
# Save both render controls and named cast so the facial integration can address armatures.
scene['description']='Blocking 3D Blue Purple, Wendy est provisoire; voix 14 prises; aucun viseme dans ce script'
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(blend))
scene.render.image_settings.file_format='PNG'; scene.render.filepath=str(out/'blue-purple-wide.png')
bpy.ops.render.render(write_still=True)
print('HOLT_SCENE', blend, 'PREVIEW', scene.render.filepath)
