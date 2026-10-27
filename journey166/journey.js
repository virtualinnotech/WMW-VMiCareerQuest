/* Student journeys (166). A student's progress is saved on the fair's server
 * under a short code (like K7PQ-2MXD) so they can keep going on any computer.
 * Before the screen tour, "Start my journey" asks for a first name, last
 * initial and school and gives a code; "Continue my journey" takes a code and
 * brings everything back. On a computer that already has a journey it offers
 * to continue it, or "Not you? Start a new journey". Progress saves in the
 * background whenever it changes; the code stays in a chip under the logo,
 * in the Missions panel and on the certificate. Heading for the tab's close
 * button (the pointer leaving through the top of the page) shows the code with
 * a reminder to take it, and closing the tab asks first, unless the student
 * chose "Finish for today".
 * Not shown in the studio, to employers, for speed-test links (?diagnose=),
 * or with ?journey=0. */
window.Journey166=(()=>{
 const LOCAL='mcqJourney166',PENDING='mcqJourneyPending166';
 // Everything that is the student's own progress, as kept in this browser.
 const KEYS={rewards:'mcqScooterReward_v1',pcCollection:'micq.pc-builder66.collection.v1',pcShowcase:'micq.pc-builder66.showcase.v1',hotelBest:'mcqHotelBest146',tour:'mcqOnboardingDone_v1',character:'mcqCharacter179'};
 const store={get(k){try{return localStorage.getItem(k);}catch(e){return null;}},set(k,v){try{if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,v);}catch(e){}}};
 const pretty=c=>c?c.slice(0,4)+'-'+c.slice(4):'';
 let journey=null;try{journey=JSON.parse(store.get(LOCAL)||'null');if(!journey?.code)journey=null;}catch(e){journey=null;}
 // Nothing is saved until the student has confirmed who they are (ready), so a
 // computer never overwrites a journey continued somewhere else since.
 let lastSent=null,timer=0,sending=false,ready=false,status=journey?'saved':'none',finished=false,active=false,overlay,card,chip,onDone=null,pausedBefore=false;

 const skip=()=>!STANDALONE_MODE||employerModeParams()||/[?&](diagnose=|journey=0)/.test(location.search)||store.get('mcqJourneySkip166')==='1';
 function collect(){const data={missions:StudentProgress99.snapshot()};for(const [k,key] of Object.entries(KEYS)){const v=store.get(key);if(v!=null)data[k]=v;}return data;}
 const percent=()=>Math.round(MISSIONS.reduce((s,m)=>s+StudentProgress99.progress(m),0)/MISSIONS.length);
 // Put a saved journey's progress into this browser (an empty one clears it).
 function apply(data){
  for(const [k,key] of Object.entries(KEYS))store.set(key,typeof data?.[k]==='string'?data[k]:null);
  window.StudentRewards100?.restore?.();
  StudentProgress99.replace(data?.missions||null);
 }
 function remember(j){journey=j;store.set(LOCAL,j?JSON.stringify(j):null);renderChip();}

 // ---- saving ----
 function payload(){return JSON.stringify({code:journey.code,data:collect(),percent:percent()});}
 // The leaving reminder only mentions saving when something is wrong.
 function setStatus(s){status=s;renderChip();const el=card?.querySelector('[data-status]');if(el)el.textContent=el.dataset.status==='problems'&&s==='saved'?'':statusText();}
 const statusText=()=>({saved:'Your progress is saved.',saving:'Saving...',offline:'Not saved yet: the fair server can\'t be reached. The game keeps trying.',missing:'This code is no longer on the server. Start a new journey to keep saving.',none:''})[status]||'';
 // PENDING marks changes this computer hasn't sent yet, so a returning student
 // knows whether this computer or the server has the newer progress.
 function queue(delay=2500){if(!journey||!ready)return;store.set(PENDING,'1');clearTimeout(timer);timer=setTimeout(flush,delay);}
 async function flush(){
  if(!journey||!ready||sending)return;const body=payload();if(body===lastSent)return;
  sending=true;setStatus('saving');
  try{const r=await fetch('/api/journey/save',{method:'POST',headers:{'content-type':'application/json'},body,keepalive:body.length<60000});
   if(r.status===404){setStatus('missing');return;}if(!r.ok)throw Error('status '+r.status);lastSent=body;if(payload()===body)store.set(PENDING,null);setStatus('saved');}
  catch(e){setStatus('offline');queue(15000);}
  finally{sending=false;}
 }

 // ---- screens ----
 const h=(tag,props={},...kids)=>{const e=document.createElement(tag);for(const [k,v] of Object.entries(props)){if(k==='class')e.className=v;else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else if(v!==false&&v!=null)e.setAttribute(k,v===true?'':v);}for(const k of kids.flat())if(k!=null&&k!==false)e.append(k);return e;};
 const button=(label,onclick,cls='')=>h('button',{type:'button',class:'j-btn '+cls,onclick},label);
 const link=(label,onclick)=>h('button',{type:'button',class:'j-link',onclick},label);
 const codeBox=()=>h('div',{class:'j-code','aria-label':'Journey code '+pretty(journey.code).split('').join(' ')},pretty(journey.code));
 function copyButton(){const b=button('Copy code',async()=>{try{await navigator.clipboard.writeText(pretty(journey.code));b.textContent='Copied';}catch(e){const r=document.createRange();r.selectNodeContents(card.querySelector('.j-code'));getSelection().removeAllRanges();getSelection().addRange(r);b.textContent='Selected: press Ctrl+C';}});return b;}
 function show(...kids){
  ensureUI();card.replaceChildren(...kids);overlay.hidden=false;
  if(!active){active=true;pausedBefore=state.paused;state.paused=true;keys.clear();}
  (card.querySelector('input')||card.querySelector('.primary'))?.focus();
 }
 function hide(){if(!overlay||overlay.hidden)return;overlay.hidden=true;if(active){active=false;state.paused=pausedBefore;keys.clear();lastTime=performance.now();}canvas.focus();}
 function done(){hide();const next=onDone;onDone=null;next?.();}
 function form(fields,submitLabel,onsubmit,back){
  const error=h('p',{class:'j-error',role:'alert'});
  const submit=h('button',{type:'submit',class:'j-btn primary'},submitLabel);
  const f=h('form',{novalidate:true,onsubmit:async e=>{e.preventDefault();error.textContent='';submit.disabled=true;try{await onsubmit(f,error);}finally{submit.disabled=false;}}},fields,error,h('div',{class:'j-actions'},submit,back&&link('Back',back)));
  return f;
 }
 const field=(label,props)=>h('label',{class:'j-field'},label,h('input',props));

 function choose(){
  show(h('p',{class:'j-eyebrow'},'MiCareerQuest Career Fair'),h('h2',{},'Welcome!'),
   h('p',{},'Save your progress as you explore, so you can keep going on any computer.'),
   h('div',{class:'j-actions'},button('Start my journey',startForm,'primary'),button('Continue my journey',continueForm)));
 }
 function welcomeBack(){
  show(h('p',{class:'j-eyebrow'},'Welcome back'),h('h2',{},'Hi, '+journey.firstName+' '+journey.lastInitial+'.!'),
   h('p',{},journey.school+' · journey code '+pretty(journey.code)),
   h('div',{class:'j-actions'},button('Continue my journey',continueHere,'primary'),button('Not you? Start a new journey',confirmSwitch)),
   h('p',{class:'j-small'},link('Use a different code',continueForm)));
 }
 // This computer's journey: send its unsent changes, or take the server's copy,
 // which has anything played on another computer since.
 async function continueHere(){
  const b=card.querySelector('.primary');if(b)b.disabled=true;
  if(store.get(PENDING)!=='1'){
   try{const r=await fetch('/api/journey?code='+journey.code,{cache:'no-store'});const body=await r.json();if(r.ok){apply(body.data);lastSent=payload();store.set(PENDING,null);setStatus('saved');}else if(r.status===404)setStatus('missing');}
   catch(e){setStatus('offline');}
  }
  finishSetup(true);toast('Welcome back, '+journey.firstName+'!');
 }
 function startForm(){
  show(h('p',{class:'j-eyebrow'},'Start my journey'),h('h2',{},'Tell us who you are'),
   h('p',{},'Your name and school only help your teacher find your code if you ever forget it.'),
   form([field('First name',{name:'firstName',autocomplete:'given-name',maxlength:'30',required:true}),
    field('First letter of your last name',{name:'lastInitial',maxlength:'1',autocapitalize:'characters',required:true}),
    field('School',{name:'school',autocomplete:'organization',maxlength:'80',required:true})],
   'Create my code',async(f,error)=>{
    const v=n=>f.elements[n].value.trim(),student={firstName:v('firstName'),lastInitial:v('lastInitial'),school:v('school')};
    if(!student.firstName||!student.lastInitial||student.school.length<2){error.textContent='Fill in all three, please.';return;}
    let r;try{apply(null);store.set(PENDING,null);r=await fetch('/api/journey/start',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...student,data:collect(),percent:0})});}
    catch(e){offline(error);return;}
    const body=await r.json().catch(()=>({}));if(!r.ok){if(r.status>=500)offline(error);else error.textContent=body.error||'Something went wrong. Try again.';return;}
    remember({code:body.code,firstName:body.firstName,lastInitial:body.lastInitial,school:body.school});lastSent=null;setStatus('saved');reveal();
   },journey?welcomeBack:choose));
 }
 function offline(error){error.replaceChildren('The fair server can\'t be reached. Check the internet and try again, or ',link('play without saving',()=>{remember(null);finishSetup(false);}),' (progress stays on this computer only).');}
 function reveal(){
  show(h('p',{class:'j-eyebrow'},'Your journey code'),h('h2',{},'Save this code'),codeBox(),
   h('p',{},'Write it down or take a photo. You\'ll need it to keep going on another computer.'),
   h('div',{class:'j-actions'},copyButton(),button('I\'ve saved my code',()=>finishSetup(false),'primary')));
 }
 function continueForm(){
  show(h('p',{class:'j-eyebrow'},'Continue my journey'),h('h2',{},'Type your code'),
   form([field('Journey code',{name:'code',placeholder:'K7PQ-2MXD',autocapitalize:'characters',autocomplete:'off',spellcheck:'false',maxlength:'12',required:true})],
   'Continue',async(f,error)=>{
    const code=f.elements.code.value.toUpperCase().replace(/[^0-9A-Z]/g,'');
    if(code.length!==8){error.textContent='Your code has 8 letters and numbers, like K7PQ-2MXD.';return;}
    let r;try{r=await fetch('/api/journey?code='+code,{cache:'no-store'});}catch(e){error.textContent='The fair server can\'t be reached. Check the internet and try again.';return;}
    const body=await r.json().catch(()=>({}));if(!r.ok){error.textContent=body.error||'Something went wrong. Try again.';return;}
    // Switch to the new code before its progress arrives, so nothing saves under the old one.
    clearTimeout(timer);ready=false;remember({code:body.code,firstName:body.firstName,lastInitial:body.lastInitial,school:body.school});apply(body.data);lastSent=payload();store.set(PENDING,null);setStatus('saved');
    finishSetup(true);toast('Welcome back, '+body.firstName+'! Your progress is back.');
   },journey?welcomeBack:choose),
   h('p',{class:'j-small'},'Forgot your code? Ask your teacher or a fair organizer.'));
 }
 function confirmSwitch(){
  show(h('p',{class:'j-eyebrow'},'New student'),h('h2',{},'Start a new journey?'),
   h('p',{},'This computer will forget '+journey.firstName+'\'s progress. It stays saved under code '+pretty(journey.code)+'.'),
   h('div',{class:'j-actions'},button('Yes, start a new journey',async()=>{await flush();ready=false;remember(null);apply(null);store.set(PENDING,null);lastSent=null;setStatus('none');startForm();},'primary'),button('Cancel',active&&!onDone?panel:welcomeBack)));
 }
 // Returning students skip the tour; a new journey gets it.
 function finishSetup(returning){if(returning)store.set(KEYS.tour,'1');finished=false;ready=!!journey;queue(500);done();}
 // leaving: opened as the tab closes, behind the browser's "Leave site?" box,
 // whose own wording can't be changed.
 function panel(leaving){
  if(!journey)return;
  const head=leaving===true?[h('p',{class:'j-eyebrow'},'Leaving?'),h('h2',{},'Take your code with you'),codeBox(),
   h('p',{class:'j-warn'},'Write it down or take a photo before you go. Without your code, your progress may be lost.')]
   :[h('p',{class:'j-eyebrow'},'Your journey'),h('h2',{},journey.firstName+' '+journey.lastInitial+'.'),codeBox()];
  show(...head,
   h('p',{'data-status':leaving===true?'problems':'all'},leaving===true&&status==='saved'?'':statusText()),
   h('div',{class:'j-actions'},copyButton(),button('Finish for today',finishToday,'primary'),button('Keep playing',hide)),
   h('p',{class:'j-small'},link('Not you? Switch student',confirmSwitch)));
 }
 function finishToday(){
  flush();finished=true;
  show(h('p',{class:'j-eyebrow'},'See you next time'),h('h2',{},'Your progress is saved'),codeBox(),
   h('p',{},'Use this code to keep going on any computer. You can close this tab now.'),
   h('div',{class:'j-actions'},copyButton(),button('Keep playing',()=>{finished=false;hide();},'primary')));
 }

 function ensureUI(){
  if(overlay)return;
  const css=document.createElement('style');css.textContent=`
#journey166{position:fixed;inset:0;z-index:250;display:flex;align-items:center;justify-content:center;padding:20px;background:#050f1cd9;font-family:Inter,system-ui,sans-serif}
#journey166[hidden]{display:none}
#journey166 .j-card{width:min(100%,460px);max-height:calc(100vh - 40px);overflow:auto;background:linear-gradient(160deg,#0e2439,#0a1928);border:1px solid #5cd5e640;border-radius:18px;padding:28px 28px 22px;box-shadow:0 24px 60px #000000b3;color:#eef7fd;text-align:center}
#journey166 .j-eyebrow{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#5cd5e6;margin:0}
#journey166 h2{font-size:24px;line-height:1.2;margin:6px 0 10px}
#journey166 p{font-size:14px;line-height:1.55;color:#c8dbe6;margin:0 0 12px}
#journey166 .j-warn{color:#ffe08a;font-weight:600}
#journey166 .j-small{font-size:13px;color:#9fb9c8;margin:14px 0 0}
#journey166 .j-actions{display:flex;flex-direction:column;gap:10px;margin-top:16px}
#journey166 .j-btn{font:inherit;font-size:15px;font-weight:700;border-radius:10px;padding:12px 16px;cursor:pointer;border:1px solid #5cd5e680;background:#12324a;color:#eef7fd}
#journey166 .j-btn.primary{background:#2bb6c9;border-color:#2bb6c9;color:#04222b}
#journey166 .j-btn:disabled{opacity:.6;cursor:progress}
#journey166 .j-link{background:none;border:0;color:#8fd4e1;font:inherit;font-size:13px;text-decoration:underline;cursor:pointer;padding:2px}
#journey166 .j-field{display:flex;flex-direction:column;gap:6px;text-align:left;margin-top:12px;font-size:13px;font-weight:600;color:#cfe3ee}
#journey166 .j-field input{font:inherit;font-size:16px;padding:10px 12px;border-radius:8px;border:1px solid #ffffff30;background:#0b1d2c;color:#fff}
#journey166 .j-code{font:700 32px/1.2 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.12em;background:#0b1d2c;border:2px dashed #5cd5e6;border-radius:12px;padding:14px 10px;margin:4px 0 14px;color:#fff;user-select:all}
#journey166 .j-error{color:#ffb0b0;font-size:13px;min-height:1px;margin:10px 0 0;text-align:left}
#journey166 button:focus-visible,#journey166 input:focus-visible,#journeyChip166:focus-visible{outline:3px solid #5cd5e6;outline-offset:2px}
#journeyChip166{position:fixed;left:20px;top:88px;z-index:61;display:flex;align-items:center;gap:8px;padding:7px 12px;border-radius:999px;border:1px solid #63b3ed59;background:linear-gradient(160deg,#0f172aeb,#1e293beb);color:#e2e8f0;font:600 13px Inter,system-ui,sans-serif;cursor:pointer;letter-spacing:.04em}
#journeyChip166[hidden],body.rivian147-driving #journeyChip166,body.tour-running #journeyChip166{display:none}
#journeyChip166 i{width:8px;height:8px;border-radius:50%;background:#4ade80}
#journeyChip166[data-status=saving] i{background:#facc15}
#journeyChip166[data-status=offline] i,#journeyChip166[data-status=missing] i{background:#f87171}`;
  document.head.append(css);
  card=h('div',{class:'j-card'});overlay=h('div',{id:'journey166',role:'dialog','aria-modal':'true','aria-label':'Your journey',hidden:true},card);
  chip=h('button',{id:'journeyChip166',type:'button',title:'Your journey code',onclick:()=>panel(),hidden:true});
  document.body.append(overlay,chip);
 }
 function renderChip(){if(!chip)return;chip.hidden=!journey;if(!journey)return;chip.replaceChildren(h('i',{'aria-hidden':'true'}),'Code '+pretty(journey.code));chip.dataset.status=status;chip.setAttribute('aria-label','Your journey code '+pretty(journey.code)+'. '+statusText());}

 // ---- start-up and leaving ----
 StudentProgress99.subscribe(()=>queue());
 setInterval(()=>{if(journey&&ready&&!sending&&payload()!==lastSent)queue(0);},30000);
 addEventListener('pagehide',()=>{if(!journey||!ready)return;const body=payload();if(body!==lastSent)navigator.sendBeacon('/api/journey/save',new Blob([body],{type:'application/json'}));});
 addEventListener('beforeunload',e=>{if(!journey||!ready||finished||skip())return;if(!active)panel(true);e.preventDefault();e.returnValue='';});
 // The browser's own "Leave site?" box can't show our words and hides the
 // page, so remind the student as the pointer heads for the tab's close button
 // instead: leaving through the top edge, no button held (not a camera drag),
 // nothing else open, at most every two minutes.
 let remindedAt=-Infinity;
 document.addEventListener('mouseout',e=>{
  if(e.relatedTarget||e.clientY>8||e.buttons||!journey||!ready||finished||active||skip())return;
  if(document.body.classList.contains('tour-running')||window.MissionUI99?.active||window.StudentRewards100?.active||window.BoothMedia162?.active)return;
  if(performance.now()-remindedAt<120000)return;remindedAt=performance.now();panel(true);
 });

 // ---- for the home page (home179), which now starts and resumes journeys ----
 // A new journey for this student and character. A journey already on this
 // computer is sent first and stays saved under its own code.
 async function startNew(student,character){
  if(journey){await flush();clearTimeout(timer);ready=false;remember(null);}
  apply(null);store.set(PENDING,null);store.set(KEYS.character,character);
  let r;try{r=await fetch('/api/journey/start',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...student,data:collect(),percent:0})});}catch(e){return {offline:true};}
  const body=await r.json().catch(()=>({}));if(!r.ok)return r.status>=500?{offline:true}:{error:body.error||'Something went wrong. Try again.'};
  remember({code:body.code,firstName:body.firstName,lastInitial:body.lastInitial,school:body.school});lastSent=null;setStatus('saved');
  return {code:pretty(body.code)};
 }
 async function resumeCode(code){
  let r;try{r=await fetch('/api/journey?code='+code,{cache:'no-store'});}catch(e){return {error:'The fair server can\'t be reached. Check the internet and try again.'};}
  const body=await r.json().catch(()=>({}));if(!r.ok)return {error:body.error||'Something went wrong. Try again.'};
  clearTimeout(timer);ready=false;remember({code:body.code,firstName:body.firstName,lastInitial:body.lastInitial,school:body.school});apply(body.data);lastSent=payload();store.set(PENDING,null);setStatus('saved');
  return {firstName:body.firstName};
 }
 // This computer's journey: send its unsent changes, or take the server's newer copy.
 async function continueLocal(){
  if(!journey||store.get(PENDING)==='1')return;
  try{const r=await fetch('/api/journey?code='+journey.code,{cache:'no-store'});const body=await r.json();if(r.ok){apply(body.data);lastSent=payload();store.set(PENDING,null);setStatus('saved');}else if(r.status===404)setStatus('missing');}
  catch(e){setStatus('offline');}
 }

 return {
  // Called once the venue has loaded, before the screen tour. With the home
  // page, the student already started or resumed a journey there.
  begin(next){
   if(skip()){next();return;}ensureUI();renderChip();
   if(window.Home179&&!Home179.skipped){const before=state.paused;state.paused=true;Home179.done.then(r=>{state.paused=before;keys.clear();lastTime=performance.now();if(r?.welcome)toast(r.welcome);next();});return;}
   onDone=next;if(journey)welcomeBack();else choose();
  },
  get local(){return journey?{...journey}:null;},
  startNew,resume:resumeCode,continueLocal,
  withoutSaving(character){clearTimeout(timer);ready=false;remember(null);store.set(KEYS.character,character);},
  // Start saving: the student has confirmed who they are on the home page.
  adopt(returning){if(returning)store.set(KEYS.tour,'1');finished=false;ready=!!journey;queue(500);},
  saveSoon:()=>queue(),
  open:()=>panel(),
  get code(){return journey?.code||null;},get prettyCode(){return journey?pretty(journey.code):null;},
  snapshot:()=>({journey,status,finished,active,skipped:skip()})
 };
})();
