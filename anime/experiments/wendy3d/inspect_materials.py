import bpy
for m in bpy.data.materials:
 if m.name in ('hair','body_bake','eye','huku_bake'):
  print('MATERIAL',m.name)
  for n in m.node_tree.nodes: print(' ',n.name,n.type)
