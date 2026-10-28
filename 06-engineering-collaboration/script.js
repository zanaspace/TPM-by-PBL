/* Week 06: Working Well with Engineers
   Interactive pieces: theme, tabs, code-journey stepper, "better message"
   game, task-ordering puzzle, PR Review Desk simulation, quiz, capstone
   checklist, template copy, word bank, scroll spy. */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initJourney();
  initChoiceGame(SAY_GAME);
  initOrderGame();
  initReviewDesk();
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

const escapeHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

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

/* ---------------- Code journey stepper ---------------- */
const JOURNEY = [
  { title: '1. This is main', text: '<code>main</code> is the version of the code that real customers are using right now. Nobody edits it directly.',
    tpm: 'If something lands in main by accident, customers can see it. That\'s why there are rules around it.' },
  { title: '2. Tobi makes a branch', text: 'Tobi creates <code>feature/save-card</code>: his own copy, where he can work without affecting customers.',
    tpm: 'Branch names often include the ticket, e.g. <code>feature/ENG-204-save-card</code>, so everyone can link code to work.' },
  { title: '3. First commit', text: 'He adds the "Save this card" checkbox and saves a checkpoint: <em>"Add save-card checkbox"</em>.',
    tpm: 'Each commit has a short message. Good messages make it easy to see what changed, and why.' },
  { title: '4. Second commit', text: 'He connects the checkbox to the backend, and commits again: <em>"Save card token after payment"</em>.',
    tpm: 'Many small commits are easier to understand — and to undo — than one giant one.' },
  { title: '5. He opens a pull request', text: 'Tobi opens <strong>PR #41</strong>: "Please review my changes before they go into main." He describes what changed, how to test it, and links the ticket.',
    tpm: 'This is where you come in! The PR is your chance to check the change does what the ticket promised.' },
  { title: '6. The robots check it', text: 'Automatic checks (<strong>CI</strong>) run on every PR: tests, code style, security scans. They also build a <strong>preview</strong> link anyone can try.',
    tpm: 'Green ✅ means the checks passed. Red ❌ means something broke — don\'t merge until it\'s fixed.' },
  { title: '7. Review and fix', text: 'Ada (engineer) reviews the code and spots a missing case. Tobi fixes it with a third commit. The checks run again.',
    tpm: 'Reviews are normal, not a sign of bad work. Requesting changes politely is part of a healthy team.' },
  { title: '8. Meanwhile, main moves on', text: 'While Tobi worked, Ada\'s own change was merged into main. Tobi updates his branch with her change. If they both edited the same lines, Git asks a human to choose — a <strong>merge conflict</strong>.',
    tpm: 'Long-lived branches get more conflicts. Another reason to keep tickets and PRs small.' },
  { title: '9. Merge!', text: 'Approved and green. Tobi <strong>merges</strong> PR #41 — his branch joins main.',
    tpm: 'Many teams require at least one or two approvals and green checks before merging is even allowed.' },
  { title: '10. Live — but switched on slowly', text: 'The new code is deployed to customers, hidden behind a <strong>feature flag</strong> (Week 5). The team turns it on for 5% of customers first, then more.',
    tpm: 'Remember: "merged" isn\'t the end. Watch the numbers after release and be ready to switch it off.' }
];

function initJourney() {
  const el = id => document.getElementById(id);
  const parts = document.querySelectorAll('#gitGraph [data-step]');
  let step = 1;
  function render() {
    const s = JOURNEY[step - 1];
    parts.forEach(p => {
      const n = Number(p.dataset.step);
      p.classList.toggle('on', n <= step);
      p.classList.toggle('now', n === step);
    });
    el('jCounter').textContent = 'Step ' + step + ' of ' + JOURNEY.length;
    el('jTitle').textContent = s.title;
    el('jText').innerHTML = s.text;
    el('jTpm').innerHTML = '<strong>TPM note:</strong> ' + s.tpm;
    el('jPrev').disabled = step === 1;
    el('jNext').disabled = step === JOURNEY.length;
    el('jNext').textContent = step === JOURNEY.length ? 'Finished ✓' : 'Next step →';
  }
  el('jNext').addEventListener('click', () => { if (step < JOURNEY.length) { step++; render(); } });
  el('jPrev').addEventListener('click', () => { if (step > 1) { step--; render(); } });
  el('jReset').addEventListener('click', () => { step = 1; render(); });
  render();
}

