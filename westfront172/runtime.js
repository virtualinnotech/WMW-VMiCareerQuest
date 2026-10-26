/* DeVos west front (172): builds the street wall that replaced the park strip.
 * Geometry is generated here and handed to the venue renderer once, so it is
 * culled, lit and shadowed like the rest of the building. Textures are drawn
 * on canvases (no downloads). Layout lives in core.js. */
window.WestFront172=(()=>{
 const C=WestFrontCore172,B=C.blocks,X0=C.front,Y0=C.ground;
 let ready=false,error=null,stats={batches:0,triangles:0,colliders:0};

 // ---- textures ----
 const canvas=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);return CharacterFitting.canvasTexture(c);};
 let seed=172;const rnd=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 function glassWall(g,w,h,bays,rows,topBand){
  const sky=g.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#34414f');sky.addColorStop(.45,'#18212b');sky.addColorStop(1,'#0a0f14');g.fillStyle=sky;g.fillRect(0,0,w,h);
  // Faint reflections of the towers across the street.
  for(let i=0;i<14;i++){const x=rnd()*w,bw=w*(.03+rnd()*.07),top=h*(.05+rnd()*.35);g.fillStyle=`rgba(${120+rnd()*60|0},${135+rnd()*60|0},${150+rnd()*60|0},${.05+rnd()*.07})`;g.fillRect(x,top,bw,h-top);}
  g.fillStyle='rgba(140,170,200,.10)';g.beginPath();g.moveTo(0,h*.2);g.lineTo(w*.35,0);g.lineTo(w*.5,0);g.lineTo(w*.1,h*.6);g.closePath();g.fill();
  g.fillStyle='#06080b';const t=topBand*h;g.fillRect(0,0,w,t);
  const mw=Math.max(5,w/bays*.07);for(let i=0;i<=bays;i++){const x=i*w/bays;g.fillRect(x-mw/2,0,mw,h);}
  for(let r=0;r<=rows;r++){const y=t+(h-t)*r/rows;g.fillRect(0,y-mw*.45,w,mw*.9);}
 }
 function panels(g,w,h){g.fillStyle='#1c1f23';g.fillRect(0,0,w,h);const cols=4,rows=2;
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const v=62+rnd()*14|0,x=c*w/cols+3,y=r*h/rows+3,pw=w/cols-6,ph=h/rows-6,grad=g.createLinearGradient(x,y,x,y+ph);grad.addColorStop(0,`rgb(${v+12},${v+15},${v+19})`);grad.addColorStop(1,`rgb(${v-8},${v-5},${v-1})`);g.fillStyle=grad;g.fillRect(x,y,pw,ph);g.fillStyle='rgba(255,255,255,.10)';g.fillRect(x,y,pw,3);}
 }
 function brick(g,w,h){g.fillStyle='#8f7d70';g.fillRect(0,0,w,h);const rows=32,cols=12,bh=h/rows,bw=w/cols;
  for(let r=0;r<rows;r++)for(let c=-1;c<=cols;c++){const x=c*bw+(r%2?bw/2:0),k=rnd();g.fillStyle=`rgb(${120+k*30|0},${55+k*16|0},${38+k*12|0})`;g.fillRect(x+1.5,r*bh+1.5,bw-3,bh-3);}
 }
 function hotelBay(g,w,h){brick(g,w,h);
  const ww=w*.44,wh=h*.56,x=(w-ww)/2,y=h*.22;g.fillStyle='#e9e3d6';g.fillRect(x-w*.06,y-h*.08,ww+w*.12,wh+h*.14);g.fillRect(x-w*.09,y-h*.13,ww+w*.18,h*.06);
  g.fillStyle='#1b2630';g.fillRect(x,y,ww,wh);g.fillStyle='rgba(150,180,210,.18)';g.fillRect(x,y,ww,wh*.45);g.fillStyle='#e9e3d6';g.fillRect(x+ww/2-2,y,4,wh);g.fillRect(x,y+wh*.5-2,ww,4);
 }
 function hotelBase(g,w,h){g.fillStyle='#d9ccb4';g.fillRect(0,0,w,h);g.fillStyle='rgba(120,100,70,.18)';for(let y=h/6;y<h;y+=h/6)g.fillRect(0,y,w,2);
  const ww=w*.5,x=(w-ww)/2,top=h*.22,bottom=h*.9;g.fillStyle='#c4b498';g.fillRect(x-w*.05,top-w*.05,ww+w*.1,bottom-top+w*.05);g.fillStyle='#1a232c';g.beginPath();g.moveTo(x,bottom);g.lineTo(x,top+ww/2);g.arc(x+ww/2,top+ww/2,ww/2,Math.PI,0);g.lineTo(x+ww,bottom);g.closePath();g.fill();g.fillStyle='rgba(150,180,210,.15)';g.fillRect(x,top+ww/2,ww,(bottom-top)*.3);
 }
 function stoneWindows(g,w,h){g.fillStyle='#cdb99a';g.fillRect(0,0,w,h);g.fillStyle='rgba(110,90,60,.15)';g.fillRect(0,h-4,w,4);const ww=w*.42,wh=h*.56;g.fillStyle='#26323d';g.fillRect((w-ww)/2,h*.2,ww,wh);g.fillStyle='rgba(160,190,215,.16)';g.fillRect((w-ww)/2,h*.2,ww,wh*.4);}
 function granite(g,w,h){g.fillStyle='#cfc4b1';g.fillRect(0,0,w,h);for(let i=0;i<2600;i++){const k=rnd();g.fillStyle=k<.5?'rgba(90,80,70,.25)':'rgba(255,255,255,.25)';g.fillRect(rnd()*w,rnd()*h,1.5,1.5);}g.fillStyle='rgba(80,70,60,.35)';g.fillRect(0,h-3,w,3);g.fillRect(w-3,0,3,h);}
 // Amway Grand Plaza base: vertical charcoal-blue metal panels, louvered
 // ribbon window, lobby glass with sconces, dark granite (lettered) planter.
 function vpanels(g,w,h){g.fillStyle='#22262c';g.fillRect(0,0,w,h);const cols=4,pw=w/cols;
  for(let c=0;c<cols;c++){const v=84+rnd()*16|0,joint=(c%2?.35:.75)*h,grad=g.createLinearGradient(c*pw,0,(c+1)*pw,0);grad.addColorStop(0,`rgb(${v+12},${v+16},${v+24})`);grad.addColorStop(1,`rgb(${v-14},${v-10},${v-2})`);g.fillStyle=grad;g.fillRect(c*pw+2,0,pw-4,h);g.fillStyle='rgba(18,20,24,.9)';g.fillRect(c*pw,joint-2,pw,4);}
 }
 function louverBand(g,w,h){glassWall(g,w,h,24,1,0);g.fillStyle='rgba(28,30,35,.92)';for(let i=0;i<5;i++)g.fillRect(0,h*(.04+i*.08),w,h*.04);}
 function lobby(g,w,h){g.fillStyle='#0c0f13';g.fillRect(0,0,w,h);g.fillStyle='#1c2b55';g.fillRect(0,0,w,h*.16);
  for(let i=0;i<12;i++){const x=w*(i+.5)/12;g.fillStyle='rgba(70,82,96,.45)';g.fillRect(x-w*.035,h*.3,w*.07,h*.7);}
  g.fillStyle='#ffc66e';for(let i=0;i<14;i++){const x=w*(i+.5)/14;g.fillRect(x-7,h*.42,5,h*.12);g.fillRect(x+2,h*.42,5,h*.12);}}
 function darkGranite(g,w,h){g.fillStyle='#2f2b29';g.fillRect(0,0,w,h);for(let i=0;i<w*h/10;i++){g.fillStyle=rnd()<.5?'rgba(140,128,116,.35)':'rgba(8,8,8,.45)';g.fillRect(rnd()*w,rnd()*h,1.5,1.5);}g.fillStyle='rgba(255,255,255,.08)';g.fillRect(0,0,w,3);}
 function lettered(g,w,h){darkGranite(g,w,h);g.fillStyle='#caa55a';g.font=`italic ${h*.5|0}px Georgia, 'Times New Roman', serif`;g.textAlign='center';g.textBaseline='middle';g.fillText('AMWAY  GRAND  PLAZA',w/2,h*.56);}
 function pavers(g,w,h){g.fillStyle='#303337';g.fillRect(0,0,w,h);const n=8;for(let y=0;y<n;y++)for(let x=0;x<n;x++){const v=42+rnd()*14|0;g.fillStyle=`rgb(${v},${v+2},${v+5})`;g.fillRect(x*w/n+1,y*h/n+1,w/n-2,h/n-2);}g.fillStyle='rgba(160,128,96,.55)';g.fillRect(0,h*.46,w,h*.08);}
 function redBrick(g,w,h){g.fillStyle='#6d3a30';g.fillRect(0,0,w,h);for(let r=0;r<16;r++)for(let c=-1;c<9;c++){const k=rnd();g.fillStyle=`rgb(${140+k*30|0},${72+k*15|0},${60+k*12|0})`;g.fillRect(c*w/8+(r%2?w/16:0)+1,r*h/16+1,w/8-2,h/16-2);}}
 function stained(g,w,h){g.fillStyle='#958d80';g.fillRect(0,0,w,h);for(let i=0;i<70;i++){g.fillStyle=`rgba(${58+rnd()*30|0},${54+rnd()*24|0},${46+rnd()*20|0},${.08+rnd()*.16})`;g.fillRect(rnd()*w,rnd()*h*.3,3+rnd()*10,h);}for(let i=0;i<1500;i++){g.fillStyle=rnd()<.5?'rgba(40,40,40,.15)':'rgba(255,255,255,.12)';g.fillRect(rnd()*w,rnd()*h,2,2);}}
 function concrete(g,w,h){g.fillStyle='#b8b4ab';g.fillRect(0,0,w,h);for(let i=0;i<1600;i++){g.fillStyle=rnd()<.5?'rgba(60,60,60,.12)':'rgba(255,255,255,.14)';g.fillRect(rnd()*w,rnd()*h,2,2);}}
 const FLAGS=[
  (g,w,h)=>{g.fillStyle='#111';g.fillRect(0,0,w,h);g.strokeStyle='#eee';g.lineWidth=6;g.beginPath();g.arc(w*.5,h*.5,h*.3,0,7);g.stroke();g.fillStyle='#eee';g.font=`bold ${h*.16|0}px sans-serif`;g.textAlign='center';g.fillText('POW',w*.5,h*.17);g.fillText('MIA',w*.5,h*.96);g.beginPath();g.arc(w*.5,h*.46,h*.1,0,7);g.fill();g.fillRect(w*.44,h*.53,w*.12,h*.18);},
  (g,w,h)=>{g.fillStyle='#1d2f74';g.fillRect(0,0,w,h);g.fillStyle='#3f68b5';g.beginPath();g.moveTo(w*.38,h*.25);g.lineTo(w*.62,h*.25);g.lineTo(w*.62,h*.55);g.quadraticCurveTo(w*.5,h*.78,w*.38,h*.55);g.closePath();g.fill();g.fillStyle='#b98b3a';g.fillRect(w*.27,h*.3,w*.08,h*.36);g.fillRect(w*.65,h*.3,w*.08,h*.36);g.fillStyle='#e8e2c8';g.fillRect(w*.3,h*.74,w*.4,h*.07);g.fillStyle='#d9b04a';g.beginPath();g.arc(w*.5,h*.17,h*.06,0,7);g.fill();},
  (g,w,h)=>{for(let i=0;i<13;i++){g.fillStyle=i%2?'#f4f4f4':'#b22234';g.fillRect(0,i*h/13,w,h/13+1);}g.fillStyle='#3c3b6e';g.fillRect(0,0,w*.4,h*7/13);g.fillStyle='#fff';for(let r=0;r<9;r++)for(let c=0;c<(r%2?5:6);c++){g.beginPath();g.arc(w*.4*(c+(r%2?1:.5))/6,h*7/13*(r+.7)/9.4,h*.012,0,7);g.fill();}},
  (g,w,h)=>{g.fillStyle='#24429a';g.fillRect(0,0,w,h);g.fillStyle='#f2efe4';g.beginPath();g.arc(w*.5,h*.5,h*.27,0,7);g.fill();g.fillStyle='#24429a';g.beginPath();g.arc(w*.5,h*.5,h*.2,0,7);g.fill();g.fillStyle='#d9b04a';g.beginPath();g.arc(w*.5,h*.5,h*.1,0,7);g.fill();},
  (g,w,h)=>{g.fillStyle='#f3f1ea';g.fillRect(0,0,w,h);g.fillStyle='#1f4b8f';g.fillRect(0,h*.8,w,h*.2);g.beginPath();g.arc(w*.5,h*.42,h*.22,0,7);g.fill();g.fillStyle='#f3f1ea';g.beginPath();g.moveTo(w*.42,h*.5);g.lineTo(w*.5,h*.28);g.lineTo(w*.58,h*.5);g.closePath();g.fill();}
 ];

 // ---- geometry ----
 function builder(){const v=[],uv=[],idx=[];
  function quad(p,n,u=[[0,1],[1,1],[1,0],[0,0]]){const a=p[0],b=p[1],c=p[2],e=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],f=[c[0]-a[0],c[1]-a[1],c[2]-a[2]],cr=[e[1]*f[2]-e[2]*f[1],e[2]*f[0]-e[0]*f[2],e[0]*f[1]-e[1]*f[0]];
   const s=v.length/6;for(let i=0;i<4;i++){v.push(...p[i],...n);uv.push(...u[i]);}
   if(cr[0]*n[0]+cr[1]*n[1]+cr[2]*n[2]>=0)idx.push(s,s+1,s+2,s,s+2,s+3);else idx.push(s,s+2,s+1,s,s+3,s+2);}
  // A face split into texture tiles (textures clamp, so each tile maps 0..1).
  function face(o,uDir,vDir,uLen,vLen,n,tu,tv){
   for(let a=0;a<uLen-1e-6;a+=tu)for(let b=0;b<vLen-1e-6;b+=tv){const da=Math.min(tu,uLen-a),db=Math.min(tv,vLen-b),P=(x,y)=>[o[0]+uDir[0]*x+vDir[0]*y,o[1]+uDir[1]*x+vDir[1]*y,o[2]+uDir[2]*x+vDir[2]*y];
    quad([P(a,b),P(a+da,b),P(a+da,b+db),P(a,b+db)],n,[[0,1],[da/tu,1],[da/tu,1-db/tv],[0,1-db/tv]]);}
  }
  // Box with tiled sides; skip lists faces left out (e.g. against the wall).
  function box(lo,hi,tile=[1e9,1e9],skip=[]){const [x0,y0,z0]=lo,[x1,y1,z1]=hi,[tu,tv]=tile;
   if(!skip.includes('-x'))face([x0,y0,z0],[0,0,1],[0,1,0],z1-z0,y1-y0,[-1,0,0],tu,tv);
   if(!skip.includes('+x'))face([x1,y0,z1],[0,0,-1],[0,1,0],z1-z0,y1-y0,[1,0,0],tu,tv);
   if(!skip.includes('-z'))face([x1,y0,z0],[-1,0,0],[0,1,0],x1-x0,y1-y0,[0,0,-1],tu,tv);
   if(!skip.includes('+z'))face([x0,y0,z1],[1,0,0],[0,1,0],x1-x0,y1-y0,[0,0,1],tu,tv);
   if(!skip.includes('+y'))face([x0,y1,z0],[0,0,1],[1,0,0],z1-z0,x1-x0,[0,1,0],1e9,1e9);
   if(!skip.includes('-y'))face([x0,y0,z1],[0,0,-1],[1,0,0],z1-z0,x1-x0,[0,-1,0],1e9,1e9);
  }
  function cylinder(cx,cz,y0,y1,r,seg=10){for(let i=0;i<seg;i++){const a=i/seg*Math.PI*2,b=(i+1)/seg*Math.PI*2,m=(a+b)/2;quad([[cx+Math.cos(a)*r,y0,cz+Math.sin(a)*r],[cx+Math.cos(b)*r,y0,cz+Math.sin(b)*r],[cx+Math.cos(b)*r,y1,cz+Math.sin(b)*r],[cx+Math.cos(a)*r,y1,cz+Math.sin(a)*r]],[Math.cos(m),0,Math.sin(m)]);}}
  function tube(a,b,r,seg=6){const d=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],L=Math.hypot(...d),u=d.map(v=>v/L),n1=norm(cross(u,Math.abs(u[1])<.9?[0,1,0]:[1,0,0])),n2=cross(u,n1),o=t=>n1.map((v,k)=>v*Math.cos(t)+n2[k]*Math.sin(t));
   for(let i=0;i<seg;i++){const t0=i/seg*Math.PI*2,t1=(i+1)/seg*Math.PI*2,p0=o(t0),p1=o(t1);quad([a.map((v,k)=>v+p0[k]*r),a.map((v,k)=>v+p1[k]*r),b.map((v,k)=>v+p1[k]*r),b.map((v,k)=>v+p0[k]*r)],o((t0+t1)/2));}}
  function sphere(c,r,sy=1,seg=9,rings=6){for(let j=0;j<rings;j++){const t0=j/rings*Math.PI,t1=(j+1)/rings*Math.PI;for(let i=0;i<seg;i++){const a=i/seg*Math.PI*2,b=(i+1)/seg*Math.PI*2,P=(t,p)=>[c[0]+Math.sin(t)*Math.cos(p)*r,c[1]+Math.cos(t)*r*sy,c[2]+Math.sin(t)*Math.sin(p)*r],N=(t,p)=>[Math.sin(t)*Math.cos(p),Math.cos(t),Math.sin(t)*Math.sin(p)],tm=(t0+t1)/2,pm=(a+b)/2;quad([P(t1,a),P(t1,b),P(t0,b),P(t0,a)],N(tm,pm));}}}
  // Each batch carries a bounding sphere so the renderer skips it off screen.
  function upload(name,material){if(!idx.length)return null;const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(let i=0;i<v.length;i+=6)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],v[i+k]);hi[k]=Math.max(hi[k],v[i+k]);}
   const center=lo.map((a,k)=>(a+hi[k])/2),cullRadius=Math.hypot(...hi.map((a,k)=>(a-lo[k])/2))+.05;
   const b=uploadBatch(new Float32Array(v),new Uint32Array(idx),{name:'WestFront172 '+name,westFront172:true,uv:new Float32Array(uv),rough:.8,metal:0,center,cullRadius,...material});renderBatches.push(b);stats.batches++;stats.triangles+=idx.length/3;return b;}
  return {quad,face,box,cylinder,tube,sphere,upload};
 }
 const colliderIds=[0,1,3,0,3,2,4,6,7,4,7,5,0,4,5,0,5,1,2,3,7,2,7,6,0,2,6,0,6,4,1,5,7,1,7,3];
 function collider(name,lo,hi){const p=[];for(const y of [lo[1],hi[1]])for(const z of [lo[2],hi[2]])for(const x of [lo[0],hi[0]])p.push(x,y,z);registerCollider('WestFront172 '+name,'westFront172',new Float32Array(p),new Uint32Array(colliderIds),false,{});stats.colliders++;}

 // ---- hotel interior (174): lobby and restaurant from the real Amway Grand ----
 const ITEX={
  marble:(g,w,h)=>{const n=4;for(let y=0;y<n;y++)for(let x=0;x<n;x++){const k=rnd(),dark=(x+y)%3===0;g.fillStyle=dark?`rgb(${150+k*20|0},${112+k*16|0},${58+k*10|0})`:`rgb(${205+k*30|0},${168+k*28|0},${100+k*22|0})`;g.fillRect(x*w/n,y*h/n,w/n,h/n);for(let i=0;i<40;i++){g.fillStyle='rgba(255,240,200,.12)';g.fillRect(x*w/n+rnd()*w/n,y*h/n+rnd()*h/n,rnd()*30,1.5);}}g.fillStyle='rgba(90,70,40,.5)';for(let i=0;i<=n;i++){g.fillRect(i*w/n-1,0,2,h);g.fillRect(0,i*h/n-1,w,2);}},
  tiles:(g,w,h)=>{g.fillStyle='#ebe8e1';g.fillRect(0,0,w,h);for(let i=0;i<300;i++){g.fillStyle='rgba(120,120,110,.12)';g.fillRect(rnd()*w,rnd()*h,1.5,1.5);}g.fillStyle='#c9c5bb';for(let i=0;i<=4;i++){g.fillRect(i*w/4-1,0,3,h);g.fillRect(0,i*h/4-1,w,3);}},
  rug:(g,w,h)=>{const c=w/2,ring=(r,col)=>{g.fillStyle=col;g.beginPath();g.arc(c,c,r,0,7);g.fill();};ring(c,'#2c3b74');ring(c*.94,'#9a3b3b');ring(c*.9,'#3a4d8c');for(let i=0;i<48;i++){const a=i/48*Math.PI*2;g.fillStyle=i%2?'#c79a4d':'#7d2f35';g.beginPath();g.arc(c+Math.cos(a)*c*.78,c+Math.sin(a)*c*.78,c*.05,0,7);g.fill();}ring(c*.66,'#55638f');for(let i=0;i<24;i++){const a=i/24*Math.PI*2;g.strokeStyle=i%2?'#b88a4a':'#a54848';g.lineWidth=6;g.beginPath();g.moveTo(c,c);g.lineTo(c+Math.cos(a)*c*.64,c+Math.sin(a)*c*.64);g.stroke();}ring(c*.3,'#8c3a3e');ring(c*.2,'#d2a65a');ring(c*.1,'#2c3b74');},
  wood:(g,w,h)=>{g.fillStyle='#2a1810';g.fillRect(0,0,w,h);const n=3;for(let i=0;i<n;i++){const x=i*w/n+8,pw=w/n-16;g.fillStyle='#6e3a22';g.fillRect(x,10,pw,h-20);for(let k=0;k<30;k++){g.fillStyle='rgba(40,20,10,.18)';g.fillRect(x+rnd()*pw,10,1.5,h-20);}g.strokeStyle='#3b2214';g.lineWidth=5;g.strokeRect(x+10,24,pw-20,h-48);}},
  cream:(g,w,h)=>{g.fillStyle='#e9e0cf';g.fillRect(0,0,w,h);g.fillStyle='#3a2416';g.fillRect(0,h*.88,w,h*.12);g.fillStyle='rgba(255,255,255,.25)';g.fillRect(0,h*.02,w,h*.03);},
  pantlind:(g,w,h)=>{g.fillStyle='#e9e0cf';g.fillRect(0,0,w,h);g.fillStyle='#8a6a32';g.font=`${h*.42|0}px Georgia, serif`;g.textAlign='center';g.textBaseline='middle';g.fillText('THE  PANTLIND',w/2,h*.55);},
  corridor:(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#2b2622');gr.addColorStop(1,'#7c6440');g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='rgba(255,220,150,.5)';for(let i=0;i<5;i++)g.fillRect(w*.42-i*6,h*.1+i*h*.08,w*.16+i*12,4);g.fillStyle='#3d2a1d';g.fillRect(0,0,w*.12,h);g.fillRect(w*.88,0,w*.12,h);},
  painting:(g,w,h)=>{g.fillStyle='#b48a3c';g.fillRect(0,0,w,h);const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#cfe0ea');gr.addColorStop(.5,'#e9e3c8');gr.addColorStop(1,'#5d7a3e');g.fillStyle=gr;g.fillRect(w*.06,h*.08,w*.88,h*.84);g.fillStyle='#3e6a8a';g.beginPath();g.moveTo(w*.06,h*.75);g.quadraticCurveTo(w*.5,h*.55,w*.94,h*.7);g.lineTo(w*.94,h*.8);g.quadraticCurveTo(w*.5,h*.7,w*.06,h*.85);g.fill();for(let i=0;i<14;i++){g.fillStyle=`rgba(${60+rnd()*40|0},${90+rnd()*50|0},${40+rnd()*20|0},.9)`;g.beginPath();g.arc(w*(.08+rnd()*.84),h*(.4+rnd()*.25),w*(.03+rnd()*.04),0,7);g.fill();}},
  dome:(g,w,h)=>{const c=w/2,gr=g.createRadialGradient(c,c,c*.1,c,c,c);gr.addColorStop(0,'#f2d27a');gr.addColorStop(.7,'#c79a3e');gr.addColorStop(.9,'#fff6dc');gr.addColorStop(1,'#ffffff');g.fillStyle=gr;g.fillRect(0,0,w,h);for(let i=0;i<30;i++){g.fillStyle='rgba(120,150,110,.12)';g.beginPath();g.arc(c+(rnd()-.5)*c,c+(rnd()-.5)*c,c*.15,0,7);g.fill();}},
  herring:(g,w,h)=>{g.fillStyle='#5b5a58';g.fillRect(0,0,w,h);const s=w/8;for(let y=-1;y<9;y++)for(let x=0;x<8;x++){const k=rnd(),v=92+k*30|0;g.fillStyle=`rgb(${v},${v-2},${v-6})`;g.save();g.translate(x*s+s/2,y*s+(x%2?s/2:0));g.rotate(x%2?Math.PI/4:-Math.PI/4);g.fillRect(-s*.7,-s*.16,s*1.4,s*.3);g.restore();}},
  mural:(g,w,h)=>{g.fillStyle='#eef0f4';g.fillRect(0,0,w,h);g.strokeStyle='rgba(60,70,90,.55)';g.lineWidth=1.4;for(let i=0;i<70;i++){const y0=rnd()*h;g.beginPath();g.moveTo(0,y0);for(let x=0;x<=w;x+=16)g.lineTo(x,y0+Math.sin(x*.02+i)*18+Math.sin(x*.05+i*2)*8);g.stroke();}g.fillStyle='#16181c';for(let i=0;i<=4;i++)g.fillRect(i*w/4-3,0,6,h);g.fillRect(0,h*.5-3,w,6);},
  cabinet:(g,w,h)=>{g.fillStyle='#3a2a1c';g.fillRect(0,0,w,h);g.fillStyle='#1d140d';g.fillRect(w*.1,h*.08,w*.8,h*.84);for(let r=0;r<3;r++)for(let i=0;i<7;i++){g.fillStyle=['#5a1e2a','#2f4a2a','#c8b070'][(r+i)%3];g.fillRect(w*(.15+i*.1),h*(.2+r*.25),w*.05,h*.16);}g.strokeStyle='rgba(212,170,80,.8)';g.lineWidth=2;for(let i=-10;i<20;i++){g.beginPath();g.moveTo(w*.1+i*14,h*.08);g.lineTo(w*.1+i*14+h,h*.92);g.stroke();g.beginPath();g.moveTo(w*.1+i*14,h*.92);g.lineTo(w*.1+i*14+h,h*.08);g.stroke();}},
  tv:(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#5a3b8c');gr.addColorStop(.6,'#d07aa6');gr.addColorStop(1,'#1a1830');g.fillStyle=gr;g.fillRect(0,0,w,h);for(let i=0;i<26;i++){const bw=w*(.02+rnd()*.04),bh=h*(.15+rnd()*.5),x=rnd()*w;g.fillStyle='#14121f';g.fillRect(x,h-bh,bw,bh);g.fillStyle='rgba(255,220,150,.7)';for(let k=0;k<6;k++)g.fillRect(x+2,h-bh+rnd()*bh,2,2);}},
  tableTop:(g,w,h)=>{g.fillStyle='#f1efea';g.fillRect(0,0,w,h);for(let i=0;i<20;i++){g.strokeStyle='rgba(160,160,170,.25)';g.beginPath();g.moveTo(rnd()*w,0);g.lineTo(rnd()*w,h);g.stroke();}g.strokeStyle='#b27a5a';g.lineWidth=2;for(let i=0;i<36;i++){const a=i/36*Math.PI*2;g.beginPath();g.moveTo(w/2,h/2);g.lineTo(w/2+Math.cos(a)*w*.28,h/2+Math.sin(a)*h*.28);g.stroke();}}
  ,damask:(g,w,h)=>{g.fillStyle='#5b1a22';g.fillRect(0,0,w,h);const motif=(cx,cy,s)=>{g.fillStyle='rgba(201,160,88,.55)';g.beginPath();g.ellipse(cx,cy,s*.16,s*.3,0,0,7);g.fill();for(const d of [-1,1]){g.beginPath();g.ellipse(cx+d*s*.22,cy-s*.08,s*.18,s*.09,d*.6,0,7);g.fill();g.beginPath();g.ellipse(cx+d*s*.2,cy+s*.2,s*.12,s*.06,-d*.5,0,7);g.fill();}g.fillStyle='rgba(120,30,40,.9)';g.beginPath();g.ellipse(cx,cy,s*.07,s*.15,0,0,7);g.fill();};
   const s=w/2;for(let y=0;y<2;y++)for(let x=0;x<2;x++){motif(x*s+s/2,y*h/2+h/4,s*.9);motif(x*s,y*h/2,s*.5);}g.fillStyle='rgba(0,0,0,.12)';for(let i=0;i<w;i+=w/16)g.fillRect(i,0,1,h);}
  ,wainscot:(g,w,h)=>{g.fillStyle='#2a140b';g.fillRect(0,0,w,h);g.fillStyle='#4b2414';g.fillRect(w*.08,h*.12,w*.84,h*.76);const gr=g.createLinearGradient(0,h*.2,0,h*.8);gr.addColorStop(0,'#6a3520');gr.addColorStop(1,'#3d1c10');g.fillStyle=gr;g.fillRect(w*.16,h*.24,w*.68,h*.52);for(let k=0;k<20;k++){g.fillStyle='rgba(25,10,4,.25)';g.fillRect(w*.16+rnd()*w*.68,h*.24,1.5,h*.52);}g.strokeStyle='rgba(200,150,80,.35)';g.lineWidth=2;g.strokeRect(w*.16,h*.24,w*.68,h*.52);}
  ,runner:(g,w,h)=>{g.fillStyle='#7a1420';g.fillRect(0,0,w,h);g.fillStyle='#1d2a55';g.fillRect(0,0,w*.12,h);g.fillRect(w*.88,0,w*.12,h);g.fillStyle='#c79a4d';g.fillRect(w*.12,0,w*.03,h);g.fillRect(w*.85,0,w*.03,h);for(let y=0;y<h;y+=h/8){g.beginPath();g.arc(w*.06,y+h/16,w*.03,0,7);g.arc(w*.94,y+h/16,w*.03,0,7);g.fill();}
   const c=[w/2,h/2];g.fillStyle='#c79a4d';g.beginPath();g.moveTo(c[0],h*.12);g.lineTo(w*.78,c[1]);g.lineTo(c[0],h*.88);g.lineTo(w*.22,c[1]);g.closePath();g.fill();g.fillStyle='#1d2a55';g.beginPath();g.moveTo(c[0],h*.2);g.lineTo(w*.7,c[1]);g.lineTo(c[0],h*.8);g.lineTo(w*.3,c[1]);g.closePath();g.fill();g.fillStyle='#9a2a30';g.beginPath();g.arc(c[0],c[1],w*.12,0,7);g.fill();g.fillStyle='#e0b862';g.beginPath();g.arc(c[0],c[1],w*.05,0,7);g.fill();
   for(const y of [0,h])for(const x of [w*.3,w*.7]){g.fillStyle='#c79a4d';g.beginPath();g.arc(x,y,w*.06,0,7);g.fill();}}
  ,parquet:(g,w,h)=>{g.fillStyle='#3a2012';g.fillRect(0,0,w,h);const n=8;for(let y=0;y<n;y++)for(let x=0;x<n;x++){const k=rnd(),v=70+k*30|0;g.fillStyle=`rgb(${v},${v*.55|0},${v*.3|0})`;if((x+y)%2)g.fillRect(x*w/n+1,y*h/n+1,w/n-2,h/n/2-1),g.fillRect(x*w/n+1,y*h/n+h/n/2+1,w/n-2,h/n/2-2);else g.fillRect(x*w/n+1,y*h/n+1,w/n/2-1,h/n-2),g.fillRect(x*w/n+w/n/2+1,y*h/n+1,w/n/2-2,h/n-2);}}
  ,coffer:(g,w,h)=>{g.fillStyle='#efe4cc';g.fillRect(0,0,w,h);g.strokeStyle='#b8925a';g.lineWidth=w*.04;g.strokeRect(w*.1,h*.1,w*.8,h*.8);g.strokeStyle='rgba(150,110,60,.5)';g.lineWidth=w*.015;g.strokeRect(w*.2,h*.2,w*.6,h*.6);g.fillStyle='#d9c49a';g.beginPath();g.arc(w/2,h/2,w*.1,0,7);g.fill();}
  ,portrait1:(g,w,h)=>{const gr=g.createRadialGradient(w/2,h*.4,w*.1,w/2,h/2,w*.8);gr.addColorStop(0,'#5a4a30');gr.addColorStop(1,'#140e08');g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='#1d1612';g.beginPath();g.ellipse(w/2,h*.92,w*.36,h*.32,0,0,7);g.fill();g.fillStyle='#c9a080';g.beginPath();g.ellipse(w/2,h*.4,w*.15,h*.14,0,0,7);g.fill();g.fillStyle='#2a1c12';g.beginPath();g.ellipse(w/2,h*.31,w*.17,h*.08,0,Math.PI,0);g.fill();g.fillStyle='#e8e0d0';g.fillRect(w*.44,h*.55,w*.12,h*.08);}
  ,portrait2:(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#8aa0b0');gr.addColorStop(.55,'#d9c69a');gr.addColorStop(.56,'#3f5a2c');gr.addColorStop(1,'#26381c');g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='#2c4a6a';g.fillRect(0,h*.62,w,h*.08);for(let i=0;i<5;i++){g.fillStyle='rgba(30,50,20,.9)';g.beginPath();g.arc(w*(.1+i*.2),h*.5,w*.1,0,7);g.fill();}g.fillStyle='#e6dcc0';g.fillRect(w*.6,h*.42,w*.12,h*.12);g.fillStyle='#8a3a2a';g.beginPath();g.moveTo(w*.58,h*.42);g.lineTo(w*.66,h*.34);g.lineTo(w*.74,h*.42);g.fill();}
  ,portrait3:(g,w,h)=>{g.fillStyle='#1a1410';g.fillRect(0,0,w,h);const vase=[w/2,h*.62];g.fillStyle='#6a5030';g.beginPath();g.ellipse(vase[0],vase[1],w*.14,h*.16,0,0,7);g.fill();for(let i=0;i<9;i++){g.fillStyle=['#b8323a','#e0b050','#e8e0d8','#7a2a5a'][i%4];g.beginPath();g.arc(w*(.3+rnd()*.4),h*(.22+rnd()*.25),w*.07,0,7);g.fill();}g.fillStyle='#3a5a2a';for(let i=0;i<5;i++){g.beginPath();g.ellipse(w*(.3+rnd()*.4),h*(.4+rnd()*.1),w*.08,h*.03,rnd(),0,7);g.fill();}}
  ,pantlindArch:(g,w,h)=>{g.fillStyle='#2a160c';g.fillRect(0,0,w,h);g.strokeStyle='#c79a4d';g.lineWidth=3;g.strokeRect(4,4,w-8,h-8);g.fillStyle='#e2c27a';g.font=`${h*.5|0}px Georgia, serif`;g.textAlign='center';g.textBaseline='middle';g.fillText('THE  PANTLIND',w/2,h*.56);}
 };
 // The Amway glass tower: pale sky-blue reflective glass with clouds, thin
 // vertical mullions, floor lines, a band at the crown and a row of dark
 // openings below the roof. One canvas covers a whole face.
 function towerFace(g,w,h,cols,floors,crownFloor,openings){
  const sky=g.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#b9d3ec');sky.addColorStop(.35,'#8fb3d9');sky.addColorStop(.75,'#5f8cbc');sky.addColorStop(1,'#46709f');g.fillStyle=sky;g.fillRect(0,0,w,h);
  for(let i=0;i<26;i++){const cx=rnd()*w,cy=h*(.05+rnd()*.8),rx=w*(.15+rnd()*.35),ry=h*(.015+rnd()*.04),gr=g.createRadialGradient(cx,cy,0,cx,cy,rx);gr.addColorStop(0,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.beginPath();g.ellipse(cx,cy,rx,ry*2.5,0,0,7);g.fill();}
  for(let c=0;c<cols;c++){if(rnd()<.35){g.fillStyle=`rgba(40,70,110,${.05+rnd()*.1})`;g.fillRect(c*w/cols,0,w/cols,h);}}
  const fh=h/floors;g.fillStyle='rgba(60,85,115,.55)';for(let f=0;f<=floors;f++)g.fillRect(0,h-f*fh-1,w,2);
  g.fillStyle='rgba(55,70,90,.85)';for(let c=0;c<=cols;c++)g.fillRect(c*w/cols-1,0,2,h);
  const cy=h-crownFloor*fh;g.fillStyle='#3a4a5c';g.fillRect(0,cy-3,w,6);
  const top=h-(floors-.25)*fh,ow=w/cols*2.4,gap=w/cols*1.0,total=openings*ow+(openings-1)*gap;g.fillStyle='#1b2430';for(let i=0;i<openings;i++)g.fillRect((w-total)/2+i*(ow+gap),top,ow,fh*1.25);
 }
 let doorWings=null,doorFrames=null,doorAngle=0;
 function buildInterior(){
  const I=C.blocks.interior,F=I.floor,L=I.lobby,R=I.restaurant,dr=I.door,e=B.entrance,t={};
  for(const [k,f] of Object.entries(ITEX))t[k]=canvas(k==='pantlindArch'?512:k==='rug'||k==='dome'?512:k==='mural'||k==='marble'||k==='herring'?512:256,k==='pantlind'?64:k==='pantlindArch'?96:k==='corridor'?256:k==='mural'?512:256,f);
  const glow=(c,s=.35)=>c.slice(0,3).map(v=>v*s);
  let m;
  // disc / ring / band helpers (horizontal circles), around centre (cx,cz)
  const disc=(m,cx,cz,r,y,down=false,seg=28)=>{for(let i=0;i<seg;i++){const a=i/seg*Math.PI*2,b=(i+1)/seg*Math.PI*2,P=t=>[cx+Math.cos(t)*r,y,cz+Math.sin(t)*r],U=t=>[.5+Math.cos(t)*.5,.5+Math.sin(t)*.5];m.quad([[cx,y,cz],P(a),P(b),[cx,y,cz]],[0,down?-1:1,0],[[.5,.5],U(a),U(b),[.5,.5]]);}};
  const ring=(m,cx,cz,r0,r1,y,down=false,seg=28)=>{for(let i=0;i<seg;i++){const a=i/seg*Math.PI*2,b=(i+1)/seg*Math.PI*2,P=(r,t)=>[cx+Math.cos(t)*r,y,cz+Math.sin(t)*r];m.quad([P(r0,a),P(r1,a),P(r1,b),P(r0,b)],[0,down?-1:1,0]);}};
  const band=(m,cx,cz,r,y0,y1,a0=0,a1=Math.PI*2,seg=28)=>{const n=Math.max(2,Math.round(seg*(a1-a0)/(Math.PI*2)));for(let i=0;i<n;i++){const a=a0+(a1-a0)*i/n,b=a0+(a1-a0)*(i+1)/n,mid=(a+b)/2;m.quad([[cx+Math.cos(a)*r,y0,cz+Math.sin(a)*r],[cx+Math.cos(b)*r,y0,cz+Math.sin(b)*r],[cx+Math.cos(b)*r,y1,cz+Math.sin(b)*r],[cx+Math.cos(a)*r,y1,cz+Math.sin(a)*r]],[Math.cos(mid),0,Math.sin(mid)]);}};
  // ---- revolving door (rotating wings are their own batches) ----
  m=builder();ring(m,dr.x,dr.z,0,dr.r+.06,dr.height,true,32);band(m,dr.x,dr.z,dr.r+.06,dr.height,dr.height+.12,0,Math.PI*2,32);ring(m,dr.x,dr.z,0,dr.r+.06,dr.height+.12,false,32);
  for(const a of [Math.PI*.28,Math.PI*.72,Math.PI*1.28,Math.PI*1.72])m.cylinder(dr.x+Math.cos(a)*dr.r,dr.z+Math.sin(a)*dr.r,F,dr.height,.025,8);
  m.upload('revolving door canopy',{color:[.55,.42,.2,1],metal:.85,rough:.3});
  m=builder();band(m,dr.x,dr.z,dr.r,F,dr.height,Math.PI*.28,Math.PI*.72,12);band(m,dr.x,dr.z,dr.r,F,dr.height,Math.PI*1.28,Math.PI*1.72,12);
  m.upload('revolving door drum',{color:[.75,.85,.9,.28],metal:.9,rough:.05,transparent:true,doubleSided:true});
  m=builder();disc(m,dr.x,dr.z,dr.r,I.ground+.004,false,28);m.upload('revolving door mat',{color:[.12,.11,.1,1],rough:1});
  m=builder();for(let k=0;k<4;k++){const a=k*Math.PI/2,c=Math.cos(a),sn=Math.sin(a);m.quad([[dr.x,F+.03,dr.z],[dr.x+c*(dr.r-.03),F+.03,dr.z+sn*(dr.r-.03)],[dr.x+c*(dr.r-.03),dr.height-.03,dr.z+sn*(dr.r-.03)],[dr.x,dr.height-.03,dr.z]],[-sn,0,c]);}
  doorWings=m.upload('revolving door wings',{color:[.78,.88,.92,.3],metal:.9,rough:.05,transparent:true,doubleSided:true});
  m=builder();m.cylinder(dr.x,dr.z,F,dr.height,.04,10);for(let k=0;k<4;k++){const a=k*Math.PI/2,c=Math.cos(a),sn=Math.sin(a),ex=dr.x+c*(dr.r-.03),ez=dr.z+sn*(dr.r-.03);m.cylinder(ex,ez,F+.03,dr.height-.03,.018,6);m.tube([dr.x,.45,dr.z],[ex,.45,ez],.012,5);}
  doorFrames=m.upload('revolving door frames',{color:[.62,.47,.22,1],metal:.85,rough:.3});
  // ---- lobby ----
  const [lx0,lx1]=L.x,lz0=I.lobby.partition,lz1=L.z[1],D=L.dome;const H=I.hallway;
  m=builder();m.face([lx0,F,lz1],[0,0,-1],[1,0,0],lz1-lz0,lx1-lx0,[0,1,0],1.6,1.6);m.upload('lobby marble floor',{baseTexture:t.marble,color:[1,1,1,1],metal:.25,rough:.18,emission:[.16,.13,.08]});
  m=builder();m.face([lx0,L.ceiling,lz0],[0,0,1],[1,0,0],lz1-lz0,lx1-lx0,[0,-1,0],.7,.7);m.upload('lobby ceiling',{baseTexture:t.tiles,color:[1,1,1,1],rough:.9,emission:[.22,.22,.2]});
  const gap=[dr.z-dr.r-.07,dr.z+dr.r+.07];
  m=builder();for(const [a,b] of [[lz0,gap[0]],[gap[1],lz1]])m.face([lx0+.02,F,b],[0,0,-1],[0,1,0],b-a,L.ceiling-F,[1,0,0],1.4,L.ceiling-F);
  m.face([lx1-.02,F,lz0],[0,0,1],[0,1,0],lz1-lz0,L.ceiling-F,[-1,0,0],1.4,L.ceiling-F);
  m.face([lx1,F,lz1-.02],[-1,0,0],[0,1,0],lx1-I.pier.x[1],L.ceiling-F,[0,0,-1],1.4,L.ceiling-F);m.face([I.pier.x[0],F,lz1-.02],[-1,0,0],[0,1,0],I.pier.x[0]-lx0,L.ceiling-F,[0,0,-1],1.4,L.ceiling-F);
  m.face([I.pier.x[1],I.pier.top,lz1-.02],[-1,0,0],[0,1,0],I.pier.x[1]-I.pier.x[0],L.ceiling-I.pier.top,[0,0,-1],1e9,1e9);
  m.upload('lobby walls',{baseTexture:t.cream,color:[1,1,1,1],rough:.8,emission:[.2,.18,.15]});
  // Check-in desk against the far wall (straight ahead from the door), in
  // front of wood paneling with a landscape painting.
  const dk=L.desk,dz0=dk.z[0]-.4,dz1=dk.z[1]+.4;
  m=builder();m.face([lx1-.03,F,dz0],[0,0,1],[0,1,0],dz1-dz0,L.ceiling-F,[-1,0,0],1.2,L.ceiling-F);m.upload('lobby wood paneling',{baseTexture:t.wood,color:[1,1,1,1],rough:.5,emission:[.12,.07,.04]});
  m=builder();m.face([lx1-.04,.78,(dk.z[0]+dk.z[1])/2-.55],[0,0,1],[0,1,0],1.1,.62,[-1,0,0],1.1,.62);m.upload('lobby painting',{baseTexture:t.painting,color:[1,1,1,1],emission:[.2,.18,.15]});
  m=builder();m.box([dk.x[0],F+.05,dk.z[0]],[dk.x[1],.36,dk.z[1]],[1.2,.31],['-y','+y']);m.upload('check-in desk wood',{baseTexture:t.wood,color:[1,1,1,1],rough:.45,emission:[.1,.06,.03]});
  m=builder();m.box([dk.x[0]-.05,.36,dk.z[0]-.03],[dk.x[1]+.03,.39,dk.z[1]+.03],[1,.5],['-y']);m.box([dk.x[0]-.01,F,dk.z[0]],[dk.x[1],F+.05,dk.z[1]],[1,.5],['-y']);m.upload('check-in desk granite',{baseTexture:t.marble,color:[.8,.78,.74,1],metal:.2,rough:.25});
  m=builder();for(let z=dk.z[0]+.4;z<dk.z[1]-.2;z+=.75)m.box([dk.x[0]+.05,.39,z-.11],[dk.x[0]+.08,.55,z+.11]);m.upload('check-in monitors',{color:[.05,.06,.08,1],emission:[.05,.08,.14],rough:.3});
  // dome: dark wood ring, white cove, gold painted ceiling, brass bowl chandelier
  m=builder();band(m,D.x,D.z,D.r,L.ceiling-.16,L.ceiling,0,Math.PI*2,40);band(m,D.x,D.z,D.r-.12,L.ceiling-.16,L.ceiling-.04,0,Math.PI*2,40);ring(m,D.x,D.z,D.r-.12,D.r,L.ceiling-.16,true,40);ring(m,D.x,D.z,D.r,D.r+.08,L.ceiling-.05,true,40);
  m.upload('lobby dome ring',{color:[.16,.09,.05,1],rough:.35,metal:.2,emission:[.03,.02,.01]});
  m=builder();ring(m,D.x,D.z,D.r-.3,D.r-.12,L.ceiling-.042,true,40);m.upload('lobby dome cove',{color:[1,.98,.92,1],emission:[.9,.86,.75]});
  m=builder();disc(m,D.x,D.z,D.r-.3,L.ceiling-.04,true,40);m.upload('lobby dome',{baseTexture:t.dome,color:[1,1,1,1],emission:[.65,.55,.35],rough:.6});
  m=builder();const bowl=(cx,cy,cz,r,sy)=>{const seg=16,rings=5;for(let j=0;j<rings;j++){const t0=Math.PI/2+j/rings*Math.PI/2,t1=Math.PI/2+(j+1)/rings*Math.PI/2;for(let i=0;i<seg;i++){const a=i/seg*Math.PI*2,b=(i+1)/seg*Math.PI*2,P=(t,p)=>[cx+Math.sin(t)*Math.cos(p)*r,cy+Math.cos(t)*r*sy,cz+Math.sin(t)*Math.sin(p)*r];m.quad([P(t0,a),P(t1,a),P(t1,b),P(t0,b)],[Math.sin((t0+t1)/2)*Math.cos((a+b)/2),Math.cos((t0+t1)/2),Math.sin((t0+t1)/2)*Math.sin((a+b)/2)]);}}};
  bowl(D.x,1.42,D.z,.42,.42);m.upload('chandelier bowl',{color:[1,.95,.82,1],emission:[1.05,.92,.68],rough:.5});
  m=builder();band(m,D.x,D.z,.43,1.4,1.45,0,Math.PI*2,24);band(m,D.x,D.z,.31,1.3,1.33,0,Math.PI*2,24);for(let k=0;k<4;k++){const a=k*Math.PI/2+Math.PI/4;m.tube([D.x+Math.cos(a)*.42,1.44,D.z+Math.sin(a)*.42],[D.x+Math.cos(a)*.08,L.ceiling-.04,D.z+Math.sin(a)*.08],.012,5);}
  m.upload('chandelier brass',{color:[.75,.58,.25,1],metal:.9,rough:.3,emission:[.12,.09,.04]});
  // round oriental rug, pedestal table with flowers, stanchions with blue rope
  m=builder();disc(m,D.x,D.z,1.12,F+.006,false,40);m.upload('lobby rug',{baseTexture:t.rug,color:[1,1,1,1],rough:1,emission:[.12,.1,.1]});
  m=builder();disc(m,D.x,D.z,.32,.3,false,24);band(m,D.x,D.z,.32,.27,.3,0,Math.PI*2,24);m.cylinder(D.x,D.z,F,.27,.045,8);for(let k=0;k<4;k++){const a=k*Math.PI/2;m.tube([D.x,.06,D.z],[D.x+Math.cos(a)*.2,F+.01,D.z+Math.sin(a)*.2],.02,5);}m.upload('lobby table',{color:[.12,.07,.04,1],metal:.2,rough:.25});
  for(const [i,c] of [[.95,.55,.15],[.95,.82,.3],[.9,.35,.5],[.3,.55,.25]].entries()){m=builder();for(let k=0;k<7;k++){const a=rnd()*Math.PI*2,r=rnd()*.13;m.sphere([D.x+Math.cos(a)*r,.36+rnd()*.16+(i===3?-.04:0),D.z+Math.sin(a)*r],.04+rnd()*.03,1,6,4);}m.upload('lobby flowers '+i,{color:[...c,1],rough:.9,emission:glow(c,.15)});}
  const posts=[];for(let k=0;k<7;k++){const a=Math.PI*(-.35+k*.117);posts.push([D.x+Math.cos(a)*1.22,D.z+Math.sin(a)*1.22]);}
  m=builder();for(const [x,z] of posts){m.cylinder(x,z,F,.36,.022,8);m.sphere([x,.38,z],.035,1,8,5);disc(m,x,z,.08,F+.01,false,12);}m.upload('stanchions',{color:[.8,.7,.45,1],metal:.9,rough:.25});
  m=builder();for(let k=0;k+1<posts.length;k++){const [x0,z0]=posts[k],[x1,z1]=posts[k+1],mid=[(x0+x1)/2,.24,(z0+z1)/2];m.tube([x0,.33,z0],mid,.012,5);m.tube(mid,[x1,.33,z1],.012,5);}m.upload('stanchion ropes',{color:[.12,.18,.55,1],rough:.6});
  // a pair of armchairs and recessed ceiling lights
  const chairs=[[-26.55,2.7],[-26.55,3.7]];m=builder();for(const [x,z] of chairs){m.box([x-.2,F,z-.22],[x+.2,.17,z+.22],[1e9,1e9],['-y']);m.box([x-.2,.17,z-.22],[x-.12,.46,z+.22],[1e9,1e9],['-y']);m.box([x-.12,.17,z-.22],[x+.2,.27,z-.17],[1e9,1e9],['-y']);m.box([x-.12,.17,z+.17],[x+.2,.27,z+.22],[1e9,1e9],['-y']);}m.upload('lobby armchairs',{color:[.62,.55,.5,1],rough:.9,emission:[.08,.07,.06]});
  m=builder();for(let x=lx0+.7;x<lx1-.4;x+=1.3)for(let z=lz0+.7;z<lz1-.3;z+=1.4){if(Math.hypot(x-D.x,z-D.z)<D.r+.3)continue;disc(m,x,z,.07,L.ceiling-.004,true,10);}m.upload('lobby downlights',{color:[1,1,.95,1],emission:[1,.95,.85]});
  // ---- Victorian hallway (175): the Pantlind wing, lobby to hospitality ----
  {const [hx0,hx1]=H.x,[hz0,hz1]=H.z,[r0,r1]=H.ramp,CEIL=H.ceiling,cx=(hx0+hx1)/2;
   const fy=z=>z>=r1?F:z<=r0?H.high:F+(H.high-F)*(r1-z)/(r1-r0),cuts=[hz0,r0,r1,hz1];
   // pieces along the hallway, each at most `tile` long, following the ramp
   const span=(tile,fn)=>{for(let k=0;k<3;k++){const a=cuts[k],b=cuts[k+1],n=Math.max(1,Math.ceil((b-a)/tile-1e-6));for(let i=0;i<n;i++)fn(a+(b-a)*i/n,a+(b-a)*(i+1)/n,(b-a)/n/tile);}};
   const wallBand=(m,h0,h1,tile,inset=0)=>span(tile,(z0,z1,u)=>{for(const [x,nx] of [[hx0+inset,1],[hx1-inset,-1]])m.quad([[x,fy(z0)+h0,z0],[x,fy(z1)+h0,z1],[x,fy(z1)+h1,z1],[x,fy(z0)+h1,z0]],[nx,0,0],[[0,1],[u,1],[u,0],[0,0]]);});
   const across=(m,x0,x1,dy,tile,ny)=>span(tile,(z0,z1,u)=>m.quad([[x0,fy(z0)+dy,z0],[x1,fy(z0)+dy,z0],[x1,fy(z1)+dy,z1],[x0,fy(z1)+dy,z1]],[0,ny,0],[[0,0],[1,0],[1,u],[0,u]]));
   m=builder();across(m,hx0,hx1,0,1.2,1);m.upload('hallway parquet',{baseTexture:t.parquet,color:[1,1,1,1],rough:.45,emission:[.06,.04,.03]});
   m=builder();across(m,hx0+.38,hx1-.38,.004,1.3,1);m.upload('hallway runner',{baseTexture:t.runner,color:[1,1,1,1],rough:1,emission:[.08,.05,.05]});
   m=builder();across(m,hx0,hx1,CEIL,1.1,-1);m.upload('hallway coffered ceiling',{baseTexture:t.coffer,color:[1,1,1,1],rough:.8,emission:[.25,.22,.18]});
   m=builder();wallBand(m,0,.5,.9);m.upload('hallway wainscot',{baseTexture:t.wainscot,color:[1,1,1,1],rough:.45,emission:[.05,.03,.02]});
   m=builder();wallBand(m,.55,1.52,.75);m.upload('hallway damask',{baseTexture:t.damask,color:[1,1,1,1],rough:.85,emission:[.1,.04,.04]});
   m=builder();wallBand(m,0,.06,1e9,-.012);wallBand(m,.5,.55,1e9,-.015);m.upload('hallway rails',{color:[.17,.08,.04,1],rough:.35,metal:.2});
   m=builder();wallBand(m,1.52,CEIL,1e9,-.01);span(1e9,(z0,z1)=>{for(const [x,nx] of [[hx0,1],[hx1,-1]])m.quad([[x+nx*.07,fy(z0)+CEIL-.005,z0],[x+nx*.07,fy(z1)+CEIL-.005,z1],[x,fy(z1)+CEIL-.08,z1],[x,fy(z0)+CEIL-.08,z0]],[nx,-1,0]);});m.upload('hallway crown molding',{color:[.86,.74,.5,1],metal:.4,rough:.4,emission:[.12,.1,.06]});
   // two arches across the hallway (Victorian spandrels with a wood soffit)
   const archAt=(m,z,spring,crown,th=.08)=>{const N=12,hw=(hx1-hx0)/2,base=fy(z),P=t=>[cx-hw*Math.cos(t),base+spring+(crown-spring)*Math.sin(t)];for(let i=0;i<N;i++){const [xa,ya]=P(i/N*Math.PI),[xb,yb]=P((i+1)/N*Math.PI);for(const dz of [-th,th])m.quad([[xa,ya,z+dz],[xb,yb,z+dz],[xb,base+CEIL,z+dz],[xa,base+CEIL,z+dz]],[0,0,Math.sign(dz)]);m.quad([[xa,ya,z-th],[xb,yb,z-th],[xb,yb,z+th],[xa,ya,z+th]],[0,-1,0]);}};
   m=builder();for(const z of [-8.0,-11.1])archAt(m,z,1.18,1.52);m.upload('hallway arches',{color:[.3,.15,.08,1],rough:.4,metal:.15,emission:[.04,.02,.01]});
   // brass sconces with glowing shades, framed paintings between them
   const sconces=[],frames=[];for(let z=-6.3,k=0;z>hz0+.4;z-=1.25,k++){sconces.push([k%2?hx1:hx0,z]);if(z-.62>hz0+.4)frames.push([k%2?hx0:hx1,z-.62,k%3]);}
   m=builder();for(const [x,z] of sconces){const nx=x===hx0?1:-1,y=fy(z)+1.0;m.box([x-(nx<0?.02:0),y-.08,z-.05],[x+(nx>0?.02:0),y+.08,z+.05]);m.tube([x+nx*.02,y,z],[x+nx*.14,y+.06,z],.012,5);}m.upload('hallway sconce brass',{color:[.78,.6,.27,1],metal:.9,rough:.3,emission:[.1,.08,.03]});
   m=builder();for(const [x,z] of sconces){const nx=x===hx0?1:-1;m.sphere([x+nx*.14,fy(z)+1.12,z],.055,1.3,8,5);}m.upload('hallway sconce shades',{color:[1,.9,.7,1],emission:[1.3,1.0,.6],rough:.6});
   for(const variant of [0,1,2]){m=builder();for(const [x,z,v] of frames){if(v!==variant)continue;const nx=x===hx0?1:-1,y=fy(z)+.68;m.face([x+nx*.026,y,nx>0?z+.24:z-.24],[0,0,-nx],[0,1,0],.48,.6,[nx,0,0],.48,.6);}m.upload('hallway painting '+variant,{baseTexture:t['portrait'+(variant+1)],color:[1,1,1,1],rough:.6,emission:[.12,.1,.08]});}
   m=builder();for(const [x,z] of frames){const nx=x===hx0?1:-1,y=fy(z)+.68,x0=nx>0?x:x-.024,x1=nx>0?x+.024:x;for(const [a,b,c,d] of [[y-.05,y,z-.29,z+.29],[y+.6,y+.65,z-.29,z+.29],[y,y+.6,z-.29,z-.24],[y,y+.6,z+.24,z+.29]])m.box([x0,a,c],[x1,b,d]);}m.upload('hallway gilt frames',{color:[.78,.6,.25,1],metal:.85,rough:.35,emission:[.08,.06,.02]});
   // small brass chandeliers on the centerline
   const lamps=[-6.9,-9.55,-12.45];m=builder();for(const z of lamps){const y=fy(z)+1.42;m.tube([cx,y+.06,z],[cx,fy(z)+CEIL,z],.008,4);band(m,cx,z,.17,y-.01,y+.02,0,Math.PI*2,16);for(let k=0;k<6;k++){const a=k/6*Math.PI*2;m.tube([cx,y,z],[cx+Math.cos(a)*.16,y,z+Math.sin(a)*.16],.008,4);}}m.upload('hallway chandelier brass',{color:[.78,.6,.27,1],metal:.9,rough:.3,emission:[.12,.09,.04]});
   m=builder();for(const z of lamps){const y=fy(z)+1.42;for(let k=0;k<6;k++){const a=k/6*Math.PI*2;m.sphere([cx+Math.cos(a)*.16,y+.05,z+Math.sin(a)*.16],.026,1.5,6,4);}}m.upload('hallway chandelier bulbs',{color:[1,.92,.75,1],emission:[1.4,1.15,.75]});
   // the lobby side: cream wall with an arched opening under "THE PANTLIND"
   {const spring=1.12,crown=1.42,N=14,hw=(hx1-hx0)/2,zf=lz0+.02,P=t=>[cx-hw*Math.cos(t),F+spring+(crown-spring)*Math.sin(t)];
    m=builder();m.face([lx0,F,zf],[1,0,0],[0,1,0],hx0-lx0,L.ceiling-F,[0,0,1],1.4,L.ceiling-F);m.face([hx1,F,zf],[1,0,0],[0,1,0],lx1-hx1,L.ceiling-F,[0,0,1],1.4,L.ceiling-F);
    for(let i=0;i<N;i++){const [xa,ya]=P(i/N*Math.PI),[xb,yb]=P((i+1)/N*Math.PI);m.quad([[xa,ya,zf],[xb,yb,zf],[xb,L.ceiling,zf],[xa,L.ceiling,zf]],[0,0,1]);}
    m.upload('Pantlind entrance wall',{baseTexture:t.cream,color:[1,1,1,1],rough:.8,emission:[.2,.18,.15]});
    m=builder();for(let i=0;i<N;i++){const [xa,ya]=P(i/N*Math.PI),[xb,yb]=P((i+1)/N*Math.PI);m.quad([[xa,ya,zf+.005],[xb,yb,zf+.005],[xb,yb+.07,zf+.005],[xa,ya+.07,zf+.005]],[0,0,1]);m.quad([[xa,ya,zf],[xb,yb,zf],[xb,yb,zf-.18],[xa,ya,zf-.18]],[0,-1,0]);}
    for(const x of [hx0,hx1])m.box([x-.07,F,zf-.02],[x+.07,F+spring+.02,zf+.03]);m.upload('Pantlind arch trim',{color:[.24,.12,.06,1],rough:.35,metal:.2,emission:[.03,.02,.01]});
    m=builder();m.face([cx-.62,F+crown+.08,zf+.012],[1,0,0],[0,1,0],1.24,.24,[0,0,1],1.24,.24);m.upload('Pantlind sign',{baseTexture:t.pantlindArch,color:[1,1,1,1],emission:[.35,.3,.22],rough:.4});}
   // the hospitality end: a wood door frame around the opening
   m=builder();m.box([hx0-.02,H.high,hz0-.05],[hx0+.08,H.high+CEIL,hz0+.12]);m.box([hx1-.08,H.high,hz0-.05],[hx1+.02,H.high+CEIL,hz0+.12]);m.upload('hallway doorway frame',{color:[.24,.12,.06,1],rough:.35,metal:.2});
   window.CityLighting131?.addLights(lamps.map((z,i)=>({id:'WestFront172 hallway '+i,p:[cx,fy(z)+1.3,z],radius:2.6,power:1.6,color:[1,.82,.58],direction:[0,-1,0],outer:-1,alwaysOn:true})));
   // contacts: floors (flat, ramp, flat), side walls
   collider('hallway floor',[hx0,-.4,r1],[hx1,F,hz1]);collider('hallway floor high',[hx0,-.4,hz0],[hx1,H.high,r0]);
   {const p=[];for(const y of [-.4,1])for(const z of [r0,r1])for(const x of [hx0,hx1])p.push(x,y<0?-.4:(z===r0?H.high:F),z);registerCollider('WestFront172 hallway ramp','westFront172',new Float32Array(p),new Uint32Array(colliderIds),false,{});stats.colliders++;}
   collider('hallway wall',[hx0-.1,F,hz0],[hx0,H.high+CEIL+.1,hz1]);collider('hallway wall',[hx1,F,hz0],[hx1+.1,H.high+CEIL+.1,hz1]);
   collider('hallway ceiling',[hx0,F+CEIL,r1],[hx1,F+CEIL+.1,hz1]);collider('hallway ceiling',[hx0,H.high+CEIL,hz0],[hx1,H.high+CEIL+.1,r1]);}
  // ---- restaurant inside the glass entrance ----
  const [rx0,rx1]=R.x,[rz0,rz1]=R.z,RC=R.ceiling,MZ=R.mezzanine;
  m=builder();m.face([rx0,F,rz1],[0,0,-1],[1,0,0],rz1-rz0,rx1-rx0,[0,1,0],1.5,1.5);m.upload('restaurant herringbone floor',{baseTexture:t.herring,color:[1,1,1,1],rough:.55,emission:[.1,.1,.1]});
  // passage through the pier from the lobby
  {const pz0=lz1,pz1=rz0;m=builder();m.face([I.pier.x[0],F,pz1],[0,0,-1],[1,0,0],pz1-pz0,I.pier.x[1]-I.pier.x[0],[0,1,0],1.6,1.6);m.upload('pier passage floor',{baseTexture:t.marble,color:[1,1,1,1],metal:.25,rough:.18,emission:[.16,.13,.08]});
   m=builder();m.face([I.pier.x[0],I.pier.top,pz0],[0,0,1],[1,0,0],pz1-pz0,I.pier.x[1]-I.pier.x[0],[0,-1,0],1e9,1e9);m.upload('pier passage ceiling',{color:[.9,.88,.84,1],emission:[.25,.24,.22]});
   collider('pier passage floor',[I.pier.x[0],-.4,pz0],[I.pier.x[1],F,pz1]);}
  m=builder();m.face([rx0,RC,rz0],[0,0,1],[1,0,0],rz1-rz0,rx1-rx0,[0,-1,0],1e9,1e9);m.upload('restaurant ceiling',{color:[.95,.95,.97,1],rough:.9,emission:[.3,.3,.34]});
  m=builder();for(const z of [rz0+.06,rz1-.06])m.box([rx0+.3,RC-.08,z-.04],[rx1,RC-.02,z+.04]);m.box([MZ.x-.04,MZ.y-.1,rz0],[MZ.x+.02,MZ.y-.06,rz1]);m.box([rx0+.6,RC-.08,rz0],[rx0+.66,RC-.02,rz1]);m.upload('restaurant purple cove light',{color:[.55,.35,1,1],emission:[.75,.45,1.4]});
  // walls: pier side (opening to the lobby), end wall with the wave mural, dark back wall
  const pr=I.pier;m=builder();m.face([rx0,F,rz0+.01],[1,0,0],[0,1,0],pr.x[0]-rx0,RC-F,[0,0,1],1e9,1e9);m.face([pr.x[1],F,rz0+.01],[1,0,0],[0,1,0],rx1-pr.x[1],RC-F,[0,0,1],1e9,1e9);m.face([pr.x[0],pr.top,rz0+.01],[1,0,0],[0,1,0],pr.x[1]-pr.x[0],RC-pr.top,[0,0,1],1e9,1e9);
  m.face([rx1-.02,MZ.y,rz0],[0,0,1],[0,1,0],rz1-rz0,RC-MZ.y,[-1,0,0],1e9,1e9);m.upload('restaurant walls',{color:[.86,.78,.86,1],rough:.8,emission:[.3,.24,.32]});
  m=builder();m.face([rx1-.02,F,rz0],[0,0,1],[0,1,0],rz1-rz0,MZ.y-F,[-1,0,0],1.2,MZ.y-F);m.face([rx0,F,rz1-.01],[1,0,0],[0,1,0],-27.6-rx0,RC-F,[0,0,-1],1.2,RC-F);m.face([MZ.x,F,rz1-.01],[1,0,0],[0,1,0],rx1-MZ.x,RC-F,[0,0,-1],1.2,RC-F);m.upload('restaurant dark panels',{baseTexture:t.wood,color:[.55,.5,.5,1],rough:.5,emission:[.05,.04,.04]});
  m=builder();m.face([-27.6,F,rz1-.01],[1,0,0],[0,1,0],MZ.x+27.6,RC-F,[0,0,-1],MZ.x+27.6,RC-F);m.upload('restaurant wave mural',{baseTexture:t.mural,color:[1,1,1,1],rough:.7,emission:[.5,.5,.6]});
  // white sculptural columns along the windows (stacked tapering drums)
  const colZ=[6.5,8.4,10.3,12.2],colX=rx0+.45;m=builder();for(const z of colZ){const seg=9,hh=(RC-F)/seg;for(let k=0;k<seg;k++){const y0=F+k*hh,y1=y0+hh,r0=k%2?.2:.13,r1=k%2?.13:.2;for(let i=0;i<12;i++){const a=i/12*Math.PI*2,b=(i+1)/12*Math.PI*2,mid=(a+b)/2;m.quad([[colX+Math.cos(a)*r0,y0,z+Math.sin(a)*r0],[colX+Math.cos(b)*r0,y0,z+Math.sin(b)*r0],[colX+Math.cos(b)*r1,y1,z+Math.sin(b)*r1],[colX+Math.cos(a)*r1,y1,z+Math.sin(a)*r1]],[Math.cos(mid),(r0-r1)*1.5,Math.sin(mid)]);}}}
  m.upload('restaurant white columns',{color:[.95,.94,.92,1],rough:.6,emission:[.3,.3,.3]});
  // back-bar cabinets between the columns, the bar and its white stools
  const cabZ=[[6.75,8.15],[8.65,10.05],[10.55,11.95]];m=builder();for(const [a,b] of cabZ)m.face([rx0+.42,F,a],[0,0,1],[0,1,0],b-a,1.25-F,[1,0,0],b-a,1.25-F);m.upload('restaurant wine cabinets',{baseTexture:t.cabinet,color:[1,1,1,1],emission:[.35,.28,.2],rough:.4});
  m=builder();for(const [a,b] of cabZ)m.box([rx0+.05,F,a],[rx0+.42,1.25,b],[1e9,1e9],['+x']);m.upload('restaurant cabinet bodies',{color:[.32,.24,.16,1],rough:.5,emission:[.05,.04,.03]});
  const bar={x:[rx0+1.2,rx0+1.5],z:[6.4,12.6]};m=builder();m.box([bar.x[0],F,bar.z[0]],[bar.x[1],.36,bar.z[1]],[1e9,1e9],['-y']);m.upload('restaurant bar',{color:[.72,.6,.42,1],rough:.5,emission:[.1,.08,.05]});
  m=builder();m.box([bar.x[0]-.04,.36,bar.z[0]-.04],[bar.x[1]+.06,.39,bar.z[1]+.04]);m.upload('restaurant bar top',{color:[.25,.25,.27,1],metal:.3,rough:.2});
  m=builder();for(let z=bar.z[0]+.3;z<bar.z[1];z+=.5){m.cylinder(bar.x[1]+.3,z,.22,.27,.11,10);band(m,bar.x[1]+.3,z,.11,.27,.36,Math.PI*-.5,Math.PI*.5,8);}m.upload('restaurant stools',{color:[.95,.94,.9,1],rough:.6,emission:[.2,.2,.2]});
  m=builder();for(let z=bar.z[0]+.3;z<bar.z[1];z+=.5){m.cylinder(bar.x[1]+.3,z,F,.22,.02,6);disc(m,bar.x[1]+.3,z,.09,F+.01,false,10);}m.upload('restaurant stool bases',{color:[.78,.6,.28,1],metal:.85,rough:.3});
  // tables with marble tops and gray chairs; a teal communal table by the mural
  const tables=[];for(const x of [-26.6,-25.2])for(const z of [7.1,8.7,10.3,11.9])tables.push([x,z]);
  m=builder();for(const [x,z] of tables)m.box([x-.22,.25,z-.22],[x+.22,.27,z+.22],[.44,.02]);m.upload('restaurant marble tables',{baseTexture:t.tableTop,color:[1,1,1,1],rough:.3,emission:[.25,.25,.25]});
  m=builder();for(const [x,z] of tables){m.cylinder(x,z,F,.25,.03,6);for(const s of [-1,1]){const cz=z+s*.36;m.box([x-.15,.13,cz-.13],[x+.15,.19,cz+.13],[1e9,1e9],['-y']);m.box([x-.15,.19,cz+s*.09],[x+.15,.42,cz+s*.13],[1e9,1e9]);}}m.upload('restaurant chairs',{color:[.45,.45,.46,1],rough:.95,emission:[.06,.06,.06]});
  m=builder();m.box([-26.9,.26,12.55],[-24.5,.29,12.95]);m.upload('restaurant communal table',{color:[.1,.4,.42,1],rough:.4,emission:[.03,.08,.08]});
  // mezzanine with a glass railing; lounge chairs and a TV underneath
  m=builder();m.box([MZ.x,MZ.y,rz0],[rx1,MZ.y+.08,rz1],[1e9,1e9]);m.upload('restaurant mezzanine',{color:[.12,.1,.1,1],rough:.5,emission:[.04,.03,.04]});
  m=builder();m.face([MZ.x-.01,MZ.y+.08,rz0],[0,0,1],[0,1,0],rz1-rz0,.32,[-1,0,0],1e9,1e9);m.upload('restaurant glass railing',{color:[.85,.9,.95,.25],transparent:true,doubleSided:true,metal:.9,rough:.05});
  m=builder();m.box([MZ.x-.03,MZ.y+.4,rz0],[MZ.x+.01,MZ.y+.43,rz1]);for(let z=rz0+.3;z<rz1;z+=.6)m.box([MZ.x-.02,MZ.y+.08,z-.01],[MZ.x,MZ.y+.42,z+.01]);m.upload('restaurant railing metal',{color:[.2,.2,.22,1],metal:.7,rough:.35});
  m=builder();m.face([rx1-.04,.5,9.0],[0,0,1],[0,1,0],1.3,.75,[-1,0,0],1.3,.75);m.upload('restaurant TV',{baseTexture:t.tv,color:[1,1,1,1],emission:[.8,.8,.8]});
  m=builder();for(const [x,z] of [[-22.7,7.0],[-22.7,7.8],[-22.7,11.2],[-22.7,12.0]]){m.box([x-.22,F,z-.22],[x+.22,.18,z+.22],[1e9,1e9],['-y']);m.box([x+.12,.18,z-.22],[x+.22,.5,z+.22],[1e9,1e9],['-y']);}m.upload('restaurant lounge chairs',{color:[.55,.48,.48,1],rough:.9,emission:[.07,.06,.06]});
  m=builder();for(const x of [-26.3,-25.0]){m.sphere([x,1.3,12.75],.05,1,8,5);for(let k=0;k<10;k++){const a=rnd()*Math.PI*2,b=(rnd()-.5)*1.4,d=[Math.cos(a)*Math.cos(b),Math.sin(b),Math.sin(a)*Math.cos(b)],end=[x+d[0]*.3,1.3+d[1]*.3,12.75+d[2]*.3];m.tube([x,1.3,12.75],end,.006,4);m.sphere(end,.025,1,6,4);}}m.upload('restaurant chandeliers',{color:[1,.9,.7,1],emission:[1.1,.9,.6]});
  // lights (on day and night) so the rooms read as lit indoors
  window.CityLighting131?.addLights([
   {id:'WestFront172 lobby chandelier',p:[D.x,1.3,D.z],radius:4.2,power:3.2,color:[1,.85,.62],direction:[0,-1,0],outer:-1,alwaysOn:true},
   {id:'WestFront172 lobby desk',p:[-23.1,1.6,(L.desk.z[0]+L.desk.z[1])/2],radius:3.2,power:2,color:[1,.9,.75],direction:[0,-1,0],outer:-1,alwaysOn:true},
   {id:'WestFront172 restaurant bar',p:[-28.0,2.6,9.5],radius:5,power:2.6,color:[.95,.88,1],direction:[0,-1,0],outer:-1,alwaysOn:true},
   {id:'WestFront172 restaurant mural',p:[-25.6,2.4,12.2],radius:4,power:2,color:[.85,.75,1],direction:[0,-1,0],outer:-1,alwaysOn:true}]);
  // contacts
  collider('lobby floor',[lx0,-.4,lz0],[lx1,F,lz1]);collider('lobby partition',[lx0,F,lz0-.1],[H.x[0],L.ceiling,lz0]);collider('lobby partition',[H.x[1],F,lz0-.1],[lx1,L.ceiling,lz0]);
  collider('revolving door side',[dr.x-.4,F,gap[0]],[dr.x+.4,dr.height,dr.z-dr.r+.12]);collider('revolving door side',[dr.x-.4,F,dr.z+dr.r-.12],[dr.x+.4,dr.height,gap[1]]);
  collider('check-in desk',[dk.x[0]-.05,F,dk.z[0]-.03],[lx1,.39,dk.z[1]+.03]);collider('lobby table',[D.x-.32,F,D.z-.32],[D.x+.32,.3,D.z+.32]);
  for(const [x,z] of posts)collider('stanchion',[x-.03,F,z-.03],[x+.03,.38,z+.03]);
  for(const [x,z] of chairs)collider('armchair',[x-.2,F,z-.22],[x+.2,.46,z+.22]);
  collider('restaurant floor',[rx0,-.4,rz0],[rx1,F,rz1]);collider('restaurant end wall',[rx0,F,rz1],[rx1,RC,rz1+.1]);
  for(const z of colZ)collider('white column',[colX-.2,F,z-.2],[colX+.2,RC,z+.2]);
  for(const [a,b] of cabZ)collider('wine cabinet',[rx0,F,a],[rx0+.42,1.25,b]);
  collider('bar',[bar.x[0]-.04,F,bar.z[0]-.04],[bar.x[1]+.06,.39,bar.z[1]+.04]);
  for(const [x,z] of tables)collider('table',[x-.22,F,z-.5],[x+.22,.42,z+.5]);
  collider('communal table',[-26.9,F,12.55],[-24.5,.29,12.95]);
  for(const [x,z] of [[-22.7,7.0],[-22.7,7.8],[-22.7,11.2],[-22.7,12.0]])collider('lounge chair',[x-.22,F,z-.22],[x+.22,.5,z+.22]);
 }
 // The revolving door turns slowly.
 function spin(dt){if(!doorWings)return;doorAngle+=Math.min(dt,.1)*.45;const dr=C.blocks.interior.door,mat=mm(transform([dr.x,0,dr.z],[1,1,1],0,doorAngle),transform([-dr.x,0,-dr.z]));doorWings.modelMatrix=mat;doorFrames.modelMatrix=mat;}
 function build(){
  const tex={glass:canvas(2048,1024,(g,w,h)=>glassWall(g,w,h,12,4,.1)),ribbon:canvas(1024,128,(g,w,h)=>glassWall(g,w,h,16,1,0)),slot:canvas(64,512,(g,w,h)=>glassWall(g,w,h,1,18,0)),panel:canvas(256,256,panels),brick:canvas(512,512,brick),bay:canvas(256,256,hotelBay),base:canvas(256,256,hotelBase),stone:canvas(256,256,stoneWindows),granite:canvas(256,128,granite),concrete:canvas(256,256,concrete),flags:FLAGS.map(f=>canvas(256,160,f)),vpanels:canvas(256,256,vpanels),louver:canvas(1024,128,louverBand),lobby:canvas(1024,128,lobby),darkGranite:canvas(256,128,darkGranite),lettered:canvas(1024,128,lettered),pavers:canvas(256,256,pavers),redBrick:canvas(256,256,redBrick),stained:canvas(256,128,stained)};
  const d=B.devos,e=B.entrance,t=B.tower,h=B.hotel,k=B.behind;
  // Amway Grand Plaza base (left of the glass entrance): vertical metal
  // panels, a louvered ribbon window with ten US flags on angled poles, and
  // a canopy over a drive-through: entrance lane, lettered planter, exit lane.
  const cp=d.canopy,[cz0,cz1]=cp.z,cols=[-8.05,-3.25,1.15,4.78];
  let m=builder();
  m.box([X0,Y0,d.z[0]],[d.back,d.height,cz0],[1.2,1.2],['+x','-z','+z','-y','+y']);
  m.face([X0,Y0,cz0],[1,0,0],[0,1,0],cp.back-X0,d.height-Y0,[0,0,1],1.2,1.2);   // canopy end wall (the rest is inside the hotel)
  {const HW=C.blocks.interior.hallway,top=HW.high+HW.ceiling,zb=d.z[0]+.1,F3=(x0,x1,y0,y1)=>m.face([x1,y0,zb],[-1,0,0],[0,1,0],x1-x0,y1-y0,[0,0,-1],1.2,1.2);   // seen through the hospitality windows, with the hallway doorway
   F3(X0,HW.x[0],Y0,d.height);F3(HW.x[1],d.back,Y0,d.height);F3(HW.x[0],HW.x[1],top,d.height);}
  const I=C.blocks.interior,pr=I.pier;   // the pier beside the glass has a passage through to the restaurant
  m.box([X0,Y0,cz1],[pr.x[0],d.height,d.z[1]],[1.2,1.2],['-y','+y']);m.box([pr.x[1],Y0,cz1],[d.back,d.height,d.z[1]],[1.2,1.2],['+x','-y','+y']);m.box([pr.x[0],pr.top,cz1],[pr.x[1],d.height,d.z[1]],[1.2,1.2],['-y','+y']);
  m.box([X0,cp.top,cz0],[d.back,d.height,cz1],[1.2,1.2],['+x','-y','-z','+z','+y']);
  m.upload('Amway base panels',{baseTexture:tex.vpanels,color:[1,1,1,1],metal:.45,rough:.35});
  m=builder();m.face([X0-.02,2.25,-12.8],[0,0,1],[0,1,0],17.4,.8,[-1,0,0],17.4,.8);m.upload('Amway ribbon window',{baseTexture:tex.louver,color:[1,1,1,1],metal:.7,rough:.12});
  m=builder();for(const y of [2.98,3.06,3.14])m.box([X0-.28,y,-12.8],[X0,y+.025,4.6]);for(let i=0;i<10;i++){const z=-12.2+i*1.45;m.box([X0-.04,1.8,z-.07],[X0,2.18,z+.07]);}
  m.upload('Amway louvers and flag brackets',{color:[.13,.14,.16,1],metal:.5,rough:.4});
  m=builder();m.box([X0-.14,cp.soffit-.02,cz0],[X0+.1,cp.top,cz1],[1e9,1e9],['+x']);m.face([X0+.1,cp.soffit-.001,cz1],[0,0,-1],[1,0,0],cz1-cz0,cp.back-X0-.1,[0,-1,0],1e9,1e9);
  m.upload('Amway canopy',{color:[.84,.81,.75,1],rough:.8});
  m=builder();for(let z=cz0+.08;z<cz1;z+=.16){m.sphere([X0-.15,cp.soffit+.08,z],.026,1,5,3);m.sphere([X0-.06,cp.soffit-.035,z+.08],.026,1,5,3);}
  for(let z=cz0+1;z<cz1;z+=2.4)for(const x of [X0+.9,X0+2.2])m.cylinder(x,z,cp.soffit-.14,cp.soffit,.06,8);
  m.upload('Amway canopy lights',{color:[1,.95,.82,1],emission:[.9,.78,.5],rough:.6});
  m=builder();for(const z of cols)for(const x of [X0+.3,cp.back-.55])m.cylinder(x,z,Y0,cp.soffit,.14,12);m.upload('Amway granite columns',{baseTexture:tex.granite,color:[1,1,1,1],rough:.75});
  const dr=I.door,gap=[dr.z-dr.r-.07,dr.z+dr.r+.07];
  m=builder();for(const [a,b] of [[cz0,gap[0]],[gap[1],cz1]])m.face([cp.back,Y0,a],[0,0,1],[0,1,0],b-a,cp.soffit-Y0,[-1,0,0],cz1-cz0,cp.soffit-Y0);m.upload('Amway lobby',{baseTexture:tex.lobby,color:[1,1,1,1],emission:[.05,.04,.03],rough:.4});
  m=builder();m.box([cp.back-.04,dr.height+.12,gap[0]],[cp.back+.04,cp.soffit,gap[1]]);m.upload('Amway door transom',{color:[.12,.1,.08,1],metal:.5,rough:.4});
  // One brick surface from the curb to the hotel wall across the whole drive-through.
  m=builder();m.face([-31.66,I.ground,cz1],[0,0,-1],[1,0,0],cz1-cz0,cp.back+31.66,[0,1,0],1.2,1.2);m.upload('Amway brick ground',{baseTexture:tex.redBrick,color:[1,1,1,1],rough:.9});

  m=builder();m.box([X0-.12,Y0,cp.planter[0]],[X0+.66,.36,cp.planter[1]],[1,.5],['-y','-x']);m.box([X0-.1,Y0,cp.small[0]],[X0+.6,.32,cp.small[1]],[1,.5],['-y']);m.upload('Amway planters',{baseTexture:tex.darkGranite,color:[1,1,1,1],rough:.35,metal:.2});
  m=builder();m.face([X0-.12,Y0,cp.planter[0]],[0,0,1],[0,1,0],cp.planter[1]-cp.planter[0],.36-Y0,[-1,0,0],cp.planter[1]-cp.planter[0],.36-Y0);m.upload('Amway planter lettering',{baseTexture:tex.lettered,color:[1,1,1,1],rough:.35,metal:.2});
  m=builder();for(const [x,z,r] of [[X0+.25,-2.62,.26],[X0+.32,-2.08,.21],[X0+.25,.5,.25],[X0+.32,-.05,.2],[X0+.25,-8.85,.24]])m.sphere([x,.36+r*.55,z],r,.85);m.upload('Amway bushes',{color:[.16,.36,.12,1],rough:.95});
  for(const [i,c] of [[.85,.32,.45],[.82,.12,.12],[.95,.5,.15]].entries()){m=builder();for(const [z0,z1] of [cp.planter,cp.small])for(let z=z0+.18+i*.05;z<z1-.15;z+=.17)m.sphere([X0-.02+rnd()*.1,.4,z+rnd()*.06],.05+rnd()*.02,.9,6,4);m.upload('Amway flowers '+i,{color:[...c,1],rough:.9});}
  m=builder();for(const [x,z] of [[X0+.45,-1.55],[X0+.4,-.85],[X0+.42,-8.7]])for(let k=0;k<9;k++){const a=k/9*Math.PI*2+rnd()*.4,r=.2+rnd()*.12,tip=[x+Math.cos(a)*r,.36+.45+rnd()*.2,z+Math.sin(a)*r],side=[Math.sin(a)*.025,0,-Math.cos(a)*.025];m.quad([[x-side[0],.36,z-side[2]],[x+side[0],.36,z+side[2]],tip,tip],[0,1,0]);}
  m.upload('Amway palms',{color:[.2,.42,.16,1],rough:.9,doubleSided:true});
  m=builder();const flagPoles=[];for(let i=0;i<10;i++){const z=-12.2+i*1.45,a=[X0-.05,1.98,z],dir=[-.7071,.7071,0],b=a.map((v,k)=>v+dir[k]);flagPoles.push({a,dir,z,i});m.tube(a,b,.018,6);}m.upload('Amway flagpoles',{color:[.08,.08,.09,1],metal:.6,rough:.4});
  m=builder();for(const {a,dir,i} of flagPoles){const H=u=>a.map((v,k)=>v+dir[k]*(.5+.5*u)),P=(s,u)=>{const h=H(u),wave=Math.sin(s*6+i)*.04*s;return [h[0]+wave,h[1]-.1*s*s,h[2]-s*.62];};
   for(let q=0;q<6;q++){const s0=q/6,s1=(q+1)/6;m.quad([P(s0,0),P(s1,0),P(s1,1),P(s0,1)],[-.8,.2,0],[[s0,1],[s1,1],[s1,0],[s0,0]]);}}
  m.upload('Amway US flags',{baseTexture:tex.flags[2],color:[1,1,1,1],rough:.9,doubleSided:true});
  m=builder();for(let z=d.z[0]+.4;z<d.z[1];z+=1.6)m.box([X0+.15,d.height,z-.025],[X0+.2,d.height+.55,z+.025]);m.box([X0+.15,d.height+.52,d.z[0]],[X0+.2,d.height+.56,d.z[1]]);m.upload('DeVos roof fence',{color:[.05,.05,.06,1],metal:.4,rough:.5});
  // Glass entrance: dark curtain wall set back behind the planter, black
  // frame, roof railing, granite base and the beige hotel behind it.
  m=builder();m.face([e.glass,.05,e.z[0]],[0,0,1],[0,1,0],e.z[1]-e.z[0],e.height-.05,[-1,0,0],1e9,1e9);m.upload('entrance glass wall',{color:[.16,.22,.28,.42],metal:.9,rough:.05,transparent:true,center:[e.glass,e.height/2,(e.z[0]+e.z[1])/2]});
  m=builder();const glassBays=12,band=.1*e.height;for(let k=0;k<=glassBays;k++){const z=e.z[0]+(e.z[1]-e.z[0])*k/glassBays;m.box([e.glass-.03,.05,z-.025],[e.glass+.03,e.height,z+.025]);}for(let r=0;r<=4;r++){const y=e.height-band-(e.height-band-.05)*r/4;m.box([e.glass-.03,y-.02,e.z[0]],[e.glass+.03,y+.02,e.z[1]]);}m.box([e.glass-.03,e.height-band,e.z[0]],[e.glass+.03,e.height,e.z[1]]);m.upload('entrance mullions',{color:[.03,.035,.04,1],metal:.5,rough:.35});
  m=builder();m.box([e.glass-.06,e.height,e.z[0]],[e.back,e.height+.12,e.z[1]],[1e9,1e9],['+x']);m.box([e.glass,e.height,e.z[0]],[e.back,e.height+.01,e.z[1]]);
  for(const z of [e.z[0],e.z[1]])m.box([X0,Y0,z-(z===e.z[0]?0:.12)],[e.glass+.01,e.height+.12,z+(z===e.z[0]?.12:0)],[1e9,1e9],['+x']);
  m.upload('entrance black frame',{color:[.04,.045,.05,1],metal:.5,rough:.35});
  m=builder();for(let z=e.z[0]+.2;z<e.z[1];z+=.72)m.box([e.glass+.1,e.height+.12,z-.02],[e.glass+.14,e.height+.5,z+.02]);m.box([e.glass+.09,e.height+.47,e.z[0]],[e.glass+.15,e.height+.51,e.z[1]]);m.upload('entrance roof railing',{color:[.86,.87,.86,1],metal:.3,rough:.45});
  m=builder();m.box([e.glass-.04,Y0,e.z[0]],[e.glass+.02,.05,e.z[1]],[1.2,.5]);m.upload('entrance granite sill',{baseTexture:tex.granite,color:[1,1,1,1]});
  m=builder();m.box([k.x[0],e.height,k.z[0]],[k.x[1],k.height,k.z[1]],[.9,.9],['+x','-y','+y']);m.box([k.x[0]-.08,k.height,k.z[0]-.08],[k.x[1],k.height+.3,k.z[1]+.08],[1e9,1e9],['-y']);m.upload('hotel behind the entrance',{baseTexture:tex.stone,color:[1,1,1,1],rough:.85});
  // Brick tower (hotel), tall and mostly solid with dark glass slots.
  m=builder();m.box([X0,.55,t.z[0]],[t.back,t.height,t.z[1]],[1.2,1.2],['+x','-y']);m.upload('brick tower',{baseTexture:tex.brick,color:[1,1,1,1],rough:.9});
  m=builder();for(const z of [t.z[0]+.35,t.z[0]+.75])m.face([X0-.02,.8,z],[0,0,1],[0,1,0],.22,t.height-1.4,[-1,0,0],.22,t.height-1.4);m.face([X0+.4,.8,t.z[0]-.02],[1,0,0],[0,1,0],.25,t.height-1.4,[0,0,-1],.25,t.height-1.4);
  // Door in front of the stone base (not in its plane, which flickered).
  m.face([X0-.05,Y0+.02,t.z[1]-1.05],[0,0,1],[0,1,0],.75,.5,[-1,0,0],.75,.5);m.upload('brick tower glass',{baseTexture:tex.slot,color:[1,1,1,1],metal:.8,rough:.1});
  m=builder();m.box([X0-.02,Y0,t.z[0]],[t.back,.55,t.z[1]],[1,.5],['+x']);m.box([X0-.06,t.height,t.z[0]-.04],[t.back,t.height+.18,t.z[1]+.04],[1,.5],['+x']);m.upload('brick tower stone',{baseTexture:tex.granite,color:[1,1,1,1]});
  // Older hotel: stone base, brick upper floors with framed windows, cornice.
  const bays=Math.round((h.z[1]-h.z[0])/1.07),bw=(h.z[1]-h.z[0])/bays;
  m=builder();m.box([X0,Y0,h.z[0]],[h.back,1.5,h.z[1]],[bw,1.6],['+x','-z','-y','+y']);m.upload('older hotel stone base',{baseTexture:tex.base,color:[1,1,1,1],rough:.85});
  m=builder();m.box([X0,1.5,h.z[0]],[h.back,h.height,h.z[1]],[bw,.92],['+x','-z','-y','+y']);m.upload('older hotel brick',{baseTexture:tex.bay,color:[1,1,1,1],rough:.85});
  m=builder();m.box([X0-.12,1.45,h.z[0]],[h.back,1.6,h.z[1]+.12],[1,.5],['+x','-z']);m.box([X0-.22,h.height,h.z[0]],[h.back,h.height+.32,h.z[1]+.22],[1,.5],['+x','-z']);
  for(let i=0;i<=bays;i+=3){const z=h.z[0]+Math.min(i,bays)*bw;m.box([X0-.3,h.height+.32,z-.08],[X0-.14,h.height+.62,z+.08]);}
  m.upload('older hotel cornice',{baseTexture:tex.granite,color:[1,1,1,1]});
  // The older hotel's back shows past the DeVos front: finish it to match.
  if(h.exposedBack){const zb=h.exposedBack,w=h.z[1]-zb;
   m=builder();m.face([h.back,Y0,h.z[1]],[0,0,-1],[0,1,0],w,1.5-Y0,[1,0,0],w,1.6);m.upload('older hotel back base',{baseTexture:tex.base,color:[1,1,1,1],rough:.85});
   m=builder();m.face([h.back,1.5,h.z[1]],[0,0,-1],[0,1,0],w,h.height-1.5,[1,0,0],w/Math.max(1,Math.round(w/1.07)),.92);m.upload('older hotel back brick',{baseTexture:tex.bay,color:[1,1,1,1],rough:.85});
   m=builder();m.box([h.back,1.45,zb],[h.back+.12,1.6,h.z[1]+.12],[1,.5]);m.box([h.back,h.height,zb],[h.back+.22,h.height+.32,h.z[1]+.22],[1,.5]);m.upload('older hotel back cornice',{baseTexture:tex.granite,color:[1,1,1,1]});}
  // The Amway glass tower on the hospitality addition: 31 floors of pale
  // reflective glass, a metal ledge below the crown, dark openings at the top.
  const gt=B.glassTower,gtop=gt.base+gt.floors*gt.floorHeight,gw=gt.x[1]-gt.x[0],gd=gt.z[1]-gt.z[0],gh=gtop-gt.base;
  {const face=(cols,openings)=>canvas(512,2048,(g,w,h)=>towerFace(g,w,h,cols,gt.floors,gt.crownFloor,openings)),wide=face(Math.round(gw/.5),5),narrow=face(Math.round(gd/.5),4),[x0,x1]=gt.x,[z0,z1]=gt.z,y0=gt.base;
   m=builder();m.face([x1,y0,z0],[-1,0,0],[0,1,0],gw,gh,[0,0,-1],gw,gh);m.face([x0,y0,z1],[1,0,0],[0,1,0],gw,gh,[0,0,1],gw,gh);m.upload('glass tower long sides',{baseTexture:wide,color:[1,1,1,1],metal:.85,rough:.08});
   m=builder();m.face([x0,y0,z0],[0,0,1],[0,1,0],gd,gh,[-1,0,0],gd,gh);m.face([x1,y0,z1],[0,0,-1],[0,1,0],gd,gh,[1,0,0],gd,gh);m.upload('glass tower short sides',{baseTexture:narrow,color:[1,1,1,1],metal:.85,rough:.08});
   const ly=y0+gt.crownFloor*gt.floorHeight;m=builder();m.box([x0-.1,ly-.06,z0-.1],[x1+.1,ly+.06,z1+.1]);m.box([x0-.04,gtop,z0-.04],[x1+.04,gtop+.22,z1+.04],[1e9,1e9],['-y']);m.upload('glass tower ledge and parapet',{color:[.55,.6,.66,1],metal:.7,rough:.3});
   m=builder();m.face([x0,gtop+.005,z0],[0,0,1],[1,0,0],gd,gw,[0,1,0],1e9,1e9);m.box([x0+gw*.3,gtop,z0+gd*.3],[x1-gw*.3,gtop+.6,z1-gd*.3],[1e9,1e9],['-y']);m.upload('glass tower roof',{color:[.24,.26,.29,1],rough:.9});}
  // Skywalk over westbridge: stained concrete with a dark glass barrel vault.
  const sw=B.skywalk,zc=(sw.z[0]+sw.z[1])/2,hw=(sw.z[1]-sw.z[0])/2,N=10,arc=(t,out=0)=>[sw.deck+(sw.vault+out)*Math.sin(t),zc+(hw+out)*Math.cos(t)];
  m=builder();m.box([sw.x[0],sw.bottom,sw.z[0]],[sw.x[1],sw.deck,sw.z[1]],[1.4,.62],['-x','+x']);m.upload('skywalk',{baseTexture:tex.stained,color:[1,1,1,1],rough:.9});
  m=builder();for(let i=0;i<N;i++){const t0=i/N*Math.PI,t1=(i+1)/N*Math.PI,[y0,z0]=arc(t0),[y1,z1]=arc(t1),tm=(t0+t1)/2;m.quad([[sw.x[1],y0,z0],[sw.x[0],y0,z0],[sw.x[0],y1,z1],[sw.x[1],y1,z1]],[0,Math.sin(tm),Math.cos(tm)]);}m.upload('skywalk glass vault',{color:[.07,.09,.11,1],metal:.75,rough:.1});
  m=builder();for(let x=sw.x[0]+.2;x<sw.x[1];x+=.45)for(let i=0;i<N;i++){const t0=i/N*Math.PI,t1=(i+1)/N*Math.PI,[y0,z0]=arc(t0,.01),[y1,z1]=arc(t1,.01),tm=(t0+t1)/2;m.quad([[x+.018,y0,z0],[x-.018,y0,z0],[x-.018,y1,z1],[x+.018,y1,z1]],[0,Math.sin(tm),Math.cos(tm)]);}m.upload('skywalk ribs',{color:[.9,.9,.88,1],metal:.3,rough:.4});
  // Plain roofs (seen from the overview camera).
  m=builder();for(const [x0,z0,x1,z1,y] of [[X0,d.z[0],d.back,d.z[1],d.height],[k.x[0],k.z[0],k.x[1],k.z[1],k.height+.3]])m.face([x0,y+.002,z0],[0,0,1],[1,0,0],z1-z0,x1-x0,[0,1,0],1e9,1e9);m.upload('roofs',{color:[.27,.28,.29,1],rough:.95});
  // Granite planter with bushes, flowers and the five flagpoles.
  const pz=[e.z[0]+.15,e.z[1]-.15];
  m=builder();m.box([X0,Y0,pz[0]],[e.glass-.05,.3,7.05],[1,.5],['-y']);m.box([X0,Y0,7.05],[e.glass-.05,.12,7.35],[1,.5],['-y']);m.box([X0,Y0,7.35],[e.glass-.05,.3,pz[1]],[1,.5],['-y']);
  const poles=[-2,-1,0,1,2].map(i=>9.9+i*1.25);for(const z of poles)m.box([X0-.06,Y0,z-.12],[X0+.18,.42,z+.12],[1,.5],['-y']);
  m.upload('entrance planter',{baseTexture:tex.granite,color:[1,1,1,1]});
  m=builder();m.box([X0+.05,.28,pz[0]+.05],[e.glass-.1,.29,pz[1]-.05]);m.upload('planter soil',{color:[.17,.12,.08,1],rough:1});
  m=builder();const bush=(x,z,r,sy=.8)=>m.sphere([x,.3+r*sy*.7,z],r,sy);
  bush(-30.0,6.05,.34,.85);bush(-29.85,6.6,.3,.8);bush(-30.05,13.55,.32,.85);bush(-29.85,13.0,.28,.8);
  for(let z=7.6;z<12.8;z+=.32)bush(-29.82,z,.2+rnd()*.04,.85);
  m.upload('planter bushes',{color:[.17,.36,.13,1],rough:.95});
  const flowers=[[.75,.08,.08],[.93,.45,.08],[.92,.8,.15],[.55,.05,.18]];
  for(let f=0;f<flowers.length;f++){m=builder();for(let z=7.5+f*.07;z<12.9;z+=.28)m.sphere([-30.18+rnd()*.12,.38,z+rnd()*.1],.06+rnd()*.02,.9,6,4);m.upload('planter flowers '+f,{color:[...flowers[f],1],rough:.9});}
  m=builder();for(const z of poles)m.cylinder(X0+.06,z,.42,3.25,.028,8);m.upload('flagpoles',{color:[.78,.79,.8,1],metal:.85,rough:.3});
  m=builder();for(const z of poles)m.sphere([X0+.06,3.29,z],.05,1,8,5);m.upload('flagpole finials',{color:[.85,.68,.25,1],metal:.9,rough:.3});
  poles.forEach((z,i)=>{m=builder();const top=3.2,len=.86,hh=.55,P=(s,y)=>{const out=s*len,droop=s*len*.62,wave=Math.sin(s*7.5+i)*.06*s;return [X0+.06-out*.55+wave,top-y-droop,z+out*.5+wave*.6];};
   const N=8;for(let a=0;a<N;a++){const s0=a/N,s1=(a+1)/N;m.quad([P(s0,hh),P(s1,hh),P(s1,0),P(s0,0)],[-.6,0,-.8],[[s0,1],[s1,1],[s1,0],[s0,0]]);}
   m.upload('flag '+(i+1),{baseTexture:tex.flags[i],color:[1,1,1,1],rough:.9,doubleSided:true});});
  // Contacts: solid blocks, the drive-under columns and the planter.
  {const HW=C.blocks.interior.hallway,hx0=HW.x[0]-.1,hx1=HW.x[1]+.1;   // the hallway runs through the base block
   collider('Amway base',[X0,Y0,d.z[0]],[hx0,d.height,cz0]);collider('Amway base',[hx1,Y0,d.z[0]],[d.back,d.height,cz0]);collider('Amway base',[hx0,HW.high+HW.ceiling+.12,d.z[0]],[hx1,d.height,cz0]);}
  collider('Amway pier front',[X0,Y0,cz1],[pr.x[0],d.height,d.z[1]]);collider('Amway pier back',[pr.x[1],Y0,cz1],[d.back,d.height,d.z[1]]);collider('Amway pier lintel',[pr.x[0],pr.top,cz1],[pr.x[1],d.height,d.z[1]]);
  collider('Amway above canopy',[X0,cp.soffit,cz0],[d.back,d.height,cz1]);
  collider('Amway lobby wall',[cp.back-.05,Y0,cz0],[cp.back+.05,cp.soffit,gap[0]]);collider('Amway lobby wall',[cp.back-.05,Y0,gap[1]],[cp.back+.05,cp.soffit,cz1]);
  for(const z of cols)for(const x of [X0+.3,cp.back-.55])collider('Amway column',[x-.14,Y0,z-.14],[x+.14,cp.soffit,z+.14]);
  collider('Amway planter',[X0-.12,Y0,cp.planter[0]],[X0+.66,.36,cp.planter[1]]);
  collider('Amway small planter',[X0-.1,Y0,cp.small[0]],[X0+.6,.32,cp.small[1]]);
  collider('Amway brick ground',[-31.66,-.4,cz0],[cp.back,I.ground,cz1]);
  collider('entrance glass',[e.glass-.04,Y0,e.z[0]],[e.glass+.04,e.height+.5,e.z[1]]);collider('entrance roof',[e.glass,e.height,e.z[0]],[e.back,e.height+.5,e.z[1]]);
  collider('entrance planter',[X0-.06,Y0,pz[0]],[e.glass,.42,pz[1]]);
  collider('brick tower',[X0,Y0,t.z[0]],[t.back,t.height,t.z[1]]);
  collider('older hotel',[X0,Y0,h.z[0]],[h.back,h.height,h.z[1]]);
  buildInterior();
  collider('glass tower',[gt.x[0]-.1,gt.base,gt.z[0]-.1],[gt.x[1]+.1,gtop+.6,gt.z[1]+.1]);
  collider('skywalk',[sw.x[0],sw.bottom,sw.z[0]],[sw.x[1],sw.deck+sw.vault,sw.z[1]]);
 }
 async function init(){
  try{build();window.Crowd?.invalidate?.();
   const update=RobotExhibit20.update;RobotExhibit20.update=function(dt){update.call(this,dt);spin(dt);};ready=true;}
  catch(e){error=e.message;console.error('WestFront172',e);}
 }
 return {init,snapshot:()=>({ready,error,...stats})};
})();
