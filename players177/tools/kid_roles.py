# Role maps for the crowd kids (players177/kidNN-roles.bin.gz: 1024 x 1024
# bytes, top row first, gzip), so every kid in the
# venue crowd can wear their own colours (StudentLooks32 in venue-frame.html).
# For every texel of a kid's texture the map says what it is:
#   1 top/jacket, 2 pants, 3 shoes, 7 hair, 9 skin, 0 left as painted (faces,
#   eyes, lips, inner shirts, caps, laces, soles, badges); +128 = UV gutter.
# The body part comes from the mesh's bone weights (head, arms and torso, legs,
# feet, hands); within each part, skin is found by colour (matched to the
# hands), and the largest remaining colour group is the garment (matched by
# colour, so dark folds belong to it); smaller groups (an inner tee, white
# stripes, soles) keep their painted colour. On the head, the face (eyes,
# brows, lips) keeps its painting; the largest colour group above and around
# it is the hair (or a cap, which then takes the hair colour).
# Usage: blender -b --factory-startup --python kid_roles.py -- <players177 folder> [kid01 ...]
import bpy, sys, os, gzip
import numpy as np

args = sys.argv[sys.argv.index('--') + 1:]
folder, only = args[0], set(args[1:])
SIZE = 1024
REGION = {'head': 0, 'upper': 1, 'leg': 2, 'foot': 3, 'hand': 4}

def region_of(name):
    n = name.split(':')[-1]
    if n.startswith('Head') or 'Eye' in n: return 'head'
    if 'Hand' in n: return 'hand'
    if 'Foot' in n or 'Toe' in n: return 'foot'
    if n.endswith('UpLeg') or n.endswith('Leg'): return 'leg'
    if n == 'Hips': return 'hips'
    return 'upper'

def kmeans(x, k=3, steps=12):
    if len(x) < k: return np.zeros(len(x), int)
    c = x[np.linspace(0, len(x) - 1, k).astype(int)].copy()
    for _ in range(steps):
        lab = np.argmin(((x[:, None, :] - c[None]) ** 2).sum(2), 1)
        for j in range(k):
            if (lab == j).any(): c[j] = x[lab == j].mean(0)
    return lab

