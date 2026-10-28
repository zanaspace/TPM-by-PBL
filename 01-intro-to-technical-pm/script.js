/* Week 01: Introduction to Technical Product Management
   Interactive pieces: theme, tabs, role game, request-flow demo, quiz,
   capstone checklist, template copy, word bank, scroll spy. */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initRoleGame();
  initFlowDemo();
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

/* ---------------- Role game: PM / TPM / EM ---------------- */
const ROLE_TASKS = [
  { task: 'Talk to 10 customers to find out why they stopped using the app.', answer: 'PM',
    why: 'Understanding users and their problems is the core of the PM job.' },
  { task: 'Check if the payment system can handle 10x more orders during Black Friday.', answer: 'TPM',
    why: 'Thinking about whether the system can cope with growth is classic TPM work.' },
  { task: 'Review a developer\'s code before it goes live.', answer: 'EM',
    why: 'Code quality and reviewing developers\' work belong to the Engineering Manager (or tech lead).' },
  { task: 'Decide which new feature to build next quarter based on business goals.', answer: 'PM',
    why: 'Choosing what to build and why is the PM\'s main question.' },
  { task: 'List what happens in the app if Google Maps stops responding.', answer: 'TPM',
    why: 'Planning for outside services failing is a key TPM skill.' },
  { task: 'Hire a new backend developer and help them grow.', answer: 'EM',
    why: 'Hiring and coaching engineers is the Engineering Manager\'s job.' },
  { task: 'Write down exactly what information the app must send to the payment company.', answer: 'TPM',
    why: 'Describing how data moves between parts is technical product work.' },
  { task: 'Work with marketing on how to announce a new feature.', answer: 'PM',
    why: 'Launch and marketing plans are usually led by the PM.' },
  { task: 'Split the work into tasks for this two-week sprint and assign developers.', answer: 'EM',
    why: 'Planning who builds what, day to day, is led by the EM — with input from the PM/TPM.' }
];

function initRoleGame() {
  const taskEl = document.getElementById('roleTask');
  const feedbackEl = document.getElementById('roleFeedback');
  const scoreEl = document.getElementById('roleScore');
  const progressEl = document.getElementById('roleProgress');
  const nextBtn = document.getElementById('roleNext');
  const choices = document.querySelectorAll('#roleGame .choice-btn');
  const names = { PM: 'Product Manager', TPM: 'Technical PM', EM: 'Engineering Manager' };

  let index = 0, correct = 0, answered = 0, locked = false;

  function show() {
    locked = false;
    const item = ROLE_TASKS[index];
    taskEl.textContent = '“' + item.task + '”';
    feedbackEl.className = 'game-feedback';
    feedbackEl.innerHTML = '';
    choices.forEach(c => { c.disabled = false; c.classList.remove('right', 'wrong'); });
    nextBtn.disabled = true;
    nextBtn.textContent = index === ROLE_TASKS.length - 1 ? 'See my score →' : 'Next task →';
    progressEl.textContent = 'Task ' + (index + 1) + ' of ' + ROLE_TASKS.length;
  }

  function finish() {
    const pct = correct / ROLE_TASKS.length;
    const msg = pct >= 0.8 ? 'Excellent! You clearly understand the three roles. 🎉'
      : pct >= 0.5 ? 'Good work! Read Part 2 again for the ones you missed.'
      : 'Keep going — re-read the house example in Part 2, then try again.';
    taskEl.textContent = 'You got ' + correct + ' out of ' + ROLE_TASKS.length + ' right.';
    feedbackEl.className = 'game-feedback show';
    feedbackEl.textContent = msg + ' Remember: in real teams these roles overlap, and they work together.';
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
      const item = ROLE_TASKS[index];
      const isRight = btn.dataset.role === item.answer;
      answered++;
      if (isRight) correct++;
      choices.forEach(c => {
        c.disabled = true;
        if (c.dataset.role === item.answer) c.classList.add('right');
      });
      if (!isRight) btn.classList.add('wrong');
      feedbackEl.className = 'game-feedback show ' + (isRight ? 'is-right' : 'is-wrong');
      feedbackEl.innerHTML = (isRight ? '✅ <strong>Correct!</strong> ' : '❌ <strong>Not quite.</strong> Best answer: ' + names[item.answer] + '. ') + item.why;
      scoreEl.textContent = 'Score: ' + correct + ' / ' + answered;
      nextBtn.disabled = false;
    });
  });

  nextBtn.addEventListener('click', () => {
    if (index === -1) { index = 0; correct = 0; answered = 0; scoreEl.textContent = 'Score: 0 / 0'; show(); return; }
    if (index === ROLE_TASKS.length - 1) { finish(); return; }
    index++;
    show();
  });

  show();
}

