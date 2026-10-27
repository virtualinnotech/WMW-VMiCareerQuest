/* Explicit readiness checks include decoded textures and GPU geometry, not just HTTP completion. */
Loading155.prepareWorld=async function(){
 const L=Loading155,snapshot=name=>(name==='Stables52'?Stables52:window[name])?.snapshot(),status=name=>{const s=snapshot(name);return {ready:s?.ready||s?.status==='ready',error:s?.error};};
 const watches=[
  // The player is made once the student has chosen a character on the home
  // page, which can take a while: this one waits up to three hours.
  L.watch('characters',()=>({ready:characterState.status==='ready'&&characterState.playerReady,error:characterState.error}),{timeout:3*3600000}),
  L.watch('crowd',()=>({ready:crowdState.status==='ready'&&CrowdGraphics.ready,error:crowdState.error})),
  L.watch('staff',()=>{const s=EventFlow22.snapshot();return {ready:s.enabled&&!s.loading,error:s.error};},{when:()=>crowdState.status==='ready',start:()=>EventFlow22.load()}),
  // Street people use the crowd's walking characters. With a full venue of
  // booths, the crowd graphics could report ready before those characters
  // loaded; the one-time preload then did nothing and loading stalled for
  // five minutes. Wait for the crowd itself and retry until people exist.
  L.watch('street',()=>{let s=CityLife111.snapshot();if(!s.peopleReady){CityLife111.preload();s=CityLife111.snapshot();}return {ready:s.peopleReady&&s.lodStatus==='ready'&&s.dogStatus==='ready',error:s.lodError||s.dogError};},{when:()=>CrowdGraphics.ready&&crowdState.status==='ready',start:()=>CityLife111.preload()}),
  ...[['robots','RobotExhibit20'],['forklift','Forklift34'],['ambulance','Ambulance35'],['farm','Farming36'],
   ['robotics','Robotics37'],['welding','Welding37'],['crane','Crane39'],['network','Network40'],
   ['mri','MRI42'],['weld','Welding43'],['drone','Drone44'],['stables','Stables52'],['farmer','FarmPeople55'],
   ['utv','FarmVehicles53'],['hibachi','Hibachi145'],['hotel','Hotel146']].map(([id,name])=>L.watch(id,()=>status(name))),
  L.watch('farmstead',()=>status('Farmstead65'),{when:()=>snapshot('FarmVehicles53')?.ready,start:()=>Farmstead65.init(true)}),
  L.watch('pc',()=>{const s=PCChallenge66.snapshot();return {ready:s.displayReady&&s.collectionReady&&s.galleryReady&&s.gpuReady&&(!s.showcaseId||s.showcaseReady),error:s.displayError};},{when:()=>snapshot('PCChallenge66')?.ready,start:()=>PCChallenge66.preload()}),
  L.watch('workshop',()=>true,{when:()=>snapshot('PCChallenge66')?.displayReady,start:()=>PCChallenge66.preloadWorkshop()}),
  L.watch('rides',()=>status('Scooter100'),{start:()=>Scooter100.preload()}),
  L.watch('rivian',()=>{const s=Rivian147.snapshot();return {ready:s.ready&&s.modelReady,error:s.error};},{when:()=>snapshot('Rivian147')?.ready,start:()=>RivianScene147.init()})
 ];
 await Promise.all(watches);
 await L.run('graphics',async()=>{
  // Geometry added by later exhibits must be reflected in the final walking routes.
  await rebuildCrowdNavigation();if(crowdState.error)throw Error(crowdState.error);
  FarmScene63.preload();AnimatedCharacters.update(0);updateCamera(0,true);render();
  FarmSurface91.draw();Rivian147.update(0);
  const fence=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);gl.flush();
  try{
   const deadline=performance.now()+30000;
   while(true){if(gl.isContextLost())throw Error('The graphics device reset while preparing the scene.');const result=gl.clientWaitSync(fence,0,0);if(result===gl.ALREADY_SIGNALED||result===gl.CONDITION_SATISFIED)break;if(result===gl.WAIT_FAILED||performance.now()>deadline)throw Error('The graphics device could not finish preparing the scene.');await L.delay(16);}
  }finally{gl.deleteSync(fence);}
  if(gl.getError()!==gl.NO_ERROR)throw Error('The graphics device reported an error while preparing the scene.');
 });
};
