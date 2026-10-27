# Builds the eight student characters (players177/kid01.glb ... kid08.glb)
# from the "Mega Bundle Stylized Children Characters" pack: each one's rigged
# T-Pose FBX (mesh and Mixamo skeleton), its base-color texture taken from the
# pack's GLB, and its own Mixamo clips. Every file comes in through the same
# FBX importer, so the clips match the skeleton's rest pose. Clip names are
# what the game picks: idle, walk, walk_backward (Walking played in reverse),
# run (Slow Run, when the character has one) and cheer (a wave or a jump, for
# the character select carousel). Scale keys and every translation key but
# the hips are dropped, and the mesh is Draco-compressed (the game already
# decodes Draco for its other characters). The game stands the T-pose soles
# on the floor; where a character's clips tilt the feet below that (shoe
# edges in a relaxed idle), the whole rig is raised so the lowest point of
# idle, walk and run averages out on the floor.
# Usage: blender -b --factory-startup --python build_kids.py -- <pack folder with GLB/ and ANIMATIONS/> <out folder> [kid01 ...]
import bpy, sys, os, json, struct
import numpy as np

args = sys.argv[sys.argv.index('--') + 1:]
pack, out, only = args[0], args[1], set(args[2:])
ROSTER = [  # id, pack GLB (texture), animation folder, clips
    ('kid01', 'GLB GIRL 1.glb', 'animations GIRL 1', {'idle': 'Standing Idle', 'walk': 'Walking', 'run': 'Slow Run', 'cheer': 'Jump'}),
    ('kid02', 'GLB GIRL 2.glb', 'animations GIRL 2', {'idle': 'Idle', 'walk': 'Walking', 'run': 'Slow Run', 'cheer': 'Jumping'}),
    ('kid03', 'BOY 1.glb', 'boy 1', {'idle': 'Idle', 'walk': 'Walking', 'cheer': 'Waving'}),
    ('kid04', 'boy 2.glb', 'boy 2', {'idle': 'Idle', 'walk': 'Walking', 'run': 'Slow Run', 'cheer': 'Jumping Up'}),
    ('kid05', 'GLB STYLISH GIRL  3.glb', 'ANIMATIONS GIRL 3', {'idle': 'Standing Idle', 'walk': 'Walking', 'cheer': 'Waving'}),
    ('kid06', 'BOY 3.glb', 'boy 3', {'idle': 'Idle', 'walk': 'Walking', 'run': 'Slow Run', 'cheer': 'Jumping Up'}),
    ('kid07', 'boy 4.glb', 'boy 4', {'idle': 'Idle', 'walk': 'Walking', 'run': 'Slow Run', 'cheer': 'Jumping Up'}),
    ('kid08', 'GLB GIRL CHARACETR 4.glb', 'ANIAMTIONS GIRL 4', {'idle': 'Idle', 'walk': 'Walking', 'cheer': 'Waving'}),
]

def glb_basecolor(path, folder):
    raw = open(path, 'rb').read(); l = struct.unpack('<I', raw[12:16])[0]; j = json.loads(raw[20:20 + l]); o = 20 + l
    bl = struct.unpack('<I', raw[o:o + 4])[0]; b = raw[o + 8:o + 8 + bl]
    mat = j['materials'][0]; ti = mat['pbrMetallicRoughness']['baseColorTexture']['index']; im = j['images'][j['textures'][ti]['source']]
    v = j['bufferViews'][im['bufferView']]; data = b[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']]
    ext = '.png' if im.get('mimeType') == 'image/png' else '.jpg'; dst = os.path.join(folder, 'basecolor' + ext)
    open(dst, 'wb').write(data); return dst

def import_fbx(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=path, automatic_bone_orientation=False, ignore_leaf_bones=False)
    new = [o for o in bpy.data.objects if o not in before]
    return next(o for o in new if o.type == 'ARMATURE'), [o for o in new if o.type != 'ARMATURE']

def reverse(action, name):
    copy = action.copy(); copy.name = name
    lo, hi = copy.frame_range
    for fc in copy.fcurves:
        pts = [(hi + lo - k.co.x, k.co.y) for k in fc.keyframe_points]
        for k, (x, y) in zip(fc.keyframe_points, sorted(pts)):
            k.co = (x, y); k.interpolation = 'LINEAR'
        fc.update()
    return copy

def lowest(meshes):
    dg = bpy.context.evaluated_depsgraph_get(); lo = 1e9
    for m in meshes:
        e = m.evaluated_get(dg); me = e.to_mesh(); co = np.empty(len(me.vertices) * 3, np.float32); me.vertices.foreach_get('co', co)
        mw = np.array(e.matrix_world); z = (co.reshape(-1, 3) @ mw[:3, :3].T + mw[:3, 3])[:, 2]; lo = min(lo, float(z.min())); e.to_mesh_clear()
    return lo

def sole_lift(arm, meshes, actions):
    bpy.context.scene.frame_set(0); arm.animation_data.action = None
    for pb in arm.pose.bones:
        pb.location = (0, 0, 0); pb.rotation_quaternion = (1, 0, 0, 0); pb.rotation_euler = (0, 0, 0); pb.scale = (1, 1, 1)
    bind = lowest(meshes); clip = []
    for name in ('idle', 'walk', 'run'):
        act = actions.get(name)
        if not act:
            continue
        arm.animation_data.action = act
        if getattr(act, 'slots', None):
            arm.animation_data.action_slot = act.slots[0]
        lo, hi = map(int, act.frame_range)
        clip.append(min(lowest_at(arm, meshes, f) for f in range(lo, hi + 1, 2)))
    arm.animation_data.action = None
    return bind - sum(clip) / len(clip), bind, clip

def lowest_at(arm, meshes, frame):
    bpy.context.scene.frame_set(frame); return lowest(meshes)

def trim(action):
    for fc in list(action.fcurves):
        hips = '"mixamorig:Hips"' in fc.data_path
        if fc.data_path.endswith('.scale') or (fc.data_path.endswith('.location') and not hips):
            action.fcurves.remove(fc)

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
    actions['walk_backward'] = reverse(actions['walk'], 'walk_backward'); actions['walk_backward'].use_fake_user = True
    arm.animation_data_create(); arm.animation_data.action = None
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
