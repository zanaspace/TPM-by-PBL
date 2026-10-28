/* Week 03: APIs and Data Flow
   Interactive pieces: theme, tabs, request anatomy, status-code game,
   payment simulation, API playground, typing-cost demo, quiz,
   capstone checklist, template copy, word bank, scroll spy. */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initAnatomy();
  initChoiceGame(STATUS_GAME);
  initPaymentSim();
  initPlayground();
  initDebounceDemo();
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

// Pretty JSON with simple colouring for keys, strings, numbers and true/false
function highlightJson(obj) {
  const text = escapeHtml(JSON.stringify(obj, null, 2));
  return text.replace(/(&quot;(?:(?!&quot;).)*?&quot;)(\s*:)?|\b(-?\d+(?:\.\d+)?)\b|\b(true|false|null)\b/g, (m, str, colon, num, lit) => {
    if (str) return colon ? '<span class="j-key">' + str + '</span>' + colon : '<span class="j-str">' + str + '</span>';
    if (num) return '<span class="j-num">' + num + '</span>';
    return '<span class="j-lit">' + lit + '</span>';
  });
}

// Plain-English meaning of each status code used on this page
const STATUS = {
  200: ['OK', 'It worked. Here is what you asked for.'],
  201: ['Created', 'It worked, and something new was created.'],
  202: ['Accepted', 'Received — but not finished yet. The result will come later.'],
  204: ['No Content', 'It worked. There is nothing to send back.'],
  400: ['Bad Request', 'The request is wrong or something is missing. Fix it and try again.'],
  401: ['Unauthorized', '"Who are you?" The ID card (API key) is missing or wrong.'],
  402: ['Payment Required', 'The payment did not go through, e.g. the card was declined.'],
  403: ['Forbidden', '"I know who you are, but you are not allowed to do this."'],
  404: ['Not Found', 'That thing does not exist — wrong address or wrong ID.'],
  405: ['Method Not Allowed', 'That action is not allowed at this address.'],
  409: ['Conflict', 'This clashes with how things are right now.'],
  429: ['Too Many Requests', 'Slow down! Too many requests in a short time.'],
  500: ['Internal Server Error', 'The server crashed or has a bug. Not the app\'s fault.'],
  503: ['Service Unavailable', 'The service is down or too busy right now. Try again later.']
};
const statusClass = code => 's' + String(code)[0] + 'xx';

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

/* ---------------- Anatomy of a request ---------------- */
const ANATOMY = {
  method: ['1. The action (method)', '<code>GET</code> means "I want to <strong>read</strong> something". Other actions are POST (create), PATCH (change) and DELETE (remove). Like telling the waiter whether you are ordering, changing or cancelling.'],
  url: ['2. The address (endpoint)', 'Where the request goes, and what it is about. <code>/v1/restaurants</code> means "the restaurants list, version 1". Everything after the <code>?</code> is a filter: <code>area=yaba</code> means "only restaurants in Yaba".'],
  header: ['3. The ID card (header)', 'Headers are extra labels on the request. <code>Authorization</code> carries the <strong>API key</strong> — a secret code that proves who is asking. No key, or a wrong key, and the answer is <code>401</code>.'],
  status: ['4. The short answer (status code)', '<code>200 OK</code> means "it worked". The first digit tells you the story: 2 = success, 4 = the app asking made a mistake, 5 = the server had a problem.'],
  body: ['5. The message (body)', 'The actual information, written in <strong>JSON</strong> — a simple format of names and values like <code>"name": "Mama Put Express"</code>. When you create something with POST, your request has a body too.']
};

function initAnatomy() {
  const box = document.getElementById('anatomyExplain');
  const parts = document.querySelectorAll('.an-part');
  function show(key) {
    parts.forEach(p => p.classList.toggle('active', p.dataset.part === key));
    box.innerHTML = '<h4>' + ANATOMY[key][0] + '</h4><p>' + ANATOMY[key][1] + '</p>';
  }
  parts.forEach(p => p.addEventListener('click', () => show(p.dataset.part)));
  show('method');
}

