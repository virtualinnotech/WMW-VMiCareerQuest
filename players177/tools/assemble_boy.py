# Builds players177/player_boy.glb from the supplied Mixamo exports: the
# T-Pose mesh and skeleton (raised so his soles match the clips), Texture.png
# (re-encoded as a 2048 JPEG) and one clip each from Breathing Idle, Walking,
# Running and Sitting, plus a backward walk made by playing Walking in
# reverse. Clip names are what the game picks: idle, walk, walk_backward
# (matched as "backward"), run, sit.
# Usage (Blender): blender -b --factory-startup --python assemble_boy.py -- <glb dir> <Texture.png> <out.glb> [fall json url]
import sys, json, struct, os, bpy, numpy as np
src, tex, out = sys.argv[sys.argv.index('--') + 1:][:3]
fall_url = (sys.argv[sys.argv.index('--') + 1:] + [None] * 4)[3]

def read(path):
    raw = open(path, 'rb').read(); l = struct.unpack('<I', raw[12:16])[0]; j = json.loads(raw[20:20 + l]); o = 20 + l
    bl = struct.unpack('<I', raw[o:o + 4])[0]; return j, raw[o + 8:o + 8 + bl]

base, bbin = read(os.path.join(src, 'T-Pose.glb'))
outbin = bytearray(); views = []; accs = []
def blob(data, target=None):
    while len(outbin) % 4: outbin.append(0)
    v = dict(buffer=0, byteOffset=len(outbin), byteLength=len(data))
    if target: v['target'] = target
    views.append(v); outbin.extend(data); return len(views) - 1
def raw_acc(j, b, ai):
    a = j['accessors'][ai]; v = j['bufferViews'][a['bufferView']]
    n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}[a['type']]; sz = {5126: 4, 5125: 4, 5123: 2, 5121: 1}[a['componentType']]
    stride = v.get('byteStride', 0) or n * sz; st = v.get('byteOffset', 0) + a.get('byteOffset', 0)
    if stride == n * sz: data = b[st:st + a['count'] * n * sz]
    else: data = b''.join(b[st + i * stride: st + i * stride + n * sz] for i in range(a['count']))
    return a, bytes(data)
def copy_acc(j, b, ai, target=None, data=None):
    a, d = raw_acc(j, b, ai)
    if data is not None: d = data
    new = {k: a[k] for k in ('componentType', 'count', 'type', 'min', 'max', 'normalized') if k in a}
    new['bufferView'] = blob(d, target); accs.append(new); return len(accs) - 1

# The supplied T-pose is centred on the hips (soles near -0.96) while every
# Mixamo clip stands him on 0, which would float him half his height in game
# (the game puts the bind pose soles on the floor). Raise the bind pose (mesh,
# inverse bind matrices, hips rest position) so its soles sit where the clips
# put them: the mesh is skinned through idle, walk and run, and the lift lands
# the average of their lowest points on the bind soles.
def trs(n):
    t = np.array(n.get('translation', [0, 0, 0]), float); x, y, z, w = n.get('rotation', [0, 0, 0, 1]); sc = np.array(n.get('scale', [1, 1, 1]), float)
    R = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
    M = np.eye(4); M[:3, :3] = R * sc; M[:3, 3] = t; return M
def node_world(j, over=None):
    par = {c: i for i, n in enumerate(j['nodes']) for c in n.get('children', [])}; W = {}
    def get(i):
        if i not in W:
            n = dict(j['nodes'][i]); n.update((over or {}).get(i, {})); L = trs(n); W[i] = get(par[i]) @ L if i in par else L
        return W[i]
    return get
def array(j, b, ai):
    a, d = raw_acc(j, b, ai); n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}[a['type']]
    return np.frombuffer(d, {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8}[a['componentType']]).reshape(a['count'], n).astype(float)
names = {n.get('name'): i for i, n in enumerate(base['nodes'])}
prim = base['meshes'][0]['primitives'][0]; skin0 = base['skins'][0]
V0 = array(base, bbin, prim['attributes']['POSITION']); JI = array(base, bbin, prim['attributes']['JOINTS_0']).astype(int); WT = array(base, bbin, prim['attributes']['WEIGHTS_0'])
IBM0 = array(base, bbin, skin0['inverseBindMatrices']).reshape(-1, 4, 4).transpose(0, 2, 1)   # stored column-major
Vh = np.c_[V0, np.ones(len(V0))]
def lowest(fname):
    j, b = read(os.path.join(src, fname)); an = j['animations'][0]; ch = []
    for c in an['channels']:
        if c['target']['path'] in ('translation', 'rotation', 'scale'): ch.append((c['target']['node'], c['target']['path'], array(j, b, an['samplers'][c['sampler']]['output'])))
    frames = max(len(v) for _, _, v in ch); lo = 1e9
    for f in range(0, frames, 2):
        over = {}
        for node, path, v in ch: over.setdefault(node, {})[path] = v[min(f, len(v) - 1)].tolist()
        get = node_world(j, over); row = np.array([(get(n) @ IBM0[k])[1] for k, n in enumerate(skin0['joints'])])
        y = sum(WT[:, c] * np.einsum('vi,vi->v', row[JI[:, c]], Vh) for c in range(4)); lo = min(lo, y.min())
    return lo
