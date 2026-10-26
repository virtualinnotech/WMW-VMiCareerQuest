/* A world-space, two-level addition. The existing gallery renderer and solver
   own its geometry; the escalator belt only contributes a small velocity. */
window.Hospitality140=(()=>{
 const C=HospitalityCore140,steps=[];let ready=false,last=null,phase=0,gridCache=null;
 // Fixed world-space fixture grid: indoor lights never compete with the
 // camera-selected street lights. Only the nearest 3x3 grid cells can contribute.
 const lightingDeclarations=`
 float hospitalityWeight143(vec3 p){
  if(uCityAtmosphere<.5)return 0.;
  vec3 d=min(p-vec3(${C.footprint[0]},${C.ground-.10},${C.footprint[1]}),vec3(${C.footprint[2]},${C.ceiling},${C.footprint[3]})-p);
  vec3 w=smoothstep(vec3(-.03),vec3(.22,.10,.22),d);return w.x*w.y*w.z;
 }
 vec3 hospitalityLight143(vec3 p,vec3 n,vec3 base){
  bool lower=p.y<${C.floor-.06};float y=lower?${C.floor-.28}:${C.ceiling-.11};
  vec2 cell=floor((p.xz-vec2(-28.,-28.7))/3.5+.5);vec3 result=vec3(0.);
  for(int z=-1;z<=1;z++)for(int x=-1;x<=1;x++){
   vec2 id=cell+vec2(float(x),float(z));if(any(lessThan(id,vec2(0.)))||any(greaterThan(id,vec2(6.,4.))))continue;
   vec2 q=vec2(-28.,-28.7)+id*3.5;
   if(lower&&q.x>${C.hole[0]-.15}&&q.x<${C.hole[2]+.15}&&q.y>${C.hole[1]-.15}&&q.y<${C.hole[3]+.15})continue;
   vec3 delta=vec3(q.x,y,q.y)-p;float d=length(delta);if(d>=4.8||delta.y<=0.)continue;
   float falloff=pow(1.-d/4.8,2.);result+=base*vec3(1.,.91,.77)*.85*falloff*(.15+max(dot(n,delta/max(d,.001)),0.));
  }return result;
 }
 `;
 function contact(o){
  let v;
  if(o.ramp){const r=o.ramp,x0=r.x-r.width/2,x1=r.x+r.width/2,guard=/guard/.test(o.name),a=r.y0,b=r.y1,h=guard?r.height:0,lo=guard?0:-r.height;
   v=[x0,a+lo,r.z0,x1,a+lo,r.z0,x1,b+lo,r.z1,x0,b+lo,r.z1,x0,a+h,r.z0,x1,a+h,r.z0,x1,b+h,r.z1,x0,b+h,r.z1];
  }else{const [x,y,z]=o.lo,[X,Y,Z]=o.hi;v=[x,y,z,X,y,z,X,y,Z,x,y,Z,x,Y,z,X,Y,z,X,Y,Z,x,Y,Z];}
  const ids=[4,7,6,4,6,5,0,1,2,0,2,3,0,4,5,0,5,1,3,2,6,3,6,7,0,3,7,0,7,4,1,5,6,1,6,2];
  if(o.ramp&&o.ramp.z1<o.ramp.z0)for(let i=0;i<ids.length;i+=3)[ids[i+1],ids[i+2]]=[ids[i+2],ids[i+1]];
  if(o.ramp)for(let i=0;i<v.length;i+=3){const cross=v[i];v[i]=v[i+2];v[i+2]=o.ramp.laneZ-cross;}
  registerCollider('Hospitality140 '+o.name,'hospitalityArchitecture',new Float32Array(v),new Uint32Array(ids),false,{walktestBarrier:/guard/.test(o.name)});
 }
 async function init(){
  const res=await fetch('./hospitality140/addition.glb?v=142');if(!res.ok)throw Error('Hospitality gallery could not load');
  const {json:j,bin}=parseGLB(await res.arrayBuffer()),images=await loadVenueMaterialImages(j,bin),meta=j.extras.hospitality140;
  for(const n of j.nodes)for(const pr of j.meshes[n.mesh].primitives){const p=accessor(j,bin,pr.attributes.POSITION),normal=accessor(j,bin,pr.attributes.NORMAL),v=new Float32Array(p.length*2),m=j.materials[pr.material],pbr=m.pbrMetallicRoughness;
   for(let i=0;i<p.length;i+=3)v.set([...p.subarray(i,i+3),...normal.subarray(i,i+3)],i*2);
   const bounds=boundPoints(p),center=bounds.lo.map((a,i)=>(a+bounds.hi[i])/2);
   // The Victorian hallway (westfront172) opens a doorway in the north wall.
   let data=v,index=accessor(j,bin,pr.indices),texcoord=accessor(j,bin,pr.attributes.TEXCOORD_0);const cut=window.WestFrontCore172?.cutHospitality(data,index,texcoord,bounds);if(cut){data=cut.data;index=cut.idx;texcoord=cut.uv;}
   renderBatches.push(uploadBatch(data,index,{name:n.name,hospitality140:true,roof:!!n.extras?.roof,uv:texcoord,baseTexture:images.get(pr.material),color:pbr.baseColorFactor,metal:pbr.metallicFactor,rough:pbr.roughnessFactor,emission:m.emissiveFactor||[0,0,0],transparent:m.alphaMode==='BLEND',center,cullRadius:len(sub(bounds.hi,bounds.lo))/2}));
  }
  (window.WestFrontCore172?.hospitalityContacts(meta.contacts)??meta.contacts).forEach(contact);
  // Shared cube buffers keep the two moving flights inexpensive to render.
  const mesh=createCube(),N=38;
  for(const lane of C.escalators)for(let i=0;i<N;i++)for(const edge of [false,true]){const b={...mesh,color:edge?[.92,.62,.10,1]:[.30,.33,.34,1],metal:edge?0:.55,rough:.65,center:C.point(lane,C.bottom,C.ground),hospitality140:true,sceneInstance:true,sharedKey:'hospitality140:step:'+edge,cullRadius:.7,modelMatrix:identity()};renderBatches.push(b);steps.push({b,lane,i,N,edge});}
  await signs();ready=true;frame();
 }
 async function signs(){
  const image=await createImageBitmap(await(await fetch('./hospitality140/icon.png')).blob());
  function sign(c,size,title,subtitle,yaw=0){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const q=canvas.getContext('2d');q.fillStyle='#19313a';q.fillRect(0,0,1024,256);q.fillStyle='#ed792d';q.fillRect(0,240,1024,16);q.drawImage(image,20,22,210,210);q.fillStyle='#fff';q.font='600 68px sans-serif';q.fillText(title,255,116);q.font='34px sans-serif';q.fillText(subtitle,258,178);
   const [x,y,z]=c,[w,h]=size,co=Math.cos(yaw),si=Math.sin(yaw),v=[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].flatMap(([a,b])=>[x+a*co,y+b,z-a*si,si,0,co]);
   renderBatches.push(uploadBatch(new Float32Array(v),new Uint32Array([0,1,2,0,2,3]),{name:'Hospitality wayfinding',hospitality140:true,center:c,cullRadius:w,color:[1,1,1,1],emission:[.08,.08,.08],baseTexture:CharacterFitting.canvasTexture(canvas),uv:new Float32Array([0,1,1,1,1,0,0,0]),rough:1}));
  }
  sign([C.bottom+.10,2.24,-14.45],[1.72,.43],'HOSPITALITY','LEVEL 2',Math.PI/2);
  sign([-17.8,4.55,-30.245],[3.0,.75],'HOSPITALITY','GRAND GALLERY');image.close();
 }
 function frame(){if(!ready)return;const now=(window.frameNow164?.()??performance.now())/1000,dt=last===null?0:Math.min(.1,now-last);last=now;if(!state.paused&&!document.hidden)phase+=dt*.38;
  const L=C.bottom-C.top;
  for(const s of steps){const d=((s.i/s.N*L-phase*s.lane.direction)%L+L)%L,t=C.bottom-d,y=C.height(t);s.b.modelMatrix=transform(C.point(s.lane,t+(s.edge?.078:0),y-.045+(s.edge?.047:0)),[C.laneWidth,s.edge?.008:.09,s.edge?.025:L/s.N+.006],0,Math.PI/2);s.b.center=C.point(s.lane,t,y);}
 }
 function carry(dt){if(!ready||state.ghost||state.overview)return false;const p=player.position,feet=p[1]-PHYSICS.radii[1],lane=C.escalators.find(e=>Math.abs(p[2]-e.z)<C.laneWidth/2-.06);
  if(!lane||p[0]<C.top-.07||p[0]>C.bottom+.07||Math.abs(feet-C.height(p[0]))>.18)return false;
  const dx=lane.direction*.38*dt,x=p[0]+dx,dy=C.height(x)-C.height(p[0]);
  const moved=resolveEllipsoid(p,[dx,dy,0]);player.position=moved.position;player.vy=0;player.grounded=true;return true;
 }
 function filterGeometry(name,kind,data,idx,uv){const p=new Float32Array(data.length/2);for(let i=0;i<data.length;i+=6)p.set(data.subarray(i,i+3),i/2);const {lo,hi}=boundPoints(p);
  if(C.clearsGarden(name,kind,lo,hi))return {data,idx:new Uint32Array(),uv};
  if(name==='Grand_Gallery_full_length_vaulted_skylight_continuous_curved_glass_shell')return C.clipShell(data,idx,uv);
  return C.opensWall(name,lo,hi)?C.clipWall(data,idx,uv):{data,idx,uv};
 }
 function grid(){const key=colliders.length+':'+[...shippedBooths.values()].map(r=>r.id+JSON.stringify(r.placement)).join('|');if(gridCache?.key===key)return gridCache;
  const x0=-30.4,z0=-30.3,step=.20,nx=151,nz=86,blocked=new Uint8Array(nx*nz);
  for(let z=0;z<nz;z++)for(let x=0;x<nx;x++){const xx=x0+x*step,zz=z0+z*step;blocked[z*nx+x]=((C.inside(xx,zz,.23)&&!C.inHole(xx,zz,.21))||(xx>=-5.2&&xx<=-4.1&&zz>=-30.05&&zz<=-13.6)||(xx>=-5.2&&xx<=-.8&&zz>=-30.05&&zz<=-29.34))?0:1;}
  for(const o of colliders){if(o.boundary||/skylight|roof|ceiling|vault/i.test(o.name)||o.hi[1]<C.floor+.10||o.lo[1]>C.floor+.76||/moving floor/.test(o.name))continue;
   const a=Math.max(0,Math.ceil((o.lo[0]-.20-x0)/step)),b=Math.min(nx-1,Math.floor((o.hi[0]+.20-x0)/step)),c=Math.max(0,Math.ceil((o.lo[2]-.20-z0)/step)),d=Math.min(nz-1,Math.floor((o.hi[2]+.20-z0)/step));for(let z=c;z<=d;z++)for(let x=a;x<=b;x++)blocked[z*nx+x]=1;
  }
  return gridCache={key,x0,z0,step,nx,nz,blocked};
 }
 function route(start,goal,fromFloor,toFloor,solve){
  const upperFrom=fromFloor>C.floor-.4,upperTo=toFloor>C.floor-.4;if(!upperFrom&&!upperTo)return solve(start,goal);
  const upper=(a,b)=>{const r=solve(a,b,grid());if(r)r.points=r.points.map(p=>[...p,C.floor+.008]);return r;};
  if(upperFrom&&upperTo)return upper(start,goal);
  const lane=C.escalators[upperTo?0:1],low=C.lowLanding(lane),high=C.highLanding(lane),a=upperTo?solve(start,low):upper(start,high),b=upperTo?upper(high,goal):solve(low,goal);if(!a||!b)return null;
  const belt=Array.from({length:42},(_,i)=>{const x=low[0]+(high[0]-low[0])*i/41;return[x,lane.z,C.height(x)+.012];});if(!upperTo)belt.reverse();
  return {points:[...a.points,...belt,...b.points],length:a.length+b.length+8,goal:[...goal],source:[...start]};
 }
 function preview(){const params=new URLSearchParams(location.search);if(params.get('sector')==='hospitality')discoveryWalk('Hospitality');else if(params.get('sector')==='escalators')teleport('stairs');}
 return {init,frame,carry,filterGeometry,grid,route,preview,lightingDeclarations,snapshot:()=>({ready,floor:C.floor,steps:steps.length,capacity:C.capacity,phase,hole:C.hole}),test:{contact}};
})();