/* ---------------- Flow demo ---------------- */
// Each step moves a message from one part to another.
// "phoneLabel" lets the phone node show whose phone it is for that step.
const SCENARIOS = {
  uber: {
    steps: [
      { from: 'phone', to: 'phone', carry: '📍 Pickup + drop-off',
        title: 'You tap "Request ride"',
        app: 'You choose your pickup (Lekki) and drop-off (the airport) and tap the button. The app on your phone collects this information.',
        food: 'You tell the waiter what you want to eat. The waiter writes it on an order slip.' },
      { from: 'phone', to: 'backend', carry: '📨 "Find me a ride"',
        title: 'Your phone sends the request to the backend',
        app: 'Your phone sends a message over the internet: "This person at Lekki wants a ride to the airport." This message goes through an API.',
        food: 'The waiter carries the order slip to the kitchen.',
        tip: 'The phone does not decide anything big. It just asks. The real decisions happen in the backend.' },
      { from: 'backend', to: 'database', carry: '🔎 "Free drivers near Lekki?"',
        title: 'The backend checks the memory for nearby drivers',
        app: 'The backend asks the database: "Which free drivers are close to Lekki right now?" It only looks in the small area around you — not the whole city.',
        food: 'The cook checks the storeroom: "Do we have fresh fish?"',
        tip: 'Searching a small area instead of everywhere is what makes this fast.' },
      { from: 'database', to: 'backend', carry: '🚗 3 drivers found',
        title: 'The database answers',
        app: 'The database replies with 3 free drivers nearby. The backend picks the best one (closest, good rating).',
        food: 'The storeroom answers: "Yes, we have 3 fish." The cook picks the freshest one.' },
      { from: 'backend', to: 'outside', carry: '🗺️ "How long is this trip?"',
        title: 'The backend asks Google Maps for the route',
        app: 'Uber does not build its own maps. It asks an outside service (like Google Maps) for the best road and how long the trip will take, then works out the price.',
        food: 'The kitchen calls a supplier for something it doesn\'t make itself.',
        tip: 'Outside services save time and money — but if they fail, your app is affected. That is a risk a TPM must track.' },
      { from: 'outside', to: 'backend', carry: '⏱️ 25 min • ₦6,500',
        title: 'Maps answers with time and distance',
        app: 'The map service replies: "25 minutes." The backend now knows the price to show you.',
        food: 'The supplier delivers. The kitchen can now finish the dish.' },
      { from: 'backend', to: 'phone', carry: '🔔 "New trip offer!"', phoneLabel: "Driver's phone",
        title: 'The backend offers the trip to the driver',
        app: 'The backend sends the trip to the driver\'s phone. The driver taps "Accept". The backend saves the trip so no other rider can grab this driver.',
        food: 'The head cook tells one cook: "This order is yours."' },
      { from: 'backend', to: 'phone', carry: '✅ "Musa is 4 min away"', phoneLabel: 'Your phone',
        title: 'Your screen updates: driver on the way!',
        app: 'Your phone shows the driver\'s name, car and a moving map. All of that happened in about 2 seconds.',
        food: 'The waiter brings your food to the table.',
        tip: '🎉 You just followed one request through all 4 parts. Try "Break something" below!' }
    ],
    breaks: [
      { label: '💳 Payment service is down', node: 'outside',
        bad: 'The app shows "Something went wrong" and nobody can book a ride. Riders open Bolt instead.',
        good: 'The app says "Card payment is busy — pay with cash for this trip?" Riders still get home.',
        lesson: 'Always have a Plan B when an outside service fails. Don\'t let one helper stop your whole product.' },
      { label: '📵 Rider enters a tunnel (no network)', node: 'phone',
        bad: 'The app freezes or the trip disappears. The rider panics and books a second ride.',
        good: 'The app remembers the trip on the phone, shows "Reconnecting…", and refreshes when the network comes back.',
        lesson: 'Phones lose network all the time. The frontend must handle it calmly.' },
      { label: '🚫 The driver cancels', node: 'backend',
        bad: 'The rider is left waiting with no driver and no message.',
        good: 'The backend quickly finds the next nearest driver and tells the rider: "Finding you a new driver…"',
        lesson: 'Think about what happens when people (not just computers) don\'t do what you expect.' },
      { label: '🐢 The database is very slow', node: 'database',
        bad: 'Finding a driver takes 40 seconds. Many riders give up.',
        good: 'The team keeps live driver locations in a smaller, very fast memory, and only searches nearby.',
        lesson: 'Speed is a product feature. A TPM asks "how fast must this be?" and plans for it.' }
    ]
  },

  spotify: {
    steps: [
      { from: 'phone', to: 'phone', carry: '▶ "Play this song"',
        title: 'You tap Play — the app checks your phone first',
        app: 'Before going online, the app checks: "Is this song already saved on this phone?" If you played it recently, it can start right away.',
        food: 'Before going to the kitchen, the waiter checks: "Is there one ready at the counter already?"',
        tip: 'Keeping a copy close by is called a "cache". It makes things feel instant.' },
      { from: 'phone', to: 'backend', carry: '🔑 "Can I play this?"',
        title: 'The phone asks the backend for permission',
        app: 'The phone asks: "This user wants this song — are they allowed?" The backend checks if you are logged in and whether you are Free or Premium.',
        food: 'The waiter asks the kitchen: "Can this customer order from the VIP menu?"' },
      { from: 'backend', to: 'database', carry: '🔎 Song details?',
        title: 'The backend looks up the song details',
        app: 'The database holds the small information: song title, artist, album, and <strong>where the music file is stored</strong>.',
        food: 'The cook checks the order book for the recipe and where the ingredients are kept.' },
      { from: 'database', to: 'backend', carry: '📄 Title, artist, file location',
        title: 'The database answers',
        app: 'The database says: "It\'s <em>Essence</em> by Wizkid. The music file is stored in the Lagos copy."',
        food: 'The order book says: "Ingredients are in the nearby branch."' },
      { from: 'backend', to: 'phone', carry: '✅ "Allowed. Get it from Lagos."',
        title: 'The backend tells the phone where to get the music',
        app: 'Notice: the big music file does <strong>not</strong> come from the backend or database. The backend just says where to find it.',
        food: 'The kitchen tells the waiter: "Pick it up from the branch next door — it\'s faster."',
        tip: 'Small information and big files are kept in different places. This is a key design idea.' },
      { from: 'phone', to: 'outside', carry: '🎵 "First few seconds, please"',
        title: 'The phone downloads the music from a nearby server',
        app: 'Spotify keeps copies of songs on computers in many cities (a CDN). Your phone downloads from the closest one, starting with just the first few seconds. Music starts playing!',
        food: 'The waiter brings the starter first, so you can begin eating while the rest is prepared.' },
      { from: 'outside', to: 'phone', carry: '📦 Next 15 seconds',
        title: 'The phone keeps loading ahead',
        app: 'While you listen, the phone quietly loads the next part of the song. If the network is weak for a moment, the music keeps playing from what is already loaded.',
        food: 'The waiter brings the next dish before you finish the first one.' },
      { from: 'phone', to: 'backend', carry: '💰 "Played 30 seconds"',
        title: 'After 30 seconds, the play is counted',
        app: 'When you pass 30 seconds, the app tells the backend. The play is saved so the artist can be paid.',
        food: 'At the end, the bill is written in the order book.',
        tip: '🎉 Done! Now try "Break something" below.' }
    ],
    breaks: [
      { label: '🚇 Network drops on a train', node: 'phone',
        bad: 'The music stops every few seconds and the user closes the app.',
        good: 'The music keeps playing from the part already loaded. Downloaded songs work fully offline.',
        lesson: 'Load ahead, and let users save content for offline use.' },
      { label: '🌍 Music stored only in America', node: 'outside',
        bad: 'Every song takes 3–5 seconds to start for users in Nigeria.',
        good: 'Copies are kept on servers in or near Lagos, so songs start in under a second.',
        lesson: 'Distance adds delay. Put content close to your users.' },
      { label: '🗄️ Music files kept in the database', node: 'database',
        bad: 'When millions press play, the database gets overloaded. Even search and login become slow.',
        good: 'The database only keeps small details. Big music files live in separate storage built for big files.',
        lesson: 'Use the right storage for the right job.' },
      { label: '🔑 Login check is slow', node: 'backend',
        bad: 'Users wait several seconds after pressing Play, every single time.',
        good: 'The app remembers you are logged in for a while, so it doesn\'t ask every time.',
        lesson: 'Don\'t repeat slow work that rarely changes.' }
    ]
  },

  whatsapp: {
    steps: [
      { from: 'phone', to: 'phone', carry: '✍️ "See you at 5!"',
        title: 'You type a message and press Send',
        app: 'The app locks (encrypts) your message on your phone, so only your friend can read it — not even WhatsApp.',
        food: 'You seal your note in an envelope before handing it to the waiter.' },
      { from: 'phone', to: 'backend', carry: '🔒 Locked message',
        title: 'The message goes to WhatsApp\'s backend',
        app: 'The backend receives it. You now see <strong>one grey tick ✓</strong> — that means "WhatsApp has your message".',
        food: 'The waiter takes your envelope to the back office.',
        tip: 'Each tick is the frontend telling you where your message is in the journey.' },
      { from: 'backend', to: 'database', carry: '📥 Save until delivered',
        title: 'The backend saves the message for a short time',
        app: 'If your friend\'s phone is off, the backend keeps the message safely until it can be delivered.',
        food: 'The office keeps the envelope in a drawer until your friend arrives.' },
      { from: 'backend', to: 'outside', carry: '🔔 "Wake up, new message"',
        title: 'The backend asks Apple / Google to wake your friend\'s phone',
        app: 'Phones sleep to save battery. WhatsApp uses Apple\'s or Google\'s notification service to "tap your friend on the shoulder".',
        food: 'The office asks a messenger company to tell your friend there is a note waiting.' },
      { from: 'outside', to: 'phone', carry: '🔔 New message!', phoneLabel: "Friend's phone",
        title: 'Your friend\'s phone wakes up',
        app: 'Your friend sees a notification. Their WhatsApp app connects to the backend to collect the message.',
        food: 'Your friend hears there is a note and comes to collect it.' },
      { from: 'backend', to: 'phone', carry: '🔒 Locked message', phoneLabel: "Friend's phone",
        title: 'The message is delivered',
        app: 'The friend\'s phone receives the message and unlocks it. The backend deletes its saved copy. You now see <strong>two grey ticks ✓✓</strong>.',
        food: 'Your friend gets the envelope. The office throws away its record.' },
      { from: 'phone', to: 'backend', carry: '👀 "Read"', phoneLabel: "Friend's phone",
        title: 'Your friend opens the chat',
        app: 'Their phone tells the backend: "Message read."',
        food: 'Your friend tells the office: "I\'ve read it."' },
      { from: 'backend', to: 'phone', carry: '💙 ✓✓', phoneLabel: 'Your phone',
        title: 'Blue ticks appear on your phone',
        app: 'The backend passes the news to you. The ticks turn blue.',
        food: 'The waiter tells you: "Your friend has read your note."',
        tip: '🎉 Done! Now try "Break something" below.' }
    ],
    breaks: [
      { label: '📴 Friend\'s phone is switched off', node: 'phone',
        bad: 'The message is lost and you think your friend ignored you.',
        good: 'The message waits safely on the backend. You see one tick, so you know it hasn\'t arrived yet.',
        lesson: 'Show users honest status. The ticks are a simple, clear design.' },
      { label: '🔔 Notification service is down', node: 'outside',
        bad: 'Messages arrive hours late because phones never "wake up".',
        good: 'When the user opens WhatsApp, it checks for new messages anyway, so nothing is lost.',
        lesson: 'Never depend on just one way of doing an important job.' },
      { label: '📈 New Year\'s Eve: billions of messages', node: 'backend',
        bad: 'The backend gets overloaded and messages fail for everyone.',
        good: 'The team adds more servers ahead of time, because they know this night is always busy.',
        lesson: 'A TPM plans for the busiest day, not the average day.' },
      { label: '🗄️ Database keeps every message forever', node: 'database',
        bad: 'Storage costs explode, and users\' private messages are at risk.',
        good: 'Messages are deleted from the server once delivered, and backed up only if the user chooses.',
        lesson: 'What you choose to store affects cost, speed and privacy.' }
    ]
  }
};

