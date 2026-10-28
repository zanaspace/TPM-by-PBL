/* Week 05: Agile and Engineering Workflows
   Interactive pieces: theme, tabs, meeting game, planning poker,
   the sprint simulator (plan → 10 days → review & retro), quiz,
   capstone checklist, template copy, word bank, scroll spy. */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initChoiceGame(MEET_GAME);
  initPoker();
  initSprintSim();
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
const MEET_GAME = {
  id: 'meet',
  names: { plan: 'Sprint planning', stand: 'Daily standup', review: 'Sprint review', retro: 'Retrospective' },
  items: [
    { task: 'Yesterday I finished the login screen. Today I\'m starting the payment page. I\'m blocked — I don\'t have the designs yet.', answer: 'stand',
      why: 'Yesterday, today, blockers — the classic standup. The TPM should chase those designs today.' },
    { task: 'We usually finish about 30 points. Let\'s not take on 45 just because we feel confident.', answer: 'plan',
      why: 'Deciding how much fits into the sprint happens at planning.' },
    { task: 'Here is the saved-card feature working on a real phone. What do you think?', answer: 'review',
      why: 'Showing finished work to stakeholders is the sprint review (demo).' },
    { task: 'We kept getting surprise requests in the middle of the sprint. From now on, they go to the backlog first.', answer: 'retro',
      why: 'Changing HOW the team works is what the retro is for.' },
    { task: 'Which tickets will get us to the goal "customers can pay with a saved card"?', answer: 'plan',
      why: 'Choosing tickets that serve the sprint goal is the heart of planning.' },
    { task: 'The marketing lead says the new button text is confusing. Let\'s add a ticket for that.', answer: 'review',
      why: 'Feedback from stakeholders on finished work comes up at the review.' },
    { task: 'I felt rushed, and we skipped testing twice. Next time, let\'s plan smaller.', answer: 'retro',
      why: 'An honest look back at how the sprint felt — retro.' },
    { task: 'I\'m still waiting for the API key from the payment company. Day 3 now.', answer: 'stand',
      why: 'A blocker raised in standup. A TPM should never let this reach day 3!' }
  ],
  done: pct => pct >= 0.8 ? 'Excellent! You know what each meeting is for. 🎉'
    : pct >= 0.5 ? 'Nice! Remember: planning = what we\'ll do, standup = today, review = the product, retro = how we work.'
    : 'Read the 4 meeting cards again, then play once more.'
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

/* ---------------- Planning poker ---------------- */
function initPoker() {
  const btn = document.getElementById('pokerReveal');
  const cards = document.querySelectorAll('.poker-card');
  btn.addEventListener('click', () => {
    const revealed = btn.dataset.revealed === '1';
    cards.forEach((c, i) => setTimeout(() => c.classList.toggle('flipped', !revealed), revealed ? 0 : i * 250));
    document.getElementById('pokerResult').hidden = revealed;
    btn.dataset.revealed = revealed ? '0' : '1';
    btn.textContent = revealed ? 'Reveal the votes' : '↺ Hide the votes';
  });
}

/* ---------------- Sprint simulator ----------------
   Each engineer works on one ticket at a time and finishes about 1.25 points
   a day (less when the team is overloaded). A finished ticket spends the
   next day in code review, then it's Done. */
const TICKETS = [
  { id: 't1', title: 'Save a card for next time', type: 'feature', pts: 5, goal: true },
  { id: 't2', title: 'Pay with a saved card in one tap', type: 'feature', pts: 5, goal: true },
  { id: 't3', title: 'Friendly "payment failed" screen', type: 'feature', pts: 3, goal: true },
  { id: 't4', title: 'Reorder your favourite meal', type: 'feature', pts: 5 },
  { id: 't5', title: 'Restaurant photo gallery', type: 'feature', pts: 8 },
  { id: 't6', title: 'Dark mode', type: 'feature', pts: 8 },
  { id: 't7', title: 'Clean up the old checkout code', type: 'debt', pts: 5 },
  { id: 't8', title: 'Update the old payment library (security fix)', type: 'debt', pts: 3 },
  { id: 't9', title: 'Speed up menu loading', type: 'debt', pts: 2 },
  { id: 't10', title: 'Spike: could we take orders on WhatsApp?', type: 'spike', pts: 3 }
];
const BANNER = { id: 'tB', title: 'Valentine\'s promo banner (CEO request)', type: 'feature', pts: 5, extra: true };
const ENGINEERS = [{ name: 'Tobi', icon: '👨🏾‍💻' }, { name: 'Ada', icon: '👩🏽‍💻' }, { name: 'Musa', icon: '🧑🏿‍💻' }];
const RATE = 1.25, OVERLOAD_RATE = 1.05, DAYS = 10;
const TYPE_NAMES = { feature: 'Feature', debt: 'Tech debt', spike: 'Spike' };
const clamp = n => Math.max(0, Math.min(100, Math.round(n)));

function initSprintSim() {
  const el = id => document.getElementById(id);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let selected = ['t1', 't2', 't3'];   // starts with the goal tickets in, so students see the idea
  let S = null;                        // the running sprint
  let autoTimer = null;

  const byId = id => id === BANNER.id ? BANNER : TICKETS.find(t => t.id === id);
  const pointsOf = ids => ids.reduce((s, id) => s + byId(id).pts, 0);

  /* ---------- Stage switching ---------- */
  function showStage(name) {
    stopAuto();
    ['plan', 'run', 'end'].forEach(n => { el('stage' + n[0].toUpperCase() + n.slice(1)).hidden = n !== name; });
    const order = ['plan', 'run', 'end'];
    document.querySelectorAll('#simulation .sim-step').forEach(s => {
      s.classList.toggle('active', s.dataset.stage === name);
      s.classList.toggle('done', order.indexOf(s.dataset.stage) < order.indexOf(name));
    });
  }
  const scrollToSim = () => el('simulation').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

  /* ---------- Stage 1: planning ---------- */
  function ticketHtml(t, extra) {
    return '<span class="tk-type tk-' + t.type + '">' + TYPE_NAMES[t.type] + '</span>' +
      '<span class="tk-title">' + (t.goal ? '⭐ ' : '') + t.title + '</span>' +
      '<span class="tk-pts">' + t.pts + '</span>' + (extra || '');
  }

  function renderPlan() {
    const backlog = el('backlogList'), sprint = el('sprintList');
    backlog.innerHTML = '';
    sprint.innerHTML = '';
    TICKETS.forEach(t => {
      const b = document.createElement('button');
      b.className = 'ticket' + (t.goal ? ' is-goal' : '');
      b.innerHTML = ticketHtml(t);
      b.setAttribute('aria-label', (selected.includes(t.id) ? 'Remove ' : 'Add ') + t.title + ', ' + t.pts + ' points');
      b.addEventListener('click', () => {
        selected = selected.includes(t.id) ? selected.filter(x => x !== t.id) : selected.concat(t.id);
        renderPlan();
      });
      (selected.includes(t.id) ? sprint : backlog).appendChild(b);
    });
    if (!selected.length) sprint.innerHTML = '<p class="empty-note">Nothing yet — tap tickets on the left.</p>';
    if (selected.length === TICKETS.length) backlog.innerHTML = '<p class="empty-note">The whole backlog is in the sprint! 😬</p>';

    const pts = pointsOf(selected);
    el('capPoints').textContent = pts;
    el('capFill').style.width = Math.min(100, pts / 40 * 100) + '%';
    el('capFill').className = 'cap-fill' + (pts > 33 ? ' over' : pts >= 24 ? ' good' : '');
    el('capLabel').textContent = pts > 33 ? 'Too much' : pts >= 24 ? 'Good fit' : pts ? 'Room for more' : '';
    el('capLabel').className = 'cap-label ' + (pts > 33 ? 'bad-text' : pts >= 24 ? 'good-text' : 'muted');

    // Mix vs 70 / 20 / 10
    const mix = { feature: 0, debt: 0, spike: 0 };
    selected.forEach(id => { mix[byId(id).type] += byId(id).pts; });
    el('mixBar').innerHTML = pts ? Object.keys(mix).filter(k => mix[k]).map(k =>
      '<div class="split-seg s-' + (k === 'feature' ? 'feat' : k) + '" style="flex:' + mix[k] + '"></div>').join('') : '';
    const target = { feature: 70, debt: 20, spike: 10 };
    el('mixLegend').innerHTML = Object.keys(mix).map(k =>
      '<span><i class="lg s-' + (k === 'feature' ? 'feat' : k) + '"></i>' + TYPE_NAMES[k] + ' ' + (pts ? Math.round(mix[k] / pts * 100) : 0) + '% <em>(aim ~' + target[k] + '%)</em></span>').join('');

    // Warnings
    const warn = [];
    const missingGoal = TICKETS.filter(t => t.goal && !selected.includes(t.id));
    if (pts > 33) warn.push(['bad', '⚠️ <strong>Over velocity:</strong> the team usually finishes about 30 points. Expect unfinished work and a stressed team.']);
    if (missingGoal.length) warn.push(['bad', '⭐ <strong>Sprint goal at risk:</strong> ' + missingGoal.length + ' goal ticket' + (missingGoal.length > 1 ? 's are' : ' is') + ' still in the backlog.']);
    if (pts && !mix.debt) warn.push(['warn', '🧹 <strong>No tech debt:</strong> the old checkout code may slow the team down.']);
    if (pts && pts < 20) warn.push(['info', 'ℹ️ <strong>Room for more:</strong> the team could take on more work.']);
    if (pts && !warn.length) warn.push(['good', '✅ <strong>Healthy plan:</strong> fits the velocity, includes the goal and some clean-up.']);
    el('planWarnings').innerHTML = warn.map(([c, t]) => '<li class="pw-' + c + '">' + t + '</li>').join('');
    el('startSprint').disabled = !pts;
  }

  el('startSprint').addEventListener('click', () => { startSprint(); showStage('run'); scrollToSim(); });

  /* ---------- Stage 2: running the sprint ---------- */
  function startSprint() {
    // The team works on sprint-goal tickets first, then the rest in the order they were added
    const order = selected.filter(id => byId(id).goal).concat(selected.filter(id => !byId(id).goal));
    S = {
      day: 0,
      tickets: order.map(id => ({ id, pts: byId(id).pts, done: 0, col: 'todo', reviewDay: null, who: null })),
      eng: ENGINEERS.map(e => ({ name: e.name, icon: e.icon, ticket: null, offUntil: 0, offWhy: '' })),
      morale: 80, trust: 70, health: 50,
      flags: {}, good: [], bad: [], log: [], pending: null, standup: []
    };
    const pts = pointsOf(selected);
    if (pts > 33) {
      S.morale -= 10;
      S.flags.overcommit = true;
      S.bad.push('We committed to ' + pts + ' points — more than our velocity of ~30 — so everyone juggled too much.');
      log('😟 The team is worried: ' + pts + ' points is more than they usually finish. Juggling too much slows everyone down.', 'bad');
    } else {
      S.good.push('We planned ' + pts + ' points, close to our real velocity.');
    }
    if (!selected.some(id => byId(id).type === 'debt')) { S.flags.noDebt = true; S.health -= 10; }
    if (TICKETS.some(t => t.goal && !selected.includes(t.id))) {
      S.flags.goalMissingAtStart = true;
      S.bad.push('Not all sprint-goal tickets were in the sprint.');
    }
    el('runLog').innerHTML = '';
    log('📋 Sprint started with ' + pts + ' points. Goal: "Customers can pay with a saved card".', 'info');
    S.standup = [['🧑🏽‍💼', 'You (TPM)', 'Morning team! Goal for this sprint: customers can pay with a saved card. Let\'s go. 🚀']];
    renderRun();
  }

  function log(text, tone) {
    const li = document.createElement('li');
    li.className = 'log-' + (tone || 'info');
    li.innerHTML = (S && S.day ? '<span class="log-time">Day ' + S.day + '</span> ' : '') + text;
    el('runLog').prepend(li);
  }

  const ticketOf = id => S.tickets.find(t => t.id === id);
  const isFree = (e) => S.day > e.offUntil;

  // Daily decisions, shown at the start of the day
  const DECISIONS = {
    2: () => ({
      who: ['🧑🏿‍💻', 'Musa', 'Engineer'],
      title: 'Blocker: "I\'m waiting for PayBridge\'s test API key."',
      text: 'Musa can\'t test saved cards without a key from the payment company. He emailed them yesterday and got no reply.',
      options: [
        { label: '📧 I\'ll call PayBridge today and escalate if needed', apply: () => {
          S.morale += 5;
          S.good.push('The TPM removed Musa\'s blocker on the same day.');
          log('📧 You called PayBridge. Musa had the key by lunchtime.', 'good');
        } },
        { label: '⏳ Let\'s wait for them to reply', apply: () => {
          const musa = S.eng[2];
          musa.offUntil = 4; musa.offWhy = '⛔ Blocked — still waiting for the API key';
          S.morale -= 5; S.flags.waited = true;
          S.bad.push('Musa sat blocked for 3 days waiting for a partner.');
          log('⏳ PayBridge replied on day 5. Musa lost 3 days.', 'bad');
        } }
      ]
    }),
    4: () => ({
      who: ['👩🏾‍💼', 'Funmi', 'CEO'],
      title: '"Can we add a Valentine\'s promo banner this sprint?"',
      text: 'A competitor just launched a promo. Funmi wants a banner in the app. The engineers think it\'s about 5 points.',
      options: [
        { label: '✅ Sure — add it on top', apply: () => {
          addBanner(8);
          pullAdaOntoBanner();
          S.morale -= 10; S.flags.addedOnTop = true;
          S.bad.push('A request was added mid-sprint without removing anything — and it grew from 5 to 8 points.');
          log('➕ Banner added on top. Funmi wants it first, so Ada stops her ticket to start it. It needs new designs: 8 points, not 5.', 'bad');
        } },
        { label: '🔄 Yes — if we take something of the same size out', apply: () => {
          const removed = removeForSwap(5);
          addBanner();
          S.trust += 5; S.flags.swapped = true;
          S.good.push('We swapped work instead of piling it on' + (removed.length ? ' (took out: ' + removed.join(', ') + ').' : '.'));
          log(removed.length ? '🔄 Swapped: banner in, "' + removed.join('", "') + '" back to the backlog.' : '🔄 Nothing unstarted was left to swap out, so the banner simply joined the sprint.', removed.length ? 'good' : 'bad');
          if (!removed.length) S.flags.addedOnTop = true;
        } },
        { label: '📅 First thing next sprint — this sprint is for saved cards', apply: () => {
          S.trust -= 5; S.flags.deferred = true;
          S.good.push('We protected the sprint goal and gave the CEO a clear date.');
          log('📅 Funmi: "OK — as long as saved cards ships." The banner is first in next sprint.', 'info');
        } }
      ]
    }),
    7: () => ({
      who: ['🎧', 'Support team', 'Customer support'],
      title: '🚨 "Customers can\'t use discount codes at checkout!"',
      text: '340 complaints in an hour. It\'s a bug in the live app, not part of this sprint.',
      options: [
        { label: '🧯 Fix it now — Tobi pauses his ticket for a day', apply: () => {
          const tobi = S.eng[0];
          tobi.offUntil = Math.max(tobi.offUntil, 7); tobi.offWhy = '🧯 Fixing the discount-code bug';
          S.trust += 5;
          S.good.push('The urgent production bug was fixed the same day.');
          log('🧯 Tobi fixed the discount bug by evening. Complaints stopped.', 'good');
        } },
        { label: '📌 Add it to next sprint', apply: () => {
          S.trust -= 15; S.flags.bugLeft = true;
          S.bad.push('A serious live bug was left for 2 weeks.');
          log('📌 Bug left for next sprint. Complaints keep coming, and some customers switch apps.', 'bad');
        } }
      ]
    }),
    9: () => {
      const t = S.tickets.find(x => x.col === 'doing');
      if (!t) return null;
      return {
        who: ['👩🏽‍💻', 'Ada', 'Engineer'],
        title: '"Can we skip code review so this counts as done?"',
        text: '"' + byId(t.id).title + '" is almost finished. If nobody reviews the code, it could be marked Done tomorrow.',
        options: [
          { label: '🚀 Skip review this once', apply: () => {
            S.flags.skipReview = true; S.health -= 10;
            S.bad.push('We skipped code review to hit the deadline.');
            log('🚀 Code review skipped for the rest of the sprint.', 'bad');
          } },
          { label: '✅ Keep our Definition of Done', apply: () => {
            S.good.push('We kept our Definition of Done, even under pressure.');
            log('✅ Ada: "Fair. Better a day late than a bug in payments."', 'good');
          } }
        ]
      };
    }
  };

  function addBanner(pts) {
    S.tickets.unshift({ id: BANNER.id, pts: pts || BANNER.pts, done: 0, col: 'todo', reviewDay: null, who: null });
  }

  // The CEO's "do it first" pulls Ada off whatever she was doing; her ticket goes back to the top of To do
  function pullAdaOntoBanner() {
    const ada = S.eng[1];
    const current = ada.ticket && ticketOf(ada.ticket);
    if (current && current.col === 'doing') {
      current.col = 'todo';
      current.who = null;
      S.tickets.splice(S.tickets.indexOf(current), 1);
      S.tickets.splice(1, 0, current);   // straight after the banner
    }
    const banner = ticketOf(BANNER.id);
    banner.col = 'doing'; banner.who = ada.name; ada.ticket = banner.id;
  }

  function removeForSwap(need) {
    const removed = [];
    let freed = 0;
    for (let i = S.tickets.length - 1; i >= 0 && freed < need; i--) {
      const t = S.tickets[i];
      if (t.col === 'todo' && !byId(t.id).goal && t.id !== BANNER.id) {
        freed += t.pts;
        removed.push(byId(t.id).title);
        S.tickets.splice(i, 1);
      }
    }
    return removed;
  }

  function nextDay() {
    if (S.pending || S.day >= DAYS) return;
    S.day++;
    // Morning: reviewed tickets become Done
    S.tickets.forEach(t => { if (t.col === 'review' && t.reviewDay < S.day) { t.col = 'done'; } });
    const make = DECISIONS[S.day];
    const decision = make && make();
    if (decision) {
      S.pending = decision;
      stopAuto();
      renderRun();
      return;
    }
    work();
  }

  function choose(option) {
    option.apply();
    S.pending = null;
    work();
  }

  function work() {
    const lines = [];
    // Day 6: old code surprise
    if (S.day === 6) {
      if (S.flags.noDebt) {
        const t = S.tickets.find(x => byId(x.id).goal && x.col !== 'done' && x.col !== 'review') || S.tickets.find(x => x.col === 'doing');
        if (t) {
          t.pts += 2;
          S.morale -= 5;
          S.bad.push('Old checkout code broke when we changed it, adding 2 points of surprise work.');
          log('🐢 The old checkout code broke when Ada changed it. "' + byId(t.id).title + '" grew by 2 points.', 'bad');
        }
      } else {
        S.health += 5;
        S.good.push('Planned clean-up work made checkout changes safer.');
        log('🧹 Because clean-up was planned, the checkout changes went smoothly.', 'good');
      }
    }

    S.eng.forEach(e => {
      if (!isFree(e)) { lines.push([e.icon, e.name, e.offWhy]); return; }
      // Spend today's capacity; if a ticket finishes early, start the next one with what's left
      let left = S.flags.overcommit ? OVERLOAD_RATE : RATE;
      const said = [];
      while (left > 0.01) {
        let t = e.ticket && ticketOf(e.ticket);
        if (!t || t.col !== 'doing') {
          t = S.tickets.find(x => x.col === 'todo');
          if (!t) { e.ticket = null; if (!said.length) said.push('😐 Nothing left to start — helping test and review.'); break; }
          t.col = 'doing'; t.who = e.name; e.ticket = t.id;
        }
        const use = Math.min(left, t.pts - t.done);
        t.done += use;
        left -= use;
        if (t.done >= t.pts - 0.01) {
          e.ticket = null;
          if (S.flags.skipReview) {
            t.col = 'done';
            said.push('🎉 Finished "' + byId(t.id).title + '" — marked Done with no review.');
          } else {
            t.col = 'review'; t.reviewDay = S.day;
            said.push('🎉 Finished "' + byId(t.id).title + '" — sent for code review.');
          }
        } else {
          said.push((said.length ? 'Started ' : 'Working on ') + '"' + byId(t.id).title + '" (' + Math.floor(t.done) + ' / ' + t.pts + ' pts).');
        }
      }
      lines.push([e.icon, e.name, said.join(' ')]);
    });
    S.standup = lines;
    renderRun();
    if (S.day >= DAYS) {
      stopAuto();
      el('nextDay').textContent = '🎬 Go to sprint review →';
    }
  }

  function renderRun() {
    el('dayNum').textContent = S.day || 1;
    el('dayTrack').innerHTML = Array.from({ length: DAYS }, (_, i) =>
      '<span class="dt' + (i + 1 < S.day || (i + 1 === S.day && !S.pending) ? ' past' : '') + (i + 1 === S.day ? ' now' : '') + (DECISIONS[i + 1] ? ' has-event' : '') + '"></span>').join('');

    // Decision
    const card = el('decisionCard');
    card.hidden = !S.pending;
    if (S.pending) {
      const d = S.pending;
      el('decWho').innerHTML = '<span class="dw-icon">' + d.who[0] + '</span><strong>' + d.who[1] + '</strong> <span>' + d.who[2] + ' · Day ' + S.day + '</span>';
      el('decTitle').textContent = d.title;
      el('decText').textContent = d.text;
      const box = el('decOptions');
      box.innerHTML = '';
      d.options.forEach(o => {
        const b = document.createElement('button');
        b.className = 'dec-btn';
        b.textContent = o.label;
        b.addEventListener('click', () => choose(o));
        box.appendChild(b);
      });
    }
    el('nextDay').disabled = !!S.pending;
    el('autoDays').disabled = !!S.pending || S.day >= DAYS;
    if (S.day < DAYS) el('nextDay').textContent = S.day === 0 ? 'Start day 1 →' : 'Next day →';

    // Board
    ['todo', 'doing', 'review', 'done'].forEach(col => {
      const wrap = document.querySelector('.col[data-col="' + col + '"]');
      const items = S.tickets.filter(t => t.col === col);
      wrap.querySelector('.col-count').textContent = items.length;
      wrap.querySelector('.col-body').innerHTML = items.map(t => {
        const meta = byId(t.id);
        const pct = Math.round(t.done / t.pts * 100);
        return '<div class="card tk-' + meta.type + (meta.goal ? ' is-goal' : '') + (meta.extra ? ' is-extra' : '') + '">' +
          '<div class="card-title">' + (meta.goal ? '⭐ ' : '') + meta.title + '</div>' +
          '<div class="card-meta"><span class="tk-type tk-' + meta.type + '">' + TYPE_NAMES[meta.type] + '</span><span class="tk-pts">' + t.pts + '</span>' +
          (t.who && col === 'doing' ? '<span class="card-who">' + ENGINEERS.find(e => e.name === t.who).icon + ' ' + t.who + '</span>' : '') + '</div>' +
          (col === 'doing' ? '<div class="card-bar"><div style="width:' + pct + '%"></div></div>' : '') + '</div>';
      }).join('') || '<p class="empty-note">—</p>';
    });

    // Standup
    el('standup').innerHTML = S.pending ? '<p class="muted small">⏸ The team is waiting for your decision…</p>'
      : S.standup.map(([icon, name, text]) => '<div class="su-line"><span class="su-icon">' + icon + '</span><div><strong>' + name + '</strong><p>' + text + '</p></div></div>').join('');

    // Meters
    const debtDone = S.tickets.filter(t => t.col === 'done' && byId(t.id).type === 'debt').reduce((s, t) => s + t.pts, 0);
    const health = clamp(S.health + debtDone * 3);
    setMeter('mMorale', clamp(S.morale));
    setMeter('mTrust', clamp(S.trust));
    setMeter('mHealth', health);
  }

  function setMeter(id, v) {
    const bar = el(id);
    bar.style.width = v + '%';
    bar.className = v >= 70 ? 'mb-good' : v >= 45 ? 'mb-warn' : 'mb-bad';
    bar.parentElement.setAttribute('aria-label', v + ' out of 100');
    bar.parentElement.dataset.value = v;
  }

  el('nextDay').addEventListener('click', () => {
    if (S.day >= DAYS && !S.pending) { finishSprint(); return; }
    nextDay();
  });
  el('autoDays').addEventListener('click', () => {
    if (autoTimer) { stopAuto(); return; }
    el('autoDays').textContent = '⏸ Pause';
    autoTimer = setInterval(() => {
      if (S.pending || S.day >= DAYS) { stopAuto(); return; }
      nextDay();
    }, reduceMotion ? 300 : 1100);
    nextDay();
  });
  function stopAuto() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
    el('autoDays').textContent = '⏩ Auto-play';
  }

  /* ---------- Stage 3: review & retro ---------- */
  function finishSprint() {
    const done = S.tickets.filter(t => t.col === 'done');
    const committed = S.tickets.reduce((s, t) => s + t.pts, 0);
    const donePts = done.reduce((s, t) => s + t.pts, 0);
    const goalMet = TICKETS.filter(t => t.goal).every(t => done.some(d => d.id === t.id));
    const bannerTicket = ticketOf(BANNER.id);

    if (goalMet) { S.trust += 10; S.morale += 10; S.good.push('We hit the sprint goal: customers can pay with a saved card.'); }
    else { S.trust -= 15; S.bad.push('We missed the sprint goal.'); }
    if (bannerTicket) {
      if (bannerTicket.col === 'done') S.trust += 5;
      else { S.trust -= 10; S.bad.push('The CEO\'s banner was promised but not finished.'); }
    }
    if (S.flags.deferred && goalMet) S.trust += 5;
    if (committed > 33 && donePts < committed) { S.morale -= 10; }
    if (S.flags.noDebt) S.bad.push('We did no tech debt, so code health got worse.');

    const debtDone = done.filter(t => byId(t.id).type === 'debt').reduce((s, t) => s + t.pts, 0);
    const health = clamp(S.health + debtDone * 3);
    const bugs = (S.flags.skipReview ? 1 : 0) + (S.flags.bugLeft ? 1 : 0);
    if (S.flags.skipReview) S.bad.push('Two days after release, a bug was found in the unreviewed code.');

    const mostDone = donePts >= committed * 0.7;
    el('endBanner').className = 'end-banner ' + (goalMet ? (mostDone ? 'win' : 'meh') : 'lose');
    el('endBanner').innerHTML = goalMet
      ? (mostDone ? '🎉 <strong>Sprint goal met!</strong> Customers can now pay with a saved card.'
        : '😅 <strong>Sprint goal met — just.</strong> But only ' + donePts + ' of ' + committed + ' points were finished. Look at the cost below.')
      : '😞 <strong>Sprint goal missed.</strong> Saved-card payments aren\'t ready for customers yet.';

    const stat = (label, value, tone) => '<div class="end-stat ' + (tone || '') + '"><span>' + label + '</span><strong>' + value + '</strong></div>';
    const tone = v => v >= 70 ? 'good' : v >= 45 ? 'warn' : 'bad';
    el('endStats').innerHTML =
      stat('✅ Points done', donePts + ' / ' + committed, donePts >= committed ? 'good' : donePts >= committed * 0.75 ? 'warn' : 'bad') +
      stat('😊 Team morale', clamp(S.morale), tone(clamp(S.morale))) +
      stat('🤝 Stakeholder trust', clamp(S.trust), tone(clamp(S.trust))) +
      stat('🧹 Code health', health, tone(health)) +
      stat('🐞 Bugs reaching customers', bugs, bugs ? 'bad' : 'good');

    const colName = { todo: '📥 Not started', doing: '🛠️ Still in progress', review: '👀 Waiting for review — not Done', done: '✅ Done' };
    el('endDelivered').innerHTML = S.tickets.map(t =>
      '<li class="ed-' + t.col + '"><span>' + (byId(t.id).goal ? '⭐ ' : '') + byId(t.id).title + ' <em>(' + t.pts + ')</em></span><span>' + colName[t.col] + '</span></li>').join('');

    el('retroGood').innerHTML = (S.good.length ? S.good : ['Everyone showed up and tried hard.']).map(x => '<li>' + x + '</li>').join('');
    el('retroBad').innerHTML = (S.bad.length ? S.bad : ['Honestly — not much! Keep doing what you\'re doing.']).map(x => '<li>' + x + '</li>').join('');

    // Retro action items: the ones linked to what went wrong, plus two that don't fix anything
    const ACTIONS = [
      { when: S.flags.overcommit || (committed > 33 && donePts < committed), text: 'Plan to our real velocity (about 30 points).', why: 'Taking on less means finishing what we promise.' },
      { when: S.flags.waited, text: 'Get partner access (like API keys) before the sprint starts — add it to our Definition of Ready.', why: 'The blocker would never have happened.' },
      { when: S.flags.noDebt, text: 'Keep about 20% of every sprint for tech debt.', why: 'The old checkout code wouldn\'t surprise us again.' },
      { when: S.flags.addedOnTop, text: 'New requests go to the backlog first, not straight into the sprint.', why: 'The sprint goal stays protected.' },
      { when: S.flags.skipReview, text: 'Never skip code review — split work into smaller tickets instead.', why: 'Small tickets finish earlier, so there\'s no rush at the end.' },
      { when: S.flags.bugLeft, text: 'Agree that urgent live bugs are fixed straight away.', why: 'Customers come first — and trust is hard to win back.' },
      { when: S.flags.goalMissingAtStart, text: 'Always put every sprint-goal ticket into the sprint first.', why: 'You can\'t hit a goal you didn\'t plan for.' }
    ].filter(a => a.when);
    const DISTRACTORS = [
      { text: 'Ask everyone to work weekends next sprint.', why: 'Tired people make more mistakes. It hides the problem instead of fixing it.' },
      { text: 'Add a second daily standup.', why: 'More meetings mean less time to build — and it doesn\'t fix the real cause.' }
    ];
    const goodOnes = (ACTIONS.length ? ACTIONS.slice(0, 3) : [{ text: 'Keep doing what we did this sprint, and share it with other teams.', why: 'Good habits are worth repeating — and spreading.' }])
      .map(a => Object.assign({ good: true }, a));
    // Put a distractor second, so the right answer isn't always the first button
    const options = [goodOnes[0], DISTRACTORS[0]].concat(goodOnes.slice(1), DISTRACTORS[1]);
    const box = el('actionOptions');
    box.innerHTML = '';
    el('actionResult').hidden = true;
    options.forEach(o => {
      const b = document.createElement('button');
      b.className = 'dec-btn';
      b.textContent = o.text;
      b.addEventListener('click', () => {
        box.querySelectorAll('.dec-btn').forEach(x => x.classList.remove('picked'));
        b.classList.add('picked');
        const r = el('actionResult');
        r.hidden = false;
        r.className = 'action-result ' + (o.good ? 'good' : 'bad');
        r.innerHTML = (o.good ? '✅ <strong>Good action item.</strong> ' : '🤔 <strong>That probably won\'t help.</strong> ') + o.why;
      });
      box.appendChild(b);
    });

    showStage('end');
    scrollToSim();
  }

  el('replanSprint').addEventListener('click', () => { showStage('plan'); renderPlan(); scrollToSim(); });
  el('resetSprint').addEventListener('click', () => { selected = ['t1', 't2', 't3']; showStage('plan'); renderPlan(); scrollToSim(); });

  renderPlan();
}

