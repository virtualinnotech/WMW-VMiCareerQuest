# Builds the extra crowd kids (players177/npc01-crowd.glb ... npc13-crowd.glb)
# from the supplied "NPC's" pack: each character's Mixamo T-pose FBX (mesh and
# skeleton), its own base-colour texture (from its texture files, or from its
# GLB, mesh by mesh for characters with separate hand meshes), and its own idle
# and walk; npc01 has no idle and npc06 no clips at all, so they borrow kid01's
# idle and kid04's idle and walk, retargeted bone by bone (rigtools.borrow_clip).
# npc05's light mesh doesn't fit its texture, so it uses the full model (GLB)
# with its own clips copied over from the light rig. npc04's and npc08's clips
# face about 90 degrees sideways; any clip more than 12 degrees off is turned
# to face forward by rotating its hips (face_front). Some clips also stand the
# character higher than its T-pose (their hips are placed for a rig with its feet
# at 0); each clip's hips are moved so its lowest point meets the T-pose soles,
# which the game stands on the floor (ground). npc06's skeleton faces
# sideways, so every character is first turned to face forward like the rest.
# Like the kids students pick from, each is reshaped to kid04's proportions
# (rigtools.reshape: head, hands, arms, legs, torso) and drawn at the same
# height; its texture is brightened a little (BRIGHTEN) and its idle calmed to a
# third of its motion (rigtools.calm), like the crowd copies of the kids. Like the kids' crowd copies, each file has a 1024 texture,
# idle and walk only, and three meshes: the full mesh close by (reduced to
# 70,000 triangles when larger), and 15,000 and 5,000 triangles for the middle
# and far distances (@lod1, @lod2; face and hands kept detailed in the first).
# Usage: blender -b --factory-startup --python build_npcs.py -- <NPC pack folder> <kids pack folder> <out folder> [npc01 ...]
import bpy, sys, os, json, struct, re, math
from mathutils import Matrix, Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rigtools import import_fbx, lowest, borrow_clip, face_group, decimate, trim, reshape, scale_hips, calm
import numpy as np

args = sys.argv[sys.argv.index('--') + 1:]
pack, kids, out, only = args[0], args[1], args[2], set(args[3:])
KID_IDLE = ('kids', 'ANIMATIONS', 'animations GIRL 1', 'Standing Idle.fbx')
BOY_IDLE, BOY_WALK = ('kids', 'ANIMATIONS', 'boy 2', 'Idle.fbx'), ('kids', 'ANIMATIONS', 'boy 2', 'Walking.fbx')
# id, folder, T-pose FBX, texture (file, or 'glb:<file>' to take each mesh's from the GLB), idle, walk
# (a clip is a path in the folder; ('kids', ...) a path in the kids pack, borrowed; ('own', path) a
# clip in the folder made for another rig of the same character, borrowed)
NPCS = [
    ('npc01', 'stylized-cartoon-girl-character-rigged-and-animated', 'Animations/Animations/Walking.fbx', 'Texture/texture_0.png',
     KID_IDLE, 'Animations/Animations/Walking.fbx'),
    ('npc02', 'stylized-cartoon-boy-3d-character-rigged-with-animations', 'fbx with animations/fbx/T-Pose-rigged.fbx', 'Texture/Texture.png',
     'fbx with animations/fbx/Breathing Idle.fbx', 'fbx with animations/fbx/Walking.fbx'),
    ('npc03', 'cartoon-boy-kid-3d-character-rigged-stylized-child', 'animations/animations/T-Pose (1).fbx', 'Texture/Texture.png',
     'animations/animations/Idle.fbx', 'animations/animations/Walking.fbx'),
    ('npc04', 'cute-stylized-boy-3d-character-rigged-with-animations-cartoon-kid-game-ready', 'Animations/Animations/T-Pose (1).fbx', 'Textures/Textures/Color.jpg',
     'Animations/Animations/Idle.fbx', 'Animations/Animations/Walking.fbx'),
    ('npc05', 'kid-character-stylized-cute-boy-game-ready-rigged-and-animated', 'glb.glb', 'glb:glb.glb',
     ('own', 'Lowpoly/Lowpoly/Breathing Idle.fbx'), ('own', 'Lowpoly/Lowpoly/Walking (1).fbx')),
    ('npc06', 'school-boy-cartoon-character-3d-model-low-poly-rigged', 'fbx.fbx', 'glb:glb.glb', BOY_IDLE, BOY_WALK),
    ('npc07', 'stylized-cartoon-boy-3d-character-rigged-with-animations-7f002155-acd1-4889-b487-110048faf8b3', 'Animations/Animations/T-Pose.fbx', 'textures/textures/Color.jpg',
     'Animations/Animations/Idle.fbx', 'Animations/Animations/Walking.fbx'),
    ('npc08', 'stylized-cartoon-boy-kid-character-3d-model-rigged-and-animated', 'animations/animations/T-Pose.fbx', 'textures/textures/Color.jpg',
     'animations/animations/Breathing Idle.fbx', 'animations/animations/Walking.fbx'),
    ('npc09', 'stylized-cartoon-boy-kid-character-rigged-and-animated', 'animations/animations/T-Pose.fbx', 'glb:glb.glb',
     'animations/animations/Breathing Idle.fbx', 'animations/animations/Walking.fbx'),
    ('npc10', 'stylized-cartoon-girl-character-game-ready', 'animations/animations/T-Pose.fbx', 'texture/texture/texture.JPEG',
     'animations/animations/Idle.fbx', 'animations/animations/Walking.fbx'),
    ('npc11', 'stylized-cartoon-girl-kid-character-rigged-cute-child', 'animations/animations/T-Pose.fbx', 'glb:glb.glb',
     'animations/animations/Standing Idle.fbx', 'animations/animations/Walking.fbx'),
    ('npc12', 'stylized-cute-cartoon-girl-character-rigged-and-animated', 'animations/animations/T-Pose.fbx', 'glb:glb.glb',
     'animations/animations/Breathing Idle.fbx', 'animations/animations/Walking.fbx'),
    ('npc13', 'stylized-kid-cartoon-boy-character-rigged-and-animated', 'animations/animations/T-Pose.fbx', 'texture/texture/texture.JPEG',
     'animations/animations/Breathing Idle.fbx', 'animations/animations/Walking.fbx'),
]
LODS = [(70000, 0), (15000, 1.0), (5000, 0)]   # triangles (the first only caps very heavy meshes), face and hand protection
# (protection is eased off step by step when it keeps a mesh far over its share, or
# leaves the body with too few triangles)
TEXTURE = 1024
IDLE_MOTION = .35          # share of the idle's motion kept (calmer breathing)
BRIGHTEN = (1.15, 1.05)    # mid-tone lift (whites stay white) and saturation of the textures
OVERRIDES = {'npc06': {'head': .62}}   # set by eye: his face squashes when shrunk further