/* ---------------- Choice game ---------------- */
const SAY_GAME = {
  id: 'say',
  names: { a: 'Message A', b: 'Message B' },
  labels: item => ({ a: 'A: ' + item.a, b: 'B: ' + item.b }),
  items: [
    { task: 'You want a "Reorder" button on the home screen.',
      a: 'Can you just add a Reorder button? Should be quick.',
      b: 'Office customers order the same lunch most days. Could we make reordering faster? How big would a Reorder button be?',
      answer: 'b', why: 'B explains the user problem and asks about size. "Just" makes work sound small and closes the door to better ideas.' },
    { task: 'An engineer explains something technical and you didn\'t follow.',
      a: 'Sorry, I didn\'t follow the part about tokens. Can you explain it like I\'m new to it?',
      b: '(Nod and say "makes sense!", then search it later.)',
      answer: 'a', why: 'Asking is a strength. Pretending leads to wrong decisions later — and engineers can usually tell.' },
    { task: 'You have 6 small questions for Ada during the day.',
      a: 'Send each question as a separate message the moment you think of it.',
      b: 'Collect them, then send one message: "When you have a break, 6 quick questions on ENG-204 👇"',
      answer: 'b', why: 'Every interruption breaks focus. Grouping questions protects deep work time.' },
    { task: 'The CEO wants saved cards AND dark mode by Friday.',
      a: 'If we do dark mode this sprint, saved cards slips a week. Which matters more for our goal?',
      b: 'The CEO says we need both by Friday, so please make it happen.',
      answer: 'a', why: 'A makes the trade-off visible and lets the right person choose. B just passes pressure down.' },
    { task: 'In a hallway chat, you and Tobi agree to change how refunds work.',
      a: 'Great, we\'ll all remember it.',
      b: 'I\'ll add the decision and the reason to the ticket now so QA and design see it too.',
      answer: 'b', why: 'Unwritten decisions get forgotten or misremembered. Write it where everyone looks.' },
    { task: 'A PR has a bug that caused 200 failed payments.',
      a: 'What check was missing that let this through? Let\'s add it.',
      b: 'Who wrote this? This should never have happened.',
      answer: 'a', why: 'Blameless questions fix the process. Blame makes people hide problems next time.' }
  ],
  done: pct => pct >= 0.8 ? 'Excellent! Engineers will love working with you. 🎉'
    : pct >= 0.5 ? 'Good! Remember: explain the why, ask about size, write things down.'
    : 'Read the 6 tips above again, then try once more.'
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

/* ---------------- Task ordering puzzle ---------------- */
const ORDER_TASKS = [
  { id: 'E', layer: 'front', text: 'Connect the Reorder button to the real API', needs: ['B', 'D'] },
  { id: 'A', layer: 'data', text: 'Store each customer\'s past orders so we can find their favourite', needs: [] },
  { id: 'F', layer: 'qa', text: 'Test it: reorder works, an item is sold out, the restaurant is closed', needs: ['E'] },
  { id: 'C', layer: 'design', text: 'Design the Reorder button and screen', needs: [] },
  { id: 'B', layer: 'back', text: 'API request: GET /v1/me/favourite-order', needs: ['A'] },
  { id: 'D', layer: 'front', text: 'Build the Reorder button in the app (using fake data for now)', needs: ['C'] }
];
const LAYER_NAMES = { data: '🗄️ Database', back: '⚙️ Backend', front: '📱 Frontend', design: '🎨 Design', qa: '🔍 Testing' };

function initOrderGame() {
  const el = id => document.getElementById(id);
  let picked = [];
  const byId = id => ORDER_TASKS.find(t => t.id === id);

  function render() {
    el('orderPool').innerHTML = '';
    ORDER_TASKS.filter(t => !picked.includes(t.id)).forEach(t => {
      const b = document.createElement('button');
      b.className = 'order-item';
      b.innerHTML = '<span class="layer l-' + t.layer + '">' + LAYER_NAMES[t.layer] + '</span>' + t.text;
      b.addEventListener('click', () => { picked.push(t.id); el('orderResult').hidden = true; render(); });
      el('orderPool').appendChild(b);
    });
    if (picked.length === ORDER_TASKS.length) el('orderPool').innerHTML = '<p class="empty-note">All tasks placed. Check your order!</p>';
    el('orderPicked').innerHTML = picked.map(id => {
      const t = byId(id);
      return '<li><button class="order-item picked" data-id="' + id + '" title="Tap to take it back"><span class="layer l-' + t.layer + '">' + LAYER_NAMES[t.layer] + '</span>' + t.text + ' <span class="undo">✕</span></button></li>';
    }).join('');
    el('orderPicked').querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      picked = picked.filter(x => x !== b.dataset.id);
      el('orderResult').hidden = true;
      render();
    }));
    el('orderCheck').disabled = picked.length !== ORDER_TASKS.length;
  }

  el('orderCheck').addEventListener('click', () => {
    const problems = [];
    picked.forEach((id, i) => {
      byId(id).needs.forEach(need => {
        if (picked.indexOf(need) > i) problems.push('“' + byId(id).text + '” needs “' + byId(need).text + '” first.');
      });
    });
    const r = el('orderResult');
    r.hidden = false;
    r.className = 'order-result ' + (problems.length ? 'bad' : 'good');
    r.innerHTML = problems.length
      ? '<strong>❌ ' + problems.length + ' task' + (problems.length > 1 ? 's are' : ' is') + ' in the wrong place:</strong><ul>' + problems.map(p => '<li>' + p + '</li>').join('') + '</ul><p>Tap a task in your list to take it back, then try again.</p>'
      : '<strong>✅ That order works!</strong> Notice that the <em>database</em> task and the <em>design</em> task need nothing — they can start on day 1, <strong>at the same time</strong>. Seeing what can happen in parallel is how a TPM makes a project faster.';
  });
  el('orderReset').addEventListener('click', () => { picked = []; el('orderResult').hidden = true; render(); });
  render();
}

