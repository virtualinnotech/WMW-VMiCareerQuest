# Shared steps for building game characters from Mixamo FBX files in Blender
# (build_kids.py, build_npcs.py): importing, borrowing clips from another rig,
# trimming and calming clips, lifting the soles onto the floor, reshaping a
# body to kid04's proportions, and simplifying meshes.
import bpy, re
import numpy as np
from mathutils import Matrix, Quaternion

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

def chain(arm):   # pose bones, parents first
    out = []
    def visit(b):
        out.append(b); [visit(c) for c in b.children]
    [visit(b) for b in arm.pose.bones if not b.parent]
    return out

def borrow_clip(arm, path, name):
    # Each bone takes the source's world rotation away from its own T-pose;
    # the hips move like the source's, scaled to this kid's hip height.
    src, junk = import_fbx(path)
    for o in junk:
        bpy.data.objects.remove(o, do_unlink=True)
    sact = src.animation_data.action; lo, hi = map(int, sact.frame_range)
    mwS, mwT = src.matrix_world, arm.matrix_world
    floor = lambda a, mw: (mw @ a.data.bones['mixamorig:LeftToeBase'].head_local).z
    hipz = lambda a, mw: (mw @ a.data.bones['mixamorig:Hips'].head_local).z
    ratio = (hipz(arm, mwT) - floor(arm, mwT)) / (hipz(src, mwS) - floor(src, mwS))
    act = bpy.data.actions.new(name); act.use_fake_user = True; arm.animation_data.action = act
    bones, prev = chain(arm), {}
    for f in range(lo, hi + 1):
        bpy.context.scene.frame_set(f); posed = {}
        for b in bones:
            rest = b.bone.matrix_local; parent = b.parent
            base = posed[parent.name] @ (parent.bone.matrix_local.inverted() @ rest) if parent else rest.copy()
            sb = src.pose.bones.get(b.name); rot = Quaternion(); loc = (0, 0, 0)
            if sb:
                delta = (mwS @ sb.matrix).to_quaternion() @ (mwS @ sb.bone.matrix_local).to_quaternion().inverted()
                want = mwT.to_quaternion().inverted() @ (delta @ (mwT @ rest).to_quaternion())
                rot = base.to_quaternion().inverted() @ want
                if b.name in prev and rot.dot(prev[b.name]) < 0:
                    rot.negate()
                prev[b.name] = rot.copy()
                if not parent:
                    move = ((mwS @ sb.matrix).translation - (mwS @ sb.bone.matrix_local).translation) * ratio
                    loc = rest.to_3x3().inverted() @ (mwT.to_3x3().inverted() @ move)
            b.rotation_mode = 'QUATERNION'; b.rotation_quaternion = rot; b.location = loc
            posed[b.name] = base @ Matrix.Translation(loc) @ rot.to_matrix().to_4x4()
            b.keyframe_insert('rotation_quaternion', frame=f)
            if not parent:
                b.keyframe_insert('location', frame=f)
    bpy.data.objects.remove(src, do_unlink=True); arm.animation_data.action = None
    for b in arm.pose.bones:
        b.location = (0, 0, 0); b.rotation_quaternion = (1, 0, 0, 0)
    return act

def face_group(o, arm):
    # Kept detailed when simplifying: the face (head-weighted vertices in front of
    # the head joint, below the brows) and the hands and fingers.
    hd = arm.matrix_world @ arm.data.bones['mixamorig:Head'].head_local; names = {g.index: g.name for g in o.vertex_groups}; ids = []
    zs = [(o.matrix_world @ v.co).z for v in o.data.vertices]; k = (max(zs) - min(zs)) / .98   # sizes below are for a kid about 1 unit tall
    for v in o.data.vertices:
        g = max(v.groups, key=lambda g: g.weight, default=None); n = names.get(g.group, '') if g else ''; p = o.matrix_world @ v.co
        if (n.endswith(':Head') and p.y < hd.y + .01 * k and p.z < hd.z + .16 * k) or 'Hand' in n:
            ids.append(v.index)
    g = o.vertex_groups.new(name='face179'); g.add(ids, 1.0, 'REPLACE'); return g

def twist(actions, bone, degrees):
    q = Quaternion((0, 1, 0), np.radians(degrees))   # about the bone's own axis
    for act in actions.values():
        fcs = sorted((fc for fc in act.fcurves if fc.data_path == 'pose.bones["mixamorig:%s"].rotation_quaternion' % bone), key=lambda fc: fc.array_index)
        if len(fcs) != 4: continue
        for i in range(len(fcs[0].keyframe_points)):
            r = Quaternion([fc.keyframe_points[i].co.y for fc in fcs]) @ q
            for fc, v in zip(fcs, r):
                fc.keyframe_points[i].co.y = v; fc.keyframe_points[i].handle_left.y = v; fc.keyframe_points[i].handle_right.y = v
        for fc in fcs: fc.update()