/* ---------------- Choice game ---------------- */
const STATUS_GAME = {
  id: 'status',
  names: { 2: '2xx — it worked', 4: '4xx — the app made a mistake', 5: '5xx — the server had a problem' },
  items: [
    { task: 'You open "My orders" and your past orders appear.', answer: '2', why: '200 OK — you asked to read something and got it.' },
    { task: 'You sign up and your new account is created.', answer: '2', why: '201 Created — something new now exists.' },
    { task: 'You type the wrong password.', answer: '4', why: '401 Unauthorized — the system can\'t confirm who you are.' },
    { task: 'You open a link to a product that was deleted last week.', answer: '4', why: '404 Not Found — the address points to something that no longer exists.' },
    { task: 'The payment company\'s server crashes while handling your payment.', answer: '5', why: '500 Internal Server Error — the server broke. You did nothing wrong.' },
    { task: 'A buggy app sends 500 requests a second and gets blocked.', answer: '4', why: '429 Too Many Requests — it\'s the asking app\'s fault for sending too many.' },
    { task: 'You submit a sign-up form with the email box empty.', answer: '4', why: '400 Bad Request — something required is missing.' },
    { task: 'On Black Friday the shop\'s servers are so busy they can\'t answer.', answer: '5', why: '503 Service Unavailable — the server side is overloaded.' },
    { task: 'You try to edit someone else\'s Instagram caption.', answer: '4', why: '403 Forbidden — it knows who you are, but you\'re not allowed.' }
  ],
  done: pct => pct >= 0.8 ? 'Excellent! You can read status codes like an engineer. 🎉'
    : pct >= 0.5 ? 'Nice! Remember: 4xx = "for" the app to fix, 5xx = the server\'s fault.'
    : 'Read the traffic-light box above again, then play once more.'
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

/* ---------------- Payment simulation ---------------- */
const REQ = (method, url, headers, body) => ({ kind: 'request', method, url, headers, body });
const RES = (status, body, headers) => ({ kind: 'response', status, headers, body });
const HOOK = (url, headers, body) => ({ kind: 'webhook', method: 'POST', url, headers, body });
const BANK = text => ({ kind: 'bank', text });

const USER_TOKEN = 'Bearer user_token_aX93…';
const SECRET_KEY = 'sk_live_••••4f2a';
const DEBIT_ALERT = 'Debit: ₦6,500 — PAYBRIDGE*CHOPNOW';
const withKey = (headers, key) => key ? Object.assign({}, headers, { 'Idempotency-Key': key }) : headers;

const STEP = {
  tap: () => ({ from: 'phone', to: 'phone', carry: '👆 Tap "Pay"', phone: 'loading',
    title: 'You tap "Pay ₦6,500"',
    text: 'Jollof rice and chicken are in your basket. You choose your saved card and tap Pay. The app shows a spinner and gets a request ready.' }),
  appReq: key => ({ from: 'phone', to: 'backend', carry: '📨 POST /pay', phone: 'loading',
    title: 'The app asks ChopNow\'s backend to take the payment',
    text: 'The phone sends a request to ChopNow\'s <strong>own</strong> backend. It never talks to the payment company with secret keys — those stay safely on the server.',
    msg: REQ('POST', 'https://api.chopnow.ng/v1/orders/1042/pay', withKey({ Authorization: USER_TOKEN }, key),
      { amount: 650000, currency: 'NGN', card: 'saved_card_4081' }) }),
  charge: (key, auth) => ({ from: 'backend', to: 'outside', carry: '💳 POST /charges', phone: 'loading',
    title: 'The backend asks PayBridge to charge the card',
    text: 'ChopNow\'s backend sends a request to PayBridge, the payment company. It proves who it is with ChopNow\'s <strong>secret API key</strong> — like showing an ID card.',
    msg: REQ('POST', 'https://api.paybridge.com/v1/charges', withKey({ Authorization: 'Bearer ' + (auth || SECRET_KEY) }, key),
      { amount: 650000, currency: 'NGN', card: 'tok_4081', reference: 'ORD-1042' }) }),
  bankAsk: () => ({ from: 'outside', to: 'bank', carry: '🏦 Approve ₦6,500?', phone: 'loading',
    title: 'PayBridge asks your bank',
    text: 'PayBridge contacts your bank through the card network (Visa, Mastercard or Verve): "Can this card pay ₦6,500?" You don\'t need the details of this part.',
    msg: BANK('PayBridge → card network → your bank:\n"Card ending 4081 wants to pay ₦6,500 to ChopNow. Approve?"') }),
  bankYes: () => ({ from: 'bank', to: 'outside', carry: '✅ Approved', phone: 'loading', alert: DEBIT_ALERT,
    title: 'Your bank says yes and takes the money',
    text: 'There is enough money, so the bank approves and takes ₦6,500 from your account. It sends you an SMS alert (look at the phone).',
    msg: BANK('Your bank → PayBridge:\n"Approved. ₦6,500 taken from the account."') }),
  payOk: (id, headers) => ({ from: 'outside', to: 'backend', carry: '📬 200 OK', phone: 'loading',
    title: 'PayBridge answers: success!',
    text: 'PayBridge replies with status <strong>200 OK</strong> and the details of the charge, including its own ID for it.',
    msg: RES(200, { id: id || 'ch_8f2kQ', status: 'success', amount: 650000, currency: 'NGN', reference: 'ORD-1042' }, headers) }),
  appOk: () => ({ from: 'backend', to: 'phone', carry: '✅ 200 OK — paid', phone: 'success',
    title: 'The backend tells the app: paid!',
    text: 'The backend saves "order 1042 is paid" in its database, tells the restaurant to start cooking, and answers the phone.',
    msg: RES(200, { order_id: 1042, payment: 'paid', eta_minutes: 35 }) })
};
// step('charge', key, { title: … }) builds a shared step; a trailing object overrides its fields
function step(name, ...args) {
  const last = args[args.length - 1];
  const overrides = last && typeof last === 'object' ? args.pop() : {};
  return Object.assign(STEP[name](...args), overrides);
}

function buildScenario(key, opts) {
  const k = 'ord1042-a';
  switch (key) {
    case 'happy': return [
      step('tap'),
      step('appReq', k, { tip: 'Look at <code>"amount": 650000</code>. Payment APIs usually count in <strong>kobo</strong> (₦6,500 = 650,000 kobo), so there are no decimal-point mistakes.' }),
      step('charge', k, { tip: 'The secret key is like ChopNow\'s ID card. It must <strong>never</strong> be put inside the phone app, where anyone could dig it out.' }),
      step('bankAsk'), step('bankYes'), step('payOk'),
      step('appOk', { tip: '🎉 About 2 seconds, 4 systems, 2 API calls (each with an answer). Now try the other situations above.' })
    ];

    case 'declined': return [
      step('tap'), step('appReq', k), step('charge', k), step('bankAsk'),
      { from: 'bank', to: 'outside', carry: '❌ Declined', phone: 'loading',
        title: 'Your bank says no',
        text: 'There is not enough money in the account, so the bank declines. No money moves.',
        msg: BANK('Your bank → PayBridge:\n"Declined: insufficient funds."') },
      { from: 'outside', to: 'backend', carry: '📬 402 card_declined', phone: 'loading',
        title: 'PayBridge answers with an error',
        text: 'PayBridge replies <strong>402</strong> with a clear reason: <code>insufficient_funds</code>. That tells ChopNow <em>exactly</em> why it failed.',
        msg: RES(402, { error: { type: 'card_error', code: 'card_declined', reason: 'insufficient_funds', message: 'The card has insufficient funds.' } }) },
      { from: 'backend', to: 'phone', carry: '📬 402 → helpful message', phone: 'declined',
        title: 'The app shows a helpful message',
        text: 'The backend passes on a friendly message, and the app offers other ways to pay, so the sale isn\'t lost.',
        msg: RES(402, { error: { code: 'card_declined', user_message: 'Your card was declined: not enough money. Try another card or pay by bank transfer.' } }),
        tip: 'Compare "Something went wrong 😕" with "Not enough money — try another card or pay by transfer". Clear error codes let a TPM design screens that <strong>save the sale</strong>.' }
    ];

    case 'badkey': return [
      step('tap'), step('appReq', k),
      step('charge', k, 'sk_live_EXPIRED_0000', {
        title: 'The backend sends an old, expired API key',
        text: 'Someone changed the PayBridge key last night but forgot to update the backend. The request goes out with the <strong>wrong ID card</strong>.' }),
      { from: 'outside', to: 'backend', carry: '📬 401 Unauthorized', phone: 'loading',
        title: 'PayBridge refuses: "Who are you?"',
        text: 'PayBridge answers <strong>401 Unauthorized</strong>. The bank is never contacted and no money moves.',
        msg: RES(401, { error: { type: 'authentication_error', message: 'Invalid API key provided.' } }),
        tip: 'A 4xx from PayBridge means <strong>ChopNow made the mistake</strong> — not the customer.' },
      { from: 'backend', to: 'phone', carry: '📬 503 + Plan B', phone: 'unavailable',
        title: 'The app hides the tech error and offers a Plan B',
        text: 'The customer must never see "401". The backend sends a friendly message, offers pay on delivery, and automatically <strong>alerts the engineers</strong>.',
        msg: RES(503, { error: { code: 'payments_unavailable', user_message: 'Card payments are down for a moment. Pay on delivery, or try again in a few minutes.' } }),
        tip: 'TPM checklist: alert the team within seconds, show a Plan B, and after the fix ask "how do we stop this happening again?" — e.g. a reminder before keys expire.' }
    ];

    case 'double': {
      const key2 = opts.idem ? k : null;
      const steps = [
        step('tap'), step('appReq', key2), step('charge', key2), step('bankAsk'), step('bankYes'), step('payOk'),
        { from: 'backend', to: 'phone', lost: true, carry: '📶✖ Lost', phone: 'timeout',
          title: 'The answer gets lost on the way to the phone',
          text: 'The payment <strong>worked</strong>, but your bus goes under a bridge and the network drops. The "paid" answer never reaches your phone. After 20 seconds the app stops waiting.',
          msg: RES(200, { order_id: 1042, payment: 'paid' }) },
        { from: 'phone', to: 'phone', carry: '👆 Tap "Pay" again', phone: 'loading',
          title: 'You get worried and tap Pay again',
          text: 'The screen says "Taking too long". You didn\'t notice the bank alert, so you tap Pay again — exactly what real people do.' },
        step('appReq', key2, { title: 'The app sends the payment request again',
          text: opts.idem ? 'The app sends the request again <strong>with the same Idempotency-Key</strong> (<code>' + k + '</code>). It\'s like writing "same order as before" on the slip.'
            : 'The app sends the request again. There is <strong>no idempotency key</strong>, so nothing says "this is the same payment as before".' }),
        step('charge', key2, { title: 'The backend asks PayBridge again',
          text: opts.idem ? 'The backend passes the same key on to PayBridge.' : 'To PayBridge, this looks like a brand-new payment.' })
      ];
      if (opts.idem) {
        steps.push(
          { from: 'outside', to: 'backend', carry: '📬 200 (same as before)', phone: 'loading',
            title: 'PayBridge recognises the key — no second charge',
            text: 'PayBridge has seen <code>' + k + '</code> before. It does <strong>not</strong> charge again. It simply repeats its first answer.',
            msg: RES(200, { id: 'ch_8f2kQ', status: 'success', amount: 650000, reference: 'ORD-1042' }, { 'Idempotent-Replayed': 'true' }) },
          step('appOk', { tip: '✅ Only <strong>one</strong> bank alert. The idempotency key turned a scary moment into a non-event. Now switch it OFF and replay.' })
        );
      } else {
        steps.push(
          step('bankAsk', { title: 'PayBridge asks your bank — again' }),
          step('bankYes', { title: 'Your bank takes the money — again!', text: 'The bank sees a valid new payment and takes <strong>another</strong> ₦6,500. A second SMS alert arrives.' }),
          step('payOk', 'ch_9xT3m', { title: 'PayBridge answers: success (a second charge!)', text: 'Notice the charge ID is different: <code>ch_9xT3m</code>. This is a completely new payment.' }),
          step('appOk', { tip: '😱 Look at the phone: <strong>two</strong> debit alerts for one order. Angry customer, refund work, support tickets — maybe a viral tweet. Switch the idempotency key ON and replay.' })
        );
      }
      return steps;
    }

    case 'otp': {
      const steps = [
        step('tap'), step('appReq', k), step('charge', k),
        { from: 'outside', to: 'backend', carry: '📬 202 pending — OTP', phone: 'loading',
          title: 'PayBridge: "Got it — but the bank wants an OTP"',
          text: 'Your bank wants extra proof that it\'s really you. PayBridge answers <strong>202 Accepted</strong>: "I received it, but it isn\'t finished yet."',
          msg: RES(202, { id: 'ch_8f2kQ', status: 'pending', next_action: 'enter_otp', reference: 'ORD-1042' }) },
        { from: 'backend', to: 'phone', carry: '🔐 Enter your OTP', phone: 'otp', alert: 'Your OTP is 482915. Do not share it with anyone.',
          title: 'The app asks you for the OTP',
          text: 'Your bank texts you a one-time code. The app shows a box to type it in.',
          msg: RES(202, { order_id: 1042, payment: 'awaiting_otp' }) },
        { from: 'phone', to: 'bank', carry: '🔢 OTP 482915', phone: 'loading',
          title: 'You type the OTP',
          text: 'You type the 6-digit code. It goes securely to your bank. Now the bank checks it — that can take a few seconds, or sometimes minutes. <strong>How will ChopNow know when it\'s done?</strong>',
          msg: BANK('You → your bank (secure page):\n"OTP: 482915"') }
      ];
      if (opts.wait === 'webhook') {
        steps.push(
          step('bankYes'),
          { from: 'outside', to: 'backend', carry: '🔔 Webhook: charge.success', phone: 'loading',
            title: 'PayBridge calls ChopNow: "It\'s done!"',
            text: 'This is a <strong>webhook</strong>. Instead of ChopNow asking again and again, PayBridge <em>calls ChopNow</em> the moment the result is ready — like the buzzer a restaurant gives you that vibrates when your food is ready.',
            msg: HOOK('https://api.chopnow.ng/webhooks/paybridge', { 'PayBridge-Signature': 't=1763301000,v1=5257a8…' },
              { event: 'charge.success', data: { id: 'ch_8f2kQ', reference: 'ORD-1042', amount: 650000 } }),
            tip: 'The <strong>signature</strong> proves the message really came from PayBridge. If ChopNow didn\'t check it, a scammer could send a fake "payment successful" and get free food.' },
          { from: 'backend', to: 'outside', carry: '📬 200 received', phone: 'loading',
            title: 'ChopNow replies "got it"',
            text: 'ChopNow answers quickly with 200 OK. If it didn\'t, PayBridge would think the webhook was lost and send it again later.',
            msg: RES(200, { received: true }) },
          step('appOk', { title: 'Your phone shows: paid!', tip: '🔔 With a webhook, ChopNow learned the result with <strong>zero</strong> "are we done yet?" requests, and the customer heard straight away. Now try Polling.' })
        );
      } else {
        const check = n => ({ from: 'backend', to: 'outside', carry: '🔁 GET status #' + n, phone: 'loading',
          title: 'ChopNow asks: "Is it done yet?" (check ' + n + ')',
          text: n === 1 ? 'ChopNow doesn\'t know when the bank will finish, so it keeps asking every few seconds. This is called <strong>polling</strong>.' : 'Still waiting… ChopNow asks again.',
          msg: REQ('GET', 'https://api.paybridge.com/v1/charges/ch_8f2kQ', { Authorization: 'Bearer ' + SECRET_KEY }, null) });
        const pending = { from: 'outside', to: 'backend', carry: '📬 200 still pending', phone: 'loading',
          title: 'PayBridge: "Not yet"',
          text: 'Still pending. That request used time and computer power, but gave no new information.',
          msg: RES(200, { id: 'ch_8f2kQ', status: 'pending' }) };
        steps.push(
          check(1), pending, check(2), Object.assign({}, pending), step('bankYes'), check(3),
          { from: 'outside', to: 'backend', carry: '📬 200 success', phone: 'loading',
            title: 'PayBridge: "Yes, it\'s done"',
            text: 'Finally, the answer is success. But ChopNow only found out at its next check — the customer waited longer than needed.',
            msg: RES(200, { id: 'ch_8f2kQ', status: 'success', amount: 650000 }) },
          step('appOk', { tip: '🔁 Polling needed <strong>3 extra requests</strong> for one payment. With 50,000 payments a day, that\'s 150,000 wasted requests. Try the Webhook option.' })
        );
      }
      return steps;
    }

    case 'rush': return [
      step('tap'), step('appReq', k),
      step('charge', k, { title: 'Flash sale: the backend asks PayBridge to charge',
        text: 'ChopNow sent a promo SMS to 2 million people: "50% off for 1 hour!" Thousands of payments are hitting PayBridge at the same moment.' }),
      { from: 'outside', to: 'backend', carry: '📬 429 Too Many Requests', phone: 'busy',
        title: 'PayBridge says: "Slow down!"',
        text: 'ChopNow\'s plan only allows a certain number of requests per second. It went over, so PayBridge answers <strong>429 Too Many Requests</strong> and says to try again in 2 seconds.',
        msg: RES(429, { error: { code: 'rate_limit_exceeded', message: 'Too many requests. Retry after 2 seconds.' } }, { 'Retry-After': '2' }) },
      { from: 'backend', to: 'backend', carry: '⏳ Wait 2 seconds', phone: 'busy',
        title: 'The backend waits, then tries again',
        text: 'A well-built backend doesn\'t give up, and doesn\'t hammer PayBridge either. It waits the 2 seconds it was told (<code>Retry-After: 2</code>), then retries <strong>with the same idempotency key</strong>, so the retry can never double-charge.' },
      step('charge', k, { carry: '💳 Retry POST /charges', phone: 'busy', title: 'Second try', text: 'Same request, same idempotency key, sent again after waiting.' }),
      step('bankAsk', { phone: 'busy' }), step('bankYes', { phone: 'busy' }), step('payOk', { phone: 'busy' }),
      step('appOk', { tip: 'TPM question before any big promo: <strong>"What are our rate limits with PayBridge, SMS and Maps? Do we need a higher plan for that hour?"</strong> Planning is cheaper than losing the rush.' })
    ];
  }
  return [];
}

const PHONE_SCREENS = {
  checkout: '<div class="ps-title">🛒 Your order</div><div class="ps-line"><span>Jollof rice + chicken</span><span>₦5,500</span></div><div class="ps-line"><span>Delivery</span><span>₦1,000</span></div><div class="ps-line ps-total"><span>Total</span><span>₦6,500</span></div><div class="ps-card">💳 Card •••• 4081</div><div class="ps-btn">Pay ₦6,500</div>',
  loading: '<div class="ps-spinner"></div><div class="ps-big">Processing payment…</div><div class="ps-small">Please don\'t close the app</div>',
  success: '<div class="ps-emoji">✅</div><div class="ps-big">Payment successful</div><div class="ps-small">Order #1042 confirmed. Mama Put Express is cooking. Arrives in about 35 min 🛵</div>',
  declined: '<div class="ps-emoji">❌</div><div class="ps-big">Card declined</div><div class="ps-small">Not enough money on card •••• 4081.</div><div class="ps-btn">Try another card</div><div class="ps-btn ps-btn-2">Pay by bank transfer</div>',
  unavailable: '<div class="ps-emoji">😕</div><div class="ps-big">Card payments are down for a moment</div><div class="ps-small">Your order is saved.</div><div class="ps-btn">Pay on delivery</div><div class="ps-btn ps-btn-2">Try again later</div>',
  timeout: '<div class="ps-emoji">⌛</div><div class="ps-big">This is taking too long…</div><div class="ps-small">Check your internet connection.</div><div class="ps-btn ps-btn-warn">Pay again</div>',
  otp: '<div class="ps-emoji">🔐</div><div class="ps-big">Enter the OTP from your bank</div><div class="ps-otp"><span>4</span><span>8</span><span>2</span><span>9</span><span>1</span><span>5</span></div><div class="ps-btn">Confirm</div>',
  busy: '<div class="ps-spinner"></div><div class="ps-big">Lots of people are ordering!</div><div class="ps-small">Your payment is in progress — please don\'t tap again.</div>'
};

const HEADER_NOTES = {
  'Authorization': v => v.includes('EXPIRED') ? '<strong>Authorization</strong> — the ID card. This key has expired, so it will be refused.'
    : v.includes('sk_') ? '<strong>Authorization</strong> — ChopNow\'s secret key, proving to PayBridge who is asking. Kept only on the server.'
    : '<strong>Authorization</strong> — the customer\'s login token, proving to ChopNow who is asking.',
  'Idempotency-Key': () => '<strong>Idempotency-Key</strong> — a unique label for this one payment. If the same label arrives twice, it is treated as the same payment, not a new one.',
  'PayBridge-Signature': () => '<strong>PayBridge-Signature</strong> — a secret stamp proving this message really came from PayBridge.',
  'Retry-After': v => '<strong>Retry-After: ' + v + '</strong> — "wait ' + v + ' seconds before you try again".',
  'Idempotent-Replayed': () => '<strong>Idempotent-Replayed: true</strong> — "I\'ve seen this key before; this is my earlier answer, repeated".'
};

function initPaymentSim() {
  const stage = document.getElementById('flowStage');
  const packet = document.getElementById('packet');
  const packetText = document.getElementById('packetText');
  const nodes = {};
  stage.querySelectorAll('.flow-node').forEach(n => { nodes[n.dataset.node] = n; });

  const el = id => document.getElementById(id);
  const counter = el('stepCounter'), route = el('stepRoute'), title = el('stepTitle'),
        text = el('stepText'), tip = el('stepTip'), dots = el('stepDots'),
        nextBtn = el('nextStep'), prevBtn = el('prevStep'), autoBtn = el('autoPlay'), resetBtn = el('resetSteps'),
        calls = el('callCount');
  const nodeNames = { phone: 'ChopNow app', backend: 'ChopNow backend', outside: 'PayBridge', bank: 'Your bank' };

  let scenarioKey = 'happy';
  const opts = { idem: true, wait: 'webhook' };
  let steps = buildScenario(scenarioKey, opts);
  let current = -1;
  let autoTimer = null;

  function centerOf(node) {
    const s = stage.getBoundingClientRect();
    const r = node.getBoundingClientRect();
    return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 };
  }

  function placePacket(point, instant) {
    if (instant) packet.style.transition = 'none';
    packet.style.left = point.x + 'px';
    packet.style.top = point.y + 'px';
    if (instant) { void packet.offsetWidth; packet.style.transition = ''; }
  }

  function clearNodeStates() {
    Object.values(nodes).forEach(n => n.classList.remove('is-from', 'is-to', 'is-broken', 'is-self'));
  }

  function renderDots() {
    dots.innerHTML = '';
    steps.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'dot' + (i === current ? ' active' : '') + (i < current ? ' done' : '');
      d.setAttribute('aria-label', 'Go to step ' + (i + 1));
      d.addEventListener('click', () => { stopAuto(); goTo(i); });
      dots.appendChild(d);
    });
  }

  function renderPhone() {
    const upTo = steps.slice(0, current + 1);
    const screen = current < 0 ? 'checkout' : steps[current].phone || 'loading';
    el('phoneScreen').innerHTML = PHONE_SCREENS[screen];
    const alerts = upTo.filter(s => s.alert).map(s => s.alert);
    const debits = alerts.filter(a => a.startsWith('Debit')).length;
    el('phoneAlerts').innerHTML = alerts.map(a =>
      '<div class="ps-alert' + (a.startsWith('Debit') && debits > 1 ? ' bad' : '') + '"><strong>🏦 Your bank</strong>' + escapeHtml(a) + '</div>').join('');
    const callsSoFar = upTo.filter(s => s.msg && (s.msg.kind === 'request' || s.msg.kind === 'webhook')).length;
    calls.textContent = 'API calls so far: ' + callsSoFar;
  }

  function renderInspector(s) {
    const code = el('inspCode'), notes = el('inspNotes'), kind = el('inspKind'), head = el('inspTitle');
    const list = [];
    if (!s || !s.msg) {
      head.textContent = '🔍 Message inspector';
      kind.textContent = '';
      kind.className = 'insp-kind';
      code.innerHTML = s ? '<span class="muted">No message is sent in this step — it happens inside one system.</span>'
        : '<span class="muted">The message for each step will appear here.</span>';
      notes.innerHTML = '';
      return;
    }
    const m = s.msg;
    if (m.kind === 'bank') {
      head.textContent = '🏦 Bank network message';
      kind.textContent = 'Card network';
      kind.className = 'insp-kind k-bank';
      code.textContent = m.text;
      list.push('Banks and card networks use their own special systems, not the APIs you see elsewhere on this page. A TPM just needs to know this step exists — and that it can be slow or fail.');
    } else {
      const isRes = m.kind === 'response';
      head.textContent = isRes ? '📬 Response (the answer)' : m.kind === 'webhook' ? '🔔 Webhook (PayBridge calls ChopNow)' : '📨 Request (the question)';
      kind.textContent = isRes ? m.status + ' ' + STATUS[m.status][0] : m.method;
      kind.className = 'insp-kind ' + (isRes ? statusClass(m.status) : 'k-' + m.method.toLowerCase());
      let html = isRes
        ? '<span class="c-status ' + statusClass(m.status) + '">HTTP ' + m.status + ' ' + STATUS[m.status][0] + '</span>\n'
        : '<span class="c-method">' + m.method + '</span> <span class="c-url">' + escapeHtml(m.url) + '</span>\n';
      Object.entries(m.headers || {}).forEach(([h, v]) => {
        html += '<span class="c-hkey">' + h + ':</span> ' + escapeHtml(v) + '\n';
        if (HEADER_NOTES[h]) list.push(HEADER_NOTES[h](v));
      });
      html += '\n' + (m.body ? highlightJson(m.body) : '<span class="muted">(no body — a GET only asks, it doesn\'t send information)</span>');
      code.innerHTML = html;
      if (isRes) {
        list.unshift('<strong>' + m.status + ' ' + STATUS[m.status][0] + '</strong> — ' + STATUS[m.status][1]);
      } else {
        const what = { GET: 'read something', POST: 'create something new', PATCH: 'change part of something', DELETE: 'remove something' }[m.method];
        list.unshift('<strong>' + m.method + '</strong> — "I want to ' + what + '". Sent to <code>' + escapeHtml(m.url.replace(/^https:\/\//, '')) + '</code>.');
      }
      if (m.body) list.push('<strong>Body</strong> — the actual information, written in JSON (names and values).');
    }
    if (s.lost) list.unshift('📶 <strong>This answer never arrived.</strong> The phone has no idea the payment worked.');
    notes.innerHTML = list.map(n => '<li>' + n + '</li>').join('');
  }

  function renderIntro() {
    clearNodeStates();
    packet.classList.remove('visible', 'lost');
    placePacket(centerOf(nodes.phone), true);
    counter.textContent = 'Ready';
    route.textContent = '';
    title.textContent = 'Press "Next step" to begin';
    text.textContent = 'You will see each system light up as the message travels between them.';
    tip.hidden = true;
    prevBtn.disabled = true;
    nextBtn.disabled = false;
    nextBtn.textContent = 'Next step →';
    renderDots();
    renderPhone();
    renderInspector(null);
  }

  function goTo(i) {
    current = i;
    if (current < 0) { renderIntro(); return; }
    const s = steps[current];
    clearNodeStates();

    packet.classList.add('visible');
    packet.classList.toggle('lost', !!s.lost);
    packetText.textContent = s.carry;
    placePacket(centerOf(nodes[s.from]), true);
    if (s.from === s.to) {
      nodes[s.to].classList.add('is-self');
    } else {
      nodes[s.from].classList.add('is-from');
      const a = centerOf(nodes[s.from]), b = centerOf(nodes[s.to]);
      const target = s.lost ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : b;
      requestAnimationFrame(() => requestAnimationFrame(() => placePacket(target, false)));
    }
    if (s.lost) nodes[s.to].classList.add('is-broken');
    else nodes[s.to].classList.add('is-to');

    counter.textContent = 'Step ' + (current + 1) + ' of ' + steps.length;
    route.textContent = s.from === s.to ? 'Inside: ' + nodeNames[s.from] : nodeNames[s.from] + ' → ' + nodeNames[s.to];
    title.textContent = s.title;
    text.innerHTML = s.text;
    tip.hidden = !s.tip;
    if (s.tip) tip.innerHTML = '<strong>TPM note:</strong> ' + s.tip;

    prevBtn.disabled = false;
    nextBtn.disabled = current === steps.length - 1;
    nextBtn.textContent = current === steps.length - 1 ? 'Finished ✓' : 'Next step →';
    renderDots();
    renderPhone();
    renderInspector(s);
  }

  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    autoBtn.textContent = '▶ Play all';
  }

  function startAuto() {
    if (current >= steps.length - 1) goTo(-1);
    goTo(current + 1);
    autoBtn.textContent = '⏸ Pause';
    autoTimer = setInterval(() => {
      if (current >= steps.length - 1) { stopAuto(); return; }
      goTo(current + 1);
    }, 4200);
  }

  function rebuild() {
    stopAuto();
    steps = buildScenario(scenarioKey, opts);
    goTo(-1);
  }

  nextBtn.addEventListener('click', () => { stopAuto(); goTo(current + 1); });
  prevBtn.addEventListener('click', () => { stopAuto(); goTo(current - 1); });
  resetBtn.addEventListener('click', () => { stopAuto(); goTo(-1); });
  autoBtn.addEventListener('click', () => { autoTimer ? stopAuto() : startAuto(); });

  document.querySelectorAll('#payScenarios .scenario-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#payScenarios .scenario-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      scenarioKey = btn.dataset.scenario;
      el('optDouble').hidden = scenarioKey !== 'double';
      el('optOtp').hidden = scenarioKey !== 'otp';
      rebuild();
    });
  });

  document.querySelectorAll('[data-idem]').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('[data-idem]').forEach(x => x.classList.toggle('active', x === b));
    opts.idem = b.dataset.idem === 'on';
    rebuild();
  }));
  document.querySelectorAll('[data-wait]').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('[data-wait]').forEach(x => x.classList.toggle('active', x === b));
    opts.wait = b.dataset.wait;
    rebuild();
  }));

  window.addEventListener('resize', () => {
    if (current >= 0 && !steps[current].lost) placePacket(centerOf(nodes[steps[current].to]), true);
  });

  renderIntro();
}

