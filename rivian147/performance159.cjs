const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve(__dirname,'../../work/rivian147');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem('mcqOnboardingDone_v1','1'));
  await page.goto('http://127.0.0.1:8014/venue-frame.html?v=performance159&time=day',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.Rivian147?.snapshot().ready&&!Loading155.blocked,null,{timeout:300000});
  await page.evaluate(()=>{
   StudentRewards100.cheat();StudentRewards100.close();Rivian147.update(0);
   player.position=[2.65,PHYSICS.radii[1]+.015,39.25];state.paused=false;
   window.measures159={};
   window.wrap159=(obj,key,label=key)=>{
    const original=obj[key];if(typeof original!=='function')return;
    obj[key]=function(...args){const start=performance.now();try{return original.apply(this,args);}finally{const m=measures159[label]??={calls:0,ms:0,max:0};const ms=performance.now()-start;m.calls++;m.ms+=ms;m.max=Math.max(m.max,ms);}};
   };
   for(const key of ['update','cameraView','draw','drawLighting'])wrap159(Rivian147,key,'Rivian.'+key);
   wrap159(Rivian147.test.physics,'step','physics.step');
   wrap159(Ambulance35,'update','Ambulance.update');
   wrap159(CityLife111,'update','CityLife.update');
   wrap159(CityLife111,'present','CityLife.present');
   for(const key of ['heightAt','inWater'])wrap159(District115,key,'District.'+key);
   for(const key of ['frame','strike'])wrap159(StreetProps128,key,'Props.'+key);
   for(const key of ['update','draw'])wrap159(AnimatedCharacters,key,'Characters.'+key);
   const oldFloor=floorHeightAt;floorHeightAt=function(...a){const t=performance.now();try{return oldFloor(...a);}finally{const m=measures159.floor??={calls:0,ms:0,max:0},d=performance.now()-t;m.calls++;m.ms+=d;m.max=Math.max(m.max,d);}};
   window.frameTimes159=[];let last=performance.now();const frame=now=>{frameTimes159.push(now-last);last=now;requestAnimationFrame(frame);};requestAnimationFrame(frame);
  });
  const client=await page.context().newCDPSession(page);await client.send('Profiler.enable');
  const results={errors};
  async function sample(name,setup,duration=6000){
   await page.evaluate(setup);await page.waitForTimeout(800);
   await page.evaluate(()=>{measures159={};frameTimes159=[];});
   await client.send('Profiler.start');await page.waitForTimeout(duration);
   const {profile}=await client.send('Profiler.stop');
   const data=await page.evaluate(()=>({measures:measures159,frames:frameTimes159,car:Rivian147.snapshot(),quality:state.quality,renderSize:[canvas.width,canvas.height],indoor:IndoorPerformance154.snapshot(),bodies:Rivian147.test.physics.engine.world.bodies.length,crashes:CityLife111.trafficBodies().filter(v=>v.crashed).length}));
   const counts=new Map();for(const id of profile.samples||[])counts.set(id,(counts.get(id)||0)+1);
   data.hot=profile.nodes.map(n=>({name:n.callFrame.functionName,url:n.callFrame.url.split('/').slice(-2).join('/'),line:n.callFrame.lineNumber+1,samples:counts.get(n.id)||0})).sort((a,b)=>b.samples-a.samples).slice(0,25);
   const sorted=data.frames.slice().sort((a,b)=>a-b);data.timing={frames:sorted.length,median:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],max:Math.max(...sorted)};
   results[name]=data;console.log(name,JSON.stringify({timing:data.timing,measures:data.measures,hot:data.hot.slice(0,12),bodies:data.bodies,crashes:data.crashes,car:[data.car.x,data.car.z,data.car.speed]}));
   fs.writeFileSync(path.join(out,'profile159-'+name+'.json'),JSON.stringify(profile));
  }
  if(!process.argv.includes('--stress'))await sample('parked',()=>{});
  await sample('mounted',()=>{if(!Rivian147.enter())throw Error('Could not enter Rivian');});
  if(process.argv.includes('--stress')){
   await sample('traffic-impact',()=>{
    const v=CityLife111.trafficBodies().find(v=>!v.crashed&&!v.parked&&v.p[0]>8&&v.p[0]<50&&v.p[2]>38&&v.p[2]<46);
    if(!v)throw Error('No front-street traffic');
    Rivian147.test.place(v.p[0]-Math.sin(v.yaw)*4,v.p[2]-Math.cos(v.yaw)*4,v.yaw);Rivian147.test.controls.add('w');
   },30000);
   await page.setViewportSize({width:3442,height:1930});
   await sample('large-turn',()=>{Rivian147.test.controls.clear();Rivian147.test.place(12,42.9,Math.PI/2);Rivian147.test.controls.add('w');Rivian147.test.controls.add('a');},18000);
  }else{
  await sample('driving',()=>{Rivian147.test.place(12,42.9,Math.PI/2);Rivian147.test.controls.add('w');});
  await sample('cabin',()=>{Rivian147.test.controls.clear();Rivian147.test.place(12,42.9,Math.PI/2);Rivian147.toggleView();Rivian147.test.controls.add('w');});
  await sample('home-drive',()=>{Rivian147.test.controls.clear();Rivian147.test.place(4,37.5,Math.PI/2);if(state.firstPerson)Rivian147.toggleView();Rivian147.test.controls.add('w');},18000);
  await sample('turning',()=>{Rivian147.test.controls.add('a');},18000);
  }
  await page.evaluate(()=>Rivian147.test.controls.clear());
  await page.screenshot({path:path.join(out,'performance159-cabin.png')});
  fs.writeFileSync(path.join(out,'performance159-result.json'),JSON.stringify(results,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
