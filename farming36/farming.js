/* Agriculture challenge: the supplied combine and tractor-baler in the venue world. */
const Farming36=(()=>{
 'use strict';
 const SCALE=HarvestCore36.vehicleScale,R=SCALE/.6,Y=.14,FIELD=HarvestCore36.field,START_X=HarvestCore36.rows.at(-1);
 const controls=new Set(),models={},removed=new Set(),effects=[];
 const silos=[{x:-63,z:-21},{x:-56,z:-21}];
 let auger=0,unloading=false;
 let wheat;
 async function loadWheat(){
  const base='./farming36/wheat/',response=await fetch(base+'source/model.dae');
  if(!response.ok)throw Error('Wheat model could not load');
  const xml=new DOMParser().parseFromString(await response.text(),'application/xml');
  if(xml.querySelector('parsererror'))throw Error('Invalid wheat model');
  const numbers=selector=>xml.querySelector(selector).textContent.trim().split(/\s+/).map(Number);
  const positions=numbers('[id="meshId0-positions-array"]'),uv=numbers('[id="meshId0-tex0-array"]'),indices=numbers('polylist p');
  if(numbers('vcount').some(n=>n!==3))throw Error('Wheat model must contain triangles');
  const load=name=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Wheat texture could not load'));img.src=base+'textures/'+name;});
  const color=await load('blinn1SG_albedo.jpeg'),mask=await load('blinn1SG_opacity.jpeg');
  const surface=document.createElement('canvas');surface.width=color.width;surface.height=color.height;
  const ctx=surface.getContext('2d',{willReadFrequently:true});ctx.drawImage(color,0,0);const rgba=ctx.getImageData(0,0,surface.width,surface.height);
  ctx.drawImage(mask,0,0,surface.width,surface.height);const alpha=ctx.getImageData(0,0,surface.width,surface.height);
  for(let i=3;i<rgba.data.length;i+=4)rgba.data[i]=alpha.data[i-3];ctx.putImageData(rgba,0,0);
  const texture=gl.createTexture(),flip=gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,surface);gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,flip);
  wheat={positions,uv,indices,texture};
 }
 const hopper=silo=>({x:silo.x,z:silo.z+4});
 function pipeTip(car=vehicles.combine,angle=auger*Math.PI/2){
  const root=transform([car.x,Y,car.z],[SCALE,SCALE,SCALE],0,car.yaw+Math.PI);
  return tp(mm(root,mm(transform([1.15,3.83,-.2]),transform([0,0,0],[1,1,1],0,angle))),.66,-.33,4.46);
 }
 function receivingSilo(){const p=pipeTip();return silos.find(silo=>{const h=hopper(silo);return Math.hypot(p[0]-h.x,p[2]-h.z)<.85;});}
 function toggleUnload(){
  if(s.stage==='failed')return;
  if(!s.mounted||s.vehicle!=='combine')return;
  if(unloading){unloading=false;return;}
  if(Math.abs(v().speed)>.15){toast('Stop the combine before unloading.');return;}
  if(!crop.snapshot().grain){toast('Grain tank is empty.');return;}
  const tip=pipeTip(v(),Math.PI/2);
  if(!silos.some(silo=>{const h=hopper(silo);return Math.hypot(tip[0]-h.x,tip[2]-h.z)<.85;})){toast('Park beside a silo hopper with the auger over it.');return;}
  unloading=true;controls.clear();keys.clear();
 }
 const s={status:'loading',stage:'harvest',mounted:false,vehicle:'combine',points:0,error:null};
 const vehicles={combine:{x:START_X,z:28,yaw:Math.PI,speed:0,distance:0},tractor:{x:-30,z:28,yaw:Math.PI,speed:0,distance:0}};
 let crop=HarvestCore36.create(),panel,saved,scenery=[],hayMeshes=[],cube,physics={},parked={},trailer={x:-30,z:28+3.18*R,yaw:Math.PI},cropBatch,cropVertices,cellStride=0,lastMap=-1,clock=0;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const inside=(x,z)=>x>=FIELD.left&&x<=FIELD.right&&z>=FIELD.north&&z<=FIELD.south;
 const editing=()=>['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||document.activeElement?.isContentEditable;
 const otherMounted=()=>window.Forklift34?.mounted||window.Ambulance35?.mounted||window.FarmVehicles53?.mounted||window.FarmTruck67?.mounted;
 const v=()=>vehicles[s.vehicle];
 const local=(vehicle,x,z)=>({x:vehicle.x+Math.cos(vehicle.yaw)*x+Math.sin(vehicle.yaw)*z,z:vehicle.z-Math.sin(vehicle.yaw)*x+Math.cos(vehicle.yaw)*z});
 const overlap=c=>c.lo[0]<FIELD.right&&c.hi[0]>FIELD.left&&c.lo[2]<FIELD.south&&c.hi[2]>FIELD.north;
 function registerBox(name,lo,hi,kind='solidCollider'){
  const points=new Float32Array([lo[0],lo[1],lo[2],hi[0],lo[1],lo[2],hi[0],hi[1],lo[2],lo[0],hi[1],lo[2],lo[0],lo[1],hi[2],hi[0],lo[1],hi[2],hi[0],hi[1],hi[2],lo[0],hi[1],hi[2]]);
  registerCollider(name,kind,points,new Uint32Array([0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,3,7,6,3,6,2,0,4,7,0,7,3,1,2,6,1,6,5]),false,{walktestBarrier:true});
 }
 function clearSite(){
  if(window.FarmScene63)return;
  const west=baselineColliders.find(c=>c.boundary&&/west_boundary/.test(c.name));
  for(const c of colliders)if(/^City_West_.*_footprint_collider$/.test(c.name)&&overlap(c))removed.add(c.name.replace(/_footprint_collider$/,''));
  const keep=b=>!removed.has(b.name);
  renderBatches=renderBatches.filter(keep);baseRenderBatches=baseRenderBatches.filter(keep);
  baselineColliders=baselineColliders.filter(c=>!removed.has(c.name.replace(/_footprint_collider$/,''))&&
   !(c.boundary&&/west_boundary/.test(c.name))&&
   !(/^City_(?:sidewalk|street)/.test(c.name)&&c.lo[0]>=FIELD.left&&c.hi[0]<=FIELD.right&&c.lo[2]>=FIELD.north&&c.hi[2]<=FIELD.south));
  reindexBasePhysics();
  if(west)for(const [start,end] of [[west.lo[2],FIELD.north],[FIELD.south,west.hi[2]]]){
   if(end<=start)continue;
   registerBox(west.name+'_'+start,[west.lo[0],west.lo[1],start],[west.hi[0],west.hi[1],end],'walkBoundaryCollider');baselineColliders.push(colliders.at(-1));
  }
  lastSunRoof=null;
 }
 async function loadModel(name){
  const response=await fetch('./farming36/'+name+'.glb?v=grain1');if(!response.ok)throw Error(name+' could not load ('+response.status+')');
  const {json:j,bin}=parseGLB(await response.arrayBuffer()),parts=[],textures=new Map();
  for(const node of j.nodes){
   for(const p of j.meshes[node.mesh].primitives){
    const pos=accessor(j,bin,p.attributes.POSITION),normal=accessor(j,bin,p.attributes.NORMAL),uv=accessor(j,bin,p.attributes.TEXCOORD_0),indices=accessor(j,bin,p.indices),vertices=new Float32Array(pos.length*2);
    for(let i=0;i<pos.length;i+=3)vertices.set([...pos.subarray(i,i+3),...normal.subarray(i,i+3)],i*2);
    const mat=j.materials[p.material],pbr=mat.pbrMetallicRoughness,ti=pbr.baseColorTexture?.index;
    if(ti!==undefined&&!textures.has(ti))textures.set(ti,await embeddedGLBTexture(j,bin,ti));
    parts.push({node,batch:uploadBatch(vertices,indices,{color:pbr.baseColorFactor,rough:pbr.roughnessFactor,metal:pbr.metallicFactor,baseTexture:textures.get(ti)||null,uv,alphaCutoff:mat.alphaMode==='MASK'?.2:-1}),transparent:mat.alphaMode==='BLEND'});
   }
  }
  models[name]=parts.sort((a,b)=>a.transparent-b.transparent);
 }
 function planeGeometry(map,p,size,color){const mesh=new NetworkScene40.Mesh(color).plane(p,size);batchAdd(map,color.join(','),new Float32Array(mesh.v),new Uint32Array(mesh.i),{color,rough:1});}
 function boxGeometry(map,p,size,color,yaw=0){
  const vertices=[],indices=[],m=transform(p,size,0,yaw);
  for(let axis=0;axis<3;axis++)for(const side of [-1,1]){
   const n=[0,0,0];n[axis]=side;const base=vertices.length/6;
   for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
    const q=[0,0,0];q[axis]=side*.5;q[(axis+1)%3]=a*.5;q[(axis+2)%3]=b*.5;
    vertices.push(...tp(m,...q),n[0]*Math.cos(yaw)+n[2]*Math.sin(yaw),n[1],-n[0]*Math.sin(yaw)+n[2]*Math.cos(yaw));
   }
   indices.push(...(side>0?[0,1,2,0,2,3]:[0,2,1,0,3,2]).map(i=>base+i));
  }
  batchAdd(map,color.join(','),new Float32Array(vertices),new Uint32Array(indices),{color,rough:1});
 }
 function tubeGeometry(map,a,b,r1,r2,color){
  const axis=norm(sub(b,a)),u=norm(cross(axis,Math.abs(axis[1])>.9?[1,0,0]:[0,1,0])),w=cross(axis,u),vertices=[],indices=[],segments=48;
  for(let i=0;i<=segments;i++){
   const angle=i/segments*Math.PI*2,n=add(mul(u,Math.cos(angle)),mul(w,Math.sin(angle)));
   for(const [p,r] of [[a,r1],[b,r2]])vertices.push(...add(p,mul(n,r)),...norm(add(n,mul(axis,(r1-r2)/len(sub(b,a))))));
   if(i<segments){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
  }
  batchAdd(map,color.join(','),new Float32Array(vertices),new Uint32Array(indices),{color,rough:.65,metal:.45});
 }
 function buildSilos(map,shapes){
  for(const silo of silos){
   const {x,z}=silo,h=hopper(silo),metal=[.45,.48,.50,1],dark=[.24,.27,.28,1];
   tubeGeometry(map,[x,Y,z],[x,Y+.18,z],2.3,2.3,[.47,.46,.43,1]);
   tubeGeometry(map,[x,Y+.18,z],[x,Y+5.4,z],2,2,metal);
   for(let y=.25;y<5.4;y+=.13)tubeGeometry(map,[x,Y+y,z],[x,Y+y+.045,z],2.035,2.035,[.57,.60,.61,1]);
   tubeGeometry(map,[x,Y+5.4,z],[x,Y+6.6,z],2.1,.2,metal);
   tubeGeometry(map,[x,Y+6.6,z],[x,Y+6.7,z],.25,0,dark);
   for(let i=0;i<12;i++){const a=i*Math.PI/6;const dx=Math.cos(a),dz=Math.sin(a);
    tubeGeometry(map,[x+dx*2.04,Y+.2,z+dz*2.04],[x+dx*2.04,Y+5.4,z+dz*2.04],.025,.025,dark);
    tubeGeometry(map,[x+dx*2.1,Y+5.4,z+dz*2.1],[x+dx*.2,Y+6.6,z+dz*.2],.025,.025,dark);
   }
   for(const dx of [-.23,.23])tubeGeometry(map,[x+dx,Y+.2,z+2.12],[x+dx,Y+5.6,z+2.12],.035,.035,dark);
   for(let y=.3;y<5.5;y+=.28)tubeGeometry(map,[x-.23,Y+y,z+2.12],[x+.23,Y+y,z+2.12],.025,.025,dark);
   boxGeometry(map,[h.x,Y+.08,h.z],[2,.16,2],[.3,.31,.3,1]);
   tubeGeometry(map,[h.x,Y+.18,h.z],[h.x,Y+.75,h.z],.25,1,metal);
   tubeGeometry(map,[h.x,Y+.2,h.z],[h.x-2.25,Y+.4,h.z],.12,.12,dark);
   tubeGeometry(map,[h.x-2.25,Y+.4,h.z],[x-2.25,Y+6.9,z],.12,.12,metal);
   tubeGeometry(map,[x-2.25,Y+6.9,z],[x,Y+6.65,z],.12,.12,metal);
   boxGeometry(map,[h.x-2.25,Y+.3,h.z],[.45,.4,.45],[.1,.23,.13,1]);
   // Painted parking bay puts the deployed auger above the receiving hopper.
   for(const dx of [1.2,3.3])planeGeometry(map,[h.x+dx,Y+.0006,h.z-.34],[.06,4.6],[.85,.72,.18,1]);
   shapes.push({name:'Grain silo',x,z,radius:2.1,minY:Y,maxY:Y+6.7});
   registerBox('Farm_grain_silo',[x-2,Y,z-2],[x+2,Y+6.7,z+2]);
   shapes.push({name:'Grain hopper',points:[[h.x-.4,h.z-.4],[h.x+.4,h.z-.4],[h.x+.4,h.z+.4],[h.x-.4,h.z+.4]],minY:Y,maxY:Y+.75});
   registerBox('Farm_grain_hopper',[h.x-.4,Y,h.z-.4],[h.x+.4,Y+.75,h.z+.4]);
  }
 }
 function buildField(){
  const baseCount=colliders.length;
  const map=new Map(),shapes=[],soil=[.48,.32,.19,1],stubble=[.52,.36,.22,1];
  // One top surface per point: the planted rectangle and four adjoining headlands.
  for(const [x,z,w,d] of [[-65.1,5,5.8,60],[-29.5,5,7,60],[-47.6,-18.7,29.2,12.6],[-47.6,25.6,29.2,10.4],[-61.6,32.9,1.2,4.2],[-42,32.9,18,4.2]])planeGeometry(map,[x,Y,z],[w,d],soil);
  planeGeometry(map,[-47.6,Y,4],[29.2,32.8],stubble);
  // Mown headlands leave room to turn both machines around the planted area.
  for(let z=-23;z<35;z+=1.1)planeGeometry(map,[-47,Y+.008,z],[41,.025],[.44,.29,.17,1]);
  // The shared corn/wheat perimeter is supplied by FarmBoundary48.
  const ground=new Float32Array([-68,Y,-25,-26,Y,-25,-26,Y,35,-68,Y,35]);
  registerCollider('Farm_field_surface','floor',ground,new Uint32Array([0,2,1,0,3,2]),false,{});
  buildSilos(map,shapes);
  baselineColliders.push(...colliders.slice(baseCount));
  scenery=finishBatches(map);cube=createCube();
  const hayMap=new Map();
  for(let i=0;i<35;i++){
   const x=Math.sin(i*2.4)*.31,z=Math.sin(i*4.7)*.35,y=.04+(1-Math.abs(x)/.34)*.1;
   boxGeometry(hayMap,[x,y,z],[.035,.025,.36+(i%4)*.09],i%2?[.64,.53,.23,1]:[.77,.66,.31,1],Math.sin(i)*.65);
  }
  hayMeshes=finishBatches(hayMap);
  const obstacles=window.FarmScene63?[]:Ambulance35.test.physics.shapes.filter(o=>!removed.has(o.name.replace(/_footprint_collider$/,'')));
  for(const name of ['combine','tractor']){
   physics[name]=AmbulancePhysics35.create([...obstacles,...shapes],()=>{},name==='combine'?{width:4.9*R,length:5.5*R,height:3*R,maxSpeed:2.8,reverseSpeed:1.5,steerAngle:.7,wheelbase:1.8*R,lateralGrip:60}:{width:1.55*R,length:3.4*R,height:2.1*R,maxSpeed:3.2,reverseSpeed:1.5,steerAngle:.6,wheelbase:1.55*R,lateralGrip:60});
   const car=vehicles[name];physics[name].reset(car.x,car.z,car.yaw);
   const other=name==='combine'?'tractor':'combine';
   parked[name]=Matter.Bodies.rectangle(vehicles[other].x*100,vehicles[other].z*100,(other==='combine'?4.9:1.55)*R*100,(other==='combine'?5.5:3.4)*R*100,{isStatic:true,label:'Parked '+other});
   Matter.Composite.add(physics[name].engine.world,parked[name]);
  }
  buildCrop();
 }
 function buildCrop(){
  let seed=791;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  const vertices=[],indices=[],uv=[];
  for(const cell of crop.cells){
   for(let tuft=0;tuft<2;tuft++){
    const x=cell.x+(rand()-.5)*.6,z=cell.z+(rand()-.5)*.6,h=.65+rand()*.2,a=rand()*Math.PI*2,cs=Math.cos(a),sn=Math.sin(a),base=vertices.length/6;
    for(let i=0;i<wheat.positions.length;i+=3){
     const dx=wheat.positions[i]*.4,dz=wheat.positions[i+2]*.4;
     vertices.push(x+dx*cs+dz*sn,Y+(wheat.positions[i+1]+1)*h/2,z-dx*sn+dz*cs,0,1,0);
    }
    uv.push(...wheat.uv);indices.push(...wheat.indices.map(i=>base+i));
   }
  }
  cellStride=vertices.length/crop.cells.length;cropVertices=new Float32Array(vertices);
  cropBatch=uploadBatch(cropVertices,new Uint32Array(indices),{color:[1,1,1,1],rough:1,unlit:true,baseTexture:wheat.texture,uv:new Float32Array(uv),alphaCutoff:.22});
 }
 function flattenCrop(){
  gl.bindBuffer(gl.ARRAY_BUFFER,cropBatch.vbo);
  crop.cells.forEach((c,i)=>{if(!c.cut||c.drawn)return;c.drawn=true;
   const start=i*cellStride,end=start+cellStride;
   for(let n=start+1;n<end;n+=6)cropVertices[n]=Y+(cropVertices[n]-Y)*.1;
   gl.bufferSubData(gl.ARRAY_BUFFER,start*4,cropVertices.subarray(start,end));
  });
 }
 function nearVehicle(){
  if(!window.FarmScene63?.active||s.status!=='ready'||otherMounted()||state.overview)return null;
  for(const name of ['combine','tractor'].sort((a,b)=>Math.hypot(player.position[0]-vehicles[a].x,player.position[2]-vehicles[a].z)-Math.hypot(player.position[0]-vehicles[b].x,player.position[2]-vehicles[b].z))){
   const car=vehicles[name];if(Math.hypot(player.position[0]-car.x,player.position[2]-car.z)<3.5&&Math.abs(player.position[1]-Y)<3)return name;
  }
  return null;
 }
 function visit(name=s.stage==='harvest'?'combine':'tractor'){
  if(s.status!=='ready'||s.mounted||otherMounted())return;
  const car=vehicles[name];
  places.farm36={label:'Agriculture: hay field',p:[car.x+2.5,Y+PHYSICS.radii[1]+.02,car.z],scaledPlayer:true,yaw:Math.PI/2};
  teleport('farm36');panel.open=true;canvas.focus();
 }
 function enter(name=nearVehicle()){
  if(s.stage==='failed'){toast('Challenge failed. Restart to try again.');return;}
  if(!name||s.mounted||otherMounted()||s.status!=='ready'||editing()||state.paused||HubGuide.snapshot().dialogOpen||nearVehicle()!==name)return;
  saved={radius:state.radius,pitch:state.pitch,orbitYaw:state.orbitYaw,firstPerson:state.firstPerson,ghost:state.ghost};
  s.vehicle=name;s.mounted=true;Object.assign(state,{radius:7,pitch:.48,orbitYaw:.28,firstPerson:false,ghost:false,overview:null});
  controls.clear();keys.clear();panel.open=true;seat();updateCamera(0,true);updateUI();canvas.focus();
 }
 function cab(){return s.vehicle==='combine'?{seat:[.23,2.94,-1.88],wheel:[.17,3.06,-2.51],radius:.18}:{seat:[.03,1.87,.60],wheel:[0,2.1,-.12],radius:.21};}
 function seat(actor=characterState.player,hip=null){
  const car=v(),root=transform([car.x,Y,car.z],[SCALE,SCALE,SCALE],0,car.yaw+Math.PI),position=tp(root,...cab().seat);
  let offset=[0,.38,0];
  if(actor){
   const m=actor.model,index=m.skins[0].joints[0];
   if(!actor.farmBindHip){const bind=[];for(const i of m.order)bind[i]=mm(bind[m.parents.get(i)]||IDENTITY,trs(m.j.nodes[i]));actor.farmBindHip=bind[index].slice(12,15);}
   const h=hip||actor.world[index]||null,scale=m.scale*sectorScaleAt(car.x,car.z);
   offset=tp(mm(transform([0,0,0],[scale,scale,scale],0,car.yaw),transform(m.offset)),actor.farmBindHip[0],h?.[13]??actor.farmBindHip[1],actor.farmBindHip[2]);
  }
  player.position=[position[0]-offset[0],position[1]-offset[1]+PHYSICS.radii[1],position[2]-offset[2]];
  player.yaw=car.yaw+Math.PI;player.walkAmount=0;player.vy=0;player.grounded=true;
 }
 const quaternionMultiply=([x,y,z,w],[a,b,c,d])=>[w*a+x*d+y*c-z*b,w*b-x*c+y*d+z*a,w*c+x*b-y*a+z*d,w*d-x*a-y*b-z*c];
 function seatedPose(a){
  if(!s.mounted||!a.player)return;
  const m=a.model;
  for(let i=0;i<m.j.nodes.length;i++){
   const name=m.j.nodes[i].name||'',angle=/upleg|thigh/i.test(name)?(m.seatedLegSign||1)*Math.PI/2:/(?:left|right)leg|calf/i.test(name)?-(m.seatedLegSign||1)*Math.PI/2:/(?:^|:)Spine$/.test(name)?.44:null;
   if(angle===null)continue;
   delete a.pose[i].matrix;a.pose[i].rotation=quaternionMultiply(m.j.nodes[i].rotation||[0,0,0,1],[Math.sin(angle/2),0,0,Math.cos(angle/2)]);
  }
  if(!a.farmArms)a.farmArms=['Left','Right'].map(side=>{
   const find=part=>m.j.nodes.findIndex(n=>(n.name||'').split(':').pop()===side+part);
   return {upper:find('Arm'),elbow:find('ForeArm'),hand:find('Hand'),palm:find('HandMiddle1')>=0?find('HandMiddle1'):find('HandIndex1')};
  });
  const world=[],rebuild=()=>{for(const i of m.order)world[i]=mm(world[m.parents.get(i)]||IDENTITY,trs(a.pose[i]));};rebuild();
  const hip=world[m.skins[0].joints[0]];seat(a,hip);
  const correction=[hip[12]-a.farmBindHip[0],0,hip[14]-a.farmBindHip[2]],inverse=CharacterFitting.invert4(actorMatrix(a)),car=v();
  const root=transform([car.x,Y,car.z],[SCALE,SCALE,SCALE],0,car.yaw+Math.PI),config=cab();a.farmGripTargets=[];
  for(let side=0;side<2;side++){
   const arm=a.farmArms[side],end=arm.palm>=0?arm.palm:arm.hand;if(arm.upper<0||arm.elbow<0||end<0)continue;
   const grip=tp(root,config.wheel[0]+(side===0?-1:1)*config.radius,config.wheel[1],config.wheel[2]);a.farmGripTargets[side]=grip;
   const goal=add(tp(inverse,...grip),correction);
   // Solve each palm onto the supplied model's steering-wheel rim.
   for(let iteration=0;iteration<12;iteration++)for(const joint of [arm.elbow,arm.upper]){
    const parentInverse=CharacterFitting.invert4(world[m.parents.get(joint)]||IDENTITY),origin=tp(parentInverse,...world[joint].slice(12,15));
    const from=norm(sub(tp(parentInverse,...world[end].slice(12,15)),origin)),to=norm(sub(tp(parentInverse,...goal),origin)),w=1+clamp(dot(from,to),-1,1);
    if(w<1e-6)continue;
    delete a.pose[joint].matrix;a.pose[joint].rotation=quaternionMultiply(norm([...cross(from,to),w]),a.pose[joint].rotation);rebuild();
   }
  }
 }
 function exit(immediate=false){
  if(!s.mounted)return;
  if(immediate===true){physics[s.vehicle].stop();v().speed=0;}
  if(Math.abs(v().speed)>.15){toast('Stop before exiting the vehicle.');return;}
  const car=v(),p=local(car,3*R,0);s.mounted=false;unloading=false;physics[s.vehicle].stop();controls.clear();keys.clear();Object.assign(state,saved);
  player.position=[p.x,Y+PHYSICS.radii[1]+.03,p.z];player.vy=0;updateCamera(0,true);updateUI();
  const actor=characterState.player;if(actor){actor.pose=actor.model.j.nodes.map(n=>({...n,translation:[...(n.translation||[0,0,0])],rotation:[...(n.rotation||[0,0,0,1])],scale:[...(n.scale||[1,1,1])]}));delete actor.previous;actor.blend=1;poseActor(actor,0,true);}
 }
 function switchVehicle(){
  if(s.stage==='failed')return;
  if(!s.mounted)return;
  const next=s.vehicle==='combine'?'tractor':'combine';
  physics[s.vehicle].stop();v().speed=0;exit();visit(next);enter(next);
 }
 function reset(){
  if(s.status!=='ready'||otherMounted())return;
  if(s.mounted){physics[s.vehicle].stop();v().speed=0;exit();}
  crop=HarvestCore36.create();s.stage='harvest';s.points=0;s.vehicle='combine';clock=0;lastMap=-1;effects.length=0;auger=0;unloading=false;
  Object.assign(vehicles.combine,{x:START_X,z:28,yaw:Math.PI,speed:0,distance:0});Object.assign(vehicles.tractor,{x:-30,z:28,yaw:Math.PI,speed:0,distance:0});
  trailer={x:-30,z:28+3.18*R,yaw:Math.PI};for(const name of ['combine','tractor']){const car=vehicles[name];physics[name].reset(car.x,car.z,car.yaw);}
  gl.deleteBuffer(cropBatch.vbo);gl.deleteBuffer(cropBatch.ibo);gl.deleteVertexArray(cropBatch.vao);buildCrop();$('farmResult36').hidden=true;updateUI();
 }
 function updateTrailer(dt){
  const car=vehicles.tractor,hitch=local(car,0,-1.08*R),dx=hitch.x-trailer.x,dz=hitch.z-trailer.z;
  if(Math.hypot(dx,dz)>.001)trailer.yaw=Math.atan2(dx,dz);
  const limit=.9,difference=Math.atan2(Math.sin(trailer.yaw-car.yaw),Math.cos(trailer.yaw-car.yaw));
  trailer.yaw=car.yaw+clamp(difference,-limit,limit);
  trailer.x=hitch.x-Math.sin(trailer.yaw)*2.1*R;trailer.z=hitch.z-Math.cos(trailer.yaw)*2.1*R;
 }
 function pedestrianContact(){
  const crowd=CrowdGraphics.ready?EventFlow22.combined(crowdState.sim?.agents||[]):[];
  const people=[...crowd,...(state.showStaff===false?[]:[...crowdState.staff,...characterState.actors.filter(a=>!a.player)])].filter(a=>!window.FarmScene63?.active||a.scene==='farm');
  const car=v(),parts=s.vehicle==='combine'?[[car,1.8*R,4.4*R],[{...local(car,0,3.02*R),yaw:car.yaw},4.9*R,.96*R]]:[[car,1.55*R,3.4*R],[trailer,1.8*R,2.3*R]];
  for(const a of people){
   if(a.player||a===characterState.player||!a.model)continue;
   const x=a.renderX??a.x??a.position?.[0],z=a.renderZ??a.z??a.position?.[2];
   if(!Number.isFinite(x)||!Number.isFinite(z))continue;
   const base=a.position?.[1]??floorHeightAt(x,z)+.004;
   if(base>Y+2||base+.72<Y+.15)continue;
   for(const [p,width,length] of parts){
    const dx=x-p.x,dz=z-p.z,c=Math.cos(p.yaw),sn=Math.sin(p.yaw);
    if(Math.hypot(Math.max(0,Math.abs(dx*c-dz*sn)-width/2),Math.max(0,Math.abs(dx*sn+dz*c)-length/2))<.17)return a;
   }
  }
  return null;
 }
 function failPedestrian(){
  s.stage='failed';s.points=0;unloading=false;controls.clear();keys.clear();
  for(const name of ['combine','tractor']){physics[name].stop();vehicles[name].speed=0;}
  $('farmResult36').querySelector('strong').textContent='Challenge failed';
  $('farmResultDetail36').textContent='You hit a pedestrian. Challenge failed. Restart to begin again.';
  $('farmAgain36').textContent='Restart challenge';$('farmResult36').hidden=false;
 }
 function update(dt){
  if(window.FarmScene63&&!FarmScene63.active){updateUI();return;}
  if(s.status!=='ready'){updateUI();return;}
  dt=clamp(dt,0,.1);clock+=dt;
  if(s.mounted&&(state.overview||Math.hypot(player.position[0]-v().x,player.position[2]-v().z)>6)){physics[s.vehicle].stop();v().speed=0;exit();}
  const active=s.mounted&&s.stage!=='failed'&&!state.paused&&!editing()&&!HubGuide.snapshot().dialogOpen;
  const frame=active?dt:0,steps=Math.max(1,Math.ceil(frame/(1/120))),step=frame/steps;
  for(let i=0;i<steps;i++){
   if(active){
    const car=v(),has=k=>controls.has(k)||keys.has(k),throttle=(has('w')||has('arrowup')?1:0)-(has('s')||has('arrowdown')?1:0),steer=(has('a')||has('arrowleft')?1:0)-(has('d')||has('arrowright')?1:0);
    car.steer=steer;
    const other=vehicles[s.vehicle==='combine'?'tractor':'combine'];Matter.Body.setPosition(parked[s.vehicle],{x:other.x*100,y:other.z*100});Matter.Body.setAngle(parked[s.vehicle],-other.yaw);
    Object.assign(car,physics[s.vehicle].step(step,{throttle,steer,brake:has(' ')||s.stage==='complete'||s.vehicle==='combine'&&(unloading||auger>0)},Y));
    auger=clamp(auger+(unloading?1:-1)*step/.9,0,1);
    if(unloading&&s.vehicle==='combine'&&auger===1&&Math.abs(car.speed)<.15&&receivingSilo()){
     const amount=crop.unload(90*step),p=pipeTip();
     if(amount>0)effects.push({x:p[0],y:p[1],z:p[2],vx:(Math.random()-.5)*.08,vz:(Math.random()-.5)*.08,vy:-.6,life:.8,grain:true});
     if(crop.snapshot().grain<=0){unloading=false;toast('Grain unloaded. Ready to harvest.');}
    }
    if(s.vehicle==='tractor')updateTrailer(step);
    if(Math.abs(car.speed)>.01&&pedestrianContact()){failPedestrian();break;}
    if(car.speed>.04&&s.stage!=='complete'){
     if(s.vehicle==='combine'&&s.stage==='harvest'){
      const count=crop.harvest(car.x,car.z,car.yaw);
      if(count){const p=HarvestCore36.hayOutlet(car.x,car.z,car.yaw);for(let k=0;k<Math.min(12,count*3);k++)effects.push({x:p.x,y:Y+.95*R,z:p.z,vx:(Math.random()-.5)*.12,vz:(Math.random()-.5)*.12,vy:-.5-Math.random()*.3,life:1.2});}
     }else if(s.vehicle==='tractor'){const pickup=local(trailer,0,.75*R);crop.collect(pickup.x,pickup.z);}
    }
    crop.tick(step,trailer);
    const progress=crop.snapshot();
    if(s.stage==='harvest'&&progress.cut===progress.total){s.stage='bale';physics.combine.stop();car.speed=0;controls.clear();keys.clear();toast('Harvest complete. Collect the remaining hay.');}
    if(progress.complete&&s.stage!=='complete'){
     s.stage='complete';s.points=200;physics[s.vehicle].stop();car.speed=0;controls.clear();keys.clear();
     $('farmResult36').querySelector('strong').textContent='Challenge complete!';$('farmAgain36').textContent='Harvest again';
     $('farmResultDetail36').textContent=progress.bales+' round bales made. Crop yield: '+progress.yieldPercent+'%. +200 points';$('farmResult36').hidden=false;
    }
   }else if(s.mounted){physics[s.vehicle].stop();v().speed=0;controls.clear();keys.clear();}
  }
  if(active){
   for(let i=effects.length-1;i>=0;i--){const p=effects[i];p.life-=dt;p.vy-=3*dt;p.x+=p.vx*dt;p.z+=p.vz*dt;p.y+=p.vy*dt;if(p.life<=0||p.y<Y)effects.splice(i,1);}
  }
  flattenCrop();
  if(s.mounted)seat();
  document.body.classList.toggle('farming-driving',s.mounted);updateUI();
 }
 function vehicleCamera(dt,immediate=false){
  if(!s.mounted||state.overview)return false;
  const car=v(),head=[car.x,Y+1.5*R,car.z],angle=car.yaw+Math.PI+state.orbitYaw;
  const desired=clamp(state.radius,3,20)*Math.max(1,Math.min(2,.9/(canvas.clientWidth/canvas.clientHeight)));
  const dir=norm([Math.sin(angle)*Math.cos(state.pitch),Math.sin(state.pitch)+.3,Math.cos(angle)*Math.cos(state.pitch)]),hit=raycast(head,dir,desired,o=>!o.boundary);
  const radius=hit?Math.max(2.8,hit.distance-.2):desired;
  smoothRadius=immediate?radius:smoothRadius+(radius-smoothRadius)*Math.min(1,dt*8);target=head;camera=add(head,mul(dir,smoothRadius));
  return true;
 }
 function drawModel(name,car,scale=SCALE){
  const base=transform([car.x,Y,car.z],[scale,scale,scale],0,car.yaw+Math.PI),cycle=crop.snapshot().cycle;
  for(const p of models[name]){
   let node=Array.from(p.node.matrix),angle=0;
   if(p.node.name.startsWith('Wheel_')){
    const steer=p.node.extras.steer?(car.steer||0)*.35*(p.node.extras.rear?-1:1):0;
    node=mm(node,transform([0,0,0],[1,1,1],-(car.distance||0)/(scale*p.node.extras.radius),steer));
   }else if(['Reel','Auger','Pickup'].includes(p.node.name)){angle=-(car.distance||0)*(p.node.name==='Pickup'?7:3);node=mm(node,transform([0,0,0],[1,1,1],angle));}
   else if(p.node.name==='Gate'&&cycle>=0){const open=cycle<.8?cycle/.8:cycle<1.8?1:1-(cycle-1.8)/.8;node=mm(node,transform([0,0,0],[1,1,1],-clamp(open,0,1)*1.75));}
   else if(p.node.name==='UnloadingPipe')node=mm(node,transform([0,0,0],[1,1,1],0,auger*Math.PI/2));
   if(p.transparent){gl.enable(gl.BLEND);gl.depthMask(false);}
   drawBatch(p.batch,mm(base,node));
   if(p.transparent){gl.depthMask(true);gl.disable(gl.BLEND);}
  }
 }
 function drawDriver(){
  const car=v(),isCombine=s.vehicle==='combine',root=transform([car.x,Y,car.z],[SCALE,SCALE,SCALE],0,car.yaw+Math.PI);
  const x=isCombine?.23:.03,y=isCombine?2.94:1.87,z=isCombine?-1.53:.93;
  const torso=[.035,.26,.4,1],skin=[.62,.4,.25,1],pants=[.09,.13,.16,1];
  const box=(p,size,color)=>drawBatch(cube,mm(root,transform(p,size)),false,color);
  box([x,y+.3,z],[.48,.57,.28],torso);drawBatch(avatarSphere,mm(root,transform([x,y+.83,z-.02],[.18,.23,.18])),false,skin);
  drawBatch(avatarSphere,mm(root,transform([x,y+.97,z],[.18,.1,.18])),false,[.055,.04,.025,1]);
  for(const side of [-1,1]){
   box([x+side*.15,y-.05,z-.2],[.19,.19,.6],pants);box([x+side*.15,y-.35,z-.45],[.18,.6,.18],pants);
   box([x+side*.31,y+.33,z-.2],[.14,.16,.5],torso);box([x+side*.27,y+.28,z-.49],[.13,.14,.18],skin);
  }
 }
 function draw(planes){
  if(!window.FarmScene63?.active||s.status!=='ready')return;
  gl.disable(gl.CULL_FACE);
  for(const b of scenery)drawBatch(b);
  if(sphereVisible([-47,Y,5],40,planes)){
   drawBatch(cropBatch);
   for(const h of crop.hay){if(h.collected)continue;
    const root=transform([h.x,Y,h.z],[R,R,1],0,h.yaw);
    for(const batch of hayMeshes)drawBatch(batch,root);
   }
   for(const b of crop.bales){const t=Math.min(1,b.age/1.5),distance=(.65+1.4*(1-(1-t)**2))*R,car={x:b.x-Math.sin(b.yaw)*distance,z:b.z-Math.cos(b.yaw)*distance,yaw:b.yaw};
    const base=transform([car.x,Y+(.444+Math.max(0,.38-b.age*.5))*R,car.z],[SCALE,SCALE,SCALE],distance/(.444*R),b.yaw+Math.PI);
    for(const p of models.bale)drawBatch(p.batch,mm(base,p.node.matrix));
   }
   for(const p of effects)drawBatch(cube,transform([p.x,p.y,p.z],p.grain?[.025,.04,.025]:[.035,.025,.17],p.life*4),false,[.8,.7,.3,1]);
  }
  if(sphereVisible([vehicles.combine.x,Y+1.5,vehicles.combine.z],5,planes))drawModel('combine',vehicles.combine);
  const grain=crop.snapshot();
  if(grain.grain>0){const car=vehicles.combine,root=transform([car.x,Y,car.z],[SCALE,SCALE,SCALE],0,car.yaw+Math.PI),height=.04+.45*grain.grain/grain.capacity;
   drawBatch(cube,mm(root,transform([0,4.13+height/2,.05],[2.1,height,2.0])),false,[.65,.45,.12,1]);
   drawBatch(avatarSphere,mm(root,transform([0,4.13+height,.05],[1.03,.12,.98])),false,[.7,.5,.16,1]);
   for(let i=0;i<48;i++){const x=Math.sin(i*8.71)*.98,z=Math.cos(i*5.31)*.92;
    const y=4.13+height+.12*Math.sqrt(Math.max(0,1-(x/1.03)**2-(z/.98)**2));
    drawBatch(cube,mm(root,transform([x,y,z+.05],[.045,.025,.075],0,i)),false,i%2?[.72,.53,.19,1]:[.59,.4,.12,1]);
   }
  }
  if(sphereVisible([vehicles.tractor.x,Y+1,vehicles.tractor.z],6,planes)){
   drawModel('tractor',vehicles.tractor);drawModel('baler',{...trailer,distance:vehicles.tractor.distance});
  }
  if(s.mounted&&!characterState.player)drawDriver();
 }
 function drawMap(){
  const c=$('farmMap36'),ctx=c.getContext('2d'),sx=x=>(x-FIELD.left)/(FIELD.right-FIELD.left)*c.width,sz=z=>(z-FIELD.north)/(FIELD.south-FIELD.north)*c.height;
  ctx.fillStyle='#263b2c';ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle='#b4c3b4';ctx.strokeRect(1,1,c.width-2,c.height-2);
  ctx.fillStyle='#c9d1d5';for(const silo of silos){ctx.beginPath();ctx.arc(sx(silo.x),sz(silo.z),9,0,Math.PI*2);ctx.fill();const h=hopper(silo);ctx.fillRect(sx(h.x)-3,sz(h.z)-3,6,6);}
  ctx.fillStyle='#c4b84e';for(const cell of crop.cells)if(!cell.cut)ctx.fillRect(sx(cell.x)-1.1,sz(cell.z)-1.1,2.3,2.3);
  ctx.fillStyle='#ffdf8b';for(const h of crop.hay)if(!h.collected)ctx.fillRect(sx(h.x)-1,sz(h.z)-1,2,3);
  ctx.strokeStyle='#a3e3b2';for(const b of crop.bales){ctx.beginPath();ctx.arc(sx(b.x),sz(b.z),2.3,0,Math.PI*2);ctx.stroke();}
  for(const name of ['combine','tractor']){const car=vehicles[name];ctx.save();ctx.translate(sx(car.x),sz(car.z));ctx.rotate(-car.yaw);ctx.fillStyle=name===s.vehicle&&s.mounted?'#fff':'#7cbded';ctx.beginPath();ctx.moveTo(0,5);ctx.lineTo(-3,-3);ctx.lineTo(3,-3);ctx.closePath();ctx.fill();ctx.restore();}
 }
 function updateUI(){
  if(!panel)return;panel.hidden=!!otherMounted();
  const p=crop.snapshot(),harvest=Math.round(p.cut/p.total*100),baled=Math.round(p.collected/p.total*100);
  $('farmStatus36').textContent=s.error||(s.status==='loading'?'Preparing hay field':s.stage==='complete'?'Challenge complete - 200 points':s.mounted&&s.vehicle==='tractor'?(p.cycle>=0?'Releasing round bale':'Collect the cut hay'):s.stage==='harvest'?'Harvest the hay field':'Harvest complete - collect remaining hay');
  if(s.mounted&&s.vehicle==='combine'&&s.stage!=='complete')$('farmStatus36').textContent=unloading?'Unloading grain':p.grainFull?'Grain tank full - unload at the silos':p.cut===p.total&&p.grain>0?'Deliver the remaining grain':$('farmStatus36').textContent;
  $('farmGrain36').textContent='Grain tank '+Math.round(p.grain/p.capacity*100)+'% | Delivered '+Math.round(p.delivered/p.total*100)+'%';
  $('farmUnload36').hidden=!(s.mounted&&s.vehicle==='combine');$('farmUnload36').textContent=unloading?'Stop unloading (U)':'Unload grain (U)';
  $('farmHarvest36').value=p.cut;$('farmHarvest36').max=p.total;$('farmHarvestValue36').textContent=harvest+'%';
  $('farmBale36').value=p.collected;$('farmBale36').max=p.total;$('farmBaleValue36').textContent=baled+'%';
  $('farmBales36').textContent=p.bales+' round bales';$('farmChamber36').textContent=s.vehicle==='tractor'&&s.mounted?'Chamber '+Math.min(100,Math.round(p.fill/120*100))+'%':s.mounted?'Combine':'';
  $('farmVisit36').hidden=s.mounted;$('farmDrive36').hidden=!s.mounted;$('farmSwitch36').hidden=!s.mounted;
  $('farmSwitch36').textContent=s.vehicle==='combine'?'Drive tractor-baler':'Drive combine';
  $('farmExit36').hidden=$('farmView36').hidden=!s.mounted;
  if(s.stage==='failed'){$('farmStatus36').textContent='Challenge failed - pedestrian collision';$('farmSwitch36').hidden=true;$('farmUnload36').hidden=true;}
  $('farmPrompt36').hidden=s.mounted||!nearVehicle();$('farmPrompt36').textContent='Press T to drive '+(nearVehicle()==='tractor'?'tractor-baler':'combine');
  $('farmSpeed36').textContent=s.mounted?(Math.abs(v().speed)*2.236936).toFixed(1)+' mph':'';
  $('farmVisit36').disabled=s.status!=='ready';$('farmReset36').disabled=s.status!=='ready';
  panel.classList.toggle('mounted',s.mounted);
  if(!s.mounted){const a=$('ambulancePanel35')?.getBoundingClientRect();panel.style.top=(a?.bottom||290)+10+'px';panel.style.bottom='';}
  else if(!s.mounted){const a=$('ambulancePanel35')?.getBoundingClientRect();panel.style.top='';panel.style.bottom=(a?innerHeight-a.y+10:225)+'px';}
  else {panel.style.top='';panel.style.bottom='';}
  if(clock-lastMap>.1||lastMap<0){lastMap=clock;drawMap();}
 }
 function resetView(){if(s.mounted){Object.assign(state,{radius:7,pitch:.48,orbitYaw:.28});updateCamera(0,true);}}
 function ui(){
  const style=document.createElement('style');style.textContent=`
   #farmPanel36{position:fixed;right:12px;top:300px;width:260px;max-height:calc(100vh - 230px);overflow:auto;padding:12px;background:#20372c;color:#f7fff9;border:1px solid #708978;border-radius:5px;z-index:16;font:13px Arial;letter-spacing:0}
   #farmPanel36 summary{font-weight:bold;cursor:pointer}#farmPanel36 p{margin:10px 0;line-height:1.4}#farmPanel36 button,#farmResult36 button{min-height:36px;border:1px solid #879d8b;background:#314d3d;color:#fff;border-radius:4px;padding:7px 10px;cursor:pointer}
   #farmPanel36 label{display:flex;justify-content:space-between;font-size:12px;margin-top:8px}#farmPanel36 progress{display:block;width:100%;height:10px;accent-color:#d7c95c}#farmBale36{accent-color:#8fdaad!important}
   #farmMap36{display:block;width:106px;height:144px;border-radius:3px}#farmReadout36{display:grid;grid-template-columns:1fr 106px;gap:12px;margin:10px 0}#farmBales36{display:block;margin-top:12px;color:#c3f0ca}#farmChamber36,#farmSpeed36{display:block;margin-top:7px;font-size:12px;font-variant-numeric:tabular-nums}
   #farmControls36{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin:10px 0}#farmControls36 button{font-size:18px;padding:4px;touch-action:none}#farmActions36{display:flex;flex-wrap:wrap;gap:5px}#farmPanel36.mounted{top:140px}#farmSwitch36{background:#dcce70!important;color:#172c20!important;width:100%;font-weight:bold;margin:8px 0}
   #farmPrompt36{position:fixed;left:50%;bottom:98px;transform:translateX(-50%);max-width:90vw;z-index:18;padding:12px 18px;background:#254d32;color:white;border:1px solid #f3e7a0;border-radius:5px}
   #farmResult36{position:fixed;top:145px;left:50%;transform:translateX(-50%);width:min(360px,calc(100vw - 24px));background:#eef8ef;color:#20372c;border:2px solid #62a773;border-radius:6px;padding:18px;z-index:20;text-align:center}#farmResult36 strong{font-size:22px}#farmResult36 p{line-height:1.5}
   #farmPanel36[hidden],#farmPrompt36[hidden],#farmResult36[hidden],#farmPanel36 [hidden]{display:none!important}body.farming-driving #forkliftPanel34,body.farming-driving #ambulancePanel35,body.farming-driving #forkliftPrompt34,body.farming-driving #ambulancePrompt35{display:none!important}
   @media(max-width:760px){#farmPanel36{top:auto;bottom:88px;right:8px;width:220px;max-height:calc(100vh - 245px)}#farmPanel36.mounted{top:auto;bottom:88px;width:calc(100vw - 16px);max-height:calc(100vh - 240px)}#farmPanel36.mounted #farmReadout36{grid-template-columns:1fr 80px;margin:8px 0}#farmPanel36.mounted #farmMap36{width:80px;height:108px}#farmPanel36.mounted #farmStatus36{margin:7px 0}#farmResult36{top:130px}body.farming-driving #farmPanel36:has(~ #farmResult36:not([hidden])) #farmMap36{display:none}}
   @media(max-width:760px){#farmPanel36.mounted #farmReadout36{grid-template-columns:1fr 66px}#farmPanel36.mounted #farmMap36{width:66px;height:90px}#farmPanel36.mounted label{margin-top:4px}#farmPanel36.mounted #farmBales36{margin-top:6px}#farmPanel36.mounted #farmChamber36,#farmPanel36.mounted #farmSpeed36{display:inline-block;margin:6px 8px 0 0}}
  `;document.head.append(style);
  panel=document.createElement('details');panel.id='farmPanel36';panel.innerHTML='<summary>Agriculture: hay harvest</summary><p id="farmStatus36" role="status">Preparing field</p><div id="farmReadout36"><div><label for="farmHarvest36">Harvested <span id="farmHarvestValue36">0%</span></label><progress id="farmHarvest36" value="0" max="1"></progress><label for="farmBale36">Hay collected <span id="farmBaleValue36">0%</span></label><progress id="farmBale36" value="0" max="1"></progress><strong id="farmBales36">0 round bales</strong><span id="farmChamber36"></span><span id="farmSpeed36"></span></div><canvas id="farmMap36" width="212" height="288" aria-label="Field map: standing crop, cut hay, round bales and vehicles"></canvas></div><button id="farmSwitch36" hidden>Drive tractor-baler</button><div id="farmDrive36" hidden><div id="farmControls36"><button data-key="w" aria-label="Forward" title="Forward (W)">&#8593;</button><button data-key="s" aria-label="Reverse" title="Reverse (S)">&#8595;</button><button data-key="a" aria-label="Steer left" title="Steer left (A)">&#8592;</button><button data-key="d" aria-label="Steer right" title="Steer right (D)">&#8594;</button><button data-key=" " aria-label="Brake" title="Brake (Space)">&#9632;</button></div></div><div id="farmActions36"><button id="farmVisit36">Visit hay field</button><button id="farmExit36">Exit (T)</button><button id="farmView36" aria-label="Reset camera" title="Reset camera">&#8634;</button><button id="farmReset36" aria-label="Restart challenge" title="Restart challenge">Restart</button></div>';
  document.body.append(panel);
  const grainReadout=document.createElement('span');grainReadout.id='farmGrain36';grainReadout.style.cssText='display:block;font-size:12px;margin-top:6px';$('farmChamber36').after(grainReadout);
  const unloadButton=document.createElement('button');unloadButton.id='farmUnload36';unloadButton.hidden=true;unloadButton.onclick=toggleUnload;$('farmActions36').append(unloadButton);
  const prompt=document.createElement('button');prompt.id='farmPrompt36';prompt.hidden=true;document.body.append(prompt);prompt.onclick=()=>enter();
  const result=document.createElement('section');result.id='farmResult36';result.hidden=true;result.setAttribute('role','status');result.innerHTML='<strong>Challenge complete!</strong><p id="farmResultDetail36"></p><button id="farmAgain36">Harvest again</button> <button id="farmClose36">Close</button>';document.body.append(result);
  $('farmVisit36').onclick=()=>visit();$('farmExit36').onclick=exit;$('farmSwitch36').onclick=switchVehicle;$('farmView36').onclick=resetView;
  $('farmReset36').onclick=$('farmAgain36').onclick=()=>{reset();visit();};$('farmClose36').onclick=()=>result.hidden=true;
  for(const button of panel.querySelectorAll('[data-key]')){
   button.onpointerdown=e=>{e.preventDefault();button.setPointerCapture(e.pointerId);controls.add(button.dataset.key);};button.onpointerup=button.onpointercancel=button.onlostpointercapture=()=>controls.delete(button.dataset.key);
  }
  panel.addEventListener('toggle',()=>{if(panel.open)for(const id of ['forkliftPanel34','ambulancePanel35']){if($(id))$(id).open=false;}});
  for(const id of ['forkliftPanel34','ambulancePanel35'])$(id)?.addEventListener('toggle',()=>{if($(id).open)panel.open=false;});
  window.addEventListener('keydown',e=>{
   if(editing())return;const k=e.key.toLowerCase();
   if(k==='u'&&s.mounted&&s.vehicle==='combine'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)toggleUnload();return;}
   if(k==='t'&&(s.mounted||nearVehicle())){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)(s.mounted?exit:()=>enter())();return;}
   if(s.mounted&&['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' ','escape'].includes(k)){
    e.preventDefault();e.stopImmediatePropagation();if(k==='escape'){physics[s.vehicle].stop();v().speed=0;exit();}else controls.add(k);
   }
  },true);
  window.addEventListener('keyup',e=>controls.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{controls.clear();if(s.mounted){physics[s.vehicle].stop();v().speed=0;}});
  canvas.addEventListener('wheel',e=>{if(!s.mounted)return;e.preventDefault();e.stopImmediatePropagation();const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);state.radius=clamp(state.radius*Math.exp(clamp(delta,-1000,1000)*.001),3,20);updateCamera(0,true);},{capture:true,passive:false});
 }
 async function init(){
  ui();try{
   await loadWheat();
   for(const name of ['combine','tractor','baler','bale'])await loadModel(name);
   while(otherMounted())await new Promise(resolve=>setTimeout(resolve,250));
   clearSite();buildField();refreshShipments();Ambulance35.refreshWorld();s.status='ready';
  }catch(e){s.status='error';s.error=e.message;console.error(e);}updateUI();
 }
 return {init,update,draw,visit,enter,exit,reset,seatedPose,vehicleCamera,inside,get mounted(){return s.mounted;},snapshot:()=>({...s,...crop.snapshot(),auger,unloading,vehicles:structuredClone(vehicles),trailer:{...trailer},removed:[...removed]}),test:{vehicles,controls,cab,silos,hopper,pipeTip,toggleUnload,get crop(){return crop;},get physics(){return physics;},get models(){return models;},get trailer(){return trailer;},place(name,x,z,yaw){Object.assign(vehicles[name],{x,z,yaw,speed:0});physics[name].reset(x,z,yaw);if(name==='tractor'){trailer={...local(vehicles[name],0,-3.18*R),yaw};}if(s.mounted)seat();}}};
})();
window.Farming36=Farming36;
{
 const walk=advancePlayer,avatar=renderAvatar,update=RobotExhibit20.update,draw=RobotExhibit20.draw,view=updateCamera,floor=floorHeightAt;
 floorHeightAt=function(x,z,feet){return window.FarmScene63?.active?.14:floor(x,z,feet);};
 updateCamera=function(dt,immediate=false){if(!Farming36.vehicleCamera(dt,immediate))view(dt,immediate);};
 advancePlayer=function(dt,input){if(!Farming36.mounted)walk(dt,input);};
 renderAvatar=function(){if(!Farming36.mounted)avatar();};
 RobotExhibit20.update=function(dt){update(dt);Farming36.update(dt);};
 RobotExhibit20.draw=function(planes){draw(planes);Farming36.draw(planes);};
 const start=()=>{if(!state.ready||window.Ambulance35?.snapshot().status!=='ready'){setTimeout(start,250);return;}Farming36.init();};start();
}
