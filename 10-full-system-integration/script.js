/* Week 10: Putting It All Together
   Interactive pieces: theme, tabs, wait-or-background game, the order journey
   simulation (design → failure plan → 5 orders drawn as sequence diagrams),
   quiz, capstone checklist, template copy, word bank, scroll spy. */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initChoiceGame(WAIT_GAME);
  initJourneySim();
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
const WAIT_GAME = {
  id: 'wait',
  names: { wait: 'Wait for it', bg: 'Background' },
  items: [
    { task: 'Checking your password when you log in', answer: 'wait', why: 'You can\'t go in until we know it\'s you.' },
    { task: 'Sending a "welcome" email after you sign up', answer: 'bg', why: 'Nobody needs to stare at a spinner for an email. Let them start using the app.' },
    { task: 'Confirming a bank transfer went through', answer: 'wait', why: 'People need to know their money moved before they leave the screen.' },
    { task: 'Making small versions of the photo you just uploaded', answer: 'bg', why: 'Show the photo straight away and do the resizing quietly afterwards.' },
    { task: 'Checking a seat is still free before you pay for it', answer: 'wait', why: 'If it\'s gone, you need to know now — before paying.' },
    { task: 'Creating your monthly statement as a PDF', answer: 'bg', why: 'It can take a while. Say "We\'ll notify you when it\'s ready".' },
    { task: 'Telling the restaurant about your order', answer: 'bg', why: 'The kitchen may take a minute to accept. Show "Waiting for the restaurant…" progress instead of freezing the screen.' }
  ],
  done: pct => pct >= 0.8 ? 'Excellent! You design flows that feel fast. 🎉'
    : pct >= 0.5 ? 'Good! Ask: does the person need this answer before they can carry on?'
    : 'Read the two boxes above again, then try once more.'
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

/* ---------------- Order journey simulation ---------------- */
const LANES = [
  { id: 'app', label: '📱 App' }, { id: 'chop', label: '⚙️ ChopNow' }, { id: 'pay', label: '💳 PayBridge' },
  { id: 'rest', label: '🍳 Restaurant' }, { id: 'rider', label: '🛵 Riders' }, { id: 'msg', label: '💬 SMS' }
];

// Each step: how long it takes (seconds) if the customer has to wait for it
const STEPS = [
  { id: 'price', icon: '🧾', name: 'Check the price and that the restaurant is open', secs: 0.4, best: 'wait',
    why: { wait: 'Right — Amaka must see the real price before paying.', bg: 'If this happens later, Amaka might pay an old price, or order from a closed restaurant.' } },
  { id: 'pay', icon: '💳', name: 'Charge the card with PayBridge', secs: 2.5, best: 'wait',
    why: { wait: 'Right — she needs to know the payment worked before we say "confirmed".', bg: 'We\'d say "confirmed" before knowing if she paid. If the card fails, we take it back later — confusing!' } },
  { id: 'rest', icon: '🍳', name: 'Send to the restaurant and wait for them to accept', secs: 90, best: 'bg',
    why: { wait: 'Kitchens can take a minute or two to accept. Amaka would stare at a spinner the whole time.', bg: 'Right — confirm the payment, then show "Waiting for the restaurant…" as progress.' } },
  { id: 'rider', icon: '🛵', name: 'Find a rider', secs: 150, best: 'bg',
    why: { wait: 'Finding a rider can take minutes. Nobody should wait on a frozen screen for that.', bg: 'Right — show the rider\'s name when one is found.' } },
  { id: 'sms', icon: '💬', name: 'Send the receipt by SMS', secs: 4, best: 'bg',
    why: { wait: 'If the SMS company is slow or down, every order gets stuck waiting for it.', bg: 'Right — a receipt can arrive a few seconds later. It goes in the queue.' } },
  { id: 'stats', icon: '📊', name: 'Update the sales dashboard', secs: 1, best: 'bg',
    why: { wait: 'Amaka doesn\'t care about ChopNow\'s dashboard. Never make customers wait for internal work.', bg: 'Right — internal work belongs in the background.' } }
];

const FAILS = [
  { id: 'declined', icon: '💸', name: 'The card is declined', options: [
    { k: 'cancel', text: 'Cancel the whole order and empty the basket' },
    { k: 'good', text: 'Show a clear message, keep the basket, offer another way to pay' },
    { k: 'retry', text: 'Keep retrying the same card a few more times' } ] },
  { id: 'soldout', icon: '🚫', name: 'The restaurant says "sold out" after the card was charged', options: [
    { k: 'good', text: 'Undo steps: cancel, refund automatically, suggest similar dishes nearby' },
    { k: 'coupon', text: 'Keep the money and send a ₦500 coupon to say sorry' },
    { k: 'nothing', text: 'Do nothing automatically — the customer can contact support' } ] },
  { id: 'norider', icon: '🌧️', name: 'No rider accepts within 10 minutes', options: [
    { k: 'silent', text: 'Keep searching quietly — don\'t worry the customer' },
    { k: 'cancel', text: 'Cancel the order straight away and refund' },
    { k: 'good', text: 'Search a wider area and update the arrival time; offer cancel + refund after 25 minutes' } ] },
  { id: 'smsdown', icon: '📵', name: 'The SMS company is down', options: [
    { k: 'stop', text: 'Pause all ordering until SMS works again' },
    { k: 'good', text: 'Keep the receipt in the queue and retry; it\'s also shown in the app' },
    { k: 'skip', text: 'Skip the receipt — never send it' } ] },
  { id: 'double', icon: '👆👆', name: 'Weak network: the customer taps "Place order" twice', options: [
    { k: 'good', text: 'Idempotency key: the second tap returns the same order' },
    { k: 'two', text: 'Treat it as a second order' },
    { k: 'block', text: 'Block the account for suspicious activity' } ] }
];

const ORDERS = [
  { id: 'happy', who: 'Amaka', title: 'Amaka orders jollof — everything works' },
  { id: 'declined', who: 'Tunde', title: 'Tunde\'s card is declined' },
  { id: 'soldout', who: 'Chidi', title: 'Chidi orders the last suya — but it\'s sold out' },
  { id: 'norider', who: 'Kemi', title: 'Heavy rain: no riders nearby for Kemi' },
  { id: 'messy', who: 'Zainab', title: 'Zainab\'s bad day: weak network and the SMS company is down' }
];

const fmtWait = s => s >= 60 ? Math.round(s / 6) / 10 + ' min' : (Math.round(s * 10) / 10) + 's';

// Build the list of messages (and the outcome) for one order, from the student's design (D) and failure plan (F)
function buildOrder(order, D, F) {
  const msgs = [];
  const m = (from, to, label, type) => msgs.push({ from, to, label, type: type || 'sync' });
  const note = (at, label, type) => msgs.push({ note: true, at, label, type: type || 'note' });
  const out = { ok: true, money: true, ticket: false, text: [], wait: 0, screen: [] };
  // Phone screen text belongs to the arrow (or note) just drawn
  const say = (text, tone) => { const s = { text, tone: tone || 'info' }; msgs[msgs.length - 1].screen = s; out.screen.push(s); };
  const waitSteps = STEPS.filter(s => D[s.id] === 'wait');
  out.wait = waitSteps.reduce((t, s) => t + s.secs, 0);
  const isWait = id => D[id] === 'wait';
  let confirmed = false;
  const confirm = () => { if (!confirmed) { confirmed = true; m('chop', 'app', 'Order confirmed ✅', 'reply'); say('✅ Order confirmed', 'good'); } };

  // 1. The tap(s)
  m('app', 'chop', 'Place order (₦6,500)', 'sync');
  if (order.id === 'messy') {
    m('app', 'chop', 'Place order (2nd tap — weak network)', 'sync');
    if (F.double === 'good') note('chop', 'Same idempotency key → same order #2051', 'ok');
    else if (F.double === 'two') { note('chop', 'Treated as a new order #2052', 'bad'); out.money = false; out.ticket = true; out.text.push('❌ Zainab was <strong>charged twice</strong> for one meal. Support has to refund one.'); }
    else { m('chop', 'app', 'Account blocked ❌', 'fail'); say('⛔ Your account is blocked', 'bad'); out.ok = false; out.ticket = true; out.text.push('❌ A real customer was <strong>locked out</strong> for tapping twice on a bad network.'); return { msgs, out }; }
  }

  // 2. Price check
  note('chop', '🧾 Price & opening hours checked', isWait('price') ? 'note' : 'late');
  if (!isWait('price')) out.text.push('⚠️ The price was checked after confirming — a price change could have been missed.');

  // 3. Payment
  const charges = order.id === 'messy' && F.double === 'two' ? 2 : 1;
  const payNow = () => {
    for (let i = 0; i < charges; i++) m('chop', 'pay', 'Charge ₦6,500' + (charges > 1 ? ' (order ' + (2051 + i) + ')' : ''), isWait('pay') ? 'sync' : 'async');
    if (order.id === 'declined') {
      m('pay', 'chop', 'Declined ❌', 'fail');
      if (!isWait('pay')) { m('chop', 'app', 'Sorry — payment failed, order cancelled', 'fail'); say('😕 Payment failed — order cancelled', 'bad'); out.ok = false; out.text.push('❌ Tunde saw "confirmed" and then "cancelled" a minute later. Confusing — he isn\'t sure if he\'ll get food.'); return false; }
      if (F.declined === 'good') { m('chop', 'app', 'Card declined — try another card?', 'reply'); say('💳 Card declined. Your basket is saved — try another card?', 'warn'); m('app', 'chop', 'Pay with another card', 'sync'); m('chop', 'pay', 'Charge ₦6,500', 'sync'); m('pay', 'chop', 'Paid ✅', 'reply'); out.text.push('✅ Tunde paid with his other card in seconds. Basket kept, order saved.'); }
      else if (F.declined === 'cancel') { m('chop', 'app', 'Order cancelled', 'fail'); say('Order cancelled. Basket emptied.', 'bad'); out.ok = false; out.text.push('❌ Basket emptied. Tunde didn\'t want to search again — the sale is lost.'); return false; }
      else { for (let i = 0; i < 3; i++) m('chop', 'pay', 'Retry charge…', 'sync'); m('pay', 'chop', 'Card frozen by bank ❌', 'fail'); m('chop', 'app', 'Payment failed', 'fail'); say('Payment failed', 'bad'); out.ok = false; out.ticket = true; out.text.push('❌ Repeated tries made Tunde\'s bank freeze his card for "suspicious activity". He called support, angry.'); return false; }
      return true;
    }
    m('pay', 'chop', 'Paid ✅', 'reply');
    return true;
  };
  if (isWait('pay')) { if (!payNow()) return { msgs, out }; }

  // 4. Restaurant, rider, SMS, stats — in order, before or after "confirmed"
  const restStep = () => {
    m('chop', 'rest', isWait('rest') ? 'New order — please accept' : '📬 New order', isWait('rest') ? 'sync' : 'async');
    if (order.id === 'soldout') {
      m('rest', 'chop', 'Sorry — sold out ❌', 'fail');
      if (F.soldout === 'good') {
        m('chop', 'pay', '↩️ Refund ₦6,500', 'undo'); m('pay', 'chop', 'Refunded ✅', 'reply');
        m('chop', 'app', 'Sold out — refunded. Try Suya Hub nearby?', 'async'); say('😔 Sold out — you\'ve been refunded ₦6,500. Suya Hub (1.2 km) has suya!', 'warn');
        out.ok = true; out.text.push('✅ Undo steps ran automatically: order cancelled, ₦6,500 refunded, and a nearby option offered. Chidi ordered from Suya Hub.');
      } else if (F.soldout === 'coupon') {
        m('chop', 'app', 'Sold out — here\'s a ₦500 coupon', 'async'); say('Sold out 😔 Here\'s ₦500 off next time', 'bad');
        out.ok = false; out.money = false; out.ticket = true; out.text.push('❌ Chidi paid ₦6,500 and got a ₦500 coupon. He disputes the charge with his bank and posts about it online.');
      } else {
        note('chop', '(nothing happens)', 'bad'); say('🍳 Preparing your food…', 'info');
        out.ok = false; out.money = false; out.ticket = true; out.text.push('❌ Chidi waited an hour for food that was never coming, then called support. His refund took 5 days.');
      }
      return false;
    }
    m('rest', 'chop', 'Accepted — ready in 18 min', 'reply');
    if (!isWait('rest')) { m('chop', 'app', 'Status: cooking 🍳', 'async'); say('🍳 The restaurant is cooking your food', 'info'); }
    return true;
  };
  const riderStep = () => {
    m('chop', 'rider', isWait('rider') ? 'Find a rider (waiting…)' : '📬 Find a rider for 12:40', isWait('rider') ? 'sync' : 'async');
    if (order.id === 'norider') {
      m('rider', 'chop', 'No rider nearby ❌', 'fail');
      if (F.norider === 'good') {
        m('chop', 'rider', 'Search a wider area', 'async'); m('rider', 'chop', 'Bola assigned (+12 min)', 'reply');
        m('chop', 'app', 'New arrival time: 1:05 PM', 'async'); say('🛵 Bola is on the way — new arrival time 1:05 PM (rain delay)', 'warn');
        out.text.push('✅ Kemi\'s food was 12 minutes late — but she knew why and when. No complaint.');
      } else if (F.norider === 'cancel') {
        m('chop', 'pay', '↩️ Refund ₦6,500', 'undo'); m('chop', 'app', 'Cancelled — no riders', 'fail'); say('Order cancelled — no riders available', 'bad');
        out.ok = false; out.text.push('❌ Cancelled too early: the food was already cooked and thrown away, and a rider would have been free 5 minutes later.');
      } else {
        m('chop', 'rider', 'Keep searching… (40 min)', 'async'); say('🍳 Preparing your food… (for 40 minutes)', 'info');
        out.ok = false; out.ticket = true; out.text.push('❌ No update for 40 minutes. Kemi called support and cancelled. The food went cold on the counter.');
      }
      return out.ok;
    }
    m('rider', 'chop', 'Musa assigned', 'reply');
    if (!isWait('rider')) { m('chop', 'app', 'Status: Musa is on the way 🛵', 'async'); say('🛵 Musa is on the way', 'info'); }
    return true;
  };
  const smsStep = () => {
    m('chop', 'msg', isWait('sms') ? 'Send receipt SMS (waiting…)' : '📬 Send receipt SMS', isWait('sms') ? 'sync' : 'async');
    if (order.id === 'messy') {
      m('msg', 'chop', 'SMS company down ❌', 'fail');
      if (isWait('sms')) { m('chop', 'app', 'Still placing your order…', 'fail'); say('⏳ Placing your order… (stuck)', 'bad'); out.ok = false; out.text.push('❌ Because the order waited for the SMS, Zainab\'s order <strong>could never be confirmed</strong> while the SMS company was down.'); return false; }
      if (F.smsdown === 'good') { m('chop', 'msg', '📬 Retry later (kept in queue)', 'async'); m('msg', 'app', 'SMS receipt (15 min late)', 'async'); say('🧾 Receipt is in the app (SMS will follow)', 'info'); out.text.push('✅ The receipt waited in the queue and arrived 15 minutes later. It was in the app the whole time.'); }
      else if (F.smsdown === 'stop') { m('chop', 'app', 'Ordering paused', 'fail'); say('Ordering is paused 😕', 'bad'); out.ok = false; out.text.push('❌ All ordering stopped because receipts couldn\'t be sent. A small problem became a full outage.'); return false; }
      else { note('chop', 'Receipt dropped', 'bad'); out.text.push('⚠️ No receipt was ever sent. Zainab isn\'t sure the order went through, and messages support.'); out.ticket = true; }
      return true;
    }
    m('msg', 'app', 'SMS: your receipt', 'async');
    return true;
  };
  const statsStep = () => { note('chop', '📊 Dashboard updated', 'note'); return true; };
  const run = { rest: restStep, rider: riderStep, sms: smsStep, stats: statsStep };

  // Steps the customer waits for happen before "confirmed"
  for (const id of ['rest', 'rider', 'sms', 'stats']) if (isWait(id) && !run[id]()) return { msgs, out };
  confirm();
  if (!isWait('pay')) { if (!payNow()) return { msgs, out }; }
  for (const id of ['rest', 'rider', 'sms', 'stats']) if (!isWait(id) && !run[id]()) return { msgs, out };
  m('rider', 'app', 'Delivered 🎉', 'async');
  say('🎉 Delivered! Enjoy your food', 'good');
  if (out.wait > 10) { out.ok = false; out.text.push('⚠️ ' + ORDERS.find(o => o.id === order.id).who + ' waited ' + fmtWait(out.wait) + ' on a spinner before seeing "confirmed". Many customers give up after a few seconds.'); }
  if (!out.text.length) out.text.push('✅ Smooth: confirmed in ' + fmtWait(out.wait) + ', live updates, food delivered.');
  return { msgs, out };
}

function initJourneySim() {
  const el = id => document.getElementById(id);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const D = {}, F = {};
  let current = 0, timer = null;
  const results = {};

  function showStage(name) {
    stopAnim();
    el('stageDesign').hidden = name !== 'design';
    el('stageFail').hidden = name !== 'fail';
    el('stageRun').hidden = name !== 'run';
    const order = ['design', 'fail', 'run'];
    document.querySelectorAll('#simulation .sim-step').forEach(s => {
      s.classList.toggle('active', s.dataset.stage === name);
      s.classList.toggle('done', order.indexOf(s.dataset.stage) < order.indexOf(name));
    });
    el('simulation').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------- Stage 1: design ---------- */
  function renderDesign() {
    el('designList').innerHTML = STEPS.map(s =>
      '<div class="design-row' + (D[s.id] ? ' chosen' : '') + '"><div class="dr-name"><span class="dr-icon">' + s.icon + '</span>' + s.name + '</div>' +
      '<div class="dr-buttons"><button class="dr-btn' + (D[s.id] === 'wait' ? ' on' : '') + '" data-step="' + s.id + '" data-v="wait">⏳ Customer waits</button>' +
      '<button class="dr-btn' + (D[s.id] === 'bg' ? ' on' : '') + '" data-step="' + s.id + '" data-v="bg">📬 Background</button></div>' +
      (D[s.id] ? '<p class="dr-why ' + (D[s.id] === s.best ? 'good' : 'bad') + '">' + (D[s.id] === s.best ? '✅ ' : '⚠️ ') + s.why[D[s.id]] + '</p>' : '') + '</div>').join('');
    el('designList').querySelectorAll('.dr-btn').forEach(b => b.addEventListener('click', () => { D[b.dataset.step] = b.dataset.v; renderDesign(); }));
    const total = STEPS.filter(s => D[s.id] === 'wait').reduce((t, s) => t + s.secs, 0);
    el('waitTotal').textContent = fmtWait(total);
    el('waitFill').style.width = Math.min(100, total / 30 * 100) + '%';
    el('waitFill').className = total > 10 ? 'bad' : total > 4 ? 'warn' : 'good';
    const done = STEPS.filter(s => D[s.id]).length;
    el('designNote').textContent = done < STEPS.length ? done + ' of ' + STEPS.length + ' decided' : 'All decided. You can still change your mind.';
    el('toFail').disabled = done < STEPS.length;
  }
  el('toFail').addEventListener('click', () => { showStage('fail'); renderFails(); });

  /* ---------- Stage 2: failures ---------- */
  function renderFails() {
    el('failList').innerHTML = FAILS.map(f =>
      '<div class="fail-card"><h4>' + f.icon + ' ' + f.name + '</h4><div class="fail-opts">' +
      f.options.map(o => '<button class="fail-opt' + (F[f.id] === o.k ? ' on' : '') + '" data-fail="' + f.id + '" data-k="' + o.k + '">' + o.text + '</button>').join('') +
      '</div></div>').join('');
    el('failList').querySelectorAll('.fail-opt').forEach(b => b.addEventListener('click', () => { F[b.dataset.fail] = b.dataset.k; renderFails(); }));
    el('toRun').disabled = FAILS.some(f => !F[f.id]);
  }
  el('backDesign').addEventListener('click', () => showStage('design'));
  el('toRun').addEventListener('click', () => {
    Object.keys(results).forEach(k => delete results[k]);
    el('runSummary').hidden = true;
    showStage('run');
    playOrder(0);
  });
  el('redesign').addEventListener('click', () => { showStage('design'); renderDesign(); });

  /* ---------- Stage 3: run ---------- */
  el('seqHeads').innerHTML = LANES.map(l => '<span>' + l.label + '</span>').join('');
  const laneX = id => (LANES.findIndex(l => l.id === id) + 0.5) / LANES.length * 100;

  function renderTabs() {
    el('orderTabs').innerHTML = ORDERS.map((o, i) => {
      const r = results[o.id];
      const icon = !r ? '⚪' : r.ok && r.money ? '✅' : r.money ? '⚠️' : '❌';
      return '<button class="order-tab' + (i === current ? ' active' : '') + '" data-i="' + i + '">' + icon + ' ' + (i + 1) + '. ' + o.who + '</button>';
    }).join('');
    el('orderTabs').querySelectorAll('.order-tab').forEach(b => b.addEventListener('click', () => playOrder(Number(b.dataset.i))));
  }

  function rowHtml(msg, i) {
    if (msg.note) return '<div class="seq-row"><div class="seq-note n-' + msg.type + '" style="left:' + laneX(msg.at) + '%">' + msg.label + '</div></div>';
    const a = laneX(msg.from), b = laneX(msg.to);
    const left = Math.min(a, b), width = Math.abs(a - b);
    // Labels on arrows touching the outer columns are anchored inwards so they don't get cut off
    const edge = left < 10 ? ' edge-left' : left + width > 90 ? ' edge-right' : '';
    return '<div class="seq-row"><div class="seq-arrow t-' + msg.type + (b < a ? ' rev' : '') + edge + '" style="left:' + left + '%;width:' + width + '%"><span>' + (i + 1) + '. ' + msg.label + '</span></div></div>';
  }

  function stopAnim() { if (timer) clearInterval(timer); timer = null; }

  function playOrder(i) {
    stopAnim();
    current = i;
    const order = ORDERS[i];
    const { msgs, out } = buildOrder(order, D, F);
    results[order.id] = out;
    renderTabs();
    el('seqTitle').innerHTML = '<strong>Order ' + (i + 1) + ' of 5:</strong> ' + order.title;
    el('seqBody').innerHTML = '<div class="lanes">' + LANES.map(() => '<span></span>').join('') + '</div>';
    el('orderOutcome').hidden = true;
    el('phoneScreen').innerHTML = '<div class="ps-spinner"></div><div class="ps-big">Placing your order…</div><div class="ps-small">' + order.who + ' is waiting</div>';
    el('seqNext').textContent = i < ORDERS.length - 1 ? 'Next order →' : '📊 See the summary';
    let shown = 0;
    const step = () => {
      if (shown >= msgs.length) { stopAnim(); showOutcome(out, order); return; }
      el('seqBody').insertAdjacentHTML('beforeend', rowHtml(msgs[shown], shown));
      if (msgs[shown].screen) {
        const s = msgs[shown].screen;
        el('phoneScreen').innerHTML = '<div class="ps-status ps-' + s.tone + '">' + s.text + '</div>' +
          (s.tone === 'good' && s.text.includes('confirmed') ? '<div class="ps-small">You waited ' + fmtWait(out.wait) + '</div>' : '');
      }
      const body = el('seqBody');
      body.scrollTop = body.scrollHeight;
      shown++;
    };
    if (reduceMotion) { while (shown < msgs.length) step(); step(); }
    else { step(); timer = setInterval(step, 550); }
  }

  function showOutcome(out, order) {
    // If the screen never got a message, show the last state
    if (!out.screen.length) el('phoneScreen').innerHTML = '<div class="ps-status ps-bad">Still waiting…</div>';
    const box = el('orderOutcome');
    box.hidden = false;
    const good = out.ok && out.money;
    box.className = 'order-outcome ' + (good ? 'good' : out.money ? 'meh' : 'bad');
    box.innerHTML = '<h4>' + (good ? '✅ Handled well' : out.money ? '⚠️ Customer unhappy' : '❌ Money went wrong') + '</h4>' +
      '<ul>' + out.text.map(t => '<li>' + t + '</li>').join('') + '</ul>' +
      '<div class="oo-meta"><span>⏱️ Waited ' + fmtWait(out.wait) + '</span><span>' + (out.money ? '💰 Money correct' : '💸 Money wrong') + '</span><span>' + (out.ticket ? '🎧 Support ticket' : '🙂 No ticket') + '</span></div>';
    if (Object.keys(results).length === ORDERS.length) renderSummary();
  }

  el('seqReplay').addEventListener('click', () => playOrder(current));
  el('seqNext').addEventListener('click', () => {
    if (current < ORDERS.length - 1) playOrder(current + 1);
    else { stopAnim(); ORDERS.forEach(o => { if (!results[o.id]) results[o.id] = buildOrder(o, D, F).out; }); renderTabs(); renderSummary(); el('runSummary').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }); }
  });

  function renderSummary() {
    const rs = ORDERS.map(o => results[o.id]);
    const happy = rs.filter(r => r.ok && r.money).length;
    const money = rs.filter(r => r.money).length;
    const tickets = rs.filter(r => r.ticket).length;
    const wait = rs[0].wait;
    const designRight = STEPS.filter(s => D[s.id] === s.best).length;
    const failRight = FAILS.filter(f => F[f.id] === 'good').length;
    const box = el('runSummary');
    box.hidden = false;
    const grade = happy === 5 && wait <= 4 ? ['win', '🏆 A smooth, safe order journey — ready for launch.']
      : happy >= 3 ? ['meh', '👍 Mostly good — a few journeys need another look.']
      : ['lose', '🔧 Customers are getting hurt. Revisit the design and the failure plan.'];
    box.className = 'run-summary ' + grade[0];
    box.innerHTML = '<h3>' + grade[1] + '</h3>' +
      '<div class="sum-stats"><div><span>😊 Orders handled well</span><strong>' + happy + ' / 5</strong></div>' +
      '<div><span>💰 Money correct</span><strong>' + money + ' / 5</strong></div>' +
      '<div><span>🎧 Support tickets</span><strong>' + tickets + '</strong></div>' +
      '<div><span>⏱️ Wait before "confirmed"</span><strong>' + fmtWait(wait) + '</strong></div></div>' +
      '<p>Your design: <strong>' + designRight + ' of 6</strong> wait/background choices matched best practice. Your failure plan: <strong>' + failRight + ' of 5</strong> responses were the strongest option.</p>' +
      '<div class="tpm-takeaway"><strong>🎓 The pattern:</strong> wait only for what the customer must know now (price, payment), do the rest in the background with progress updates, and give every "what if it fails here?" an automatic answer — retry, fallback, or undo.</div>';
  }

  renderDesign();
}

