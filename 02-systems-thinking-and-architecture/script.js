/* Week 02: Systems Thinking and Architecture
   Interactive pieces: theme, tabs, two choice games, the ChopNow architecture
   simulator, ERD explorer, quiz, capstone checklist, template copy, word bank,
   scroll spy. */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initChoiceGame(FRESH_GAME);
  initChoiceGame(ARCH_GAME);
  initSimulator();
  initErdExplorer();
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

/* ---------------- Choice games (same engine for both) ---------------- */
const FRESH_GAME = {
  id: 'fresh',
  names: { exact: 'Must be exact', old: 'A little old is fine' },
  items: [
    { task: 'Your bank balance, just before you send ₦50,000 to a friend.', answer: 'exact',
      why: 'If the balance is old, you might send money you don\'t have. With money, being wrong is very costly.' },
    { task: 'The number of likes on a friend\'s Instagram post.', answer: 'old',
      why: 'If it says 1,203 likes instead of 1,207, nobody is harmed. Showing something is better than showing an error.' },
    { task: 'Seats left on a flight while you are paying for your ticket.', answer: 'exact',
      why: 'If two people buy the "last" seat, the airline has a big problem. Booking must be exact.' },
    { task: 'The view count on a YouTube video.', answer: 'old',
      why: 'YouTube shows a slightly delayed number all the time. It is fine — speed matters more here.' },
    { task: '"Only 1 left in stock" on a shopping app, at the moment you pay.', answer: 'exact',
      why: 'Selling an item you don\'t have leads to refunds and angry customers. Check the real stock before taking payment.' },
    { task: 'Your friend\'s profile picture.', answer: 'old',
      why: 'If you see the old picture for a few minutes, nothing bad happens.' },
    { task: 'Trending topics on X (Twitter).', answer: 'old',
      why: 'Trends change all the time anyway. A list from a minute ago is perfectly fine.' },
    { task: 'Your wallet balance in a fintech app like OPay or PalmPay.', answer: 'exact',
      why: 'Money again. A wrong balance can cause double spending and loss of trust.' }
  ],
  done: pct => pct >= 0.8 ? 'Excellent! You can already think about trade-offs like a TPM. 🎉'
    : pct >= 0.5 ? 'Good work! The trick: ask "what is the cost of being wrong?"'
    : 'Keep going — when money or limited items are involved, it usually must be exact.'
};

