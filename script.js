(() => {
 'use strict';
 const $ = id => document.getElementById(id);
 const root = document.documentElement;
 const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
 const hero = $('home');
 let manualPause = root.classList.contains('reduce-motion');
 let heroVisible = true;
 let syncCanvas = () => {};
 const reduced = () => manualPause || motionQuery.matches;
 const safeWrite = (key,value) => { try { localStorage.setItem(key,value); return true; } catch (_) { return false; } };
 function syncMotion() {
   const paused = reduced();
   root.classList.toggle('reduce-motion',paused);
   hero.classList.toggle('animate',!paused);
   $('motion-toggle').setAttribute('aria-pressed',String(paused));
   const label = motionQuery.matches ? 'Animations paused by system preference' : paused ? 'Resume animations' : 'Pause animations';
   $('motion-toggle').setAttribute('aria-label',label);
   $('motion-toggle').title = label;
   $('motion-toggle').disabled = motionQuery.matches;
   $('motion-metric').textContent = paused ? 'Reduced' : 'Enabled';
   syncCanvas();
 }
 $('motion-toggle').addEventListener('click',() => {
   manualPause = !manualPause;
   safeWrite('portfolio-motion',manualPause ? 'reduced' : 'full');
   syncMotion();
 });
 motionQuery.addEventListener('change',syncMotion);
 function syncTheme() {
   const light = root.dataset.theme === 'light';
   $('theme-toggle').setAttribute('aria-pressed',String(light));
   $('theme-toggle').setAttribute('aria-label',light ? 'Use dark theme' : 'Use light theme');
   $('theme-toggle').title = light ? 'Use dark theme' : 'Use light theme';
   document.querySelector('meta[name="theme-color"]').content = light ? '#f2f5f3' : '#10151a';
 }
 $('theme-toggle').addEventListener('click',() => {
   root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
   safeWrite('portfolio-theme',root.dataset.theme); syncTheme(); syncCanvas();
 });
 syncTheme(); syncMotion();
 // Native anchors preserve deep links, browser history, and a functional no-JS page.
 const nav = $('primary-nav');
 function closeMenu() { nav.classList.remove('is-open'); $('menu-toggle').setAttribute('aria-expanded','false'); $('menu-toggle').setAttribute('aria-label','Open menu'); }
 $('menu-toggle').addEventListener('click',() => {
   const open = nav.classList.toggle('is-open');
   $('menu-toggle').setAttribute('aria-expanded',String(open));
   $('menu-toggle').setAttribute('aria-label',open ? 'Close menu' : 'Open menu');
 });
 document.addEventListener('click',e => { if (!e.target.closest('.top')) closeMenu(); });
 document.addEventListener('keydown',e => { if(e.key === 'Escape' && nav.classList.contains('is-open')) {closeMenu();$('menu-toggle').focus();} });
 document.querySelector('.top').addEventListener('focusout',e => { if(e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) closeMenu(); });
 nav.addEventListener('click',e => { if (e.target.closest('a')) closeMenu(); });
 const aliases = {'#/projects':'notebook','#projects':'work','#/':'home','#path':'path'};
 function route() {
   let id;
   try { id = aliases[location.hash] || decodeURIComponent(location.hash.slice(1)); } catch (_) { return; }
   const target = $(id);
   if (!target) return;
   if(id === 'notebook') target.open = true;
   if(aliases[location.hash]) target.scrollIntoView({behavior:'instant',block:'start'});
   // Focus the destination so keyboard and screen-reader users continue there.
   if(!target.hasAttribute('tabindex')) target.setAttribute('tabindex','-1');
   target.focus({preventScroll:true});
 }
 window.addEventListener('hashchange',route);
 // Updating the sticky offset handles menu wrapping, zoom, and safe-area changes.
 if('ResizeObserver' in window) new ResizeObserver(entries => {
   root.style.setProperty('--header-height',entries[0].target.getBoundingClientRect().height+'px'); scheduleScroll();
 }).observe(document.querySelector('.top'));
 const sections = ['about','work','experience','skills','contact'].map($);
 let scrollPending = false;
 function updateScroll() {
   scrollPending = false;
   const total = document.documentElement.scrollHeight-innerHeight;
   const fraction = total > 0 ? Math.max(0,Math.min(1,scrollY/total)) : 0;
   $('scroll-progress').style.transform = 'scaleX('+fraction+')';
   const offset = document.querySelector('.top').getBoundingClientRect().height + 80;
   let active = '';
   sections.forEach(s => {if(s.getBoundingClientRect().top <= offset) active=s.id;});
   if(fraction > .995 && scrollY > 0) active='contact';
   nav.querySelectorAll('a').forEach(a => {
     if(a.hash === '#'+active) a.setAttribute('aria-current','location'); else a.removeAttribute('aria-current');
   });
 }
 function scheduleScroll() {if(!scrollPending){scrollPending=true;requestAnimationFrame(updateScroll);}}
 window.addEventListener('scroll',scheduleScroll,{passive:true});
 window.addEventListener('resize',scheduleScroll,{passive:true});
 if('ResizeObserver' in window) new ResizeObserver(scheduleScroll).observe(document.body);
 // Filtering keeps static project content in the document, including without JS.
 let category='all';
 const cards = [...document.querySelectorAll('.project-card')];
 const searchText = cards.map(c => c.textContent.toLocaleLowerCase());
 function filterProjects() {
   const query = $('project-search').value.trim().toLocaleLowerCase(); let count=0;
   cards.forEach((card,i) => {const show=(category==='all'||card.dataset.category===category) && searchText[i].includes(query); card.hidden=!show; if(show) count++;});
   $('project-count').textContent=count+' of '+cards.length+' projects'+(query?' matching your search':'');
   $('project-empty').hidden=count!==0; scheduleScroll();
 }
 document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click',() => {
   category=button.dataset.filter;
   document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed',String(b===button)));filterProjects();
 }));
 $('project-search').addEventListener('input',filterProjects);
 $('reset-filters').addEventListener('click',() => {category='all';$('project-search').value='';document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.filter==='all')));filterProjects();$('project-search').focus();});
 // Native modal dialog handles focus containment and Escape; arrow navigation supplements Tab.
 const dialog=$('command-dialog'), commandInput=$('command-input');
 let commandOpener;
 const commands=[['Home','home'],['About me','about'],['Selected work','work'],['Experience','experience'],['Skills & certifications','skills'],['Contact','contact'],['Local project notebook','notebook'],['Switch color theme','theme'],['Pause / resume animations','motion']];
 function openCommands() {if(dialog.open) return;commandOpener=document.activeElement;closeMenu();commandInput.value='';renderCommands();dialog.showModal();commandInput.focus();}
 function closeCommands() {dialog.close();}
 function renderCommands() {
   const query=commandInput.value.toLowerCase().trim();const list=$('command-list');list.replaceChildren();
   commands.filter(([label,id]) => label.toLowerCase().includes(query) && !(id==='motion' && motionQuery.matches)).forEach(([label,id]) => {
     const li=document.createElement('li'),button=document.createElement('button');button.type='button';button.textContent=label;
     button.addEventListener('click',() => {
       closeCommands();
       if(id==='theme') $('theme-toggle').click();
       else if(id==='motion') $('motion-toggle').click();
       else {if(id==='notebook') $('notebook').open=true;if(location.hash==='#'+id){$(id).scrollIntoView();$(id).setAttribute('tabindex','-1');$(id).focus({preventScroll:true});}else location.hash=id;}
     });li.append(button);list.append(li);
   });$('command-empty').hidden=list.children.length>0;
 }
 $('command-open').addEventListener('click',openCommands);$('command-close').addEventListener('click',closeCommands);
 commandInput.addEventListener('input',renderCommands);
 dialog.addEventListener('close',() => {if(commandOpener?.isConnected) commandOpener.focus({preventScroll:true});});
 dialog.addEventListener('click',e => {const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)) closeCommands();});
 dialog.addEventListener('keydown',e => {
   if(e.key==='Escape'){e.preventDefault();closeCommands();return;}
   if(e.key==='Tab'){
     const focusable=[...dialog.querySelectorAll('button:not(:disabled),input')].filter(el=>el.getClientRects().length);
     const first=focusable[0],last=focusable[focusable.length-1];
     if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
     else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
     return;
   }
   const buttons=[...$('command-list').querySelectorAll('button')];if(!buttons.length)return;
   const index=buttons.indexOf(document.activeElement);
   if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const next=e.key==='ArrowDown'?(index+1)%buttons.length:(index<0?buttons.length-1:(index-1+buttons.length)%buttons.length);buttons[next].focus();}
   if(e.key==='Enter'&&document.activeElement===commandInput){e.preventDefault();buttons[0].click();}
 });
 document.addEventListener('keydown',e => {
   const typing=e.target.closest('input,textarea,select,[contenteditable="true"]');
   if(((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k')||(!typing&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&e.key==='/')) {e.preventDefault();dialog.open?closeCommands():openCommands();}
 });
 $('copy-email').addEventListener('click',async () => {
   try {if(!navigator.clipboard)throw new Error('Unavailable');await navigator.clipboard.writeText('maxfona20@gmail.com');$('copy-status').textContent='Email address copied.';}
   catch(_){$('copy-status').textContent='Copy manually: maxfona20@gmail.com';}
 });
 // localStorage is untrusted input. Bound every field; create user content as text nodes.
 const STORAGE_KEY='portfolio-user-projects';
 let projects=[],editingId=null,deleted=null,storageOK=true;
 const form=$('project-form');
 const fields={title:$('pf-title'),desc:$('pf-desc'),tags:$('pf-tags'),link:$('pf-link')};
 const uid=() => globalThis.crypto?.randomUUID?.() || 'p-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
 function validURL(value) {if(!value)return '';try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&u.hostname&&!u.username&&!u.password?u.href:'';}catch(_){return '';}}
 function normalized(value) {
   if(!Array.isArray(value))throw new Error('Invalid saved data');
   const ids=new Set();
   return value.slice(0,100).filter(p => p && typeof p==='object' && typeof p.title==='string' && p.title.trim()).map(p => {
     let id=typeof p.id==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(p.id)&&!ids.has(p.id)?p.id:uid();ids.add(id);
     return {id,title:p.title.trim().slice(0,80),desc:typeof p.desc==='string'?p.desc.slice(0,500):'',tags:[...new Set((Array.isArray(p.tags)?p.tags:[]).filter(t=>typeof t==='string').map(t=>t.trim().slice(0,30)).filter(Boolean))].slice(0,8),link:typeof p.link==='string'?validURL(p.link.slice(0,1000)):'',addedAt:Number.isFinite(p.addedAt)?p.addedAt:Date.now()};
   });
 }
 function storageMessage(message) {$('storage-note').textContent=message;}
 function loadProjects() {
   try {const raw=localStorage.getItem(STORAGE_KEY);projects=raw?normalized(JSON.parse(raw)):[];}
   catch(_){storageOK=false;projects=[];storageMessage('Saved data is unavailable or unreadable. New notes stay in memory for this visit; export JSON to keep them. Existing storage has not been overwritten.');return;}
   try {const probe='portfolio-probe-'+uid();localStorage.setItem(probe,'1');localStorage.removeItem(probe);
     storageOK=true;storageMessage('Saved only in this browser. No account or server.');
   }catch(_){storageOK=false;storageMessage('Saved notes loaded, but browser storage is not writable. Changes stay in memory; export JSON to keep them.');}
 }
 function persist() {
   if(storageOK && !safeWrite(STORAGE_KEY,JSON.stringify(projects)))storageOK=false;
   if(!storageOK)storageMessage('Changes are in memory only. Export JSON to keep them after this visit.');
 }
 const announce=message => {$('notebook-status').textContent=message;};
 function resetForm() {editingId=null;form.reset();$('save-project').textContent='Add project';$('cancel-edit').hidden=true;$('form-error').textContent='';}
 function node(tag,text,className) {const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
 function renderLocal(focusId) {
   const list=$('local-list');list.replaceChildren();
   projects.slice().reverse().forEach(p => {
     const li=node('li',undefined,'local-card');li.dataset.id=p.id;
     const heading=node('h3',p.title);heading.tabIndex=-1;li.append(heading);
     if(p.desc)li.append(node('p',p.desc));
     const tags=node('div',undefined,'tags');p.tags.forEach(tag=>tags.append(node('span',tag,'tag')));li.append(tags);
     const url=validURL(p.link);if(url){const link=node('a',new URL(url).hostname+' ↗');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label','Open '+p.title+' (new tab)');li.append(link);}
     const actions=node('div',undefined,'actions');
     ['Edit','Delete'].forEach(label=>{const b=node('button',label,'btn small-btn');b.type='button';b.dataset.action=label.toLowerCase();b.dataset.id=p.id;b.setAttribute('aria-label',label+' '+p.title);actions.append(b);});li.append(actions);list.append(li);
     if(p.id===focusId)requestAnimationFrame(()=>heading.focus({preventScroll:true}));
   });
   $('local-count').textContent=projects.length+' saved project'+(projects.length===1?'':'s');
   if(!storageOK)$('local-count').textContent=projects.length+' project'+(projects.length===1?'':'s')+' this visit';
   $('local-empty').hidden=projects.length>0;$('export-projects').disabled=projects.length===0;
 }
 form.addEventListener('submit',e=>{
   e.preventDefault();$('form-error').textContent='';
   const title=fields.title.value.trim(),rawLink=fields.link.value.trim(),link=validURL(rawLink);
   if(!title){$('form-error').textContent='Enter a project title.';fields.title.focus();return;}
   if(rawLink&&!link){$('form-error').textContent='Use a complete http:// or https:// URL without a username or password.';fields.link.focus();return;}
   if(!editingId&&projects.length>=100){$('form-error').textContent='Notebook limit: 100 projects. Export or remove a note before adding another.';return;}
   const tags=[...new Set(fields.tags.value.split(',').map(t=>t.trim().slice(0,30)).filter(Boolean))].slice(0,8);
   const existing=projects.find(p=>p.id===editingId);
   const project={id:existing?.id||uid(),title:title.slice(0,80),desc:fields.desc.value.trim().slice(0,500),tags,link,addedAt:existing?.addedAt||Date.now()};
   if(existing)projects=projects.map(p=>p.id===existing.id?project:p);else projects.push(project);
   persist();resetForm();renderLocal(project.id);announce((existing?'Project updated.':'Project added.')+(storageOK?' Saved in this browser.':' Export to keep a copy.'));
 });
 $('cancel-edit').addEventListener('click',()=>{resetForm();fields.title.focus();announce('Edit canceled.');});
 $('local-list').addEventListener('click',e=>{
   const b=e.target.closest('button[data-action]');if(!b)return;const p=projects.find(p=>p.id===b.dataset.id);if(!p)return;
   if(b.dataset.action==='edit') {editingId=p.id;fields.title.value=p.title;fields.desc.value=p.desc;fields.tags.value=p.tags.join(', ');fields.link.value=p.link;$('form-error').textContent='';$('save-project').textContent='Save changes';$('cancel-edit').hidden=false;fields.title.focus();}
   else {deleted={project:p,index:projects.indexOf(p)};projects=projects.filter(item=>item.id!==p.id);if(editingId===p.id)resetForm();persist();renderLocal();$('undo-delete').hidden=false;$('undo-delete').focus({preventScroll:true});announce('“'+p.title+'” removed. You can undo the last deletion during this visit.');}
 });
 $('undo-delete').addEventListener('click',()=>{if(!deleted)return;if(projects.length>=100){announce('Remove a note before restoring this one.');return;}const p=deleted.project;if(!projects.some(item=>item.id===p.id))projects.splice(deleted.index,0,p);deleted=null;persist();renderLocal(p.id);$('undo-delete').hidden=true;announce('Project restored.');});
 $('export-projects').addEventListener('click',()=>{
   const blob=new Blob([JSON.stringify(projects,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='maximilian-fona-project-notebook.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);announce('JSON export prepared.');
 });
 window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY||e.key===null){loadProjects();resetForm();deleted=null;$('undo-delete').hidden=true;renderLocal();announce('Notebook refreshed after a change in another tab.');}});
 loadProjects();renderLocal();
 // Small hero-only canvas: bounded resolution, 24 fps, no work offscreen or in reduced motion.
 const canvas=$('net-bg'),ctx=canvas.getContext('2d');
 if(ctx){
   let w=0,h=0,nodes=[],frame=0,last=0,color='';
   function measure(){const box=hero.getBoundingClientRect();w=box.width;h=box.height;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);nodes=Array.from({length:Math.min(28,Math.floor(w/40))},(_,i)=>({x:(i*197+31)%w,y:(i*113+53)%h,vx:(i%2?.7:-.7),vy:(i%3?.25:-.4)}));color=getComputedStyle(root).getPropertyValue('--accent').trim();draw(false,1);syncCanvas();}
   function draw(move,delta){ctx.clearRect(0,0,w,h);ctx.fillStyle=color;ctx.strokeStyle=color;ctx.lineWidth=.7;nodes.forEach(n=>{if(move){n.x=(n.x+n.vx*delta+w)%w;n.y=(n.y+n.vy*delta+h)%h;}ctx.globalAlpha=.65;ctx.beginPath();ctx.arc(n.x,n.y,1.4,0,Math.PI*2);ctx.fill();});for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j],distance=Math.hypot(a.x-b.x,a.y-b.y);if(distance<150){ctx.globalAlpha=(1-distance/150)*.4;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}ctx.globalAlpha=1;}
   function tick(now){if(now-last>=1000/24){draw(true,Math.min((now-last)/42,2));last=now;}frame=requestAnimationFrame(tick);}
   syncCanvas=()=>{cancelAnimationFrame(frame);frame=0;last=0;color=getComputedStyle(root).getPropertyValue('--accent').trim();const running=!reduced()&&!document.hidden&&heroVisible;root.classList.toggle('background-paused',document.hidden||!heroVisible);$('canvas-metric').textContent=reduced()?'Static':running?'Active · 24 fps cap':'Paused offscreen';draw(false,1);if(running)frame=requestAnimationFrame(tick);};
   if('ResizeObserver' in window)new ResizeObserver(measure).observe(hero);else window.addEventListener('resize',measure,{passive:true});
   document.addEventListener('visibilitychange',syncCanvas);
   if('IntersectionObserver' in window)new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;syncCanvas();}).observe(hero);
   measure();
 }else{$('canvas-metric').textContent='Unavailable';}
 root.classList.add('enhanced');filterProjects();scheduleScroll();
 if(location.hash)requestAnimationFrame(route);
})();
