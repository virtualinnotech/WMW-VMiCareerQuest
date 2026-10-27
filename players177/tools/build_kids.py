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
# @lod1 and @lod2).
# Usage: blender -b --factory-startup --python build_kids.py -- <pack folder with GLB/ and ANIMATIONS/> <out folder> [kid01 ...]
import bpy, sys, os, json, struct
from mathutils import Matrix, Quaternion
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rigtools import import_fbx, reverse, sole_lift, borrow_clip, face_group, twist, decimate, trim
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


# kid04's body, measured from its T-pose (model units): torso is hips to neck,
# arm is shoulder joint to wrist, leg is hip joint to ankle, head is the head
# joint to the top of the hair, hand is wrist to index knuckle, foot is the
# ankle's height, width is shoulder joint to shoulder joint.
# Hand is measured on the mesh: wrist to fingertip along the forearm.
KID04 = {'torso': .2758, 'arm': .2286, 'leg': .3974, 'head': .1789, 'hand': .0898, 'foot': .0748, 'width': .2003}
HAND_SHARE = .6   # how far toward kid04's hand size (1 = all the way)
OVERRIDES = {'kid02': {'arm': .80}}   # set by eye
CROWD_LODS = [(None, 0), (15000, 1.0), (5000, 0)]   # triangles (None: the full mesh), face and hand protection
LIMITS = {'torso': (.85, 1.25), 'arm': (.75, 1.15), 'leg': (.85, 1.2), 'head': (.45, 1.1), 'hand': (.6, 1.1), 'foot': (.6, 1.1), 'width': (.72, 1.1)}

def hand_length(arm, meshes):
    mw = arm.matrix_world; wrist = mw @ arm.data.bones['mixamorig:LeftHand'].head_local
    axis = (wrist - mw @ arm.data.bones['mixamorig:LeftForeArm'].head_local).normalized(); best = 0
    for o in meshes:
        names = {g.index: g.name for g in o.vertex_groups}
        for v in o.data.vertices:
            g = max(v.groups, key=lambda g: g.weight, default=None)
            if g and names.get(g.group, '').startswith('mixamorig:LeftHand'):
                best = max(best, (o.matrix_world @ v.co - wrist).dot(axis))
    return best

def measure(arm, meshes):
    mw = arm.matrix_world; P = lambda n: mw @ arm.data.bones['mixamorig:' + n].head_local; d = lambda a, b: (a - b).length
    zs = [(o.matrix_world @ v.co).z for o in meshes for v in o.data.vertices]; lo, hi = min(zs), max(zs)
    return {'torso': d(P('Neck'), P('Hips')), 'arm': d(P('LeftForeArm'), P('LeftArm')) + d(P('LeftHand'), P('LeftForeArm')),
            'leg': d(P('LeftLeg'), P('LeftUpLeg')) + d(P('LeftFoot'), P('LeftLeg')), 'head': hi - P('Head').z,
            'hand': hand_length(arm, meshes), 'foot': P('LeftFoot').z - lo, 'width': d(P('LeftArm'), P('RightArm')), 'hips': P('Hips').z - lo}

def reshape(arm, meshes, kid):
    m = measure(arm, meshes)
    # Overall size is free (the game sets every kid's height): pick the one
    # that changes torso, arms and legs least, then match kid04 from there.
    size = (m['torso'] / KID04['torso'] * m['arm'] / KID04['arm'] * m['leg'] / KID04['leg']) ** (1 / 3)
    f = {k: min(max((KID04[k] * size / m[k]) ** (HAND_SHARE if k == 'hand' else 1), LIMITS[k][0]), LIMITS[k][1]) for k in KID04}
    f.update(OVERRIDES.get(kid, {}))
    if all(abs(v - 1) < .01 for v in f.values()):
        return 1.0, f
    for b in arm.pose.bones:   # start from the T-pose itself
        b.location = (0, 0, 0); b.rotation_quaternion = (1, 0, 0, 0); b.rotation_euler = (0, 0, 0); b.scale = (1, 1, 1)
    pb = lambda n: arm.pose.bones.get('mixamorig:' + n)
    plan = {'Spine': (f['width'], f['torso'], f['width']), 'Spine1': (f['width'], f['torso'], f['width']), 'Spine2': (f['width'], f['torso'], f['width']),
            'Neck': (1, 1, 1), 'Head': (f['head'],) * 3}
    for side in ('Left', 'Right'):
        w = f['width']   # arms and legs slim (or fill out) with the torso
        plan.update({side + 'Shoulder': (1, 1, 1), side + 'Arm': (w, f['arm'], w), side + 'ForeArm': (w, f['arm'], w), side + 'Hand': (f['hand'],) * 3,
                     side + 'UpLeg': (w, f['leg'], w), side + 'Leg': (w, f['leg'], w), side + 'Foot': (f['foot'],) * 3})
    # Scaled bones don't pass their scale on (positions still follow), except
    # fingers, toes and the head's own children, which scale with them.
    for name, sc in plan.items():
        b = pb(name)
        if b:
            b.bone.inherit_scale = 'NONE'; b.scale = sc
    bpy.context.view_layer.update()
    for o in meshes:
        bpy.context.view_layer.objects.active = o
        for md in [md for md in o.modifiers if md.type == 'ARMATURE']:
            bpy.ops.object.modifier_apply(modifier=md.name)
    bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='POSE'); bpy.ops.pose.select_all(action='SELECT')
    bpy.ops.pose.armature_apply(selected=False); bpy.ops.object.mode_set(mode='OBJECT')
    for o in meshes:
        md = o.modifiers.new('Armature', 'ARMATURE'); md.object = arm
    for b in arm.data.bones:
        b.inherit_scale = 'FULL'
    after = measure(arm, meshes)
    return after['hips'] / m['hips'], f


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
    hip_ratio, factors = reshape(arm, [m for m in meshes if m.type == 'MESH'], kid)
    for act in actions.values():   # hips motion follows the new hip height
        for fc in act.fcurves:
            if fc.data_path.endswith('.location'):
                for k in fc.keyframe_points:
                    k.co.y *= hip_ratio; k.handle_left.y *= hip_ratio; k.handle_right.y *= hip_ratio
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
    crowd = os.path.join(out, kid + '-crowd.glb')
    bpy.ops.export_scene.gltf(filepath=crowd, export_format='GLB', export_animation_mode='NLA_TRACKS', export_optimize_animation_size=True,
                              export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
                              export_draco_position_quantization=14, export_draco_normal_quantization=10,
                              export_draco_texcoord_quantization=12, export_draco_generic_quantization=12,
                              export_image_format='JPEG', export_jpeg_quality=85, export_materials='EXPORT', export_yup=True,
                              export_extras=False, export_cameras=False, export_lights=False)
    print('CROWD', kid, os.path.getsize(crowd) // 1024, 'KB', [(m.name, sum(len(p.vertices) - 2 for p in m.data.polygons)) for m in meshes if m.type == 'MESH'])
