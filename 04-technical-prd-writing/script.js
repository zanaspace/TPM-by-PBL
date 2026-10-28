/* Week 04: Writing a Technical PRD
   Interactive pieces: theme, tabs, two choice games, the PRD simulator
   (write → team review → launch week), quiz, capstone checklist,
   template copy, word bank, scroll spy. */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initChoiceGame(FRNFR_GAME);
  initChoiceGame(TEST_GAME);
  initPrdSim();
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

/* ---------------- Choice games ---------------- */
const FRNFR_GAME = {
  id: 'frnfr',
  names: { fr: 'Functional (what it does)', nfr: 'Non-functional (how well)' },
  items: [
    { task: 'Customers can choose a delivery time slot.', answer: 'fr', why: 'It describes something the product does.' },
    { task: 'The slot list loads in under 1 second for 95% of users.', answer: 'nfr', why: 'It\'s about speed — how well it works.' },
    { task: 'Restaurants can set the maximum number of orders per slot.', answer: 'fr', why: 'A feature restaurants can use — what it does.' },
    { task: 'The app keeps working with 3,000 orders between 12 and 1 PM.', answer: 'nfr', why: 'It\'s about scale — how much it can handle.' },
    { task: 'Customers get an SMS 15 minutes before their slot.', answer: 'fr', why: 'Sending an SMS is a thing the product does.' },
    { task: 'Card numbers are never stored on ChopNow\'s servers.', answer: 'nfr', why: 'It\'s about security — a quality the whole system must have.' },
    { task: 'The service is available 99.9% of the time.', answer: 'nfr', why: 'It\'s about reliability (uptime).' },
    { task: 'Customers can cancel a scheduled order up to 1 hour before.', answer: 'fr', why: 'Cancelling is an action the product allows.' }
  ],
  done: pct => pct >= 0.8 ? 'Excellent! You can tell "what" from "how well". 🎉'
    : pct >= 0.5 ? 'Nice! Tip: if it has a number about speed, scale, safety or uptime, it\'s usually non-functional.'
    : 'Look at the car example in Part 2 again, then play once more.'
};

