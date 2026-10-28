// Week 11: Portfolio and Career in Technical PM Logic

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initInterviewSimulator();
  initCopyTemplate();
});

function initTheme() {
  const toggleBtn = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('tpm_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  if (toggleBtn) {
    toggleBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    toggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('tpm_theme', newTheme);
      toggleBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    });
  }
}

function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const pane = document.getElementById(target);
      if (pane) pane.classList.add('active');
    });
  });
}

const interviewBank = {
  q1: {
    title: 'System Design: "Design an API Rate Limiter like Cloudflare"',
    context: 'The interviewer wants to see how you think about algorithms, distributed state, and network edge latency.',
    framework: [
      '1. Clarify Scope & SLAs: Are we rate-limiting by User ID, IP address, or API Token? What is the quota (e.g. 100 req/min)?',
      '2. High-Level Architecture: Client ➔ Load Balancer ➔ Rate Limiter Middleware ➔ Application Server.',
      '3. Choose Algorithm: Compare Token Bucket vs Sliding Window Counter. (Sliding window prevents burst attack at boundary limits).',
      '4. Distributed Storage: Use Redis with atomic commands (MULTI / EXEC or Lua script) to prevent race conditions across server nodes.',
      '5. Error Response: Return HTTP 429 Too Many Requests with headers: X-RateLimit-Limit, X-RateLimit-Remaining, and Retry-After.'
    ],
    interviewerNote: 'Good candidates discuss race conditions in distributed Redis; exceptional candidates mention client-side backoff with jitter.'
  },
  q2: {
    title: 'Technical Trade-offs: "How do you decide between building an in-house auth system vs Auth0?"',
    context: 'Evaluates your Build vs Buy framework, security risk management, and financial ROI.',
    framework: [
      '1. Time-to-Market: Auth0/Clerk integrates in 2 days; building custom OAuth2 + MFA + token rotation takes 3-4 engineer months.',
      '2. Total Cost of Ownership (TCO): Auth0 charges per Monthly Active User (MAU). At 10,000 MAU it is cheap ($100/mo); at 20 million MAU it costs $50,000/mo.',
      '3. Compliance & Security Liability: Auth0 offloads SOC2, HIPAA, and PCI-DSS compliance audits.',
      '4. TPM Recommendation: Buy Auth0 for MVP/growth stage. Plan in-house migration only if MAU costs outstrip 2 senior engineering salaries.'
    ],
    interviewerNote: 'Look for candidates who understand that "free" in-house code actually carries perpetual maintenance and security patching costs.'
  },
  q3: {
    title: 'Behavioral: "Tell me about a time you had a technical disagreement with an engineer"',
    context: 'Tests communication, humility, consensus building, and focus on business value.',
    framework: [
      'Situation: Lead engineer wanted a 4-week architectural rewrite from MySQL to MongoDB before launch.',
      'Task: We had committed a hard marketing launch deadline in 3 weeks, and our current query patterns were 95% relational.',
      'Action: I didn\'t argue opinions. We set up an isolated benchmark testing our peak 5,000 RPS on MySQL with Redis caching vs Mongo.',
      'Result: The benchmark showed MySQL with Redis handled 8,500 RPS easily. The engineer agreed to defer Mongo, and we shipped on time.'
    ],
    interviewerNote: 'The TPM solves conflicts through data, benchmarks, and shared user goals, never by pulling rank.'
  },
  q4: {
    title: 'SRE / Reliability: "Our P99 latency doubled over the weekend. How do you investigate?"',
    context: 'Tests observability, metrics interpretation, and disciplined triage methodology.',
    framework: [
      '1. Check Deployments & Feature Flags: Did any code deploy on Friday? Check Git commit log and LaunchDarkly audit trails.',
      '2. Isolate the Degradation: Is latency high across all endpoints or one specific query? Is it specific to a geographical region or client device?',
      '3. Inspect Golden Signals in Datadog/Grafana: CPU saturation, memory leaks, database connection pool exhaustion, slow unindexed SQL queries.',
      '4. Third-Party Dependencies: Check external status pages (Stripe, AWS, Twilio, SendGrid) for latency spikes.'
    ],
    interviewerNote: 'A strong TPM systematically rules out variables rather than guessing.'
  }
};

function initInterviewSimulator() {
  const select = document.getElementById('interviewQSelect');
  const card = document.getElementById('questionDisplayCard');

  if (!select || !card) return;

  function render(key) {
    const q = interviewBank[key];
    card.innerHTML = `
      <div style="margin-bottom: 1rem;">
        <span style="font-size: 0.75rem; font-weight: 700; color: #f59e0b; text-transform: uppercase;">Interview Prompt</span>
        <h3 style="font-size: 1.2rem; color: #f9fafb; margin-top: 0.25rem;">${q.title}</h3>
        <p style="color: #9ca3af; font-size: 0.88rem; margin-top: 0.5rem;"><em>${q.context}</em></p>
      </div>

      <button id="toggleAnswerBtn" class="primary-btn" style="background: rgba(245, 158, 11, 0.2); color: #fde047; border: 1px solid rgba(245, 158, 11, 0.4); margin-bottom: 1rem;">
        👁️ Reveal Model Answer Structure
      </button>

      <div id="answerSection" style="display: none; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 1.25rem;">
        <h4 style="font-size: 0.95rem; color: #34d399; margin-bottom: 0.75rem;">Structured Answer Architecture:</h4>
        <ul style="padding-left: 1.25rem; font-size: 0.86rem; color: #cbd5e1; display: flex; flex-direction: column; gap: 0.6rem;">
          ${q.framework.map(pt => `<li>${pt}</li>`).join('')}
        </ul>
        <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px dashed rgba(255,255,255,0.1); font-size: 0.82rem; color: #a5b4fc;">
          <strong>🎯 What the Interviewer is Evaluating:</strong> ${q.interviewerNote}
        </div>
      </div>
    `;

    const toggleBtn = card.querySelector('#toggleAnswerBtn');
    const answerSec = card.querySelector('#answerSection');
    toggleBtn.addEventListener('click', () => {
      const isHidden = answerSec.style.display === 'none';
      answerSec.style.display = isHidden ? 'block' : 'none';
      toggleBtn.textContent = isHidden ? '🙈 Hide Model Answer' : '👁️ Reveal Model Answer Structure';
    });
  }

  select.addEventListener('change', (e) => render(e.target.value));
  render('q1');
}

function initCopyTemplate() {
  const copyBtn = document.getElementById('copyTemplateBtn');
  const templateArea = document.getElementById('templateText');

  if (copyBtn && templateArea) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(templateArea.value);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Copied to Clipboard!';
        copyBtn.style.background = '#10b981';
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.style.background = '';
        }, 2500);
      } catch (err) {
        templateArea.select();
        document.execCommand('copy');
      }
    });
  }
}