/* ---------------- PR Review Desk ---------------- */
const REASONS = {
  ac: 'It doesn\'t match the acceptance criteria',
  errors: 'A user-facing error state is missing',
  checks: 'The automatic checks are failing',
  size: 'It\'s too big to review safely — split it up',
  naming: 'Some variable names could be clearer'
};

const phone = inner => '<div class="mini-phone"><div class="mp-notch"></div><div class="mp-screen">' + inner + '</div></div>';

const PRS = [
  { num: 41, title: 'Add "Save this card" checkbox at checkout', author: '👨🏾‍💻 Tobi', branch: 'feature/ENG-204-save-card',
    size: '+31 −3 in 2 files', age: 'opened 3 hours ago',
    ticket: 'ENG-204', ac: [
      'Given a customer pays with a new card, When they see the payment screen, Then a "Save this card for next time" box is shown, <strong>unticked by default</strong>.',
      'Given they tick the box and pay, When they check out next time, Then the card appears as "•••• 4081".'
    ],
    desc: 'Adds the "Save this card" checkbox and shows saved cards on the next checkout. Tested on Android and iPhone.',
    comments: [['👩🏽‍💻 Ada', 'Code looks clean. Approved from my side ✅']],
    files: [{ name: 'app/checkout/PaymentForm.tsx', lines: [
      [' ', '<CardInput onChange={setCard} />'],
      ['+', '<Checkbox label="Save this card for next time"'],
      ['+', '  defaultChecked={true}   // ticked, so more people save cards', 'flag'],
      ['+', '  onChange={setSaveCard} />'],
      [' ', '<PayButton amount={total} />']
    ] }],
    filesNote: 'Look at <code>defaultChecked={true}</code> — that means the box starts <strong>ticked</strong>.',
    checks: [['ok', 'Tests', '38 passed'], ['ok', 'Code style', 'No problems'], ['ok', 'Security scan', 'No problems']],
    preview: phone('<div class="mp-title">Pay ₦6,500</div><div class="mp-field">💳 4081 •••• •••• ••••</div><label class="mp-check"><span class="mp-box on">✓</span> Save this card for next time</label><div class="mp-btn">Pay ₦6,500</div>'),
    answer: { decision: 'changes', reasons: ['ac'] },
    explain: 'The ticket says the box must be <strong>unticked by default</strong> — customers should choose to save their card. In the code and the preview it\'s ticked. Ada approved because the code is clean, but she reviewed the <em>code</em>, not the acceptance criteria. That gap is exactly what the TPM is for.' },

  { num: 42, title: 'One-tap pay with a saved card', author: '👩🏽‍💻 Ada', branch: 'feature/ENG-205-one-tap-pay',
    size: '+64 −12 in 3 files', age: 'opened yesterday',
    ticket: 'ENG-205', ac: [
      'Given a customer has a saved card, When they reach checkout, Then "Pay ₦6,500 with •••• 4081" is shown as one button.',
      'Given the saved card has expired, When they reach checkout, Then they are asked to add a new card.',
      'When they pay, Then the event <code>checkout_completed</code> is sent with <code>method: "saved_card"</code>.'
    ],
    desc: 'One-tap payment for saved cards. Handles expired cards. Adds the checkout_completed analytics event. Preview link below.',
    comments: [['👨🏾‍💻 Tobi', 'Tested the expired-card case on staging, works 👍']],
    files: [{ name: 'app/checkout/SavedCardPay.tsx', lines: [
      ['+', 'if (card.isExpired) return <AddNewCard message="Your saved card has expired" />'],
      ['+', '<PayButton label={`Pay ${total} with •••• ${card.last4}`} />'],
      ['+', 'track("checkout_completed", { method: "saved_card" })']
    ] }],
    filesNote: 'Each acceptance criterion has matching code: one button, the expired-card case, and the analytics event.',
    checks: [['ok', 'Tests', '44 passed'], ['ok', 'Code style', 'No problems'], ['ok', 'Security scan', 'No problems']],
    preview: phone('<div class="mp-title">Checkout</div><div class="mp-line"><span>Jollof + chicken</span><span>₦6,500</span></div><div class="mp-btn">Pay ₦6,500 with •••• 4081</div><div class="mp-link">Use a different card</div>'),
    answer: { decision: 'approve', reasons: [] },
    explain: 'Everything matches: all 3 acceptance criteria, the expired-card case, green checks, a sensible size and a working preview. <strong>Approve it.</strong> A TPM who blocks good work "just in case" slows the whole team down.' },

  { num: 43, title: 'Show a screen when the payment fails', author: '🧑🏿‍💻 Musa', branch: 'feature/ENG-206-payment-failed',
    size: '+18 −2 in 1 file', age: 'opened 2 hours ago',
    ticket: 'ENG-206', ac: [
      'Given the card is declined, When the payment fails, Then the customer sees a friendly message: "Your card was declined."',
      'And they see two buttons: "Try another card" and "Pay by bank transfer".'
    ],
    desc: 'Shows the error from PayBridge when a payment fails.',
    comments: [],
    files: [{ name: 'app/checkout/PaymentResult.tsx', lines: [
      ['+', 'if (result.error) {'],
      ['+', '  return <Text>Error: {result.status} {result.error.code}</Text>', 'flag'],
      ['+', '}']
    ] }],
    filesNote: 'The screen shows the raw technical error from PayBridge — and there are no buttons.',
    checks: [['ok', 'Tests', '39 passed'], ['ok', 'Code style', 'No problems'], ['ok', 'Security scan', 'No problems']],
    preview: phone('<div class="mp-err">Error: 402 card_declined</div><div class="mp-small">&nbsp;</div>'),
    answer: { decision: 'changes', reasons: ['errors', 'ac'] },
    explain: 'The customer sees <code>Error: 402 card_declined</code> and has no way forward. The ticket asked for a friendly message and two buttons. Checks are green because the code <em>works</em> — but it doesn\'t work <em>for the customer</em>. Request changes.' },

  { num: 44, title: 'Clean up the old checkout code', author: '👨🏾‍💻 Tobi', branch: 'chore/ENG-190-checkout-cleanup',
    size: '+2,431 −1,987 in 38 files', age: 'opened 5 days ago',
    ticket: 'ENG-190', ac: [
      'The checkout works exactly as before for customers.',
      'Old, unused payment code is removed.'
    ],
    desc: 'Big tidy-up of the checkout code. Renamed lots of variables, moved files around, deleted old code. Should be no change for users.',
    comments: [['👩🏽‍💻 Ada', 'LGTM 👍 (looks good to me)'], ['🧑🏿‍💻 Musa', 'I\'d call it orderTotal, not total, but fine.']],
    files: [{ name: '38 files changed — showing 1', lines: [
      ['-', 'let x = cart.sum()'],
      ['+', 'let total = cart.sum()'],
      [' ', '… 37 more files, 4,418 changed lines …']
    ] }],
    filesNote: 'Over 4,400 changed lines in the most important flow in the app. Ada\'s "looks good" came just minutes after it opened — nobody can review that much properly.',
    checks: [['ok', 'Tests', '41 passed'], ['ok', 'Code style', 'No problems'], ['ok', 'Security scan', 'No problems']],
    preview: phone('<div class="mp-title">Checkout</div><div class="mp-line"><span>Jollof + chicken</span><span>₦6,500</span></div><div class="mp-btn">Pay ₦6,500</div><div class="mp-small">Looks the same as before.</div>'),
    answer: { decision: 'changes', reasons: ['size'] },
    explain: 'Tech-debt clean-up is great (Week 5!), but 38 files and 4,400 lines in <strong>payments</strong> is too risky to review in one go — the quick "LGTM" proves it. Ask to split it into smaller PRs. Variable names (orderTotal vs total) are for engineers to settle, not you.' },

  { num: 45, title: 'Send the "card_saved" analytics event', author: '🧑🏿‍💻 Musa', branch: 'feature/ENG-207-card-saved-event',
    size: '+9 −0 in 1 file', age: 'opened 1 hour ago',
    ticket: 'ENG-207', ac: [
      'When a customer saves a card, Then the event <code>card_saved</code> is sent to analytics.'
    ],
    desc: 'Adds the card_saved event. Tiny change. Can someone approve quickly? I want it in today\'s release.',
    comments: [['🧑🏿‍💻 Musa', 'Tests failing is just a flaky test, please ignore 🙏']],
    files: [{ name: 'app/checkout/saveCard.ts', lines: [
      ['+', 'track("card_saved", { last4: card.last4 })']
    ] }],
    filesNote: 'The change itself matches the ticket. But look at the Checks tab.',
    checks: [['ok', 'Code style', 'No problems'], ['bad', 'Tests', '2 failed, 37 passed'], ['ok', 'Security scan', 'No problems']],
    preview: phone('<div class="mp-small">No visible change — this sends data in the background.</div>'),
    answer: { decision: 'changes', reasons: ['checks'] },
    explain: 'The change is small and correct, but <strong>2 tests are failing</strong>. "It\'s just flaky" might be true — or might hide a real bug. Ask Musa to re-run or fix the test first. If the team gets used to ignoring red checks, a real problem will be ignored one day.' }
];

