/* Week 08: Scalability and Performance
   Interactive pieces: theme, tabs, TTL game, the promo simulator
   (prepare + load test → live hour → results), quiz, capstone checklist,
   template copy, word bank, scroll spy. */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initChoiceGame(TTL_GAME);
  initPromoSim();
  initQuiz();
  initChecklist();
  initCopyTemplate();
  initGlossary();
  initScrollSpy();
});

// Small helper: localStorage can throw in private windows
const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
  }
};

/* ---------------- Theme ---------------- */
function initTheme() {
  const root = document.documentElement;
  root.setAttribute('data-theme', store.get('tpm_theme', 'dark'));
  const btn = document.getElementById('themeToggle');
  btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    store.set('tpm_theme', next);
  });
}

/* ---------------- Case study tabs ---------------- */
function initTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });
}

/* ---------------- Choice game ---------------- */
const TTL_GAME = {
  id: 'ttl',
  names: { none: 'Don\'t cache', sec: 'Seconds', min: 'Minutes', day: 'Hours or days' },
  items: [
    { task: 'The live position of your rider on the map', answer: 'sec',
      why: 'It changes every few seconds. A copy older than that is useless — but a few seconds saves a lot of work.' },
    { task: 'The restaurant\'s logo', answer: 'day',
      why: 'It almost never changes. Keep it for days (often on a CDN).' },
    { task: 'Menu prices and what\'s in stock', answer: 'min',
      why: 'They change during the day, but not every second. A few minutes is a good balance — any longer and people order sold-out food.' },
    { task: 'Whether a payment went through', answer: 'none',
      why: 'Money must always be checked fresh. Showing an old "pending" or "paid" can cause double payments or free food.' },
    { task: 'The list of restaurants open near you', answer: 'min',
      why: 'Restaurants open and close, but not every second. Minutes is fine.' },
    { task: 'A photo of a dish', answer: 'day',
      why: 'Photos rarely change and are big. Perfect for long caching on a CDN.' },
    { task: 'Your wallet balance', answer: 'none',
      why: 'Like payments — always fresh. A stale balance could let someone spend money twice.' }
  ],
  done: pct => pct >= 0.8 ? 'Excellent! You think about freshness like a TPM. 🎉'
    : pct >= 0.5 ? 'Good! Ask: how often does it change, and how bad is it if it\'s old?'
    : 'Tip: money = never cache. Rarely changes = cache long. In between = minutes.'
};

function initChoiceGame(game) {
  const $ = name => document.getElementById(game.id + name);
  const taskEl = $('Task'), feedbackEl = $('Feedback'), scoreEl = $('Score'),
        progressEl = $('Progress'), nextBtn = $('Next');
  const choices = document.querySelectorAll('#' + game.id + 'Game .choice-btn');
  const items = game.items;

  let index = 0, correct = 0, answered = 0, locked = false;

  function show() {
    locked = false;
    taskEl.textContent = '“' + items[index].task + '”';
    feedbackEl.className = 'game-feedback';
    feedbackEl.innerHTML = '';
    choices.forEach(c => { c.disabled = false; c.classList.remove('right', 'wrong'); });
    nextBtn.disabled = true;
    nextBtn.textContent = index === items.length - 1 ? 'See my score →' : 'Next →';
    progressEl.textContent = (index + 1) + ' of ' + items.length;
  }

  function finish() {
    taskEl.textContent = 'You got ' + correct + ' out of ' + items.length + ' right.';
    feedbackEl.className = 'game-feedback show';
    feedbackEl.textContent = game.done(correct / items.length);
    choices.forEach(c => { c.disabled = true; c.classList.remove('right', 'wrong'); });
    progressEl.textContent = 'Finished';
    nextBtn.disabled = false;
    nextBtn.textContent = '↺ Play again';
    index = -1;
  }

  choices.forEach(btn => {
    btn.addEventListener('click', () => {
      if (locked || index < 0) return;
      locked = true;
      const item = items[index];
      const isRight = btn.dataset.pick === item.answer;
      answered++;
      if (isRight) correct++;
      choices.forEach(c => {
        c.disabled = true;
        if (c.dataset.pick === item.answer) c.classList.add('right');
      });
      if (!isRight) btn.classList.add('wrong');
      feedbackEl.className = 'game-feedback show ' + (isRight ? 'is-right' : 'is-wrong');
      feedbackEl.innerHTML = (isRight ? '✅ <strong>Correct!</strong> ' : '❌ <strong>Not quite.</strong> Best answer: ' + game.names[item.answer] + '. ') + item.why;
      scoreEl.textContent = 'Score: ' + correct + ' / ' + answered;
      nextBtn.disabled = false;
    });
  });

  nextBtn.addEventListener('click', () => {
    if (index === -1) { index = 0; correct = 0; answered = 0; scoreEl.textContent = 'Score: 0 / 0'; show(); return; }
    if (index === items.length - 1) { finish(); return; }
    index++;
    show();
  });

  show();
}

