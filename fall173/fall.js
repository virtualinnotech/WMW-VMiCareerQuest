/* Falls (173). When the player sprints head-on into something solid (a wall,
 * a car, a person) or crashes a bike, scooter or Segway, the player stumbles
 * and falls, then gets back up. The clips are the supplied Mixamo "fall" and
 * "Getting Up" animations retargeted to each player rig (tools/retarget.py);
 * movement is locked until he is standing again. Walking into a wall or a
 * slow bump never triggers a fall. */
window.Fall173=(()=>{
 const RATE=1.15,BLOCKED_FRAMES=2,COOLDOWN=1200;
 let ready=false,error=null,phase=null,began=0,cooldownUntil=0,blocked=0,count=0,last=null;

 function attach(model,data){
  const index=new Map(model.j.nodes.map((n,i)=>[n.name,i]));
  const clip=(name,c)=>{
   const times=Float32Array.from({length:c.frames},(_,i)=>i/c.fps),channels=[];
   c.bones.forEach((bone,b)=>{const node=index.get(bone);if(node===undefined)return;const values=new Float32Array(c.frames*4);for(let f=0;f<c.frames;f++)values.set(c.rot[f].slice(b*4,b*4+4),f*4);channels.push({node,path:'rotation',times,values,interpolation:'LINEAR'});});
   const hips=index.get('mixamorig:Hips'),values=new Float32Array(c.frames*3);for(let f=0;f<c.frames;f++)values.set(c.hips[f],f*3);channels.push({node:hips,path:'translation',times,values,interpolation:'LINEAR'});
   return {name,duration:(c.frames-1)/c.fps,channels,once:true,rate:RATE};
  };
  model.fall=clip('fall',data.clips.fall);model.getup=clip('getup',data.clips.getup);
 }
 async function load(){
  try{
   while(!characterState.player?.model)await new Promise(r=>setTimeout(r,500));
   // Each player rig has its own retargeted copy (player_boy-fall.json for the denim boy, kid01-fall.json and on for the kids).
   const model=characterState.player.model,url=model.j.extras?.player177?.falls||(/^kid0[1-8]$/.test(model.id)?'./fall173/'+model.id+'-fall.json':'./fall173/brad-fall.json');
   const response=await fetch(url+'?v=179');if(!response.ok)throw Error('Fall animation missing');
   attach(model,await response.json());ready=true;
  }catch(e){error=e.message;console.warn('Fall173',e.message);}
 }

 function start(info={}){
  if(!ready||phase||performance.now()<cooldownUntil)return false;
  phase='fall';began=performance.now();blocked=0;count++;last=info.cause||'crash';keys.clear();player.walkAmount=0;
  if(info.push){const back=resolveEllipsoid(player.position,[-info.push[0]*.32,0,-info.push[2]*.32]);player.position=back.position;}
  // Coming off a ride the pose was just reset; start the fall without blending from it.
  const a=characterState.player;if(a&&info.snap){a.mode='fall';a.clock=0;a.previous=null;a.blend=1;}
  return true;
 }
 // Called by poseActor for the player: the clip to play, advancing to the
 // next one when the current one has finished.
 function mode(a){
  if(!phase)return null;
  const clip=a.model[phase];if(!clip){phase=null;return null;}
  if(a.mode===phase&&a.clock>=clip.duration){if(phase==='fall')phase='getup';else{phase=null;cooldownUntil=performance.now()+COOLDOWN;return null;}}
  return phase;
 }
 const eligible=()=>!state.paused&&!state.overview&&!state.ghost&&!window.Scooter100?.busy()&&!window.Scooter100?.mounted&&!window.Hotel146?.active&&!document.body.classList.contains('tour-running');
 const walk=advancePlayer;
 advancePlayer=function(dt,input){
  if(phase){
   // Safety: never leave the player locked if the animation stopped updating.
   if(performance.now()-began>8000)phase=null;
   else{player.walkAmount=0;return walk(dt,{});}
  }
  const sprint=input.fast&&input.forward&&!input.backward&&eligible(),before=[...player.position],yaw=player.yaw;
  const result=walk(dt,input);
  if(sprint&&player.grounded){
   const fwd=[-Math.sin(yaw),0,-Math.cos(yaw)],expected=1.5*PLAYER_SCALE*state.speed*2.4*dt,moved=(player.position[0]-before[0])*fwd[0]+(player.position[2]-before[2])*fwd[2];
   blocked=moved<expected*.2?blocked+1:0;
   if(blocked>=BLOCKED_FRAMES)start({cause:'sprint',push:fwd});
  }else blocked=0;
  return result;
 };
 load();
 return {start,mode,get active(){return !!phase;},ready:()=>ready,snapshot:()=>({ready,error,phase,count,last,cooldown:Math.max(0,cooldownUntil-performance.now())})};
})();