const ARCH_GAME = {
  id: 'arch',
  names: { mono: 'Monolith', micro: 'Microservices', event: 'Use a queue' },
  items: [
    { task: 'You and 2 friends are building the first version of a school-fees payment app. You want to launch in 6 weeks.', answer: 'mono',
      why: 'Small team, need for speed, no users yet. A monolith is simplest and fastest. You can split it later.' },
    { task: 'Your company has 40 engineers in 6 teams. Every time one team releases, it breaks another team\'s work.', answer: 'micro',
      why: 'When many teams share one big app, they get in each other\'s way. Separate services let each team release on its own.' },
    { task: 'After someone pays, the app must send a receipt by email. The email company is sometimes slow.', answer: 'event',
      why: 'The customer shouldn\'t wait for the email. Drop "send receipt" in a queue and confirm the order straight away.' },
    { task: 'In your app, processing uploaded videos needs 20× more computer power than everything else — mostly on weekends.', answer: 'micro',
      why: 'Split video processing into its own service, so you can add power to just that part on weekends instead of copying the whole app.' },
    { task: 'Every night, your app must create 2 million monthly bank statements. They don\'t need to be ready instantly.', answer: 'event',
      why: 'Put each statement job in a queue and let workers process them steadily. Nobody is waiting for an instant answer.' },
    { task: 'You are testing a new idea with 200 users and you\'re not sure people will even want it.', answer: 'mono',
      why: 'Don\'t build a complex system for an idea that might change next month. Keep it simple until you learn more.' }
  ],
  done: pct => pct >= 0.8 ? 'Brilliant! You are thinking about the business, not just the technology. 🎉'
    : pct >= 0.5 ? 'Nice! Remember: small and new → monolith; big and busy parts → microservices; "can happen later" → queue.'
    : 'Read the 3 cards in Part 2 again, then play once more.'
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

/* ---------------- ChopNow simulator ----------------
   One tick = one simulated minute (1 real second).
   Every customer makes 3 menu requests, then 1 order, 1 payment, 1 message.
   A monolith copy handles 120 requests/min of any kind; a microservice server
   handles 60/min of its own kind. */
const SERVICES = [
  { key: 'menu', icon: '📖', name: 'Menu', sub: 'Browse food', per: 3 },
  { key: 'orders', icon: '🧾', name: 'Orders', sub: 'Place the order', per: 1 },
  { key: 'pay', icon: '💳', name: 'Payments', sub: 'Charge the card', per: 1 },
  { key: 'msg', icon: '💬', name: 'Messages', sub: '"Order confirmed" SMS', per: 1 }
];
const SIM = {
  monoCap: 120, monoCost: 100000,
  microCap: 60, microCost: 50000, microExtra: 80000,
  monoBase: 0.8, microBase: 1.1,
  maxServers: 12
};
const DEFAULT_SERVERS = { mono: 3, menu: 2, orders: 1, pay: 1, msg: 1 };

const MISSIONS = [
  { id: 'm1', title: 'One bug, whole app down',
    task: 'In <strong>Monolith</strong> mode, press 💥 on <strong>Payments</strong>. Watch what happens to the Menu — a part that has nothing to do with payments.',
    learn: 'In a monolith everything runs as one program, so one broken part can stop everything.',
    setup: { arch: 'mono', traffic: 20 } },
  { id: 'm2', title: 'Contain the damage',
    task: 'Now switch to <strong>Microservices</strong> and break <strong>Payments</strong> again. Can people still browse the menu?',
    learn: 'With separate services, a failure stays inside one part. Browsing still works — only paying fails.',
    setup: { arch: 'micro', traffic: 20 } },
  { id: 'm3', title: 'Survive Friday night',
    task: 'It\'s Friday 8 PM and traffic is <strong>80 customers a minute</strong>. Add servers until <strong>happy customers stay at 90% or more for 5 minutes</strong>. Hint: Menu gets 3 requests from every customer.',
    learn: 'With microservices you add power only to the busy part. A TPM knows which part will be busiest.',
    setup: { arch: 'micro', traffic: 80 } },
  { id: 'm4', title: 'Let the messages wait',
    task: 'The SMS company is down, so <strong>Messages is broken</strong> and orders are failing. Turn the <strong>queue ON</strong> to save the orders. Then <strong>fix Messages</strong> and watch the queue empty.',
    learn: 'A queue lets work that can happen later wait safely, so one slow or broken part doesn\'t block customers.',
    setup: { arch: 'micro', traffic: 30, servers: { menu: 3, orders: 1, pay: 1, msg: 2 }, broken: ['msg'] } }
];

function initSimulator() {
  const el = id => document.getElementById(id);
  const stage = el('simStage'), system = el('simSystem'), row = el('svcRow'),
        dotLayer = el('dotLayer'), slider = el('trafficSlider'), queueBtn = el('queueToggle'),
        pauseBtn = el('simPause'), logEl = el('simLog');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmtNaira = n => '₦' + Math.round(n).toLocaleString('en-NG');

  let state, timer = null, prevAlerts = {};
  const missionDone = JSON.parse(store.get('w2_missions', '{}'));
  const missionTrack = { m3Streak: 0, m4Peak: 0, m4Fixed: false, crashTicks: 0 };

  /* ---- Build service cards ---- */
  const cards = {};
  SERVICES.forEach(s => {
    if (s.key === 'msg') row.appendChild(buildQueueCard());
    const card = document.createElement('div');
    card.className = 'svc';
    card.dataset.svc = s.key;
    card.innerHTML =
      '<div class="svc-top"><span class="svc-icon">' + s.icon + '</span><span class="svc-name">' + s.name + '</span></div>' +
      '<div class="svc-sub">' + s.sub + '</div>' +
      '<div class="load-bar micro-only"><div class="load-fill"></div><span class="load-text">0%</span></div>' +
      '<div class="server-ctl micro-only" data-target="' + s.key + '">' +
        '<span>Servers:</span><button class="srv-btn" data-delta="-1" aria-label="Remove a ' + s.name + ' server">−</button>' +
        '<strong class="srv-count">1</strong><button class="srv-btn" data-delta="1" aria-label="Add a ' + s.name + ' server">+</button>' +
      '</div>' +
      '<button class="break-toggle" data-svc="' + s.key + '">💥 Break</button>';
    row.appendChild(card);
    cards[s.key] = card;
  });

  function buildQueueCard() {
    const q = document.createElement('div');
    q.className = 'svc queue-card';
    q.id = 'queueCard';
    q.innerHTML = '<div class="svc-top"><span class="svc-icon">📬</span><span class="svc-name">Queue</span></div>' +
      '<div class="svc-sub">Messages waiting</div><div class="queue-count" id="queueCount">0</div>';
    return q;
  }

  /* ---- State ---- */
  function freshState() {
    return {
      arch: 'mono', traffic: 20, queue: false, paused: false,
      servers: Object.assign({}, DEFAULT_SERVERS),
      broken: {}, queueLen: 0, minute: 0,
      served: 0, failed: 0, happyAvg: 1, lastWait: 0, lastLoads: {}, lastHappy: 1, lastLostPct: 0
    };
  }

  /* ---- One tick of the model ---- */
  function computeTick() {
    const arrivals = state.traffic * (0.9 + Math.random() * 0.2);
    const anyBroken = SERVICES.some(s => state.broken[s.key]);
    const loads = {};
    let pass = {}; // fraction of customers that get through each step
    let flow = arrivals, wait;

    if (state.arch === 'mono') {
      const demand = SERVICES.reduce((sum, s) => sum + arrivals * s.per, 0);
      const cap = state.servers.mono * SIM.monoCap;
      const load = demand / cap;
      const ok = anyBroken ? 0 : Math.min(1, 1 / load);
      loads.mono = anyBroken ? 0 : load;
      SERVICES.forEach((s, i) => { pass[s.key] = i === 0 ? ok : 1; });
      flow = arrivals * ok;
      wait = SIM.monoBase + delay(load);
    } else {
      wait = SIM.microBase;
      SERVICES.forEach(s => {
        if (s.key === 'msg' && state.queue) { pass.msg = 1; return; }
        const demand = flow * s.per;
        const cap = state.servers[s.key] * SIM.microCap;
        const load = demand / cap;
        loads[s.key] = state.broken[s.key] ? 0 : load;
        pass[s.key] = state.broken[s.key] ? 0 : Math.min(1, 1 / load);
        if (!state.broken[s.key]) wait += delay(load);
        flow *= pass[s.key];
      });
    }

    // Long waits make some customers give up
    const giveUp = wait > 6 ? Math.min(0.6, (wait - 6) * 0.08) : 0;
    const served = flow * (1 - giveUp);

    // Queue: confirmations wait here and are sent as Messages has capacity
    let sentFromQueue = 0;
    if (state.arch === 'micro' && state.queue) {
      state.queueLen += served;
      const cap = state.servers.msg * SIM.microCap;
      loads.msg = state.broken.msg ? 0 : served / cap;
      sentFromQueue = state.broken.msg ? 0 : Math.min(state.queueLen, cap);
      state.queueLen -= sentFromQueue;
    }

    const satisfied = wait <= 2.5 ? 1 : Math.max(0, 1 - (wait - 2.5) / 5);
    const happy = arrivals > 0 ? (served * satisfied) / arrivals : 1;

    state.minute++;
    state.served += served;
    state.failed += arrivals - served;
    state.lastWait = flow > 0.01 ? wait : 0;
    state.lastLoads = loads;
    state.lastHappy = happy;
    state.lastLostPct = arrivals > 0 ? 1 - served / arrivals : 0;
    state.happyAvg = state.happyAvg * 0.7 + happy * 0.3;
    return { arrivals, pass, giveUp, sentFromQueue };
  }

  // Extra seconds of waiting as a part gets busy
  function delay(load) {
    if (load <= 0.7) return 0;
    if (load <= 1) return (load - 0.7) / 0.3 * 2.5;
    return Math.min(12, 2.5 + (load - 1) * 6);
  }

  /* ---- Rendering ---- */
  function setBar(fill, text, load, broken) {
    const pct = Math.round(load * 100);
    fill.style.width = Math.min(100, pct) + '%';
    fill.className = 'load-fill' + (broken ? '' : pct > 100 ? ' over' : pct > 70 ? ' busy' : '');
    text.textContent = broken ? 'DOWN' : pct + '%';
  }

  function render() {
    const mono = state.arch === 'mono';
    system.classList.toggle('mode-mono', mono);
    system.classList.toggle('mode-micro', !mono);
    document.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b.dataset.arch === state.arch));

    slider.value = state.traffic;
    el('trafficValue').textContent = state.traffic;
    el('trafficMood').textContent = trafficMood(state.traffic);
    el('customersSub').textContent = state.traffic + ' / min';

    queueBtn.disabled = mono;
    queueBtn.title = mono ? 'Switch to Microservices to use a queue' : '';
    queueBtn.classList.toggle('active', state.queue && !mono);
    queueBtn.setAttribute('aria-pressed', String(state.queue));
    queueBtn.textContent = '📬 Queue: ' + (state.queue ? 'ON' : 'OFF') + (mono ? ' (microservices only)' : '');
    el('queueCard').hidden = mono || !state.queue;
    el('queueCount').textContent = Math.round(state.queueLen);

    // Monolith box
    const anyBroken = SERVICES.some(s => state.broken[s.key]);
    document.querySelector('.server-ctl[data-target="mono"] .srv-count').textContent = state.servers.mono;
    setBar(el('monoLoad'), el('monoLoadText'), state.lastLoads.mono || 0, anyBroken);
    system.classList.toggle('mono-down', mono && anyBroken);

    SERVICES.forEach(s => {
      const card = cards[s.key];
      const broken = !!state.broken[s.key];
      card.classList.toggle('is-broken', broken);
      card.classList.toggle('is-down', mono && anyBroken && !broken);
      card.querySelector('.srv-count').textContent = state.servers[s.key];
      setBar(card.querySelector('.load-fill'), card.querySelector('.load-text'), state.lastLoads[s.key] || 0, broken);
      const t = card.querySelector('.break-toggle');
      t.textContent = broken ? '🔧 Fix it' : '💥 Break';
      t.classList.toggle('fix', broken);
    });

    // Metrics
    el('mServed').textContent = Math.round(state.served).toLocaleString();
    el('mFailed').textContent = Math.round(state.failed).toLocaleString();
    el('mWait').textContent = state.lastWait.toFixed(1) + 's';
    el('mHappy').textContent = Math.round(state.happyAvg * 100) + '%';
    el('mHappy').className = 'metric-val ' + (state.happyAvg >= 0.9 ? 'good' : state.happyAvg >= 0.6 ? 'warn' : 'bad');
    el('mFailed').className = 'metric-val' + (state.lastLostPct > 0.05 ? ' bad' : '');
    el('mWait').className = 'metric-val ' + (state.lastWait > 4 ? 'bad' : state.lastWait > 2.5 ? 'warn' : '');
    el('mCost').textContent = fmtNaira(monthlyCost());
    el('mParts').textContent = mono ? 1 : SERVICES.length + (state.queue ? 1 : 0);
    el('doneSub').textContent = Math.round(state.served).toLocaleString() + ' served';
    pauseBtn.textContent = state.paused ? '▶ Resume' : '⏸ Pause';

    renderExplain();
  }

  function monthlyCost() {
    if (state.arch === 'mono') return state.servers.mono * SIM.monoCost;
    const n = SERVICES.reduce((sum, s) => sum + state.servers[s.key], 0);
    return n * SIM.microCost + SIM.microExtra + (state.queue ? 20000 : 0);
  }

  function trafficMood(t) {
    if (t <= 15) return '😴 Quiet morning';
    if (t <= 35) return '🙂 Normal Tuesday';
    if (t <= 60) return '😮 Lunch rush';
    if (t <= 90) return '🔥 Friday night';
    return '🎉 Big promo day!';
  }

  /* ---- Plain-English explanation of the current situation ---- */
  function renderExplain() {
    const [title, text, tone] = explain();
    el('explainTitle').textContent = title;
    el('explainText').innerHTML = text;
    el('simExplain').className = 'sim-explain tone-' + tone;
  }

  function explain() {
    const mono = state.arch === 'mono';
    const brokenSvc = SERVICES.filter(s => state.broken[s.key]);
    const name = k => SERVICES.find(s => s.key === k).name;

    if (mono && brokenSvc.length) {
      return ['💥 The whole app is down',
        'Only <strong>' + brokenSvc.map(s => s.name).join(' and ') + '</strong> has a bug — but in a monolith everything runs as <strong>one program</strong>, so when it crashes, it all crashes. Nobody can even open the menu. Every customer is lost.' +
        '<br><span class="explain-lesson">🎓 This is called a <em>single point of failure</em>. Now try the same thing in Microservices mode.</span>', 'bad'];
    }
    if (!mono && state.broken.menu) {
      return ['📖 Menu is down — no one can start an order',
        'The other services are fine, but <strong>every customer needs the menu first</strong>, so nobody gets through. Some parts sit on the path of every customer — they are <strong>critical</strong>.' +
        '<br><span class="explain-lesson">🎓 TPM plan: run extra copies of critical parts, and keep a saved copy of the menu as a Plan B.</span>', 'bad'];
    }
    if (!mono && (state.broken.orders || state.broken.pay)) {
      const k = state.broken.pay ? 'pay' : 'orders';
      return ['🧱 ' + name(k) + ' is down — but the damage is contained',
        'Look at the <strong>Menu</strong>: it is still working. People can still browse food; they just can\'t ' + (k === 'pay' ? 'pay' : 'place orders') + ' right now. In a monolith this same bug would have taken down <em>everything</em>.' +
        '<br><span class="explain-lesson">🎓 A TPM would also show a friendly message: "Payments are busy — try again in a few minutes", or offer pay-on-delivery.</span>', 'warn'];
    }
    if (!mono && state.broken.msg && !state.queue) {
      return ['💬 Messages is down — and it is blocking orders',
        'The Orders service <strong>waits</strong> for the "order confirmed" SMS to be sent before finishing. Messages is broken, so orders get stuck and fail. The parts are separate, but still <strong>tightly joined</strong>.' +
        '<br><span class="explain-lesson">🎓 Does a customer really need to wait for the SMS? No! Turn the 📬 queue ON.</span>', 'bad'];
    }
    if (!mono && state.broken.msg && state.queue) {
      return ['📬 Messages is down, but orders keep flowing',
        'Orders no longer wait for the SMS. Each confirmation is dropped into the queue — <strong>' + Math.round(state.queueLen) + ' waiting</strong> right now. Customers barely notice. Now press <strong>🔧 Fix it</strong> on Messages and watch the queue empty.', 'good'];
    }
    if (!mono && state.queue && state.queueLen > 5) {
      return ['📤 Catching up on waiting messages',
        'Messages is working again and is sending the <strong>' + Math.round(state.queueLen) + '</strong> confirmations that waited in the queue. Nothing was lost — they just arrived a little later. That is the trade-off of a queue.', 'good'];
    }

    // Overload
    const loads = Object.assign({}, state.lastLoads);
    if (state.queue && !mono) delete loads.msg;
    let worstKey = null, worst = 0;
    Object.keys(loads).forEach(k => { if (loads[k] > worst) { worst = loads[k]; worstKey = k; } });
    if (worst > 1) {
      const lost = Math.round(state.lastLostPct * 100);
      if (mono) {
        return ['🔥 The app is overloaded (' + Math.round(worst * 100) + '%)',
          'There are more requests than the app can handle, so <strong>about ' + lost + '% of customers are lost</strong> and the rest wait longer. Press <strong>+</strong> to add copies.' +
          '<br><span class="explain-lesson">🎓 Notice: every copy runs the <em>whole</em> app — even parts that weren\'t busy. In Microservices mode you can add power to just the busy part.</span>', 'bad'];
      }
      return ['🔥 ' + name(worstKey) + ' is overloaded (' + Math.round(worst * 100) + '%)',
        name(worstKey) + ' can handle <strong>' + state.servers[worstKey] * SIM.microCap + '</strong> requests a minute but is getting more than that. <strong>About ' + lost + '% of customers are lost.</strong> Add servers to ' + name(worstKey) + ' — the other parts are fine.', 'bad'];
    }
    if (worst > 0.7) {
      return ['⏳ Getting busy', 'Some parts are above 70% full, so waits are going up (' + state.lastWait.toFixed(1) + 's). Customers start getting annoyed after about 2.5 seconds. A TPM adds servers <strong>before</strong> the rush, not after.', 'warn'];
    }
    if (state.paused) return ['⏸ Paused', 'Press Resume to keep the simulation running.', 'calm'];
    return mono
      ? ['✅ Everything is calm', 'One program does everything. This is simple and cheap for a small app. Try <strong>moving the traffic slider</strong>, or press a <strong>💥 Break</strong> button to see what a single bug does.', 'calm']
      : ['✅ Everything is calm', 'Each part runs on its own servers. Look at the bar on each card — <strong>Menu is the busiest</strong> because every customer browses several times. Try breaking a part, or turning up the traffic.', 'calm'];
  }

  /* ---- Event log ---- */
  function log(msg, tone) {
    const li = document.createElement('li');
    li.className = tone ? 'log-' + tone : '';
    li.innerHTML = '<span class="log-time">min ' + state.minute + '</span> ' + msg;
    logEl.prepend(li);
    while (logEl.children.length > 8) logEl.lastChild.remove();
  }

  // With the queue on, a busy Messages service just makes the queue longer; nobody is lost
  function overloads() {
    const out = {};
    Object.keys(state.lastLoads).forEach(k => {
      if (k === 'msg' && state.queue && state.arch === 'micro') return;
      if (state.lastLoads[k] > 1) out[k] = state.lastLoads[k];
    });
    return out;
  }

  function checkAlerts() {
    const partName = k => k === 'mono' ? 'The app' : SERVICES.find(s => s.key === k).name;
    const now = overloads();
    Object.keys(now).forEach(k => {
      if (!prevAlerts[k]) log('🔥 ' + partName(k) + ' is overloaded — customers are being lost.', 'bad');
    });
    Object.keys(prevAlerts).forEach(k => {
      if (k !== 'queue' && !now[k]) log('✅ ' + partName(k) + ' is back under control.', 'good');
    });
    if (state.queue && state.queueLen < 1 && prevAlerts.queue) log('📭 Queue is empty — every waiting message was sent.', 'good');
    if (state.queue && state.queueLen >= 1) now.queue = true;
    prevAlerts = now;
  }

  /* ---- Moving dots ---- */
  function centerIn(node) {
    const s = stage.getBoundingClientRect(), r = node.getBoundingClientRect();
    return [r.left - s.left + r.width / 2, r.top - s.top + r.height / 2];
  }

  function spawnDots(info) {
    if (reduceMotion || document.hidden || state.traffic === 0) return;
    const n = Math.max(1, Math.min(10, Math.round(info.arrivals / 6)));
    for (let i = 0; i < n; i++) setTimeout(() => spawnDot(info), Math.random() * 900);
    if (state.arch === 'micro' && state.queue && !state.broken.pay) {
      setTimeout(() => sendQueueDot(info.sentFromQueue > 0), Math.random() * 900);
    }
  }

  function spawnDot(info) {
    const points = [centerIn(el('simCustomers'))];
    let ok = true;
    for (const s of SERVICES) {
      if (s.key === 'msg' && state.arch === 'micro' && state.queue) break;
      points.push(centerIn(cards[s.key]));
      if (Math.random() > info.pass[s.key]) { ok = false; break; }
    }
    if (ok && Math.random() < info.giveUp) ok = false;
    if (ok) points.push(centerIn(el('simDone')));
    animateDot(points, ok ? 'ok' : 'fail');
  }

  function sendQueueDot(delivered) {
    const points = [centerIn(cards.pay), centerIn(el('queueCard'))];
    if (delivered) points.push(centerIn(cards.msg));
    animateDot(points, 'wait');
  }

  function animateDot(points, kind) {
    const dot = document.createElement('span');
    dot.className = 'sim-dot ' + kind;
    dotLayer.appendChild(dot);
    const frames = points.map(([x, y], i) => ({
      transform: 'translate(' + x + 'px,' + y + 'px) scale(' + (kind === 'fail' && i === points.length - 1 ? 1.6 : 1) + ')',
      opacity: 1
    }));
    if (kind === 'fail') frames.push({ transform: frames[frames.length - 1].transform.replace(/\)$/, ') translateY(14px)'), opacity: 0 });
    else frames.push(Object.assign({}, frames[frames.length - 1], { opacity: 0 }));
    const hop = 260 + Math.min(state.lastWait, 6) * 60;
    const anim = dot.animate(frames, { duration: hop * frames.length, easing: 'linear' });
    anim.onfinish = () => dot.remove();
  }

  /* ---- Missions ---- */
  const missionList = el('missionList');

  function renderMissions() {
    missionList.innerHTML = '';
    MISSIONS.forEach((m, i) => {
      const done = !!missionDone[m.id];
      const div = document.createElement('div');
      div.className = 'mission' + (done ? ' done' : '');
      div.innerHTML =
        '<div class="mission-num">' + (done ? '✓' : i + 1) + '</div>' +
        '<div class="mission-body"><h4>' + m.title + '</h4><p>' + m.task + '</p>' +
        (done ? '<p class="mission-learn">🎓 ' + m.learn + '</p>' : '') + '</div>' +
        '<button class="ghost-btn small" data-mission="' + m.id + '">Set it up</button>';
      missionList.appendChild(div);
    });
    const count = MISSIONS.filter(m => missionDone[m.id]).length;
    el('missionScore').textContent = count === MISSIONS.length ? 'All 4 done! 🎉' : count + ' / 4 done';
  }

  missionList.addEventListener('click', e => {
    const btn = e.target.closest('[data-mission]');
    if (!btn) return;
    const m = MISSIONS.find(x => x.id === btn.dataset.mission);
    const keepTotals = { served: state.served, failed: state.failed, minute: state.minute };
    state = Object.assign(freshState(), keepTotals);
    state.arch = m.setup.arch;
    state.traffic = m.setup.traffic;
    if (m.setup.servers) Object.assign(state.servers, m.setup.servers);
    (m.setup.broken || []).forEach(k => { state.broken[k] = true; });
    Object.assign(missionTrack, { m3Streak: 0, m4Peak: 0, m4Fixed: false, crashTicks: 0 });
    prevAlerts = {};
    log('🎯 Mission set up: <strong>' + m.title + '</strong>', 'info');
    tick();
    stage.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  });

  function completeMission(id) {
    if (missionDone[id]) return;
    missionDone[id] = true;
    store.set('w2_missions', JSON.stringify(missionDone));
    const m = MISSIONS.find(x => x.id === id);
    log('🏆 Mission complete: <strong>' + m.title + '</strong> — ' + m.learn, 'good');
    renderMissions();
  }

  function checkMissions() {
    const micro = state.arch === 'micro';
    missionTrack.crashTicks = state.broken.pay ? missionTrack.crashTicks + 1 : 0;
    if (!micro && missionTrack.crashTicks >= 3) completeMission('m1');
    if (micro && missionTrack.crashTicks >= 3) completeMission('m2');

    const noneBroken = !SERVICES.some(s => state.broken[s.key]);
    missionTrack.m3Streak = micro && state.traffic >= 80 && noneBroken && state.lastHappy >= 0.9 ? missionTrack.m3Streak + 1 : 0;
    if (missionTrack.m3Streak >= 5) completeMission('m3');

    if (micro && state.queue) {
      if (state.broken.msg) missionTrack.m4Peak = Math.max(missionTrack.m4Peak, state.queueLen);
      else if (missionTrack.m4Peak >= 20) missionTrack.m4Fixed = true;
      if (missionTrack.m4Fixed && state.queueLen < 1) completeMission('m4');
    }
  }

  /* ---- Main loop ---- */
  function tick() {
    const info = computeTick();
    checkAlerts();
    checkMissions();
    render();
    spawnDots(info);
  }

  function start() {
    stop();
    timer = setInterval(() => { if (!state.paused && !document.hidden) tick(); }, 1000);
  }
  function stop() { if (timer) clearInterval(timer); timer = null; }

  /* ---- Controls ---- */
  document.querySelectorAll('.seg-btn').forEach(b => b.addEventListener('click', () => {
    if (state.arch === b.dataset.arch) return;
    state.arch = b.dataset.arch;
    missionTrack.crashTicks = 0;
    if (state.arch === 'mono') state.queueLen = 0;
    log(state.arch === 'mono' ? '🏠 Switched to <strong>Monolith</strong>: one program does everything.' : '🏬 Switched to <strong>Microservices</strong>: 4 separate services.', 'info');
    tick();
  }));

  slider.addEventListener('input', () => {
    const before = trafficMood(state.traffic);
    state.traffic = Number(slider.value);
    const after = trafficMood(state.traffic);
    if (before !== after) log('👥 Traffic is now <strong>' + state.traffic + ' customers/min</strong> — ' + after + '.', 'info');
    render();
  });

  queueBtn.addEventListener('click', () => {
    state.queue = !state.queue;
    log(state.queue ? '📬 Queue ON: orders no longer wait for the SMS to be sent.' : '📪 Queue OFF: orders must wait for each SMS again.', 'info');
    if (!state.queue) state.queueLen = 0;
    tick();
  });

  stage.addEventListener('click', e => {
    const srv = e.target.closest('.srv-btn');
    if (srv) {
      const target = srv.closest('.server-ctl').dataset.target;
      const next = Math.max(1, Math.min(SIM.maxServers, state.servers[target] + Number(srv.dataset.delta)));
      if (next === state.servers[target]) return;
      const added = next > state.servers[target];
      state.servers[target] = next;
      const label = target === 'mono' ? 'The app now has ' + next + (next === 1 ? ' copy' : ' copies')
        : SERVICES.find(s => s.key === target).name + ' now has ' + next + (next === 1 ? ' server' : ' servers');
      log((added ? '➕ ' : '➖ ') + label + '. Bill: ' + fmtNaira(monthlyCost()) + '/month.', 'info');
      render();
      return;
    }
    const brk = e.target.closest('.break-toggle');
    if (brk) {
      const k = brk.dataset.svc;
      state.broken[k] = !state.broken[k];
      const name = SERVICES.find(s => s.key === k).name;
      if (state.broken[k]) log('💥 <strong>' + name + '</strong> crashed' + (state.arch === 'mono' ? ' — taking the whole app down with it!' : '.'), 'bad');
      else log('🔧 <strong>' + name + '</strong> fixed and running again.', 'good');
      tick();
    }
  });

  pauseBtn.addEventListener('click', () => { state.paused = !state.paused; render(); });

  el('simReset').addEventListener('click', () => {
    state = freshState();
    prevAlerts = {};
    logEl.innerHTML = '';
    dotLayer.innerHTML = '';
    log('↺ Simulation reset.', 'info');
    tick();
  });

  // Only run while the simulator is on screen
  state = freshState();
  renderMissions();
  render();
  log('👋 ChopNow is open for business. 20 customers a minute, running as a monolith.', 'info');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      entries.forEach(en => en.isIntersecting ? start() : stop());
    }).observe(stage);
  } else {
    start();
  }
}