/* ---------------- API playground ---------------- */
const RESTAURANTS = [
  { id: 1, name: 'Mama Put Express', area: 'Yaba', open: true },
  { id: 2, name: 'Suya Spot', area: 'Lekki', open: true },
  { id: 3, name: 'Amala Joint', area: 'Surulere', open: false }
];
const MENUS = {
  1: [{ item_id: 11, name: 'Jollof rice + chicken', price: 5500 }, { item_id: 12, name: 'Fried plantain', price: 800 }],
  2: [{ item_id: 21, name: 'Suya (2 sticks)', price: 2500 }, { item_id: 22, name: 'Zobo drink', price: 700 }],
  3: [{ item_id: 31, name: 'Amala + ewedu', price: 3000 }]
};
const seedOrders = () => [
  { id: 1042, food: 'Jollof rice + chicken', address: '12 Herbert Macaulay Way, Yaba', status: 'delivered' },
  { id: 1043, food: 'Suya (2 sticks)', address: '5 Admiralty Way, Lekki', status: 'preparing' }
];

const PG_TRIES = [
  { label: '📋 List restaurants', method: 'GET', path: '/v1/restaurants' },
  { label: '🔎 Only in Yaba', method: 'GET', path: '/v1/restaurants?area=yaba' },
  { label: '🍛 See a menu', method: 'GET', path: '/v1/restaurants/1/menu' },
  { label: '➕ Place an order', method: 'POST', path: '/v1/orders',
    body: { restaurant_id: 2, item_id: 21, quantity: 2, address: '7 Allen Avenue, Ikeja' } },
  { label: '⚠️ Forget the address', method: 'POST', path: '/v1/orders',
    body: { restaurant_id: 1, item_id: 11, quantity: 1 } },
  { label: '🔒 Order from a closed place', method: 'POST', path: '/v1/orders',
    body: { restaurant_id: 3, item_id: 31, quantity: 1, address: '3 Bode Thomas St, Surulere' } },
  { label: '✏️ Change an address', method: 'PATCH', path: '/v1/orders/1043',
    body: { address: '10 Ozumba Mbadiwe Ave, Victoria Island' } },
  { label: '🚫 Cancel a delivered order', method: 'PATCH', path: '/v1/orders/1042', body: { status: 'cancelled' } },
  { label: '❓ Order that doesn\'t exist', method: 'GET', path: '/v1/orders/9999' },
  { label: '🔑 Forget the API key', method: 'GET', path: '/v1/orders/1042', noKey: true },
  { label: '🗑️ Delete an order', method: 'DELETE', path: '/v1/orders/1043' }
];

