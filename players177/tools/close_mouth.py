# Closes a character's open, painted mouth (the schoolboy NPC, npc06), so he
# smiles with his mouth closed:
#  - the mouth is found by colour (dark inside, white teeth, red tongue) on the
#    front of the face, below the nose; its outline in the face plane
#    (side-to-side, up-down) is kept, with the lips around it;
#  - the face surface over the mouth becomes a smooth membrane held by the face
#    around it (the inside of the mouth is pulled onto it too, and every moved
#    vertex takes bone weights blended from the face), so the opening and the
#    lips are gone;
#  - every texel over the mouth is repainted with the skin around it (blended by
#    distance, so shading and blush carry on), and a thin smile line is drawn
#    where the lips met (along the middle of the opening); the edges feather out.
# Texels are found in 3D (each texel's position on the face), so a texture cut
# into many small pieces works too.
import bpy, bmesh
import numpy as np
from mathutils import Vector

LUMA = np.array([.2126, .7152, .0722])

def _mouthy(rgb):
    l = rgb @ LUMA; mx, mn = rgb.max(1), rgb.min(1); sat = (mx - mn) / np.maximum(mx, 1e-4)
    return (l < .16) | ((l > .62) & (sat < .2)) | ((rgb[:, 0] > rgb[:, 1] * 1.5) & (l < .32))