/* ---------------- ERD explorer ---------------- */
const ERD_TABLES = [
  { name: 'users', icon: '👤', about: 'One row for every person on Instagram.',
    cols: [
      { c: 'user_id', key: 'PK', d: 'Unique number for each person' },
      { c: 'username', d: 'Their @handle, e.g. amaka_cooks' },
      { c: 'email', d: 'Used to log in (kept private)' },
      { c: 'bio', d: 'The short text on their profile' },
      { c: 'is_verified', d: 'Yes / No — do they have the blue tick?' }
    ],
    example: 'user_id: 1 • username: amaka_cooks • is_verified: No',
    note: 'Usernames are searched millions of times a day, so engineers make them very fast to look up (this is called an "index").' },
  { name: 'posts', icon: '🖼️', about: 'One row for every photo or video post.',
    cols: [
      { c: 'post_id', key: 'PK', d: 'Unique number for each post' },
      { c: 'user_id', key: 'FK', to: 'users', d: 'Who posted it' },
      { c: 'caption', d: 'The text under the photo' },
      { c: 'location', d: 'Where it was taken (optional)' },
      { c: 'created_at', d: 'When it was posted' }
    ],
    example: 'post_id: 501 • user_id: 1 • caption: "Jollof Sunday 🍛"',
    note: 'One user → many posts. This is a one-to-many link, shown by user_id pointing back to users.' },
  { name: 'media', icon: '📹', about: 'Where each photo or video file is stored.',
    cols: [
      { c: 'media_id', key: 'PK', d: 'Unique number for each file' },
      { c: 'post_id', key: 'FK', to: 'posts', d: 'Which post it belongs to' },
      { c: 'type', d: 'Photo or video' },
      { c: 'file_link', d: 'The web address where the file is kept' },
      { c: 'width / height', d: 'Size, so the app can make space before it loads' }
    ],
    example: 'media_id: 9001 • post_id: 501 • type: photo • file_link: cdn…/9001.jpg',
    note: 'The actual photo is NOT in the database — only a link to it. Big files live in separate file storage (just like Spotify\'s songs in Week 1).' },
  { name: 'likes', icon: '❤️', about: 'A middle table: which person liked which post.',
    cols: [
      { c: 'user_id', key: 'FK', to: 'users', d: 'Who liked it' },
      { c: 'post_id', key: 'FK', to: 'posts', d: 'Which post was liked' },
      { c: 'created_at', d: 'When they tapped ❤️' }
    ],
    example: 'user_id: 2 • post_id: 501 (Tunde liked Amaka\'s jollof post)',
    note: 'Many people like many posts — a many-to-many link. The pair (user_id + post_id) can only appear once, so nobody can like the same post twice.' },
  { name: 'follows', icon: '🤝', about: 'A middle table: who follows whom.',
    cols: [
      { c: 'follower_id', key: 'FK', to: 'users', d: 'The person who pressed Follow' },
      { c: 'following_id', key: 'FK', to: 'users', d: 'The person being followed' },
      { c: 'status', d: 'Accepted, or waiting (for private accounts)' }
    ],
    example: 'follower_id: 2 • following_id: 1 (Tunde follows Amaka)',
    note: 'Both columns point to the same users table. For celebrities with millions of followers, reading this table every time would be too slow — so Instagram keeps ready-made lists in fast memory.' }
];