function initPlayground() {
  const el = id => document.getElementById(id);
  const method = el('pgMethod'), path = el('pgPath'), body = el('pgBody'), key = el('pgKey'),
        sendBtn = el('pgSend'), statusEl = el('pgStatus'), timeEl = el('pgTime'),
        plainEl = el('pgPlain'), jsonEl = el('pgJson'), dbBody = el('dbOrders');
  let orders = seedOrders(), nextId = 1044, recent = [], changedId = null;

  function renderDb() {
    dbBody.innerHTML = orders.length ? orders.map(o =>
      '<tr' + (o.id === changedId ? ' class="db-flash"' : '') + '><td>' + o.id + '</td><td>' + escapeHtml(o.food) + '</td><td>' + escapeHtml(o.address) + '</td><td><span class="db-status st-' + o.status + '">' + o.status + '</span></td></tr>').join('')
      : '<tr><td colspan="4" class="muted">No orders</td></tr>';
    changedId = null;
  }

  function syncBodyState() {
    const usesBody = method.value === 'POST' || method.value === 'PATCH';
    body.disabled = !usesBody;
    el('pgBodyHint').textContent = usesBody ? '— the information you are sending'
      : method.value === 'GET' ? '— not used for GET (it only asks)' : '— not used for DELETE (the address says what to remove)';
  }

  const fail = (status, code, message, plain, extra) => ({ status, body: { error: Object.assign({ code, message }, extra || {}) }, plain });

  function handle(m, rawPath, rawBody, hasKey) {
    // Rate limit: 10 requests per 10 seconds
    const now = Date.now();
    recent = recent.filter(t => now - t < 10000);
    if (recent.length >= 10) {
      const wait = Math.ceil((10000 - (now - recent[0])) / 1000);
      return fail(429, 'rate_limit_exceeded', 'Too many requests. Try again in ' + wait + ' seconds.',
        'You sent more than 10 requests in 10 seconds, so the API is protecting itself. Real APIs do this to stop one app from overloading everyone. Wait ' + wait + ' seconds.', { retry_after_seconds: wait });
    }
    recent.push(now);

    if (!hasKey) return fail(401, 'missing_api_key', 'No API key provided.',
      'The request had no ID card, so the API doesn\'t know who is asking and refuses. Tick "Send my API key" and try again.');

    const [p, query] = rawPath.trim().split('?');
    const params = new URLSearchParams(query || '');
    const parts = p.replace(/\/+$/, '').split('/').filter(Boolean); // ['v1','orders','1043']
    if (parts[0] !== 'v1') return fail(404, 'not_found', 'Unknown address. Paths start with /v1/.',
      'There is nothing at that address. Check the spelling against the API menu — every path here starts with <code>/v1/</code>.');

    let data = null;
    if (m === 'POST' || m === 'PATCH') {
      try { data = rawBody.trim() ? JSON.parse(rawBody) : {}; }
      catch (e) {
        return fail(400, 'invalid_json', 'The request body is not valid JSON.',
          'The API couldn\'t read your message. JSON is strict: names need "double quotes", items need commas between them, and there must be no comma after the last item.');
      }
    }

    const wrongMethod = allowed => fail(405, 'method_not_allowed', m + ' is not allowed here. Allowed: ' + allowed + '.',
      'This address exists, but not for that action. The API menu shows which actions each address accepts.');

    // /v1/restaurants
    if (parts[1] === 'restaurants' && parts.length === 2) {
      if (m !== 'GET') return wrongMethod('GET');
      let list = RESTAURANTS;
      if (params.get('area')) list = list.filter(r => r.area.toLowerCase() === params.get('area').toLowerCase());
      if (params.get('open')) list = list.filter(r => String(r.open) === params.get('open'));
      const filtered = query ? ' The part after <code>?</code> filtered the list.' : ' Try adding <code>?area=lekki</code> to the address to filter it.';
      return { status: 200, body: { restaurants: list, count: list.length }, plain: 'You asked to <strong>read</strong> the restaurant list, and got ' + list.length + ' back.' + filtered };
    }
    // /v1/restaurants/{id}/menu
    if (parts[1] === 'restaurants' && parts.length === 4 && parts[3] === 'menu') {
      if (m !== 'GET') return wrongMethod('GET');
      const r = RESTAURANTS.find(x => x.id === Number(parts[2]));
      if (!r) return fail(404, 'restaurant_not_found', 'No restaurant with id ' + parts[2] + '.',
        'There is no restaurant with ID ' + escapeHtml(parts[2]) + '. IDs that exist: 1, 2 and 3.');
      return { status: 200, body: { restaurant: r.name, items: MENUS[r.id] }, plain: 'The menu for <strong>' + r.name + '</strong>. Notice each item has an <code>item_id</code> — you need it to place an order.' };
    }
    // /v1/orders
    if (parts[1] === 'orders' && parts.length === 2) {
      if (m === 'GET') return { status: 200, body: { orders }, plain: 'All orders in the database. Compare this with the table on the right — the API is just a doorway to the database.' };
      if (m !== 'POST') return wrongMethod('GET, POST');
      for (const f of ['restaurant_id', 'item_id', 'address']) {
        if (data[f] === undefined || data[f] === '') return fail(400, 'missing_field', 'The field "' + f + '" is required.',
          'The order is missing <strong>' + f + '</strong>, so the API refuses it. A good error says <em>exactly</em> what is missing, so the app can highlight that box for the user.', { field: f });
      }
      const r = RESTAURANTS.find(x => x.id === Number(data.restaurant_id));
      if (!r) return fail(404, 'restaurant_not_found', 'No restaurant with id ' + data.restaurant_id + '.', 'That restaurant ID doesn\'t exist. Try 1, 2 or 3.');
      const item = MENUS[r.id].find(i => i.item_id === Number(data.item_id));
      if (!item) return fail(400, 'invalid_item', 'Item ' + data.item_id + ' is not on ' + r.name + '\'s menu.',
        'That item isn\'t sold by ' + r.name + '. Use GET <code>/v1/restaurants/' + r.id + '/menu</code> to see valid item IDs.');
      if (!r.open) return fail(409, 'restaurant_closed', r.name + ' is closed right now.',
        'The request itself is fine, but it <strong>clashes with how things are right now</strong>: the restaurant is closed. That\'s a 409 Conflict. The app should say "Opens at 10 AM" instead of a generic error.');
      const qty = Math.max(1, Number(data.quantity) || 1);
      const order = { id: nextId++, food: (qty > 1 ? qty + ' × ' : '') + item.name, address: String(data.address), status: 'preparing' };
      orders.push(order);
      changedId = order.id;
      return { status: 201, body: Object.assign({}, order, { total: qty * item.price + 1000, currency: 'NGN' }),
        plain: '<strong>201 Created</strong> — a new order now exists with ID <strong>' + order.id + '</strong>. Look: a new row appeared in the database. Now try GET <code>/v1/orders/' + order.id + '</code>.' };
    }
    // /v1/orders/{id}
    if (parts[1] === 'orders' && parts.length === 3) {
      const o = orders.find(x => x.id === Number(parts[2]));
      if (!['GET', 'PATCH', 'DELETE'].includes(m)) return wrongMethod('GET, PATCH, DELETE');
      if (!o) return fail(404, 'order_not_found', 'No order with id ' + parts[2] + '.',
        'There is no order ' + escapeHtml(parts[2]) + ' in the database. A good app shows "We can\'t find that order" — not a blank screen.');
      if (m === 'GET') return { status: 200, body: o, plain: 'Here is order ' + o.id + '. Reading with GET never changes anything — the database stays the same.' };
      if (m === 'DELETE') {
        orders = orders.filter(x => x !== o);
        return { status: 204, body: null, plain: '<strong>204 No Content</strong> — order ' + o.id + ' is gone, and there is nothing to send back. <br>🎓 In real apps, orders are rarely truly deleted — they are marked "cancelled" so there\'s a record for refunds and disputes.' };
      }
      // PATCH
      const keys = Object.keys(data);
      if (!keys.length) return fail(400, 'empty_update', 'Send at least one field to change.', 'PATCH changes part of something — but you didn\'t say what to change.');
      const bad = keys.find(k => !['address', 'status'].includes(k));
      if (bad) return fail(400, 'unknown_field', 'You can\'t change "' + bad + '".', 'Only <code>address</code> and <code>status</code> can be changed. The API protects other fields, like the price.');
      if (data.status !== undefined && data.status !== 'cancelled') return fail(400, 'invalid_status', 'Status can only be set to "cancelled".',
        'Customers can cancel, but they can\'t mark their own order as "delivered" — only the rider\'s app can. The API enforces these rules.');
      if (o.status === 'delivered') return fail(409, 'already_delivered', 'Order ' + o.id + ' was already delivered.',
        'You can\'t change or cancel food that has already been delivered. The request is valid, but it <strong>conflicts</strong> with the order\'s current state.');
      if (data.address) o.address = String(data.address);
      if (data.status) o.status = data.status;
      changedId = o.id;
      return { status: 200, body: o, plain: 'Order ' + o.id + ' was changed. Only the field you sent changed — that\'s what PATCH means. Look at the database.' };
    }
    return fail(404, 'not_found', 'Unknown address.', 'There is nothing at that address. Compare it with the API menu on the right — a tiny typo is enough to get a 404.');
  }

  function send() {
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending…';
    statusEl.textContent = '…';
    statusEl.className = 'status-badge';
    setTimeout(() => {
      const res = handle(method.value, path.value, body.value, key.checked);
      statusEl.textContent = res.status + ' ' + STATUS[res.status][0];
      statusEl.className = 'status-badge ' + statusClass(res.status);
      timeEl.textContent = (40 + Math.floor(Math.random() * 140)) + ' ms';
      plainEl.innerHTML = '💬 ' + res.plain;
      plainEl.className = 'pg-plain ' + statusClass(res.status);
      jsonEl.innerHTML = res.body ? highlightJson(res.body) : '<span class="muted">(empty — nothing to send back)</span>';
      renderDb();
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send ➤';
    }, 320);
  }

  const tries = el('pgTries');
  PG_TRIES.forEach(t => {
    const b = document.createElement('button');
    b.className = 'try-btn';
    b.innerHTML = '<span class="verb-tag v-' + t.method.toLowerCase() + '">' + t.method + '</span> ' + t.label;
    b.addEventListener('click', () => {
      method.value = t.method;
      path.value = t.path;
      body.value = t.body ? JSON.stringify(t.body, null, 2) : '';
      key.checked = !t.noKey;
      syncBodyState();
      send();
    });
    tries.appendChild(b);
  });

  method.addEventListener('change', syncBodyState);
  sendBtn.addEventListener('click', send);
  path.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  el('pgReset').addEventListener('click', () => {
    orders = seedOrders(); nextId = 1044; recent = [];
    renderDb();
    plainEl.className = 'pg-plain';
    plainEl.innerHTML = 'Database reset to the starting 2 orders.';
  });

  syncBodyState();
  renderDb();
}