function initFlowDemo() {
  const stage = document.getElementById('flowStage');
  const packet = document.getElementById('packet');
  const packetText = document.getElementById('packetText');
  const nodes = {};
  stage.querySelectorAll('.flow-node').forEach(n => { nodes[n.dataset.node] = n; });

  const el = id => document.getElementById(id);
  const counter = el('stepCounter'), route = el('stepRoute'), title = el('stepTitle'),
        text = el('stepText'), carry = el('stepCarry'), tip = el('stepTip'),
        dots = el('stepDots'), nextBtn = el('nextStep'), prevBtn = el('prevStep'),
        autoBtn = el('autoPlay'), resetBtn = el('resetSteps');

  const nodeNames = { phone: 'Frontend', backend: 'Backend', database: 'Database', outside: 'Outside services' };

  let scenarioKey = 'uber';
  let view = 'app';
  let step = -1;
  let autoTimer = null;

  function scenario() { return SCENARIOS[scenarioKey]; }

  function centerOf(node) {
    const s = stage.getBoundingClientRect();
    const r = node.getBoundingClientRect();
    return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 };
  }

  function placePacket(nodeKey, instant) {
    const c = centerOf(nodes[nodeKey]);
    if (instant) packet.style.transition = 'none';
    packet.style.left = c.x + 'px';
    packet.style.top = c.y + 'px';
    if (instant) { void packet.offsetWidth; packet.style.transition = ''; }
  }

  function setPhoneLabel(label) {
    const sub = nodes.phone.querySelector('.node-sub');
    sub.textContent = view === 'food' ? sub.dataset.food : (label || sub.dataset.app);
  }

  function updateSubs() {
    stage.querySelectorAll('.node-sub').forEach(sub => { sub.textContent = sub.dataset[view]; });
  }

  function clearNodeStates() {
    Object.values(nodes).forEach(n => n.classList.remove('is-from', 'is-to', 'is-broken', 'is-self'));
  }

  function renderDots() {
    dots.innerHTML = '';
    scenario().steps.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'dot' + (i === step ? ' active' : '') + (i < step ? ' done' : '');
      d.setAttribute('aria-label', 'Go to step ' + (i + 1));
      d.addEventListener('click', () => { stopAuto(); goTo(i); });
      dots.appendChild(d);
    });
  }

  function renderIntro() {
    clearNodeStates();
    updateSubs();
    packet.classList.remove('visible');
    placePacket('phone', true);
    counter.textContent = 'Ready';
    route.textContent = '';
    title.textContent = 'Press "Next step" to begin';
    text.textContent = 'You will see each part light up as the message moves through the app.';
    carry.hidden = true;
    tip.hidden = true;
    prevBtn.disabled = true;
    nextBtn.disabled = false;
    nextBtn.textContent = 'Next step →';
    renderDots();
  }

  function goTo(i) {
    const steps = scenario().steps;
    step = i;
    if (step < 0) { renderIntro(); return; }
    const s = steps[step];
    clearNodeStates();
    hideBreak();

    updateSubs();
    setPhoneLabel(s.phoneLabel);

    // Packet starts at "from", then glides to "to"
    packet.classList.add('visible');
    packetText.textContent = s.carry;
    placePacket(s.from, true);
    if (s.from === s.to) {
      nodes[s.to].classList.add('is-self');
    } else {
      nodes[s.from].classList.add('is-from');
      requestAnimationFrame(() => requestAnimationFrame(() => placePacket(s.to, false)));
    }
    nodes[s.to].classList.add('is-to');

    counter.textContent = 'Step ' + (step + 1) + ' of ' + steps.length;
    route.textContent = s.from === s.to
      ? 'Inside: ' + nodeNames[s.from]
      : nodeNames[s.from] + ' → ' + nodeNames[s.to];
    title.textContent = s.title;
    text.innerHTML = view === 'food' ? '🍽️ ' + s.food : s.app;
    carry.hidden = false;
    carry.innerHTML = '<span>Message being carried:</span> <strong>' + s.carry + '</strong>';
    tip.hidden = !s.tip;
    if (s.tip) tip.innerHTML = '<strong>TPM note:</strong> ' + s.tip;

    prevBtn.disabled = false;
    nextBtn.disabled = step === steps.length - 1;
    nextBtn.textContent = step === steps.length - 1 ? 'Finished ✓' : 'Next step →';
    renderDots();
  }

  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    autoBtn.textContent = '▶ Play all';
  }

  function startAuto() {
    if (step >= scenario().steps.length - 1) goTo(-1);
    goTo(step + 1);
    autoBtn.textContent = '⏸ Pause';
    autoTimer = setInterval(() => {
      if (step >= scenario().steps.length - 1) { stopAuto(); return; }
      goTo(step + 1);
    }, 3800);
  }

  nextBtn.addEventListener('click', () => { stopAuto(); goTo(step + 1); });
  prevBtn.addEventListener('click', () => { stopAuto(); goTo(step - 1); });
  resetBtn.addEventListener('click', () => { stopAuto(); goTo(-1); });
  autoBtn.addEventListener('click', () => { autoTimer ? stopAuto() : startAuto(); });

  // Scenario switch
  document.querySelectorAll('.scenario-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      scenarioKey = btn.dataset.scenario;
      stopAuto();
      renderBreakButtons();
      goTo(-1);
    });
  });

  // App / restaurant view switch
  document.querySelectorAll('.toggle-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      view = btn.dataset.view;
      if (step >= 0) goTo(step); else updateSubs();
    });
  });

  // Break something
  const breakButtons = el('breakButtons');
  const breakResult = el('breakResult');

  function hideBreak() {
    breakResult.hidden = true;
    breakButtons.querySelectorAll('.break-btn').forEach(b => b.classList.remove('active'));
  }

  function renderBreakButtons() {
    breakButtons.innerHTML = '';
    scenario().breaks.forEach(br => {
      const b = document.createElement('button');
      b.className = 'break-btn';
      b.textContent = br.label;
      b.addEventListener('click', () => {
        stopAuto();
        breakButtons.querySelectorAll('.break-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        clearNodeStates();
        updateSubs();
        nodes[br.node].classList.add('is-broken');
        packet.classList.remove('visible');
        el('breakBad').textContent = br.bad;
        el('breakGood').textContent = br.good;
        el('breakLesson').textContent = br.lesson;
        breakResult.hidden = false;
        counter.textContent = '💥 Problem';
        route.textContent = 'Broken part: ' + nodeNames[br.node];
        title.textContent = br.label.replace(/^\S+\s/, '');
        text.textContent = 'The red part has a problem. Read below what users would experience, and how a TPM plans for it.';
        carry.hidden = true;
        tip.hidden = true;
        step = -1;
        prevBtn.disabled = true;
        nextBtn.disabled = false;
        nextBtn.textContent = 'Start the journey →';
        renderDots();
      });
      breakButtons.appendChild(b);
    });
  }

  window.addEventListener('resize', () => {
    if (step >= 0) placePacket(scenario().steps[step].to, true);
  });

  renderBreakButtons();
  renderIntro();
}