/* ---------------- Quiz ---------------- */
const QUIZ = [
  { q: 'What is a sprint?',
    options: ['A race between teams', 'A short, fixed period (about 2 weeks) where the team finishes a set of tickets', 'A very long meeting', 'The day the app launches'], answer: 1,
    why: 'Sprints are short rounds of work. At the end you show what\'s done and improve.' },
  { q: 'What is the TPM\'s most important job in the daily standup?',
    options: ['Check who arrived late', 'Spot blockers and remove them quickly', 'Assign homework', 'Present the roadmap'], answer: 1,
    why: 'A blocker left alone wastes days — like Musa in the simulation.' },
  { q: 'What does "velocity" mean?',
    options: ['How fast the app loads', 'How many points the team usually finishes in a sprint', 'How quickly engineers type', 'The number of meetings per week'], answer: 1,
    why: 'Plan with real velocity, not hopes.' },
  { q: 'A ticket is estimated at 13 points. What should you usually do?',
    options: ['Start it straight away', 'Split it into smaller tickets', 'Delete it', 'Give it to one person to rush'], answer: 1,
    why: 'Big tickets hide risk and are hard to finish in one sprint.' },
  { q: 'Why spend some of each sprint on tech debt?',
    options: ['Engineers like it', 'So old, messy code doesn\'t slow down every future feature', 'To make the sprint look full', 'It\'s required by law'], answer: 1,
    why: 'Like servicing a car — skip it and you break down later.' },
  { q: 'Mid-sprint, the CEO asks for a new 5-point feature. What\'s the best first response?',
    options: ['Say yes and add it on top', 'Say no and ignore them', 'Explain the trade-off: swap something out, or put it first next sprint', 'Ask the engineers to work weekends'], answer: 2,
    why: 'Make the cost visible and protect the sprint goal.' },
  { q: 'What does "Done" mean in a good team?',
    options: ['It works on the engineer\'s laptop', 'The code is written', 'It\'s reviewed, tested and working for real users', 'The designer approved the colours'], answer: 2,
    why: 'That\'s the Definition of Done. "Almost done" isn\'t done.' }
];

