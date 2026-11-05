const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve(__dirname,'../../work/collision161');fs.mkdirSync(out,{recursive:true});
const tag=process.argv.find(a=>a.startsWith('--tag='))?.slice(6)||'result';
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem('mcqOnboardingDone_v1','1'));
  await page.goto('http://127.0.0.1:8014/venue-frame.html?v=collision161&time=day',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.Rivian147?.snapshot().ready&&!Loading155.blocked,null,{timeout:300000});
  await page.evaluate(()=>{
   StudentRewards100.cheat();StudentRewards100.close();Rivian147.update(0);state.paused=false;
   player.position=[2.65,PHYSICS.radii[1]+.015,39.25];
   if(!Rivian147.enter())throw Error('Cannot enter Rivian');
   window.metrics161={};window.frames161=[];window.history161=[];
   const wrap=(obj,key,label=key)=>{
    const original=obj[key];if(typeof original!=='function')return;
    obj[key]=function(...args){const start=performance.now();try{return original.apply(this,args);}finally{const m=metrics161[label]??={calls:0,ms:0,max:0};const ms=performance.now()-start;m.calls++;m.ms+=ms;m.max=Math.max(m.max,ms);}};
   };
   for(const key of ['update','cameraView','draw'])wrap(Rivian147,key,'Rivian.'+key);
   wrap(Rivian147.test.physics,'step','physics.step');
   for(const key of ['update','present','refreshFurniture'])wrap(CityLife111,key,'CityLife.'+key);
   for(const key of ['frame','strike','draw'])wrap(StreetProps128,key,'Props.'+key);
   for(const key of ['step','sweep','setVehicles'])wrap(StreetProps128.test.engine,key,'Cannon.'+key);
   wrap(Matter.Engine,'update','Matter.update');wrap(TrafficRecovery123,'paths','recovery.paths');
   const sun=updateSunShadows;updateSunShadows=(...args)=>{const t=performance.now();try{return sun(...args);}finally{const m=metrics161.sun??={calls:0,ms:0,max:0},d=performance.now()-t;m.calls++;m.ms+=d;m.max=Math.max(m.max,d);}};
   let last=performance.now();const frame=now=>{frames161.push(now-last);last=now;requestAnimationFrame(frame);};requestAnimationFrame(frame);
   window.record161=()=>{const p=Rivian147.test.physics,e=StreetProps128.test.engine;return {car:Rivian147.snapshot(),recoveryWork:p.recoveryWork,matterBodies:p.engine.world.bodies.length,pairs:p.engine.pairs.list.length,crashes:CityLife111.trafficBodies().filter(v=>v.crashed).map(v=>({id:v.id,age:v.recovery123?.age,path:!!v.recovery123?.path})),props:e.active.size,propBodies:e.world.bodies.length,shards:e.shards.length};};
  });
  await page.waitForTimeout(3000);
  const client=await page.context().newCDPSession(page);await client.send('Profiler.enable');
  const results={errors};
  async function sample(name,setup,seconds){
   await page.evaluate(setup);await page.evaluate(()=>{metrics161={};frames161=[];history161=[];});
   if(process.argv.includes('--profile'))await client.send('Profiler.start');
   for(let i=0;i<seconds;i++){await page.waitForTimeout(1000);await page.evaluate(()=>history161.push(record161()));}
   if(process.argv.includes('--profile')){
    const {profile}=await client.send('Profiler.stop');fs.writeFileSync(path.join(out,tag+'-'+name+'-profile.json'),JSON.stringify(profile));
   }
   const data=await page.evaluate(()=>({metrics:metrics161,frames:frames161,history:history161,final:record161()}));
   const sorted=data.frames.slice().sort((a,b)=>a-b);
   data.timing={frames:sorted.length,median:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],max:Math.max(...sorted),stalls:sorted.filter(x=>x>250).length};
   results[name]=data;fs.writeFileSync(path.join(out,tag+'.json'),JSON.stringify(results,null,2));
   console.log(name,JSON.stringify({timing:data.timing,metrics:data.metrics,final:data.final}));
  }
  await sample('baseline',()=>{Rivian147.test.place(12,42.9,Math.PI/2);},6);
  await sample('traffic',()=>{
   window.hitCars161=new Set();
   const hit=()=>{
    const v=CityLife111.trafficBodies().find(v=>!v.crashed&&!v.parked&&!hitCars161.has(v.id)&&v.p[0]>8&&v.p[0]<65&&v.p[2]>38&&v.p[2]<46);
    if(!v)return;hitCars161.add(v.id);Rivian147.test.controls.clear();
    Rivian147.test.place(v.p[0]-Math.sin(v.yaw)*3.5,v.p[2]-Math.cos(v.yaw)*3.5,v.yaw);Rivian147.test.controls.add('w');
   };hit();window.crashTimer161=setInterval(hit,7000);
  },35);
  await sample('roadside',()=>{
   clearInterval(crashTimer161);Rivian147.test.controls.clear();Rivian147.test.place(15,40.4,Math.PI/2);
   const props=[...StreetProps128.test.engine.props.values()].filter(p=>p.origin[0]>0&&p.origin[0]<65&&p.origin[2]>32&&p.origin[2]<43&&/streetlights|signal|parkingMeters|hydrants|bins|bench/i.test(p.type)).sort((a,b)=>a.origin[0]-b.origin[0]);
   let i=0;window.propFixture161=props.slice(0,12).map(p=>p.id);
   const hit=()=>{for(let n=0;n<2&&i<propFixture161.length;n++,i++)StreetProps128.test.hit(propFixture161[i],{x:5,z:1,mass:3100});};
   hit();window.propsTimer161=setInterval(hit,4000);
  },28);
  await page.screenshot({path:path.join(out,tag+'-debris.png')});
  await sample('settle',()=>{clearInterval(propsTimer161);Rivian147.test.controls.clear();},35);
  await page.screenshot({path:path.join(out,tag+'-final.png')});
  assert.equal(errors.length,0,errors.join('\n'));
  assert(results.traffic.history.some(h=>h.crashes.length),'No traffic collision exercised');
  assert(results.roadside.history.some(h=>h.props>0),'No street prop collision exercised');
  assert.equal(results.settle.final.props,0,'Street props did not reset');
  if(process.argv.includes('--verify')){
   assert(results.traffic.final.recoveryWork.maxChecksPerTick<=24,'Planning budget exceeded');
   for(const name of ['traffic','roadside','settle'])assert(results[name].timing.max<300,name+' stalled for '+results[name].timing.max+' ms');
  }
  console.log('PASS repeated traffic collisions, roadside debris and cleanup');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