g0 = V0[:, 1].min(); soles = {f: lowest(f) for f in ('Breathing Idle.glb', 'Walking.glb', 'Running.glb')}
LIFT = float(np.mean(list(soles.values()))) - g0
print('LIFT', round(LIFT, 4), 'bind soles', round(g0, 4), {k.split('.')[0]: round(v - g0 - LIFT, 4) for k, v in soles.items()})
pa, pdata = raw_acc(base, bbin, prim['attributes']['POSITION']); P = np.frombuffer(pdata, np.float32).reshape(-1, 3).copy(); P[:, 1] += LIFT
attrs = {k: copy_acc(base, bbin, v, 34962, data=P.tobytes() if k == 'POSITION' else None) for k, v in prim['attributes'].items()}
accs[attrs['POSITION']]['min'] = P.min(0).tolist(); accs[attrs['POSITION']]['max'] = P.max(0).tolist()
indices = copy_acc(base, bbin, prim['indices'], 34963)
skin = dict(base['skins'][0]); ia, idata = raw_acc(base, bbin, skin['inverseBindMatrices'])
IBM = np.frombuffer(idata, np.float32).reshape(-1, 4, 4).copy()       # column-major: IBM[k][col][row]
IBM[:, 3, :3] -= LIFT * IBM[:, 1, :3]                                   # IBM @ translate(0, -LIFT, 0)
skin['inverseBindMatrices'] = copy_acc(base, bbin, skin['inverseBindMatrices'], data=IBM.astype(np.float32).tobytes())
hips = names['mixamorig:Hips']; parent = [i for i, n in enumerate(base['nodes']) if hips in n.get('children', [])][0]
Pw = node_world(base)(parent); local = np.linalg.inv(Pw[:3, :3]) @ np.array([0, LIFT, 0])
base['nodes'][hips]['translation'] = (np.array(base['nodes'][hips].get('translation', [0, 0, 0])) + local).tolist()

anims = []
def add_clip(fname, name, reverse=False):
    j, b = read(os.path.join(src, fname)); an = j['animations'][0]; samplers = []
    for s in an['samplers']:
        ia, idata = raw_acc(j, b, s['input']); oa, odata = raw_acc(j, b, s['output'])
        times = np.frombuffer(idata, np.float32).copy(); vals = np.frombuffer(odata, np.float32).copy()
        w = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4}[oa['type']]; vals = vals.reshape(len(times), w)
        if reverse:
            times = times[-1] - times[::-1]; vals = vals[::-1].copy()
        i_acc = copy_acc(j, b, s['input'], data=times.astype(np.float32).tobytes()); accs[i_acc]['min'] = [float(times.min())]; accs[i_acc]['max'] = [float(times.max())]
        o_acc = copy_acc(j, b, s['output'], data=vals.astype(np.float32).tobytes()); accs[o_acc].pop('min', None); accs[o_acc].pop('max', None)
        samplers.append(dict(input=i_acc, output=o_acc, interpolation=s.get('interpolation', 'LINEAR')))
    anims.append(dict(name=name, channels=an['channels'], samplers=samplers))

# Order matters: the game takes the first name matching /walk/ as the forward walk.
add_clip('Breathing Idle.glb', 'idle'); add_clip('Walking.glb', 'walk'); add_clip('Walking.glb', 'walk_backward', reverse=True)
add_clip('Running.glb', 'run'); add_clip('Sitting.glb', 'sit')

img = bpy.data.images.load(tex); sc = bpy.context.scene
sc.render.image_settings.file_format = 'JPEG'; sc.render.image_settings.quality = 90; sc.render.image_settings.color_mode = 'RGB'
tmp = os.path.join(bpy.app.tempdir, 'player_boy_tex.jpg'); img.save_render(tmp, scene=sc); jpg = open(tmp, 'rb').read()
image_view = blob(jpg)

nodes = [dict(n) for n in base['nodes']]
g = dict(asset=dict(version='2.0', generator='MiCareerQuest players177 (Mixamo character)'), scene=0, scenes=base['scenes'], nodes=nodes,
         meshes=[dict(name='Boy', primitives=[dict(attributes=attrs, indices=indices, material=0)])], skins=[skin], animations=anims,
         materials=[dict(name='Boy', pbrMetallicRoughness=dict(baseColorFactor=[1, 1, 1, 1], baseColorTexture=dict(index=0), metallicFactor=0, roughnessFactor=.75), doubleSided=True, extras=dict(characterSurfaceV12='solid'))],
         images=[dict(bufferView=image_view, mimeType='image/jpeg', name='Texture')], textures=[dict(source=0, sampler=0)],
         samplers=[dict(magFilter=9729, minFilter=9987, wrapS=33071, wrapT=33071)], accessors=accs, bufferViews=views,
         extras=dict(player177=dict(id='player_boy', name='Player', **({'falls': fall_url} if fall_url else {}))))
while len(outbin) % 4: outbin.append(0)
g['buffers'] = [dict(byteLength=len(outbin))]
js = json.dumps(g, separators=(',', ':')).encode()
while len(js) % 4: js += b' '
with open(out, 'wb') as f:
    f.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(outbin))); f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
    f.write(struct.pack('<II', len(outbin), 0x004E4942)); f.write(outbin)
print('WROTE', out, os.path.getsize(out), 'texture', len(jpg), 'clips', [(a['name'], len(a['channels'])) for a in anims])
