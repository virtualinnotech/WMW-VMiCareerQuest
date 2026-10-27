/* Home page and character select (179).
 * The student fair opens on a home page (the DeVos Place night picture, the
 * Virtual MiCareerQuest logo, New Game / Resume Game / Settings) while the
 * fair keeps loading behind it.
 * - New Game: Choose Your Character. Above a 3D carousel of the eight kid
 *   characters (players177/kid01-08.glb, drawn live with the game's own Draco
 *   decoder) the student types a first name, last initial and school; "Let's
 *   go" makes their journey code (journey166) and remembers the character.
 * - Resume Game: continue this computer's journey or type a code; progress
 *   and character come back together. An older journey with no character
 *   picks one first.
 * - Settings: graphics (GraphicsMode165), colors (Grade178) and sound.
 * The fair waits for the choice before it creates the player. Skipped, like
 * the journey screens, in the studio, for employers, with ?diagnose= or
 * ?journey=0. Sound179 is the game-wide sound switch. */
window.Sound179=(()=>{
 const KEY='mcqSound179',Base=window.AudioContext||window.webkitAudioContext,contexts=new Set(),silenced=new WeakSet();
 let muted=false;try{muted=localStorage.getItem(KEY)==='off';}catch(e){}
 // Every sound in the game comes from an AudioContext or a media element.
 if(Base){
  const Switched=class extends Base{constructor(...args){super(...args);contexts.add(this);if(muted)Base.prototype.suspend.call(this).catch(()=>{});}resume(){return muted?Promise.resolve():super.resume();}};
  window.AudioContext=Switched;if(window.webkitAudioContext)window.webkitAudioContext=Switched;
 }
 const quiet=m=>{if(muted&&!m.muted){m.muted=true;silenced.add(m);}};
 document.addEventListener('play',e=>{if(e.target instanceof HTMLMediaElement)quiet(e.target);},true);
 function set(off){
  muted=!!off;try{localStorage.setItem(KEY,muted?'off':'on');}catch(e){}
  for(const c of contexts){if(c.state==='closed'){contexts.delete(c);continue;}(muted?Base.prototype.suspend.call(c):Base.prototype.resume.call(c)).catch(()=>{});}
  for(const m of document.querySelectorAll('audio,video')){if(muted)quiet(m);else if(silenced.has(m)){m.muted=false;silenced.delete(m);}}
 }
 return {get muted(){return muted;},set};
})();

