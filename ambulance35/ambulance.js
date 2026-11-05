/* Health Science ambulance challenge, using the venue renderer and collision data. */
const Ambulance35=(()=>{
  'use strict';
  const SCALE=.4,LIMIT=60,HOSPITAL='City_Riverbank_100_Building-Medium-01';
  const parked={x:15,z:45.55,yaw:Math.PI/2};
  const route=[[19,42.9],[69.9,42.9],[69.9,36],[69.9,-33],[69.9,-50],[69.9,-66],[66,-69.6],[-24,-69.6]];
  const labels=['Join the eastbound lane','Turn left','Around the venue','East road bridge','Cross the road bridge','Turn left at far bank','Hospital road','Hospital'];
  const s={status:'loading',mounted:false,...parked,speed:0,distance:0,
    next:0,elapsed:0,started:0,phase:'ready',steer:0,points:0,error:null,
    health:100,warning:'',impacts:0,hitTime:0,lastHit:null};
  const controls=new Set(),parts=[],nodes=[],worlds=[],parents=new Map(),order=[],textures=[];
  const dynamics=Driving154.create({heavy:true});
  let scenery=[],saved,uiPanel,hiddenForklift=false,layoutKey='',physics,debrisMesh,turnArrow;
  const turnMarkers=[1,5,6].map(i=>{const a=route[i-1],p=route[i],b=route[i+1],dx=p[0]-a[0],dz=p[1]-a[1],yaw=Math.atan2(-dx,-dz);return {index:i,x:p[0],z:p[1],yaw,side:Math.sign((b[0]-p[0])*Math.cos(yaw)-(b[1]-p[1])*Math.sin(yaw))||1};});
  const debris=[];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  function projection(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1);
    return {t,d:Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)};}
  function height(x,z){
    const bridge=window.District115?.heightAt(x,z);if(bridge!=null)return bridge;
    return floorHeightAt(x,z)||-.12;
  }
  function onCourse(x,z){return route.slice(1).some((p,i)=>projection(x,z,route[i],p).d<(i>=6&&i<=8?1.1:2.1));}
  const blocked=(x,z,yaw=s.yaw)=>!!physics?.overlaps(x,z,yaw,height(x,z)).length;
  function buildPhysics(){
    const shapes=[];
    function polygon(name,points,minY,maxY){shapes.push({name,points,minY,maxY});}
    for(const c of colliders){
      if(c.boundary||c.name.includes(HOSPITAL))continue;
      const tree=/trunk/i.test(c.name),proxy=/footprint_collider|School_bus.*collider|Blue_Bridge.*railing_solid/i.test(c.name);
      const floor=height((c.lo[0]+c.hi[0])/2,(c.lo[2]+c.hi[2])/2);
      if(!proxy&&(c.lo[1]>floor+1.02||c.hi[1]<floor+.25))continue;
      if(tree){shapes.push({name:c.name,x:(c.lo[0]+c.hi[0])/2,z:(c.lo[2]+c.hi[2])/2,radius:Math.max(c.hi[0]-c.lo[0],c.hi[2]-c.lo[2])/2,minY:c.lo[1],maxY:c.hi[1]});continue;}
      if(!proxy&&!c.barrier&&!/wall|glass|door|bench|planter|bollard|post|column|pillar/i.test(c.name))continue;
      if(proxy||c.axisBox){polygon(c.name,c.triangles.flatMap(t=>[t.a,t.b,t.c].map(p=>[p[0],p[2]])),c.lo[1],c.hi[1]);continue;}
      // Slice complex walls at bumper height instead of filling their enclosing box.
      const y=floor+.45;
      for(const t of c.triangles){
        const vertices=[t.a,t.b,t.c],points=[];
        for(let i=0;i<3;i++){const a=vertices[i],b=vertices[(i+1)%3];if((a[1]<=y&&b[1]>y)||(b[1]<=y&&a[1]>y)){
          const u=(y-a[1])/(b[1]-a[1]);points.push([a[0]+(b[0]-a[0])*u,a[2]+(b[2]-a[2])*u]);}}
        if(points.length!==2||distance(...points)<.015)continue;
        const [a,b]=points,len=distance(a,b),nx=(b[1]-a[1])/len*.012,nz=-(b[0]-a[0])/len*.012;
        polygon(c.name,[[a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz],[b[0]-nx,b[1]-nz],[a[0]-nx,a[1]-nz]],c.lo[1],c.hi[1]);
      }
    }
    // City trees are decorative for pedestrians; give their actual trunks vehicle colliders.
    const j=venueSceneJSON,treeNames=new Set(shapes.filter(p=>p.radius).map(p=>p.name));
    function walk(i,parent){
      const n=j.nodes[i],world=mm(parent,trs(n));
      if(n.mesh!==undefined&&/trunk/i.test(n.name)&&!treeNames.has(n.name)&&!(window.HarvestCore36?.inField(world[12],world[14])&&/^City_tree_/.test(n.name))){
        const points=[];
        for(const p of j.meshes[n.mesh].primitives){const a=j.accessors[p.attributes.POSITION];if(!a.min||!a.max)continue;
          for(const x of [a.min[0],a.max[0]])for(const y of [a.min[1],a.max[1]])for(const z of [a.min[2],a.max[2]])points.push(tp(world,x,y,z));}
        if(points.length){const lo=[0,1,2].map(k=>Math.min(...points.map(p=>p[k]))),hi=[0,1,2].map(k=>Math.max(...points.map(p=>p[k])));
          shapes.push({name:n.name,x:(lo[0]+hi[0])/2,z:(lo[2]+hi[2])/2,radius:Math.max(hi[0]-lo[0],hi[2]-lo[2])/2,minY:lo[1],maxY:hi[1]});}
      }
      for(const child of n.children||[])walk(child,world);
    }
    for(const i of j.scenes[j.scene||0].nodes)walk(i,transform([0,0,0],[VENUE_SCALE,VENUE_SCALE,VENUE_SCALE]));
    polygon('Hospital',[[-27.86,-81.87],[-20.26,-81.87],[-20.26,-73.67],[-27.86,-73.67]],0,22);
    if(window.HotelCore146){const [x,y,z]=HotelCore146.origin;polygon('Supplied hotel building',[[x-3.75,z-5.1],[x+3.75,z-5.1],[x+3.75,z+5.1],[x-3.75,z+5.1]],y,y+16.14);}
    physics=AmbulancePhysics35.create(shapes,impact,{
      traffic:()=>window.CityLife111?.trafficBodies()||[],lanes:()=>window.CityLife111?.mapLanes()||[],heightAt:height,
      driveable:(x,z)=>!window.District115?.inWater(x,z),
      player:()=>s.mounted?null:[player.position[0],player.position[2]],
      resetVisible:(x,z)=>{
        const dx=x-camera[0],dz=z-camera[2],distance=Math.hypot(dx,dz),fx=target[0]-camera[0],fz=target[2]-camera[2];
        return distance<35||Math.hypot(x-player.position[0],z-player.position[2])<35||(dx*fx+dz*fz)/Math.max(.001,distance*Math.hypot(fx,fz))>.2;
      }
    });physics.reset(s.x,s.z,s.yaw);debrisMesh=createCube();
  }
  function impact(hit){
    if(s.phase!=='running')return;
    const damage=Math.min(75,Math.max(3,Math.round(hit.speed*2+hit.speed*hit.speed*1.3)));
    s.health=Math.max(0,s.health-damage);s.impacts++;s.hitTime=.45;s.lastHit=hit.name;
    for(let i=0;i<Math.min(18,5+Math.round(hit.speed*2));i++){
      const angle=Math.random()*Math.PI*2,force=.5+Math.random()*hit.speed*.5;
      debris.push({x:hit.x,y:height(s.x,s.z)+.5,z:hit.z,vx:Math.cos(angle)*force,vy:1+Math.random()*2,vz:Math.sin(angle)*force,life:1.2+Math.random(),size:.035+Math.random()*.065,spin:Math.random()*6,color:i%3===0?[.8,.025,.04,1]:i%3===1?[.85,.88,.9,1]:[.12,.14,.16,1]});
    }
    if(debris.length>80)debris.splice(0,debris.length-80);
    if(s.health===0)finish(false,'breakdown');
  }
  function updateEffects(dt){
    s.hitTime=Math.max(0,s.hitTime-dt);
    for(let i=debris.length-1;i>=0;i--){const p=debris[i];p.life-=dt;if(p.life<=0){debris.splice(i,1);continue;}
      p.vy-=7*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.spin+=dt*9;
      const ground=height(p.x,p.z)+p.size/2;if(p.y<ground){p.y=ground;p.vy=Math.abs(p.vy)*.28;p.vx*=.7;p.vz*=.7;}
    }
  }
  function nearestRouteSegment(last=route.length-2){
    let best;
    for(let i=0;i<=last;i++){
      const p=projection(s.x,s.z,route[i],route[i+1]);
      if(!best||p.d<best.d)best={...p,i};
    }
    return best;
  }
  function recoverRoute(){
    if(s.next===0&&projection(s.x,s.z,[parked.x,parked.z],route[0]).d<3)return;
    // Rejoin beyond missed turns, but retain the venue and bridge stages.
    const last=s.next<=3?3:s.next<=5?5:route.length-2;
    const nearest=nearestRouteSegment(last);
    if(nearest.d<3)s.next=Math.max(s.next,nearest.i+1);
  }
  function routeWarning(){
    if(s.phase!=='running'||s.next===0&&projection(s.x,s.z,[parked.x,parked.z],route[0]).d<3)return '';
    const nearest=nearestRouteSegment(),a=route[nearest.i],b=route[nearest.i+1];
    if(nearest.d>5)return 'Off course - follow the blue turn arrows';
    const heading=physics.pose(),dx=b[0]-a[0],dz=b[1]-a[1];
    return Math.hypot(heading.vx,heading.vz)>.7&&(heading.vx*dx+heading.vz*dz)<-distance(a,b)*.35?'Wrong way - turn around':'';
  }
  function inWater(){
    return window.District115?.inWater(s.x,s.z)||false;
  }
  const near=()=>s.status==='ready'&&!state.overview&&distance([s.x,s.z],[player.position[0],player.position[2]])<2.3&&Math.abs(player.position[1]-height(s.x,s.z))<2;
  const editing=()=>['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||document.activeElement?.isContentEditable;
  const lampLit=(red,now=performance.now())=>s.mounted&&Math.floor(now/250)%2===(red?0:1);
  // Chase camera: low behind the ambulance and aimed down the road ahead of it.
  const CHASE={pitch:.06,ahead:3.5,aim:1};
  function resetView(){if(!s.mounted)return;Object.assign(state,{firstPerson:false,radius:5,orbitYaw:0,pitch:CHASE.pitch});dynamics.snap(s.yaw);updateCamera(0,true);}
  function vehicleCamera(dt,immediate=false){
    if(!s.mounted||state.overview)return false;
    state.firstPerson=false;
    const head=[s.x,height(s.x,s.z)+1.15,s.z],angle=dynamics.state.followYaw+Math.PI+state.orbitYaw,desired=clamp(state.radius,2.8,12);
    let chosen;
    // Lift the chase camera over nearby low rails rather than snapping inside the cab.
    for(const pitch of [state.pitch,Math.max(state.pitch,.55),Math.max(state.pitch,.95)]){
      const dir=norm([Math.sin(angle)*Math.cos(pitch),Math.sin(pitch)+.23,Math.cos(angle)*Math.cos(pitch)]);
      const hit=raycast(head,dir,desired,o=>!o.boundary&&o.kind!=='cityFurniture'&&o.kind!=='fallenStreetProp'),radius=hit?Math.max(.25,hit.distance-.15):desired;// street props never pull the camera in (see Rivian147 cameraView)
      if(!chosen||radius>chosen.radius)chosen={dir,radius};
      if(radius>=Math.min(2.8,desired))break;
    }
    smoothRadius=immediate?chosen.radius:chosen.radius<smoothRadius?chosen.radius:smoothRadius+(chosen.radius-smoothRadius)*Math.min(1,Math.max(0,dt)*7);
    target=[head[0]-Math.sin(angle)*CHASE.ahead,head[1]-1.15+CHASE.aim,head[2]-Math.cos(angle)*CHASE.ahead];camera=add(head,mul(chosen.dir,smoothRadius));return true;
  }
  function pedestrians(){
    const crowd=CrowdGraphics.ready?EventFlow22.combined(crowdState.sim?.agents||[]):[];
    return [...crowd,...(state.showStaff===false?[]:[...crowdState.staff,...characterState.actors.filter(a=>!a.player)])].filter(a=>window.IndoorPerformance154?.visible(a)!==false);
  }
  function pedestrianContact(){
    const y=height(s.x,s.z),c=Math.cos(s.yaw),sn=Math.sin(s.yaw);
    for(const a of pedestrians()){
      if(a.player||a===characterState.player||!a.model)continue;
      const x=a.renderX??a.x??a.position?.[0],z=a.renderZ??a.z??a.position?.[2];
      if(!Number.isFinite(x)||!Number.isFinite(z)||Math.hypot(x-s.x,z-s.z)>1.7)continue;
      const base=a.position?.[1]??floorHeightAt(x,z)+.004;
      if(base>y+1.02||base+.72<y+.15)continue;
      const dx=x-s.x,dz=z-s.z,lateral=dx*c-dz*sn,forward=dx*sn+dz*c;
      if(Math.hypot(Math.max(0,Math.abs(lateral)-.51),Math.max(0,Math.abs(forward)-1.325))<.17)return a;
    }
    return null;
  }
  function seat(){player.position=[s.x,height(s.x,s.z)+.7,s.z];player.yaw=s.yaw+Math.PI;player.walkAmount=0;player.vy=0;player.grounded=true;}
  function visit(){
    if(s.status!=='ready'||s.mounted||window.Forklift34?.mounted||window.Farming36?.mounted)return;
    places.ambulance35={label:'Health Science ambulance',p:[s.x-1.6,height(s.x,s.z)+PHYSICS.radii[1]+.1,s.z],scaledPlayer:true,yaw:-Math.PI/2};
    teleport('ambulance35');uiPanel.open=true;canvas.focus();
  }
  function enter(){
    if(s.mounted||!near()||editing()||state.paused||HubGuide.snapshot().dialogOpen||window.Forklift34?.mounted||window.Farming36?.mounted)return;
    if(s.phase!=='ready'){toast('Restart the ambulance challenge for a new attempt.');return;}
    saved={firstPerson:state.firstPerson,radius:state.radius,orbitYaw:state.orbitYaw,pitch:state.pitch,ghost:state.ghost};
    Object.assign(state,{firstPerson:false,radius:5,orbitYaw:0,pitch:CHASE.pitch,ghost:false,overview:null});
    s.mounted=true;s.phase='running';s.started=performance.now();s.elapsed=0;
    physics.reset(s.x,s.z,s.yaw);dynamics.reset(s.yaw);
    controls.clear();keys.clear();seat();uiPanel.open=true;canvas.focus();updateUI();
  }
  function exit(){
    if(!s.mounted)return;
    const motion=physics.pose();if(Math.hypot(motion.vx,motion.vz)>.1){toast('Stop before exiting the ambulance.');return;}
    s.mounted=false;physics.stop();
    Object.assign(state,saved);player.position=[s.x+Math.cos(s.yaw)*1.4,height(s.x,s.z)+PHYSICS.radii[1]+.1,s.z-Math.sin(s.yaw)*1.4];
    returnToBay();
    player.vy=0;controls.clear();keys.clear();updateCamera(0,true);updateUI();
  }
  function returnToBay(){
    Object.assign(s,{...parked,speed:0,vx:0,vz:0,distance:0,next:0,elapsed:0,started:0,phase:'ready',steer:0,points:0,health:100,warning:'',impacts:0,hitTime:0,lastHit:null});
    physics?.reset(s.x,s.z,s.yaw);debris.length=0;
    dynamics.reset(s.yaw);s.roll=s.pitch=0;
    $('ambulanceResult35').hidden=true;
  }
  function reset(){
    if(s.mounted){s.speed=0;physics.stop();exit();}else returnToBay();
    visit();updateUI();
  }
  function finish(success,reason='timeout'){
    s.phase=success?'complete':reason;s.points=success?150:0;s.speed=s.vx=s.vz=0;s.warning='';physics?.stop();controls.clear();keys.clear();
    $('ambulanceResultTitle35').textContent=success?'Challenge complete!':reason==='pedestrian'?'Challenge failed':reason==='breakdown'?'Vehicle broken down':reason==='water'?'Vehicle disabled':'Time is up';
    $('ambulanceResultText35').textContent=success?'Hospital reached in '+s.elapsed.toFixed(1)+' seconds. +150 points':reason==='pedestrian'?'You hit a pedestrian. Challenge failed.':reason==='breakdown'?'Challenge failed. The ambulance took too much damage.':reason==='water'?'Challenge failed. The ambulance entered the river.':'The hospital needed you in under 60 seconds.';
    $('ambulanceResult35').hidden=false;updateUI();
  }
  function update(dt,now=performance.now()){
    if(s.status!=='ready')return;
    updateEffects(clamp(dt,0,.1));
    if(s.mounted){
      if(s.phase==='running'){
        s.elapsed=Math.max(s.elapsed,(now-s.started)/1000);
        if(s.elapsed>=LIMIT){s.elapsed=LIMIT;finish(false);}
      }
      if(state.overview||distance([s.x,s.z],[player.position[0],player.position[2]])>4){s.speed=0;physics.stop();exit();return;}
      if(s.phase==='running'&&!state.paused&&!editing()&&!HubGuide.snapshot().dialogOpen){
        const has=k=>controls.has(k)||keys.has(k),drive=(has('w')||has('arrowup')?1:0)-(has('s')||has('arrowdown')?1:0);
        const turn=(has('a')||has('arrowleft')?1:0)-(has('d')||has('arrowright')?1:0);
        // Below 40 FPS use 60 Hz substeps (also tested): twelve 120 Hz steps per slow
        // frame made the next frame slower still on Chromebook-class CPUs.
        const frame=clamp(dt,0,.1),steps=Math.max(1,Math.ceil(frame*(frame>1/40?60:120))),step=frame/steps;
        for(let k=0;k<steps;k++){
          s.steer=turn*.55;
          if(step>0)Object.assign(s,physics.step(step,{throttle:drive,steer:turn,brake:has(' ')},height(s.x,s.z)));
          if(s.phase!=='running'){physics.stop();s.speed=s.vx=s.vz=0;break;}
          if(pedestrianContact()){finish(false,'pedestrian');break;}
          if(inWater()){s.health=0;finish(false,'water');break;}
          recoverRoute();
          if(s.next<route.length&&distance([s.x,s.z],route[s.next])<(s.next===route.length-1?1.2:2.3)){
            s.next++;if(s.next===route.length){finish(true);break;}
          }
        }
      }else{s.speed=0;physics.stop();controls.clear();keys.clear();}
      s.warning=routeWarning();
      dynamics.step(state.paused?0:dt,s.yaw,s.speed);s.roll=dynamics.state.roll;s.pitch=dynamics.state.pitch;
      seat();
    }
    if((!s.mounted||s.phase!=='running')&&!window.Rivian147?.snapshot().visible)physics?.coast(Math.min(dt,.033),height(s.x,s.z));
    updateUI();
  }
  async function load(){
    const r=await fetch('./ambulance35/ambulance.glb');if(!r.ok)throw Error('Ambulance could not load ('+r.status+').');
    const {json:j,bin}=parseGLB(await r.arrayBuffer()),cache=new Map();
    j.nodes.forEach((n,i)=>{nodes[i]={...n};for(const c of n.children||[])parents.set(c,i);});
    function walk(i){order.push(i);for(const c of nodes[i].children||[])walk(c);}for(const i of j.scenes[j.scene||0].nodes)walk(i);
    for(let i=0;i<nodes.length;i++){
      const n=nodes[i];if(n.mesh===undefined)continue;
      for(const p of j.meshes[n.mesh].primitives){
        const a=Object.fromEntries(Object.entries(p.attributes).map(([k,v])=>[k,accessor(j,bin,v)]));
        const idx=p.indices===undefined?Uint32Array.from({length:a.POSITION.length/3},(_,k)=>k):accessor(j,bin,p.indices);
        const normal=a.NORMAL||geometryNormals(a.POSITION,idx),v=new Float32Array(a.POSITION.length*2);
        for(let k=0;k<a.POSITION.length;k+=3)v.set([...a.POSITION.subarray(k,k+3),...normal.subarray(k,k+3)],k*2);
        const mat=j.materials?.[p.material]||{},pbr=mat.pbrMetallicRoughness||{},ti=pbr.baseColorTexture?.index;
        if(ti!==undefined&&!cache.has(ti)){const t=await embeddedGLBTexture(j,bin,ti);cache.set(ti,t);textures.push(t);}
        parts.push({node:i,batch:uploadBatch(v,idx,{uv:a.TEXCOORD_0,baseTexture:cache.get(ti)||null,color:pbr.baseColorFactor||[1,1,1,1],rough:.65,metal:.1})});
      }
    }
  }
  function buildScenery(){
    const map=new Map();
    function box(p,scale,color,yaw=0){
      const matrix=transform(p,scale,0,yaw),v=[],idx=[];
      for(let axis=0;axis<3;axis++)for(const side of [-1,1]){
        const n=[0,0,0];n[axis]=side;const base=v.length/6;
        for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1]]){const q=[0,0,0];q[axis]=side*.5;q[(axis+1)%3]=a*.5;q[(axis+2)%3]=b*.5;
          const normal=[n[0]*Math.cos(yaw)+n[2]*Math.sin(yaw),n[1],-n[0]*Math.sin(yaw)+n[2]*Math.cos(yaw)];v.push(...tp(matrix,...q),...normal);}
        idx.push(...(side>0?[0,1,2,0,2,3]:[0,2,1,0,3,2]).map(i=>base+i));
      }
      batchAdd(map,color.join(','),new Float32Array(v),new Uint32Array(idx),{color,rough:.85});
    }
    const red=[.8,.018,.028,1],gray=[.47,.49,.51,1],glass=[.17,.22,.24,1],white=[.86,.88,.89,1],gold=[1,.64,.04,1];
    // Replace one existing riverbank building, preserving all surrounding buildings.
    renderBatches=renderBatches.filter(b=>b.name!==HOSPITAL);
    const hx=-24.06,hz=-77.77,w=7.6,d=8.2,h=22;
    box([hx,h/2,hz],[w,h,d],gray);
    for(let row=0;row<8;row++)for(let col=0;col<4;col++){
      const y=2.6+row*2.4;
      for(const side of [-1,1]){
        box([hx-2.8+col*1.85,y,hz+side*(d/2+.02)],[1.65,2.15,.06],glass);
        box([hx+side*(w/2+.02),y,hz-3+col*2],[.06,2.15,1.8],glass);
      }
    }
    box([hx,1,hz+d/2+.07],[2.4,2,.13],glass);
    box([hx,2.8,hz+d/2+.9],[4.4,.3,2],red);
    for(const y of [h-.4]){box([hx,y,hz+d/2+.22],[1.1,5,.4],red);box([hx,y,hz+d/2+.25],[4.2,1.1,.42],red);}
    box([hx,h+.16,hz],[w,.25,d],white);
    box([hx+.7,h+.55,hz-.3],[4.8,.25,4.8],[.10,.13,.14,1]);
    const padPaint=new NetworkScene40.Mesh(gold);for(const x of [-.8,.8])padPaint.plane([hx+.7+x,h+.6755,hz-.3],[.32,2.7]);padPaint.plane([hx+.7,h+.676,hz-.3],[1.9,.32]);
    batchAdd(map,'helipad paint',new Float32Array(padPaint.v),new Uint32Array(padPaint.i),{color:gold,rough:1});
    box([hx-2.5,h+.8,hz-2.7],[1.6,1.6,1.6],gray);
    box([hx-2.5,h+.65,hz-1.88],[.7,1.3,.05],red);
    const chevrons=new NetworkScene40.Mesh([.025,.60,1,1]);
    for(const x of[-.85,0,.85])chevrons.line([x-.24,.55,0],[x+.24,0,0],.13).line([x+.24,0,0],[x-.24,-.55,0],.13);
    turnArrow=chevrons.build({unlit:true,emission:[.015,.22,.48]});
    const [fx,fz]=route.at(-1),fy=floorPaintHeight68(fx,fz,height(fx,fz));
    const finish=new NetworkScene40.Mesh(red).plane([fx,fy,fz],[2.7,.75]).plane([fx,fy+.0003,fz],[.75,2.7]);
    batchAdd(map,'finish',new Float32Array(finish.v),new Uint32Array(finish.i),{color:red,rough:1});
    scenery=finishBatches(map);
    const sign=document.createElement('canvas');sign.width=1024;sign.height=256;
    const ctx=sign.getContext('2d');ctx.fillStyle='#aa1826';ctx.fillRect(0,0,1024,256);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 116px Arial';ctx.fillText('HOSPITAL',512,138);
    const texture=gl.createTexture();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,sign);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.activeTexture(gl.TEXTURE0);
    scenery.push(uploadBatch(new Float32Array([hx-2.2,3.6,hz+d/2+.13,0,0,1,hx+2.2,3.6,hz+d/2+.13,0,0,1,hx+2.2,4.7,hz+d/2+.13,0,0,1,hx-2.2,4.7,hz+d/2+.13,0,0,1]),new Uint32Array([0,1,2,0,2,3]),{color:[1,1,1,1],baseTexture:texture,uv:new Float32Array([0,1,1,1,1,0,0,0]),rough:1}));
  }
  function draw(planes,lightingOnly=false){
    if(s.status!=='ready')return;
    if(!lightingOnly)drawDisplay(planes);
    gl.disable(gl.CULL_FACE);
    if(!lightingOnly)for(const b of scenery)drawBatch(b);
    if(!lightingOnly&&s.mounted&&s.phase==='running')for(const marker of turnMarkers){
      if(marker.index<s.next||distance([s.x,s.z],[marker.x,marker.z])>60)continue;
      const y=height(marker.x,marker.z)+2.25;
      if(sphereVisible([marker.x,y,marker.z],2,planes))drawBatch(turnArrow,transform([marker.x,y,marker.z],[marker.side,1,1],0,marker.yaw));
    }
    const y=height(s.x,s.z),axles=RoadPose117.axles(nodes.filter(n=>n.name?.startsWith('Wheel_')).map(n=>({offset:n.translation.map(v=>v*SCALE),radius:(n.extras?.radius||.355)*SCALE}))),fit=RoadPose117.rigid([s.x,y,s.z],s.yaw,axles,height);
    const jolt=Math.sin(s.hitTime*50)*s.hitTime*.08;
    const root=transform([s.x,fit.p[1]+.006+Math.abs(jolt),s.z],[SCALE,SCALE,SCALE],-fit.pitch+jolt,s.yaw);
    const c=Math.cos(s.roll||0),sn=Math.sin(s.roll||0),roll=[c,sn,0,0,-sn,c,0,0,0,0,1,0,0,0,0,1];
    const body=mm(root,mm(transform([0,.45,0]),mm(roll,mm(transform([0,0,0],[1,1,1],s.pitch||0),transform([0,-.45,0])))));
    for(const i of order){const n=nodes[i];let m=trs(n);
      if(n.name?.startsWith('Wheel_'))m=mm(transform(n.translation||[0,0,0],[1,1,1],0,n.extras?.front?s.steer:0),transform([0,0,0],[1,1,1],s.distance/(SCALE*(n.extras?.radius||.355))));
      worlds[i]=mm(worlds[parents.get(i)]||IDENTITY,m);
    }
    if(sphereVisible([s.x,y+.6,s.z],2,planes))for(const p of parts){
      const name=nodes[p.node].name||'',lamp=name.startsWith('Light_'),red=name.includes('_Red_');
      const flash=lampLit(red);
      p.batch.unlit=lamp&&flash;p.batch.emission=lamp&&flash?(red?[1,.015,.015]:[1,1,1]):[0,0,0];
      const wear=.55+s.health*.0045;
      if(!lamp)p.batch.color=[wear,wear,wear,1];
      let wheel=false;for(let i=p.node;i!==undefined;i=parents.get(i))if(nodes[i].name?.startsWith('Wheel_')){wheel=true;break;}
      drawBatch(p.batch,mm(wheel?root:body,worlds[p.node]),false,lamp?(red?[flash?1:.3,.01,.02,1]:[flash?1:.4,flash?1:.4,flash?1:.4,1]):null);
    }
    for(const p of debris)drawBatch(debrisMesh,transform([p.x,p.y,p.z],[p.size,p.size*.35,p.size*.7],p.spin,p.spin*.7),false,p.color);
  }
  function updateUI(){
    if(!uiPanel)return;
    const driving=s.mounted;
    document.body.classList.toggle('ambulance-driving',driving);AmbulanceMap120.draw(s,route);
    $('ambulancePrompt35').hidden=driving||!near()||s.phase!=='ready'||!!window.Forklift34?.mounted;
    $('ambulanceTimer35').textContent=s.status==='error'?'Unavailable':(LIMIT-s.elapsed).toFixed(1)+' s';
    $('ambulanceStatus35').textContent=s.error||({ready:'Hospital run · Under 60 seconds',running:labels[s.next]||'Hospital',complete:'Challenge complete · 150 points',timeout:'Time is up',abandoned:'Attempt ended',breakdown:'Challenge failed · Vehicle broken down',water:'Challenge failed · Vehicle disabled',pedestrian:'Challenge failed · Pedestrian collision'}[s.phase]);
    $('ambulanceHealth35').value=s.health;$('ambulanceHealthValue35').textContent=s.health+'%';
    $('ambulanceCondition35').classList.toggle('damaged',s.health<=30);
    $('ambulanceWarning35').textContent=s.warning;$('ambulanceWarning35').style.visibility=s.warning?'visible':'hidden';
    uiPanel.classList.toggle('impact',s.hitTime>.2);
    $('ambulanceDrive35').hidden=!driving;$('ambulanceVisit35').hidden=driving;
    $('ambulanceTimer35').classList.toggle('urgent',s.elapsed>=45);
    uiPanel.hidden=!!window.Forklift34?.mounted;
    const fork=$('forkliftPanel34');if(fork){if(driving&&!hiddenForklift){fork.hidden=true;hiddenForklift=true;}else if(!driving&&hiddenForklift){fork.hidden=false;hiddenForklift=false;}}
    const key=[driving,fork?.open,innerWidth,innerHeight].join(':');
    if(key!==layoutKey){layoutKey=key;const bounds=fork?.getBoundingClientRect();
      uiPanel.style.top=driving?'':innerWidth>650?(bounds?.bottom||140)+12+'px':'auto';
      uiPanel.style.bottom=driving||innerWidth>650?'':(bounds?innerHeight-bounds.y+12:150)+'px';
    }
  }
  function ui(){
    const style=document.createElement('style');style.textContent=`
      #ambulancePanel35{position:fixed;right:12px;top:218px;width:260px;max-width:calc(100vw - 24px);z-index:15;background:#152c32;color:#fff;border:1px solid #71888c;border-radius:5px;padding:12px;font:13px Arial}
      #ambulancePanel35 summary{cursor:pointer;font-weight:bold}#ambulancePanel35[open]{top:218px}body.ambulance-driving #ambulancePanel35{top:140px}
      #ambulanceTimer35{font-size:32px;font-variant-numeric:tabular-nums;font-weight:bold;margin-top:12px;color:#fff}#ambulanceTimer35.urgent{color:#ffb4b4}
      #ambulanceStatus35{line-height:1.5;margin:8px 0}#ambulancePanel35 button,#ambulanceResult35 button{border:1px solid #698187;background:#263c41;color:white;border-radius:4px;min-height:38px;padding:8px;cursor:pointer}
      #ambulanceControls35{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin:10px 0}#ambulanceControls35 button{touch-action:none;font-size:18px;padding:4px}
      #ambulanceCondition35{margin:10px 0}#ambulanceCondition35 label{display:flex;justify-content:space-between;margin-bottom:5px}#ambulanceHealth35{display:block;width:100%;height:12px;accent-color:#75d4a4}#ambulanceCondition35.damaged #ambulanceHealth35{accent-color:#ed675c}#ambulanceCondition35.damaged{color:#ffb4b4}#ambulancePanel35.impact{border-color:#ff635e;box-shadow:inset 0 0 0 2px #ff635e}
      #ambulanceWarning35{min-height:34px;margin:8px 0;color:#ffe295;font-weight:bold;line-height:17px}
      #ambulancePrompt35{position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:18;background:#a81924;color:white;border:1px solid white;border-radius:5px;padding:12px 18px}
      #ambulanceResult35{position:fixed;top:145px;left:50%;transform:translateX(-50%);width:min(360px,calc(100vw - 24px));padding:20px;background:#edf6f3;color:#17352d;border:2px solid #48a17d;border-radius:6px;z-index:18;text-align:center}
      #ambulanceResult35 strong{font-size:22px}#ambulanceResult35 p{line-height:1.5}#ambulanceResult35[hidden],#ambulancePrompt35[hidden],#ambulanceDrive35[hidden],#ambulanceVisit35[hidden],#ambulancePanel35[hidden]{display:none}
      
    `;document.head.append(style);
    uiPanel=document.createElement('details');uiPanel.id='ambulancePanel35';uiPanel.innerHTML='<summary>Health Science: ambulance run</summary><div id="ambulanceTimer35">60.0 s</div><p id="ambulanceStatus35"></p><button id="ambulanceVisit35">Visit ambulance</button> <button id="ambulanceRestart35" title="Restart challenge">Restart</button><div id="ambulanceDrive35" hidden><div id="ambulanceControls35"><button data-key="w" title="Accelerate" aria-label="Accelerate">↑</button><button data-key="s" title="Reverse" aria-label="Reverse">↓</button><button data-key="a" title="Steer left" aria-label="Steer left">←</button><button data-key="d" title="Steer right" aria-label="Steer right">→</button><button data-key=" " title="Brake" aria-label="Brake">■</button></div><button id="ambulanceExit35">Exit ambulance (T)</button></div>';
    uiPanel.querySelector('#ambulanceStatus35').insertAdjacentHTML('afterend','<div id="ambulanceCondition35"><label for="ambulanceHealth35">Vehicle health <span id="ambulanceHealthValue35">100%</span></label><progress id="ambulanceHealth35" max="100" value="100"></progress></div><p id="ambulanceWarning35" role="status"></p>');
    uiPanel.querySelector('#ambulanceDrive35').insertAdjacentHTML('beforeend',' <button id="ambulanceView35" title="Reset camera view" aria-label="Reset camera view">Reset view</button>');
    document.body.append(uiPanel);
    uiPanel.addEventListener('toggle',()=>{if(uiPanel.open&&$('forkliftPanel34'))$('forkliftPanel34').open=false;});
    $('forkliftPanel34')?.addEventListener('toggle',()=>{if($('forkliftPanel34').open)uiPanel.open=false;});
    const prompt=document.createElement('button');prompt.id='ambulancePrompt35';prompt.hidden=true;prompt.textContent='Press T to drive ambulance';prompt.onclick=enter;document.body.append(prompt);
    const result=document.createElement('section');result.id='ambulanceResult35';result.hidden=true;result.setAttribute('role','status');result.innerHTML='<strong id="ambulanceResultTitle35"></strong><p id="ambulanceResultText35"></p><button id="ambulanceAgain35">Try again</button> <button id="ambulanceDismiss35">Close</button>';document.body.append(result);
    $('ambulanceVisit35').onclick=visit;$('ambulanceRestart35').onclick=$('ambulanceAgain35').onclick=()=>{reset();visit();};$('ambulanceExit35').onclick=exit;$('ambulanceDismiss35').onclick=()=>result.hidden=true;
    $('ambulanceView35').onclick=resetView;
    canvas.addEventListener('wheel',e=>{
      if(!s.mounted||state.overview)return;
      e.preventDefault();e.stopImmediatePropagation();
      const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);
      state.radius=clamp(state.radius*Math.exp(clamp(delta,-1000,1000)*.001),2.8,12);state.firstPerson=false;
      updateCamera(0,true);
    },{capture:true,passive:false});
    for(const b of uiPanel.querySelectorAll('[data-key]')){
      b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);controls.add(b.dataset.key);};
      b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>controls.delete(b.dataset.key);
    }
    window.addEventListener('keydown',e=>{
      if(editing())return;const k=e.key.toLowerCase();
      if(k==='t'&&(s.mounted||near())&&!window.Forklift34?.mounted){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)(s.mounted?exit:enter)();return;}
      if(s.mounted&&['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' ','escape'].includes(k)){
        e.preventDefault();e.stopImmediatePropagation();if(k==='escape'){s.speed=0;physics.stop();exit();}else controls.add(k);
      }
    },true);
    window.addEventListener('keyup',e=>{controls.delete(e.key.toLowerCase());});
    window.addEventListener('blur',()=>{controls.clear();keys.clear();s.speed=0;physics?.stop();});
  }
  function drawDisplay(planes){
    const position=[56.8,floorHeightAt(56.8,-23.2),-23.2];
    if(!sphereVisible(add(position,[0,.8,0]),2.3,planes))return;
    const root=transform(position,[.4,.4,.4],0,-Math.PI/4),bind=[];
    for(const i of order)bind[i]=mm(bind[parents.get(i)]||IDENTITY,trs(nodes[i]));
    gl.disable(gl.CULL_FACE);
    for(const p of parts){const unlit=p.batch.unlit,emission=p.batch.emission;p.batch.unlit=false;p.batch.emission=[0,0,0];drawBatch(p.batch,mm(root,bind[p.node]));p.batch.unlit=unlit;p.batch.emission=emission;}
  }
  async function init(){ui();AmbulanceMap120.init();try{await load();buildScenery();buildPhysics();s.status='ready';}catch(e){s.status='error';s.error=e.message;console.error(e);}updateUI();}
  return {init,update,draw,drawLighting:planes=>draw(planes,true),visit,enter,exit,reset,vehicleCamera,refreshWorld:buildPhysics,get mounted(){return s.mounted;},snapshot:()=>({...s,followYaw:dynamics.state.followYaw,route:route.map(p=>[...p]),parked:{...parked},turnMarkers:turnMarkers.map(p=>({...p})),navigation:'floating-blue-turn-chevrons'}),test:{state:s,controls,height,onCourse,blocked,nodes,worlds,lampLit,debris,pedestrianContact,dynamics,chase:CHASE,get physics(){return physics;},place(x,z,yaw){Object.assign(s,{x,z,yaw,speed:0,roll:0,pitch:0});physics.reset(s.x,s.z,yaw);dynamics.reset(yaw);if(s.mounted)seat();}}};
})();
window.Ambulance35=Ambulance35;
{
  const walk=advancePlayer,avatar=renderAvatar,actor=drawActor,update=RobotExhibit20.update,draw=RobotExhibit20.draw,view=updateCamera;
  updateCamera=function(dt,immediate=false){if(!Ambulance35.vehicleCamera(dt,immediate))view(dt,immediate);};
  advancePlayer=function(dt,input){if(!Ambulance35.mounted)walk(dt,input);};
  renderAvatar=function(){if(!Ambulance35.mounted)avatar();};
  drawActor=function(a,planes){if(!a.player||!Ambulance35.mounted)actor(a,planes);};
  RobotExhibit20.update=function(dt){update(dt);Ambulance35.update(dt);document.body.classList.toggle('ambulance-driving',Ambulance35.mounted);};
  RobotExhibit20.draw=function(planes){draw(planes);Ambulance35.draw(planes);};
  const start=()=>{if(!state.ready){setTimeout(start,250);return;}Ambulance35.init();};start();
}
