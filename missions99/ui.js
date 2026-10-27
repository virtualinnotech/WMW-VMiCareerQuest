/* Industry missions, locally saved conversations, and printable student portfolio. */
window.MissionUI99=(()=>{
 'use strict';
 const C=MissionCore99,store=StudentProgress99;
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const icon=name=>{const key=name.replace(/(^|-)([a-z])/g,(_,dash,c)=>c.toUpperCase()),n=lucide.createElement(lucide.icons[key]);n.setAttribute('aria-hidden','true');return n;};
 const button=(text,fn,symbol)=>{const b=el('button',undefined);b.type='button';if(symbol)b.append(icon(symbol));if(text)b.append(document.createTextNode(text));b.onclick=fn;return b;};
 const gem=m=>{const g=el('span',undefined,'m99-gem');g.style.setProperty('--gem',m.color);g.append(icon(m.icon));return g;};
 const dialog=el('dialog');dialog.id='missions99';dialog.setAttribute('aria-labelledby','missionTitle99');document.body.append(dialog);
 let pausedBefore=false,focusBefore=null,view='home',selected=null,body,heading,saveStatus,printRoot=null;
 const drafts=new Map();
 function header(title,back){dialog.replaceChildren();const h=el('div',undefined,'m99-head');if(back){const b=button('',back,'arrow-left');b.title='Back to missions';b.setAttribute('aria-label',b.title);h.append(b);}heading=el('h2',title);heading.id='missionTitle99';const x=button('',close,'x');x.title='Close missions';x.setAttribute('aria-label',x.title);h.append(heading,x);body=el('div',undefined,'m99-content');dialog.append(h,body);}
 function show(){if(dialog.open)return;pausedBefore=state.paused;focusBefore=document.activeElement;state.paused=true;keys.clear();if(document.pointerLockElement)document.exitPointerLock();dialog.showModal();}
 function close(){if(!dialog.open)return;dialog.close();state.paused=pausedBefore;keys.clear();if(focusBefore?.isConnected)focusBefore.focus();else canvas.focus();}
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 // Modal keys must not also move the character or start another challenge.
 window.addEventListener('keydown',e=>{if(!dialog.open)return;if(e.key==='Escape'){e.preventDefault();close();}e.stopImmediatePropagation();},true);
 window.addEventListener('keyup',e=>{if(dialog.open)e.stopImmediatePropagation();},true);
 function note(text,cls){const n=el('p',text,cls);body.append(n);return n;}
 function status(){saveStatus=el('p','', 'm99-status');saveStatus.setAttribute('role','status');body.append(saveStatus);}
 function saved(){if(saveStatus)saveStatus.textContent=store.storageOK?'Saved on this browser.':'Saved for this session only. Browser storage is unavailable; keep this page open.';}
 function field(form,label,value='',max=700,min=8,type='textarea'){
  const id='answer99-'+form.querySelectorAll('input,textarea,select').length,l=el('label',label),f=el(type);l.htmlFor=id;f.id=id;f.value=value;f.required=true;f.maxLength=max;f.minLength=min;if(type==='textarea')f.rows=3;else f.type='text';form.append(l,f);return f;
 }
 function submit(form,label,fn){const b=button(label,null,'check');b.type='submit';b.className='m99-primary';const actions=el('div',undefined,'m99-actions');actions.append(b);form.append(actions);form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;fn();};}
 function blankCheck(fields){for(const f of fields){f.setCustomValidity(f.value.trim().length<(f.minLength||1)?'Please add a thoughtful response (at least '+(f.minLength||1)+' characters).':'');if(!f.reportValidity())return false;}return true;}
 function summary(m,s){if(s.testComplete)return 'Complete via test shortcut; original responses preserved';if(m.id==='career')return store.progress(m)===100?'Career plan and company logo saved':'Career interests, next steps, and your company logo';return m.challenges.filter(([id])=>s.challenges[id]).length+'/'+m.challenges.length+' challenges  |  '+Math.min(5,(s.visits[m.id]||[]).length)+'/5 employer visits  |  '+(C.enough(s.reflections[m.id])?'Reflection saved':'Reflection pending');}
 function home(){view='home';selected=null;header('Career Fair Missions');const s=store.snapshot();
  for(const m of C.missions){const row=el('div',undefined,'m99-row'),g=gem(m);g.classList.toggle('pending',store.progress(m)<100);const d=el('div');d.append(el('h3',m.title),el('p',m.industry||'Career plan'),el('p',summary(m,s),'m99-count'));const p=el('progress');p.max=100;p.value=store.progress(m);p.setAttribute('aria-label',m.title+' progress');d.append(p);const b=button(store.progress(m)===100?'Review':'Open',()=>m.id==='career'?career():industry(m),'arrow-right');b.setAttribute('aria-label',(store.progress(m)===100?'Review ':'Open ')+m.title);row.append(g,d,b);body.append(row);}
  const actions=el('div',undefined,'m99-actions'),cert=button('Certificate of completion',certificate,'award');cert.disabled=!store.complete();cert.className='m99-primary';actions.append(cert);body.append(actions);
  note(store.complete()?'All '+C.missions.length+' missions complete.':'Certificate: complete all '+C.missions.length+' missions, including '+C.industries.reduce((n,m)=>n+m.challenges.length,0)+' challenges and '+C.industries.length*5+' employer questionnaires.');
  const code=window.Journey166?.prettyCode;
  note(code?'Your progress is saved under your journey code '+code+', so you can continue on any computer. Your answers are not sent to employers.':'Your answers stay in this browser on this device. They are not sent to employers.','m99-privacy');if(!store.storageOK)note('Browser storage is unavailable. Keep this page open to retain your progress.','m99-error');
 }
 function open(){if(employerModeParams())return;if(travelBlocked()){toast('Leave the current challenge to review your missions.');return;}home();show();}
 function boothList(m){return [...shippedBooths.values()].filter(r=>r.industry===m.industry).map(r=>({id:r.id,name:r.name,industry:r.industry}));}
 function travelBlocked(){return !!(window.Rivian147?.mounted||window.Hotel146?.active||window.Hibachi145?.active||window.FarmScene63?.active||window.Forklift34?.mounted||window.Ambulance35?.mounted||window.Farming36?.mounted||window.Robotics37?.active||window.Crane39?.active||window.MRI42?.active||window.Welding43?.active||window.Drone44?.mission||window.PCChallenge66?.active);}
 function nearBooth(id){const r=shippedBooths.get(id);if(!r||state.overview||window.FarmScene63?.active)return false;const a=(window.Crowd?.representatives()||[]).find(a=>a.boothId===id),p=a?.position||shipmentApproach(r)?.point;return !!p&&Math.abs(player.position[1]-p[1])<1.5&&Math.hypot(player.position[0]-p[0],player.position[2]-p[2])<=1.4;}
 function industry(m){view='industry';selected=m.id;header(m.title,home);const s=store.snapshot();note(m.industry);body.append(el('h3','Industry challenges'));
  if(travelBlocked())note('Leave your current challenge before traveling to another exhibit.');
  for(const [id,title]of m.challenges){const row=el('div',undefined,'m99-booth');row.append(icon(s.challenges[id]?'circle-check':'circle'),el('span',title));const b=button('Find',()=>{if(travelBlocked())return;close();findChallenge(id);},'map-pin');b.disabled=travelBlocked();row.append(b);body.append(row);}
  body.append(el('h3','Employer conversations'));note(Math.min(5,(s.visits[m.id]||[]).length)+' of 5 distinct employers completed');
  const booths=boothList(m),savedVisits=s.visits[m.id]||[],all=[...booths,...savedVisits.filter(v=>!booths.some(b=>b.id===v.id)).map(v=>({...v,industry:m.industry,offline:true}))];
  if(booths.length<5&&savedVisits.length<5)note('Only '+booths.length+' employer booth'+(booths.length===1?' is':'s are')+' currently available in '+m.industry+'. Five are required; your progress will wait for the event organizer to add the remaining booths.');
  for(const b of all){const completed=savedVisits.some(v=>v.id===b.id),row=el('div',undefined,'m99-booth');row.append(icon(completed?'circle-check':'circle'),el('span',b.name+(b.offline?' (not currently in venue)':'')));
   if(completed)row.append(button('Review',()=>boothForm(b,true),'file-pen-line'));
   if(!b.offline){const visit=button(nearBooth(b.id)?'Answer':'Find',()=>{if(travelBlocked())return;if(nearBooth(b.id))openBooth(b.id);else{close();walkToShipment(b.id);}},nearBooth(b.id)?'message-square':'map-pin');visit.disabled=travelBlocked();row.append(visit);}body.append(row);}
  const form=el('form'),f=field(form,m.reflection,drafts.get('reflection-'+m.id)??s.reflections[m.id]??'');f.oninput=()=>{f.setCustomValidity('');drafts.set('reflection-'+m.id,f.value);};submit(form,'Save reflection',()=>{if(blankCheck([f])&&store.reflect(m.id,f.value)){drafts.delete('reflection-'+m.id);saved();}});body.append(form);status();
 }
 function openBooth(id){if(travelBlocked()||!nearBooth(id))return false;const r=shippedBooths.get(id);if(!C.industries.some(m=>m.industry===r.industry))return false;boothForm({id:r.id,name:r.name,industry:r.industry},false);show();return true;}
 function boothForm(b,review){const m=C.industries.find(m=>m.industry===b.industry);if(!m)return;view='booth';selected=b.id;header(b.name,()=>industry(m));note(m.industry+' / Employer conversation');note('Use the employer\'s booth information or ask its representative. Answer in your own words.');
  // The booth's own video and resource links (boothmedia162), also reachable with E at its TV or papers.
  const media=window.BoothMedia162?shippedBooths.get(b.id)?.media162||[]:[];
  if(media.length){const row=el('div',undefined,'m99-actions');for(const a of media)row.append(button(a.kind==='video'?'Watch company video':'Open: '+a.title,()=>BoothMedia162.open({...a,booth:b.name}),a.kind==='video'?'play':'external-link'));body.append(row);}
  const previous=(store.snapshot().visits[m.id]||[]).find(v=>v.id===b.id),form=el('form'),values=drafts.get('booth-'+b.id)||previous?.answers||[],fields=m.questions.map((q,i)=>field(form,q,values[i]||''));
  fields.forEach(f=>f.oninput=()=>{f.setCustomValidity('');drafts.set('booth-'+b.id,fields.map(f=>f.value));});
  submit(form,previous?'Save updated answers':'Complete employer visit',()=>{if(!blankCheck(fields))return;if(!previous&&!nearBooth(b.id)){saveStatus.textContent='Return to this employer booth to complete the visit.';return;}
   if(store.visit(b,fields.map(f=>f.value))){drafts.delete('booth-'+b.id);saved();saveStatus.textContent+=' Employer visit complete.';}
  });body.append(form);status();
 }
 function career(){view='career';selected=null;header('My Next Step',home);const s=store.snapshot().career,d=drafts.get('career')||s,form=el('form');
  const name=field(form,'Name on your certificate',d.name||'',80,1,'input'),select=el('select'),label=el('label','Which industry would you like to explore further?');select.id='industryChoice99';label.htmlFor=select.id;select.required=true;const prompt=el('option','Choose an industry');prompt.value='';select.append(prompt);for(const m of C.industries){const o=el('option',m.industry);o.value=m.id;select.append(o);}select.value=d.industry||'';form.append(label,select);
  const plan=field(form,'What do you want to do after high school, and why? It is okay to be undecided.',d.plan||''),step=field(form,'What is one next step you can take to learn more or prepare?',d.step||''),company=field(form,'Name your future company',d.company||'',80,1,'input'),choices=el('fieldset',undefined,'m99-logos');choices.append(el('legend','Your company logo'));
  for(const logo of C.logos){const l=el('label'),r=el('input');r.type='radio';r.name='logo99';r.value=logo.id;r.required=true;r.checked=d.logo===logo.id;l.style.setProperty('--gem',logo.color);l.append(r,icon(logo.icon),document.createTextNode(logo.name));choices.append(l);}form.append(choices);
  const read=()=>({name:name.value,industry:select.value,plan:plan.value,step:step.value,company:company.value,logo:form.querySelector('[name=logo99]:checked')?.value||''});form.oninput=e=>{e.target.setCustomValidity?.('');drafts.set('career',read());};
  submit(form,'Save my next step',()=>{if(blankCheck([name,plan,step,company])&&store.career(read())){drafts.delete('career');saved();}});body.append(form);status();
 }
 function findChallenge(id){const routes={hotel:()=>window.Hotel146?.visit(),hibachi:()=>window.Hibachi145?.visit(),harvest:()=>window.ChallengeEntry38?.visit('farm'),drone:()=>window.Drone44?.visit?.(),robotics:()=>window.Robotics37?.visit?.(),welding:()=>window.Welding43?.visit?.(),forklift:()=>window.Forklift34?.visit?.(),crane:()=>window.Crane39?.visit?.(),ambulance:()=>window.ChallengeEntry38?.visit('ambulance'),mri:()=>window.MRI42?.visit?.(),network:()=>window.Network40?.visit?.(),pc:()=>window.PCChallenge66?.visit?.()};routes[id]?.();}
 function answer(parent,q,a){const d=el('div',undefined,'m99-answer');d.append(el('div',q,'m99-label'),el('p',a));parent.append(d);}
 function makeCertificate(){const s=store.snapshot(),c=s.career,root=el('article',undefined,'m99-print'),cover=el('section'),brand=(document.querySelector('body>header .brand img.brand-print179')||document.querySelector('body>header .brand img'))?.cloneNode();if(brand){brand.className='m99-brand';brand.removeAttribute('width');brand.removeAttribute('height');cover.append(brand);}cover.append(el('h1','Certificate of Completion'),el('p','MiCareerQuest / Career Exploration'),el('p',c.name,'m99-name'),el('p','Completed all '+C.missions.length+' missions: '+C.industries.reduce((n,m)=>n+m.challenges.length,0)+' industry challenges, '+C.industries.length*5+' employer conversations, '+C.industries.length+' industry reflections, and a personal career plan.'),el('p',new Date(s.completedAt).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'})));if(window.Journey166?.prettyCode)cover.append(el('p','Journey code '+Journey166.prettyCode));
  const awards=el('div',undefined,'m99-awards');for(const m of C.missions){const a=el('div',undefined,'m99-award');a.append(gem(m),el('strong',m.title));awards.append(a);}cover.append(awards);
  const logo=C.logos.find(l=>l.id===c.logo),company=el('div',undefined,'m99-logo');company.style.setProperty('--gem',logo.color);const name=el('div');name.append(el('strong',c.company),el('div','My future company / '+logo.name));company.append(icon(logo.icon),name);cover.append(company);root.append(cover);
  const plan=el('section',undefined,'m99-section');plan.append(el('h2','My Next Step'),el('p','Industry of interest: '+C.industries.find(m=>m.id===c.industry).industry));answer(plan,'After high school',c.plan);answer(plan,'My next step',c.step);for(const m of C.industries)answer(plan,m.reflection,s.reflections[m.id]);root.append(plan);
  for(const m of C.industries){const section=el('section',undefined,'m99-section');section.append(el('h2',m.industry),el('p','Completed: '+m.challenges.map(c=>c[1]).join(' and ')));for(const v of s.visits[m.id]){section.append(el('h3',v.name));m.questions.forEach((q,i)=>answer(section,q,v.answers[i]));}root.append(section);}
  return root;
 }
 const originalCertificate=makeCertificate;
 makeCertificate=function(){const s=store.snapshot();if(!s.testComplete)return originalCertificate();const root=el('article',undefined,'m99-print');root.append(el('h1','Test Completion'),el('p','MiCareerQuest / Test shortcut'),el('p','All '+C.missions.length+' missions unlocked for testing. This is not a record of completed student work.'),el('p',s.career.name||'Student name not entered','m99-name'));
  const awards=el('div',undefined,'m99-awards');for(const m of C.missions){const a=el('div',undefined,'m99-award');a.append(gem(m),el('strong',m.title));awards.append(a);}root.append(awards);
  const logo=C.logos.find(l=>l.id===s.career.logo);if(logo){const company=el('div',undefined,'m99-logo');company.style.setProperty('--gem',logo.color);company.append(icon(logo.icon),el('strong',s.career.company||''));root.append(company);}
  const response=(q,a)=>answer(root,q,a||'No response entered.');response('After high school',s.career.plan);response('My next step',s.career.step);for(const m of C.industries){root.append(el('h2',m.industry));response(m.reflection,s.reflections[m.id]);for(const v of s.visits[m.id]||[]){root.append(el('h3',v.name));m.questions.forEach((q,i)=>response(q,v.answers[i]));}}return root;
 };
 function certificate(){if(!store.complete())return;view='certificate';header('Your Certificate',home);const actions=el('div',undefined,'m99-actions');actions.append(button('Print certificate & responses',print,'printer'));body.append(actions,makeCertificate());dialog.scrollTop=0;}
 function print(){if(!store.complete())return;printRoot?.remove();printRoot=makeCertificate();printRoot.id='certificate99';printRoot.hidden=true;document.body.append(printRoot);close();window.print();}
 window.addEventListener('afterprint',()=>{if(!printRoot)return;printRoot.remove();printRoot=null;certificate();show();});
 const control=$('controlsIconBtn');control.title='Controls';control.querySelector('.cib-icon').replaceChildren(icon('sliders-vertical'));$('missionIconBtn').title='Missions';$('missionIconBtn').querySelector('.mib-icon').replaceChildren(icon('menu'));
 function decorateHUD(){for(const m of C.missions){const n=document.querySelector('.gem-node[data-badge="'+m.id+'"]');if(!n)continue;n.style.setProperty('--gem',m.color);n.querySelector('.gem-icon-emoji').replaceChildren(icon(m.icon));}SkillSystem.render();MissionList.render();}
 SkillSystem.mount();decorateHUD();store.subscribe(()=>{if(dialog.open&&view==='home')home();});
 // Query only unfinished challenges, twice a second. No scene copies or new render loop.
 const sources={hotel:'Hotel146',hibachi:'Hibachi145',harvest:'Farming36',drone:'Drone44',robotics:'Robotics37',welding:'Welding43',forklift:'Forklift34',crane:'Crane39',ambulance:'Ambulance35',mri:'MRI42',network:'Network40'};
 function checkChallenges(){if(employerModeParams())return;const completed=store.snapshot().challenges;for(const [id,global]of Object.entries(sources)){if(completed[id])continue;const s=window[global]?.snapshot?.();if(s&&(s.complete===true&&id==='hotel'||s.phase==='complete'||s.stage==='complete'||(id==='forklift'&&s.delivered===true)))store.challenge(id);}if(!completed.pc){try{const s=JSON.parse(localStorage.getItem('micq.pc-builder66.collection.v1'));if(s?.unlocked&&s.certificate?.completed&&s.certificate.phase==='complete')store.challenge('pc');}catch{}}}
 setInterval(checkChallenges,500);
 return {open,close,openBooth,checkChallenges,get active(){return dialog.open;}};
})();
