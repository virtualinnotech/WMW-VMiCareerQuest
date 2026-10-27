/* Construction forklift. Uses the venue's GLB, matrix, renderer and navigation APIs. */
const Forklift34 = (() => {
  'use strict';
  const SCALE = .48, NAV = ManufacturingDogNav20;
  const f = {status: 'waiting', mounted: false, x: 0, z: 0, yaw: 0, speed: 0,
    lift: 0, distance: 0, steer: 0, carrying: false, delivered: false, seconds: 0,
    bumps: 0, bumpTime: 0, model: null, grid: null, saved: null, error: null,
    area: null, points: 0, beaconTime: 0};
  const controls = new Set(), parts = [], textures = [], nodes = [], worlds = [];
  let json, parents, order, pallet, destination, origin, panel, prompt, cube, beacon, loading, groundPaint;
  const displacedStaff=new Map();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const angle = a => Math.atan2(Math.sin(a), Math.cos(a));
  const floor = () => floorHeightAt(f.x, f.z);
  const local = (x, z, yaw = f.yaw) => [x * Math.cos(yaw) + z * Math.sin(yaw), -x * Math.sin(yaw) + z * Math.cos(yaw)];
  const socket = () => {const p = local(0, 1.35 * SCALE); return [f.x + p[0], f.z + p[1]];};
  const near = () => f.status === 'ready' && !state.overview && Math.hypot(player.position[0]-f.x, player.position[2]-f.z)<1.15 && Math.abs(player.position[1]-floor())<1;
  const editing = () => ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
  const blockedUI = () => editing() || window.CharacterInspector?.active || window.HubGuide?.snapshot().dialogOpen || state.paused ||
    document.body.classList.contains('tour-running') || ['controlsPopup','missionListOverlay'].some(id=>$(id)&&!$(id).classList.contains('hidden'));

  function insideArea(x,z,padding=0) {
    const b=f.area;return !!b&&x>b[0]-padding&&x<b[2]+padding&&z>b[1]-padding&&z<b[3]+padding;
  }
  function crowdObstacles() {
    if(!f.mounted||!f.area)return [];
    const [x,z,xx,zz]=f.area,p=.5;
    return [[[x-p,z-p],[xx+p,z-p],[xx+p,zz+p],[x-p,zz+p]]];
  }
  function clearPracticeArea() {
    if(!f.mounted)return;
    const sim=crowdState.sim,g=sim?.grid||HubGuide.grid();
    if(!g?.valid)return;
    let safe;
    function outside(x,z) {
      // Only search when someone actually enters the reserved area.
      if(!safe)safe=Array.from(g.valid,id=>CrowdCore.point(g,id)).filter(p=>!insideArea(...p,.6));
      let best=null,distance=Infinity;
      for(const p of safe){const d=(p[0]-x)**2+(p[1]-z)**2;if(d<distance){best=p;distance=d;}}
      return best;
    }
    for(const group of sim?.groups||[])if(group.members.some(a=>insideArea(a.x,a.z,.45))){
      for(const a of group.members){a.groupId=null;a.localGoal=null;a.holdMode=null;a.groupArrived=false;a.target=null;}
      group.expires=-1;
    }
    if(sim?.groups)sim.groups=sim.groups.filter(group=>group.expires>=0);
    for(const a of sim?.agents||[]){
      if(!insideArea(a.x,a.z,.45)&&!insideArea(a.renderX??a.x,a.renderZ??a.z,.45))continue;
      const p=outside(a.x,a.z);if(!p)continue;
      a.x=a.px=a.renderX=p[0];a.z=a.pz=a.renderZ=p[1];a.vx=a.vz=0;a.target=null;a.localGoal=null;
      if(a.stationed&&a.station)a.station={...a.station,x:p[0],z:p[1]};
      if(a.position)a.position=[p[0],floorHeightAt(...p)+.004,p[1]];
    }
    const staff=[...crowdState.staff,...characterState.actors.filter(a=>!a.player),...(window.EventFlow22?.visible()||[])];
    for(const a of staff){
      if(!a.position||!insideArea(a.position[0],a.position[2],.45))continue;
      const p=outside(a.position[0],a.position[2]);if(!p)continue;
      if(!displacedStaff.has(a))displacedStaff.set(a,[...a.position]);
      a.position=[p[0],floorHeightAt(...p)+.004,p[1]];
    }
  }
  function reopenArea() {
    for(const [a,position] of displacedStaff)a.position=position;
    displacedStaff.clear();window.Crowd?.invalidate();
  }
  const beaconLit=()=>f.mounted&&(f.beaconTime<.12||(f.beaconTime>.22&&f.beaconTime<.34));

  function makeGrid() {
    const sector = DISCOVERY_LAYOUT.sectors.find(s => s.industry === 'Construction');
    const rectangles = colliders.filter(o => !o.boundary && o.hi[1]>.30 && o.lo[1]<1.1)
      .map(o => [o.lo[0],o.lo[2],o.hi[0],o.hi[2]]);
    return NAV.build({bounds: [...sector.min,...sector.max], rectangles,
      polygons: [...shippedBooths.values()].filter(r=>r.industry==='Construction').map(r=>footprint(r,r.placement)),
      gateReservations: DISCOVERY_LAYOUT.gates.filter(g=>g.industry==='Construction').map(g=>g.keepClear), radius:.91, step:.16});
  }
  async function load() {
    const r = await fetch('./forklift34/forklift.glb');
    if (!r.ok) throw Error('Forklift model could not load ('+r.status+').');
    const {json:j,bin}=parseGLB(await r.arrayBuffer()); json=j;
    parents=new Map(); order=[];
    j.nodes.forEach((n,i)=>(n.children||[]).forEach(c=>parents.set(c,i)));
    function visit(i) {order.push(i); for(const c of j.nodes[i].children||[]) visit(c);}
    for(const i of j.scenes[j.scene||0].nodes) visit(i);
    const cache=new Map();
    async function texture(i) {if(i==null)return null;if(!cache.has(i)){const t=await embeddedGLBTexture(j,bin,i);cache.set(i,t);textures.push(t);}return cache.get(i);}
    for(let i=0;i<j.nodes.length;i++) {
      const n=j.nodes[i]; nodes[i]={...n,translation:[...(n.translation||[0,0,0])],rotation:[...(n.rotation||[0,0,0,1])]};
      if(n.mesh===undefined)continue;
      for(const p of j.meshes[n.mesh].primitives) {
        const a=Object.fromEntries(Object.entries(p.attributes).map(([k,v])=>[k,accessor(j,bin,v)]));
        const indices=p.indices===undefined?Uint32Array.from({length:a.POSITION.length/3},(_,k)=>k):accessor(j,bin,p.indices);
        const normal=a.NORMAL||geometryNormals(a.POSITION,indices), data=new Float32Array(a.POSITION.length*2);
        for(let k=0;k<a.POSITION.length;k+=3)data.set([...a.POSITION.subarray(k,k+3),...normal.subarray(k,k+3)],k*2);
        const mat=j.materials[p.material]||{}, pbr=mat.pbrMetallicRoughness||{};
        const batch=uploadBatch(data,indices,{uv:a.TEXCOORD_0,color:pbr.baseColorFactor||[1,1,1,1],
          baseTexture:await texture(pbr.baseColorTexture?.index),normalTexture:await texture(mat.normalTexture?.index),
          rough:.65,metal:.12,doubleSided:mat.doubleSided,animated:true,name:n.name});
        parts.push({node:i,batch});
      }
    }
    gl.activeTexture(gl.TEXTURE0); gl.bindVertexArray(null);
  }
  function reset() {
    if(f.mounted)exit();
    if(f.mounted)return;
    try {
      f.grid=makeGrid();
      // Find a straight, clear initial approach in the same connected floor region.
      let start;
      for(const id of [...f.grid.valid].sort((a,b)=>{const p=NAV.point(f.grid,a),q=NAV.point(f.grid,b);return Math.hypot(p[0]-56.4,p[1]-5.3)-Math.hypot(q[0]-56.4,q[1]-5.3);})) {
        const p=NAV.point(f.grid,id);
        if(NAV.freeSegment(f.grid,p[0],p[1],p[0],p[1]+1.6)){start=p;break;}
      }
      if(!start)throw Error('Construction needs a clear approach for the forklift. Move a booth and retry.');
      origin=start; f.x=start[0];f.z=start[1];f.yaw=0;f.speed=0;f.lift=0;f.distance=0;f.steer=0;
      pallet={x:f.x,z:f.z+1.3,y:0,yaw:0};
      const dest=f.grid.valid.map(id=>NAV.point(f.grid,id)).filter(p=>Math.hypot(p[0]-f.x,p[1]-f.z)>3&&NAV.allowed(f.grid,p[0],p[1]-.648));
      if(!dest.length)throw Error('Construction needs more open floor for a delivery zone.');
      destination=dest.reduce((best,p)=>Math.hypot(p[0]-f.x,p[1]-f.z)<Math.hypot(best[0]-f.x,best[1]-f.z)?p:best);
      f.area=[Math.max(35.05,Math.min(f.x,destination[0])-2.2),Math.max(3.85,Math.min(f.z,destination[1])-2.2),
        Math.min(57.95,Math.max(f.x,destination[0])+2.2),Math.min(24.35,Math.max(pallet.z,destination[1])+2.2)];
      Object.assign(f,{carrying:false,delivered:false,seconds:0,bumps:0,points:0,beaconTime:0,status:'ready',error:null});
      if($('forkliftResult34'))$('forkliftResult34').hidden=true;
      updateUI();
    } catch(e) {f.status='blocked';f.error=e.message;updateUI();}
  }
  async function init() {
    ui(); if(loading)return loading; if(f.model)return reset();
    f.status='loading';updateUI();
    loading=(async()=>{try {await load();cube=createCube();beacon=createSphere();f.model=true;reset();}
      catch(e){for(const {batch:b} of parts){for(const k of ['vbo','ibo','uvbo'])if(b[k])gl.deleteBuffer(b[k]);gl.deleteVertexArray(b.vao);}parts.length=0;for(const t of textures)releaseEmbeddedTexture(t);textures.length=0;f.status='error';f.error=e.message;updateUI();}
      finally {loading=null;}})();return loading;
  }
  function visit() {
    if(f.status!=='ready'||window.Farming36?.mounted)return;
    if(f.mounted)return;
    const p=exitPosition();if(!p){toast('The forklift doorway is blocked.');return;}
    places['construction-forklift']={label:'Construction forklift challenge',p,scaledPlayer:true,yaw:Math.atan2(p[0]-f.x,p[2]-f.z)};
    teleport('construction-forklift');canvas.focus();
  }
  function enter() {
    if(!near()||blockedUI()||window.Farming36?.mounted)return;
    f.saved={firstPerson:state.firstPerson,radius:state.radius,orbitYaw:state.orbitYaw,pitch:state.pitch,ghost:state.ghost};
    f.mounted=true;state.overview=null;state.ghost=false;state.firstPerson=false;state.radius=2.6;state.orbitYaw=0;state.pitch=.12;
    f.beaconTime=0;clearPracticeArea();window.Crowd?.invalidate();
    keys.clear();controls.clear();seatPlayer();canvas.focus();updateUI();
  }
  function exitPosition() {
    for(const side of [1,-1])for(const offset of [.75,1,1.2]) {
      const p=local(side*offset,-.1),x=f.x+p[0],z=f.z+p[1];
      if(x<34.9||x>58.1||z<3.7||z>24.5)continue;
      const y=floorHeightAt(x,z)+PHYSICS.radii[1]+.003;
      const q=resolveEllipsoid([x,y,z],[0,0,0]);
      if(Math.hypot(q.position[0]-x,q.position[2]-z)<.02)return q.position;
    }return null;
  }
  function exit() {
    if(!f.mounted)return;
    if(Math.abs(f.speed)>.05){toast('Stop before exiting the forklift.');return;}
    const p=exitPosition();if(!p){toast('Both exits are blocked. Move to clear floor.');return;}
    f.mounted=false;reopenArea();Object.assign(state,f.saved);player.position=p;player.vy=0;player.walkAmount=0;
    keys.clear();controls.clear();updateCamera(0,true);updateUI();
  }
  function seatPlayer() {
    const p=local(.07*SCALE,-.16*SCALE);
    player.position=[f.x+p[0],floor()+.77*SCALE+PHYSICS.radii[1]-.38,f.z+p[1]];
    player.yaw=f.yaw+Math.PI;player.walkAmount=0;player.vy=0;player.grounded=true;
  }
  function seatedPose(a) {
    if(!f.mounted||!a.player)return;
    for(let i=0;i<a.model.j.nodes.length;i++) {
      const name=a.model.j.nodes[i].name||'';
      const radians=/upleg|thigh/i.test(name)?Math.PI/2:/(?:left|right)leg|calf/i.test(name)?-Math.PI/2:null;
      if(radians!==null){
        delete a.pose[i].matrix;
        const [x,y,z,w]=a.model.j.nodes[i].rotation||[0,0,0,1],s=Math.sin(radians/2),c=Math.cos(radians/2);
        a.pose[i].rotation=[x*c+w*s,y*c+z*s,z*c-y*s,w*c-x*s];
      }
    }
    gripWheel(a);
  }
  const quaternionMultiply = ([x,y,z,w],[a,b,c,d]) => [w*a+x*d+y*c-z*b,w*b-x*c+y*d+z*a,w*c+x*b-y*a+z*d,w*d-x*a-y*b-z*c];
  function gripWheel(a) {
    const m=a.model;
    if(!a.forkliftArms) a.forkliftArms=['Left','Right'].map(side=>{
      const find=part=>m.j.nodes.findIndex(n=>(n.name||'').split(':').pop()===side+part);
      return {upper:find('Arm'),elbow:find('ForeArm'),palm:find('HandMiddle1')>=0?find('HandMiddle1'):find('HandIndex1'),hand:find('Hand')};
    });
    const world=[];
    const rebuild=()=>{for(const i of m.order)world[i]=mm(world[m.parents.get(i)]||IDENTITY,trs(a.pose[i]));};
    rebuild();
    const hip=world[m.skins[0].joints[0]], correction=a.bindHip?[hip[12]-a.bindHip[0],0,hip[14]-a.bindHip[1]]:[0,0,0];
    const actorInverse=CharacterFitting.invert4(actorMatrix(a));
    const forkliftRoot=transform([f.x,floor(),f.z],[SCALE,SCALE,SCALE],0,f.yaw);
    for(let side=0;side<2;side++) {
      const arm=a.forkliftArms[side],end=arm.palm>=0?arm.palm:arm.hand;
      if(arm.upper<0||arm.elbow<0||end<0)continue;
      // Palm targets sit on opposite sides of the supplied steering-wheel rim.
      const target=add(tp(actorInverse,...tp(forkliftRoot,side===0?.167:-.038,1.015,.22)),correction);
      for(let iteration=0;iteration<8;iteration++)for(const joint of [arm.elbow,arm.upper]) {
        const inv=CharacterFitting.invert4(world[m.parents.get(joint)]||IDENTITY);
        const origin=tp(inv,...world[joint].slice(12,15));
        const from=norm(sub(tp(inv,...world[end].slice(12,15)),origin)),to=norm(sub(tp(inv,...target),origin));
        const axis=cross(from,to),w=1+clamp(dot(from,to),-1,1);
        if(w<1e-6)continue;
        const q=norm([...axis,w]);
        delete a.pose[joint].matrix;
        a.pose[joint].rotation=quaternionMultiply(q,a.pose[joint].rotation);
        rebuild();
      }
    }
  }
  function forkContact() {
    if(!pallet)return false;
    // Clip each tine's actual plan-view segment against the pallet underside.
    return [-.1795,.1795].every(tine=>{
      const endpoints=[.938,1.7911].map(z=>{
        const p=local(tine*SCALE,z*SCALE);
        return local(f.x+p[0]-pallet.x,f.z+p[1]-pallet.z,-pallet.yaw);
      });
      const delta=sub(endpoints[1],endpoints[0]);let lo=0,hi=1;
      for(let axis=0;axis<2;axis++){
        const half=axis===0?.25:.29;
        if(Math.abs(delta[axis])<1e-7){if(Math.abs(endpoints[0][axis])>half)return false;continue;}
        const a=(-half-endpoints[0][axis])/delta[axis],b=(half-endpoints[0][axis])/delta[axis];
        lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));
      }
      return (hi-lo)*Math.hypot(...delta)>=.025;
    });
  }
  function release() {
    if(!f.mounted||!f.carrying)return;
    if(Math.abs(f.speed)>.05||pallet.y>.025){toast('Stop and lower the pallet to the floor before releasing.');return;}
    f.carrying=false;pallet.y=0;
    if(inDeliveryZone()&&!f.delivered){
      f.delivered=true;f.points=100+Math.max(0,50-f.bumps*10);f.speed=0;
      $('forkliftResultPoints34').textContent='+'+f.points+' points';
      $('forkliftResultDetail34').textContent='Delivery: 100 · Careful handling: '+(f.points-100)+' · '+f.seconds.toFixed(1)+' seconds';
      $('forkliftResult34').hidden=false;
    }
    updateUI();
  }
  const inDeliveryZone=()=>Math.hypot(pallet.x-destination[0],pallet.z-destination[1])<.22&&Math.abs(angle(pallet.yaw))<.22;
  function update(dt) {
    if(f.status!=='ready')return;
    if(f.mounted){f.beaconTime=(f.beaconTime+Math.max(0,Math.min(dt,.1)))%1;clearPracticeArea();}
    if(f.mounted&&(state.overview||Math.hypot(player.position[0]-f.x,player.position[2]-f.z)>2)){f.speed=0;exit();return;}
    if(f.mounted&&!blockedUI()) {
      dt=Math.min(dt,.05); if(!f.delivered)f.seconds+=dt;
      const has=k=>controls.has(k)||keys.has(k);
      const drive=(has('w')||has('arrowup')?1:0)-(has('s')||has('arrowdown')?1:0);
      const turn=(has('a')||has('arrowleft')?1:0)-(has('d')||has('arrowright')?1:0);
      const speedLimit=f.lift>.25?.22:f.carrying?.42:.65;
      const wanted=has(' ')?0:drive*speedLimit;
      f.speed+=clamp(wanted-f.speed,-dt*1.2,dt*1.2);f.steer=turn*.42;
      const yaw=f.yaw+f.speed*Math.tan(f.steer)/(.6)*dt;
      const x=f.x+Math.sin(yaw)*f.speed*dt,z=f.z+Math.cos(yaw)*f.speed*dt;
      const people=[...(crowdState.sim?.agents||[]),...(crowdState.staff||[]),...(characterState.actors||[]).filter(a=>!a.player)].some(a=>Math.hypot((a.renderX??a.x??a.position?.[0])-x,(a.renderZ??a.z??a.position?.[2])-z)<1);
      const p=local(pallet.x-x,pallet.z-z,-yaw);
      const palletHit=!f.carrying&&Math.abs(p[0])<.44&&p[1]>-.73&&p[1]<.42;
      if(!people&&!palletHit&&insideArea(x,z,-.95)&&NAV.freeSegment(f.grid,f.x,f.z,x,z)){f.distance+=f.speed*dt;f.x=x;f.z=z;f.yaw=yaw;}
      else {if(Math.abs(f.speed)>.03&&performance.now()-f.bumpTime>1000){f.bumps++;f.bumpTime=performance.now();}f.speed=0;}
      const lifting=(has('e')?1:0)-(has('q')?1:0);
      const nextLift=clamp(f.lift+lifting*dt*.35,0,.65);
      const forkTop=floor()+(f.lift+.055)*SCALE,nextTop=floor()+(nextLift+.055)*SCALE;
      const underside=floorHeightAt(pallet.x,pallet.z)+pallet.y+.065;
      if(lifting>0&&!f.carrying&&!f.delivered&&forkContact()&&forkTop<=underside+.012&&nextTop>=underside-.012) {
        f.carrying=true;
        f.loadOffset=local(pallet.x-f.x,pallet.z-f.z,-f.yaw);
        f.loadYaw=angle(pallet.yaw-f.yaw);
      }
      f.lift=nextLift;
      if(f.carrying){const p=local(...f.loadOffset);pallet.x=f.x+p[0];pallet.z=f.z+p[1];pallet.y=Math.max(0,(f.lift+.055)*SCALE-.065);pallet.yaw=f.yaw+f.loadYaw;}
      if(f.carrying&&lifting<0&&pallet.y<=.025&&Math.abs(f.speed)<.05&&inDeliveryZone())release();
      seatPlayer();
    } else if(f.mounted) {f.speed=0;controls.clear();keys.clear();}
    updateUI();
  }
  function draw(planes) {
    if(!f.model||f.status!=='ready')return;
    const root=transform([f.x,floor(),f.z],[SCALE,SCALE,SCALE],0,f.yaw);
    for(const i of order){const n=nodes[i],name=n.name||'';
      if(name==='Fork_Lift')n.translation=[0,f.lift,0];
      if(name.startsWith('Wheel_')){const a=f.distance/(SCALE*(json.nodes[i].extras?.radius||.238));n.rotation=[Math.sin(a/2),0,0,Math.cos(a/2)];}
      if(name.startsWith('Steer_'))n.rotation=[0,Math.sin(-f.steer/2),0,Math.cos(f.steer/2)];
      worlds[i]=mm(worlds[parents.get(i)]||IDENTITY,trs(n));
    }
    gl.disable(gl.CULL_FACE);
    if(sphereVisible([f.x,floor()+.5,f.z],1.5,planes))for(const p of parts)drawBatch(p.batch,mm(root,worlds[p.node]));
    function box(base,p,s,color){drawBatch(cube,mm(base,transform(p,s)),false,color);}
    box(root,[0,1.555,-.10],[.18,.045,.18],[.045,.045,.04,1]);
    const flash=beaconLit();beacon.unlit=flash;beacon.emission=flash?[1,.5,0]:[0,0,0];
    drawBatch(beacon,mm(root,transform([0,1.655,-.10],[.085,.09,.085])),false,flash?[1,.72,.025,1]:[.48,.25,.025,1]);
    if(f.mounted&&f.area){
      const [x,z,xx,zz]=f.area,posts=[],corners=[[x,z],[xx,z],[xx,zz],[x,zz]];
      for(let edge=0;edge<4;edge++){
        const a=corners[edge],b=corners[(edge+1)%4],count=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/1.5);
        for(let k=0;k<count;k++)posts.push([a[0]+(b[0]-a[0])*k/count,a[1]+(b[1]-a[1])*k/count]);
      }
      for(let i=0;i<posts.length;i++){
        const a=posts[i],b=posts[(i+1)%posts.length],y=floorHeightAt(...a);
        box(IDENTITY,[a[0],y+.025,a[1]],[.18,.05,.18],[.08,.09,.095,1]);
        box(IDENTITY,[a[0],y+.25,a[1]],[.045,.48,.045],[.72,.75,.77,1]);
        drawBatch(avatarSphere,transform([a[0],y+.49,a[1]],[.045,.045,.045]),false,[1,.72,.025,1]);
        for(let k=0;k<8;k++){
          const t=(k+.5)/8,px=a[0]+(b[0]-a[0])*t,pz=a[1]+(b[1]-a[1])*t;
          box(transform([px,y+.45-Math.sin(t*Math.PI)*.045,pz],[1,1,1],0,Math.atan2(b[0]-a[0],b[1]-a[1])),[0,0,0],[.022,.028,Math.hypot(b[0]-a[0],b[1]-a[1])/8+.003],k%2?[.10,.11,.10,1]:[1,.72,.025,1]);
        }
      }
    }
    const pb=transform([pallet.x,floorHeightAt(pallet.x,pallet.z)+pallet.y,pallet.z],[1,1,1],0,pallet.yaw);
    for(const x of [-.22,0,.22])box(pb,[x,.032,0],[.04,.064,.56],[.40,.27,.13,1]);
    for(let z=-.24;z<=.25;z+=.12)box(pb,[0,.077,z],[.48,.024,.09],[.65,.47,.26,1]);
    box(pb,[0,.18,0],[.36,.18,.38],[.33,.51,.57,1]);
    if(!groundPaint)groundPaint=new NetworkScene40.Mesh([1,1,1,1]).plane([0,0,0],[1,1]).build();
    const db=transform([destination[0],floorPaintHeight68(...destination),destination[1]]);
    const color=f.delivered?[.12,.8,.35,1]:[1,.72,.05,1];
    for(const x of [-.4,.4])drawBatch(groundPaint,mm(db,transform([x,0,0],[.035,1,.85])),false,color);
    for(const z of [-.425,.425])drawBatch(groundPaint,mm(db,transform([0,0,z],[.8,1,.035])),false,color);
    // Keep a seated avatar visible even when the optional character pack has not loaded.
    if(f.mounted&&!characterState.player){const b=mm(root,transform([.07,.77,-.16],[.75,.75,.75]));
      box(b,[0,.20,0],[.30,.38,.22],[.02,.23,.38,1]);
      drawBatch(avatarSphere,mm(b,transform([0,.51,0],[.19,.22,.19])),false,[.62,.38,.22,1]);
      for(const x of [-.10,.10]){box(b,[x,-.02,.17],[.12,.13,.35],[.018,.036,.062,1]);box(b,[x,-.19,.31],[.12,.30,.12],[.018,.036,.062,1]);}}
    gl.uniform1i(uniforms.uSkinned,0);gl.bindVertexArray(null);
  }
  function ui() {
    if(panel)return;
    panel=document.createElement('details');panel.className='panel';panel.open=true;panel.id='forkliftPanel34';
    panel.innerHTML='<summary>Construction: pallet delivery</summary><p id="forkliftStatus34" role="status"></p><div class="buttonRow"><button id="forkliftVisit34">Visit forklift</button><button id="forkliftReset34">Restart challenge</button></div><div id="forkliftControls34" hidden><div class="buttonRow"><button data-forklift="e" title="Raise forks (E)">Raise ↑</button><button data-forklift="q" title="Lower forks (Q)">Lower ↓</button><button id="forkliftRelease34" title="Release pallet (F)">Release pallet</button></div><button id="forkliftExit34">Exit forklift (T)</button></div>';
    const style=document.createElement('style');
    style.textContent='#forkliftPanel34{position:fixed;right:12px;top:140px;width:260px;max-height:calc(100vh - 250px);overflow:auto;z-index:12;padding:12px;border-radius:6px;background:#172126ed;color:#f5f7f8}#forkliftPanel34 summary{font-size:13px}#forkliftPanel34 button{min-height:36px;font-size:12px}#forkliftPanel34 .buttonRow{display:flex;flex-wrap:wrap;gap:5px}#forkliftStatus34{font-size:12px}';
    document.head.append(style);document.body.append(panel);panel.open=false;
    const result=document.createElement('section');result.id='forkliftResult34';result.hidden=true;result.setAttribute('role','status');
    result.innerHTML='<button id="forkliftResultClose34" aria-label="Dismiss challenge result" title="Dismiss">×</button><strong>Challenge complete!</strong><div id="forkliftResultPoints34"></div><p id="forkliftResultDetail34"></p><button id="forkliftAgain34">Try again</button>';
    document.body.append(result);
    style.textContent+='#forkliftResult34{position:fixed;top:145px;left:50%;transform:translateX(-50%);width:min(360px,calc(100vw - 24px));z-index:16;background:#163c30;color:#fff;border:2px solid #7edda9;border-radius:6px;padding:20px;text-align:center}#forkliftResult34[hidden]{display:none}#forkliftResult34 strong{font-size:22px}#forkliftResultPoints34{font-size:28px;color:#ffdc64;margin:8px 0}#forkliftResultDetail34{font-size:12px;line-height:1.5}#forkliftResultClose34{position:absolute;right:5px;top:3px;padding:2px 7px}';
    $('forkliftResultClose34').onclick=()=>result.hidden=true;$('forkliftAgain34').onclick=()=>{reset();visit();};
    style.textContent+='#forkliftPanel34:not([data-mounted="true"]){display:none!important}';
    const driving=document.createElement('div');driving.className='buttonRow';
    for(const [key,label,title] of [['w','↑','Forward (W)'],['s','↓','Reverse (S)'],['a','←','Steer left (A)'],['d','→','Steer right (D)'],[' ','■','Brake (Space)']]){const b=document.createElement('button');b.dataset.forklift=key;b.textContent=label;b.title=title;b.setAttribute('aria-label',title);driving.append(b);}
    $('forkliftControls34').prepend(driving);
    prompt=document.createElement('button');prompt.id='forkliftPrompt34';prompt.hidden=true;prompt.textContent='Press T to drive';
    prompt.style.cssText='position:fixed;bottom:145px;left:50%;transform:translateX(-50%);z-index:15;max-width:85vw;background:#f6ca39;color:#172126;padding:12px 20px;border-radius:6px';document.body.append(prompt);
    prompt.onclick=enter;$('forkliftVisit34').onclick=visit;$('forkliftReset34').onclick=()=>f.model?reset():init();
    $('forkliftExit34').onclick=exit;$('forkliftRelease34').onclick=release;
    for(const b of panel.querySelectorAll('[data-forklift]')){b.onpointerdown=e=>{b.setPointerCapture(e.pointerId);controls.add(b.dataset.forklift);};b.onpointerup=b.onpointercancel=()=>controls.delete(b.dataset.forklift);}
    window.addEventListener('keydown',e=>{
      const k=e.key.toLowerCase();if(blockedUI())return;
      if((k==='t'&&(f.mounted||near()))||(f.mounted&&['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e','q','f',' ','escape','r','v','g'].includes(k))){
        e.preventDefault();e.stopImmediatePropagation();if(k==='t'){if(!e.repeat)f.mounted?exit():enter();return;}
        if(k==='f'){if(!e.repeat)release();return;}if(k==='escape'){f.speed=0;controls.clear();keys.clear();exit();return;}
        if(!['r','v','g'].includes(k))controls.add(k);
      }
    },true);
    window.addEventListener('keyup',e=>controls.delete(e.key.toLowerCase()),true);
    const stop=()=>{controls.clear();if(f.mounted){f.speed=0;keys.clear();}};
    window.addEventListener('blur',stop);document.addEventListener('visibilitychange',stop);
  }
  function updateUI() {
    if(!panel)return;
    prompt.hidden=!near()||f.mounted||blockedUI();
    $('forkliftControls34').hidden=!f.mounted;
    panel.dataset.mounted=String(f.mounted);
    if(f.mounted)panel.open=true;
    if(f.mounted&&$('staffPrompt'))$('staffPrompt').hidden=true;
    $('forkliftVisit34').disabled=f.status!=='ready'||f.mounted;
    $('forkliftStatus34').textContent=f.error|| (f.status!=='ready'?'Loading forklift…':
      (f.delivered?'Challenge complete · '+f.points+' points':f.carrying?'Pallet loaded':forkContact()?'Forks under pallet':'Pallet awaiting pickup')+' · '+f.seconds.toFixed(1)+' s · '+f.bumps+' stops');
  }
  // Rebuild clearance after booth edits without relocating an occupied vehicle.
  function invalidate(){if(!f.model)return;try{f.grid=makeGrid();if(!NAV.allowed(f.grid,f.x,f.z)){f.speed=0;f.error='A booth blocks the forklift. Move it or restart the challenge.';}else f.error=null;}catch(e){f.error=e.message;f.speed=0;}}
  function blocksWalker(position){
    if(f.status!=='ready')return false;
    const p=local(position[0]-f.x,position[2]-f.z,-f.yaw);
    if(Math.abs(p[0])<.34&&p[1]>-.55&&p[1]<.43)return true;
    return !f.carrying&&Math.hypot(position[0]-pallet.x,position[2]-pallet.z)<.4;
  }
  return {init,update,draw,visit,enter,exit,release,reset,seatedPose,invalidate,crowdObstacles,clearPracticeArea,
    blocksWalker,
    get mounted(){return f.mounted;},snapshot:()=>({...f,model:!!f.model,grid:undefined,saved:undefined,pallet:{...pallet},destination,origin}),
    test:{state:f,controls,socket,near,local,forkContact,insideArea,beaconLit}};
})();
window.Forklift34=Forklift34;