/* ---------------- Promo simulator ----------------
   One tick = one simulated minute, 11:55 (t = 0) to 13:00 (t = 65).
   Each person online makes about 1 request every 2 seconds. 60% of requests
   are images (a CDN can serve those); the rest hit the database: 90% reads, 10% writes. */
const SIM = {
  serverCap: 2500, serverCost: 20000, cdnCost: 15000, cacheCost: 10000,
  db: { small: { cap: 5000, cost: 30000 }, large: { cap: 15000, cost: 90000 } },
  hit: { off: 0, '10s': 0.6, '5m': 0.88, '1h': 0.96 },
  ordersPerUser: 0.004, avgOrder: 3500, end: 65, maxServers: 20,
  delays: { server: 3, auto: 2, cdn: 5, cache: 3, replica: 8, dbUpgrade: 2 }
};
const CACHE_NAMES = { off: 'off', '10s': '10 seconds', '5m': '5 minutes', '1h': '1 hour' };
const naira = n => '₦' + Math.round(n).toLocaleString('en-NG');
const fmtClock = t => { const m = 11 * 60 + 55 + t; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };

// People online at minute t
function usersAt(t) {
  let u;
  if (t < 5) u = 2000;
  else if (t < 10) u = 2000 + (45000 - 2000) * (t - 5 + 1) / 5;
  else if (t < 15) u = 45000;
  else if (t < 18) u = 45000 + (60000 - 45000) * (t - 15 + 1) / 3;
  else if (t < 30) u = 60000;
  else u = 60000 - (60000 - 6000) * Math.min(1, (t - 30) / 35);
  return Math.round(u * (1 + 0.03 * Math.sin(t * 1.7)));
}

// Extra seconds of waiting as a part gets busy (same idea as Week 2)
function delay(load) {
  if (load <= 0.7) return 0;
  if (load <= 1) return (load - 0.7) / 0.3 * 1.5;
  return Math.min(12, 1.5 + (load - 1) * 6);
}

// The core model: given people online and the active setup, how does the system behave?
function evaluate(users, a) {
  const rps = users * 0.5;
  const appDemand = a.cdn ? rps * 0.4 : rps;
  const servers = Math.max(0, a.servers - (a.crashed || 0));
  const appLoad = servers ? appDemand / (servers * SIM.serverCap) : Infinity;
  const through = Math.min(1, appLoad === Infinity ? 0 : 1 / Math.max(appLoad, 1e-9));
  const api = rps * 0.4 * through;
  const reads = api * 0.9 * (1 - SIM.hit[a.cache]), writes = api * 0.1;
  const cap = SIM.db[a.db].cap;
  let dbLoad;
  if (a.dbDown) dbLoad = Infinity;
  else if (a.replicas > 0) dbLoad = Math.max(writes / cap, reads / (a.replicas * cap));
  else dbLoad = (reads + writes) / cap;
  const worst = Math.max(appLoad, dbLoad);
  const err = worst === Infinity ? 1 : worst > 1 ? 1 - 1 / worst : 0;
  const latency = err >= 1 ? 15 : 0.5 + (a.cdn ? 0 : 0.6) + delay(worst);
  const bottleneck = appLoad >= dbLoad ? 'app' : 'db';
  return { rps, appLoad, dbLoad, err, latency, bottleneck };
}

function costPerHour(a) {
  return a.servers * SIM.serverCost + (a.cdn ? SIM.cdnCost : 0) + (a.cache !== 'off' ? SIM.cacheCost : 0) +
    SIM.db[a.db].cost * (1 + a.replicas);
}