function initReviewDesk() {
  const el = id => document.getElementById(id);
  const results = {};             // PR number → { score: 1 | 0.5 | 0 }
  const seen = {};                // PR number → Set of tabs viewed
  let current = PRS[0].num, tab = 'overview';
  const prOf = n => PRS.find(p => p.num === n);

  function renderInbox() {
    el('inboxList').innerHTML = PRS.map(p => {
      const r = results[p.num];
      const icon = !r ? '🟢' : r.score === 1 ? '✅' : r.score > 0 ? '🟡' : '❌';
      return '<button class="inbox-item' + (p.num === current ? ' active' : '') + (r ? ' reviewed' : '') + '" data-num="' + p.num + '">' +
        '<span class="ib-icon">' + icon + '</span><span class="ib-body"><strong>#' + p.num + ' ' + p.title + '</strong><span>' + p.author + ' · ' + p.size + '</span></span></button>';
    }).join('');
    el('inboxList').querySelectorAll('.inbox-item').forEach(b => b.addEventListener('click', () => open(Number(b.dataset.num))));
    el('deskScore').textContent = Object.keys(results).length + ' / ' + PRS.length + ' reviewed';
  }

  function open(num) {
    current = num;
    tab = 'overview';
    renderInbox();
    renderPr();
    if (window.innerWidth < 960) el('prView').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderPr() {
    const p = prOf(current);
    if (!seen[p.num]) seen[p.num] = new Set();
    seen[p.num].add(tab);
    const r = results[p.num];
    el('prState').textContent = r ? (r.decision === 'approve' ? '🟣 Approved' : r.decision === 'changes' ? '🟠 Changes requested' : '⚪ Left to engineers') : '🟢 Open';
    el('prTitle').textContent = '#' + p.num + ' ' + p.title;
    el('prMeta').innerHTML = '<span>' + p.author + '</span><span><code>' + p.branch + '</code> → <code>main</code></span><span>' + p.size + '</span><span>' + p.age + '</span>';
    document.querySelectorAll('.pr-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
      t.classList.toggle('visited', seen[p.num].has(t.dataset.tab));
      if (t.dataset.tab === 'checks') t.innerHTML = (p.checks.some(c => c[0] === 'bad') ? '❌' : '🤖') + ' Checks';
    });

    let html = '';
    if (tab === 'overview') {
      html = '<div class="ov-desc"><h5>What the engineer wrote</h5><p>' + p.desc + '</p></div>' +
        '<div class="ov-ticket"><h5>🎫 Linked ticket ' + p.ticket + ' — acceptance criteria</h5><ul>' + p.ac.map(a => '<li>' + a + '</li>').join('') + '</ul></div>' +
        '<div class="ov-comments"><h5>💬 Comments</h5>' + (p.comments.length ? p.comments.map(c => '<div class="cm"><strong>' + c[0] + '</strong><p>' + c[1] + '</p></div>').join('') : '<p class="muted small">No comments yet.</p>') + '</div>';
    } else if (tab === 'files') {
      html = p.files.map(f => '<div class="diff"><div class="diff-name">📄 ' + f.name + '</div><pre class="diff-code">' +
        f.lines.map(([sign, code, flag]) => '<span class="dl dl-' + (sign === '+' ? 'add' : sign === '-' ? 'del' : 'ctx') + (flag ? ' dl-flag' : '') + '"><span class="dl-sign">' + sign + '</span>' + escapeHtml(code) + '</span>').join('') +
        '</pre></div>').join('') + '<p class="files-note">🔎 ' + p.filesNote + '</p>' +
        '<p class="muted small">You don\'t need to understand every line. Look for things that affect customers.</p>';
    } else if (tab === 'checks') {
      html = '<div class="checks">' + p.checks.map(([s, name, detail]) => '<div class="check-row ' + s + '"><span>' + (s === 'ok' ? '✅' : '❌') + '</span><strong>' + name + '</strong><span>' + detail + '</span></div>').join('') + '</div>' +
        '<p class="muted small">These run automatically on every PR (this is <strong>CI</strong>). They check that the code works — not that it does what customers need.</p>';
    } else {
      html = '<div class="preview-wrap">' + p.preview + '<p class="muted small">This is the preview link the robots built. Try it like a customer would.</p></div>';
    }
    el('prPanel').innerHTML = html;
    el('seenNote').textContent = r ? '' : 'You\'ve looked at ' + seen[p.num].size + ' of 4 tabs' + (seen[p.num].size < 4 ? ' — a careful TPM checks them all.' : '. Ready to decide!');

    // Decision area
    el('prDecide').hidden = !!r;
    el('reasonBox').hidden = true;
    const v = el('prVerdict');
    v.hidden = !r;
    if (r) {
      v.className = 'pr-verdict ' + (r.score === 1 ? 'good' : r.score > 0 ? 'meh' : 'bad');
      v.innerHTML = '<h4>' + (r.score === 1 ? '✅ Great call!' : r.score > 0 ? '🟡 Partly right' : '❌ Not the best call') + '</h4>' +
        '<p><strong>You chose:</strong> ' + r.label + '</p><p>' + p.explain + '</p>' +
        (nextOpen() ? '<button class="primary-btn" id="nextPr">Next PR →</button>' : '');
      const nb = document.getElementById('nextPr');
      if (nb) nb.addEventListener('click', () => open(nextOpen()));
    }
  }

  function nextOpen() {
    const p = PRS.find(x => !results[x.num]);
    return p ? p.num : null;
  }

  document.querySelectorAll('.pr-tab').forEach(t => t.addEventListener('click', () => { tab = t.dataset.tab; renderPr(); }));

  // Decisions
  document.querySelectorAll('.decide-btn').forEach(b => b.addEventListener('click', () => {
    const d = b.dataset.decision;
    if (d === 'changes') {
      el('reasonBox').hidden = false;
      el('reasonList').innerHTML = Object.entries(REASONS).map(([k, t]) => '<button class="reason-btn" data-reason="' + k + '">' + t + '</button>').join('');
      el('reasonList').querySelectorAll('.reason-btn').forEach(rb => rb.addEventListener('click', () => decide('changes', rb.dataset.reason)));
      return;
    }
    decide(d);
  }));

  function decide(decision, reason) {
    const p = prOf(current);
    const a = p.answer;
    let score = 0;
    if (decision === a.decision && (decision !== 'changes' || a.reasons.includes(reason))) score = 1;
    else if (decision === 'changes' && a.decision === 'changes') score = 0.5;                 // right call, wrong reason
    else if (decision === 'leave' && a.decision === 'changes' && a.reasons[0] !== 'ac' && a.reasons[0] !== 'errors') score = 0.5; // engineers might catch it
    else if (decision === 'leave' && a.decision === 'approve') score = 0.5;                  // harmless, but you could have approved
    const label = decision === 'approve' ? '✅ Approve' : decision === 'leave' ? '👩🏽‍💻 Leave it to the engineers' : '💬 Request changes — "' + REASONS[reason] + '"';
    results[p.num] = { decision, score, label };
    renderInbox();
    renderPr();
    if (Object.keys(results).length === PRS.length) showSummary();
  }

  function showSummary() {
    const total = Object.values(results).reduce((s, r) => s + r.score, 0);
    const box = el('deskSummary');
    box.hidden = false;
    const msg = total >= 4.5 ? '🏆 Outstanding. You caught what the robots and reviewers missed — and didn\'t block good work.'
      : total >= 3 ? '👍 Good reviewing. Look again at the ones you missed — especially the Preview and Checks tabs.'
      : '📚 Keep practising. A TPM\'s review is about acceptance criteria, user-facing errors, checks, size and the preview.';
    box.innerHTML = '<h3>📊 Your review score: ' + total + ' / ' + PRS.length + '</h3><p>' + msg + '</p>' +
      '<ul>' + PRS.map(p => '<li><span>#' + p.num + ' ' + p.title + '</span><span>' + (results[p.num].score === 1 ? '✅' : results[p.num].score > 0 ? '🟡' : '❌') + '</span></li>').join('') + '</ul>' +
      '<div class="tpm-takeaway"><strong>🎓 Notice:</strong> 3 of the 4 PRs with a problem had <strong>all-green checks</strong>. Robots check that code works; engineers check that code is good. <strong>You</strong> check that it does what customers were promised.</div>' +
      '<button class="ghost-btn" id="deskReset">↺ Review them again</button>';
    document.getElementById('deskReset').addEventListener('click', () => {
      Object.keys(results).forEach(k => delete results[k]);
      Object.keys(seen).forEach(k => delete seen[k]);
      box.hidden = true;
      open(PRS[0].num);
    });
  }

  renderInbox();
  renderPr();
}