function initErdExplorer() {
  const map = document.getElementById('erdMap');
  const detail = document.getElementById('erdDetail');
  const btns = {};

  function linksOf(t) {
    const out = new Set();
    t.cols.forEach(col => { if (col.to) out.add(col.to); });
    ERD_TABLES.forEach(o => { if (o.cols.some(col => col.to === t.name)) out.add(o.name); });
    out.delete(t.name);
    return out;
  }

  function select(t) {
    const linked = linksOf(t);
    Object.values(btns).forEach(b => {
      b.classList.toggle('active', b.dataset.table === t.name);
      b.classList.toggle('linked', linked.has(b.dataset.table));
    });

    const points = t.cols.filter(col => col.to).map(col => '<li><code>' + col.c + '</code> points to <strong>' + col.to + '</strong></li>');
    ERD_TABLES.forEach(o => o.cols.forEach(col => {
      if (col.to === t.name && o.name !== t.name) points.push('<li><strong>' + o.name + '</strong>.<code>' + col.c + '</code> points to this table</li>');
    }));

    detail.innerHTML =
      '<h3>' + t.icon + ' The <code>' + t.name + '</code> table</h3>' +
      '<p class="erd-about">' + t.about + '</p>' +
      '<div class="erd-cols">' + t.cols.map(col =>
        '<div class="erd-col"><code>' + col.c + '</code>' +
        (col.key === 'PK' ? '<span class="key-badge pk">🔑 Primary key</span>' : '') +
        (col.key === 'FK' ? '<span class="key-badge fk">🔗 Foreign key → ' + col.to + '</span>' : '') +
        '<span class="erd-col-d">' + col.d + '</span></div>').join('') + '</div>' +
      '<div class="erd-extra">' +
        '<div><span class="break-label">🔗 Links</span><ul class="erd-links">' + points.join('') + '</ul></div>' +
        '<div><span class="break-label">📄 Example row</span><p class="erd-example">' + t.example + '</p></div>' +
      '</div>' +
      '<div class="tpm-takeaway"><strong>🎓 TPM note:</strong> ' + t.note + '</div>';
  }

  ERD_TABLES.forEach(t => {
    const b = document.createElement('button');
    b.className = 'erd-node';
    b.dataset.table = t.name;
    b.innerHTML = '<span class="erd-node-icon">' + t.icon + '</span><strong>' + t.name + '</strong><span class="erd-node-sub">' + t.cols.length + ' columns</span>';
    b.addEventListener('click', () => select(t));
    map.appendChild(b);
    btns[t.name] = b;
  });
  select(ERD_TABLES[1]);
}

