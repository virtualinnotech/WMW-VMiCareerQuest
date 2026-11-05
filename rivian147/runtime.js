window.Rivian147=(()=>{
 // Parked at the curb just ahead of the first front school bus, facing the same way.
 const HOME={x:2.65,z:40.25,yaw:-Math.PI/2},scene=RivianScene147,controls=new Set(),COLLIDER='Rivian147 parked';
 const s={...HOME,y:0,speed:0,steer:0,spin:0,time:0,lights:true,braking:false,signal:false,mounted:false,visible:false,ready:false,error:null,impacts:0};
 const dynamics=Driving154.create();
 // Chase camera: low behind the car and aimed down the road ahead of it.
 const CHASE={pitch:.1,lift:.16,distance:3.4,ahead:3,aim:.65};
 let buses=[],rise=0;
 // Does the ray cross a parked school bus (static boxes, taller than the Rivian)?
 function busHit(o,d,max){if(!buses.length)buses=colliders.filter(c=>/School_bus_/.test(c.name));
  return buses.some(c=>{let t0=0,t1=max;for(let i=0;i<3;i++){if(Math.abs(d[i])<1e-9){if(o[i]<c.lo[i]||o[i]>c.hi[i])return false;continue;}let a=(c.lo[i]-o[i])/d[i],b=(c.hi[i]-o[i])/d[i];if(a>b)[a,b]=[b,a];t0=Math.max(t0,a);t1=Math.min(t1,b);if(t0>t1)return false;}return true;});}
 let physics,saved,prompt,panel,meter,viewButton,lightButton,lastUI='',contact=null,loading=false;
 const busy=()=>window.Hotel146?.active||window.Hibachi145?.active||window.Scooter100?.mounted||window.FarmScene63?.active||window.Forklift34?.mounted||window.Ambulance35?.mounted||window.Farming36?.mounted||window.Crane39?.active||window.Robotics37?.active||window.MRI42?.active||window.Welding43?.active||window.PCChallenge66?.active||window.Drone44?.mission;
 const height=(x,z)=>window.District115?.heightAt(x,z)??floorHeightAt(x,z);
 const available=()=>!state.paused&&!state.overview&&!state.ghost&&!window.MissionUI99?.active&&!window.StudentRewards100?.active&&!HubGuide.snapshot().dialogOpen;
 const unlocked=()=>typeof StudentProgress99!=='undefined'&&StudentProgress99.complete();
 function near(){return s.ready&&!s.mounted&&!busy()&&Math.hypot(player.position[0]-s.x,player.position[2]-s.z)<1.5&&Math.abs(player.position[1]-PHYSICS.radii[1]-s.y)<.45;}
 function parkedCollider(){
  if(contact){const i=baselineColliders.indexOf(contact);if(i>=0)baselineColliders.splice(i,1);const k=colliders.indexOf(contact);if(k>=0)colliders.splice(k,1);contact=null;}
  if(s.visible&&!s.mounted){const r=scene.root(s),v=[];for(const y of [0,1.65])for(const z of [-2.56,2.36])for(const x of [-1.06,1.06])v.push(...tp(r,x,y,z));
   registerCollider(COLLIDER,'cityFurniture',new Float32Array(v),new Uint32Array([0,1,3,0,3,2,4,6,7,4,7,5,0,4,5,0,5,1,2,3,7,2,7,6,0,2,6,0,6,4,1,5,7,1,7,3]),false,{});contact=colliders.at(-1);baselineColliders.push(contact);
  }refreshShipments();
 }
 function seat(){player.position=[s.x,s.y+PHYSICS.radii[1]+.06,s.z];player.yaw=s.yaw+Math.PI;player.walkAmount=0;player.vy=0;player.grounded=true;}
 function enter(){if(!near()||!available()||!unlocked()||!scene.ready)return false;
  saved={firstPerson:state.firstPerson,radius:state.radius,pitch:state.pitch,orbitYaw:state.orbitYaw};s.mounted=true;s.braking=false;s.speed=0;controls.clear();keys.clear();physics.reset(s.x,s.z,s.yaw);dynamics.reset(s.yaw);parkedCollider();seat();state.firstPerson=false;state.overview=null;state.orbitYaw=0;state.pitch=CHASE.pitch;StudentRewards100.claim();document.body.classList.add('rivian147-driving');updateUI();updateCamera(0,true);canvas.focus();return true;
 }
 function exit(force=false){if(!s.mounted)return true;if(!force&&Math.abs(s.speed)>.10){toast('Stop the Rivian before getting out.');return false;}physics.stop();let destination=null;
  for(const x of [1.65,-1.65,2,-2]){const p=tp(scene.root(s),x,0,0),y=height(p[0],p[2]);if(window.District115?.inWater(p[0],p[2]))continue;
   const desired=[p[0],y+PHYSICS.radii[1]+.015,p[2]],out=resolveEllipsoid(player.position,sub(desired,player.position));if(len(sub(out.position,desired))<.035){destination=desired;break;}
  }
  if(!destination&&!force){toast('Move to an open area before getting out.');return false;}
  s.mounted=false;s.speed=0;s.steer=0;s.braking=false;s.roll=s.pitch=0;dynamics.reset(s.yaw);controls.clear();keys.clear();Object.assign(state,saved);if(destination)player.position=destination;player.walkAmount=0;document.body.classList.remove('rivian147-driving');parkedCollider();updateUI();updateCamera(0,true);canvas.focus();return true;
 }
 function toggleView(){if(!s.mounted)return;state.firstPerson=!state.firstPerson;state.orbitYaw=0;state.pitch=CHASE.pitch;dynamics.snap(s.yaw);updateUI();updateCamera(0,true);}
 function cameraView(dt,immediate=false){if(!s.mounted)return false;const r=scene.root(s);
  if(state.firstPerson){camera=tp(r,.385,1.48,-.23);target=tp(r,.08,1.16,2.8);}
  else{
   const yaw=dynamics.state.followYaw-(state.orbitYaw||0),head=[s.x,s.y+.60,s.z],lift=CHASE.lift+Math.max(-.1,Math.min(.6,state.pitch)),ray=l=>norm([-Math.sin(yaw),l,-Math.cos(yaw)]),desired=CHASE.distance;
   // The low camera rises over a bus parked right behind (as at the Rivian's
   // spot) and eases back down once the car pulls away.
   let need=0;for(const extra of [0,.2,.4,.6]){need=extra;if(!busHit(head,ray(lift+extra),desired))break;}
   rise=immediate?need:rise+(need-rise)*Math.min(1,dt*3);const dir=ray(lift+rise);
   // Street props (benches, bins, lamp posts), standing or knocked over, never
   // pull the camera in: a prop the Rivian hit flew through this ray and made
   // the view jump in and out on every impact.
   const hit=raycast(head,dir,desired,o=>!o.boundary&&o.name!==COLLIDER&&o.kind!=='cityFurniture'&&o.kind!=='fallenStreetProp'),radius=hit?Math.max(.4,hit.distance-.15):desired;
   camera=add(head,mul(dir,radius));target=[s.x+Math.sin(yaw)*CHASE.ahead,s.y+CHASE.aim,s.z+Math.cos(yaw)*CHASE.ahead];
  }
  return true;
 }
 function updateUI(){if(!panel)return;const show=near()&&available(),key=[s.mounted,show,unlocked(),scene.ready,Math.round(Math.abs(s.speed)*5.59235),state.firstPerson,s.lights,s.error].join('|');if(key===lastUI)return;lastUI=key;panel.hidden=!s.mounted;prompt.hidden=!show;prompt.disabled=!unlocked()||!scene.ready;prompt.textContent=s.error?'Rivian unavailable':unlocked()?(scene.ready?'Drive Rivian':'Preparing Rivian...'):'Rivian - complete all missions';meter.textContent=Math.round(Math.abs(s.speed)*5.59235)+' MPH';viewButton.setAttribute('aria-pressed',String(state.firstPerson));lightButton.setAttribute('aria-pressed',String(s.lights));}
 function handleKey(e,type){if(e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName))return false;const k=e.key.toLowerCase();
  if(!s.mounted){if(type==='keydown'&&k==='t'&&near()&&available()){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat){if(unlocked())enter();else toast('Complete every mission to unlock the Rivian.');}return true;}return false;}
  if(!['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright',' ','v','l','t','e','g','escape'].includes(k))return false;
  if(e.target.closest?.('#rivian147')&&[' ','enter'].includes(k))return false;
  e.preventDefault();e.stopImmediatePropagation();if(type==='keyup'){controls.delete(k);return true;}if(!available())return true;controls.add(k);
  if(!e.repeat){if(k==='v')toggleView();else if(k==='l'){s.lights=!s.lights;updateUI();}else if(k==='t'||k==='escape')exit();}return true;
 }
 function update(dt){if(!s.ready)return;if(unlocked()&&!scene.ready&&!loading&&!s.error){loading=true;scene.init().then(()=>{loading=false;updateUI();}).catch(e=>{loading=false;s.error=e.message;console.error('Rivian147',e);});}const visible=unlocked()&&scene.ready;if(visible!==s.visible){s.visible=visible;if(!visible&&s.mounted)exit(true);parkedCollider();}s.time+=state.paused?0:Math.min(dt,.1);
  if(s.mounted){if(!available()){controls.clear();keys.clear();physics.stop();s.speed=0;s.braking=true;}
   else{const has=k=>controls.has(k)||keys.has(k),throttle=(has('w')||has('arrowup')?1:0)-(has('s')||has('arrowdown')?1:0),steer=(has('a')||has('arrowleft')?1:0)-(has('d')||has('arrowright')?1:0),frame=Math.min(.1,dt),steps=Math.max(1,Math.ceil(frame*(frame>1/40?60:120)));s.braking=has(' ')||throttle===0&&Math.abs(s.speed)>.2;s.signal=Math.abs(steer)>.5;s.steer+=(steer*.55-s.steer)*Math.min(1,dt*9);
    for(let i=0;i<steps;i++){const before={x:s.x,z:s.z,yaw:s.yaw},p=physics.step(frame/steps,{throttle,steer:s.steer/.55,brake:has(' ')},s.y);
     if(window.District115?.inWater(p.x,p.z)){physics.reset(before.x,before.z,before.yaw);s.speed=0;toast('The Rivian cannot enter the river.');break;}
     Object.assign(s,p);s.y=height(s.x,s.z)+.006;s.spin+=s.speed*(frame/steps)/(.41353*scene.SCALE);
    }
   }dynamics.step(state.paused?0:dt,s.yaw,s.speed);s.roll=dynamics.state.roll;s.pitch=dynamics.state.pitch;seat();
  }else if(s.visible&&!window.Ambulance35?.mounted)physics.coast(Math.min(dt,.033),s.y);
  updateUI();
 }
 function headlights(){if(!s.visible||!s.lights)return [];const r=scene.root(s);return [-.70,.70].map((x,i)=>({id:'Rivian147 headlight '+i,p:tp(r,x,.88,2.32),direction:norm([Math.sin(s.yaw),-.10,Math.cos(s.yaw)]),outer:.74,radius:11,power:9,color:[.94,.98,1]}));}
 function button(label,icon,fn){const b=document.createElement('button');b.type='button';b.title=label;b.setAttribute('aria-label',label);b.append(lucide.createElement(lucide.icons[icon]));b.onclick=fn;return b;}
 async function init(){try{
  const css=document.createElement('link');css.rel='stylesheet';css.href='./rivian147/style.css?v=164';document.head.append(css);prompt=document.createElement('button');prompt.id='rivianPrompt147';prompt.hidden=true;prompt.title='Drive Rivian (T)';prompt.onclick=enter;document.body.append(prompt);
  panel=document.createElement('nav');panel.id='rivian147';panel.hidden=true;panel.setAttribute('aria-label','Rivian driving controls');const label=document.createElement('strong');label.textContent='RIVIAN R1S';meter=document.createElement('output');meter.setAttribute('aria-label','Vehicle speed');viewButton=button('Toggle cabin view (V)','View',toggleView);lightButton=button('Toggle headlights (L)','Lightbulb',()=>{s.lights=!s.lights;updateUI();});const brake=button('Brake (hold Space)','CirclePause',()=>{});brake.onpointerdown=e=>{e.preventDefault();brake.setPointerCapture(e.pointerId);controls.add(' ');};for(const event of ['pointerup','pointercancel','lostpointercapture'])brake.addEventListener(event,()=>controls.delete(' '));panel.append(label,meter,viewButton,lightButton,brake,button('Get out (T)','LogOut',()=>exit()));document.body.append(panel);
  s.y=height(s.x,s.z)+.006;
  physics=AmbulancePhysics35.create(Ambulance35.test.physics.shapes.filter(x=>x.name!==COLLIDER),()=>s.impacts++,{width:.89,length:2.04,height:.73,wheelbase:1.245,maxSpeed:6.6,reverseSpeed:1.8,steerAngle:.55,lateralGrip:6,id:'rivian147',mass:3100,traffic:()=>CityLife111.trafficBodies(),lanes:()=>CityLife111.mapLanes(),heightAt:height,driveable:(x,z)=>!District115.inWater(x,z),player:()=>s.mounted?null:[player.position[0],player.position[2]],resetVisible:(x,z)=>Math.hypot(x-camera[0],z-camera[2])<35});physics.reset(s.x,s.z,s.yaw);s.ready=true;update(0);
 }catch(e){s.error=e.message;console.error('Rivian147',e);}}
 window.addEventListener('blur',()=>{controls.clear();keys.clear();if(s.mounted){physics.stop();s.speed=0;}});
 return {init,update,enter,exit,handleKey,cameraView,toggleView,headlights,draw:p=>scene.draw(s,p),drawLighting:p=>scene.draw(s,p,true),get mounted(){return s.mounted;},snapshot:()=>({...s,followYaw:dynamics.state.followYaw,modelReady:scene.ready,loading,firstPerson:s.mounted&&state.firstPerson,unlocked:unlocked(),batches:scene.parts.length}),test:{state:s,controls,scene,near,dynamics,chase:CHASE,get physics(){return physics;},place(x,z,yaw){Object.assign(s,{x,z,yaw,y:height(x,z)+.006,speed:0,roll:0,pitch:0});physics.reset(x,z,yaw);dynamics.reset(yaw);if(s.mounted)seat();else parkedCollider();}}};
})();
{
 const draw=RobotExhibit20.draw,update=RobotExhibit20.update,view=updateCamera,walk=advancePlayer,avatar=renderAvatar,actor=drawActor,projection=perspective,travel=teleport;
 RobotExhibit20.draw=function(p){draw(p);Rivian147.draw(p);};RobotExhibit20.update=function(dt){update(dt);Rivian147.update(dt);};
 updateCamera=function(...args){if(!Rivian147.cameraView(...args))view(...args);};advancePlayer=function(...args){if(!Rivian147.mounted)return walk(...args);};renderAvatar=function(){if(!Rivian147.mounted)avatar();};drawActor=function(a,p){if(!a.player||!Rivian147.mounted)actor(a,p);};
 perspective=function(aspect){if(!Rivian147.mounted||!state.firstPerson)return projection(aspect);const f=1/Math.tan(74*Math.PI/360),n=.012,far=1500;return[f/aspect,0,0,0,0,f,0,0,0,0,(far+n)/(n-far),-1,0,0,2*far*n/(n-far),0];};
 teleport=function(...args){if(Rivian147.mounted)Rivian147.exit(true);return travel(...args);};
 const start=()=>{if(!state.ready||window.Ambulance35?.snapshot().status!=='ready'||typeof StudentProgress99==='undefined'||!window.lucide){setTimeout(start,300);return;}Rivian147.init();};start();
}