/* ---------------- Quiz ---------------- */
const QUIZ = [
  { q: 'What is a branch in Git?',
    options: ['A type of server', 'Your own copy of the code to work on safely', 'A list of bugs', 'A meeting'], answer: 1,
    why: 'Branches let engineers change things without touching the code customers use (main).' },
  { q: 'What is a pull request (PR)?',
    options: ['Asking a teammate for money', 'A request to review changes before they are merged into main', 'Deleting old code', 'A customer complaint'], answer: 1,
    why: 'It\'s "please check my work" — the moment for review, automatic checks and TPM checks.' },
  { q: 'A PR shows a red ❌ next to "Tests". What does that mean?',
    options: ['The PR is approved', 'An automatic test failed — don\'t merge yet', 'The designer disliked it', 'Nothing important'], answer: 1,
    why: 'Red checks must be fixed (or properly explained) before merging.' },
  { q: 'Which PR comment is most useful from a TPM?',
    options: ['"Rename total to orderTotal."', '"Use a different design pattern here."', '"The ticket says the box should be unticked by default, but it\'s ticked."', '"Add more spaces on line 12."'], answer: 2,
    why: 'TPMs check acceptance criteria and user impact. Naming and style are for engineers and robots.' },
  { q: 'Why do teams prefer small pull requests?',
    options: ['They look nicer', 'They are faster to review and fewer problems are missed', 'Git can\'t handle big ones', 'Managers like counting them'], answer: 1,
    why: 'A huge PR gets a quick "LGTM" — and bugs slip through.' },
  { q: 'Which message is best to send an engineer?',
    options: ['"Can you just add it quickly?"', '"Customers drop off at payment. Can we look at options together? What would each cost?"', '"The CEO wants it, so do it."', '"Why is this taking so long?"'], answer: 1,
    why: 'It brings the problem, invites their ideas, and asks about trade-offs.' },
  { q: 'The app team is waiting for the backend API. What helps them start now?',
    options: ['Nothing — they must wait', 'Agree the API request first, then build with fake (mock) data', 'Skip the backend', 'Let them work on something random'], answer: 1,
    why: 'An agreed API contract (Week 3) lets frontend and backend be built in parallel.' }
];