def decimate(o, triangles, protect):
    tris = sum(len(p.vertices) - 2 for p in o.data.polygons)
    d = o.modifiers.new('Decimate', 'DECIMATE'); d.ratio = min(1.0, triangles / max(1, tris))
    if protect:
        d.vertex_group = 'face179'; d.invert_vertex_group = True; d.vertex_group_factor = protect
    bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_move_to_index(modifier='Decimate', index=0); bpy.ops.object.modifier_apply(modifier='Decimate')

def trim(action):
    for fc in list(action.fcurves):
        hips = '"mixamorig:Hips"' in fc.data_path
        if fc.data_path.endswith('.scale') or (fc.data_path.endswith('.location') and not hips):
            action.fcurves.remove(fc)

# kid04's body, measured from its T-pose (model units): torso is hips to neck,
# arm is shoulder joint to wrist, leg is hip joint to ankle, head is the head
# joint to the top of the hair, hand is wrist to index knuckle, foot is the
# ankle's height, width is shoulder joint to shoulder joint.
# Hand is measured on the mesh: wrist to fingertip along the forearm.
KID04 = {'torso': .2758, 'arm': .2286, 'leg': .3974, 'head': .1789, 'hand': .0898, 'foot': .0748, 'width': .2003}
HAND_SHARE = .6   # how far toward kid04's hand size (1 = all the way)
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

def reshape(arm, meshes, overrides=None):
    m = measure(arm, meshes)
    # Overall size is free (the game sets every kid's height): pick the one
    # that changes torso, arms and legs least, then match kid04 from there.
    size = (m['torso'] / KID04['torso'] * m['arm'] / KID04['arm'] * m['leg'] / KID04['leg']) ** (1 / 3)
    f = {k: min(max((KID04[k] * size / m[k]) ** (HAND_SHARE if k == 'hand' else 1), LIMITS[k][0]), LIMITS[k][1]) for k in KID04}
    f.update(overrides or {})
    if all(abs(v - 1) < .01 for v in f.values()):
        return 1.0, f
    for b in arm.pose.bones:   # start from the T-pose itself
        b.location = (0, 0, 0); b.rotation_quaternion = (1, 0, 0, 0); b.rotation_euler = (0, 0, 0); b.scale = (1, 1, 1)
    pb = lambda n: arm.pose.bones.get('mixamorig:' + n)
    plan = {'Spine': (f['width'], f['torso'], f['width']), 'Spine1': (f['width'], f['torso'], f['width']), 'Spine2': (f['width'], f['torso'], f['width']),
            'Neck': (f.get('neck', 1),) * 3, 'Head': (f['head'],) * 3}   # neck: for faces whose jaw follows the neck bone
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


def scale_hips(actions, ratio):
    # After a reshape, the hips move in proportion to the new hip height.
    for act in actions:
        for fc in act.fcurves:
            if fc.data_path.endswith('.location'):
                for k in fc.keyframe_points:
                    k.co.y *= ratio; k.handle_left.y *= ratio; k.handle_right.y *= ratio

def calm(act, keep):
    # Pull every bone toward the clip's average pose, keeping a share of the
    # motion (breathing, swaying). Rotations and the hips' position are rewritten
    # one key per frame.
    groups = {}
    for fc in act.fcurves:
        m = re.match(r'pose\.bones\["(.+)"\]\.(rotation_quaternion|location)$', fc.data_path)
        if m:
            groups.setdefault((m.group(1), m.group(2)), {})[fc.array_index] = fc
    lo, hi = map(int, act.frame_range); frames = range(lo, hi + 1)
    for (bone, path), fcs in groups.items():
        n = 4 if path == 'rotation_quaternion' else 3
        if len(fcs) != n:
            continue
        vals = [[fcs[i].evaluate(f) for i in range(n)] for f in frames]
        if n == 4:
            qs = [Quaternion(v) for v in vals]
            for q in qs[1:]:
                if q.dot(qs[0]) < 0:
                    q.negate()
            mean = Quaternion(np.mean([list(q) for q in qs], 0)).normalized()
            new = [list(mean.slerp(q, keep)) for q in qs]
        else:
            mean = np.mean(vals, 0); new = [list(mean + (np.array(v) - mean) * keep) for v in vals]
        for i in range(n):
            fc = fcs[i]; fc.keyframe_points.clear(); fc.keyframe_points.add(len(frames))
            for kp, f, v in zip(fc.keyframe_points, frames, new):
                kp.co = (f, v[i]); kp.interpolation = 'LINEAR'
            fc.update()
    return act