/* ---------------- Quiz ---------------- */
const QUIZ = [
  { q: 'What does "integration" mean?',
    options: ['Writing more code', 'Making separate parts work together as one smooth experience', 'Adding more servers', 'Designing a logo'], answer: 1,
    why: 'Like a restaurant\'s opening night: each part may be fine alone, but they must work together.' },
  { q: 'In a food order, which step should the customer usually wait for?',
    options: ['The SMS receipt', 'Updating the sales dashboard', 'The payment result', 'Finding a rider'], answer: 2,
    why: 'They need to know they\'ve paid. The rest can happen in the background with progress updates.' },
  { q: 'A background job keeps failing. What should happen?',
    options: ['Retry forever, as fast as possible', 'Retry a few times, then move it to a "problem box" (dead-letter queue) and alert someone', 'Delete it quietly', 'Stop the whole app'], answer: 1,
    why: 'Retries handle short problems; the dead-letter queue stops a broken job from being lost or blocking others.' },
  { q: 'In a sequence diagram, what does a dashed arrow usually show?',
    options: ['A request', 'The answer coming back', 'A security problem', 'A database'], answer: 1,
    why: 'Solid arrow = "please do this"; dashed arrow = "here\'s the result".' },
  { q: 'The card was charged, then the restaurant rejected the order. What should happen?',
    options: ['Keep the money', 'Automatic undo steps: cancel, refund, and tell the customer', 'Wait for the customer to complain', 'Charge again'], answer: 1,
    why: 'That\'s the saga pattern: each completed step gets a matching undo step.' },
  { q: 'Which direction do you read a sequence diagram?',
    options: ['Bottom to top', 'Top to bottom, in time order', 'Right to left', 'Any order'], answer: 1,
    why: 'Time goes down the page, like a comic strip.' },
  { q: 'What stops a double tap from creating two orders?',
    options: ['A faster phone', 'An idempotency key (Week 3)', 'A bigger database', 'An SMS'], answer: 1,
    why: 'The same key means "same request" — so the second tap returns the first order.' }
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
      : 'Good start. Run the order journey simulation again, then retry.';
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
    b.checked = store.get('w10_' + b.dataset.key, '0') === '1';
    b.addEventListener('change', () => { store.set('w10_' + b.dataset.key, b.checked ? '1' : '0'); update(); });
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
  ['Integration', 'Making separate parts work together as one smooth experience.'],
  ['End-to-end', 'From the very first tap to the very last step (e.g. food delivered).'],
  ['Flow / journey', 'The sequence of steps for one action, across every system involved.'],
  ['Synchronous', 'The sender waits for the answer before carrying on.'],
  ['Asynchronous', 'The job is handed off (often to a queue) and done later; nobody waits.'],
  ['Queue', 'A waiting line for background jobs.'],
  ['Event', 'A message saying something happened, e.g. "order paid".'],
  ['Retry', 'Trying a failed step again, usually after a short wait.'],
  ['Backoff', 'Waiting a little longer before each retry.'],
  ['Dead-letter queue', 'The "problem box" for jobs that kept failing, so a person can look at them.'],
  ['Timeout', 'Giving up after waiting too long for an answer.'],
  ['Fallback', 'A Plan B when a step fails, e.g. show the receipt in the app if SMS fails.'],
  ['Circuit breaker', 'Stops calling a failing service for a while, so it doesn\'t drag everything down.'],
  ['Sequence diagram', 'A drawing of who talks to whom, in time order, top to bottom.'],
  ['Lifeline', 'A column in a sequence diagram for one system or person.'],
  ['Saga pattern', 'A way to handle a multi-step process where each step has an undo step if a later one fails.'],
  ['Compensating action', 'An undo step, like a refund after a charge.'],
  ['Idempotency key', 'A label that makes repeated requests count only once.'],
  ['Status update', 'A message showing progress, e.g. "Your rider is on the way".'],
  ['Webhook', 'When another company\'s system calls yours to say something happened (Week 3).'],
  ['Orchestration', 'One service directing the others step by step through a flow.'],
  ['API contract', 'The agreed format for requests and answers between systems.'],
  ['Edge case', 'An unusual situation, like sold-out food after payment.'],
  ['Single source of truth', 'One agreed document or place where the correct information lives.']
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
