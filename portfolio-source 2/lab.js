(() => {
  'use strict';
  const root = document.getElementById('lab');
  if (!root || root.dataset.initialized === 'true') return;
  root.dataset.initialized = 'true';

  const find = (id) => root.querySelector(`#${id}`);
  const ui = {
    console: root.querySelector('.lab-console'),
    endpoint: find('lab-endpoint'), auth: find('lab-auth'),
    send: find('lab-send'), reset: find('lab-reset'),
    service: find('lab-service-name'), request: find('lab-request'),
    response: find('lab-response'), status: find('lab-response-status'),
    result: find('lab-result'), count: find('lab-run-count')
  };
  const nodes = Object.fromEntries([...root.querySelectorAll('[data-phase]')].map((node) => [node.dataset.phase, node]));
  const endpoints = {
    documents: {path: '/api/documents', service: 'documents.service', body: {documents: [{id: 'demo-01', title: 'Security notes'}, {id: 'demo-02', title: 'Service architecture'}]}},
    users: {path: '/api/users/me', service: 'users.service', body: {user: {id: 'demo-user', name: 'Demo visitor', role: 'reader'}}},
    search: {path: '/api/search?q=security', service: 'search.service', body: {query: 'security', matches: [{id: 'demo-01', title: 'Security notes'}]}}
  };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const timers = new Set();
  let generation = 0;
  let active = null;
  let runs = 0;
  const motionOff = () => reducedMotion.matches || document.documentElement.dataset.motion === 'paused';

  function setNode(phase, state, text) {
    const node = nodes[phase];
    node.dataset.state = state;
    node.querySelector('.lab-phase-status').textContent = text;
  }

  function stopTimers() {
    generation += 1;
    timers.forEach(clearTimeout);
    timers.clear();
  }

  function setBusy(busy) {
    ui.endpoint.disabled = busy;
    ui.auth.disabled = busy;
    ui.send.disabled = busy;
    ui.console.dataset.labState = busy ? 'running' : 'ready';
    ui.send.firstChild.textContent = busy ? 'Sending… ' : 'Send request ';
  }

  function updateRequest() {
    const endpoint = endpoints[ui.endpoint.value] || endpoints.documents;
    ui.service.textContent = endpoint.service;
    ui.request.textContent = `GET ${endpoint.path} HTTP/1.1\nHost: demo.local\nAuthorization: ${ui.auth.checked ? 'Bearer [demo token]' : 'none'}`;
  }

  function resetFlow(message = 'Choose an endpoint, then send a request.') {
    stopTimers();
    active = null;
    setBusy(false);
    setNode('client', 'waiting', 'Ready to send');
    ['auth', 'service', 'log'].forEach((phase) => setNode(phase, 'waiting', 'Waiting for request'));
    ui.status.textContent = 'Awaiting request';
    ui.status.dataset.result = 'ready';
    ui.response.textContent = JSON.stringify({message: 'Send a request to explore the flow.'}, null, 2);
    ui.result.textContent = message;
  }

  function finish(request) {
    if (active !== request) return;
    stopTimers();
    setNode('client', 'success', 'Request sent');
    setNode('auth', request.authenticated ? 'success' : 'blocked', request.authenticated ? 'Demo token accepted' : 'Token missing');
    setNode('service', request.authenticated ? 'success' : 'skipped', request.authenticated ? 'Response prepared' : 'Skipped: access denied');
    setNode('log', 'success', request.authenticated ? 'Success recorded' : 'Rejection recorded');
    const code = request.authenticated ? 200 : 401;
    ui.status.textContent = `${code} ${request.authenticated ? 'OK' : 'Unauthorized'}`;
    ui.status.dataset.result = String(code);
    ui.response.textContent = JSON.stringify(request.authenticated
      ? {demo: true, ...request.endpoint.body}
      : {demo: true, error: 'unauthorized', message: 'A token is required before this service can respond.'}, null, 2);
    ui.result.textContent = request.authenticated
      ? `200 OK. The demo token passed the check, ${request.endpoint.service} returned sample data, and the event was logged.`
      : '401 Unauthorized. The request was rejected before reaching the service. Turn on the demo token and try again.';
    runs += 1;
    ui.count.textContent = `${runs} demo ${runs === 1 ? 'run' : 'runs'}`;
    active = null;
    setBusy(false);
  }

  function later(delay, callback) {
    const ticket = generation;
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (ticket === generation && active) callback();
    }, delay);
    timers.add(timer);
  }

  function send() {
    if (active || document.hidden) return;
    resetFlow('Request in progress.');
    updateRequest();
    const request = {endpoint: endpoints[ui.endpoint.value] || endpoints.documents, authenticated: ui.auth.checked};
    active = request;
    setBusy(true);
    ui.status.textContent = 'Processing';
    ui.response.textContent = '{\n  "status": "processing"\n}';
    setNode('client', 'active', 'Sending request');
    if (motionOff()) {
      finish(request);
      return;
    }
    later(380, () => {
      setNode('client', 'success', 'Request sent');
      setNode('auth', 'active', 'Checking demo token');
    });
    later(800, () => {
      setNode('auth', request.authenticated ? 'success' : 'blocked', request.authenticated ? 'Demo token accepted' : 'Token missing');
      setNode('service', request.authenticated ? 'active' : 'skipped', request.authenticated ? 'Preparing sample data' : 'Skipped: access denied');
    });
    later(1220, () => {
      if (request.authenticated) setNode('service', 'success', 'Response prepared');
      setNode('log', 'active', 'Recording event');
    });
    later(1640, () => finish(request));
  }

  ui.send.addEventListener('click', send);
  ui.reset.addEventListener('click', () => {
    ui.endpoint.value = 'documents';
    ui.auth.checked = true;
    runs = 0;
    ui.count.textContent = '0 demo runs';
    resetFlow('Demo reset. Choose an endpoint, then send a request.');
    updateRequest();
  });
  [ui.endpoint, ui.auth].forEach((control) => control.addEventListener('change', () => {
    resetFlow('Request updated. Send it to see what happens.');
    updateRequest();
  }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && active) resetFlow('The demo paused while this tab was hidden. Send another request to restart.');
  });
  window.addEventListener('pagehide', () => {
    if (active) resetFlow('The demo stopped. Send another request to restart.');
  });
  const applyMotionPreference = () => {
    if (active && motionOff()) finish(active);
  };
  reducedMotion.addEventListener('change', applyMotionPreference);
  new MutationObserver(applyMotionPreference).observe(document.documentElement, {attributes: true, attributeFilter: ['data-motion']});
  ui.send.disabled = false;
  ui.reset.disabled = false;
  updateRequest();
})();
