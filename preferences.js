// Apply preferences before paint. Content never depends on JavaScript to appear.
document.documentElement.classList.add('enhanced');
try {
  const theme = localStorage.getItem('portfolio-theme');
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
  if (localStorage.getItem('portfolio-motion') === 'reduced') document.documentElement.classList.add('reduce-motion');
} catch (_) {}