window.Home179=(()=>{
 const V='179',KEY='mcqCharacter179',ROSTER=['kid01','kid02','kid03','kid04','kid05','kid06','kid07','kid08'],DEFAULT='kid01';
 const store={get(k){try{return localStorage.getItem(k);}catch(e){return null;}},set(k,v){try{if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,v);}catch(e){}}};
 // Same rules as the game's STUDIO_MODE and Journey166, decided before the game's own script has loaded.
 const studio=(()=>{if(window.top===window.self)return false;if(typeof window.SHIP_TOKEN==='string')return true;if(/^\/(student|venue\.html)$/i.test(location.pathname))return false;try{return !!window.parent.document;}catch(e){return false;}})();
 const query=new URLSearchParams(location.search);
 const skipped=studio||!!(query.get('employer_sector')&&query.get('employer_slot'))||/[?&](diagnose=|journey=0)/.test(location.search)||store.get('mcqJourneySkip166')==='1'||store.get('mcqHomeSkip179')==='1';
 const saved=()=>{const v=store.get(KEY);return ROSTER.includes(v)?v:null;};
 let resolveChoice,resolveDone;const choice=new Promise(r=>resolveChoice=r),done=new Promise(r=>resolveDone=r);
 if(skipped){resolveChoice(saved()||DEFAULT);resolveDone({skipped:true});}
 // The game's code (Draco decoder, journeys) is further down the page.
 const pageReady=new Promise(r=>{if(document.readyState!=='loading')r();else document.addEventListener('DOMContentLoaded',()=>r(),{once:true});});
 let pageLoaded=false;pageReady.then(()=>pageLoaded=true);

 const h=(tag,props={},...kids)=>{const e=document.createElement(tag);for(const [k,v] of Object.entries(props)){if(k==='class')e.className=v;else if(k==='html')e.innerHTML=v;else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else if(v!==false&&v!=null)e.setAttribute(k,v===true?'':v);}for(const k of kids.flat())if(k!=null&&k!==false)e.append(k);return e;};
 const svg=(path,extra='')=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${path}</svg>`;
 const ICON={
  arrow:svg('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>'),check:svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>','stroke="#fff" stroke-width="3.4"'),
  left:svg('<path d="m15 5-7 7 7 7"/>'),right:svg('<path d="m9 5 7 7-7 7"/>'),
  sound:svg('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
  muted:svg('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="m16 9.5 5 5"/><path d="m21 9.5-5 5"/>')
 };
 const LOGO='./loading155/title158.png';
 let root,homeEl,selectEl,veil,ring,cards=[],ui={},pickOnly=false,chosen=saved()||DEFAULT,selected=0,current=0,target=0,previews=null,raf=0,last=0,leaving=false;
 selected=Math.max(0,ROSTER.indexOf(chosen));current=target=selected;

 // ---------- home ----------
 function mount(){
  if(skipped||root)return;
  document.head.append(h('link',{rel:'stylesheet',href:'https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&display=swap'}));
  homeEl=h('section',{class:'h-home','aria-label':'Home'},
   h('img',{class:'h-home-bg',src:'./home179/home-bg.webp',alt:'',decoding:'async'}),
   h('img',{class:'h-logo',src:LOGO,alt:'Virtual MiCareerQuest'}),
   h('nav',{class:'h-menu','aria-label':'Main menu'},
    h('button',{type:'button',onclick:()=>openSelect(false)},'New Game'),
    h('button',{type:'button',onclick:openResume},'Resume Game'),
    h('button',{type:'button',onclick:openSettings},'Settings')));
  root=h('div',{id:'home179','data-loading-allow':true,role:'dialog','aria-modal':'true','aria-label':'Virtual MiCareerQuest'},homeEl);
  document.body.append(root);
  document.addEventListener('keydown',onKey,true);
 }
 function dialog(...kids){closeDialog();veil=h('div',{class:'h-veil',onclick:e=>{if(e.target===veil&&!veil.dataset.locked)closeDialog();}},h('div',{class:'h-card',role:'dialog','aria-modal':'true'},...kids));root.append(veil);(veil.querySelector('input')||veil.querySelector('.primary')||veil.querySelector('button'))?.focus();return veil;}
 function closeDialog(){if(!veil)return;veil.remove();veil=null;(selectEl&&!selectEl.hidden?selectEl.querySelector('.h-go'):homeEl.querySelector('.h-menu button'))?.focus({preventScroll:true});}
 function onKey(e){
  if(leaving)return;
  e.stopPropagation();   // the game underneath never sees keys typed here
  if(e.key==='Escape'){if(veil&&!veil.dataset.locked)closeDialog();else if(selectEl&&!selectEl.hidden&&!ui.busy)backHome();return;}
  if(selectEl&&!selectEl.hidden&&!veil&&!/INPUT|TEXTAREA/.test(document.activeElement?.tagName||'')){
   if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}else if(e.key==='ArrowRight'){e.preventDefault();step(1);}
  }
 }
 const journey=async()=>{await pageReady;return window.Journey166;};

 function openSettings(){
  const graphics=()=>{try{return window.GraphicsMode165?.snapshot().mode||localStorage.getItem('mcqGraphics165')||'auto';}catch(e){return 'auto';}};
  const colors=()=>window.Grade178?.look||store.get('mcqColor178')||'vibrant';
  const seg=(options,get,set)=>{const box=h('div',{class:'h-seg',role:'group'});const paint=()=>box.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===get())));
   for(const [v,label] of options)box.append(h('button',{type:'button','data-v':v,onclick:()=>{set(v);paint();}},label));paint();return box;};
  const row=(title,detail,control)=>h('div',{class:'h-setting'},h('div',{},h('b',{},title),h('small',{},detail)),control);
  dialog(h('p',{class:'h-eyebrow'},'Settings'),h('h2',{},'Game ',h('em',{},'settings')),
   row('Graphics','Light runs smoother on slower computers. Auto picks for you.',seg([['auto','Auto'],['full','Full'],['light','Light']],graphics,v=>{if(window.GraphicsMode165)GraphicsMode165.set(v);else store.set('mcqGraphics165',v);})),
   row('Colors','Vibrant makes the fair bright and colorful.',seg([['vibrant','Vibrant'],['natural','Natural']],colors,v=>{if(window.Grade178)Grade178.set(v);else store.set('mcqColor178',v);})),
   row('Sound','Sound effects and videos.',seg([['on','On'],['off','Off']],()=>Sound179.muted?'off':'on',v=>{Sound179.set(v==='off');paintSound();})),
   h('div',{class:'h-actions'},h('button',{type:'button',class:'h-btn primary',onclick:closeDialog},'Done')));
 }
 function help(){
  const keys=[['W A S D','Walk (or the arrow keys)'],['Shift + W','Run'],['Mouse','Look around (scroll to zoom)'],['E','Talk to guides and use things'],['V','First-person view'],['T','Ride a bike, scooter or Segway (after your missions)']];
  dialog(h('p',{class:'h-eyebrow'},'How to play'),h('h2',{},'Explore the ',h('em',{},'career fair')),
   h('p',{},'Walk the fair, visit booths and finish missions. Your code saves your progress, so you can keep going on any computer.'),
   h('div',{class:'h-keys'},...keys.flatMap(([k,t])=>[h('kbd',{},k),h('span',{},t)])),
   h('div',{class:'h-actions'},h('button',{type:'button',class:'h-btn primary',onclick:closeDialog},'Got it')));
 }

 // ---------- resume ----------
 async function openResume(){
  const J=window.Journey166,local=J?.local;
  // Until the page has finished loading, offer the code; then this computer's journey too.
  if(!J)pageReady.then(()=>{if(veil?.dataset.screen==='resume'&&window.Journey166?.local)openResume();});
  const error=h('p',{class:'h-error',role:'alert'});
  const input=h('input',{name:'code',placeholder:'K7PQ-2MXD',autocapitalize:'characters',autocomplete:'off',spellcheck:'false',maxlength:'12','aria-label':'Game code'});
  const submit=h('button',{type:'submit',class:'h-btn primary'},'Resume');
  const form=h('form',{novalidate:true,onsubmit:async e=>{
   e.preventDefault();error.textContent='';const code=input.value.toUpperCase().replace(/[^0-9A-Z]/g,'');
   if(code.length!==8){error.textContent='Your code has 8 letters and numbers, like K7PQ-2MXD.';return;}
   submit.disabled=true;submit.textContent='Checking...';
   try{const r=await (await journey()).resume(code);if(r.error){error.textContent=r.error;return;}resumed(r.firstName);}
   finally{submit.disabled=false;submit.textContent='Resume';}
  }},h('label',{class:'h-field'},'Your game code',input),error,h('div',{class:'h-actions'},submit));
  const mine=local?[h('div',{class:'h-who-is'},h('strong',{},local.firstName+' '+local.lastInitial+'.'),local.school+' · code '+J.prettyCode),
   h('div',{class:'h-actions'},h('button',{type:'button',class:'h-btn primary',onclick:async e=>{e.target.disabled=true;e.target.textContent='Loading your progress...';await (await journey()).continueLocal();resumed(local.firstName);}},'Continue as '+local.firstName)),
   h('div',{class:'h-divider'},'or use a different code')]:[];
  dialog(h('p',{class:'h-eyebrow'},'Resume game'),h('h2',{},'Welcome ',h('em',{},'back!')),
   mine.length?null:h('p',{},'Type the code you got when you started.'),...mine,form,
   h('p',{class:'h-small'},'Forgot your code? Ask your teacher or a fair organizer.'),
   h('button',{type:'button',class:'h-link',onclick:closeDialog},'Back'));
  veil.dataset.screen='resume';if(local)veil.querySelector('.h-btn.primary').focus();
 }
 // Progress is back; so is the character, unless the journey is older than the carousel.
 function resumed(firstName){
  const c=saved();if(c){chosen=c;enter(true,'Welcome back, '+firstName+'! Your progress is back.');return;}
  closeDialog();openSelect(true,firstName);
 }

 // ---------- choose your character ----------
 function buildSelect(){
  const top=h('div',{class:'h-top'});top.innerHTML=`<svg viewBox="0 0 1672 170" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="h179n" x1="0" x2="1"><stop offset="0" stop-color="#0b1d45"/><stop offset=".6" stop-color="#102a5e"/><stop offset="1" stop-color="#16397a"/></linearGradient><linearGradient id="h179s" x1="0" x2="1"><stop offset="0" stop-color="#2f8ff0" stop-opacity="0"/><stop offset=".55" stop-color="#2f8ff0" stop-opacity=".9"/><stop offset="1" stop-color="#7cc4ff"/></linearGradient></defs><path d="M0 0H1672V104C1500 118 1330 98 1150 74C930 46 700 52 520 98C380 134 200 168 0 166Z" fill="url(#h179n)"/><path d="M560 112C720 70 930 64 1150 90C1340 112 1520 128 1672 112V124C1520 140 1330 126 1140 104C930 80 740 86 560 112Z" fill="url(#h179s)"/></svg>`;
  top.append(h('img',{class:'h-logo',src:LOGO,alt:'Virtual MiCareerQuest'}),
   h('div',{class:'h-tools'},h('div',{class:'h-tool-row'},ui.sound=h('button',{type:'button',class:'h-round',onclick:()=>{Sound179.set(!Sound179.muted);paintSound();}}),h('button',{type:'button',class:'h-round','aria-label':'How to play',onclick:help,html:'<b style="font-size:150%;line-height:1">?</b>'})),
    h('span',{class:'h-started'},'LET\'S GET STARTED')));
  const field=(cls,label,props)=>h('label',{class:cls},label,h('input',props));
  ui.form=h('form',{class:'h-who',novalidate:true,onsubmit:e=>{e.preventDefault();go();}},
   field('w-first','First name',{name:'firstName',autocomplete:'given-name',maxlength:'30'}),
   field('w-initial','Last initial',{name:'lastInitial',maxlength:'1',autocapitalize:'characters'}),
   field('w-school','School',{name:'school',autocomplete:'organization',maxlength:'80'}),
   h('button',{type:'submit',hidden:true}));
  ui.note=h('p',{class:'h-who-note'});
  ring=h('div',{class:'h-ring',role:'radiogroup','aria-label':'Characters',tabindex:'0'});
  cards=ROSTER.map((id,i)=>{const n=String(i+1).padStart(2,'0');const card=h('button',{type:'button',class:'h-card3d',role:'radio','aria-label':'Character '+n,'data-id':id,onclick:()=>{if(!dragged)choose(i);}},
   h('canvas',{'aria-hidden':'true'}),h('span',{class:'h-wait'}),h('span',{class:'h-num'},n),h('span',{class:'h-check',html:ICON.check}),h('span',{class:'h-tag'},'SELECTED'));ring.append(card);return card;});
  ring.append(h('button',{type:'button',class:'h-arrow prev','aria-label':'Previous character',html:ICON.left,onclick:()=>step(-1)}),h('button',{type:'button',class:'h-arrow next','aria-label':'Next character',html:ICON.right,onclick:()=>step(1)}));
  dragInput();
  ui.go=h('button',{type:'button',class:'h-go',onclick:go,html:'LET’S GO '+ICON.arrow});
  ui.error=h('p',{class:'h-error',role:'alert'});
  ui.hint=h('p',{class:'h-hint'},'Choose any character to begin.');
  const bottom=h('div',{class:'h-bottom'});bottom.innerHTML=`<svg viewBox="0 0 1672 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 34C260 64 560 80 900 74C1080 70 1200 60 1290 50L1290 90H0Z" fill="#0b1d45"/><path d="M0 40C260 70 560 86 900 80" stroke="#fff" stroke-width="5" fill="none" opacity=".9"/><path d="M1080 90C1300 70 1500 40 1672 0V90Z" fill="#dc1934"/><path d="M1060 92C1290 70 1500 40 1672 6" stroke="#fff" stroke-width="5" fill="none"/></svg>`;
  selectEl=h('section',{class:'h-select','aria-label':'Choose your character',hidden:true},top,
   h('div',{class:'h-heading'},h('h1',{class:'h-title'},'CHOOSE YOUR ',h('em',{},'CHARACTER')),h('p',{class:'h-sub'},'Pick your look. Explore every possibility.')),
   ui.form,ui.note,ring,h('div',{class:'h-go-row'},ui.go,ui.hint,ui.error),bottom);
  root.append(selectEl);paintSound();
  addEventListener('resize',()=>{if(selectEl&&!selectEl.hidden){layout();previews?.resize(cardSize());}});
 }
 function paintSound(){if(!ui.sound)return;ui.sound.innerHTML=Sound179.muted?ICON.muted:ICON.sound;ui.sound.setAttribute('aria-label',Sound179.muted?'Turn sound on':'Turn sound off');}
 function openSelect(pick,firstName){
  if(!selectEl)buildSelect();
  pickOnly=!!pick;selectEl.classList.toggle('pick-only',pickOnly);ui.error.textContent='';
  const local=window.Journey166?.local;
  ui.note.textContent=!pickOnly&&local?'Starting a new game? '+local.firstName+'’s progress stays saved under code '+Journey166.prettyCode+'.':'';ui.note.hidden=!ui.note.textContent;
  ui.hint.textContent=pickOnly?(firstName?'Welcome back, '+firstName+'! Pick your character to keep going.':'Pick your character to keep going.'):'Choose any character to begin.';
  homeEl.hidden=true;selectEl.hidden=false;layout();
  startPreviews();
  (pickOnly?ui.go:ui.form.elements.firstName).focus({preventScroll:true});
 }
 function backHome(){if(pickOnly)return;selectEl.hidden=true;homeEl.hidden=false;stopLoop();homeEl.querySelector('.h-menu button').focus({preventScroll:true});}

 // Cards sit around a ring seen in perspective: cards further back are smaller,
 // higher and drawn in toward the middle, so all eight show. The chosen one
 // turns to the front.
 const N=ROSTER.length,STEP=Math.PI*2/N;
 const wrap=i=>((i%N)+N)%N;
 function choose(i){selected=wrap(i);let d=i-current;d-=Math.round(d/N)*N;target=current+d;chosen=ROSTER[selected];previews?.cheer(selected);paintCards();kick();}
 function step(d){choose(Math.round(target)+d);}
 function paintCards(){cards.forEach((c,i)=>{const on=i===selected;c.classList.toggle('is-selected',on);c.setAttribute('aria-checked',String(on));c.tabIndex=on?0:-1;});}
 function cardSize(){const r=ring.getBoundingClientRect(),hgt=Math.max(150,Math.min(r.height*.84,r.width*.62));return {w:Math.round(hgt*.44),h:Math.round(hgt)};}
 function layout(){
  if(!ring)return;const r=ring.getBoundingClientRect(),size=cardSize(),radius=Math.min(r.width*.36,size.w*3.3);
  cards.forEach((c,i)=>{
   const a=(i-current)*STEP,z=Math.cos(a),depth=(z+1)/2,s=.5+.5*depth,x=Math.sin(a)*radius*(.62+.38*depth),y=-(1-depth)*size.h*.17;
   c.style.width=size.w+'px';c.style.height=size.h+'px';c.style.zIndex=String(Math.round(depth*100)+(i===selected?1:0));
   c.style.transform=`translate(-50%,-56%) translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${s.toFixed(3)})`;
   c.style.filter=depth>.98?'none':`brightness(${(.8+.2*depth).toFixed(3)}) saturate(${(.75+.25*depth).toFixed(3)})`;
   c.dataset.depth=depth.toFixed(3);c.dataset.yaw=(-Math.sin(a)*.55).toFixed(3);
  });
  paintCards();
 }
 let dragged=false;
 function dragInput(){
  let startX=0,startCurrent=0,down=false;
  ring.addEventListener('pointerdown',e=>{if(e.target.closest('.h-arrow'))return;down=true;dragged=false;startX=e.clientX;startCurrent=current;});
  addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-startX;if(Math.abs(dx)>8)dragged=true;if(!dragged)return;current=target=startCurrent-dx/(cardSize().w*1.6);layout();kick();});
  addEventListener('pointerup',()=>{if(!down)return;down=false;if(dragged){choose(Math.round(current));setTimeout(()=>dragged=false,0);}});
  ring.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)>Math.abs(e.deltaY)&&Math.abs(e.deltaX)>12){e.preventDefault();step(Math.sign(e.deltaX));}},{passive:false});
 }
 function kick(){if(!raf&&selectEl&&!selectEl.hidden){last=performance.now();raf=requestAnimationFrame(frame);}}
 function stopLoop(){cancelAnimationFrame(raf);raf=0;}
 function frame(t){
  raf=0;if(!selectEl||selectEl.hidden||leaving)return;
  const dt=Math.min(.05,(t-last)/1000);last=t;
  if(Math.abs(target-current)>.0005){current+=(target-current)*Math.min(1,dt*7.5);layout();}else if(current!==target){current=target;layout();}
  previews?.draw(t/1000,cards);
  raf=requestAnimationFrame(frame);
 }
 async function startPreviews(){
  kick();if(previews)return;
  try{previews=await Previews(cardSize());}catch(e){console.warn('Character previews:',e.message);previews=null;}
  if(!previews)cards.forEach(c=>c.classList.add('is-ready'));
  // The chosen character first, then outward from it.
  else{const order=[0,1,-1,2,-2,3,-3,4].map(d=>wrap(selected+d));let next=0;const worker=async()=>{while(next<order.length){const i=order[next++];try{await previews.load(i,ROSTER[i]);}catch(e){console.warn('Character preview',ROSTER[i],e.message);}cards[i].classList.add('is-ready');}};worker();worker();}
 }

 // ---------- let's go ----------
 async function go(){
  if(ui.busy)return;ui.error.textContent='';
  const f=ui.form.elements,v=n=>f[n].value.trim();
  if(!pickOnly){
   const student={firstName:v('firstName'),lastInitial:v('lastInitial').toUpperCase(),school:v('school')};
   const missing=!student.firstName?'firstName':!student.lastInitial?'lastInitial':student.school.length<2?'school':null;
   if(missing){ui.error.textContent='Type your first name, last initial and school above, then press Let’s go.';f[missing].focus();return;}
   busy(true,'Making your code...');
   try{
    const J=await journey();const r=await J.startNew(student,chosen);
    if(r.offline){ui.error.replaceChildren('The fair server can’t be reached. Check the internet and try again, or ',h('button',{type:'button',class:'h-link',onclick:()=>{J.withoutSaving(chosen);enter(false);}},'play without saving'),' (progress stays on this computer only).');return;}
    if(r.error){ui.error.textContent=r.error;return;}
    showCode(r.code);
   }finally{busy(false);}
  }else{store.set(KEY,chosen);(await journey())?.saveSoon?.();enter(true);}
 }
 function busy(on,label){ui.busy=on;ui.go.disabled=on;ui.go.innerHTML=on?label:'LET’S GO '+ICON.arrow;}
 function showCode(code){
  const copy=h('button',{type:'button',class:'h-btn',onclick:async()=>{try{await navigator.clipboard.writeText(code);copy.textContent='Copied!';}catch(e){const r=document.createRange();r.selectNodeContents(veil.querySelector('.h-code'));getSelection().removeAllRanges();getSelection().addRange(r);copy.textContent='Selected: press Ctrl+C';}}},'Copy code');
  const d=dialog(h('p',{class:'h-eyebrow'},'Your game code'),h('h2',{},'Save this ',h('em',{},'code')),h('div',{class:'h-code','aria-label':'Game code '+code.split('').join(' ')},code),
   h('p',{},'Write it down or take a photo. Use it with Resume Game to keep going on any computer.'),
   h('div',{class:'h-actions'},h('button',{type:'button',class:'h-btn primary',onclick:()=>enter(false)},'I’ve saved my code'),copy));
  d.dataset.locked='1';
 }

 // ---------- into the fair ----------
 function enter(returning,welcome){
  if(leaving)return;leaving=true;store.set(KEY,chosen);
  window.Journey166?.adopt?.(returning);
  resolveChoice(chosen);resolveDone({returning,welcome});
  document.removeEventListener('keydown',onKey,true);stopLoop();
  root.classList.add('is-leaving');setTimeout(()=>{previews?.dispose();previews=null;root.remove();},520);
 }

 // ---------- live 3D previews ----------
 // One hidden WebGL canvas draws each character in turn; each card copies its picture.
 async function Previews(size){
  const glc=document.createElement('canvas'),gl=glc.getContext('webgl2',{alpha:true,premultipliedAlpha:true,antialias:true});
  if(!gl)return null;
  const ratio=Math.min(1.5,devicePixelRatio||1);let W=1,H=1;
  const compile=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
  const prog=gl.createProgram();
  gl.attachShader(prog,compile(gl.VERTEX_SHADER,`#version 300 es
