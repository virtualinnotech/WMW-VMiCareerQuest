/* DeVos west front (172). The park strip between the westbridge sidewalk and
 * the DeVos west wall becomes buildings, matching the real street: the dark
 * glass entrance with five flags where the z=9.9 street meets the building,
 * the dark-paneled DeVos block with its drive-under to the left, and the
 * brick hotel tower and older hotel to the right. Pure layout data: the city
 * loader asks what to leave out, and the street pedestrians are rerouted. */
window.WestFrontCore172=(()=>{
 const front=-30.45,ground=-.10;
 // Each block runs from the sidewalk edge back to the existing DeVos wall.
 const blocks={
  // Amway Grand Plaza base: canopy over a drive-through (entrance and exit
  // lanes either side of the lettered planter), lobby wall at canopy.back.
  devos:{z:[-13.35,5.6],back:-22.0,height:5.6,canopy:{z:[-9.4,5.0],back:-27.0,soffit:1.4,top:1.64,lanes:[[-7.9,-3.5],[1.4,4.6]],planter:[-3.0,.9],small:[-9.35,-8.3]}},
  entrance:{z:[5.6,14.2],back:-22.0,height:3.6,glass:-29.55},
  tower:{z:[14.2,20.8],back:-24.0,height:15},
  // Its back wall shows past the DeVos front (z 33.93) and is finished there.
  hotel:{z:[20.8,36.8],back:-24.0,height:8.6,exposedBack:33.93},
  behind:{x:[-27.4,-23.0],z:[6.4,13.4],height:9.6},
  // Hotel interior (174): lobby behind the canopy (revolving door in the
  // middle, check-in desk to the left, dome over a round rug) and the
  // restaurant inside the glass entrance, reached through the pier.
  interior:{floor:-.06,ground:-.066,door:{x:-27.0,z:-1.05,r:.55,height:1.0},
   // The check-in desk stands against the far wall (straight ahead from the
   // door); the old desk wall opens into the Victorian Pantlind hallway.
   lobby:{x:[-27.0,-22.05],z:[-9.4,5.0],ceiling:1.78,dome:{x:-24.6,z:-1.05,r:1.3},desk:{x:[-22.85,-22.5],z:[.4,3.8]},partition:-5.6},
   // Victorian hallway (175) from the lobby to the hospitality lower gallery
   // (floor .24): flat, then a gentle ramp, then flat to the doorway.
   hallway:{x:[-26.19,-23.38],z:[-13.35,-5.6],ramp:[-12.6,-9.6],high:.24,ceiling:1.7},
   pier:{x:[-26.6,-22.4],top:1.35},
   restaurant:{x:[-29.5,-22.05],z:[5.72,13.3],ceiling:3.5,mezzanine:{x:-23.9,y:1.75}}},
  // Ten glass floors on top of the hospitality addition (its roof is 7.06).
  // The Amway glass tower on the hospitality addition: slender, 31 floors,
  // a ledge below the crown and a row of dark openings at the top.
  glassTower:{x:[-23.6,-11.6],z:[-27.9,-18.9],base:7.06,floors:31,floorHeight:1.05,crownFloor:25},
  // Skywalk over westbridge from the older hotel to the building opposite.
  // (between the westbridge streetlights at z 21.3 and 27.8)
  skywalk:{x:[-36.3,-30.45],z:[25.3,26.5],bottom:2.1,deck:2.72,vault:.42}
 };
 const strip=[-32.8,-13.45,-21.9,37.0];
 // Calder's La Grande Vitesse moves from the corner the hotel now fills to the
 // open plaza across Front Ave from the main entrance, behind the glass
 // building (same orientation, clear of the plaza tree).
 const calder={from:[-25.6,0,36.1],to:[17.6,0,56.0]},calderOffset=calder.to.map((v,i)=>v-calder.from[i]);
 const isCalder=name=>/^Calder113 |^Downtown134 sculpture wash /.test(name);
 // The westbridge signals along this block had been left out with the farm
 // field's street furniture; they come back (the farm scene hides the city
 // and its colliders anyway). DeVos-side poles step toward the curb so their
 // heads clear the new building front.
 const signal=/^City108 junction-[123] (south|north|west) signal$/,curbSide=/^City108 junction-[123] (south|west) signal$/;
 function keepsSignal(name){return signal.test(name);}
 function moved(name){return isCalder(name)?calderOffset:curbSide.test(name)?[-.25,0,0]:null;}
 function lights(list){return list.filter(l=>!(/park streetlight/.test(l.id)&&inStrip(l.p[0],l.p[2]))).map(l=>isCalder(l.id)?{...l,p:l.p.map((v,i)=>v+calderOffset[i])}:l);}
 const inStrip=(x,z)=>x>=strip[0]&&x<=strip[2]&&z>=strip[1]&&z<=strip[3];
 // Park furniture and planting in the strip are replaced; road drains,
 // signal poles and their footings stay.
 function clears(name,kind,lo,hi){
  if(!inStrip((lo[0]+hi[0])/2,(lo[2]+hi[2])/2))return false;
  // "tree" must start a word: signal and lamp names contain "street".
  return /(^|[^a-z])trees?([^a-z]|$)|tree soil|root collar|lawn|tuft|grass|bench|trash|\bbins?\b|fallen leaves|park streetlight|park path|sidewalk approach|planter|shrub|bush|flower/i.test(name+' '+kind);
 }
 function inside(x,z,margin=0){
  if(z<blocks.devos.z[0]-margin||z>blocks.hotel.z[1]+margin||x<front-margin)return false;
  const back=z>blocks.entrance.z[1]?-24.0:blocks.devos.back;return x<=back+margin;
 }
 // The park path pavers are one mesh across the city's parks: only the
 // triangles inside this block are left out (from drawing and collision).
 const trims=name=>/^District115 park path joined pavers/.test(name);
 function trimSurface(g,world){const keep=[],P=i=>{const x=g.pos[i*3],y=g.pos[i*3+1],z=g.pos[i*3+2];return [world[0]*x+world[4]*y+world[8]*z+world[12],world[2]*x+world[6]*y+world[10]*z+world[14]];};
  for(let i=0;i<g.idx.length;i+=3){const a=P(g.idx[i]),b=P(g.idx[i+1]),c=P(g.idx[i+2]);if(!inside((a[0]+b[0]+c[0])/3,(a[1]+b[1]+c[1])/3,.05))keep.push(g.idx[i],g.idx[i+1],g.idx[i+2]);}
  return {...g,idx:new Uint32Array(keep)};}
 // The park walk ran through the new buildings (and the hospitality
 // addition); its walkers use the sidewalk in front instead. The grove walk
 // was entirely inside the hospitality addition.
 function walks(list){
  return list.filter(w=>w.id!=='park-grove').map(w=>w.id==='park'?{...w,cross:-31.05,start:-12.2,end:33.4,width172:.30}:w);
 }
 // The hallway enters the hospitality addition through two panels of its
 // north window wall; the stone plinth stays as a threshold at floor height.
 const hallDoor={lo:[blocks.interior.hallway.x[0],.245,-13.48],hi:[blocks.interior.hallway.x[1],.24+blocks.interior.hallway.ceiling,-13.22]};
 function hospitalityContacts(list){const [x0,x1]=[hallDoor.lo[0],hallDoor.hi[0]],out=[];
  for(const c of list){
   if(c.lo&&c.hi[2]>-13.5&&c.lo[2]<-13.2&&c.lo[0]<x1-.01&&c.hi[0]>x0+.01){
    if(c.lo[0]<x0-.01)out.push({...c,name:c.name+' west',hi:[x0,c.hi[1],c.hi[2]]});
    if(c.hi[0]>x1+.01)out.push({...c,name:c.name+' east',lo:[x1,c.lo[1],c.lo[2]]});
    const mid={...c,lo:[Math.max(c.lo[0],x0),c.lo[1],c.lo[2]],hi:[Math.min(c.hi[0],x1),c.hi[1],c.hi[2]]};
    if(c.lo[1]<hallDoor.lo[1])out.push({...mid,name:c.name+' threshold',hi:[mid.hi[0],Math.min(c.hi[1],.24),mid.hi[2]]});
    if(c.hi[1]>hallDoor.hi[1])out.push({...mid,name:c.name+' lintel',lo:[mid.lo[0],Math.max(c.lo[1],hallDoor.hi[1]),mid.lo[2]]});
   }else out.push(c);
  }
  return out;}
 // Removes the doorway volume from a hospitality mesh (6 floats per vertex:
 // position, normal; optional uv): triangles are split against the box and
 // only the parts outside it are kept.
 function cutHospitality(data,idx,uv,bounds){const {lo,hi}=hallDoor;
  if(bounds.hi[0]<lo[0]||bounds.lo[0]>hi[0]||bounds.hi[1]<lo[1]||bounds.lo[1]>hi[1]||bounds.hi[2]<lo[2]||bounds.lo[2]>hi[2])return null;
  const planes=[[0,lo[0],1],[0,hi[0],-1],[1,lo[1],1],[1,hi[1],-1],[2,lo[2],1],[2,hi[2],-1]],v=[],u=[],out=[];
  const emit=poly=>{if(poly.length<3)return;const s=v.length/6;for(const p of poly){v.push(p[0],p[1],p[2],p[3],p[4],p[5]);if(uv)u.push(p[6],p[7]);}for(let j=1;j<poly.length-1;j++)out.push(s,s+j,s+j+1);};
  const split=(poly,[a,c,sg])=>{const ins=[],outs=[];for(let j=0;j<poly.length;j++){const P=poly[j],Q=poly[(j+1)%poly.length],dp=sg*(P[a]-c),dq=sg*(Q[a]-c);(dp>=0?ins:outs).push(P);if((dp>=0)!==(dq>=0)){const t=dp/(dp-dq),X=P.map((n,k)=>n+(Q[k]-n)*t);ins.push(X);outs.push(X);}}return [ins,outs];};
  for(let i=0;i<idx.length;i+=3){let poly=[idx[i],idx[i+1],idx[i+2]].map(k=>[...data.subarray(k*6,k*6+6),...(uv?uv.subarray(k*2,k*2+2):[])]);
   for(const pl of planes){if(poly.length<3)break;const [ins,outs]=split(poly,pl);emit(outs);poly=ins;}}
  return {data:new Float32Array(v),idx:new Uint32Array(out),uv:uv?new Float32Array(u):null};}
 return {front,ground,blocks,strip,calder,clears,inside,walks,moved,lights,keepsSignal,trims,trimSurface,hallDoor,hospitalityContacts,cutHospitality};
})();
