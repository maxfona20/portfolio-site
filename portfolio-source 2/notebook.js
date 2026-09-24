(() => {
'use strict';
const $ = id => document.getElementById(id);
const safeWrite = (key,value) => {try {localStorage.setItem(key,value);return true;} catch {return false;}};
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

})();
