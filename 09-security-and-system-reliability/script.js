/* Week 09: Security and Reliability
   Interactive pieces: theme, tabs, "safe or hole" game, error-budget tracker,
   the Wallet defence simulation (choose defences → 6 months → report), quiz,
   capstone checklist, template copy, word bank, scroll spy. */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initChoiceGame(SPOT_GAME);
  initErrorBudget();
  initDefenceSim();
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

const naira = n => '₦' + Math.round(n).toLocaleString('en-NG');

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
const SPOT_GAME = {
  id: 'spot',
  names: { safe: 'Safe', hole: 'Security hole' },
  items: [
    { task: 'Passwords are saved in the database exactly as the customer typed them.', answer: 'hole',
      why: 'If the database leaks, every password leaks — and people reuse them on other sites. Passwords must be hashed.' },
    { task: 'An order is only shown if it belongs to the logged-in customer.', answer: 'safe',
      why: 'That ownership check is exactly what stops the "change the number" problem.' },
    { task: 'The payment company\'s secret key is stored inside the Android app.', answer: 'hole',
      why: 'Anyone can unpack an app and find it. Secret keys stay on the server (Week 3).' },
    { task: 'Sending money out of the wallet asks for an OTP sent to the customer\'s phone.', answer: 'safe',
      why: 'Even with a stolen password, someone else doesn\'t have the phone. That\'s MFA working.' },
    { task: 'Every support agent can export all customers\' data to a spreadsheet.', answer: 'hole',
      why: 'Least privilege: if one agent is tricked, the attacker gets everyone\'s data.' },
    { task: 'The login page allows unlimited password attempts.', answer: 'hole',
      why: 'Bots can keep guessing. Limit attempts and add checks for new devices.' },
    { task: 'All traffic between the app and ChopNow uses HTTPS (the padlock).', answer: 'safe',
      why: 'HTTPS encrypts data on the way, so people on the same Wi-Fi can\'t read it.' }
  ],
  done: pct => pct >= 0.8 ? 'Excellent! You spot security holes like a pro. 🎉'
    : pct >= 0.5 ? 'Good! Ask of every feature: what if someone lies, guesses, or steals a password?'
    : 'Read the 6 attack cards again, then try once more.'
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
      feedbackEl.innerHTML = (isRight ? '✅ <strong>Correct!</strong> ' : '❌ <strong>Not quite.</strong> Answer: ' + game.names[item.answer] + '. ') + item.why;
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

/* ---------------- Error budget tracker ---------------- */
const MONTH_MIN = 31 * 24 * 60;   // January
const INCIDENTS = [
  { date: 'Jan 4', what: 'Bad release: checkout errors', min: 18 },
  { date: 'Jan 9', what: 'Database switched to its backup copy', min: 6 },
  { date: 'Jan 15', what: 'PayBridge outage: payments failing', min: 25 },
  { date: 'Jan 22', what: 'Mistake in a network setting', min: 9 }
];

function fmtDuration(min) {
  if (min >= 1440) return (min / 1440).toFixed(1) + ' days';
  if (min >= 60) return (min / 60).toFixed(1) + ' hours';
  if (min >= 1) return Math.round(min * 10) / 10 + ' min';
  return Math.round(min * 60) + ' sec';
}

function initErrorBudget() {
  const el = id => document.getElementById(id);
  const buttons = document.querySelectorAll('.slo-btn');

  function render(slo) {
    const share = 1 - slo / 100;
    const budget = MONTH_MIN * share;
    el('sloFigures').innerHTML =
      '<div><span>Allowed down per month</span><strong>' + fmtDuration(budget) + '</strong></div>' +
      '<div><span>Per week</span><strong>' + fmtDuration(7 * 1440 * share) + '</strong></div>' +
      '<div><span>Per year</span><strong>' + fmtDuration(365 * 1440 * share) + '</strong></div>';

    let used = 0, blownOn = null;
    el('monthIncidents').innerHTML = INCIDENTS.map(inc => {
      used += inc.min;
      const over = used > budget;
      if (over && !blownOn) blownOn = inc.date;
      return '<div class="inc' + (over ? ' over' : '') + '"><span class="inc-date">' + inc.date + '</span><span class="inc-what">' + inc.what + '</span><span class="inc-min">' + inc.min + ' min</span><span class="inc-left">' +
        (over ? '❌ over budget' : fmtDuration(budget - used) + ' left') + '</span></div>';
    }).join('');

    const pct = Math.min(100, used / budget * 100);
    el('budgetFill').style.width = pct + '%';
    el('budgetFill').className = 'budget-fill ' + (used > budget ? 'over' : pct > 70 ? 'busy' : 'ok');
    el('budgetText').textContent = used + ' min used of ' + fmtDuration(budget) + ' (' + Math.round(used / budget * 100) + '%)';

    let v;
    if (slo <= 99) v = ['warn', '🤔 <strong>Easy to meet — but is it good enough?</strong> 99% allows over 7 hours of downtime a month. For payments, customers would leave long before that. Targets should match what <em>users</em> need.'];
    else if (used > budget) v = ['bad', '❌ <strong>Budget used up on ' + blownOn + '.</strong> The team\'s rule: pause risky launches and spend the next sprint on reliability — for example gradual rollouts (Week 5) and a backup payment partner.' + (slo >= 99.99 ? ' (99.99% allows under 5 minutes a month — one incident blows it. Very few products need this.)' : '')];
    else if (used / budget > 0.7) v = ['warn', '⚠️ <strong>Within budget, but close.</strong> Keep launching — carefully. One more incident this month would put you over.'];
    else v = ['good', '✅ <strong>Plenty of budget left.</strong> The team can keep shipping features at full speed. That\'s the point of an error budget: reliability and speed, balanced.'];
    el('budgetVerdict').className = 'budget-verdict ' + v[0];
    el('budgetVerdict').innerHTML = v[1];
  }

  buttons.forEach(b => b.addEventListener('click', () => {
    buttons.forEach(x => x.classList.toggle('active', x === b));
    render(Number(b.dataset.slo));
  }));
  render(99.9);
}

/* ---------------- Wallet defence simulation ----------------
   Each threat is stopped by one defence; some defences only limit the damage.
   The point is prioritising with a budget, so there's no way to buy everything. */
const BUDGET = 10;
const DEFENCES = [
  { id: 'otp', icon: '📲', name: 'OTP code when logging in from a new device', cost: 3 },
  { id: 'rate', icon: '🚦', name: 'Limit login attempts and requests per user', cost: 2 },
  { id: 'owner', icon: '🔐', name: 'Check ownership on every request', cost: 2 },
  { id: 'param', icon: '🧱', name: 'Safe database queries', cost: 1 },
  { id: 'staffmfa', icon: '🔑', name: 'Security keys for all staff + least access', cost: 2 },
  { id: 'secrets', icon: '🗄️', name: 'Secret keys on the server only, changed regularly', cost: 1 },
  { id: 'encrypt', icon: '🔒', name: 'Encrypt stored data and backups; hash passwords', cost: 2 },
  { id: 'ddos', icon: '🌍', name: 'Flood protection at the edge', cost: 2 },
  { id: 'monitor', icon: '🚨', name: 'Security alerts and logging (spot problems fast)', cost: 1 }
];

const THREATS = [
  { id: 'stuff', month: 1, icon: '🔁', name: 'Bots try passwords leaked from other websites', likely: 'High', impact: 'High', full: ['otp'], partial: ['rate'],
    blocked: 'New-device logins needed an OTP sent to the real owner\'s phone. No accounts were taken over.',
    limited: 'Login limits slowed the bots down, but 300 accounts were still taken over.',
    breached: '12,000 accounts were taken over and ₦38 million was drained from wallets.',
    cost: { limited: { records: 300, money: 950000, trust: 6 }, breached: { records: 12000, money: 38000000, trust: 25 } } },
  { id: 'bola', month: 2, icon: '🔢', name: 'Someone tries other customers\' order numbers to see their details', likely: 'High', impact: 'High', full: ['owner'],
    blocked: 'Every request was checked: "does this belong to you?" The answer was no, so access was refused.',
    breached: 'Names, phone numbers, addresses and wallet history of 85,000 customers were downloaded.',
    cost: { breached: { records: 85000, money: 0, trust: 30 } } },
  { id: 'inject', month: 3, icon: '💉', name: 'Someone tries to sneak database commands into the search box', likely: 'Medium', impact: 'Critical', full: ['param'],
    blocked: 'The search box treated the text as an ordinary search. Nothing happened.',
    breached: 'The whole customer list — 210,000 emails and phone numbers — was copied.',
    cost: { breached: { records: 210000, money: 0, trust: 30 } } },
  { id: 'phish', month: 4, icon: '🎣', name: 'A fake "IT support" email tricks a support agent into giving away their password', likely: 'Medium', impact: 'Critical', full: ['staffmfa'],
    blocked: 'The attacker had the password but not the agent\'s security key. Login refused, and the agent was alerted.',
    breached: 'The attacker logged in as staff and sent ₦12 million in refunds to wallets they control.',
    cost: { breached: { records: 5000, money: 12000000, trust: 15 } } },
  { id: 'key', month: 4, icon: '🗝️', name: 'Someone searches the Android app for secret keys', likely: 'Medium', impact: 'High', full: ['secrets'],
    blocked: 'Nothing to find — secret keys live only on ChopNow\'s servers.',
    breached: 'A secret payment key was found in the app and misused to issue ₦8 million in fake refunds.',
    cost: { breached: { records: 0, money: 8000000, trust: 12 } } },
  { id: 'backup', month: 5, icon: '💾', name: 'An old database backup is accidentally left somewhere public', likely: 'Low', impact: 'High', full: ['encrypt'],
    blocked: 'The backup was encrypted and passwords were properly hashed — useless to anyone who found it.',
    breached: 'The backup was readable: 40,000 customers\' details were exposed.',
    cost: { breached: { records: 40000, money: 0, trust: 20 } } },
  { id: 'ddos', month: 6, icon: '🌊', name: 'A flood of fake traffic hits ChopNow at lunchtime', likely: 'Medium', impact: 'Medium', full: ['ddos'], partial: ['rate'],
    blocked: 'The edge network absorbed the flood. Customers noticed nothing.',
    limited: 'Rate limits held some of it back, but the app was slow and partly down for 40 minutes.',
    breached: 'ChopNow was down for 3 hours on a Saturday. No data was stolen, but ₦25 million in orders was lost.',
    cost: { limited: { downtime: 40, money: 6000000, trust: 5 }, breached: { downtime: 180, money: 25000000, trust: 12 } } }
];

const defName = id => DEFENCES.find(d => d.id === id).name;

function initDefenceSim() {
  const el = id => document.getElementById(id);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chosen = new Set();
  let runId = 0;
  let R = null;

  const spent = () => [...chosen].reduce((s, id) => s + DEFENCES.find(d => d.id === id).cost, 0);

  function showStage(name) {
    runId++;
    el('stagePlan').hidden = name !== 'plan';
    el('stageAttack').hidden = name !== 'attack';
    el('stageReport').hidden = name !== 'report';
    const order = ['plan', 'attack', 'report'];
    document.querySelectorAll('#simulation .sim-step').forEach(s => {
      s.classList.toggle('active', s.dataset.stage === name);
      s.classList.toggle('done', order.indexOf(s.dataset.stage) < order.indexOf(name));
    });
    el('simulation').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------- Stage 1: plan ---------- */
  const tone = level => ({ High: 'hi', Critical: 'crit', Medium: 'med', Low: 'low' }[level]);
  el('threatList').innerHTML = THREATS.map(t =>
    '<div class="threat"><span class="th-icon">' + t.icon + '</span><div class="th-body"><strong>' + t.name + '</strong>' +
    '<div class="th-tags"><span class="tag tag-' + tone(t.likely) + '">Likely: ' + t.likely + '</span><span class="tag tag-' + tone(t.impact) + '">Harm: ' + t.impact + '</span></div></div></div>').join('');

  function renderPlan() {
    const used = spent();
    el('pointsUsed').textContent = used;
    el('pointsFill').style.width = (used / BUDGET * 100) + '%';
    el('defenceList').innerHTML = DEFENCES.map(d => {
      const on = chosen.has(d.id);
      const afford = on || used + d.cost <= BUDGET;
      const stops = THREATS.filter(t => t.full.includes(d.id)).map(t => t.icon);
      const limits = THREATS.filter(t => (t.partial || []).includes(d.id)).map(t => t.icon);
      const covers = d.id === 'monitor' ? 'Halves the damage of any break-in' :
        (stops.length ? 'Stops ' + stops.join(' ') : '') + (limits.length ? (stops.length ? ' · ' : '') + 'Limits ' + limits.join(' ') : '');
      return '<button class="defence' + (on ? ' on' : '') + '" data-def="' + d.id + '"' + (afford ? '' : ' disabled') + '>' +
        '<span class="df-icon">' + d.icon + '</span><span class="df-body"><strong>' + d.name + '</strong><span>' + covers + '</span></span>' +
        '<span class="df-cost">' + d.cost + ' pt' + (d.cost > 1 ? 's' : '') + '</span></button>';
    }).join('');
    el('defenceList').querySelectorAll('.defence').forEach(b => b.addEventListener('click', () => {
      chosen.has(b.dataset.def) ? chosen.delete(b.dataset.def) : chosen.add(b.dataset.def);
      renderPlan();
    }));
    el('launchWallet').textContent = used ? '🚀 Launch Wallet (' + (BUDGET - used) + ' point' + (BUDGET - used === 1 ? '' : 's') + ' unused)' : '🚀 Launch Wallet with no defences';
    if (used === BUDGET) el('launchWallet').textContent = '🚀 Launch Wallet';
  }

  el('launchWallet').addEventListener('click', () => { showStage('attack'); runAttacks(); });
  el('replan').addEventListener('click', () => { showStage('plan'); renderPlan(); });

  /* ---------- Stage 2: attacks ---------- */
  async function runAttacks() {
    const my = runId;
    const pause = ms => new Promise(r => setTimeout(r, reduceMotion ? 0 : ms));
    const monitor = chosen.has('monitor');
    R = { blocked: 0, limited: 0, breached: 0, records: 0, money: 0, downtime: 0, trust: 100, results: [] };
    el('attackFeed').innerHTML = '';
    el('toReport').disabled = true;
    el('attackNote').textContent = 'Attacks are arriving…';
    const setStats = () => {
      el('aBlocked').textContent = R.blocked;
      el('aLimited').textContent = R.limited;
      el('aBreached').textContent = R.breached;
      el('aRecords').textContent = R.records.toLocaleString();
      el('aMoney').textContent = naira(R.money);
    };
    setStats();

    for (const t of THREATS) {
      await pause(1100);
      if (my !== runId) return;
      el('monthBadge').textContent = 'Month ' + t.month;
      const result = t.full.some(id => chosen.has(id)) ? 'blocked' : (t.partial || []).some(id => chosen.has(id)) ? 'limited' : 'breached';
      const c = Object.assign({ records: 0, money: 0, downtime: 0, trust: 0 }, (t.cost || {})[result] || {});
      const halved = monitor && result !== 'blocked' && t.id !== 'ddos';
      if (halved) { c.records = Math.round(c.records / 2); c.money = Math.round(c.money / 2); c.trust = Math.round(c.trust / 2); }
      R[result]++;
      R.records += c.records; R.money += c.money; R.downtime += c.downtime; R.trust = Math.max(0, R.trust - c.trust);
      R.results.push({ t, result, c, halved });
      const label = { blocked: '🛡️ Blocked', limited: '⚠️ Limited', breached: '💥 Breached' }[result];
      el('attackFeed').insertAdjacentHTML('beforeend',
        '<div class="atk atk-' + result + '"><div class="atk-month">Month ' + t.month + '</div><div class="atk-body">' +
        '<h4>' + t.icon + ' ' + t.name + '</h4><p><strong>' + label + ':</strong> ' + t[result] + '</p>' +
        (halved ? '<p class="atk-note">🚨 Security alerts spotted it within hours, not weeks — the damage was halved.</p>' : '') + '</div></div>');
      setStats();
    }
    await pause(500);
    if (my !== runId) return;
    el('attackNote').textContent = '6 months are over.';
    el('toReport').disabled = false;
  }

  el('toReport').addEventListener('click', () => { renderReport(); showStage('report'); });

  /* ---------- Stage 3: report ---------- */
  function renderReport() {
    const grade = R.records <= 1000 && R.money <= 10000000 ? ['win', '🏆 Wallet launched safely. Customers\' money and data are protected.']
      : R.records <= 50000 && R.money <= 30000000 ? ['meh', '😬 Wallet survived — but customers paid for the gaps.']
      : ['lose', '💥 A serious breach. ChopNow is in the news for the wrong reasons.'];
    el('reportBanner').className = 'end-banner ' + grade[0];
    el('reportBanner').innerHTML = '<strong>' + grade[1] + '</strong>';
    const stat = (label, value, t) => '<div class="end-stat ' + t + '"><span>' + label + '</span><strong>' + value + '</strong></div>';
    el('reportStats').innerHTML =
      stat('🛡️ Attacks blocked', R.blocked + ' / ' + THREATS.length, R.blocked >= 6 ? 'good' : R.blocked >= 4 ? 'warn' : 'bad') +
      stat('👤 Customer records exposed', R.records.toLocaleString(), R.records <= 1000 ? 'good' : R.records <= 50000 ? 'warn' : 'bad') +
      stat('💸 Money lost', naira(R.money), R.money <= 10000000 ? 'good' : R.money <= 30000000 ? 'warn' : 'bad') +
      stat('⏱️ Downtime', R.downtime + ' min', R.downtime <= 40 ? 'good' : 'bad') +
      stat('🤝 Customer trust', R.trust + '%', R.trust >= 80 ? 'good' : R.trust >= 50 ? 'warn' : 'bad');

    const good = [], bad = [];
    R.results.forEach(({ t, result, c }) => {
      if (result === 'blocked') good.push('🛡️ <strong>' + t.name + '</strong> — stopped by "' + defName(t.full.find(id => chosen.has(id))) + '".');
      else {
        const fix = t.full[0], fixCost = DEFENCES.find(d => d.id === fix).cost;
        const harm = [c.records ? c.records.toLocaleString() + ' records' : '', c.money ? naira(c.money) : '', c.downtime ? c.downtime + ' min down' : ''].filter(Boolean).join(', ');
        bad.push((result === 'limited' ? '⚠️ ' : '💥 ') + '<strong>' + t.name + '</strong> — cost ' + harm + '. "' + defName(fix) + '" (' + fixCost + ' pts) would have ' + (result === 'limited' ? 'stopped it completely.' : 'stopped it.'));
      }
    });
    if (chosen.has('monitor')) good.push('🚨 Security alerts meant break-ins were spotted fast, halving the damage.');
    else if (R.breached) bad.push('🚨 Without alerts, nobody noticed the break-ins for weeks. 1 point of monitoring would have halved the damage.');
    const left = BUDGET - spent();
    if (left > 0) bad.push('💤 You left ' + left + ' point' + (left > 1 ? 's' : '') + ' unused — that\'s security work nobody did.');
    if (chosen.has('rate') && !chosen.has('otp') && !chosen.has('ddos')) good.push('🚦 Smart: one cheap defence (rate limits) reduced <em>two</em> different threats.');
    el('reportGood').innerHTML = (good.length ? good : ['Honestly — nothing was blocked.']).map(x => '<li>' + x + '</li>').join('');
    el('reportBad').innerHTML = (bad.length ? bad : ['Nothing! Every attack was stopped. 🎉']).map(x => '<li>' + x + '</li>').join('');

    const law = el('lawBox');
    law.hidden = R.records === 0;
    if (R.records) {
      law.innerHTML = '<h3>⚖️ What the law requires now</h3><p>Customer data was exposed, so <strong>Nigeria\'s Data Protection Act 2023</strong> applies. ChopNow must tell the <strong>Nigeria Data Protection Commission within 72 hours</strong> of finding out, and tell affected customers quickly if they\'re at high risk. Large companies can be fined up to <strong>2% of their yearly income</strong> (or ₦10 million, whichever is higher). Fixing things <em>now</em> costs far more than preventing them would have.</p>';
    }
  }

  renderPlan();
}

/* ---------------- Quiz ---------------- */
const QUIZ = [
  { q: 'Authentication answers which question?',
    options: ['"What are you allowed to do?"', '"Who are you?"', '"How fast is the app?"', '"Where is the server?"'], answer: 1,
    why: 'Authentication = proving who you are (password, OTP). Authorization = what you can do.' },
  { q: 'A customer changes the order number in the address and sees a stranger\'s order. What\'s missing?',
    options: ['A faster database', 'An ownership check on every request', 'A bigger server', 'A new logo'], answer: 1,
    why: 'This is OWASP\'s #1 API risk. Always check "does this belong to the person asking?"' },
  { q: 'How should passwords be stored?',
    options: ['As typed, so support can read them', 'Hashed — scrambled one way so nobody can read them', 'In the phone app', 'In a spreadsheet'], answer: 1,
    why: 'Hashed passwords are useless to anyone who steals the database.' },
  { q: 'What protects best against stolen passwords?',
    options: ['Longer terms and conditions', 'MFA, like an OTP sent to your phone', 'A nicer login page', 'Bigger servers'], answer: 1,
    why: 'A password alone isn\'t enough if you also need the phone.' },
  { q: 'An SLO of 99.9% allows about how much downtime per month?',
    options: ['About 4 minutes', 'About 43 minutes', 'About 7 hours', 'None at all'], answer: 1,
    why: '0.1% of a 30-day month is about 43 minutes. 99.99% would be about 4 minutes.' },
  { q: 'The team has used up its error budget for the month. What usually happens?',
    options: ['Launch even more features', 'Pause risky launches and focus on reliability', 'Lower the target quietly', 'Nothing'], answer: 1,
    why: 'That\'s the deal: when reliability slips, it becomes the priority.' },
  { q: 'Under Nigeria\'s Data Protection Act 2023, after a serious data breach a company must…',
    options: ['Keep it secret', 'Tell the Nigeria Data Protection Commission within 72 hours', 'Wait a year', 'Only tell the CEO'], answer: 1,
    why: 'And tell affected people quickly if they\'re at high risk. Honesty limits the damage.' }
];

function initQuiz() {
  // Rendering, saved answers and scoring live in ../access.js
  TPMQuiz.render(QUIZ, { low: "Good start. Run the Wallet simulation again, then retry." });
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
    b.checked = store.get('w9_' + b.dataset.key, '0') === '1';
    b.addEventListener('change', () => { store.set('w9_' + b.dataset.key, b.checked ? '1' : '0'); update(); });
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
  ['Authentication', 'Proving who you are — with a password, OTP, fingerprint or "Sign in with Google".'],
  ['Authorization', 'Deciding what you\'re allowed to see and do once you\'re in.'],
  ['Password hashing', 'Scrambling passwords one way before storing them, so nobody can read them.'],
  ['MFA', 'Multi-factor authentication: two or more kinds of proof, e.g. password + phone code.'],
  ['OTP', 'One-time password: a short code sent to your phone that works once.'],
  ['Token', 'A pass the app gets after login, sent with each request. It expires.'],
  ['Role', 'A type of user with set permissions, e.g. customer, support agent, admin.'],
  ['Least privilege', 'Giving each person only the access they truly need.'],
  ['OWASP', 'A non-profit that publishes lists of the most common security risks.'],
  ['BOLA / IDOR', 'When changing an ID (like an order number) shows someone else\'s data, because ownership isn\'t checked.'],
  ['Injection', 'When typed input is wrongly treated as commands by the system.'],
  ['Credential stuffing', 'Trying passwords leaked from other websites, hoping people reused them.'],
  ['Phishing', 'Tricking people (often by email or SMS) into giving away passwords or codes.'],
  ['Secret / API key', 'A private code that lets your systems act as your company. Keep it on the server.'],
  ['Key rotation', 'Regularly replacing secret keys, so an old leaked key stops working.'],
  ['HTTPS / encryption in transit', 'Scrambling data on its way between the app and the server.'],
  ['Encryption at rest', 'Scrambling stored data, so a stolen copy can\'t be read.'],
  ['DDoS', 'A flood of fake traffic meant to knock a service offline.'],
  ['Rate limiting', 'Capping how many requests someone can make in a time window.'],
  ['Threat', 'Something that could go wrong, e.g. "someone steals staff passwords".'],
  ['Risk', 'How likely a threat is × how much harm it would do.'],
  ['Penetration test', 'Hiring experts to try to break in (with permission) and report the holes.'],
  ['Bug bounty', 'Paying outside researchers who responsibly report security problems.'],
  ['Data breach', 'When personal data is seen or taken by someone who shouldn\'t have it.'],
  ['NDPA', 'Nigeria Data Protection Act 2023 — the law on how personal data must be protected.'],
  ['SLI', 'Service Level Indicator: the number you measure, e.g. % of payments that succeed.'],
  ['SLO', 'Service Level Objective: your target for that number, e.g. 99.9%.'],
  ['SLA', 'Service Level Agreement: a promise to customers in a contract, often with money back.'],
  ['Error budget', 'The downtime your SLO allows. Used up? Reliability work comes first.'],
  ['Uptime / "nines"', 'How much of the time a service works: 99.9% is "three nines".'],
  ['Redundancy', 'Having spares (servers, partners) so one failure doesn\'t stop everything.'],
  ['Backup', 'A saved copy of data, so it can be restored after a problem.']
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
