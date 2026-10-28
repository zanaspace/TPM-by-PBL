// Week 09: Security and System Reliability Logic

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initSlaCalculator();
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

const slaData = {
  '99.0': { year: '3.65 days', month: '7.30 hours', week: '1.68 hours', day: '14.4 mins', budget: 'High (Fast Releases)' },
  '99.9': { year: '8.76 hours', month: '43.8 mins', week: '10.1 mins', day: '1.44 mins', budget: 'Standard SaaS' },
  '99.95': { year: '4.38 hours', month: '21.9 mins', week: '5.04 mins', day: '43.2 secs', budget: 'Fintech Standard' },
  '99.99': { year: '52.6 mins', month: '4.38 mins', week: '1.01 mins', day: '8.64 secs', budget: 'Strict / High Availability' },
  '99.999': { year: '5.26 mins', month: '26.3 secs', week: '6.05 secs', day: '864 ms', budget: 'Mission Critical (Zero Room for Error)' }
};

function initSlaCalculator() {
  const select = document.getElementById('slaSelect');
  const grid = document.getElementById('slaResultsGrid');
  if (!select || !grid) return;

  function render(val) {
    const data = slaData[val] || slaData['99.9'];
    grid.innerHTML = `
      <div class="sla-metric-card">
        <span class="sla-metric-label">Allowed Downtime / Year</span>
        <span class="sla-metric-val">${data.year}</span>
      </div>
      <div class="sla-metric-card">
        <span class="sla-metric-label">Allowed Downtime / Month</span>
        <span class="sla-metric-val" style="color: #38bdf8;">${data.month}</span>
      </div>
      <div class="sla-metric-card">
        <span class="sla-metric-label">Allowed Downtime / Week</span>
        <span class="sla-metric-val">${data.week}</span>
      </div>
      <div class="sla-metric-card">
        <span class="sla-metric-label">Error Budget Profile</span>
        <span class="sla-metric-val" style="color: #34d399; font-size: 1.05rem;">${data.budget}</span>
      </div>
    `;
  }

  select.addEventListener('change', (e) => render(e.target.value));
  render('99.9');
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