function initQuiz() {
  // Rendering, saved answers and scoring live in ../access.js
  TPMQuiz.render(QUIZ, { low: "Good start. Try the PR Review Desk again, then retry." });
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
    b.checked = store.get('w6_' + b.dataset.key, '0') === '1';
    b.addEventListener('change', () => { store.set('w6_' + b.dataset.key, b.checked ? '1' : '0'); update(); });
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
  ['Git', 'A tool that keeps every version of the code, so many people can work on it safely.'],
  ['Repository (repo)', 'The folder holding a project\'s code and its full history.'],
  ['Branch', 'A separate copy of the code where an engineer works without affecting main.'],
  ['main', 'The branch with the code customers use.'],
  ['Commit', 'A save point: a small change plus a short message explaining it.'],
  ['Push', 'Sending your commits from your laptop up to the shared repo.'],
  ['Pull request (PR)', 'A request for others to review your changes before they join main.'],
  ['Merge request (MR)', 'GitLab\'s name for a pull request.'],
  ['Merge', 'Joining a branch\'s changes into another branch, usually main.'],
  ['Merge conflict', 'When two people changed the same lines, and a human must choose what to keep.'],
  ['Code review', 'Teammates read the code to catch problems before it is merged.'],
  ['Approve', 'A reviewer saying "this is ready to merge".'],
  ['Request changes', 'A reviewer saying "please fix these things first".'],
  ['LGTM', '"Looks good to me" — a quick approval. Be careful when it comes too fast on a huge PR!'],
  ['CI (Continuous Integration)', 'Robots that automatically test and check every change.'],
  ['CD (Continuous Delivery)', 'Automatically getting checked code ready to release, or released.'],
  ['Checks / pipeline', 'The list of automatic steps run on each PR: tests, style, security.'],
  ['Test', 'Code that checks other code does what it should.'],
  ['Flaky test', 'A test that sometimes passes and sometimes fails for no clear reason.'],
  ['Preview / staging', 'A safe copy of the app where changes can be tried before customers see them.'],
  ['Production', 'The real, live app that customers use.'],
  ['Feature flag', 'An on/off switch to release new code to some or all customers.'],
  ['Mock data', 'Fake data used to build or test something before the real thing is ready.'],
  ['Dependency', 'A task or system that must be ready before another can be finished.'],
  ['Decision record', 'A short note saying what was decided, when, and why.'],
  ['Async', 'Working without everyone being online at the same time — through writing.'],
  ['Ticket', 'One piece of work in a tool like Jira or Linear.']
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