/* ---------------- Typing-cost demo ---------------- */
function initDebounceDemo() {
  const input = document.getElementById('debounceInput');
  const every = document.getElementById('dbEvery'), wait = document.getElementById('dbWait'), cost = document.getElementById('dbCost');
  const PRICE = 4, USERS = 100000; // example: ₦4 per request, 100,000 customers a day
  let nEvery = 0, nWait = 0, timer = null;
  const naira = n => '₦' + Math.round(n).toLocaleString('en-NG');

  function update() {
    every.textContent = nEvery;
    wait.textContent = nWait;
    if (!nEvery) return;
    cost.innerHTML = 'At an example price of ₦' + PRICE + ' per call, if 100,000 customers typed like you every day: <strong class="bad-text">' +
      naira(nEvery * PRICE * USERS) + '</strong> a day asking on every letter, vs <strong class="good-text">' + naira(nWait * PRICE * USERS) + '</strong> a day with a short wait.';
  }

  input.addEventListener('input', () => {
    if (!input.value.trim()) { nEvery = 0; nWait = 0; update(); return; }
    nEvery++;
    clearTimeout(timer);
    timer = setTimeout(() => { nWait++; update(); }, 300);
    update();
  });
}

/* ---------------- Quiz ---------------- */
const QUIZ = [
  { q: 'What is an API, in simple words?',
    options: ['A type of database', 'An agreed way for two pieces of software to talk', 'A phone app', 'A programming language'], answer: 1,
    why: 'Like the order slip between waiter and kitchen: a fixed format both sides understand.' },
  { q: 'The app wants to place a new order. Which method should it use?',
    options: ['GET', 'POST', 'DELETE', 'PATCH'], answer: 1,
    why: 'POST creates something new. GET only reads; PATCH changes something that already exists.' },
  { q: 'What does status code 404 mean?',
    options: ['It worked', 'Not found', 'The server crashed', 'Too many requests'], answer: 1,
    why: 'The address or ID points to something that doesn\'t exist.' },
  { q: 'The payment company answers "500 Internal Server Error". Whose problem is it?',
    options: ['The customer\'s', 'The app that asked', 'The payment company\'s server', 'Nobody\'s'], answer: 2,
    why: '5xx means the server had a problem. The app should show a Plan B and maybe retry later.' },
  { q: 'What is a webhook?',
    options: ['A way to hack an API', 'When another system calls you as soon as something happens', 'Asking "is it done yet?" every few seconds', 'A type of API key'], answer: 1,
    why: 'Like a restaurant buzzer: you get told when it\'s ready, instead of asking again and again (polling).' },
  { q: 'What does an idempotency key protect against?',
    options: ['Slow internet', 'Wrong passwords', 'Being charged twice when the same request is sent again', 'Hackers reading your messages'], answer: 2,
    why: 'If the same key arrives twice, the payment company treats it as the same payment and doesn\'t charge again.' },
  { q: 'An API answers "429 Too Many Requests". What should the app do?',
    options: ['Send the request 100 more times, quickly', 'Wait a little, then try again', 'Delete the user\'s account', 'Show the code "429" to the user'], answer: 1,
    why: 'Slow down and retry after the time it suggests (Retry-After) — and show the user a calm message.' }
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
      : 'Good start. Replay the payment situations, then retry.';
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
    b.checked = store.get('w3_' + b.dataset.key, '0') === '1';
    b.addEventListener('change', () => { store.set('w3_' + b.dataset.key, b.checked ? '1' : '0'); update(); });
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
  ['API', 'An agreed way for two pieces of software to talk to each other.'],
  ['Endpoint', 'The address a request is sent to, e.g. /v1/orders.'],
  ['Request', 'A message asking an API to do something.'],
  ['Response', 'The answer that comes back, with a status code and usually some data.'],
  ['Method', 'The action a request wants: GET, POST, PATCH, PUT or DELETE.'],
  ['GET', 'Read or look at something. Changes nothing.'],
  ['POST', 'Create something new, like an order or an account.'],
  ['PATCH', 'Change part of something that already exists.'],
  ['PUT', 'Replace a whole thing with a new version.'],
  ['DELETE', 'Remove something.'],
  ['Status code', 'A 3-digit number saying how a request went: 2xx worked, 4xx app\'s mistake, 5xx server\'s problem.'],
  ['JSON', 'A simple text format for data, made of names and values: {"name": "Ada"}.'],
  ['Header', 'Extra labels on a request or response, like the API key.'],
  ['Body', 'The main information inside a request or response.'],
  ['Query parameter', 'Extra details in the address after a ?, e.g. ?area=yaba.'],
  ['API key', 'A secret code that proves which app or company is making a request.'],
  ['Token', 'A temporary pass given after you log in, sent with each request.'],
  ['Authentication', 'Checking who you are (login, API key).'],
  ['Authorization', 'Checking what you are allowed to do.'],
  ['Webhook', 'When another system calls your server as soon as something happens.'],
  ['Polling', 'Asking "is it done yet?" again and again.'],
  ['Rate limit', 'The maximum number of requests allowed in a period of time.'],
  ['Idempotency key', 'A unique label so the same request sent twice is only done once — no double charges.'],
  ['Retry', 'Sending a request again after it failed, ideally after a short wait.'],
  ['Timeout', 'Giving up after waiting too long for an answer.'],
  ['Documentation (docs)', 'The "menu" of an API: every request you can make and what comes back.'],
  ['Versioning', 'Putting a version in the address (/v1/, /v2/) so changes don\'t break existing apps.'],
  ['Postman', 'A popular tool for sending test requests to APIs — like the Playground on this page.'],
  ['Debouncing', 'Waiting until the user pauses (e.g. stops typing) before calling an API.']
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
