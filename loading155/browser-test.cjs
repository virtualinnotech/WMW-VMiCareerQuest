const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const out=path.resolve(__dirname,'../../work/loading155');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE',e.message);});
  page.on('console',m=>{if(m.type()==='error')console.error(m.text().slice(0,400));});
  await page.addInitScript(()=>localStorage.setItem('mcqOnboardingDone_v1','1'));
  let release;const held=new Promise(r=>release=r);
  await page.route('**/rivian147/assets/rivian.glb*',async route=>{await held;await route.continue();});
  await page.goto('http://127.0.0.1:8014/venue-frame.html?v=20261020-loading158&time=day',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('.loading-title-image').naturalWidth===3092);
  await page.screenshot({path:path.join(out,'loading-title-entrance.png')});
  await page.waitForFunction(()=>Loading155.snapshot().tasks.some(t=>t.id==='rivian'&&t.status==='loading'),null,{timeout:240000});
  const first=await page.evaluate(()=>({position:[...player.position],yaw:player.yaw,loading:Loading155.snapshot(),paused:state.paused,visible:!document.querySelector('#loading').hidden}));
  assert(first.visible&&first.paused&&first.loading.blocked);
  await page.keyboard.down('w');await page.keyboard.press('m');await page.mouse.click(700,400);await page.waitForTimeout(1000);await page.keyboard.up('w');
  assert.deepEqual(await page.evaluate(()=>player.position),first.position);assert.equal(await page.evaluate(()=>player.yaw),first.yaw);
  await page.waitForFunction(()=>window.Hotel146?.snapshot().ready);
  await page.evaluate(()=>{player.position=[-26,.5,51];player.yaw=Math.PI;state.firstPerson=true;});
  const png=await page.screenshot({path:path.join(out,'loading-desktop.png')});assert((await sharp(png).stats()).channels.some(c=>c.stdev>30));
  const motionA=await page.evaluate(()=>getComputedStyle(document.querySelector('.loading-slide.is-visible')).transform);await page.waitForTimeout(1200);const motionB=await page.evaluate(()=>getComputedStyle(document.querySelector('.loading-slide.is-visible')).transform);assert.notEqual(motionA,motionB);
  const slide=await page.evaluate(()=>Loading155.snapshot().slide);await page.waitForFunction(i=>Loading155.snapshot().slide>i,slide,{timeout:15000});
  await page.screenshot({path:path.join(out,'loading-transition.png')});
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);await page.screenshot({path:path.join(out,'loading-mobile.png')});
  const fit=await page.evaluate(()=>{const b=document.querySelector('#loadingProgress155').getBoundingClientRect(),t=document.querySelector('#loadText').getBoundingClientRect();return{b:{x:b.x,y:b.y,width:b.width,height:b.height},t:{x:t.x,y:t.y,width:t.width,height:t.height},vw:innerWidth,vh:innerHeight};});
  assert(fit.b.x>=0&&fit.b.x+fit.b.width<=fit.vw&&fit.b.height===3&&fit.b.y+fit.b.height<fit.vh&&fit.t.y+fit.t.height<fit.b.y);
  await page.setViewportSize({width:1440,height:900});release();
  const monitor=setInterval(async()=>{try{console.log(await page.evaluate(()=>({text:document.querySelector('#loadText').textContent,remaining:Loading155.snapshot().tasks.filter(t=>t.status!=='done').map(t=>t.id),error:Loading155.snapshot().failed})));}catch{}},15000);
  try{await page.waitForFunction(()=>!Loading155.blocked||Loading155.snapshot().failed,null,{timeout:300000});}finally{clearInterval(monitor);}
  const loaded=await page.evaluate(()=>Loading155.snapshot());assert.equal(loaded.failed,null);assert.equal(loaded.blocked,false);assert.equal(loaded.progress,1);assert(loaded.tasks.every(t=>t.status==='done'));
  assert(await page.evaluate(()=>lastPlace==='start'&&Math.abs(player.position[0]-places.start.p[0])<.05&&Math.abs(player.position[2]-places.start.p[2])<.05&&!state.firstPerson),'normal preview resets a stale hotel location to the student start inside the doors after preparation');
  assert.equal(await page.evaluate(()=>Rivian147.snapshot().unlocked),false,'preloading does not grant rewards');
  const result=await page.evaluate(()=>{updateCamera(0,true);render();const p=new Uint8Array(64*64*4);gl.readPixels(canvas.width/2-32|0,canvas.height/2-32|0,64,64,gl.RGBA,gl.UNSIGNED_BYTE,p);return{error:gl.getError(),colors:new Set(Array.from({length:4096},(_,i)=>p.slice(i*4,i*4+3).join(','))).size,models:characterState.models.size,crowd: crowdState.sim.agents.length,car:Rivian147.snapshot().modelReady};});
  assert(result.error===0&&result.colors>12&&result.car);await page.screenshot({path:path.join(out,'ready.png')});
  const pos=await page.evaluate(()=>[...player.position]);await page.keyboard.down('w');await page.waitForTimeout(800);await page.keyboard.up('w');assert.notDeepEqual(await page.evaluate(()=>player.position),pos,'input restored after readiness');
  const workshop=page.frames().find(f=>f.url().includes('/pc66/index.html'));assert(workshop);
  assert(await workshop.evaluate(()=>PCBuilder66.view.snapshot().suspended));assert.equal(await workshop.evaluate(()=>PCBuilder66.view.snapshot().frame),0,'hidden workshop schedules no render frames');
  await page.evaluate(()=>{PCChallenge66.visit();PCChallenge66.enter();});await workshop.waitForFunction(()=>!PCBuilder66.view.snapshot().suspended);await page.waitForTimeout(200);
  assert(await page.evaluate(()=>PCChallenge66.active));await page.screenshot({path:path.join(out,'preloaded-workshop.png')});
  await page.evaluate(()=>PCChallenge66.exit());await workshop.waitForFunction(()=>PCBuilder66.view.snapshot().suspended);assert.equal(await workshop.evaluate(()=>PCBuilder66.view.snapshot().frame),0);
  await page.evaluate(()=>{PCChallenge66.enter();});await workshop.waitForFunction(()=>!PCBuilder66.view.snapshot().suspended);assert.equal(page.frames().filter(f=>f.url().includes('/pc66/index.html')).length,1,'the workshop iframe is reused');
  await page.evaluate(()=>PCChallenge66.exit());await workshop.waitForFunction(()=>PCBuilder66.view.snapshot().suspended);
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({loaded,result,fit},null,2));console.log('PASS real readiness, input gate, locked rewards, animated artwork, responsive loading bar, nonblank game, restored controls');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