// Install alongside the already initialized venue runtime, including standalone Cloudflare pages.
{
  const walk=advancePlayer, avatar=renderAvatar, robotUpdate=RobotExhibit20.update,
    robotDraw=RobotExhibit20.draw, robotInvalidate=RobotExhibit20.invalidate, characterUpdate=AnimatedCharacters.update,
    crowdGrid=CrowdCore.buildGrid,crowdUpdate=Crowd.update;
  advancePlayer=function(dt,input){if(Forklift34.mounted)return;const before=[...player.position];walk(dt,input);if(!state.ghost&&Forklift34.blocksWalker(player.position)){player.position=before;player.walkAmount=0;}};
  renderAvatar=function(){if(!Forklift34.mounted)avatar();};
  RobotExhibit20.update=function(dt){robotUpdate(dt);Forklift34.update(dt);};
  RobotExhibit20.draw=function(planes){robotDraw(planes);Forklift34.draw(planes);};
  RobotExhibit20.invalidate=function(){robotInvalidate();Forklift34.invalidate();};
  AnimatedCharacters.update=function(dt){characterUpdate(dt);if(Forklift34.mounted&&$('staffPrompt'))$('staffPrompt').hidden=true;};
  CrowdCore.buildGrid=function(base,polygons=[],staff=[]){return crowdGrid(base,[...polygons,...Forklift34.crowdObstacles()],staff);};
  Crowd.update=function(dt){crowdUpdate(dt);Forklift34.clearPracticeArea();};
  const start=()=>{if(!state.ready){setTimeout(start,250);return;}Forklift34.init();};
  start();
}