function initQuiz() {
  // Rendering, saved answers and scoring live in ../access.js
  TPMQuiz.render(QUIZ, { low: "Good start. Run the sprint simulation again, then retry." });
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
    b.checked = store.get('w5_' + b.dataset.key, '0') === '1';
    b.addEventListener('change', () => { store.set('w5_' + b.dataset.key, b.checked ? '1' : '0'); update(); });
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
  ['Agile', 'Building in small pieces, getting feedback, and improving as you go.'],
  ['Scrum', 'The most popular way to do Agile: work in sprints with 4 regular meetings.'],
  ['Waterfall', 'The older way: plan everything, build everything, then test at the end.'],
  ['Sprint', 'A short, fixed round of work — usually 2 weeks.'],
  ['Sprint goal', 'The one main outcome a sprint must deliver.'],
  ['Backlog', 'The full to-do list for the product, in priority order.'],
  ['Ticket', 'One piece of work on the backlog or board.'],
  ['User story', 'A ticket written from the user\'s view: "As a [user], I want [thing], so that [reason]."'],
  ['Epic', 'A big piece of work made up of many tickets, e.g. "Saved cards".'],
  ['Board (Kanban)', 'Columns like To do → In progress → In review → Done, showing where each ticket is.'],
  ['Daily standup', 'A 15-minute daily check-in: yesterday, today, blockers.'],
  ['Sprint planning', 'The meeting where the team chooses what fits in the sprint.'],
  ['Sprint review', 'The demo of finished work to stakeholders at the end of a sprint.'],
  ['Retrospective (retro)', 'The meeting to discuss how the team worked and what to change.'],
  ['Refinement', 'Going through upcoming tickets so they are clear and sized before planning.'],
  ['Story points', 'A number for how big and risky a ticket is, compared with others.'],
  ['Planning poker', 'Everyone shows their estimate at the same time, then discusses differences.'],
  ['Velocity', 'How many points a team usually finishes in one sprint.'],
  ['Capacity', 'How much the team can do this sprint (e.g. less if someone is on leave).'],
  ['Blocker', 'Something stopping work from moving, like a missing key or decision.'],
  ['Tech debt', 'Shortcuts and old code that make future work slower until cleaned up.'],
  ['Spike', 'Short, time-limited research to answer a question before committing to build.'],
  ['Definition of Ready', 'What a ticket needs before work starts: clear PRD, designs, acceptance criteria.'],
  ['Definition of Done', 'What "finished" means: reviewed, tested, working for real users.'],
  ['Code review', 'Another engineer checks the code before it goes live.'],
  ['RICE', 'Reach × Impact × Confidence ÷ Effort — a score for choosing what goes first.'],
  ['Triage', 'Sorting new requests and bugs: accept, merge, or decline.'],
  ['Feature flag', 'An on/off switch that lets live code stay hidden until you\'re ready.'],
  ['Dogfooding', 'When a company\'s own staff use a new version before customers.'],
  ['Jira / Linear / Trello', 'Popular tools for managing tickets and boards.']
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