for kid in sorted(f[:5] for f in os.listdir(folder) if f.startswith('kid0') and f.endswith('.glb') and '-' not in f):
    if only and kid not in only: continue
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=os.path.join(folder, kid + '.glb'))
    arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
    mesh = max((o for o in bpy.context.scene.objects if o.type == 'MESH' and o.vertex_groups), key=lambda o: len(o.data.vertices))
    me = mesh.data; me.calc_loop_triangles()
    img = next(i for i in bpy.data.images if i.size[0] > 0)
    w, h = img.size; tex = np.array(img.pixels[:], np.float32).reshape(h, w, 4)[:, :, :3]
    if w != SIZE: tex = tex[::h // SIZE, ::w // SIZE]   # 2048 textures: every other texel
    # Region per vertex: the bone group with the most weight; hips split at the hip joint.
    groups = {g.index: region_of(g.name) for g in mesh.vertex_groups}
    hip_z = (arm.matrix_world @ arm.data.bones['mixamorig:Hips'].head_local).z
    neck_z = (arm.matrix_world @ arm.data.bones['mixamorig:Neck'].head_local).z
    co = np.array([(mesh.matrix_world @ v.co).z for v in me.vertices])
    vreg = np.zeros(len(me.vertices), int)
    for v in me.vertices:
        best = {}
        for g in v.groups:
            r = groups.get(g.group, 'upper'); best[r] = best.get(r, 0) + g.weight
        r = max(best, key=best.get) if best else 'upper'
        if r == 'hips': r = 'upper' if co[v.index] > hip_z else 'leg'
        vreg[v.index] = REGION[r]
    # Rasterize every triangle's UVs with its region (Blender pixel rows run bottom-up, like the image).
    uv = np.array([d.uv[:] for d in me.uv_layers.active.data], np.float32)
    region = np.full((SIZE, SIZE), 255, np.uint8); tri = np.full((SIZE, SIZE), -1, np.int32)
    vz = np.array([(mesh.matrix_world @ v.co).z for v in me.vertices]); nrm = mesh.matrix_world.to_3x3()
    tz = np.array([vz[list(t.vertices)].mean() for t in me.loop_triangles]); front = np.array([-(nrm @ t.normal).normalized().y for t in me.loop_triangles])
    for t in me.loop_triangles:
        p = uv[list(t.loops)] * SIZE; r = np.bincount(vreg[list(t.vertices)], minlength=5).argmax()
        x0, y0 = np.floor(p.min(0)).astype(int); x1, y1 = np.ceil(p.max(0)).astype(int)
        x0, y0, x1, y1 = max(x0, 0), max(y0, 0), min(x1, SIZE - 1), min(y1, SIZE - 1)
        if x1 < x0 or y1 < y0: continue
        gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + .5, np.arange(y0, y1 + 1) + .5)
        (ax, ay), (bx, by), (cx, cy) = p; d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
        if abs(d) < 1e-9: continue
        l1 = ((by - cy) * (gx - cx) + (cx - bx) * (gy - cy)) / d; l2 = ((cy - ay) * (gx - cx) + (ax - cx) * (gy - cy)) / d; l3 = 1 - l1 - l2
        inside = (l1 >= -.02) & (l2 >= -.02) & (l3 >= -.02)
        region[y0:y1 + 1, x0:x1 + 1][inside] = r; tri[y0:y1 + 1, x0:x1 + 1][inside] = t.index
    # Skin colour: the hands (bare on every kid), in chromaticity and brightness.
    rgb = tex.reshape(-1, 3); s = rgb.sum(1) + 1e-5; chroma = rgb[:, :2] / s[:, None]; light = s / 3
    flat = region.reshape(-1); hand = (flat == REGION['hand']) & (light > .15) & (light < .95)
    ref_c, ref_l = np.median(chroma[hand], 0), np.median(light[hand])
    skin = (np.hypot(*(chroma - ref_c).T) < .028) & (light > ref_l * .5) & (light < ref_l * 1.45)
    mx, mn = rgb.max(1), rgb.min(1); sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-5), 0)
    hue = np.zeros(len(rgb)); d = np.maximum(mx - mn, 1e-5); r_, g_, b_ = rgb.T
    hue = np.where(mx == r_, ((g_ - b_) / d) % 6, np.where(mx == g_, (b_ - r_) / d + 2, (r_ - g_) / d + 4)) * 60
    roles = np.zeros(len(rgb), np.uint8); tflat = tri.reshape(-1)
    def dominant(idx, darkest=.3):   # the largest colour group, then every texel of its colour (any shade)
        lab = kmeans(np.c_[chroma[idx] * 3, light[idx] * .6], 3); big = idx[lab == np.bincount(lab).argmax()]
        c0, l0 = np.median(chroma[big], 0), np.median(light[big])
        return idx[(np.hypot(*(chroma[idx] - c0).T) < .03) & (light[idx] > l0 * darkest) & (light[idx] < l0 * 1.7)]
    for name, rid in REGION.items():
        m = flat == rid
        if not m.any(): continue
        roles[m & skin] = 9
        if name == 'hand': continue
        rest = np.where(m & ~skin)[0]
        if name == 'head':
            # The face: front-facing head texels from the chin to just above the brows.
            fz = tz[tflat[np.where(m & skin & (front[np.maximum(tflat, 0)] > .3))[0]]]
            if len(fz) > 50:
                z0, z1 = np.percentile(fz, 5), np.percentile(fz, 95); t_ = tflat[rest]
                face = (front[t_] > .2) & (tz[t_] > z0) & (tz[t_] < z0 + .72 * (z1 - z0))
                rest = rest[~face]
        if len(rest) < 50: continue
        got = dominant(rest, .1 if name == 'head' else .3)   # hair strands run very dark
        roles[got] = {'head': 7, 'upper': 1, 'leg': 2, 'foot': 3}[name]
        if name == 'head': hair_c, hair_l = np.median(chroma[got], 0), np.median(light[got])
    # A ponytail or long hair hanging on the back is weighted to the neck and spine.
    if 'hair_c' in dir():
        back = np.where((flat == REGION['upper']) & (roles != 9) & (tz[np.maximum(tflat, 0)] > neck_z - .12) & (tflat >= 0))[0]
        roles[back[(np.hypot(*(chroma[back] - hair_c).T) < .025) & (light[back] > hair_l * .1) & (light[back] < hair_l * 1.6)]] = 7
        del hair_c
    roles = roles.reshape(SIZE, SIZE); covered = region != 255
    # Gutter texels take a neighbour's role (+128) so filtering never pulls in a wrong colour.
    out = np.where(covered, roles, 0).astype(np.uint8); have = covered.copy()
    for _ in range(6):
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            src = np.roll(np.roll(out, dy, 0), dx, 1); ok = np.roll(np.roll(have, dy, 0), dx, 1) & ~have
            out[ok] = (src[ok] & 127) | 128; have |= ok
    # Blender's rows run bottom-up; the game's texture rows run top-down (glTF v).
    with gzip.open(os.path.join(folder, kid + '-roles.bin.gz'), 'wb', 9) as f:
        f.write(np.ascontiguousarray(out[::-1]).tobytes())
    debug = os.environ.get('ROLES_DEBUG')
    if debug:   # the texture with each role tinted, for checking by eye
        tint = {1: (1, .2, .2), 2: (.2, .4, 1), 3: (1, .8, 0), 7: (.6, .2, .9), 9: (.2, .9, .3)}
        dbg = tex.copy() * .35
        for k, c in tint.items(): dbg[(out & 127) == k] = dbg[(out & 127) == k] + np.array(c) * .65
        di = bpy.data.images.new(kid + '-dbg', SIZE, SIZE); di.pixels = np.dstack([np.clip(dbg, 0, 1), np.ones((SIZE, SIZE))]).ravel(); di.filepath_raw = os.path.join(debug, kid + '-roles-debug.png'); di.file_format = 'PNG'; di.save()
    counts = {k: int(((out & 127) == v).sum()) for k, v in {'top': 1, 'pants': 2, 'shoes': 3, 'hair': 7, 'skin': 9, 'kept': 0}.items()}
    print('ROLES', kid, counts, 'skin ref', [round(float(c), 3) for c in ref_c], round(float(ref_l), 3))
