/* Both asset readiness and the minimum slideshow time gate startup. */
window.Loading155=(()=>{
 const definitions=[
  ['map','venue map',8],['city','city buildings and street assets',14],['booths','employer booths',6],
  ['characters','characters and animations',9],['crowd','NPC walking routes',5],
  ['staff','event staff',2],['street','street pedestrians',2],['robots','robot exhibits',3],
  ['forklift','forklift',2],['ambulance','ambulance',2],['farm','farm machinery',4],
  ['robotics','robotics challenge',2],['welding','robotic welding',1],['crane','construction crane',2],
  ['network','network lab',2],['mri','MRI room and staff',2],['weld','welding tools',1],
  ['drone','farm terrain and drone',4],['stables','farm animals',2],['farmer','farm characters',1],
  ['utv','farm vehicles',2],['farmstead','farm buildings and pickup',3],['hibachi','hibachi kitchen',2],
  ['hotel','hotel interior and staff',4],['pc','PC lab',4],['workshop','PC workshop and test-drive assets',2],['rides','bikes and scooters',2],
  ['rivian','Rivian and cabin',3],['graphics','final scene and graphics',2]
 ];
 const tasks=new Map(definitions.map(([id,label,weight])=>[id,{id,label,weight,status:'waiting',fraction:0}]));
 const totalWeight=definitions.reduce((sum,[,,weight])=>sum+weight,0);
 const art=['Front Entrance','Ambulance','Grand Gallery','River Walk','Farming','Exhibit Hall','Robotics','Crane','PC Lab'];
 const minimumDisplayMs=30000;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const delay=ms=>new Promise(r=>setTimeout(r,ms));
 async function bounded(promise,ms,message){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(message)),ms);})]);}finally{clearTimeout(timer);}}
 let blocked=true,failed=null,mounted=false,mountedAt=0,box,bar,text,slides,place,retry,slideTimer,displayTimer,observer,sequence=0,slide=0,animation=null,artReady;
 const inert=new Map(),history=[];
 function shield(node){if(!(node instanceof HTMLElement)||node===box||node.hasAttribute('data-loading-allow')||['SCRIPT','STYLE','LINK'].includes(node.tagName))return;if(!inert.has(node))inert.set(node,node.inert);node.inert=true;}
 function blockInput(e){
  if(!blocked||e.target?.closest?.('#loading,[data-loading-allow]')||e.metaKey||e.ctrlKey)return;
  e.preventDefault();e.stopImmediatePropagation();
 }
 for(const type of ['keydown','keyup','pointerdown','pointermove','pointerup','mousedown','mousemove','mouseup','click','dblclick','wheel','touchstart','touchmove'])window.addEventListener(type,blockInput,{capture:true,passive:false});
 function preparedFraction(){return [...tasks.values()].reduce((sum,t)=>sum+t.weight*t.fraction,0)/totalWeight;}
 function paint(){
  if(!mounted||failed)return;
  const prepared=preparedFraction(),duration=Math.min(1,(performance.now()-mountedAt)/minimumDisplayMs);
  bar.value=Math.min(prepared,duration);bar.setAttribute('aria-valuetext',`${Math.floor(bar.value*100)}% of startup complete`);
  const active=[...tasks.values()].filter(t=>t.status==='loading').sort((a,b)=>b.order-a.order)[0];
  if(active){text.textContent=active.detail||`Loading ${active.label}...`;bar.setAttribute('aria-label',text.textContent);}
  else if(prepared===1){text.textContent='Starting your visit...';bar.setAttribute('aria-label',text.textContent);}
 }
 function begin(id,detail){const t=tasks.get(id);if(!t||t.status==='done')return;if(t.status==='waiting'){t.status='loading';t.order=sequence++;history.push({id,event:'start',at:performance.now()});}t.detail=detail;paint();}
 function progress(id,value,detail){begin(id,detail);const t=tasks.get(id);if(!t)return;t.fraction=Math.max(t.fraction,Math.min(.99,value));paint();}
 function done(id){const t=tasks.get(id);if(!t)return;t.status='done';t.fraction=1;history.push({id,event:'ready',at:performance.now()});paint();}
 async function run(id,action,timeout=300000){begin(id);try{const result=await bounded(Promise.resolve().then(action),timeout,'Loading is taking too long. Check your connection and retry.');if(failed)throw Error(failed);done(id);return result;}catch(e){fail(e,tasks.get(id)?.label);throw e;}}
 async function watch(id,check,{start,when=()=>true,timeout=300000}={}){
  const end=performance.now()+timeout;let started=false,prepared=false,startError;
  while(true){
   if(failed)throw Error(failed);
   if(!started&&when()){started=true;begin(id);Promise.resolve().then(()=>start?.()).then(()=>prepared=true,e=>startError=e);}
   if(startError)throw startError;
   if(started){const status=check();if(status?.error)throw Error(`${tasks.get(id).label}: ${status.error}`);if(prepared&&(status===true||status?.ready)){done(id);return;}}
   if(performance.now()>end)throw Error(`Loading ${tasks.get(id).label} is taking too long. Check your connection and retry.`);
   await delay(100);
  }
 }
 function url(name){return './loading155/art/'+name.toLowerCase().replaceAll(' ','-')+'.webp';}
 async function picture(index){
  if(!blocked||failed)return;
  const layer=slides[index%2],name=art[index%art.length];layer.src=url(name);
  try{await bounded(layer.decode(),8000,'Artwork unavailable');}catch{if(blocked&&!failed)slideTimer=setTimeout(()=>picture(index+1),1000);return;}
  if(!blocked||failed)return;layer.getAnimations().forEach(a=>a.cancel());
  const motion=[
   ['scale(1.02) translate(0,0)','scale(1.13) translate(-1%,-1%)'],
   ['scale(1.12) translate(-2%,0)','scale(1.12) translate(2%,0)'],
   ['scale(1.14) translate(1%,1%)','scale(1.02) translate(0,0)']
  ][index%3];
  layer.style.transform=reduced.matches?'none':motion[0];
  if(!reduced.matches)animation=layer.animate([{transform:motion[0]},{transform:motion[1]}],{duration:10000,easing:'linear',fill:'forwards'});
  layer.classList.add('is-visible');slides[(index+1)%2].classList.remove('is-visible');place.textContent=name;slide=index;
  slideTimer=setTimeout(()=>picture(index+1),8000);
 }
 function mount(){
  if(mounted)return;mounted=true;mountedAt=performance.now();box=document.getElementById('loading');bar=document.getElementById('loadingProgress155');text=document.getElementById('loadText');place=document.getElementById('loadingPlace155');retry=document.getElementById('loadingRetry155');slides=[...box.querySelectorAll('.loading-slide')];
  retry.onclick=()=>location.reload();document.body.setAttribute('aria-busy','true');
  for(const child of document.body.children)shield(child);
  observer=new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)if(n.parentNode===document.body)shield(n);});observer.observe(document.body,{childList:true});
  artReady=picture(0);paint();displayTimer=setInterval(paint,100);
  // Only the next image is fetched ahead; slideshow art does not compete with the world download.
  const preload=()=>{if(blocked){const im=new Image();im.src=url(art[(slide+1)%art.length]);}};
  artReady.then(preload);box.addEventListener('transitionend',preload);
 }
 function fail(error,label){
  if(failed)return;failed=(label?label+': ':'')+(error?.message||String(error));blocked=true;mount();clearTimeout(slideTimer);clearInterval(displayTimer);
  box.hidden=false;box.classList.remove('is-leaving');box.classList.add('has-error');document.getElementById('loadTitle').textContent='Unable to finish loading';text.textContent=failed;retry.hidden=false;retry.focus();
 }
 async function finish(){
  if(failed)throw Error(failed);
  if([...tasks.values()].some(t=>t.status!=='done'))throw Error('Some startup assets are not ready.');
  await artReady;if(failed)throw Error(failed);paint();
  while(performance.now()<mountedAt+minimumDisplayMs){if(failed)throw Error(failed);await delay(Math.min(100,mountedAt+minimumDisplayMs-performance.now()));}
  if(failed)throw Error(failed);
  clearInterval(displayTimer);bar.value=1;text.textContent='Ready';bar.setAttribute('aria-label','Ready');bar.setAttribute('aria-valuetext','Ready');
  await new Promise(requestAnimationFrame);box.classList.add('is-leaving');await delay(reduced.matches?0:650);
  if(failed){box.classList.remove('is-leaving');throw Error(failed);}
  blocked=false;box.hidden=true;clearTimeout(slideTimer);animation?.cancel();for(const img of slides)img.getAnimations().forEach(a=>a.cancel());observer.disconnect();
  for(const [node,value]of inert)node.inert=value;inert.clear();document.body.removeAttribute('aria-busy');
 }
 window.addEventListener('error',e=>{if(!blocked||!mounted)return;if(e.target?.tagName==='SCRIPT')fail(Error('A game script could not load. Please retry.'));else if(e.error)fail(e.error);},true);
 return {mount,begin,progress,done,run,watch,fail,finish,delay,get blocked(){return blocked;},snapshot:()=>({blocked,failed,slide,artwork:[...art],minimumDisplayMs,elapsedMs:performance.now()-mountedAt,assetProgress:preparedFraction(),progress:bar?.value||0,tasks:[...tasks.values()].map(t=>({...t})),history:[...history]})};
})();
