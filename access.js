/* PBA TPM Track — shared access, progress and quiz scoring.
   Loaded in the <head> of the portal and of every module page:
     <script src="access.js" data-week="portal"></script>        (portal)
     <script src="../access.js" data-week="3"></script>           (module page)

   - Each week opens on its start date and needs that week's code.
   - The facilitator code unlocks every week on this device, at any time.
   - Unlocks, the learner's name and quiz answers are saved in localStorage.

   Note: this runs in the browser, so it keeps casual visitors out — it is not
   real security. Anyone technical can read or bypass it.

   To change a code: open any page, press F12 → Console, and run
     TPMAccess.fingerprint(5, 'NEWCODE')      (or 'master' instead of 5)
   then paste the result into WEEKS (or MASTER) below. */

(function () {
  const WEEKS = [
    { n: 1, start: '2026-11-02', title: 'Introduction to Technical PM', path: '01-intro-to-technical-pm', code: '339ee17f' },
    { n: 2, start: '2026-11-09', title: 'Systems Thinking and Architecture', path: '02-systems-thinking-and-architecture', code: '99500aac' },
    { n: 3, start: '2026-11-16', title: 'APIs and Data Flow', path: '03-apis-and-data-flow', code: 'd290f6aa' },
    { n: 4, start: '2026-11-23', title: 'Writing a Technical PRD', path: '04-technical-prd-writing', code: '515cb7ce' },
    { n: 5, start: '2026-11-30', title: 'Agile and Engineering Workflows', path: '05-agile-and-engineering-workflows', code: 'f6f1d2b1' },
    { n: 6, start: '2026-12-07', title: 'Working Well with Engineers', path: '06-engineering-collaboration', code: '7b06f81e' },
    { n: 7, start: '2026-12-14', title: 'Debugging and Issue Tracking', path: '07-debugging-and-issue-tracking', code: '00ceadda' },
    { n: 8, start: '2027-01-04', title: 'Scalability and Performance', path: '08-scalability-and-performance', code: 'a4fa04de' },
    { n: 9, start: '2027-01-11', title: 'Security and Reliability', path: '09-security-and-system-reliability', code: '5ea307f8' },
    { n: 10, start: '2027-01-18', title: 'Putting It All Together', path: '10-full-system-integration', code: '7864607b' },
    { n: 11, start: '2027-01-25', title: 'Portfolio and Career in TPM', path: '11-portfolio-and-career-in-tpm', code: '7db64116' },
    { n: 12, start: '2027-02-01', title: 'Career Readiness and Demo Day', path: '12-career-readiness-and-demo-day', code: '6ed6bbd4' }
  ];
  const MASTER = '3e57a658';
  const KEYS = { access: 'tpm_access', learner: 'tpm_learner', quiz: n => 'tpm_quiz_w' + n };

  /* ---------- storage (can throw in private windows) ---------- */
  const store = {
    get(k, fallback) { try { const v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
    remove(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };

  /* ---------- codes and dates ---------- */
  const normalise = s => String(s || '').trim().toUpperCase().replace(/\s+/g, '');
  function fingerprint(week, code) {
    let x = 0x811c9dc5;
    for (const c of 'pba-tpm|' + week + '|' + normalise(code)) { x ^= c.codePointAt(0); x = Math.imul(x, 16777619) >>> 0; }
    return x.toString(16).padStart(8, '0');
  }
  const weekInfo = n => WEEKS.find(w => w.n === Number(n));
  const startDate = n => { const [y, m, d] = weekInfo(n).start.split('-').map(Number); return new Date(y, m - 1, d); };
  const isOpen = n => new Date() >= startDate(n);
  const openLabel = n => startDate(n).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const access = () => store.get(KEYS.access, { weeks: {}, master: false });
  const isUnlocked = n => { const a = access(); return !!(a.master || a.weeks[n]); };
  const isMaster = () => !!access().master;

  // Returns { ok, master?, message }
  function tryCode(n, code) {
    if (!normalise(code)) return { ok: false, message: 'Please type the code.' };
    const a = access();
    if (fingerprint('master', code) === MASTER) {
      a.master = true; a.masterAt = new Date().toISOString(); store.set(KEYS.access, a);
      return { ok: true, master: true, message: 'Facilitator code accepted — every week is unlocked on this device.' };
    }
    const match = WEEKS.find(w => fingerprint(w.n, code) === w.code);
    // Someone copied a stored fingerprint from access.js instead of the real code
    const typed = normalise(code).toLowerCase();
    if (!match && (typed === MASTER || WEEKS.some(w => w.code === typed))) {
      return { ok: false, message: 'That\'s the scrambled fingerprint from access.js, not the code. Use the plain code (e.g. START for Week 1).' };
    }
    if (!match) return { ok: false, message: 'That code isn\'t right. Check with your facilitator.' };
    if (n && match.n !== Number(n)) return { ok: false, message: 'That\'s the code for Week ' + match.n + ', not this week.' };
    if (!isOpen(match.n)) return { ok: false, message: 'Correct code — but Week ' + match.n + ' only opens on ' + openLabel(match.n) + '.' };
    a.weeks[match.n] = { at: new Date().toISOString() };
    store.set(KEYS.access, a);
    return { ok: true, week: match.n, message: 'Week ' + match.n + ' unlocked! 🎉' };
  }

  /* ---------- learner name ---------- */
  const learner = () => store.get(KEYS.learner, '') || '';
  const setLearner = name => store.set(KEYS.learner, String(name || '').trim().slice(0, 40));

  /* ---------- quiz results ---------- */
  // Saved as { answers: { questionIndex: optionIndex }, right: { questionIndex: true|false }, total, updatedAt }
  const quizData = n => store.get(KEYS.quiz(n), { answers: {}, right: {}, total: 0 });
  function quizScore(n) {
    const d = quizData(n);
    const answered = Object.keys(d.answers).length;
    const correct = Object.values(d.right).filter(Boolean).length;
    return { answered, correct, total: d.total, pct: answered ? Math.round(correct / answered * 100) : null };
  }
  function overallScore() {
    let answered = 0, correct = 0, quizzes = 0;
    WEEKS.forEach(w => { const s = quizScore(w.n); if (s.answered) { quizzes++; answered += s.answered; correct += s.correct; } });
    return { answered, correct, quizzes, pct: answered ? Math.round(correct / answered * 100) : null };
  }

  function resetDevice() {
    store.remove(KEYS.access);
    store.remove(KEYS.learner);
    WEEKS.forEach(w => store.remove(KEYS.quiz(w.n)));
  }

  /* ---------- shared styles for the lock screen, card locks and score bar ---------- */
  const CSS = `
html.tpm-locked body > *:not(#tpmLock) { display: none !important; }
#tpmLock { min-height: 100vh; display: grid; place-items: center; padding: 1.5rem 1rem; background: var(--bg-primary, #0b0f19); color: var(--text-main, #f9fafb); font-family: var(--font-main, system-ui, sans-serif); }
.tpm-lock-card { width: 100%; max-width: 440px; background: var(--bg-card, #111827); border: 1px solid var(--border-color, rgba(255,255,255,.1)); border-radius: 18px; padding: 2rem 1.6rem; text-align: center; box-shadow: 0 12px 30px rgba(0,0,0,.35); }
.tpm-lock-icon { font-size: 2.8rem; }
.tpm-lock-card h1 { font-size: 1.35rem; margin: .4rem 0 .3rem; line-height: 1.3; }
.tpm-lock-card p { color: var(--text-muted, #a3acb9); font-size: .95rem; margin: .2rem 0; }
.tpm-form { display: flex; gap: .4rem; margin-top: 1rem; }
.tpm-input { flex: 1; min-width: 0; padding: .65rem .8rem; border-radius: 10px; border: 1px solid var(--border-color, rgba(255,255,255,.15)); background: var(--bg-secondary, #0f172a); color: var(--text-main, #fff); font: inherit; font-size: .95rem; text-transform: uppercase; letter-spacing: .05em; }
.tpm-input.name { text-transform: none; letter-spacing: 0; }
.tpm-input:focus { outline: 2px solid var(--accent-primary, #6366f1); outline-offset: 1px; }
.tpm-btn { border: none; border-radius: 10px; padding: .65rem 1rem; font: inherit; font-weight: 700; font-size: .92rem; cursor: pointer; background: var(--accent-primary, #6366f1); color: #fff; white-space: nowrap; }
.tpm-btn:hover { filter: brightness(1.1); }
.tpm-btn.ghost { background: transparent; color: var(--text-main, #fff); border: 1px solid var(--border-color, rgba(255,255,255,.2)); }
.tpm-msg { min-height: 1.3em; margin-top: .6rem; font-size: .88rem; font-weight: 600; }
.tpm-msg.bad { color: var(--accent-rose, #f43f5e); }
.tpm-msg.good { color: var(--accent-emerald, #10b981); }
.tpm-opens { display: inline-block; margin-top: .6rem; padding: .3rem .8rem; border-radius: 999px; background: rgba(245,158,11,.15); color: var(--accent-amber, #f59e0b); font-weight: 700; font-size: .85rem; }
.tpm-back { display: inline-block; margin-top: 1.1rem; color: var(--accent-secondary, #38bdf8); font-weight: 600; font-size: .9rem; text-decoration: none; }
.tpm-card-lock { margin-top: auto; display: grid; gap: .45rem; padding-top: .8rem; border-top: 1px dashed var(--border-color, rgba(255,255,255,.1)); }
.tpm-card-lock .tpm-form { margin-top: 0; }
.tpm-card-lock .tpm-msg { margin-top: 0; }
.tpm-card-lock .tpm-opens { margin-top: 0; justify-self: start; }
.tpm-card-lock .tpm-hint { font-size: .78rem; color: var(--text-dim, #6b7280); }
.course-card.tpm-is-locked .course-launch-btn { display: none !important; }
.course-card.tpm-is-locked .course-name::before { content: '🔒 '; }
.tpm-chips { display: flex; flex-wrap: wrap; gap: .35rem; margin-top: .2rem; }
.tpm-chip { font-size: .75rem; font-weight: 700; padding: .15rem .55rem; border-radius: 999px; background: rgba(16,185,129,.15); color: var(--accent-emerald, #10b981); }
.tpm-chip.quiz { background: rgba(99,102,241,.16); color: var(--accent-secondary, #38bdf8); }
.tpm-scorebar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .6rem 1rem; margin-bottom: 1rem; padding: .8rem 1rem; border-radius: 12px; background: rgba(99,102,241,.08); border: 1px solid rgba(99,102,241,.3); }
.tpm-scorebar .who { font-weight: 700; }
.tpm-scorebar .who button { margin-left: .4rem; background: none; border: none; color: var(--accent-secondary, #38bdf8); font: inherit; font-size: .82rem; font-weight: 600; cursor: pointer; text-decoration: underline; }
.tpm-scorebar .score { font-family: var(--font-mono, monospace); font-weight: 700; }
.tpm-scorebar .tpm-form { margin-top: 0; flex: 1 1 260px; }
.tpm-saved { font-size: .82rem; color: var(--text-muted, #a3acb9); }
.tpm-progress { background: var(--bg-card, #111827); border: 1px solid var(--border-color, rgba(255,255,255,.1)); border-radius: 20px; padding: 1.4rem 1.5rem; margin-bottom: 2rem; display: grid; gap: 1rem; }
.tpm-progress-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: .6rem 1rem; }
.tpm-progress-head h2 { margin: 0; font-size: 1.3rem; }
.tpm-progress-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .6rem; }
.tpm-progress-stats div { background: var(--bg-secondary, #0f172a); border: 1px solid var(--border-color, rgba(255,255,255,.08)); border-radius: 12px; padding: .7rem .9rem; display: grid; }
.tpm-progress-stats span { font-size: .78rem; color: var(--text-muted, #94a3b8); font-weight: 600; }
.tpm-progress-stats strong { font-family: var(--font-mono, monospace); font-size: 1.35rem; }
.tpm-week-scores { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: .4rem; }
.tpm-week-scores div { display: flex; justify-content: space-between; gap: .5rem; font-size: .85rem; padding: .4rem .65rem; border-radius: 8px; background: var(--bg-secondary, #0f172a); border: 1px solid var(--border-color, rgba(255,255,255,.08)); }
.tpm-week-scores em { font-style: normal; color: var(--text-dim, #64748b); }
.tpm-foot { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .5rem; font-size: .8rem; color: var(--text-dim, #64748b); }
.tpm-foot button { background: none; border: none; color: var(--text-dim, #64748b); font: inherit; text-decoration: underline; cursor: pointer; }
[data-theme="light"] .tpm-opens { color: #b45309; background: rgba(245,158,11,.16); }
[data-theme="light"] .tpm-chip { color: #047857; background: rgba(16,185,129,.14); }
[data-theme="light"] .tpm-chip.quiz { color: #4338ca; background: rgba(99,102,241,.12); }
[data-theme="light"] .tpm-msg.good { color: #047857; }
[data-theme="light"] .tpm-msg.bad { color: #be123c; }
[data-theme="light"] .tpm-back, [data-theme="light"] .tpm-scorebar .who button { color: #0369a1; }
[data-theme="light"] .tpm-card-lock .tpm-hint, [data-theme="light"] .tpm-foot, [data-theme="light"] .tpm-foot button { color: #64748b; }
@media (max-width: 600px) { .tpm-progress-stats { grid-template-columns: 1fr; } .tpm-form { flex-wrap: wrap; } .tpm-form .tpm-btn { flex: 1 1 100%; } }
`;
  function injectCss() {
    if (document.getElementById('tpmAccessCss')) return;
    const s = document.createElement('style');
    s.id = 'tpmAccessCss';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- a code form (used on cards and the lock screen) ---------- */
  function codeForm(n, onUnlock) {
    const wrap = document.createElement('div');
    wrap.innerHTML = '<form class="tpm-form" autocomplete="off"><input class="tpm-input" type="text" aria-label="Week ' + n + ' code" placeholder="Enter code" maxlength="30">' +
      '<button class="tpm-btn" type="submit">Unlock</button></form><div class="tpm-msg" aria-live="polite"></div>';
    const form = wrap.querySelector('form'), input = wrap.querySelector('input'), msg = wrap.querySelector('.tpm-msg');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const r = tryCode(n, input.value);
      msg.textContent = r.message;
      msg.className = 'tpm-msg ' + (r.ok ? 'good' : 'bad');
      if (r.ok) setTimeout(() => onUnlock(r), 600);
      else input.select();
    });
    return wrap;
  }

  /* ---------- module page guard ---------- */
  const script = document.currentScript;
  const pageWeek = script && script.dataset.week;
  const portalHref = script ? script.src.replace(/access\.js(\?.*)?$/, 'index.html') : '../index.html';

  if (pageWeek && pageWeek !== 'portal' && weekInfo(pageWeek) && !isUnlocked(pageWeek)) {
    document.documentElement.classList.add('tpm-locked');
    injectCss();
    document.addEventListener('DOMContentLoaded', () => {
      const n = Number(pageWeek), w = weekInfo(n);
      const lock = document.createElement('div');
      lock.id = 'tpmLock';
      lock.innerHTML = '<div class="tpm-lock-card"><div class="tpm-lock-icon">🔒</div><p>Week ' + String(n).padStart(2, '0') + '</p><h1>' + esc(w.title) + '</h1>' +
        (isOpen(n) ? '<p>This module is locked. Enter the code your facilitator gave you.</p>'
          : '<p>This module isn\'t open yet.</p><span class="tpm-opens">Opens ' + openLabel(n) + '</span>') +
        '<div class="tpm-slot"></div><a class="tpm-back" href="' + esc(portalHref) + '">← Back to all weeks</a></div>';
      lock.querySelector('.tpm-slot').appendChild(codeForm(n, () => location.reload()));
      document.body.prepend(lock);
    });
  }

  /* ---------- quiz with saved answers and score ---------- */
  function renderQuiz(QUIZ, opts) {
    const n = Number(pageWeek);
    const box = document.getElementById('quizBox');
    const result = document.getElementById('quizResult');
    if (!box || !n) return;
    injectCss();
    const low = (opts && opts.low) || 'Good start. Review the lesson, then retry.';
    let d = quizData(n);
    d.total = QUIZ.length;

    // Score bar above the questions
    let bar = document.getElementById('tpmScoreBar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'tpmScoreBar';
      bar.className = 'tpm-scorebar';
      box.parentNode.insertBefore(bar, box);
    }

    function save() { d.updatedAt = new Date().toISOString(); store.set(KEYS.quiz(n), d); }

    function renderBar() {
      const s = quizScore(n);
      const name = learner();
      bar.innerHTML = '';
      if (!name) {
        bar.innerHTML = '<span class="who">👤 Who is answering?</span>';
        const f = document.createElement('form');
        f.className = 'tpm-form';
        f.innerHTML = '<input class="tpm-input name" type="text" placeholder="Type your name" maxlength="40" aria-label="Your name"><button class="tpm-btn" type="submit">Save</button>';
        f.addEventListener('submit', e => { e.preventDefault(); const v = f.querySelector('input').value.trim(); if (v) { setLearner(v); renderBar(); } });
        bar.appendChild(f);
      } else {
        bar.innerHTML = '<span class="who">👤 ' + esc(name) + '<button type="button" data-act="rename">change</button></span>' +
          '<span class="score">Score: ' + s.correct + ' / ' + s.answered + ' answered' + (s.pct !== null ? ' (' + s.pct + '%)' : '') + '</span>' +
          '<span class="tpm-saved">' + s.answered + ' of ' + QUIZ.length + ' questions done • saved on this device</span>';
        bar.querySelector('[data-act=rename]').addEventListener('click', () => { setLearner(''); renderBar(); });
      }
    }

    function markAnswered(card, opts, fb, item, chosen) {
      card.dataset.done = '1';
      const ok = chosen === item.answer;
      opts.querySelectorAll('.quiz-opt').forEach((x, xi) => {
        x.disabled = true;
        if (xi === item.answer) x.classList.add('right');
      });
      if (!ok) opts.children[chosen].classList.add('wrong');
      fb.className = 'quiz-feedback show ' + (ok ? 'is-right' : 'is-wrong');
      fb.textContent = (ok ? '✅ Correct! ' : '❌ Not quite. ') + item.why;
    }

    function showResult() {
      const s = quizScore(n);
      result.hidden = false;
      const msg = s.correct === QUIZ.length ? 'Perfect score! You are ready for the assignment. 🎉'
        : s.pct >= 70 ? 'Great job! Review the ones you missed, then start your assignment.'
        : low;
      result.innerHTML = '<strong>' + (learner() ? esc(learner()) + ', you' : 'You') + ' scored ' + s.correct + ' / ' + QUIZ.length + '.</strong> ' + msg +
        ' <button class="ghost-btn" id="quizRetry">↺ Try again</button>';
      document.getElementById('quizRetry').addEventListener('click', () => {
        store.remove(KEYS.quiz(n));
        renderQuiz(QUIZ, opts);
      });
    }

    box.innerHTML = '';
    result.hidden = true;
    QUIZ.forEach((item, qi) => {
      const card = document.createElement('div');
      card.className = 'quiz-card';
      card.innerHTML = '<p class="quiz-q"><span class="quiz-num">' + (qi + 1) + '</span>' + item.q + '</p>';
      const optsEl = document.createElement('div');
      optsEl.className = 'quiz-options';
      const fb = document.createElement('p');
      fb.className = 'quiz-feedback';
      item.options.forEach((opt, oi) => {
        const b = document.createElement('button');
        b.className = 'quiz-opt';
        b.textContent = opt;
        b.addEventListener('click', () => {
          if (card.dataset.done) return;
          d.answers[qi] = oi;
          d.right[qi] = oi === item.answer;
          save();
          markAnswered(card, optsEl, fb, item, oi);
          renderBar();
          if (Object.keys(d.answers).length === QUIZ.length) showResult();
        });
        optsEl.appendChild(b);
      });
      card.appendChild(optsEl);
      card.appendChild(fb);
      box.appendChild(card);
      if (d.answers[qi] !== undefined && item.options[d.answers[qi]] !== undefined) markAnswered(card, optsEl, fb, item, d.answers[qi]);
    });
    save();
    renderBar();
    if (Object.keys(d.answers).length === QUIZ.length) showResult();
  }

  /* ---------- portal: lock states on cards + progress panel ---------- */
  function renderPortal() {
    injectCss();
    document.querySelectorAll('.course-card[data-week]').forEach(card => {
      const n = Number(card.dataset.week);
      card.querySelectorAll('.tpm-card-lock, .tpm-chips').forEach(x => x.remove());
      const unlocked = isUnlocked(n);
      card.classList.toggle('tpm-is-locked', !unlocked);
      if (unlocked) {
        const s = quizScore(n);
        const chips = document.createElement('div');
        chips.className = 'tpm-chips';
        chips.innerHTML = '<span class="tpm-chip">✅ Unlocked</span>' + (s.answered ? '<span class="tpm-chip quiz">📝 Quiz: ' + s.correct + ' / ' + s.answered + ' answered</span>' : '');
        card.querySelector('.card-header').after(chips);
        return;
      }
      const lock = document.createElement('div');
      lock.className = 'tpm-card-lock';
      lock.innerHTML = isOpen(n)
        ? '<span class="tpm-hint">🔑 Enter this week\'s code to open it</span>'
        : '<span class="tpm-opens">🔒 Opens ' + openLabel(n) + '</span><span class="tpm-hint">Facilitators can unlock early with the facilitator code.</span>';
      lock.appendChild(codeForm(n, () => renderPortal()));
      card.appendChild(lock);
    });

    const panel = document.getElementById('tpmProgress');
    if (!panel) return;
    const o = overallScore();
    const unlockedCount = WEEKS.filter(w => isUnlocked(w.n)).length;
    const name = learner();
    panel.className = 'tpm-progress';
    panel.innerHTML =
      '<div class="tpm-progress-head"><h2>📈 ' + (name ? esc(name) + '\'s progress' : 'My progress') + '</h2><div class="tpm-name-slot"></div></div>' +
      '<div class="tpm-progress-stats"><div><span>🔓 Weeks unlocked</span><strong>' + unlockedCount + ' / ' + WEEKS.length + '</strong></div>' +
      '<div><span>📝 Quiz questions answered</span><strong>' + o.answered + '</strong></div>' +
      '<div><span>🎯 Overall quiz score</span><strong>' + (o.pct === null ? '—' : o.correct + ' / ' + o.answered + ' (' + o.pct + '%)') + '</strong></div></div>' +
      '<div class="tpm-week-scores">' + WEEKS.map(w => {
        const s = quizScore(w.n);
        return '<div><span>Week ' + w.n + '</span>' + (s.answered ? '<strong>' + s.correct + '/' + s.answered + '</strong>' : '<em>' + (isUnlocked(w.n) ? 'not started' : '🔒') + '</em>') + '</div>';
      }).join('') + '</div>' +
      '<div class="tpm-foot"><span>' + (isMaster() ? '🧑🏽‍🏫 Facilitator mode: all weeks unlocked on this device.' : 'Your unlocks and quiz answers are saved on this device only.') + '</span><button type="button" id="tpmReset">Reset this device</button></div>';
    const slot = panel.querySelector('.tpm-name-slot');
    const f = document.createElement('form');
    f.className = 'tpm-form';
    f.innerHTML = '<input class="tpm-input name" type="text" maxlength="40" placeholder="Your name" aria-label="Your name" value="' + esc(name) + '"><button class="tpm-btn ghost" type="submit">' + (name ? 'Update name' : 'Save name') + '</button>';
    f.addEventListener('submit', e => { e.preventDefault(); setLearner(f.querySelector('input').value); renderPortal(); });
    slot.appendChild(f);
    panel.querySelector('#tpmReset').addEventListener('click', () => {
      if (confirm('Remove all unlocks, the saved name and every quiz answer from this device?')) { resetDevice(); renderPortal(); }
    });
  }

  window.TPMAccess = { WEEKS, isOpen, isUnlocked, isMaster, tryCode, openLabel, fingerprint, learner, setLearner, quizScore, overallScore, resetDevice, renderPortal };
  window.TPMQuiz = { render: renderQuiz };
})();