layout(location=0) in vec3 aPos;layout(location=1) in vec3 aNor;layout(location=2) in vec2 aUV;layout(location=3) in vec4 aJ;layout(location=4) in vec4 aW;
uniform mat4 uVP,uModel;uniform highp sampler2D uJoints;out vec3 vN;out vec2 vUV;out vec3 vP;
mat4 J(float i){int k=int(i+.5);return mat4(texelFetch(uJoints,ivec2(0,k),0),texelFetch(uJoints,ivec2(1,k),0),texelFetch(uJoints,ivec2(2,k),0),texelFetch(uJoints,ivec2(3,k),0));}
void main(){mat4 s=aW.x*J(aJ.x)+aW.y*J(aJ.y)+aW.z*J(aJ.z)+aW.w*J(aJ.w);vec4 w=uModel*s*vec4(aPos,1.);vP=w.xyz;vN=mat3(uModel)*mat3(s)*aNor;vUV=aUV;gl_Position=uVP*w;}`));
  // Bright studio light: key, fill and a soft rim, with a little extra color so clothes and skin pop.
  gl.attachShader(prog,compile(gl.FRAGMENT_SHADER,`#version 300 es
precision highp float;in vec3 vN;in vec2 vUV;in vec3 vP;uniform sampler2D uTex;uniform vec3 uEye;out vec4 o;
void main(){vec3 base=texture(uTex,vUV).rgb;vec3 n=normalize(vN);if(!gl_FrontFacing)n=-n;vec3 v=normalize(uEye-vP);
 float key=max(dot(n,normalize(vec3(-.45,.65,.8))),0.),fill=max(dot(n,normalize(vec3(.7,.2,.55))),0.),sky=.5+.5*n.y;
 vec3 c=base*(vec3(.50,.53,.60)*mix(.78,1.,sky)+vec3(1.,.97,.92)*key*.82+vec3(.78,.86,1.)*fill*.28);
 c+=pow(1.-max(dot(n,v),0.),3.)*vec3(.30,.36,.45);
 vec3 s=pow(max(c,vec3(0.)),vec3(1./2.2));float l=dot(s,vec3(.2126,.7152,.0722));o=vec4(clamp(mix(vec3(l),s,1.16)*1.03,0.,1.),1.);}`));
  gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog));
  const U={};for(const n of ['uVP','uModel','uJoints','uTex','uEye'])U[n]=gl.getUniformLocation(prog,n);
  const models=[],resources=[];
  function resize(s){W=Math.max(1,Math.round(s.w*ratio));H=Math.max(1,Math.round(s.h*.88*ratio));if(glc.width<W)glc.width=W;if(glc.height<H)glc.height=H;
   for(const c of cards){const cv=c.querySelector('canvas');if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}}}
  resize(size);
  async function load(i,id){
   const r=await fetch('./players177/'+id+'.glb?v='+V);if(!r.ok)throw Error('download failed ('+r.status+')');const ab=await r.arrayBuffer();
   const dv=new DataView(ab),jl=dv.getUint32(12,true),j=JSON.parse(new TextDecoder().decode(new Uint8Array(ab,20,jl))),bo=20+jl,bin=new DataView(ab,bo+8,dv.getUint32(bo,true));
   await pageReady;const D=await loadCharacterDecoder();
   const node=j.nodes.find(n=>n.mesh!==undefined&&n.skin!==undefined),pr=j.meshes[node.mesh].primitives[0],{attrs,indices}=decodeCharacterPrimitive(j,bin,pr,D);
   const vao=gl.createVertexArray();gl.bindVertexArray(vao);resources.push(['vao',vao]);
   const attr=(loc,data,size)=>{const b=gl.createBuffer();resources.push(['buffer',b]);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data instanceof Float32Array?data:Float32Array.from(data),gl.STATIC_DRAW);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0);};
   attr(0,attrs.POSITION,3);attr(1,attrs.NORMAL,3);attr(2,attrs.TEXCOORD_0,2);attr(3,attrs.JOINTS_0,4);attr(4,attrs.WEIGHTS_0,4);
   const ib=gl.createBuffer();resources.push(['buffer',ib]);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices instanceof Uint32Array?indices:Uint32Array.from(indices),gl.STATIC_DRAW);gl.bindVertexArray(null);
   const mat=j.materials?.[pr.material??0],image=j.images[j.textures[mat.pbrMetallicRoughness.baseColorTexture.index].source],ibv=j.bufferViews[image.bufferView];
   const bmp=await createImageBitmap(new Blob([new Uint8Array(ab,bo+8+(ibv.byteOffset||0),ibv.byteLength)],{type:image.mimeType||'image/jpeg'}),{resizeWidth:1024,resizeHeight:1024,resizeQuality:'high'});
   const tex=gl.createTexture();resources.push(['texture',tex]);gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.SRGB8_ALPHA8,gl.RGBA,gl.UNSIGNED_BYTE,bmp);bmp.close();
   gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   const skin=j.skins[node.skin],parents=new Map(),order=[];j.nodes.forEach((n,p)=>(n.children||[]).forEach(c=>parents.set(c,p)));
   const visit=k=>{order.push(k);(j.nodes[k].children||[]).forEach(visit);};j.scenes[j.scene||0].nodes.forEach(visit);
   const clips={};for(const a of j.animations||[])clips[a.name]=characterClip(j,bin,a);
   const jt=gl.createTexture();resources.push(['texture',jt]);gl.bindTexture(gl.TEXTURE_2D,jt);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,4,skin.joints.length,0,gl.RGBA,gl.FLOAT,null);
   for(const p of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,p,gl.NEAREST);
   const pa=j.accessors[pr.attributes.POSITION],lo=pa.min,hi=pa.max,bindWorld=[];for(const k of order)bindWorld[k]=mm(bindWorld[parents.get(k)]||IDENTITY,trs(j.nodes[k]));
   const hip=skin.joints[0];
   models[i]={j,vao,count:indices.length,tex,jt,joints:skin.joints,ibm:accessor(j,bin,skin.inverseBindMatrices),data:new Float32Array(skin.joints.length*16),parents,order,clips,
    lo,hi,bindHip:[bindWorld[hip][12],bindWorld[hip][14]],clip:'idle',start:performance.now()/1000-Math.random()*3,prev:null,blendStart:0,lastDrawn:-1};
   kick();
  }
  function cheer(i){const m=models[i];if(m?.clips.cheer)setClip(m,'cheer');}
  function setClip(m,name){m.prev=m.pose?m.pose.map(p=>({translation:p.translation.slice(),rotation:p.rotation.slice(),scale:p.scale.slice()})):null;m.clip=name;m.start=performance.now()/1000;m.blendStart=m.start;}
  function animate(m,t){
   let clip=m.clips[m.clip]||m.clips.idle,time=t-m.start;
   if(m.clip==='cheer'&&time>=clip.duration){setClip(m,'idle');clip=m.clips.idle;time=0;}
   time=m.clip==='cheer'?Math.min(time,clip.duration):time%Math.max(.001,clip.duration);
   const pose=m.j.nodes.map(n=>({translation:[...(n.translation||[0,0,0])],rotation:[...(n.rotation||[0,0,0,1])],scale:[...(n.scale||[1,1,1])]}));
   for(const ch of clip.channels){if(!pose[ch.node]||!['translation','rotation','scale'].includes(ch.path))continue;pose[ch.node][ch.path]=sampleLandmarkChannel(ch,time);}
   const blend=m.prev?Math.min(1,(t-m.blendStart)/.25):1;
   if(blend<1)pose.forEach((p,k)=>{const q=m.prev[k];if(!q)return;p.rotation=quaternionSlerp(q.rotation,p.rotation,blend);p.translation=q.translation.map((x,a)=>x+(p.translation[a]-x)*blend);});else m.prev=null;
   m.pose=pose;const world=[];for(const k of m.order)world[k]=mm(world[m.parents.get(k)]||IDENTITY,trs(pose[k]));
   const hw=world[m.joints[0]],dx=hw[12]-m.bindHip[0],dz=hw[14]-m.bindHip[1];
   for(let k=0;k<m.joints.length;k++){const mat=mm(world[m.joints[k]],m.ibm.subarray(k*16,k*16+16));mat[12]-=dx;mat[14]-=dz;m.data.set(mat,k*16);}
  }
  const perspective=(fovy,aspect,near,far)=>{const f=1/Math.tan(fovy/2),nf=1/(near-far);return [f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0];};
  const look=(e,c)=>{const z=[e[0]-c[0],e[1]-c[1],e[2]-c[2]],zl=Math.hypot(...z);z.forEach((v,k)=>z[k]=v/zl);const x=[z[2],0,-z[0]],xl=Math.hypot(...x);x.forEach((v,k)=>x[k]=v/xl);const y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];
   return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-(x[0]*e[0]+x[1]*e[1]+x[2]*e[2]),-(y[0]*e[0]+y[1]*e[1]+y[2]*e[2]),-(z[0]*e[0]+z[1]*e[1]+z[2]*e[2]),1];};
  const eye=[0,.62,3.45],vp=()=>mm(perspective(20*Math.PI/180,W/H,.1,20),look(eye,[0,.56,0]));
  let frameNo=0;
  function draw(t,list){
   if(!pageLoaded||!models.some(Boolean))return;   // the game's matrix helpers load with the page
   frameNo++;gl.useProgram(prog);gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.enable(gl.SCISSOR_TEST);gl.viewport(0,0,W,H);gl.scissor(0,0,W,H);
   gl.uniformMatrix4fv(U.uVP,false,new Float32Array(vp()));gl.uniform3fv(U.uEye,eye);gl.uniform1i(U.uTex,0);gl.uniform1i(U.uJoints,1);
   list.forEach((card,i)=>{
    const m=models[i];if(!m)return;const depth=+card.dataset.depth;
    // Cards near the back are small and partly hidden: they update less often.
    if(depth<.6&&frameNo%3!==i%3&&m.lastDrawn>=0)return;m.lastDrawn=frameNo;
    animate(m,t);
    const s=1/(m.hi[1]-m.lo[1]),yaw=+card.dataset.yaw,c=Math.cos(yaw),sn=Math.sin(yaw),cx=(m.lo[0]+m.hi[0])/2,cz=(m.lo[2]+m.hi[2])/2;
    const model=[c*s,0,-sn*s,0,0,s,0,0,sn*s,0,c*s,0,-(c*cx+sn*cz)*s,-m.lo[1]*s,-(-sn*cx+c*cz)*s,1];
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(U.uModel,false,new Float32Array(model));
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,m.jt);gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,4,m.joints.length,gl.RGBA,gl.FLOAT,m.data);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,m.tex);
    gl.bindVertexArray(m.vao);gl.drawElements(gl.TRIANGLES,m.count,gl.UNSIGNED_INT,0);gl.bindVertexArray(null);
    const cv=card.querySelector('canvas'),ctx=cv.getContext('2d');ctx.clearRect(0,0,W,H);ctx.drawImage(glc,0,glc.height-H,W,H,0,0,W,H);
   });
  }
  function dispose(){for(const [kind,r] of resources)kind==='vao'?gl.deleteVertexArray(r):kind==='buffer'?gl.deleteBuffer(r):gl.deleteTexture(r);gl.deleteProgram(prog);gl.getExtension('WEBGL_lose_context')?.loseContext();}
  return {load,draw,cheer,resize,dispose,get loaded(){return models.filter(Boolean).length;}};
 }

 return {
  mount,ROSTER,DEFAULT,
  // The character the player will be: resolves once the student has chosen
  // (straight away when the home page is skipped).
  character:()=>choice,
  // Resolves with {returning, welcome} once the student has left the home page.
  done,
  get skipped(){return skipped;},get active(){return !!root&&!leaving;},
  snapshot:()=>({skipped,active:!!root&&!leaving,screen:!root?null:veil?'dialog':selectEl&&!selectEl.hidden?'select':'home',chosen,selected,pickOnly,previews:previews?.loaded??0})
 };
})();
