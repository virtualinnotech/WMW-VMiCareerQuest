# Retargets sampled Mixamo clips onto Brad's skeleton (brad.glb) by world-space
# rotation deltas from the shared T-pose, converting Blender (Z up) to glTF
# (Y up). Writes {clips:{name:{fps,frames,bones,rot,hips}}} for the game and
# prints a forward-kinematics check of Brad's head/feet heights.
import sys,json,math,os
sys.path.insert(0,sys.argv[1]);from gltf_math import *
D=sys.argv[1]
TARGET=sys.argv[2] if len(sys.argv)>2 else D+'/brad.glb';OUT=sys.argv[3] if len(sys.argv)>3 else D+'/brad-fall.json'
j,bin=load_glb(TARGET);W,par=node_world(j)
idx={n.get('name'):i for i,n in enumerate(j['nodes'])}
bones=[n for n in (j['nodes'][i]['name'] for i in j['skins'][0]['joints'])]
short=lambda n:n.split(':')[-1]
def wq(i):return mat_to_quat(W[i])   # x,y,z,w
def b2g(q):w,x,y,z=q;return qnorm([x,z,-y,w])   # Blender (w,x,y,z) -> glTF (x,y,z,w), axes (x,z,-y)
arm=par[idx['mixamorig:Hips']];armQ=wq(arm);armS=math.sqrt(sum(W[arm][r][0]**2 for r in range(3)))
restT={b:wq(idx[b]) for b in bones}
hip0=[W[idx['mixamorig:Hips']][r][3] for r in range(3)]
# feet height in the target's bind space (Brad stands on 0; some exports are centred)
GROUND=min(j['accessors'][pr['attributes']['POSITION']]['min'][1] for m in j['meshes'] for pr in m['primitives'] if 'JOINTS_0' in pr['attributes'])
def convert(name,src,first,last):
    d=json.load(open(src));rest=d['rest'];k=(hip0[1]-GROUND)/rest['Hips']['p'][2]
    RS={s:b2g(v['q']) for s,v in rest.items()};PS0=rest['Hips']['p']
    out_rot=[];out_hips=[];prev={}
    for fr in d['frames']:
        if fr['f']<first or fr['f']>last:continue
        G={}
        def world(b):
            if b in G:return G[b]
            s=short(b);GS=b2g(fr['q'][s]);Dq=qmul(GS,qinv(RS[s]));G[b]=qnorm(qmul(Dq,restT[b]));return G[b]
        row=[]
        for b in bones:
            p=par[idx[b]];pq=world(j['nodes'][p]['name']) if j['nodes'][p]['name'] in restT else armQ
            L=qnorm(qmul(qinv(pq),world(b)))
            if b in prev and sum(a*c for a,c in zip(L,prev[b]))<0:L=[-v for v in L]
            prev[b]=L;row+=L
        out_rot.append(row)
        dp=[a-b for a,b in zip(fr['hips'],PS0)];dg=[dp[0]*k,dp[2]*k,-dp[1]*k]
        wp=[hip0[i]+dg[i] for i in range(3)]
        lp=qrot(qinv(armQ),wp);lp=[v/armS for v in lp];out_hips.append(lp)
    return {'fps':d['fps'],'frames':len(out_rot),'bones':bones,'rot':out_rot,'hips':out_hips}
clips={'fall':convert('fall',D+'/fall.json',6,62),'getup':convert('getup',D+'/getting_up.json',1,66)}
# forward-kinematics check on Brad with the retargeted local rotations
def fk(clip,f):
    loc={}
    for bi,b in enumerate(clip['bones']):loc[b]=clip['rot'][f][bi*4:bi*4+4]
    Wf={}
    def get(i):
        if i in Wf:return Wf[i]
        n=j['nodes'][i];nm=n.get('name')
        t=clip['hips'][f] if nm=='mixamorig:Hips' else n.get('translation',[0,0,0])
        L=mat_from_trs(t,loc.get(nm,n.get('rotation',[0,0,0,1])),n.get('scale',[1,1,1]))
        Wf[i]=mmul(get(par[i]),L) if i in par else L;return Wf[i]
    P=lambda nm:[round(get(idx['mixamorig:'+nm])[r][3],2) for r in range(3)]
    return {'hips':P('Hips'),'head':P('Head'),'lfoot':P('LeftFoot'),'rfoot':P('RightFoot'),'lhand':P('LeftHand')}
for name,c in clips.items():
    for f in [0,c['frames']//3,2*c['frames']//3,c['frames']-1]:print(name,f,fk(c,f))
# compact output: 4 decimals
for c in clips.values():
    c['rot']=[[round(v,4) for v in row] for row in c['rot']];c['hips']=[[round(v,2) for v in row] for row in c['hips']]
json.dump({'source':'fall.fbx frames 6-62, Getting Up.fbx frames 1-66 (Mixamo), retargeted to '+os.path.basename(TARGET),'clips':clips},open(OUT,'w'),separators=(',',':'))
print('size',os.path.getsize(OUT))