function initPromoSim() {
  const el = id => document.getElementById(id);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const inputs = { servers: el('sServers'), auto: el('sAuto'), cdn: el('sCdn'), cache: el('sCache'), db: el('sDb'), replicas: el('sRep') };
  let mode = 'prep';            // prep | live | end
  let L = null;                 // live state
  let timer = null, speed = 450, loadTests = 0;

  const readConfig = () => ({
    servers: Number(inputs.servers.value), auto: inputs.auto.checked, cdn: inputs.cdn.checked,
    cache: inputs.cache.value, db: inputs.db.value, replicas: Number(inputs.replicas.value)
  });
  const writeConfig = c => {
    inputs.servers.value = c.servers; inputs.auto.checked = c.auto; inputs.cdn.checked = c.cdn;
    inputs.cache.value = c.cache; inputs.db.value = c.db; inputs.replicas.value = c.replicas;
  };

  function showStage(name) {
    mode = name;
    el('stagePrep').hidden = name !== 'prep';
    el('stageLive').hidden = name !== 'live';
    el('stageEnd').hidden = name !== 'end';
    el('setup').classList.toggle('locked', name === 'end');
    const order = ['prep', 'live', 'end'];
    document.querySelectorAll('#simulation .sim-step').forEach(s => {
      s.classList.toggle('active', s.dataset.stage === name);
      s.classList.toggle('done', order.indexOf(s.dataset.stage) < order.indexOf(name));
    });
  }

  /* ---------- Setup controls ---------- */
  function renderSetup() {
    const c = readConfig();
    el('sServersVal').textContent = c.servers;
    el('sRepVal').textContent = c.replicas;
    const active = mode === 'live' ? L.active : c;
    el('costNow').textContent = naira(costPerHour(active));
    el('pendingNote').textContent = mode === 'live' && L.pending.length ? '⏳ ' + L.pending.map(p => p.label + ' (ready ' + fmtClock(p.at) + ')').join(', ') : '';
  }

  function onChange() {
    if (mode === 'end') return;
    if (mode === 'live') applyLiveChange();
    renderSetup();
  }
  Object.values(inputs).forEach(i => i.addEventListener('input', onChange));
  document.querySelectorAll('[data-srv]').forEach(b => b.addEventListener('click', () => {
    inputs.servers.value = Math.max(1, Math.min(SIM.maxServers, Number(inputs.servers.value) + Number(b.dataset.srv)));
    onChange();
  }));
  document.querySelectorAll('[data-rep]').forEach(b => b.addEventListener('click', () => {
    inputs.replicas.value = Math.max(0, Math.min(3, Number(inputs.replicas.value) + Number(b.dataset.rep)));
    onChange();
  }));

  /* ---------- Load test ---------- */
  el('loadTest').addEventListener('click', () => {
    loadTests++;
    const c = readConfig();
    const peak = evaluate(60000, Object.assign({}, c, { servers: c.auto ? SIM.maxServers : c.servers }));
    const lines = [];
    const pct = v => v === Infinity ? '∞' : Math.round(v * 100) + '%';
    lines.push(row('🖥️ App servers', peak.appLoad, c.auto ? '(auto-scaling can add up to 20, but new ones take 2 minutes)' : c.servers + ' server' + (c.servers > 1 ? 's' : '')));
    lines.push(row('🗄️ Database', peak.dbLoad, SIM.db[c.db].cap.toLocaleString() + ' queries/sec' + (c.replicas ? ' + ' + c.replicas + ' replica' + (c.replicas > 1 ? 's' : '') : '') + (c.cache !== 'off' ? ', cache ' + CACHE_NAMES[c.cache] : ', no cache')));
    function row(name, load, note) {
      const tone = load > 1 ? 'bad' : load > 0.7 ? 'warn' : 'good';
      return '<div class="lt-row ' + tone + '"><span>' + name + '</span><div class="lt-bar"><div style="width:' + Math.min(100, load * 100) + '%"></div></div><strong>' + pct(load) + '</strong><em>' + note + '</em></div>';
    }
    const verdict = peak.err > 0.02
      ? '❌ <strong>At 60,000 people, about ' + Math.round(peak.err * 100) + '% of requests would fail</strong> and pages would take ' + peak.latency.toFixed(1) + 's. The bottleneck is the <strong>' + (peak.bottleneck === 'app' ? 'app servers' : 'database') + '</strong>.'
      : peak.latency > 2 ? '⚠️ <strong>It would survive, but slowly</strong>: pages would take ' + peak.latency.toFixed(1) + 's. Customers start leaving after about 3 seconds.'
      : '✅ <strong>This setup handles 60,000 people</strong> with pages in ' + peak.latency.toFixed(1) + 's.';
    const box = el('loadTestResult');
    box.hidden = false;
    box.innerHTML = '<h3>🧪 Load test result (peak: 60,000 people)</h3>' + lines.join('') + '<p class="lt-verdict">' + verdict + '</p>' +
      '<p class="muted small">Cost of this setup: ' + naira(costPerHour(c)) + '/hour' + (c.auto ? ' at the start (more while auto-scaling adds servers)' : '') + '. Change things above and test again.</p>';
  });

  /* ---------- Live ---------- */
  el('goLive').addEventListener('click', startLive);

  function startLive() {
    const c = readConfig();
    L = {
      t: 0, active: Object.assign({}, c, { crashed: 0, dbDown: false }),
      pending: [], log: [], users: [], lat: [], orders: 0, possible: 0, cost: 0,
      peakLat: 0, peakErr: 0, complaints: 0, flags: { startConfig: c, loadTests, upgradedDb: false, crashOutage: false, maxServers: c.servers }
    };
    el('liveLog').innerHTML = '';
    showStage('live');
    el('simulation').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    logLive('🟢 Live at 11:55 with ' + c.servers + ' server' + (c.servers > 1 ? 's' : '') + (c.auto ? ' + auto-scaling' : '') + (c.cdn ? ', a CDN' : '') + (c.cache !== 'off' ? ', a ' + CACHE_NAMES[c.cache] + ' cache' : '') + ' and a ' + c.db + ' database' + (c.replicas ? ' with ' + c.replicas + ' replica' + (c.replicas > 1 ? 's' : '') : '') + '.', 'info');
    tick(true);
    startTimer();
  }

  function startTimer() { stopTimer(); timer = setInterval(() => tick(), reduceMotion ? 250 : speed); }
  function stopTimer() { if (timer) clearInterval(timer); timer = null; }

  el('lPause').addEventListener('click', () => {
    if (timer) { stopTimer(); el('lPause').textContent = '▶ Resume'; }
    else if (mode === 'live') { startTimer(); el('lPause').textContent = '⏸ Pause'; }
  });
  el('lFast').addEventListener('click', () => {
    speed = speed === 450 ? 150 : 450;
    el('lFast').textContent = speed === 150 ? '🐢 Normal speed' : '⏩ Faster';
    if (timer) startTimer();
  });

  // A change during the live hour takes time to arrive — just like real infrastructure.
  // Each kind of change has one slot in the queue; a newer request replaces an older one.
  function queue(kind, wait, label, fn, n) {
    if (L.pending.some(p => p.kind === kind && p.label === label)) return;   // same request already on its way
    L.pending = L.pending.filter(p => p.kind !== kind);
    L.pending.push({ kind, at: L.t + wait, label, fn, n: n || 0 });
    logLive('⏳ ' + label + ' — ready at ' + fmtClock(L.t + wait) + '.', 'info');
  }
  const bootingServers = () => L.pending.filter(p => p.kind === 'server' || p.kind.startsWith('auto')).reduce((s, p) => s + p.n, 0);

  function applyLiveChange() {
    const want = readConfig(), a = L.active;
    a.auto = want.auto;
    if (!a.auto) {
      const booting = L.pending.filter(p => p.kind.startsWith('auto')).reduce((s, p) => s + p.n, 0);
      if (want.servers > a.servers + booting) {
        const n = want.servers - a.servers - booting;
        queue('server', SIM.delays.server, 'Starting ' + n + ' new server' + (n > 1 ? 's' : ''), () => { a.servers = Math.min(SIM.maxServers, a.servers + n); }, n);
      } else if (want.servers < a.servers) {
        L.pending = L.pending.filter(p => p.kind !== 'server');
        a.servers = Math.max(1, want.servers);
        logLive('➖ Servers reduced to ' + a.servers + '.', 'info');
      }
    }
    if (want.cdn !== a.cdn) {
      if (want.cdn) queue('cdn', SIM.delays.cdn, 'Turning on the CDN', () => { a.cdn = true; });
      else { L.pending = L.pending.filter(p => p.kind !== 'cdn'); a.cdn = false; logLive('🌍 CDN switched off. All images now come from your app servers.', 'bad'); }
    } else L.pending = L.pending.filter(p => p.kind !== 'cdn');
    if (want.cache !== a.cache) {
      queue('cache', want.cache === 'off' ? 0 : SIM.delays.cache, want.cache === 'off' ? 'Switching the cache off' : 'Setting the cache to ' + CACHE_NAMES[want.cache], () => { a.cache = want.cache; });
    } else L.pending = L.pending.filter(p => p.kind !== 'cache');
    if (want.db !== a.db && !a.dbDown) {
      a.dbDown = true;
      L.flags.upgradedDb = true;
      logLive('🗄️ Changing the database size: it must restart — <strong>2 minutes of downtime</strong> during the rush!', 'bad');
      L.pending.push({ kind: 'db', at: L.t + SIM.delays.dbUpgrade, label: 'Database restart', n: 0, fn: () => { a.db = inputs.db.value; a.dbDown = false; } });
    }
    if (want.replicas > a.replicas) {
      const n = want.replicas - a.replicas;
      queue('replica', SIM.delays.replica, 'Copying data to ' + n + ' new replica' + (n > 1 ? 's' : ''), () => { a.replicas = want.replicas; });
    } else {
      L.pending = L.pending.filter(p => p.kind !== 'replica');
      if (want.replicas < a.replicas) { a.replicas = want.replicas; logLive('📚 Replicas reduced to ' + a.replicas + '.', 'info'); }
    }
    renderSetup();
  }

  function logLive(text, tone) {
    const li = document.createElement('li');
    li.className = 'log-' + (tone || 'info');
    li.innerHTML = '<span class="log-time">' + fmtClock(L.t) + '</span> ' + text;
    el('liveLog').prepend(li);
  }

  function tick(first) {
    if (!first) L.t++;
    const a = L.active;

    // Things that were set in motion arrive now
    L.pending.filter(p => p.at <= L.t).forEach(p => { p.fn(); logLive('✅ ' + p.label + ' — done.', 'good'); });
    L.pending = L.pending.filter(p => p.at > L.t);

    // Scripted events
    if (L.t === 5) logLive('📱 12:00 — The promo SMS goes out to 2 million people. Traffic is climbing fast!', 'bad');
    if (L.t === 15) logLive('🤳 12:10 — A food influencer with 1M followers posts about the promo. Even more people arrive.', 'bad');
    if (L.t === 20) logLive('🍛 12:15 — Mama Put Express sells out of jollof rice.', 'info');
    if (L.t === 23) {
      a.crashed = 1;
      L.crashUntil = L.t + (a.auto ? SIM.delays.auto : 5);
      if (a.servers === 1) { L.flags.crashOutage = true; logLive('💥 12:18 — Your only app server crashed. <strong>The whole app is down</strong> until it restarts.', 'bad'); }
      else logLive('💥 12:18 — One app server crashed. The load balancer sends its customers to the other ' + (a.servers - 1) + '.' + (a.auto ? ' Auto-scaling replaces it in 2 minutes.' : ' It will restart in 5 minutes.'), 'bad');
    }
    if (L.crashUntil && L.t >= L.crashUntil) { a.crashed = 0; L.crashUntil = null; logLive('🔧 The crashed server is back.', 'good'); }
    if (L.t === 35) {
      L.flags.cacheAt30 = a.cache;
      const stale = { off: 0, '10s': 0, '5m': 14, '1h': 180 }[a.cache];
      L.complaints += stale;
      if (a.cache === '1h') logLive('🍲 12:30 — Because the cache keeps menus for 1 hour, jollof still shows as available. <strong>180 customers ordered food that doesn\'t exist</strong> — refunds and angry reviews.', 'bad');
      else if (a.cache === '5m') logLive('🍲 12:30 — Jollof showed as available for a few minutes after selling out: 14 orders had to be cancelled. A fair trade-off.', 'info');
      else if (a.cache === '10s') logLive('🍲 12:30 — The menu updated within seconds after jollof sold out. No problems.', 'good');
    }

    // Auto-scaling: look at the load and adjust, with a start-up delay
    const users = usersAt(L.t);
    let r = evaluate(users, a);
    if (a.auto) {
      const booting = bootingServers();
      const demand = (a.cdn ? r.rps * 0.4 : r.rps);
      const want = Math.min(SIM.maxServers, Math.max(2, Math.ceil(demand / (SIM.serverCap * 0.65))));
      if (want > a.servers + booting) {
        const n = want - a.servers - booting;
        L.pending.push({ at: L.t + SIM.delays.auto, label: 'Auto-scaling: ' + n + ' more server' + (n > 1 ? 's' : ''), kind: 'auto' + L.t, n, fn: () => { a.servers = Math.min(SIM.maxServers, a.servers + n); } });
      } else if (want < a.servers - 1 && !booting) {
        a.servers--;
      }
      inputs.servers.value = a.servers;
    }
    L.flags.maxServers = Math.max(L.flags.maxServers, a.servers);
    r = evaluate(users, a);

    // Results for this minute
    const possible = users * SIM.ordersPerUser;
    const patience = r.latency > 3 ? 0.6 : r.latency > 2 ? 0.85 : 1;
    L.possible += possible;
    L.orders += possible * (1 - r.err) * patience;
    L.cost += costPerHour(a) / 60;
    L.peakLat = Math.max(L.peakLat, r.latency);
    L.peakErr = Math.max(L.peakErr, r.err);
    L.users.push(users);
    L.lat.push(r.latency);
    L.last = { users, r };
    if (r.err > 0.05 && r.bottleneck === 'app' && !a.dbDown) L.flags.appOverloaded = true;
    if (r.err > 0.05 && !L.warned) {
      L.warned = true;
      logLive('🔥 Requests are failing (' + Math.round(r.err * 100) + '%). ' + (a.dbDown ? 'The database is restarting.' : 'The ' + (r.bottleneck === 'app' ? 'app servers' : 'database') + ' can\'t keep up.'), 'bad');
    }
    if (r.err < 0.01 && L.warned) { L.warned = false; logLive('✅ The system has caught up. No more failing requests.', 'good'); }

    renderLive();
    renderSetup();
    if (L.t >= SIM.end) finish();
  }

  function setBar(bar, txt, load, down) {
    const pct = load === Infinity ? 100 : Math.round(load * 100);
    bar.style.width = Math.min(100, pct) + '%';
    bar.className = 'load-fill' + (down || pct > 100 ? ' over' : pct > 70 ? ' busy' : '');
    txt.textContent = down ? 'DOWN' : (load === Infinity ? '—' : pct + '%');
  }

  function renderLive() {
    const a = L.active, { users, r } = L.last;
    el('lClock').textContent = fmtClock(L.t);
    el('lUsers').textContent = users.toLocaleString();
    el('lLatency').textContent = r.latency >= 15 ? 'down' : r.latency.toFixed(1) + 's';
    el('lLatency').className = r.latency > 3 ? 'bad-text' : r.latency > 2 ? 'warn-text' : 'good-text';
    el('lErr').textContent = Math.round(r.err * 100) + '%';
    el('lErr').className = r.err > 0.05 ? 'bad-text' : r.err > 0 ? 'warn-text' : 'good-text';
    el('lOrders').textContent = Math.round(L.orders).toLocaleString();

    el('aUsers').textContent = users.toLocaleString() + ' online';
    el('aCdnNode').classList.toggle('off', !a.cdn);
    el('aCdn').textContent = a.cdn ? 'serving images' : 'off';
    el('aCacheNode').classList.toggle('off', a.cache === 'off');
    el('aCache').textContent = a.cache === 'off' ? 'off' : 'keeps ' + CACHE_NAMES[a.cache];
    el('aDbSub').textContent = a.db + ', ' + a.replicas + ' replica' + (a.replicas === 1 ? '' : 's');
    setBar(el('aAppBar'), el('aAppTxt'), r.appLoad, false);
    setBar(el('aDbBar'), el('aDbTxt'), r.dbLoad, a.dbDown);

    const booting = bootingServers();
    const tone = r.appLoad > 1 ? 'over' : r.appLoad > 0.7 ? 'busy' : 'ok';
    el('srvGrid').innerHTML = Array.from({ length: a.servers }, (_, i) => '<span class="srv ' + (i < (a.crashed || 0) ? 'crashed' : tone) + '"></span>').join('') +
      Array.from({ length: booting }, () => '<span class="srv booting"></span>').join('');

    const bars = (vals, max, cls) => vals.slice(-65).map(v => '<span class="bar ' + cls(v) + '" style="height:' + Math.max(3, Math.min(100, v / max * 100)) + '%"></span>').join('');
    el('cUsers').innerHTML = bars(L.users, 65000, () => 'bar-users');
    el('cLatency').innerHTML = bars(L.lat, 8, v => v > 3 ? 'bar-bad' : v > 2 ? 'bar-warn' : 'bar-ok');

    // Plain-English explanation of the moment
    let title, text, toneBox;
    if (a.dbDown) { title = '🗄️ The database is restarting'; text = 'Changing its size means a restart — nothing works for 2 minutes. That\'s why you upgrade <strong>before</strong> a big event, not during it.'; toneBox = 'bad'; }
    else if (r.err > 0.02) {
      const isApp = r.bottleneck === 'app';
      title = '🔥 ' + (isApp ? 'App servers' : 'Database') + ' overloaded — ' + Math.round(r.err * 100) + '% of requests failing';
      text = isApp
        ? 'They are at ' + Math.round(r.appLoad * 100) + '%. Add servers (they take a few minutes to start)' + (a.cdn ? '' : ', or turn on the CDN so images stop going through them') + (a.auto ? '. Auto-scaling is adding servers — but it needs time to catch up with a sudden spike.' : '.')
        : 'It is at ' + Math.round(r.dbLoad * 100) + '%. ' + (a.cache === 'off' ? 'A cache would stop most repeat reads.' : '') + (a.replicas === 0 ? ' Read replicas would share the reading.' : '') + ' More app servers will <strong>not</strong> help — they\'d only send it more work.';
      toneBox = 'bad';
    } else if (r.latency > 2) { title = '🐢 Slow, but working'; text = 'Pages take ' + r.latency.toFixed(1) + 's. Above 3 seconds, many customers give up.' + (a.cdn ? '' : ' A CDN would make images load faster.'); toneBox = 'warn'; }
    else if (L.t < 5) { title = '😌 Calm before the storm'; text = 'Only ' + users.toLocaleString() + ' people online. The promo SMS goes out at 12:00. Last chance to make changes that are ready in time!'; toneBox = 'calm'; }
    else { title = '✅ Coping well'; text = 'Busiest part: ' + (r.bottleneck === 'app' ? 'app servers' : 'database') + ' at ' + Math.round(Math.max(r.appLoad, r.dbLoad) * 100) + '%. Pages load in ' + r.latency.toFixed(1) + 's.'; toneBox = 'good'; }
    el('liveExplain').className = 'explain-box tone-' + toneBox;
    el('liveExplain').innerHTML = '<h3>' + title + '</h3><p>' + text + '</p>';
  }

  function finish() {
    stopTimer();
    el('lPause').textContent = '⏸ Pause';
    const lost = Math.max(0, L.possible - L.orders);
    const lostPct = lost / L.possible;
    const f = L.flags, s = f.startConfig;
    const good = [], bad = [];
    if (s.cdn) good.push('The CDN took image traffic off your servers and made pages faster.');
    else bad.push('No CDN from the start: every food photo went through your app servers. A CDN takes about 60% of the load off.');
    const cache = f.cacheAt30 || s.cache;
    if (cache === '5m') good.push('A 5-minute cache saved the database most of its reading, without serious stale data.');
    if (cache === 'off') bad.push('No cache: the database answered the same menu questions thousands of times.');
    if (cache === '1h') bad.push('A 1-hour cache was too long: customers ordered food that was sold out.');
    if (cache === '10s') good.push('A 10-second cache kept menus fresh. (5 minutes would save more database work with little risk.)');
    if (s.auto && L.peakErr > 0.02) bad.push('Auto-scaling started from only ' + s.servers + ' server' + (s.servers > 1 ? 's' : '') + '. The spike arrived faster than new servers could start. For a planned event, start with extra servers and let auto-scaling handle the rest.');
    else if (s.auto) good.push('Auto-scaling added servers as traffic grew, and removed them when it calmed down.');
    else if (f.maxServers >= 15 && L.peakErr < 0.02) bad.push('You ran ' + f.maxServers + ' servers all hour — safe, but expensive when traffic is low. Auto-scaling would cut the bill.');
    else if (f.appOverloaded) bad.push('A fixed number of servers couldn\'t handle the peak. Add more before the event, or use auto-scaling.');
    if (f.crashOutage) bad.push('With only one server, one crash took the whole app down. Always have at least two.');
    else good.push('When a server crashed, the others carried on — no single point of failure.');
    if (f.upgradedDb) bad.push('Changing the database size during the rush caused 2 minutes of downtime. Do it beforehand.');
    if (f.loadTests) good.push('You ran ' + f.loadTests + ' load test' + (f.loadTests > 1 ? 's' : '') + ' before going live — exactly what Shopify does before Black Friday.');
    else bad.push('You went live without a load test. It would have shown the bottleneck before customers did.');

    const grade = lostPct < 0.03 && L.peakLat < 2.5 && L.complaints < 50 ? ['win', '🏆 Promo survived! Fast, reliable and ready.']
      : lostPct < 0.15 ? ['meh', '😅 You survived — with some pain along the way.']
      : ['lose', '🔥 The promo melted the app. Customers left for other apps.'];
    el('endBanner').className = 'end-banner ' + grade[0];
    el('endBanner').innerHTML = '<strong>' + grade[1] + '</strong>';
    const stat = (label, value, tone) => '<div class="end-stat ' + tone + '"><span>' + label + '</span><strong>' + value + '</strong></div>';
    el('endStats').innerHTML =
      stat('🛵 Orders completed', Math.round(L.orders).toLocaleString() + ' / ' + Math.round(L.possible).toLocaleString(), lostPct < 0.03 ? 'good' : lostPct < 0.15 ? 'warn' : 'bad') +
      stat('💸 Sales lost', naira(lost * SIM.avgOrder), lostPct < 0.03 ? 'good' : lostPct < 0.15 ? 'warn' : 'bad') +
      stat('⏱️ Slowest page load', L.peakLat >= 15 ? 'down' : L.peakLat.toFixed(1) + 's', L.peakLat < 2 ? 'good' : L.peakLat < 3 ? 'warn' : 'bad') +
      stat('❌ Worst failure rate', Math.round(L.peakErr * 100) + '%', L.peakErr < 0.02 ? 'good' : L.peakErr < 0.15 ? 'warn' : 'bad') +
      stat('😡 Stale-menu complaints', L.complaints, L.complaints < 20 ? 'good' : L.complaints < 100 ? 'warn' : 'bad') +
      stat('💰 Cost of the hour', naira(L.cost), L.cost < 300000 ? 'good' : L.cost < 500000 ? 'warn' : 'bad');
    el('endGood').innerHTML = (good.length ? good : ['You got through the hour.']).map(x => '<li>' + x + '</li>').join('');
    el('endBad').innerHTML = (bad.length ? bad : ['Nothing major — a great setup!']).map(x => '<li>' + x + '</li>').join('');
    writeConfig(s);
    showStage('end');
    el('simulation').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  el('tryAgain').addEventListener('click', () => {
    showStage('prep');
    el('loadTestResult').hidden = true;
    renderSetup();
    el('simulation').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  });

  renderSetup();
}

/* ---------------- Quiz ---------------- */
const QUIZ = [
  { q: 'What does "scaling out" (horizontal scaling) mean?',
    options: ['Buying one bigger computer', 'Adding more computers that share the work', 'Deleting old data', 'Making the app smaller'], answer: 1,
    why: 'More cooks with their own stoves, instead of one bigger stove.' },
  { q: 'What does a load balancer do?',
    options: ['Stores passwords', 'Spreads incoming requests across several servers', 'Makes images smaller', 'Writes the code'], answer: 1,
    why: 'Like the host at a restaurant door, seating each guest with a free waiter.' },
  { q: 'What can go wrong if a cache keeps menu data for too long?',
    options: ['Nothing', 'Customers see old information, like sold-out food still for sale', 'The app gets faster', 'The database crashes immediately'], answer: 1,
    why: 'Long TTL = less work but stale data. Choose based on how often it changes.' },
  { q: 'How does a CDN help?',
    options: ['It serves images and files from servers close to the customer', 'It stores passwords safely', 'It writes new orders', 'It replaces the database'], answer: 0,
    why: 'Shorter distance = faster pages, and less work for your own servers.' },
  { q: 'People read the menu 20× more than they order. The database is overloaded. What\'s a good first step?',
    options: ['Delete old orders', 'Add a cache and/or read replicas', 'Turn off ordering', 'Buy more phones'], answer: 1,
    why: 'Most of the work is reading, so make reading cheaper.' },
  { q: 'What is a bottleneck?',
    options: ['A type of database', 'The part that hits its limit first and slows everything down', 'A security bug', 'A design file'], answer: 1,
    why: 'Fix the narrowest part — adding capacity elsewhere won\'t help.' },
  { q: 'You know a huge sale is coming next month. What should you do?',
    options: ['Wait and see', 'Run load tests and plan capacity before the sale', 'Upgrade the database during the sale', 'Turn off the CDN'], answer: 1,
    why: 'Find the bottleneck before customers do, and make changes before the rush.' }
];

function initQuiz() {
  // Rendering, saved answers and scoring live in ../access.js
  TPMQuiz.render(QUIZ, { low: "Good start. Run the promo simulation again, then retry." });
}

/* ---------------- Capstone checklist ---------------- */
function initChecklist() {
  const boxes = document.querySelectorAll('#capstoneChecklist input[type="checkbox"]');
  const fill = document.getElementById('checkFill');
  const text = document.getElementById('checkText');

  function update() {
    const done = Array.from(boxes).filter(b => b.checked).length;
    fill.style.width = (done / boxes.length * 100) + '%';
    text.textContent = done === boxes.length ? 'All done! 🎉 Ready for Sunday\'s review.' : done + ' of ' + boxes.length + ' done';
  }

  boxes.forEach(b => {
    b.checked = store.get('w8_' + b.dataset.key, '0') === '1';
    b.addEventListener('change', () => { store.set('w8_' + b.dataset.key, b.checked ? '1' : '0'); update(); });
  });
  update();
}

/* ---------------- Copy template ---------------- */
function initCopyTemplate() {
  const btn = document.getElementById('copyTemplateBtn');
  const area = document.getElementById('templateText');
  btn.addEventListener('click', async () => {
    const original = btn.textContent;
    try {
      await navigator.clipboard.writeText(area.value.trim());
    } catch (e) {
      area.select();
      document.execCommand('copy');
    }
    btn.textContent = '✅ Copied!';
    setTimeout(() => { btn.textContent = original; }, 2000);
  });
}

/* ---------------- Word bank ---------------- */
const GLOSSARY = [
  ['Scalability', 'Whether a system keeps working well as more people use it.'],
  ['Performance', 'How fast the app feels for each person.'],
  ['Latency', 'How long you wait for an answer. Lower is better.'],
  ['P95', '"For 95% of users". "Loads in 2s at P95" means 95 out of 100 people wait 2 seconds or less.'],
  ['Requests per second (RPS)', 'How many requests arrive every second — a common way to measure traffic.'],
  ['Scale up (vertical)', 'Making one computer bigger and stronger.'],
  ['Scale out (horizontal)', 'Adding more computers to share the work.'],
  ['Server', 'A computer that runs part of the app and answers requests.'],
  ['Load balancer', 'Spreads incoming requests across several servers.'],
  ['Auto-scaling', 'Automatically adding servers when it\'s busy and removing them when it\'s quiet.'],
  ['Stateless', 'Servers don\'t keep anything important only in their own memory, so any server can serve anyone.'],
  ['Cache', 'Fast memory holding ready-made answers so the same work isn\'t repeated.'],
  ['Cache hit / miss', 'Hit: the answer was ready in the cache. Miss: it wasn\'t, so it had to be fetched.'],
  ['TTL (Time To Live)', 'How long a cached copy is kept before it must be refreshed.'],
  ['Stale data', 'Information that is out of date because an old copy was used.'],
  ['CDN', 'Servers in many cities holding copies of images and files close to users.'],
  ['Read replica', 'A copy of the database used only for reading, to share the load.'],
  ['Sharding', 'Splitting data across several databases, e.g. by customer name or region.'],
  ['Bottleneck', 'The part that hits its limit first and slows everything else.'],
  ['Load test', 'Sending lots of pretend traffic to find the breaking point safely.'],
  ['Capacity planning', 'Working out in advance how much computing power you\'ll need.'],
  ['Throughput', 'How much work a system completes per second.'],
  ['Downtime', 'Time when the service isn\'t working.'],
  ['Waiting room', 'A queue page that lets people in gradually during extreme demand.'],
  ['Graceful degradation', 'When overloaded, keep the most important things working and switch off the rest.'],
  ['Fan-out', 'Copying one thing (like a post) to many places (like followers\' timelines).'],
  ['Code freeze', 'A period before a big event when risky changes are not allowed.']
];

function initGlossary() {
  const grid = document.getElementById('glossaryGrid');
  const input = document.getElementById('glossarySearch');
  const empty = document.getElementById('glossaryEmpty');

  GLOSSARY.forEach(([term, def]) => {
    const card = document.createElement('div');
    card.className = 'glossary-card';
    card.dataset.search = (term + ' ' + def).toLowerCase();
    card.innerHTML = '<h4></h4><p></p>';
    card.querySelector('h4').textContent = term;
    card.querySelector('p').textContent = def;
    grid.appendChild(card);
  });

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    let shown = 0;
    grid.querySelectorAll('.glossary-card').forEach(c => {
      const match = !q || c.dataset.search.includes(q);
      c.hidden = !match;
      if (match) shown++;
    });
    empty.hidden = shown > 0;
  });
}

/* ---------------- Scroll spy + reading progress ---------------- */
function initScrollSpy() {
  const links = document.querySelectorAll('.sub-link');
  const sections = Array.from(links).map(l => document.querySelector(l.getAttribute('href'))).filter(Boolean);
  const bar = document.getElementById('readProgress');

  function onScroll() {
    const y = window.scrollY + 160;
    let current = sections[0];
    sections.forEach(s => { if (s.offsetTop <= y) current = s; });
    links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + current.id));

    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