def glb_textures(path):
    # Each mesh node's base-colour image in a GLB: {mesh name: (bytes, extension)}.
    raw = open(path, 'rb').read(); l = struct.unpack('<I', raw[12:16])[0]; j = json.loads(raw[20:20 + l]); o = 20 + l
    bl = struct.unpack('<I', raw[o:o + 4])[0]; b = raw[o + 8:o + 8 + bl]; out = {}
    for n in j['nodes']:
        if 'mesh' not in n: continue
        pr = j['meshes'][n['mesh']]['primitives'][0]
        if pr.get('material') is None: continue
        t = j['materials'][pr['material']].get('pbrMetallicRoughness', {}).get('baseColorTexture')
        if not t: continue
        im = j['images'][j['textures'][t['index']]['source']]; v = j['bufferViews'][im['bufferView']]
        out[n.get('name') or j['meshes'][n['mesh']].get('name', '')] = (b[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']], '.png' if im.get('mimeType') == 'image/png' else '.jpg')
    return out

def key(name):
    return re.sub(r'[^a-z]', '', re.sub(r'\.\d+$', '', name.lower()))

def material(name, path):
    img = bpy.data.images.load(path); img.scale(TEXTURE, TEXTURE)
    px = np.array(img.pixels[:], np.float32).reshape(-1, 4); rgb = 1 - (1 - np.clip(px[:, :3], 0, 1)) ** BRIGHTEN[0]
    luma = rgb @ np.array([.2126, .7152, .0722], np.float32); px[:, :3] = np.clip(luma[:, None] + (rgb - luma[:, None]) * BRIGHTEN[1], 0, 1)
    img.pixels = px.ravel(); img.update()
    mat = bpy.data.materials.new(name); mat.use_nodes = True; bsdf = mat.node_tree.nodes['Principled BSDF']
    tex = mat.node_tree.nodes.new('ShaderNodeTexImage'); tex.image = img
    mat.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = .75; bsdf.inputs['Metallic'].default_value = 0
    return mat

def facing(arm):
    # Degrees the chest is turned from the front (-Y), from the shoulder joints.
    bpy.context.view_layer.update(); p = lambda n: arm.matrix_world @ arm.pose.bones['mixamorig:' + n].head
    v = (p('LeftArm') - p('RightArm')).cross(Vector((0, 0, 1))); return math.degrees(math.atan2(-v.x, -v.y))

def face_front(arm, act):
    # Turn a clip that faces sideways: the hips rotate about the vertical through
    # their rest position; every other bone follows.
    arm.animation_data.action = act
    if getattr(act, 'slots', None):
        arm.animation_data.action_slot = act.slots[0]
    lo, hi = map(int, act.frame_range); angles = []
    for f in range(lo, hi + 1, max(1, (hi - lo) // 8)):
        bpy.context.scene.frame_set(f); angles.append(facing(arm))
    turn = sum(angles) / len(angles)
    if abs(turn) > 12:
        pb = arm.pose.bones['mixamorig:Hips']; base = arm.matrix_world @ pb.bone.matrix_local; pivot = base.translation.copy()
        spin = Matrix.Translation(pivot) @ Matrix.Rotation(math.radians(turn), 4, 'Z')   # same sign: the angle grows clockwise @ Matrix.Translation(-pivot)
        frames = {}
        for f in range(lo, hi + 1):
            bpy.context.scene.frame_set(f)
            m = base.inverted() @ spin @ base @ Matrix.Translation(pb.location) @ pb.rotation_quaternion.to_matrix().to_4x4()
            frames[f] = (m.translation.copy(), m.to_quaternion())
        for fc in [fc for fc in act.fcurves if fc.data_path.startswith('pose.bones["mixamorig:Hips"].') and (fc.data_path.endswith('location') or fc.data_path.endswith('rotation_quaternion'))]:
            act.fcurves.remove(fc)
        prev = None
        for f, (loc, rot) in frames.items():
            if prev is not None and rot.dot(prev) < 0:
                rot.negate()
            prev = rot; pb.location = loc; pb.rotation_quaternion = rot
            pb.keyframe_insert('location', frame=f); pb.keyframe_insert('rotation_quaternion', frame=f)
        print('FACED', act.name, 'turned', round(turn), 'degrees to face front')
    arm.animation_data.action = None
    for b in arm.pose.bones:
        b.location = (0, 0, 0); b.rotation_quaternion = (1, 0, 0, 0)

def ground(arm, meshes, act):
    # Move a clip's hips up or down so the clip's lowest point meets the T-pose soles.
    arm.animation_data.action = None
    for b in arm.pose.bones:
        b.location = (0, 0, 0); b.rotation_quaternion = (1, 0, 0, 0)
    bpy.context.scene.frame_set(0); bind = lowest(meshes)
    arm.animation_data.action = act
    if getattr(act, 'slots', None):
        arm.animation_data.action_slot = act.slots[0]
    lo, hi = map(int, act.frame_range); low = 1e9
    for f in range(lo, hi + 1, 2):
        bpy.context.scene.frame_set(f); low = min(low, lowest(meshes))
    height = max((arm.matrix_world @ b.tail_local).z for b in arm.data.bones) - bind; d = low - bind
    if abs(d) > .01 * height:
        pb = arm.pose.bones['mixamorig:Hips']; shift = (arm.matrix_world @ pb.bone.matrix_local).to_3x3().inverted() @ Vector((0, 0, -d))
        for i in range(3):
            fc = act.fcurves.find('pose.bones["mixamorig:Hips"].location', index=i)
            if fc is None:
                fc = act.fcurves.new('pose.bones["mixamorig:Hips"].location', index=i, action_group='mixamorig:Hips'); fc.keyframe_points.insert(lo, 0)
            for k in fc.keyframe_points:
                k.co.y += shift[i]; k.handle_left.y += shift[i]; k.handle_right.y += shift[i]
            fc.update()
        print('GROUNDED', act.name, 'moved', round(-d, 3), 'of', round(height, 2))
    arm.animation_data.action = None
    for b in arm.pose.bones:
        b.location = (0, 0, 0); b.rotation_quaternion = (1, 0, 0, 0)

def clip(arm, folder, spec, name):
    if isinstance(spec, tuple):   # borrowed: from a kid in the kids pack, or from this character's other rig
        act = borrow_clip(arm, os.path.join(kids, *spec[1:]) if spec[0] == 'kids' else os.path.join(folder, spec[1]), name)
    else:
        a2, junk = import_fbx(os.path.join(folder, spec)); act = a2.animation_data.action; act.name = name
        for o in [a2] + junk:
            bpy.data.objects.remove(o, do_unlink=True)
    act.use_fake_user = True; trim(act); return act

for npc, sub, tpose, texture, idle, walk in NPCS:
    if only and npc not in only:
        continue
    bpy.ops.wm.read_factory_settings(use_empty=True)
    folder = os.path.join(pack, sub)
    if tpose.endswith('.glb'):
        before = set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=os.path.join(folder, tpose))
        new = [o for o in bpy.data.objects if o not in before]; arm = next(o for o in new if o.type == 'ARMATURE'); objs = [o for o in new if o is not arm]
    else:
        arm, objs = import_fbx(os.path.join(folder, tpose))
    meshes = [o for o in objs if o.type == 'MESH' and any(m.type == 'ARMATURE' for m in o.modifiers)]
    for o in objs:
        if o not in meshes:
            bpy.data.objects.remove(o, do_unlink=True)
    if arm.animation_data:
        arm.animation_data.action = None
        for t in list(arm.animation_data.nla_tracks):
            arm.animation_data.nla_tracks.remove(t)
    # Face forward like every other character (toward -Y here, the glTF front):
    # the feet point the way the character faces.
    bone = lambda n: arm.matrix_world @ arm.data.bones['mixamorig:' + n].head_local
    ahead = sum(((bone(s + 'ToeBase') - bone(s + 'Foot')) for s in ('Left', 'Right')), Vector()); turn = math.atan2(-ahead.x, -ahead.y)
    if abs(turn) > math.radians(10):
        arm.rotation_mode = 'XYZ'; arm.matrix_world = Matrix.Rotation(turn, 4, 'Z') @ arm.matrix_world; bpy.context.view_layer.update()
        print('TURNED', npc, round(math.degrees(turn)), 'degrees to face forward')
    # Textures: one file for every mesh, or each mesh's own from the GLB.
    if texture.startswith('glb:'):
        found = glb_textures(os.path.join(folder, texture[4:])); by_key = {key(k): v for k, v in found.items()}
        for i, o in enumerate(meshes):
            data, ext = by_key.get(key(o.name)) or (list(found.values())[0] if len(found) == 1 else max(found.values(), key=lambda v: len(v[0])))
            p = os.path.join(bpy.app.tempdir, '%s-%d%s' % (npc, i, ext)); open(p, 'wb').write(data)
            o.data.materials.clear(); o.data.materials.append(material('%s-%d' % (npc, i), p))
    else:
        mat = material(npc, os.path.join(folder, texture))
        for o in meshes:
            o.data.materials.clear(); o.data.materials.append(mat)
    for a in list(bpy.data.actions):
        bpy.data.actions.remove(a)
    arm.animation_data_create(); arm.animation_data.action = None
    actions = {'idle': clip(arm, folder, idle, 'idle'), 'walk': clip(arm, folder, walk, 'walk')}
    for act in actions.values():
        face_front(arm, act)
    ratio, shape = reshape(arm, meshes, OVERRIDES.get(npc)); scale_hips(actions.values(), ratio)
    print('SHAPE', npc, {k: round(v, 2) for k, v in shape.items()})
    calm(actions['idle'], IDLE_MOTION)
    for act in actions.values():
        ground(arm, meshes, act)
    for name in ('idle', 'walk'):
        track = arm.animation_data.nla_tracks.new(); track.name = name
        track.strips.new(name, int(actions[name].frame_range[0]), actions[name])
    # Close, middle and far meshes, each mesh's share of the triangles by its size.
    total = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in meshes); levels = []
    for o in list(meshes):
        face_group(o, arm); tris = sum(len(p.vertices) - 2 for p in o.data.polygons); copies = [o]
        for level in (1, 2):
            c = o.copy(); c.data = o.data.copy(); c.name = o.name + '@lod%d' % level; bpy.context.scene.collection.objects.link(c); copies.append(c)
        for level, c in enumerate(copies):
            target, protect = LODS[level]; share = max(200, round(target * tris / total))
            if total > target:
                source = c.data.copy()
                for factor in (protect, protect / 3, protect / 10, 0):
                    decimate(c, share, factor)
                    gi = c.vertex_groups['face179'].index; kept = sum(len(p.vertices) - 2 for p in c.data.polygons)
                    body = sum(len(p.vertices) - 2 for p in c.data.polygons if not any(g.group == gi and g.weight > 0 for v in p.vertices for g in c.data.vertices[v].groups))
                    if (kept <= share * 1.15 and body >= kept * .45) or not factor:
                        break
                    c.data = source.copy()   # too many kept: start again with less protection
                bpy.data.meshes.remove(source)
            c.vertex_groups.remove(c.vertex_groups['face179'])
        levels += copies
    for m in list(bpy.data.meshes):
        if m.users == 0:
            bpy.data.meshes.remove(m)
    dst = os.path.join(out, npc + '-crowd.glb')
    bpy.ops.export_scene.gltf(filepath=dst, export_format='GLB', export_animation_mode='NLA_TRACKS', export_optimize_animation_size=True,
                              export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
                              export_draco_position_quantization=14, export_draco_normal_quantization=10,
                              export_draco_texcoord_quantization=12, export_draco_generic_quantization=12,
                              export_image_format='JPEG', export_jpeg_quality=85, export_materials='EXPORT', export_yup=True,
                              export_extras=False, export_cameras=False, export_lights=False)
    print('NPC', npc, os.path.getsize(dst) // 1024, 'KB', [(m.name[-12:], sum(len(p.vertices) - 2 for p in m.data.polygons)) for m in levels])