def close_mouth(arm, mesh, img, report=print):
    mw = arm.matrix_world; bone = lambda n: np.array(mw @ arm.data.bones['mixamorig:' + n].head_local)
    M = np.array(mesh.matrix_world); co = np.array([v.co[:] for v in mesh.data.vertices]) @ M[:3, :3].T + M[:3, 3]
    head = bone('Head'); hh = co[:, 2].max() - head[2]
    ahead = sum(bone(s + 'ToeBase') - bone(s + 'Foot') for s in ('Left', 'Right')); ahead[2] = 0; ahead /= np.linalg.norm(ahead); side = np.cross(ahead, [0, 0, 1])
    rel = co - head; fwd, lat, up = rel @ ahead, rel @ side, rel[:, 2]
    face = (up > -.04 * hh) & (up < .22 * hh) & (np.abs(lat) < .25 * hh); face &= fwd > np.percentile(fwd[face], 75)
    w, h = img.size; px = np.array(img.pixels[:], np.float32).reshape(h, w, 4)
    me = mesh.data; uvl = me.uv_layers.active.data; vuv = np.zeros((len(me.vertices), 2))
    for l in me.loops:
        vuv[l.vertex_index] = uvl[l.index].uv
    x = np.clip((vuv[:, 0] * w).astype(int), 0, w - 1); y = np.clip((vuv[:, 1] * h).astype(int), 0, h - 1)
    mouth = face & _mouthy(px[y, x, :3])
    if mouth.sum() > 20:   # the main patch only
        c = np.median(co[mouth], 0); d = np.linalg.norm(co - c, axis=1); mouth &= d < np.percentile(d[mouth], 90) * 1.4
    idx = np.where(mouth)[0]
    if len(idx) < 10:
        report('no open mouth found'); return False
    # The opening's outline: for each side-to-side slice, its bottom and top (smoothed), plus a margin for the lips.
    bins = np.linspace(lat[idx].min(), lat[idx].max(), 13); centers = (bins[:-1] + bins[1:]) / 2; lo, hi = [], []
    for a, b in zip(bins[:-1], bins[1:]):
        s = idx[(lat[idx] >= a) & (lat[idx] <= b)]
        lo.append(up[s].min() if len(s) else np.nan); hi.append(up[s].max() if len(s) else np.nan)
    lo, hi = np.array(lo), np.array(hi); ok = ~np.isnan(lo)
    lo = np.interp(centers, centers[ok], lo[ok]); hi = np.interp(centers, centers[ok], hi[ok])
    k = np.array([1, 2, 3, 2, 1]) / 9; lo = np.convolve(np.pad(lo, 2, 'edge'), k, 'valid'); hi = np.convolve(np.pad(hi, 2, 'edge'), k, 'valid')
    margin = .025 * hh; l0, l1 = lat[idx].min() - margin, lat[idx].max() + margin
    below = 1.4 * margin   # a little more room under the opening for the lower lip
    def depth(la, u):   # how far inside the mouth area (negative outside)
        return np.minimum.reduce([u - (np.interp(la, centers, lo) - below), np.interp(la, centers, hi) + margin - u, la - l0, l1 - la])
    def inside(la, u, grow=0.):
        return depth(la, u) > -grow
    feather = .035 * hh
    soft = lambda d: np.clip((d + feather) / feather, 0, 1) ** 2 * (3 - 2 * np.clip((d + feather) / feather, 0, 1))   # 0 outside the feather, 1 inside
    region = face | (np.abs(lat) < .3 * hh) & (up > -.1 * hh) & (up < .3 * hh) & (fwd > np.percentile(fwd, 50))
    over = region & inside(lat, up, feather)
    # The inside of the mouth (teeth, tongue, the mouth's inner surface) is behind the
    # face: it is pulled onto the new surface too, so nothing pokes through.
    over |= inside(lat, up, feather) & (fwd > 0) & (np.abs(lat) < .3 * hh) & (up > -.15 * hh) & (up < .3 * hh)
    # Rebuild the surface as a smooth membrane: each vertex over the mouth settles at
    # the average of its neighbours, with the face around it held still.
    ed = np.array([e.vertices[:] for e in me.edges]); ed = ed[over[ed[:, 0]] | over[ed[:, 1]]]
    oi = np.where(over)[0]; deg = np.zeros(len(co)); np.add.at(deg, ed.ravel(), 1)
    pos = co.copy()
    for _ in range(2500):
        acc = np.zeros_like(pos); np.add.at(acc, ed[:, 0], pos[ed[:, 1]]); np.add.at(acc, ed[:, 1], pos[ed[:, 0]])
        pos[oi] = acc[oi] / np.maximum(deg[oi], 1)[:, None]
    pos = pos[oi]
    wgt = soft(depth(lat[over], up[over]))[:, None]; new = co[over] * (1 - wgt) + pos * wgt   # blends into the face at the edge
    inv = np.linalg.inv(M); local = new @ inv[:3, :3].T + inv[:3, 3]
    for i, p in zip(np.where(over)[0], local):
        me.vertices[i].co = p
    me.update()
    # The moved vertices (the inside of the mouth among them) take bone weights blended
    # from the face around them, so the face bends as one smooth surface.
    sub = np.unique(ed.ravel()); col = {i: k for k, i in enumerate(sub)}; groups = sorted({g.group for i in sub for g in me.vertices[i].groups})
    gcol = {g: k for k, g in enumerate(groups)}; Wt = np.zeros((len(sub), len(groups)))
    for i in sub:
        for g in me.vertices[i].groups:
            Wt[col[i], gcol[g.group]] = g.weight
    e2 = np.array([[col[a], col[b]] for a, b in ed]); free = np.array([col[i] for i in oi]); dg = np.zeros(len(sub)); np.add.at(dg, e2.ravel(), 1)
    for _ in range(1500):
        acc = np.zeros_like(Wt); np.add.at(acc, e2[:, 0], Wt[e2[:, 1]]); np.add.at(acc, e2[:, 1], Wt[e2[:, 0]])
        Wt[free] = acc[free] / np.maximum(dg[free], 1)[:, None]
    vg = {g.index: g for g in mesh.vertex_groups}
    for i in oi:
        row = Wt[col[i]]; top = np.argsort(row)[::-1][:4]; tot = row[top].sum() or 1
        for g in list(me.vertices[i].groups):
            vg[g.group].remove([int(i)])
        for k in top:
            if row[k] > 1e-4:
                vg[groups[k]].add([int(i)], float(row[k] / tot), 'REPLACE')
    report('mouth vertices', len(idx), 'surface rebuilt over', int(over.sum()))
    # Repaint, texel by texel in 3D: skin over the mouth, a thin line where the lips meet.
    co2 = np.array([v.co[:] for v in me.vertices]) @ M[:3, :3].T + M[:3, 3]; rel2 = co2 - head
    LAT, UP = rel2 @ side, rel2[:, 2]
    me.calc_loop_triangles(); uv = np.array([d.uv[:] for d in me.uv_layers.active.data])
    near = over | (region & inside(lat, up, feather + .09 * hh))   # the moved inside of the mouth too
    paint, skin_px = [], []
    for t in me.loop_triangles:
        vs = list(t.vertices)
        if not any(near[v] for v in vs):
            continue
        p = uv[list(t.loops)] * [w, h]; x0, y0 = np.floor(p.min(0)).astype(int); x1, y1 = np.ceil(p.max(0)).astype(int)
        x0, y0, x1, y1 = max(x0, 0), max(y0, 0), min(x1, w - 1), min(y1, h - 1)
        if x1 < x0 or y1 < y0: continue
        gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + .5, np.arange(y0, y1 + 1) + .5)
        (ax, ay), (bx, by), (cx, cy) = p; dd = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
        if abs(dd) < 1e-9: continue
        a1 = ((by - cy) * (gx - cx) + (cx - bx) * (gy - cy)) / dd; a2 = ((cy - ay) * (gx - cx) + (ax - cx) * (gy - cy)) / dd; a3 = 1 - a1 - a2
        m = (a1 >= -.15) & (a2 >= -.15) & (a3 >= -.15)   # reaches into the texture's seams too, so nothing old bleeds in
        if not m.any(): continue
        la = a1[m] * LAT[vs[0]] + a2[m] * LAT[vs[1]] + a3[m] * LAT[vs[2]]; u = a1[m] * UP[vs[0]] + a2[m] * UP[vs[1]] + a3[m] * UP[vs[2]]
        yy = np.broadcast_to(np.arange(y0, y1 + 1)[:, None], gx.shape)[m]; xx = np.broadcast_to(np.arange(x0, x1 + 1)[None, :], gx.shape)[m]
        ins = inside(la, u, feather); ring = inside(la, u, feather + .04 * hh) & ~ins
        paint.append((yy[ins], xx[ins], la[ins], u[ins])); skin_px.append(np.c_[la[ring], u[ring], px[yy[ring], xx[ring], :3]])
    ring = np.concatenate(skin_px); ring = ring[~_mouthy(ring[:, 2:])]
    ring = ring[np.random.default_rng(1).permutation(len(ring))[:4000]]
    def skin_at(la, u):   # the surrounding skin, blended by distance (keeps shading and blush)
        out = np.zeros((len(la), 3))
        for s in range(0, len(la), 2000):
            d = np.hypot(la[s:s + 2000, None] - ring[None, :, 0], u[s:s + 2000, None] - ring[None, :, 1]) + 1e-4
            wt = 1 / d ** 3; out[s:s + 2000] = wt @ ring[:, 2:] / wt.sum(1, keepdims=True)
        return out
    half = .0035 * hh; n = 0; skin = np.median(ring[:, 2:], 0); cl, hw = (l0 + l1) / 2, (l1 - l0) / 2
    for yy, xx, la, u in paint:
        if not len(la): continue
        local = skin_at(la, u); line = local * np.array([.58, .44, .42])   # a darker, warmer line
        mid = (np.interp(la, centers, lo) + np.interp(la, centers, hi)) / 2 + .025 * hh * ((la - cl) / hw) ** 2   # a smile: corners turn up
        edge = np.clip((np.abs(la - (l0 + l1) / 2) - (l1 - l0) / 2 * .62) / ((l1 - l0) / 2 * .3), 0, 1)   # fade the line out before the corners
        a = (np.clip(1 - (np.abs(u - mid) - half) / half, 0, 1) * (1 - edge))[:, None]
        orig = px[yy, xx, :3]; wgt = soft(depth(la, u))[:, None]
        wgt = np.maximum(wgt, _mouthy(orig)[:, None].astype(np.float32))   # the opening itself is always covered
        px[yy, xx, :3] = orig * (1 - wgt) + (local * (1 - a) + line * a) * wgt; n += len(yy)
    # The texture is cut into small pieces; the margins between them (texels no
    # triangle uses) still hold the old mouth colours, which bleed in when the
    # texture is filtered. Spread the new paint into such margin texels next to it.
    done = np.zeros((h, w), bool)
    for yy, xx, la, u in paint:
        done[yy, xx] = True
    ys, xs = np.where(done); y0, y1, x0, x1 = max(ys.min() - 8, 0), min(ys.max() + 9, h), max(xs.min() - 8, 0), min(xs.max() + 9, w)
    used = np.zeros((y1 - y0, x1 - x0), bool)
    for t in me.loop_triangles:
        p = uv[list(t.loops)] * [w, h]; a0, b0 = np.floor(p.min(0)).astype(int); a1_, b1 = np.ceil(p.max(0)).astype(int)
        a0, b0, a1_, b1 = max(a0, x0), max(b0, y0), min(a1_, x1 - 1), min(b1, y1 - 1)
        if a1_ < a0 or b1 < b0: continue
        gx, gy = np.meshgrid(np.arange(a0, a1_ + 1) + .5, np.arange(b0, b1 + 1) + .5)
        (ax, ay), (bx, by), (cx, cy) = p; dd = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
        if abs(dd) < 1e-9: continue
        c1 = ((by - cy) * (gx - cx) + (cx - bx) * (gy - cy)) / dd; c2 = ((cy - ay) * (gx - cx) + (ax - cx) * (gy - cy)) / dd
        used[b0 - y0:b1 - y0 + 1, a0 - x0:a1_ - x0 + 1] |= (c1 >= 0) & (c2 >= 0) & (1 - c1 - c2 >= 0)
    sub, mk = px[y0:y1, x0:x1, :3], done[y0:y1, x0:x1]
    for _ in range(6):
        grow = np.zeros_like(mk); acc = np.zeros_like(sub); cnt = np.zeros(mk.shape)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
            m2 = np.roll(np.roll(mk, dy, 0), dx, 1); acc += np.roll(np.roll(sub, dy, 0), dx, 1) * m2[..., None]; cnt += m2
        cand = ~mk & ~used & (cnt > 0)
        sub[cand] = acc[cand] / cnt[cand][:, None]; mk |= cand
        if not cand.any(): break
    img.pixels = px.ravel(); img.update()
    report('repainted texels', n, 'skin', np.round(skin, 3).tolist())
    # The inside of the mouth now lies on the new surface too: drop its faces that
    # face backward and merge the layers, so one clean surface is left (overlapping
    # layers flicker, and tangle when the mesh is simplified).
    bm = bmesh.new(); bm.from_mesh(me); bm.verts.ensure_lookup_table()
    oset = set(np.where(over)[0].tolist()); Mr = mesh.matrix_world.to_3x3(); front = Vector(ahead)
    dead = [f for f in bm.faces if all(v.index in oset for v in f.verts) and (Mr @ f.normal).normalized().dot(front) < .15]
    keep = [bm.verts[i] for i in oset]
    bmesh.ops.delete(bm, geom=dead, context='FACES_ONLY')
    scale = float(np.mean(list(mesh.matrix_world.to_scale())))
    bmesh.ops.remove_doubles(bm, verts=[v for v in keep if v.is_valid], dist=.004 * hh / scale)
    bm.verts.index_update(); seen, dup = set(), []
    for f in bm.faces:
        key = tuple(sorted(v.index for v in f.verts))
        if key in seen:
            dup.append(f)
        seen.add(key)
    bmesh.ops.delete(bm, geom=dup, context='FACES_ONLY')
    bmesh.ops.dissolve_degenerate(bm, edges=bm.edges[:], dist=1e-6)
    loose = [v for v in bm.verts if not v.link_faces]; bmesh.ops.delete(bm, geom=loose, context='VERTS')
    bm.to_mesh(me); bm.free(); me.update()
    report('inner faces removed', len(dead), 'duplicates', len(dup))
    return True
