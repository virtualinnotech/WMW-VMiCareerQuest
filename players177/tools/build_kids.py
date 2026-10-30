# Builds the eight student characters (players177/kid01.glb ... kid08.glb)
# from the "Mega Bundle Stylized Children Characters" pack: each one's rigged
# T-Pose FBX (mesh and Mixamo skeleton), its base-color texture taken from the
# pack's GLB, and its own Mixamo clips. Every file comes in through the same
# FBX importer, so the clips match the skeleton's rest pose. Clip names are
# what the game picks: idle, walk, walk_backward (Walking played in reverse),
# run (Slow Run; kids 03, 05 and 08 have none in the pack, so they borrow
# kid04's or kid01's, retargeted bone by bone) and cheer (a wave or a jump,
# for the character select carousel). kid02 borrows kid01's Standing Idle (her
# own leaned back and breathed hard); kid06's right hand is twisted 17 degrees
# so his two hands hang alike. Scale keys and every translation key but
# the hips are dropped, and the mesh is Draco-compressed (the game already
# decodes Draco for its other characters). The game stands the T-pose soles
# on the floor; where a character's clips tilt the feet below that (shoe
# edges in a relaxed idle), the whole rig is raised so the lowest point of
# idle, walk and run averages out on the floor.
# Every kid is reshaped to kid04's proportions (the user's pick): head and
# hands scaled about their joints (hands only part of the way, measured from
# the mesh: matched fully they looked too small in puffy sleeves), torso, arms and legs stretched or
# shortened along their bones, torso and limbs slimmed or filled out; the mesh is
# baked into that shape and it becomes the new rest pose, so the clips (which
# are rotations) fit it unchanged. Hips motion in the clips scales with the
# new hip height.
# Each kid also gets a copy for the venue crowd (kidNN-crowd.glb): a 1024
# texture, the same skeleton, idle and walk, and three meshes: the full
# original mesh for close by, and 15,000 and 5,000 triangles (face and hands
# kept detailed) for the game's middle and far distances (mesh names end
# @lod1 and @lod2). Its idle is calmer: a third of the motion (rigtools.calm).
# Usage: blender -b --factory-startup --python build_kids.py -- <pack folder with GLB/ and ANIMATIONS/> <out folder> [kid01 ...]
import bpy, sys, os, json, struct
from mathutils import Matrix, Quaternion
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rigtools import import_fbx, reverse, sole_lift, borrow_clip, face_group, twist, decimate, trim, reshape, scale_hips, calm
import numpy as np

args = sys.argv[sys.argv.index('--') + 1:]
pack, out, only = args[0], args[1], set(args[2:])
ROSTER = [  # id, pack GLB (texture), animation folder, clips
    ('kid01', 'GLB GIRL 1.glb', 'animations GIRL 1', {'idle': 'Standing Idle', 'walk': 'Walking', 'run': 'Slow Run', 'cheer': 'Jump'}),
    ('kid02', 'GLB GIRL 2.glb', 'animations GIRL 2', {'walk': 'Walking', 'run': 'Slow Run', 'cheer': 'Jumping'}),
    ('kid03', 'BOY 1.glb', 'boy 1', {'idle': 'Idle', 'walk': 'Walking', 'cheer': 'Waving'}),
    ('kid04', 'boy 2.glb', 'boy 2', {'idle': 'Idle', 'walk': 'Walking', 'run': 'Slow Run', 'cheer': 'Jumping Up'}),
    ('kid05', 'GLB STYLISH GIRL  3.glb', 'ANIMATIONS GIRL 3', {'idle': 'Standing Idle', 'walk': 'Walking', 'cheer': 'Waving'}),
    ('kid06', 'BOY 3.glb', 'boy 3', {'idle': 'Idle', 'walk': 'Walking', 'run': 'Slow Run', 'cheer': 'Jumping Up'}),
    ('kid07', 'boy 4.glb', 'boy 4', {'idle': 'Idle', 'walk': 'Walking', 'run': 'Slow Run', 'cheer': 'Jumping Up'}),
    ('kid08', 'GLB GIRL CHARACETR 4.glb', 'ANIAMTIONS GIRL 4', {'idle': 'Idle', 'walk': 'Walking', 'cheer': 'Waving'}),
]
# Clips borrowed from a kid of similar build: runs for those without one, and
# a calmer idle for kid02.
BORROW = {'kid03': {'run': ('boy 2', 'Slow Run')}, 'kid05': {'run': ('animations GIRL 1', 'Slow Run')},
          'kid08': {'run': ('animations GIRL 1', 'Slow Run')}, 'kid02': {'idle': ('animations GIRL 1', 'Standing Idle')}}
# A twist (degrees, about the bone) added to a hand in every clip.
HAND_TWIST = {'kid06': ('RightHand', 17)}

