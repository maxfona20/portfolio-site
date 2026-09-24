(() => {
  'use strict';

  const host = document.getElementById('sculpture');
  const canvas = document.getElementById('hero-canvas');
  if (!host || !canvas) return;

  let ctx;
  try { ctx = canvas.getContext('2d', { alpha: true }); } catch (_) { return; }
  if (!ctx) return;

  const root = document.documentElement;
  const fallback = host.querySelector('.sculpture-fallback');
  const controls = Array.from(host.querySelectorAll('[data-shape]'));
  const number = document.getElementById('formation-number');
  const state = document.getElementById('sculpture-state');
  const metric = document.getElementById('fps-metric');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const names = ['knot', 'globe', 'wave'];
  const titles = ['KNOT', 'ORBIT', 'WAVE'];
  const layerOpacity = [0.095, 0.19, 0.31, 0.51, 0.82];
  const TAU = Math.PI * 2;
  const U = 80;
  const V = 22;
  const count = U * V;
  const projected = new Float32Array(count * 3);
  const current = new Float32Array(count * 3);
  const origin = new Float32Array(count * 3);
  const meshes = [];
  const connections = [];
  let selected = 0;
  let width = 0;
  let height = 0;
  let centerX = 0;
  let centerY = 0;
  let scale = 1;
  let accent = '#b7f5cb';
  let ink = '#f2f1e8';
  let yaw = 0.24;
  let pitch = -0.44;
  const roll = -0.22;
  const cosRoll = Math.cos(roll);
  const sinRoll = Math.sin(roll);
  let morph = 1;
  let visible = true;
  let frame = 0;
  let lastDraw = 0;
  let sampleStart = 0;
  let sampleFrames = 0;
  let dragging = false;
  let pointerId = null;
  let lastX = 0;
  let lastY = 0;
  let rendered = false;

  // Fixed topology and typed arrays keep geometry bounded and allocation-free while drawing.
  for (let shape = 0; shape < names.length; shape++) {
    const points = new Float32Array(count * 3);
    const edges = [];
    for (let u = 0; u < U; u++) {
      const angle = u / U * TAU;
      for (let v = 0; v < V; v++) {
        const index = (u * V + v) * 3;
        let x, y, z;
        if (shape === 0) {
          // A (2,3) torus knot, with a tube constructed in its moving normal plane.
          const r = 0.92 + 0.36 * Math.cos(3 * angle);
          const dr = -1.08 * Math.sin(3 * angle);
          const ca = Math.cos(2 * angle);
          const sa = Math.sin(2 * angle);
          let tx = dr * ca - 2 * r * sa;
          let ty = dr * sa + 2 * r * ca;
          let tz = 1.08 * Math.cos(3 * angle);
          const tangentLength = Math.hypot(tx, ty, tz);
          tx /= tangentLength;
          ty /= tangentLength;
          tz /= tangentLength;
          const normalLength = Math.hypot(tx, ty);
          const nx = -ty / normalLength;
          const ny = tx / normalLength;
          const bx = -tz * ny;
          const by = tz * nx;
          const bz = tx * ny - ty * nx;
          const tubeAngle = v / V * TAU;
          const a = Math.cos(tubeAngle) * 0.175;
          const b = Math.sin(tubeAngle) * 0.175;
          x = (r * ca + nx * a + bx * b) / 1.43;
          y = (r * sa + ny * a + by * b) / 1.43;
          z = (0.36 * Math.sin(3 * angle) + bz * b) / 1.43;
        } else if (shape === 1) {
          const latitude = (v / (V - 1) - 0.5) * Math.PI;
          x = Math.cos(latitude) * Math.cos(angle) * 0.93;
          y = Math.sin(latitude) * 0.93;
          z = Math.cos(latitude) * Math.sin(angle) * 0.93;
        } else {
          x = (u / (U - 1) - 0.5) * 2.12;
          z = (v / (V - 1) - 0.5) * 1.56;
          y = Math.sin(x * 3.8 + z * 1.3) * 0.22 + Math.cos(z * 4.0 - x) * 0.16;
        }
        points[index] = x;
        points[index + 1] = y;
        points[index + 2] = z;
        const point = u * V + v;
        if (u < U - 1 || shape !== 2) edges.push(point, ((u + 1) % U) * V + v);
        if (v < V - 1) edges.push(point, point + 1);
        else if (shape === 0) edges.push(point, u * V);
      }
    }
    meshes.push(points);
    connections.push(new Uint16Array(edges));
  }
  current.set(meshes[0]);

  const reduced = () => root.dataset.motion === 'paused' || motionPreference.matches;
  const running = () => !reduced() && visible && !document.hidden && width > 0 && height > 0;

  function readColors() {
    const styles = getComputedStyle(root);
    accent = styles.getPropertyValue('--accent').trim() || '#b7f5cb';
    ink = styles.getPropertyValue('--text').trim() || '#f2f1e8';
  }

  function setStatus() {
    const mode = reduced() ? 'STATIC' : document.hidden ? 'PAUSED' : !visible ? 'OFFSCREEN' : 'LIVE';
    if (state) state.textContent = titles[selected] + ' / ' + mode;
    if (metric && mode !== 'LIVE') metric.textContent = mode === 'STATIC' ? 'Static' : mode === 'PAUSED' ? 'Paused' : 'Offscreen';
    else if (metric && !sampleFrames) metric.textContent = 'Measuring';
  }

  function draw() {
    if (!width || !height) return;
    ctx.clearRect(0, 0, width, height);
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);
    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);

    // The three faint guide ellipses frame the object without moving any page content.
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.65;
    ctx.globalAlpha = 0.095;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, scale * 1.18, scale * 0.48, -0.36, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 0.055;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, scale * 1.19, scale * 1.04, 0, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX - scale * 1.28, centerY);
    ctx.lineTo(centerX + scale * 1.28, centerY);
    ctx.moveTo(centerX, centerY - scale * 1.18);
    ctx.lineTo(centerX, centerY + scale * 1.18);
    ctx.stroke();

    for (let i = 0; i < current.length; i += 3) {
      const x = current[i];
      const y = current[i + 1];
      const z = current[i + 2];
      const a = x * cosYaw + z * sinYaw;
      const b = -x * sinYaw + z * cosYaw;
      const c = y * cosPitch - b * sinPitch;
      const depth = y * sinPitch + b * cosPitch;
      const perspective = 3.8 / (3.8 - depth);
      projected[i] = centerX + (a * cosRoll - c * sinRoll) * scale * perspective;
      projected[i + 1] = centerY + (a * sinRoll + c * cosRoll) * scale * perspective;
      projected[i + 2] = depth;
    }

    const edges = connections[selected];
    ctx.strokeStyle = accent;
    ctx.lineJoin = 'round';
    // Depth buckets create luminosity and let the rear surface remain visible.
    for (let layer = 0; layer < 5; layer++) {
      ctx.globalAlpha = layerOpacity[layer];
      ctx.lineWidth = layer === 4 ? 1.0 : 0.7;
      ctx.beginPath();
      for (let j = 0; j < edges.length; j += 2) {
        const a = edges[j] * 3;
        const b = edges[j + 1] * 3;
        const depth = (projected[a + 2] + projected[b + 2]) * 0.5;
        const bucket = Math.max(0, Math.min(4, Math.floor((depth + 1.1) / 0.44)));
        if (bucket !== layer) continue;
        ctx.moveTo(projected[a], projected[a + 1]);
        ctx.lineTo(projected[b], projected[b + 1]);
      }
      ctx.stroke();
    }

    // Sparse illuminated vertices give the silhouette texture without a particle loop.
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    for (let u = 0; u < U; u += 4) {
      for (let v = 1; v < V; v += 4) {
        const i = (u * V + v) * 3;
        if (projected[i + 2] < -0.25) continue;
        const size = projected[i + 2] > 0.45 ? 1.65 : 1.0;
        ctx.moveTo(projected[i] + size, projected[i + 1]);
        ctx.arc(projected[i], projected[i + 1], size, 0, TAU);
      }
    }
    ctx.fill();
    ctx.globalAlpha = 1;
    if (!rendered) {
      rendered = true;
      if (fallback) { fallback.hidden = true; fallback.style.display = 'none'; }
      host.classList.add('sculpture-ready');
    }
  }

  function tick(now) {
    frame = 0;
    if (!running()) { setStatus(); return; }
    const elapsed = now - lastDraw;
    if (!lastDraw || elapsed >= 1000 / 30 - 0.3) {
      const delta = lastDraw ? Math.min(elapsed / 1000, 0.065) : 1 / 30;
      lastDraw = now;
      if (!dragging) {
        yaw += delta * 0.16;
        pitch += delta * 0.026;
      }
      if (morph < 1) {
        morph = Math.min(1, morph + delta / 0.75);
        const eased = morph * morph * (3 - 2 * morph);
        const target = meshes[selected];
        for (let i = 0; i < current.length; i++) current[i] = origin[i] + (target[i] - origin[i]) * eased;
      }
      draw();
      sampleFrames++;
      if (!sampleStart) sampleStart = now;
      if (now - sampleStart >= 1000) {
        if (metric) metric.textContent = Math.min(30, Math.round(sampleFrames * 1000 / (now - sampleStart))) + ' fps';
        sampleStart = now;
        sampleFrames = 0;
      }
    }
    frame = requestAnimationFrame(tick);
  }

  function synchronize() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastDraw = 0;
    sampleStart = 0;
    sampleFrames = 0;
    if (reduced() && morph < 1) {
      current.set(meshes[selected]);
      morph = 1;
    }
    readColors();
    draw();
    setStatus();
    if (running()) frame = requestAnimationFrame(tick);
  }

  function resize() {
    const box = host.getBoundingClientRect();
    width = box.width;
    height = box.height;
    if (!width || !height) { synchronize(); return; }
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    centerX = width * 0.5;
    centerY = height * 0.47;
    scale = Math.min(width * 0.382, Math.max(60, height - 145) * 0.47);
    synchronize();
  }

  function selectShape(name) {
    const next = names.indexOf(name);
    if (next < 0 || next === selected) return;
    origin.set(current);
    selected = next;
    morph = reduced() ? 1 : 0;
    if (morph === 1) current.set(meshes[selected]);
    controls.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.shape === name)));
    if (number) number.textContent = '[ 00' + (selected + 1) + ' ]';
    synchronize();
  }

  controls.forEach((button, index) => {
    button.addEventListener('click', () => selectShape(button.dataset.shape));
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? controls.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + controls.length) % controls.length;
      controls[next].focus();
      controls[next].click();
    });
  });

  canvas.style.touchAction = 'pan-y';
  canvas.style.cursor = 'grab';
  canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    pointerId = event.pointerId;
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.style.cursor = 'grabbing';
    try { canvas.setPointerCapture(pointerId); } catch (_) { /* A canceled touch can already be gone. */ }
  });
  canvas.addEventListener('pointermove', event => {
    if (!dragging || event.pointerId !== pointerId) return;
    yaw += (event.clientX - lastX) * 0.008;
    pitch += (event.clientY - lastY) * 0.008;
    lastX = event.clientX;
    lastY = event.clientY;
    if (!running()) draw();
  });
  function endDrag(event) {
    if (event.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
    canvas.style.cursor = 'grab';
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('lostpointercapture', endDrag);
  document.addEventListener('visibilitychange', synchronize);
  if (motionPreference.addEventListener) motionPreference.addEventListener('change', synchronize);
  else motionPreference.addListener(synchronize);
  new MutationObserver(synchronize).observe(root, { attributes: true, attributeFilter: ['data-motion', 'data-theme'] });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      synchronize();
    }, { threshold: 0.01 }).observe(host);
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(host);
  else window.addEventListener('resize', resize, { passive: true });
  resize();
})();