/* ---------------- Quiz ---------------- */
const QUIZ = [
  { q: 'Which part of an app is the part you see and tap?',
    options: ['Backend', 'Frontend', 'Database', 'Outside service'], answer: 1,
    why: 'The frontend is the screens and buttons — like the dining room and waiter in a restaurant.' },
  { q: 'Where does an app save your account and past orders?',
    options: ['Frontend', 'Outside service', 'Database', 'The internet'], answer: 2,
    why: 'The database is the app\'s memory.' },
  { q: 'Uber uses Google Maps instead of building its own maps. Google Maps is…',
    options: ['A backend', 'An outside service', 'A database', 'A frontend'], answer: 1,
    why: 'It\'s another company\'s tool that Uber "borrows" — an outside service (also called a third-party service).' },
  { q: 'What is an API, in simple words?',
    options: ['A type of phone', 'A programming language', 'The agreed way two pieces of software talk to each other', 'A kind of database'], answer: 2,
    why: 'Like an order slip with a fixed format that the waiter and kitchen both understand.' },
  { q: 'Which question is most typical of a Technical PM?',
    options: ['"Which colour should the button be?"', '"Can our system handle 10x more users, and what does it depend on?"', '"Who should we hire next?"', '"What price should we charge?"'], answer: 1,
    why: 'TPMs think about whether the system can cope, and what it depends on.' },
  { q: 'The payment company your app uses goes down. What is the best TPM plan?',
    options: ['Show an error and wait', 'Remove payments from the app', 'Have a Plan B, like another payment option or paying with cash', 'Blame the payment company'], answer: 2,
    why: 'Good products have a fallback so one failing outside service doesn\'t stop everything.' }
];