/* ---------------- Quiz ---------------- */
const QUIZ = [
  { q: 'What does "systems thinking" mean?',
    options: ['Writing code very fast', 'Looking at how all the parts connect and affect each other', 'Buying more servers', 'Designing nice screens'], answer: 1,
    why: 'It means seeing the whole product: a change or problem in one part can affect others.' },
  { q: 'In a monolith, the payments code crashes. What usually happens?',
    options: ['Only payments stops', 'Nothing happens', 'The whole app can go down', 'The menu gets faster'], answer: 2,
    why: 'A monolith is one program. When it crashes, every feature inside it stops — like you saw in the simulation.' },
  { q: 'What is the main benefit of microservices?',
    options: ['They are always cheaper', 'One part can fail or grow without affecting the others', 'You need fewer engineers', 'There is nothing to manage'], answer: 1,
    why: 'Separate services keep problems contained and let you add power just where it\'s needed. The cost is more things to manage.' },
  { q: 'Which job is the best fit for a queue?',
    options: ['Checking a password at login', 'Showing the bank balance', 'Sending a receipt email after an order', 'Loading the home screen'], answer: 2,
    why: 'A receipt can arrive a few seconds later. The customer shouldn\'t have to wait for it.' },
  { q: 'What is a primary key?',
    options: ['The password to the database', 'A unique ID for each row in a table', 'The most important column', 'A list of all users'], answer: 1,
    why: 'Like a matric number — it makes sure no two rows are mixed up.' },
  { q: 'In the posts table, the column user_id (pointing to the users table) is a…',
    options: ['Primary key', 'Foreign key', 'Queue', 'Service'], answer: 1,
    why: 'A foreign key points to another table\'s ID. It shows which user wrote each post.' },
  { q: 'Students take many courses, and courses have many students. What do you need?',
    options: ['Nothing — just one table', 'A one-to-one link', 'A middle table, like a class register', 'A microservice'], answer: 2,
    why: 'Many-to-many links need a middle table (e.g. enrollments) that pairs each student with each course.' }
];