const TEST_GAME = {
  id: 'test',
  names: { good: 'Testable', vague: 'Too vague' },
  items: [
    { task: 'The page should load quickly.', answer: 'vague', why: 'Quickly for whom? Better: "Loads in under 2 seconds on 3G for 95% of users."' },
    { task: 'Given a slot already has 10 orders, When a customer opens the slot list, Then that slot shows "Full" and can\'t be picked.', answer: 'good', why: 'Clear start, action and result. A tester can say pass or fail.' },
    { task: 'The app should be user-friendly.', answer: 'vague', why: 'Everyone means something different. Better: "A new user can schedule an order in under 60 seconds without help."' },
    { task: 'Given a payment fails, When 5 minutes pass, Then the held slot becomes available again.', answer: 'good', why: 'Exact situation, exact time, exact result.' },
    { task: 'Errors should be handled properly.', answer: 'vague', why: 'Which errors, and what is "properly"? Name the error and say what the user sees.' },
    { task: 'Given the restaurant cancels, When the cancellation is saved, Then the customer gets an SMS within 2 minutes and a full refund within 24 hours.', answer: 'good', why: 'Two clear checks with time limits.' },
    { task: 'Most users should be able to schedule an order.', answer: 'vague', why: '"Most" can\'t be checked. Who can\'t — and why?' }
  ],
  done: pct => pct >= 0.8 ? 'Brilliant — QA testers will love you. 🎉'
    : pct >= 0.5 ? 'Good! Look for numbers, exact screens and exact messages.'
    : 'Tip: if two people could disagree on "pass" or "fail", it\'s too vague.'
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

/* ---------------- PRD simulator ---------------- */
const TEAM = {
  lead: { icon: '👩🏾‍💼', name: 'Funmi', role: 'Head of Product' },
  data: { icon: '📊', name: 'Kemi', role: 'Data analyst' },
  eng: { icon: '👨🏾‍💻', name: 'Tobi', role: 'Engineer' },
  design: { icon: '🎨', name: 'Zainab', role: 'Designer' },
  qa: { icon: '🔍', name: 'Emeka', role: 'QA tester' }
};

// Each review line: [who, type ('ok' | 'question' | 'guess'), text, daysLost]
const DECISIONS = [
  { id: 'problem', part: '1. Problem', q: 'Why are we building this?',
    fix: 'Say <em>who</em> has the problem and <em>how you know</em> (survey, data, support tickets).',
    options: [
      { label: 'Users want to schedule orders for later.',
        review: [['lead', 'question', 'Which users, and how do we know? Five other projects want the same engineers. Show me evidence first.', 3]] },
      { label: 'Our competitor launched scheduling last month, so we need it too.',
        review: [['lead', 'question', 'Copying a competitor isn\'t a reason on its own. Do OUR customers actually have this problem?', 3]] },
      { good: true, label: '1 in 4 office workers abandon lunch orders because food arrives too early or too late (survey of 400 customers + support tickets, Oct 2026).',
        review: [['lead', 'ok', 'Clear problem, with evidence. Approved — let\'s do it.', 0]] }
    ] },
  { id: 'metric', part: '2. Success metric', q: 'How will we know it worked?',
    fix: 'Use a number with a start, a target and a date: "from 25% to 15% in 8 weeks".',
    options: [
      { label: 'Customers love the new feature.', flags: ['noMetric'],
        review: [['data', 'question', 'How do I measure "love"? I can\'t build a dashboard for a feeling.', 1]] },
      { good: true, label: 'Lunch abandonment falls from 25% to 15% within 8 weeks, and 90% of scheduled orders arrive within 10 minutes of the chosen time.',
        review: [['data', 'ok', 'I can measure both of those. I\'ll set up the dashboard before launch.', 0]] },
      { label: 'Lots of people use scheduling.', flags: ['noMetric'],
        review: [['data', 'question', 'How many is "lots"? And people using it doesn\'t prove we fixed late lunches.', 1]] }
    ] },
  { id: 'scope', part: '3. Scope', q: 'What is in this version?',
    fix: 'Keep version 1 small, and write a clear "NOT in this version" list.',
    options: [
      { label: 'Everything: schedule up to 30 days ahead, repeat every week, group office orders, and choose your rider.', flags: ['overScope'],
        review: [['eng', 'question', 'That\'s 4 features, not 1 — about 4 months of work, not 4 weeks. Which part matters most?', 21]] },
      { good: true, label: 'IN: today and tomorrow, in 30-minute slots. NOT in this version: repeat orders, group orders, choosing a rider.',
        review: [['eng', 'ok', 'Small and clear. We can build this in about 3 weeks.', 0]] },
      { label: 'Skip it — the team will figure it out.', doc: '', flags: ['scopeGuess'],
        review: [['design', 'guess', 'Nothing says what\'s out, so I\'ll also design "repeat every week". Users will want it, surely.', 0]] }
    ] },
  { id: 'fr', part: '4. What it does (functional)', q: 'Describe the main feature.',
    fix: 'Spell out the rules: the limit per slot, what "Full" looks like, and how long a slot is held.',
    options: [
      { label: 'Customers can pick a delivery time.', flags: ['noLimit'],
        review: [['eng', 'guess', 'No limit is mentioned, so any number of orders can go into each time slot.', 0],
                 ['qa', 'question', 'Any time at all? 3 AM? Next year? What exactly do I test?', 1]] },
      { good: true, label: 'Customers pick a 30-minute slot. Each restaurant sets a maximum number of orders per slot (default 10). Full slots show "Full". A slot is held for 5 minutes while the customer pays.',
        review: [['eng', 'ok', 'Max per slot and a 5-minute hold — very clear. I know exactly what to build.', 0]] }
    ] },
  { id: 'nfr', part: '5. How well (non-functional)', q: 'How fast and how big?',
    fix: 'Give numbers: how fast, for what share of users, at what busiest volume.',
    options: [
      { good: true, label: 'The slot list loads in under 1 second for 95% of users, with 3,000 orders between 12 and 1 PM.',
        review: [['eng', 'ok', 'I\'ll load-test with 3,000 fake lunchtime orders before we launch.', 0]] },
      { label: 'It must be fast and handle lots of users.', flags: ['noScale'],
        review: [['eng', 'guess', '"Fast" for whom? I tried 20 orders on my laptop — it\'s fast! ✅', 0],
                 ['qa', 'question', 'How fast is fast? 1 second? 5?', 1]] }
    ] },
  { id: 'ac', part: '6. Acceptance criteria', q: 'How will testers know it\'s done?',
    fix: 'Add at least one edge case, e.g. "two customers tap the last slot at the same moment".',
    options: [
      { label: 'Only the happy path: Given a free slot, When a customer picks it, Then the order is scheduled.', flags: ['noEdgeTests'],
        review: [['qa', 'guess', 'OK — I\'ll only test the happy path, then.', 0]] },
      { label: 'Skip it — QA will know what to test.', doc: '', flags: ['noEdgeTests'],
        review: [['qa', 'question', 'There\'s nothing to test against. I\'ll have to ask you what "done" means for every screen.', 2]] },
      { good: true, label: 'Happy path, plus an edge case: Given the 12:30 slot has 9 of 10 orders, When two customers tap it in the same second, Then only one gets it, and the other sees "Just taken — 12:45 is free".',
        review: [['qa', 'ok', 'I\'ll write a test that sends two orders at exactly the same moment. 👍', 0]] }
    ] },
  { id: 'fail', part: '7. What can go wrong', q: 'What if payment fails or the restaurant cancels?',
    fix: 'For each failure, say what the system does and what the customer sees.',
    options: [
      { label: 'Skip it — failures are rare.', doc: '', flags: ['noFailure'],
        review: [['design', 'question', 'What do we show if the restaurant cancels a scheduled order? Or the card is declined? I need to design those screens.', 1]] },
      { good: true, label: 'If payment fails, the held slot is released after 5 minutes. If the restaurant cancels, the customer gets an SMS within 2 minutes and an automatic refund within 24 hours.',
        review: [['design', 'ok', 'Perfect — I\'ll design the "restaurant cancelled" SMS and screen now.', 0]] }
    ] }
];

// Launch-week events. Each returns [tone, text, happinessChange, bugs, why]
const LAUNCH = [
  { day: 'Mon 11:55', title: 'Lunch rush: 3,000 office workers open the slot list at once',
    run: f => f.noScale
      ? ['bad', 'The list takes 9 seconds to load and crashes twice. About 600 people give up and order elsewhere.', -15, 1, 'Nobody tested with real numbers, because the PRD only said "fast".']
      : ['good', 'The list loads in 0.8 seconds. It was load-tested with 3,000 orders, as the PRD asked.', 0, 0] },
  { day: 'Mon 12:10', title: 'Two people tap the LAST 12:30 slot at Mama Put Express at the same moment',
    run: f => f.noLimit
      ? ['bad', 'There was no limit per slot, so the kitchen gets 23 orders for 12:30. Food arrives 50 minutes late.', -20, 1, 'The PRD never said slots have a maximum.']
      : f.noEdgeTests
        ? ['bad', 'The limit works most of the time — but nobody tested "two at the same moment". Both got the slot: 11 orders for a 10-order kitchen.', -8, 1, 'No edge-case acceptance criteria, so this was never tested.']
        : ['good', 'Only one gets it. The other instantly sees "Just taken — 12:45 is free". Your Given – When – Then tested this exact case.', 0, 0] },
  { day: 'Tue 13:00', title: 'A customer\'s card is declined after choosing a slot',
    run: f => f.noFailure
      ? ['bad', 'The slot stays "taken" forever. Nobody else can pick it, and the restaurant loses a sale.', -5, 1, 'The PRD didn\'t say what happens when a payment fails.']
      : ['good', 'After 5 minutes the hold ends and the slot is free for someone else.', 0, 0] },
  { day: 'Wed 09:00', title: 'Amala Joint closes early (power cut) with 14 scheduled orders',
    run: f => f.noFailure
      ? ['bad', 'Nobody tells the customers. They wait, then flood support. 14 angry customers and 14 manual refunds.', -12, 1, 'No plan for failures in the PRD.']
      : ['good', 'All 14 customers get an SMS within 2 minutes and an automatic refund.', 0, 0] },
  { day: 'Thu 10:00', title: 'Design review',
    run: f => f.scopeGuess
      ? ['waste', 'The designer spent 5 days on "repeat every week" — which was never planned. That work is thrown away.', 0, 0, 'The scope didn\'t say what was out.']
      : f.overScope
        ? ['warn', 'The feature launched 3 weeks late, because the team was also building repeat orders, group orders and rider choice.', -5, 0, 'Version 1 tried to do everything.']
        : ['good', 'Everyone built only what was in scope. No wasted work.', 0, 0] },
  { day: 'Fri 16:00', title: 'Leadership asks: "Did it work?"',
    run: f => f.noMetric
      ? ['bad', 'Nobody can say. There was no target, so the feature can\'t prove its value. Money for improvements is paused.', 0, 0, 'No measurable success metric.']
      : ['good', 'Lunch abandonment fell from 25% to 16% — nearly at the 15% target. Leadership approves the next phase. 📈', 0, 0] }
];

function initPrdSim() {
  const el = id => document.getElementById(id);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pause = ms => new Promise(r => setTimeout(r, reduceMotion ? 0 : ms));
  const choices = {};      // decision id → option index
  let runId = 0;           // cancels an animation if the student leaves the stage

  /* ---- Stage switching ---- */
  function showStage(name) {
    runId++;
    el('stageWrite').hidden = name !== 'write';
    el('stageReview').hidden = name !== 'review';
    el('stageLaunch').hidden = name !== 'launch';
    document.querySelectorAll('.sim-step').forEach(s => {
      const order = ['write', 'review', 'launch'];
      s.classList.toggle('active', s.dataset.stage === name);
      s.classList.toggle('done', order.indexOf(s.dataset.stage) < order.indexOf(name));
    });
    el('simulation').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---- Stage 1: write ---- */
  const box = el('decisions');
  DECISIONS.forEach(d => {
    const card = document.createElement('div');
    card.className = 'decision';
    card.dataset.id = d.id;
    card.innerHTML = '<div class="decision-head"><span class="decision-part">' + d.part + '</span><span class="decision-q">' + d.q + '</span></div>';
    const opts = document.createElement('div');
    opts.className = 'decision-opts';
    d.options.forEach((o, i) => {
      const b = document.createElement('button');
      b.className = 'opt-btn';
      b.textContent = o.label;
      b.addEventListener('click', () => { choices[d.id] = i; renderWrite(); });
      opts.appendChild(b);
    });
    card.appendChild(opts);
    box.appendChild(card);
  });

  function chosen(d) { return choices[d.id] === undefined ? null : d.options[choices[d.id]]; }

  function renderWrite() {
    box.querySelectorAll('.decision').forEach(card => {
      const d = DECISIONS.find(x => x.id === card.dataset.id);
      card.classList.toggle('answered', choices[d.id] !== undefined);
      card.querySelectorAll('.opt-btn').forEach((b, i) => b.classList.toggle('picked', choices[d.id] === i));
    });
    const count = Object.keys(choices).length;
    el('chosenCount').textContent = count;
    el('sendPrd').disabled = count < DECISIONS.length;

    let html = '<div class="doc-title">PRD: Schedule delivery for later</div>' +
      '<div class="doc-meta">ChopNow • Written by: You (TPM) • Status: Draft</div>';
    DECISIONS.forEach(d => {
      const o = chosen(d);
      const text = o ? (o.doc === undefined ? o.label : o.doc) : null;
      html += '<div class="doc-sec"><h5>' + d.part + '</h5>' +
        (text === null ? '<p class="doc-empty">Not written yet…</p>'
          : text === '' ? '<p class="doc-blank">(left empty)</p>'
          : '<p>' + text + '</p>') + '</div>';
    });
    el('prdDoc').innerHTML = html;
  }

  el('fillLazy').addEventListener('click', () => {
    DECISIONS.forEach(d => { choices[d.id] = d.options.findIndex(o => !o.good); });
    renderWrite();
  });
  el('fillStrong').addEventListener('click', () => {
    DECISIONS.forEach(d => { choices[d.id] = d.options.findIndex(o => o.good); });
    renderWrite();
  });

  /* ---- Stage 2: review ---- */
  el('sendPrd').addEventListener('click', () => { showStage('review'); runReview(); });
  el('backToWrite').addEventListener('click', () => showStage('write'));

  async function runReview() {
    const my = runId;
    const chat = el('chat');
    chat.innerHTML = '';
    el('startLaunch').disabled = true;
    let days = 0, questions = 0, guesses = 0;
    const setStats = () => {
      el('delayDays').textContent = days + (days === 1 ? ' day' : ' days');
      el('questionCount').textContent = questions;
      el('guessCount').textContent = guesses;
    };
    setStats();

    addMsg(chat, { icon: '🧑🏽‍💼', name: 'You', role: 'TPM' }, 'me', 'Hi team 👋 The PRD for "Schedule delivery for later" is ready. Please read it and shout if anything is unclear!');
    for (const d of DECISIONS) {
      for (const [who, type, text, lost] of chosen(d).review) {
        await pause(750);
        if (my !== runId) return;
        addMsg(chat, TEAM[who], type, text, d.part, lost);
        days += lost;
        if (type === 'question') questions++;
        if (type === 'guess') guesses++;
        setStats();
      }
    }
    await pause(600);
    if (my !== runId) return;
    const summary = guesses
      ? '⚠️ ' + guesses + ' team member' + (guesses > 1 ? 's are' : ' is') + ' now <strong>guessing</strong>. Guesses don\'t delay the work today — they become problems on launch day.'
      : questions ? 'Your answers to the questions cost <strong>' + days + ' days</strong>, but at least nobody is guessing.' : '🎉 No questions, no guesses. The team can start building today.';
    const note = document.createElement('div');
    note.className = 'chat-summary';
    note.innerHTML = summary;
    chat.appendChild(note);
    el('startLaunch').disabled = false;
  }

  function addMsg(chat, person, type, text, part, lost) {
    const m = document.createElement('div');
    m.className = 'msg msg-' + type;
    const tag = type === 'question' ? '<span class="msg-tag q">❓ Question · +' + lost + (lost === 1 ? ' day' : ' days') + '</span>'
      : type === 'guess' ? '<span class="msg-tag g">🎲 Guessing</span>'
      : type === 'ok' ? '<span class="msg-tag ok">✅ Clear</span>' : '';
    m.innerHTML = '<div class="msg-avatar">' + person.icon + '</div><div class="msg-body"><div class="msg-name">' + person.name +
      ' <span>' + person.role + (part ? ' · about ' + part : '') + '</span></div><p>' + text + '</p>' + tag + '</div>';
    chat.appendChild(m);
    chat.scrollTop = chat.scrollHeight;
  }

  /* ---- Stage 3: launch ---- */
  el('startLaunch').addEventListener('click', () => { showStage('launch'); runLaunch(); });
  el('improvePrd').addEventListener('click', () => showStage('write'));
  el('restartSim').addEventListener('click', () => {
    Object.keys(choices).forEach(k => delete choices[k]);
    renderWrite();
    showStage('write');
  });

  async function runLaunch() {
    const my = runId;
    const flags = {};
    DECISIONS.forEach(d => (chosen(d).flags || []).forEach(f => { flags[f] = true; }));
    const reviewDays = DECISIONS.reduce((sum, d) => sum + chosen(d).review.reduce((s, r) => s + r[3], 0), 0);
    let happy = 100, bugs = 0, waste = 0;
    const timeline = el('timeline');
    timeline.innerHTML = '';
    el('report').hidden = true;

    const setScore = () => {
      el('sHappy').textContent = happy + '%';
      el('sHappy').className = happy >= 85 ? 'good-text' : happy >= 60 ? 'warn-text' : 'bad-text';
      el('sHappyBar').style.width = happy + '%';
      el('sHappyBar').className = happy >= 85 ? 'hb-good' : happy >= 60 ? 'hb-warn' : 'hb-bad';
      el('sBugs').textContent = bugs;
      el('sLate').textContent = reviewDays + (reviewDays === 1 ? ' day' : ' days');
      el('sWaste').textContent = waste + (waste === 1 ? ' day' : ' days');
    };
    setScore();

    for (const ev of LAUNCH) {
      await pause(1100);
      if (my !== runId) return;
      const [tone, text, dHappy, dBugs, why] = ev.run(flags);
      happy = Math.max(0, happy + dHappy);
      bugs += dBugs;
      if (tone === 'waste') waste += 5;
      const item = document.createElement('div');
      item.className = 'tl-item tl-' + tone;
      item.innerHTML = '<div class="tl-day">' + ev.day + '</div><div class="tl-body"><h4>' + ev.title + '</h4><p>' +
        { good: '✅ ', bad: '❌ ', warn: '⚠️ ', waste: '🗑️ ' }[tone] + text + '</p>' +
        (why ? '<p class="tl-why">📄 Why: ' + why + '</p>' : '') + '</div>';
      timeline.appendChild(item);
      setScore();
    }

    await pause(700);
    if (my !== runId) return;
    const good = DECISIONS.filter(d => chosen(d).good).length;
    const grade = good === 7 ? ['A', 'Outstanding. Engineers trust your PRDs, and customers never noticed a thing.']
      : good >= 5 ? ['B', 'Good PRD — a few gaps slipped through to real customers.']
      : good >= 3 ? ['C', 'The team built something, but guesses and gaps hurt customers.']
      : ['D', 'The PRD left the team guessing. Most of launch week was spent firefighting.'];
    const fixes = DECISIONS.filter(d => !chosen(d).good).map(d => '<li><strong>' + d.part + ':</strong> ' + d.fix + '</li>');
    const rep = el('report');
    rep.innerHTML = '<div class="grade grade-' + grade[0] + '">' + grade[0] + '</div><p><strong>' + good + ' of 7 sections were clear.</strong> ' + grade[1] + '</p>' +
      (fixes.length ? '<h4>✏️ What to improve</h4><ul>' + fixes.join('') + '</ul>' : '<p>🏆 Nothing to fix. Now try the lazy PRD to see the difference!</p>');
    rep.hidden = false;
  }

  renderWrite();
}

/* ---------------- Quiz ---------------- */
const QUIZ = [
  { q: 'What is a PRD?',
    options: ['A piece of code', 'A document that says what to build, why, and how we\'ll know it\'s done', 'A list of bugs', 'A marketing poster'], answer: 1,
    why: 'It\'s the shared plan the whole team builds from.' },
  { q: 'Which one is a non-functional requirement?',
    options: ['Customers can cancel an order', 'Customers get an SMS when food is on the way', 'The page loads in under 2 seconds for 95% of users', 'Restaurants can upload photos'], answer: 2,
    why: 'It\'s about how well (speed), not what it does.' },
  { q: 'Which success metric is best?',
    options: ['"Users will love it"', '"Lots of people use it"', '"Checkout abandonment falls from 30% to 20% in 2 months"', '"It will be a big success"'], answer: 2,
    why: 'It has a start number, a target and a deadline — anyone can check it.' },
  { q: 'In Given – When – Then, what does "Given" describe?',
    options: ['The starting situation', 'The button the user taps', 'The final result', 'The person who wrote it'], answer: 0,
    why: 'Given = the situation before anything happens. When = the action. Then = the result.' },
  { q: 'Why write what is "out of scope"?',
    options: ['To make the PRD longer', 'So the team doesn\'t build things nobody planned', 'Because leaders like lists', 'It isn\'t needed'], answer: 1,
    why: 'Without it, people fill the gaps with their own ideas — like the designer in the simulation.' },
  { q: 'Where do most launch-day bugs come from?',
    options: ['The happy path', 'Edge cases nobody wrote down', 'The colour of buttons', 'The PRD title'], answer: 1,
    why: 'Unusual situations (two people at once, failed payments) are where systems break.' },
  { q: 'Who should a TPM check the PRD with before building starts?',
    options: ['Nobody — the TPM decides', 'Only the CEO', 'Engineers, designers, QA and data analysts', 'Only customers'], answer: 2,
    why: 'Each of them reads it differently. If any of them would have to guess, fix it first.' }
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
      : 'Good start. Play the PRD simulation again, then retry.';
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
    b.checked = store.get('w4_' + b.dataset.key, '0') === '1';
    b.addEventListener('change', () => { store.set('w4_' + b.dataset.key, b.checked ? '1' : '0'); update(); });
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
  ['PRD', 'Product Requirements Document — the plan that says what to build, why, and how we know it\'s done.'],
  ['Technical PRD', 'A PRD that also covers speed, scale, failures and how systems talk (APIs).'],
  ['Requirement', 'Something the product must do or be.'],
  ['Functional requirement (FR)', 'What the product does, e.g. "customers can cancel an order".'],
  ['Non-functional requirement (NFR)', 'How well it works: speed, scale, security, uptime.'],
  ['Acceptance criteria', 'The exact checks that prove a feature is finished.'],
  ['Given – When – Then', 'A way to write acceptance criteria: starting situation, action, expected result.'],
  ['Gherkin', 'The name engineers use for the Given – When – Then format.'],
  ['Happy path', 'The journey where everything goes right.'],
  ['Edge case', 'An unusual situation, e.g. two people booking the last slot at the same moment.'],
  ['Scope', 'What this version will include.'],
  ['Out of scope', 'What this version will NOT include — written down on purpose.'],
  ['Scope creep', 'When more and more features sneak into a project, causing delays.'],
  ['MVP', 'Minimum Viable Product — the smallest version that solves the problem and lets you learn.'],
  ['Success metric / KPI', 'A number that shows whether the feature worked.'],
  ['P95', '"For 95% of users". "Loads in 1s at P95" means 95 out of 100 users wait 1 second or less.'],
  ['Load test', 'Testing with lots of fake users at once, to see if the system copes.'],
  ['Uptime / SLA', 'How much of the time a service is working, e.g. 99.9%.'],
  ['User story', 'A short need: "As a [user], I want [thing], so that [reason]."'],
  ['Stakeholder', 'Anyone affected by the project or with a say in it.'],
  ['Assumption', 'Something you believe is true but haven\'t proven. Write it down!'],
  ['Dependency', 'Something your feature needs from another team or company.'],
  ['Race condition', 'A bug when two things happen at almost the same moment, e.g. double booking.'],
  ['QA', 'Quality Assurance — the people and process that test the product.'],
  ['Sign-off', 'When the key people formally agree the PRD is ready to build.']
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
