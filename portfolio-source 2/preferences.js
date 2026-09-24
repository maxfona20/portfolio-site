// Apply preferences before paint. Essential content is always visible.
(() => {
 const root=document.documentElement;
 root.classList.add('enhanced');
 try {
  const theme=localStorage.getItem('portfolio-theme');
  if(theme==='light'||theme==='dark')root.dataset.theme=theme;
  if(localStorage.getItem('portfolio-motion')==='reduced')root.dataset.motion='paused';
 }catch{}
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)root.dataset.motion='paused';
})();