function initQuiz() {
  // Rendering, saved answers and scoring live in ../access.js
  TPMQuiz.render(QUIZ, { low: "Good start. Play the simulation missions again, then retry." });
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
    b.checked = store.get('w2_' + b.dataset.key, '0') === '1';
    b.addEventListener('change', () => { store.set('w2_' + b.dataset.key, b.checked ? '1' : '0'); update(); });
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
  ['Systems thinking', 'Looking at the whole product and how its parts affect each other, not just one feature.'],
  ['Architecture', 'How the parts of an app are arranged and how they connect.'],
  ['Monolith', 'An app built as one single program. Simple, but one crash can stop everything.'],
  ['Microservices', 'An app split into many small programs ("services"), each doing one job.'],
  ['Service', 'A small program that does one job, like payments or messages.'],
  ['Event-driven', 'A design where parts send messages ("events") and don\'t wait for an answer.'],
  ['Queue', 'A waiting line for jobs. Work is dropped in and picked up when a worker is free.'],
  ['Loose coupling', 'Parts depend on each other as little as possible, so one failing doesn\'t break the others.'],
  ['Tight coupling', 'Parts depend heavily on each other — if one stops, the other stops too.'],
  ['Single point of failure', 'One part that, if it breaks, stops the whole system.'],
  ['Server', 'A computer (usually in a data centre) that runs part of the app.'],
  ['Scaling', 'Making a system handle more users, often by adding more servers.'],
  ['Overloaded', 'A part is getting more work than it can handle, so things slow down or fail.'],
  ['Gateway', 'The "front door" service that receives every request and sends it to the right place.'],
  ['Fallback / Plan B', 'What the app does when a part fails, e.g. show popular movies instead of personal picks.'],
  ['CAP trade-off', 'When parts can\'t talk, you choose between showing maybe-old data or showing an error.'],
  ['Eventual consistency', 'Data may be a little out of date for a moment, but will catch up soon.'],
  ['ERD', 'Entity Relationship Diagram — a drawing of an app\'s tables and how they link.'],
  ['Entity', 'A "thing" the app remembers, like User or Order. Usually one table.'],
  ['Attribute', 'A detail about an entity — a column, like email or price.'],
  ['Primary key (PK)', 'A unique ID for each row in a table, like a matric number.'],
  ['Foreign key (FK)', 'A column that points to the primary key of another table.'],
  ['One-to-many', 'One thing links to many others, e.g. one user has many posts.'],
  ['Many-to-many', 'Many things link to many others, e.g. students and courses. Needs a middle table.'],
  ['Sharding', 'Splitting a huge database into many smaller ones.'],
  ['Read-heavy', 'An app where people look at things far more than they create them (like Instagram).'],
  ['Chaos engineering', 'Breaking parts of your own system on purpose to prove it can survive.'],
  ['Latency', 'How long you wait for an answer. Lower is better.']
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
