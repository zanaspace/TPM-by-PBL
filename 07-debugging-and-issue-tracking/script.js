/* Week 07: Debugging and Issue Tracking
   Interactive pieces: theme, tabs, bug-report line game, priority helper,
   the incident simulation (triage → incident room → post-mortem), quiz,
   capstone checklist, template copy, word bank, scroll spy. */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initChoiceGame(LINE_GAME);
  initPriorityHelper();
  initIncidentSim();
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
const LINE_GAME = {
  id: 'line',
  names: { a: 'A', b: 'B' },
  labels: item => ({ a: 'A: ' + item.a, b: 'B: ' + item.b }),
  items: [
    { task: '📌 The title', a: 'Checkout broken!!!', b: 'Paying with a new card shows "Something went wrong" (saved cards work)', answer: 'b',
      why: 'B says what is wrong, where, and what still works. The engineer already knows where to look.' },
    { task: '📱 Where it happened', a: 'Android app 5.4.0 on a Samsung A14, live app', b: 'On my phone', answer: 'a',
      why: 'Bugs often only happen on one app version or phone. "My phone" could be anything.' },
    { task: '👣 Steps to reproduce', a: 'I tried to pay and it didn\'t work.', b: '1. Add jollof to basket  2. Checkout  3. Choose "New card"  4. Tap Pay', answer: 'b',
      why: 'Exact, numbered steps let the engineer make the bug happen themselves — the first step to fixing it.' },
    { task: '⚖️ Expected vs actual', a: 'Expected: order confirmed. Actual: "Something went wrong" after 3 seconds, no charge.', b: 'It should work but it doesn\'t.', answer: 'a',
      why: 'A says exactly what "working" means and exactly what happened instead.' },
    { task: '🔁 How often', a: 'Sometimes?', b: '5 out of 5 tries, since about 7:30 PM today', answer: 'b',
      why: '"Every time since 7:30" points straight at something that changed around 7:30 — like a release.' },
    { task: '🧾 Proof and tone', a: 'Whoever built this should be ashamed.', b: 'Screen recording attached, plus the exact error text.', answer: 'b',
      why: 'Proof saves time. Blame only makes people defensive.' }
  ],
  done: pct => pct >= 0.8 ? 'Excellent! Engineers will be happy to get your bug reports. 🎉'
    : pct >= 0.5 ? 'Good! Always ask: could an engineer make this happen again from my report alone?'
    : 'Look at the good bug report example above again, then try once more.'
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
    const item = items[index];
    taskEl.textContent = item.task;
    if (game.labels) {
      const labels = game.labels(item);
      choices.forEach(c => { c.textContent = labels[c.dataset.pick]; });
    }
    feedbackEl.className = 'game-feedback';
    feedbackEl.innerHTML = '';
    choices.forEach(c => { c.disabled = false; c.hidden = false; c.classList.remove('right', 'wrong'); });
    nextBtn.disabled = true;
    nextBtn.textContent = index === items.length - 1 ? 'See my score →' : 'Next →';
    progressEl.textContent = (index + 1) + ' of ' + items.length;
  }

  function finish() {
    taskEl.textContent = 'You got ' + correct + ' out of ' + items.length + ' right.';
    feedbackEl.className = 'game-feedback show';
    feedbackEl.textContent = game.done(correct / items.length);
    choices.forEach(c => { c.disabled = true; c.classList.remove('right', 'wrong'); if (game.labels) c.hidden = true; });
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
      feedbackEl.innerHTML = (isRight ? '✅ <strong>Correct!</strong> ' : '❌ <strong>Not quite.</strong> Better: ' + game.names[item.answer] + '. ') + item.why;
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

/* ---------------- Priority helper ---------------- */
const P_INFO = {
  P0: ['Drop everything', 'Gather the team now — even at night. Stop the damage first, then tell customers and leaders.'],
  P1: ['Urgent', 'Assign someone today. Tell customer support so they can answer people.'],
  P2: ['Normal', 'Put it in this sprint or the next. Share any workaround with support.'],
  P3: ['Later', 'Add it to the backlog. Fix it alongside related work.']
};

function priorityFor(how, who) {
  if (how === 4 && who >= 3) return 'P0';
  if (how === 4 || (how === 3 && who >= 3)) return 'P1';
  if (how === 1) return who === 4 ? 'P2' : 'P3';
  return 'P2';
}

function initPriorityHelper() {
  const how = document.getElementById('phHow'), who = document.getElementById('phWho'), out = document.getElementById('phResult');
  function update() {
    const p = priorityFor(Number(how.value), Number(who.value));
    out.className = 'ph-result r-' + p.toLowerCase();
    out.innerHTML = '<span class="p-badge ' + p.toLowerCase() + '">' + p + '</span><div><strong>' + P_INFO[p][0] + '</strong><p>' + P_INFO[p][1] + '</p></div>';
  }
  how.addEventListener('change', update);
  who.addEventListener('change', update);
  update();
}

/* ---------------- Incident simulation ---------------- */
const TRIAGE = [
  { icon: '🚨', from: 'Monitoring alert · 19:42', text: 'Payment errors: <strong>38% of payments are failing</strong> (normal is under 1%). Started around 19:31.', answer: 'P0',
    why: 'The core money flow is broken for many customers, right now, on the busiest night. Drop everything.' },
  { icon: '🐦', from: 'Tweet · 19:43', text: '"@ChopNow I can\'t pay for my order!! Tried 3 times 😡"', answer: 'P0',
    why: 'This is the <em>same</em> problem as the alert — so it\'s P0 too. A good TPM links it to the same incident instead of opening a new one.' },
  { icon: '🏪', from: 'Restaurant partner · 19:40', text: '"Since this afternoon, new orders reach our tablet about 5 minutes late."', answer: 'P1',
    why: 'A big feature for restaurants, with no workaround — urgent. But food still arrives, so it comes after the payments P0.' },
  { icon: '📱', from: 'Support ticket · 19:38', text: 'Customers on an old Android version (about 3% of users) can\'t change their profile photo.', answer: 'P2',
    why: 'A small group, not a core feature, and updating the app is a workaround.' },
  { icon: '✏️', from: 'Support ticket · 19:35', text: 'The Help page says "Recieve your order" instead of "Receive".', answer: 'P3',
    why: 'Cosmetic. Worth fixing — but it can wait.' }
];

const CLUES = [
  { id: 'deploys', icon: '🚀', label: 'Recent changes (releases)', cost: 2,
    result: '<strong>19:30</strong> — "Saved cards v2" released (PR #48). Feature flag <code>saved_cards_v2</code> set to <strong>100%</strong> of customers.<br><strong>17:05</strong> — New restaurant photos.' },
  { id: 'dashboard', icon: '📊', label: 'Dashboard: errors by payment type', cost: 3,
    result: 'Saved-card payments: ✅ normal. <strong>New-card payments: ❌ 92% failing.</strong> The problem started at exactly <strong>19:31</strong>.' },
  { id: 'logs', icon: '📜', label: 'Error logs', cost: 3,
    result: '<code>PaymentError: card_token is required</code> — 4,100 times since 19:31. Almost all from checkouts using a <strong>new</strong> card.' },
  { id: 'partner', icon: '💳', label: 'PayBridge status page', cost: 2,
    result: 'PayBridge: ✅ <strong>All systems operational.</strong> Their error rate is normal — the problem is probably on ChopNow\'s side.' },
  { id: 'support', icon: '🎧', label: 'Support tickets', cost: 2,
    result: '212 "can\'t pay" tickets in 15 minutes. Many customers tried 3–4 times. Several say <strong>pay-on-delivery still works</strong>.' }
];

const ACTIONS = [
  { id: 'flag', icon: '🚩', label: 'Switch off the "saved cards v2" feature flag', cost: 1, fixes: true,
    log: 'Flag <code>saved_cards_v2</code> switched off. Within a minute, failures fall from 38% to under 1%. 🎉' },
  { id: 'rollback', icon: '↩️', label: 'Roll back tonight\'s 19:30 release', cost: 6, fixes: true,
    log: 'Rollback started. It takes 6 minutes to reach all servers — then failures drop to under 1%.' },
  { id: 'restart', icon: '🔄', label: 'Restart all the servers', cost: 8, fixes: false,
    log: 'All servers restarted (8 minutes). Failures continue — the broken code is still running.' },
  { id: 'callPartner', icon: '📞', label: 'Call PayBridge and wait for their answer', cost: 12, fixes: false,
    log: 'After 12 minutes, PayBridge replies: "Everything is fine on our side — your requests are missing <code>card_token</code>."' },
  { id: 'hotfix', icon: '🛠️', label: 'Ask engineers to write, test and release a fix', cost: 35, fixes: true,
    log: 'Engineers wrote, tested and released a fix in 35 minutes. It worked — but customers were failing the whole time.' }
];

const COMMS = {
  customers: { icon: '📢', label: 'Post a status update for customers', options: [
    { good: true, text: 'Some card payments are failing right now. Saved cards and pay-on-delivery still work. We\'re fixing it — next update by 8:30 PM.' },
    { good: false, text: 'Our payment microservice is returning errors due to a card_token validation regression.',
      why: 'Too technical — customers don\'t know what this means or what to do.' },
    { good: false, text: 'PayBridge is having problems. It\'s not our fault!',
      why: 'Blaming a partner — and it isn\'t even true. Never guess publicly.' }
  ] },
  ceo: { icon: '👩🏾‍💼', label: 'Update Funmi (CEO)', options: [
    { good: false, text: 'Something is wrong with payments. Engineers are looking into it.',
      why: 'No numbers, no plan, no next update time. She\'ll keep calling you.' },
    { good: true, text: 'P0: 38% of payments failing since 19:31. Likely cause: tonight\'s 19:30 release. Switching it off now. Next update in 15 min.' },
    { good: false, text: 'Everything is fine, nothing to worry about.',
      why: 'Hiding a P0 from leadership destroys trust when they find out — and they will.' }
  ] }
};

const WHYS = [
  { q: 'Why did payments fail?', options: [
    ['blame', 'Tobi wrote bad code.'],
    ['good', 'The 19:30 release required a card_token for every payment — but new cards don\'t have one yet.'],
    ['shallow', 'Payments are just complicated.'] ] },
  { q: 'Why did that reach customers?', options: [
    ['good', 'The automatic tests only covered paying with a saved card, not a new card.'],
    ['shallow', 'Bad luck.'],
    ['blame', 'QA didn\'t do their job.'] ] },
  { q: 'Why was paying with a new card not tested?', options: [
    ['shallow', 'The test tool is old.'],
    ['blame', 'Nobody on the team cares about testing.'],
    ['good', 'The ticket\'s acceptance criteria only described the saved-card path.'] ] },
  { q: 'Why did it hit every customer at once?', options: [
    ['good', 'The feature flag went from 0% straight to 100%, instead of 5% first.'],
    ['blame', 'The engineer was in a hurry to go home.'],
    ['shallow', 'Friday is a busy day.'] ] },
  { q: 'Why did the flag go straight to 100%?', options: [
    ['blame', 'Someone clicked the wrong button.'],
    ['shallow', 'Gradual rollouts are slow.'],
    ['good', 'Our release checklist doesn\'t require a gradual rollout for payment changes.'] ] }
];
const WHY_FEEDBACK = {
  blame: '🙅 That\'s blame. People make mistakes — ask what <em>system</em> let the mistake reach customers.',
  shallow: '🤷 That doesn\'t explain anything we can change. Dig deeper.'
};

const PM_ACTIONS = [
  { good: true, text: 'Add "pay with a new card" (and other payment paths) to the automatic tests.' },
  { good: false, text: 'Take Tobi off payments work.', why: 'Blame. The next person would make a similar mistake, because the gaps are still there.' },
  { good: true, text: 'Payment changes must roll out gradually: 5% → 25% → 100%, watching errors at each step.' },
  { good: true, text: 'Alert the on-call team when payment errors pass 5% for 2 minutes (it took 11 minutes to notice).' },
  { good: false, text: 'Never release anything on a Friday again.', why: 'It treats the symptom. Bugs can ship on any day — gradual rollouts and tests protect every day.' },
  { good: true, text: 'Add "What other ways can users pay?" to the PRD checklist for payment features.' }
];

const PER_MIN_ORDERS = 120, AVG_ORDER = 6500, START = 19 * 60 + 42, BROKE_AT = 19 * 60 + 31;
const fmtTime = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
const naira = n => '₦' + Math.round(n).toLocaleString('en-NG');

function initIncidentSim() {
  const el = id => document.getElementById(id);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let T, R, P;   // triage, room and post-mortem state

  function showStage(name) {
    ['triage', 'room', 'pm'].forEach(n => { el('stage' + { triage: 'Triage', room: 'Room', pm: 'Pm' }[n]).hidden = n !== name; });
    const order = ['triage', 'room', 'pm'];
    document.querySelectorAll('#simulation .sim-step').forEach(s => {
      s.classList.toggle('active', s.dataset.stage === name);
      s.classList.toggle('done', order.indexOf(s.dataset.stage) < order.indexOf(name));
    });
    el('simulation').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------- Stage 1: triage ---------- */
  function startTriage() {
    T = { picks: {} };
    const list = el('triageList');
    list.innerHTML = '';
    TRIAGE.forEach((item, i) => {
      const card = document.createElement('div');
      card.className = 'tri-card';
      card.innerHTML = '<div class="tri-top"><span class="tri-icon">' + item.icon + '</span><span class="tri-from">' + item.from + '</span></div>' +
        '<p class="tri-text">' + item.text + '</p>' +
        '<div class="tri-buttons">' + ['P0', 'P1', 'P2', 'P3'].map(p => '<button class="tri-btn" data-p="' + p + '">' + p + '</button>').join('') + '</div>' +
        '<p class="tri-feedback" hidden></p>';
      card.querySelectorAll('.tri-btn').forEach(b => b.addEventListener('click', () => {
        if (T.picks[i]) return;
        T.picks[i] = b.dataset.p;
        const diff = Math.abs(Number(b.dataset.p[1]) - Number(item.answer[1]));
        card.querySelectorAll('.tri-btn').forEach(x => {
          x.disabled = true;
          if (x.dataset.p === item.answer) x.classList.add('right');
        });
        if (diff) b.classList.add(diff === 1 ? 'close' : 'wrong');
        const fb = card.querySelector('.tri-feedback');
        fb.hidden = false;
        fb.className = 'tri-feedback ' + (diff === 0 ? 'good' : diff === 1 ? 'meh' : 'bad');
        fb.innerHTML = (diff === 0 ? '✅ ' : diff === 1 ? '🟡 Close — it\'s ' + item.answer + '. ' : '❌ It\'s ' + item.answer + '. ') + item.why;
        updateTriage();
      }));
      list.appendChild(card);
    });
    updateTriage();
  }

  function updateTriage() {
    const done = Object.keys(T.picks).length;
    const right = TRIAGE.filter((t, i) => T.picks[i] === t.answer).length;
    el('triageNote').textContent = done < TRIAGE.length ? done + ' of ' + TRIAGE.length + ' sorted' : right + ' of ' + TRIAGE.length + ' exactly right.';
    el('toRoom').disabled = done < TRIAGE.length;
    T.score = right;
  }
  el('toRoom').addEventListener('click', () => { startRoom(); showStage('room'); });

  /* ---------- Stage 2: incident room ---------- */
  function startRoom() {
    R = { t: START, fail: 38, history: [], lost: 0, fixed: false, fixedAt: null, fixedBy: null,
      clues: new Set(), tried: new Set(), comms: {}, commsBeforeFix: {}, firstAction: null };
    // Minutes before the alert: normal, then broken from 19:31
    for (let m = START - 20; m < START; m++) R.history.push(m >= BROKE_AT ? 38 : 1);
    R.lost = (START - BROKE_AT) * PER_MIN_ORDERS * 0.38;
    el('roomLog').innerHTML = '';
    el('roomEnd').hidden = true;
    logRoom('🔔 Alert: 38% of payments failing. You open the incident and invite the payments engineers. The problem has been live since 19:31 — 11 minutes before anyone noticed.', 'bad');
    renderRoom();
  }

  function advance(minutes) {
    for (let i = 0; i < minutes; i++) {
      R.t++;
      R.history.push(R.fail);
      R.lost += PER_MIN_ORDERS * R.fail / 100 * (R.fail > 1 ? 1 : 0);
    }
  }

  function logRoom(text, tone) {
    const li = document.createElement('li');
    li.className = 'log-' + (tone || 'info');
    li.innerHTML = '<span class="log-time">' + fmtTime(R.t) + '</span> ' + text;
    el('roomLog').prepend(li);
  }

  function renderRoom() {
    el('clock').textContent = fmtTime(R.t);
    el('rFail').textContent = R.fail + '%';
    el('rFail').className = R.fail > 5 ? 'bad-text' : 'good-text';
    el('rLost').textContent = Math.round(R.lost).toLocaleString();
    el('rMoney').textContent = naira(R.lost * AVG_ORDER);
    el('rStatus').textContent = R.fixed ? '🟢 Mitigated' : '🔴 Ongoing';

    const hist = R.history.slice(-40);
    el('chart').innerHTML = '<div class="chart-bars">' + hist.map((v, i) => '<span class="bar ' + (v > 5 ? 'bar-bad' : 'bar-ok') + '" style="height:' + Math.max(3, v * 2.2) + '%" title="' + v + '%"></span>').join('') + '</div>' +
      '<div class="chart-axis"><span>' + fmtTime(R.t - hist.length + 1) + '</span><span>% of payments failing</span><span>' + fmtTime(R.t) + '</span></div>';

    // Clues
    el('clueList').innerHTML = CLUES.map(c => {
      const seen = R.clues.has(c.id);
      return '<div class="clue' + (seen ? ' seen' : '') + '">' +
        '<button class="clue-btn" data-clue="' + c.id + '"' + (seen ? ' disabled' : '') + '>' + c.icon + ' ' + c.label + ' <span class="cost">' + (seen ? '✓ checked' : '+' + c.cost + ' min') + '</span></button>' +
        (seen ? '<div class="clue-result">' + c.result + '</div>' : '') + '</div>';
    }).join('');
    el('clueList').querySelectorAll('.clue-btn').forEach(b => b.addEventListener('click', () => checkClue(b.dataset.clue)));

    // Actions
    el('actionList').innerHTML = ACTIONS.map(a => {
      const tried = R.tried.has(a.id);
      return '<button class="act-btn' + (tried ? ' tried' : '') + '" data-act="' + a.id + '"' + (tried || R.fixed ? ' disabled' : '') + '>' + a.icon + ' ' + a.label + ' <span class="cost">+' + a.cost + ' min</span></button>';
    }).join('');
    el('actionList').querySelectorAll('.act-btn').forEach(b => b.addEventListener('click', () => doAction(b.dataset.act)));

    // Communications
    el('commList').innerHTML = Object.entries(COMMS).map(([k, c]) => {
      const sent = R.comms[k];
      return '<div class="comm">' + '<button class="act-btn comm-btn" data-comm="' + k + '"' + (sent ? ' disabled' : '') + '>' + c.icon + ' ' + c.label + ' <span class="cost">' + (sent ? (sent.good ? '✓ sent' : '⚠️ sent') : '+1 min') + '</span></button>' +
        '<div class="comm-options" data-for="' + k + '" hidden>' + c.options.map((o, i) => '<button class="comm-opt" data-comm="' + k + '" data-i="' + i + '">"' + o.text + '"</button>').join('') + '</div></div>';
    }).join('');
    el('commList').querySelectorAll('.comm-btn').forEach(b => b.addEventListener('click', () => {
      const box = el('commList').querySelector('.comm-options[data-for="' + b.dataset.comm + '"]');
      box.hidden = !box.hidden;
    }));
    el('commList').querySelectorAll('.comm-opt').forEach(b => b.addEventListener('click', () => sendComm(b.dataset.comm, Number(b.dataset.i))));
  }

  function checkClue(id) {
    const c = CLUES.find(x => x.id === id);
    if (R.clues.has(id)) return;
    advance(R.fixed ? 0 : c.cost);
    R.clues.add(id);
    logRoom(c.icon + ' Checked: ' + c.label + '.', 'info');
    renderRoom();
  }

  function doAction(id) {
    const a = ACTIONS.find(x => x.id === id);
    if (R.fixed || R.tried.has(id)) return;
    if (!R.firstAction) R.firstAction = { id, cluesBefore: new Set(R.clues) };
    R.tried.add(id);
    advance(a.cost);
    if (a.fixes) {
      R.fail = 1;
      R.fixed = true; R.fixedAt = R.t; R.fixedBy = id;
      R.history.push(1);
    }
    if (id === 'callPartner') R.clues.add('partner');
    logRoom(a.icon + ' ' + a.log, a.fixes ? 'good' : 'bad');
    renderRoom();
    if (R.fixed) showRoomEnd();
  }

  function sendComm(k, i) {
    const o = COMMS[k].options[i];
    R.comms[k] = o;
    if (!R.fixed) { R.commsBeforeFix[k] = true; advance(1); }
    logRoom(COMMS[k].icon + ' ' + (k === 'customers' ? 'Status update posted' : 'Message sent to the CEO') + ': "' + o.text + '"' + (o.good ? '' : ' — ⚠️ ' + o.why), o.good ? 'good' : 'bad');
    renderRoom();
    if (R.fixed) showRoomEnd();
  }

  function showRoomEnd() {
    const mins = R.fixedAt - BROKE_AT;
    const sinceAlert = R.fixedAt - START;
    const investigated = R.firstAction && (R.firstAction.cluesBefore.has('deploys') || R.firstAction.cluesBefore.has('dashboard') || R.firstAction.cluesBefore.has('logs'));
    const good = [], bad = [];
    if (R.fixedBy === 'flag') good.push('You stopped the damage the fastest way: switching off the feature flag (1 minute).');
    if (R.fixedBy === 'rollback') good.push('Rolling back the release worked. A feature flag would have been even faster (1 minute vs 6).');
    if (R.fixedBy === 'hotfix') bad.push('Writing a new fix took 35 minutes. Stop the damage first (flag off or roll back), then fix calmly.');
    if (R.tried.has('restart')) bad.push('Restarting servers didn\'t help — the broken code was still there. Check what changed before acting.');
    if (R.tried.has('callPartner')) bad.push('Waiting on PayBridge cost 12 minutes. Their status page would have told you in 2.');
    if (investigated) good.push('You looked at evidence before acting.');
    else bad.push('You acted before checking any evidence. It may have worked, but in real life, look at "recent changes" first — most incidents follow a change.');
    ['customers', 'ceo'].forEach(k => {
      const who = k === 'customers' ? 'customers' : 'the CEO';
      if (!R.comms[k]) bad.push('You never updated ' + who + '. Silence makes people assume the worst.');
      else if (!R.comms[k].good) bad.push('Your message to ' + who + ' wasn\'t great: ' + R.comms[k].why);
      else good.push('Clear, honest update to ' + who + (R.commsBeforeFix[k] ? ', sent during the incident.' : '.'));
    });
    const score = (sinceAlert <= 6 ? 2 : sinceAlert <= 15 ? 1 : 0) + (investigated ? 1 : 0) +
      (R.comms.customers && R.comms.customers.good ? 1 : 0) + (R.comms.ceo && R.comms.ceo.good ? 1 : 0);
    R.score = score;
    const grade = score >= 5 ? '🏆 Excellent incident lead' : score >= 3 ? '👍 Solid — with things to improve' : '📚 Customers felt that one';
    const end = el('roomEnd');
    end.hidden = false;
    end.innerHTML = '<h3>' + grade + '</h3>' +
      '<div class="end-figures"><div><span>Customers affected for</span><strong>' + mins + ' min</strong></div><div><span>Time from alert to fix</span><strong>' + sinceAlert + ' min</strong></div>' +
      '<div><span>Orders lost</span><strong>' + Math.round(R.lost).toLocaleString() + '</strong></div><div><span>Money lost</span><strong>' + naira(R.lost * AVG_ORDER) + '</strong></div></div>' +
      '<div class="end-cols"><div><h4>👍 Went well</h4><ul>' + (good.length ? good : ['You got payments working again.']).map(x => '<li>' + x + '</li>').join('') + '</ul></div>' +
      '<div><h4>🔧 Do better next time</h4><ul>' + (bad.length ? bad : ['Nothing major — great job!']).map(x => '<li>' + x + '</li>').join('') + '</ul></div></div>' +
      (Object.keys(R.comms).length < 2 ? '<p class="muted small">You can still send the missing update now, before moving on.</p>' : '') +
      '<button class="primary-btn" id="toPm">📚 Run the post-mortem →</button>';
    document.getElementById('toPm').addEventListener('click', () => { startPm(); showStage('pm'); });
  }

  /* ---------- Stage 3: post-mortem ---------- */
  function startPm() {
    P = { step: 0, mistakes: 0, picked: new Set() };
    el('pmSummary').innerHTML =
      '<div><strong>What happened:</strong> from 19:31 to ' + fmtTime(R.fixedAt) + ', about 38% of payments failed. Customers paying with a new card couldn\'t pay.</div>' +
      '<div><strong>Impact:</strong> about ' + Math.round(R.lost).toLocaleString() + ' orders lost (' + naira(R.lost * AVG_ORDER) + '), 212+ support tickets.</div>' +
      '<div><strong>How we stopped it:</strong> ' + { flag: 'switched off the saved_cards_v2 feature flag.', rollback: 'rolled back the 19:30 release.', hotfix: 'released an emergency fix.' }[R.fixedBy] + '</div>';
    el('pmWhys').innerHTML = '';
    el('pmActions').hidden = true;
    el('pmResult').hidden = true;
    renderWhy();
  }

  function renderWhy() {
    const box = el('pmWhys');
    const w = WHYS[P.step];
    const li = document.createElement('li');
    li.className = 'pm-why';
    li.innerHTML = '<strong>' + w.q + '</strong><div class="why-opts">' + w.options.map(([kind, text], i) => '<button class="why-opt" data-i="' + i + '">' + text + '</button>').join('') + '</div><p class="why-fb" hidden></p>';
    li.querySelectorAll('.why-opt').forEach(b => b.addEventListener('click', () => {
      const [kind, text] = w.options[Number(b.dataset.i)];
      const fb = li.querySelector('.why-fb');
      if (kind !== 'good') {
        P.mistakes++;
        b.classList.add('wrong');
        b.disabled = true;
        fb.hidden = false;
        fb.className = 'why-fb bad';
        fb.innerHTML = WHY_FEEDBACK[kind];
        return;
      }
      li.classList.add('answered', P.step === WHYS.length - 1 ? 'root' : 'ok');
      li.querySelector('.why-opts').innerHTML = '<p class="why-answer">' + (P.step === WHYS.length - 1 ? '🎯 <strong>ROOT CAUSE:</strong> ' : '→ ') + text + '</p>';
      fb.hidden = true;
      P.step++;
      if (P.step < WHYS.length) renderWhy();
      else showPmActions();
    }));
    box.appendChild(li);
  }

  function showPmActions() {
    el('pmActions').hidden = false;
    const list = el('pmActionList');
    list.innerHTML = PM_ACTIONS.map((a, i) => '<label class="pm-act"><input type="checkbox" data-i="' + i + '"> ' + a.text + '</label>').join('');
    list.querySelectorAll('input').forEach(cb => cb.addEventListener('change', () => {
      const checked = list.querySelectorAll('input:checked');
      if (checked.length > 3) { cb.checked = false; return; }
      el('pmFinish').disabled = checked.length !== 3;
      el('pmFinish').textContent = checked.length === 3 ? 'Finish the post-mortem' : 'Pick ' + (3 - checked.length) + ' more';
    }));
    el('pmFinish').disabled = true;
    el('pmFinish').textContent = 'Pick 3';
  }

  el('pmFinish').addEventListener('click', () => {
    const chosen = [...el('pmActionList').querySelectorAll('input:checked')].map(cb => PM_ACTIONS[Number(cb.dataset.i)]);
    const goodCount = chosen.filter(a => a.good).length;
    const r = el('pmResult');
    r.hidden = false;
    r.className = 'pm-result ' + (goodCount === 3 ? 'good' : goodCount === 2 ? 'meh' : 'bad');
    r.innerHTML = '<h4>' + (goodCount === 3 ? '🏆 A great post-mortem' : goodCount === 2 ? '👍 Good — one weaker action' : '🤔 These actions won\'t prevent it') + '</h4>' +
      '<ul>' + chosen.map(a => '<li>' + (a.good ? '✅ ' : '⚠️ ') + a.text + (a.good ? '' : ' <em>— ' + a.why + '</em>') + '</li>').join('') + '</ul>' +
      '<p>5 Whys: ' + (P.mistakes === 0 ? 'you went straight to the deeper causes every time. 🎯' : P.mistakes + ' shallow or blaming answer' + (P.mistakes > 1 ? 's' : '') + ' along the way — that\'s normal at first, keep practising.') + '</p>' +
      '<div class="tpm-takeaway"><strong>🎓 The full chain:</strong> an incomplete PRD (Week 4) → a missing test → a 100% release with no gradual rollout (Week 5) → 11 minutes before anyone noticed. Every week of this course is a layer of protection.</div>';
    el('pmFinish').disabled = true;
    el('pmActionList').querySelectorAll('input').forEach(cb => { cb.disabled = true; });
  });

  el('restartIncident').addEventListener('click', () => { startTriage(); showStage('triage'); });

  startTriage();
}

/* ---------------- Quiz ---------------- */
const QUIZ = [
  { q: 'Which part of a bug report helps an engineer most to make the bug happen again?',
    options: ['A dramatic title', 'Numbered steps to reproduce', 'How angry the customer is', 'The reporter\'s job title'], answer: 1,
    why: 'If the engineer can make it happen, they can usually fix it.' },
  { q: 'On a busy Friday night, 40% of payments start failing. What priority is this?',
    options: ['P0', 'P1', 'P2', 'P3'], answer: 0,
    why: 'Core money flow, many customers, right now — drop everything.' },
  { q: 'There\'s a spelling mistake on the Help page. What priority?',
    options: ['P0', 'P1', 'P2', 'P3'], answer: 3,
    why: 'Cosmetic, and nobody is blocked. It can wait in the backlog.' },
  { q: 'During an incident, what should usually happen first?',
    options: ['Write the perfect fix', 'Find out who caused it', 'Stop the damage — e.g. roll back or switch off the feature', 'Wait for it to fix itself'], answer: 2,
    why: 'Stop customers being hurt first. The perfect fix can come later, calmly.' },
  { q: 'Which is the best status update for customers?',
    options: ['"Error 500 in the payment microservice."', '"It\'s our partner\'s fault."', '"Some card payments are failing. Pay-on-delivery still works. Next update by 8:30 PM."', 'Say nothing until it\'s fixed.'], answer: 2,
    why: 'Plain words, what still works, and when the next update is.' },
  { q: 'What does a "blameless" post-mortem focus on?',
    options: ['Who made the mistake', 'What check or process was missing, so it can\'t happen again', 'How much money was lost', 'Punishing the team'], answer: 1,
    why: 'People always make mistakes. Fix the system that let the mistake through.' },
  { q: 'Why release a risky change to 5% of customers first?',
    options: ['It\'s cheaper', 'If it\'s broken, only a few people are hurt and you can switch it off quickly', 'Engineers prefer it', 'So marketing can test it'], answer: 1,
    why: 'Exactly what would have saved ChopNow — and CrowdStrike.' }
];

function initQuiz() {
  const box = document.getElementById('quizBox');
  const result = document.getElementById('quizResult');
  let answered = 0, correct = 0;

  QUIZ.forEach((item, qi) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.innerHTML = '<p class="quiz-q"><span class="quiz-num">' + (qi + 1) + '</span>' + item.q + '</p>';
    const opts = document.createElement('div');
    opts.className = 'quiz-options';
    const fb = document.createElement('p');
    fb.className = 'quiz-feedback';

    item.options.forEach((opt, oi) => {
      const b = document.createElement('button');
      b.className = 'quiz-opt';
      b.textContent = opt;
      b.addEventListener('click', () => {
        if (card.dataset.done) return;
        card.dataset.done = '1';
        answered++;
        const ok = oi === item.answer;
        if (ok) correct++;
        opts.querySelectorAll('.quiz-opt').forEach((x, xi) => {
          x.disabled = true;
          if (xi === item.answer) x.classList.add('right');
        });
        if (!ok) b.classList.add('wrong');
        fb.className = 'quiz-feedback show ' + (ok ? 'is-right' : 'is-wrong');
        fb.textContent = (ok ? '✅ Correct! ' : '❌ Not quite. ') + item.why;
        if (answered === QUIZ.length) showResult();
      });
      opts.appendChild(b);
    });

    card.appendChild(opts);
    card.appendChild(fb);
    box.appendChild(card);
  });

  function showResult() {
    result.hidden = false;
    const msg = correct === QUIZ.length ? 'Perfect score! You are ready for the assignment. 🎉'
      : correct >= 5 ? 'Great job! Review the ones you missed, then start your assignment.'
      : 'Good start. Run the incident simulation again, then retry.';
    result.innerHTML = '<strong>You scored ' + correct + ' / ' + QUIZ.length + '.</strong> ' + msg +
      ' <button class="ghost-btn" id="quizRetry">↺ Try again</button>';
    document.getElementById('quizRetry').addEventListener('click', () => {
      box.innerHTML = '';
      result.hidden = true;
      initQuiz();
    });
  }
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
    b.checked = store.get('w7_' + b.dataset.key, '0') === '1';
    b.addEventListener('change', () => { store.set('w7_' + b.dataset.key, b.checked ? '1' : '0'); update(); });
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
  ['Bug', 'When the product doesn\'t do what it should.'],
  ['Bug report / ticket', 'A written description of a bug so someone can find and fix it.'],
  ['Steps to reproduce', 'The exact numbered steps that make the bug happen.'],
  ['Reproduce', 'Making the bug happen again on purpose, to study it.'],
  ['Expected vs actual', 'What should happen, compared with what really happened.'],
  ['Severity', 'How bad a bug is for the people it affects.'],
  ['Priority', 'How soon the team will fix it.'],
  ['P0 / P1 / P2 / P3', 'Priority levels: P0 drop everything, P1 urgent, P2 normal, P3 later.'],
  ['Triage', 'Quickly sorting problems by how urgent they are.'],
  ['Incident', 'A serious live problem affecting customers.'],
  ['On-call', 'The person (or people) whose turn it is to respond to problems, even out of hours.'],
  ['Alert', 'An automatic message when a number goes wrong, e.g. errors above 5%.'],
  ['Monitoring / dashboard', 'Screens and graphs that show how the system is doing right now.'],
  ['Logs', 'The system\'s diary: a record of what happened and any errors.'],
  ['Error rate', 'The share of requests that fail, e.g. 38% of payments.'],
  ['Mitigate', 'Stop or reduce the damage, even before the real fix.'],
  ['Rollback', 'Going back to the previous working version.'],
  ['Hotfix', 'A quick fix released urgently.'],
  ['Regression', 'Something that used to work but broke after a change.'],
  ['Workaround', 'Another way for users to get the job done while a bug is unfixed.'],
  ['Root cause', 'The deepest reason a problem happened — usually something in how the team works.'],
  ['5 Whys', 'Asking "why?" again and again to get past the first, obvious answer.'],
  ['Post-mortem', 'A write-up after an incident: what happened, why, and what we\'ll change.'],
  ['Blameless', 'Focusing on systems and processes, not on punishing people.'],
  ['Status page', 'A public page telling customers whether the service is working.'],
  ['Gradual rollout', 'Releasing to a small group first (e.g. 5%), then more.'],
  ['Retry storm', 'When many systems retry at once and overload things even more.'],
  ['Backoff with jitter', 'Waiting longer between retries, plus a random delay, so everyone doesn\'t retry together.'],
  ['SLA', 'An agreed time or standard, e.g. "P0s get a response within 15 minutes".']
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