function initQuiz() {
  // Rendering, saved answers and scoring live in ../access.js
  TPMQuiz.render(QUIZ, { low: "Good start. Go through the Interactive Demo again, then retry." });
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
    b.checked = store.get('w1_' + b.dataset.key, '0') === '1';
    b.addEventListener('change', () => { store.set('w1_' + b.dataset.key, b.checked ? '1' : '0'); update(); });
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
  ['Frontend', 'The part of an app you see and touch: screens, buttons, menus.'],
  ['Backend', 'The hidden "brain" of the app that follows the rules and makes decisions.'],
  ['Database', 'Where the app saves information so it is still there later — the app\'s memory.'],
  ['API', 'The agreed way two pieces of software talk to each other. Like an order slip between waiter and kitchen.'],
  ['Server', 'A computer (usually in a data centre) that runs the backend and answers requests.'],
  ['Third-party / outside service', 'A tool made by another company that your app uses, like Google Maps or Paystack.'],
  ['Request', 'A message asking for something, e.g. "show me nearby drivers".'],
  ['Response', 'The answer that comes back after a request.'],
  ['Cache', 'A saved copy kept close by so things load faster next time.'],
  ['CDN', 'A network of computers in many cities holding copies of files (videos, music, images) so they reach users quickly.'],
  ['Latency', 'How long you wait for an answer. Lower is better.'],
  ['Scale / scalability', 'Whether a system keeps working well as more and more people use it.'],
  ['Dependency', 'Something your product needs in order to work. If it breaks, you are affected.'],
  ['Fallback / Plan B', 'What the app does when something it depends on fails.'],
  ['Encryption', 'Scrambling information so only the right person can read it.'],
  ['Trade-off', 'Choosing one benefit and accepting a cost, e.g. "faster launch, fewer features".'],
  ['PRD', 'Product Requirements Document — a written plan that explains what to build and why. (Week 4)'],
  ['Technical debt', 'Shortcuts taken to move fast that must be fixed later, like a loan with interest.'],
  ['Sprint', 'A short, fixed period (often 2 weeks) where the team builds a set of tasks. (Week 5)'],
  ['Scope', 'What a project will include — and, just as important, what it will not.']
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