def glb_basecolor(path, folder):
    raw = open(path, 'rb').read(); l = struct.unpack('<I', raw[12:16])[0]; j = json.loads(raw[20:20 + l]); o = 20 + l
    bl = struct.unpack('<I', raw[o:o + 4])[0]; b = raw[o + 8:o + 8 + bl]
    mat = j['materials'][0]; ti = mat['pbrMetallicRoughness']['baseColorTexture']['index']; im = j['images'][j['textures'][ti]['source']]
    v = j['bufferViews'][im['bufferView']]; data = b[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']]
    ext = '.png' if im.get('mimeType') == 'image/png' else '.jpg'; dst = os.path.join(folder, 'basecolor' + ext)
    open(dst, 'wb').write(data); return dst


OVERRIDES = {'kid02': {'arm': .80}}   # set by eye
CROWD_LODS = [(None, 0), (15000, 1.0), (5000, 0)]   # triangles (None: the full mesh), face and hand protection
CROWD_IDLE_MOTION = .35   # share of the idle's motion the crowd keeps (calmer breathing)


for kid, glb, folder, clips in ROSTER:
    if only and kid not in only:
        continue
    bpy.ops.wm.read_factory_settings(use_empty=True)
    anims = os.path.join(pack, 'ANIMATIONS', folder)
    arm, meshes = import_fbx(os.path.join(anims, 'T-Pose.fbx'))
    # One material: the pack's own base-color texture.
    img = bpy.data.images.load(glb_basecolor(os.path.join(pack, 'GLB', glb), bpy.app.tempdir))
    mat = bpy.data.materials.new(kid); mat.use_nodes = True; bsdf = mat.node_tree.nodes['Principled BSDF']
    tex = mat.node_tree.nodes.new('ShaderNodeTexImage'); tex.image = img
    mat.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = .75; bsdf.inputs['Metallic'].default_value = 0
    for m in meshes:
        if m.type == 'MESH':
            m.data.materials.clear(); m.data.materials.append(mat)
    for a in list(bpy.data.actions):
        bpy.data.actions.remove(a)
    actions = {}
    for name, fname in clips.items():
        a2, junk = import_fbx(os.path.join(anims, fname + '.fbx'))
        act = a2.animation_data.action; act.name = name; act.use_fake_user = True; trim(act); actions[name] = act
        for o in [a2] + junk:
            bpy.data.objects.remove(o, do_unlink=True)
    arm.animation_data_create(); arm.animation_data.action = None
    for name, (folder2, fname) in BORROW.get(kid, {}).items():
        actions[name] = borrow_clip(arm, os.path.join(pack, 'ANIMATIONS', folder2, fname + '.fbx'), name); trim(actions[name])
        print('BORROWED', name, 'for', kid, 'from', folder2, fname)
    if kid in HAND_TWIST:
        twist(actions, *HAND_TWIST[kid])
    hip_ratio, factors = reshape(arm, [m for m in meshes if m.type == 'MESH'], OVERRIDES.get(kid))
    scale_hips(actions.values(), hip_ratio)   # hips motion follows the new hip height
    print('SHAPE', kid, {k: round(v, 3) for k, v in factors.items()}, 'hips x', round(hip_ratio, 3))
    actions['walk_backward'] = reverse(actions['walk'], 'walk_backward'); actions['walk_backward'].use_fake_user = True
    lift, bind, clip = sole_lift(arm, [m for m in meshes if m.type == 'MESH'], actions)
    arm.location.z += lift   # becomes the root node's translation (glTF y)
    print('LIFT', kid, round(lift, 4), 'bind', round(bind, 4), 'clips', [round(c, 4) for c in clip])
    for name in sorted(actions):
        track = arm.animation_data.nla_tracks.new(); track.name = name
        track.strips.new(name, int(actions[name].frame_range[0]), actions[name])
    for m in list(bpy.data.meshes):
        if m.users == 0:
            bpy.data.meshes.remove(m)
    dst = os.path.join(out, kid + '.glb')
    bpy.ops.export_scene.gltf(filepath=dst, export_format='GLB', export_animation_mode='NLA_TRACKS', export_optimize_animation_size=True,
                              export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
                              export_draco_position_quantization=14, export_draco_normal_quantization=10,
                              export_draco_texcoord_quantization=12, export_draco_generic_quantization=12,
                              export_image_format='JPEG', export_jpeg_quality=88, export_materials='EXPORT', export_yup=True,
                              export_extras=False, export_cameras=False, export_lights=False)
    print('KID', kid, os.path.getsize(dst) // 1024, 'KB', sorted(actions), img.size[:])
    # The crowd copy: three decimated meshes (weights carry over), smaller texture.
    for o in [m for m in meshes if m.type == 'MESH']:
        face_group(o, arm); copies = []
        for level, (triangles, protect) in enumerate(CROWD_LODS):
            c = o if level == 0 else o.copy()
            if level:
                c.data = o.data.copy(); c.name = o.name + '@lod%d' % level; bpy.context.scene.collection.objects.link(c); copies.append(c)
        for level, c in enumerate([o] + copies):
            if CROWD_LODS[level][0]:
                decimate(c, *CROWD_LODS[level])
            c.vertex_groups.remove(c.vertex_groups['face179'])
        meshes = meshes + copies
    img.scale(1024, 1024)
    for track in list(arm.animation_data.nla_tracks):   # the crowd only idles and walks
        if track.name not in ('idle', 'walk'):
            arm.animation_data.nla_tracks.remove(track)
    # The crowd stands quietly: its idle keeps a third of the clip's motion.
    still = calm(actions['idle'].copy(), CROWD_IDLE_MOTION); still.name = 'idle'; still.use_fake_user = True
    for track in arm.animation_data.nla_tracks:
        if track.name == 'idle':
            track.strips[0].action = still
    crowd = os.path.join(out, kid + '-crowd.glb')
    bpy.ops.export_scene.gltf(filepath=crowd, export_format='GLB', export_animation_mode='NLA_TRACKS', export_optimize_animation_size=True,
                              export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
                              export_draco_position_quantization=14, export_draco_normal_quantization=10,
                              export_draco_texcoord_quantization=12, export_draco_generic_quantization=12,
                              export_image_format='JPEG', export_jpeg_quality=85, export_materials='EXPORT', export_yup=True,
                              export_extras=False, export_cameras=False, export_lights=False)
    print('CROWD', kid, os.path.getsize(crowd) // 1024, 'KB', [(m.name, sum(len(p.vertices) - 2 for p in m.data.polygons)) for m in meshes if m.type == 'MESH'])
