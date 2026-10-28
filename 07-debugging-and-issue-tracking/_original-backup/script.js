// Week 07: Debugging and Issue Tracking Logic

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initTriageCalculator();
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

function initTriageCalculator() {
  const impactSelect = document.getElementById('triageImpact');
  const severitySelect = document.getElementById('triageSeverity');
  const outputCard = document.getElementById('triageOutputCard');

  if (!impactSelect || !severitySelect || !outputCard) return;

  function calculate() {
    const impact = impactSelect.value;
    const severity = severitySelect.value;

    let priority = 'P2';
    let pClass = 'p2';
    let sla = 'Current Sprint';
    let protocol = 'File standard ticket in backlog; review during weekly grooming.';

    if (severity === 'revenue' && (impact === 'all' || impact === 'large')) {
      priority = 'P0';
      pClass = 'p0';
      sla = '< 30 Minutes Mitigation';
      protocol = '🚨 CRITICAL INCIDENT: Page on-call engineers via PagerDuty. Open live incident Google Meet room. Post customer status page update.';
    } else if (severity === 'revenue' || (severity === 'feature' && (impact === 'all' || impact === 'large'))) {
      priority = 'P1';
      pClass = 'p1';
      sla = '< 4 Hours';
      protocol = '⚠️ HIGH URGENCY: Assign senior engineer immediately. Prepare hotfix branch. Notify Customer Support of known issue.';
    } else if (severity === 'cosmetic') {
      priority = 'P3';
      pClass = 'p3';
      sla = 'Next Milestone';
      protocol = '🎨 LOW PRIORITY: Group with upcoming design polish sprint. No off-hours interruption.';
    }

    outputCard.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
        <span style="font-size: 0.85rem; color: #9ca3af; text-transform: uppercase; font-weight: 700;">Recommended Priority:</span>
        <span class="p-badge ${pClass}" style="font-size: 0.95rem; padding: 0.3rem 0.8rem;">${priority}</span>
      </div>
      <div style="font-size: 0.9rem; color: #f9fafb; margin-bottom: 0.5rem;">
        <strong>Resolution SLA:</strong> <span style="color: #fda4af;">${sla}</span>
      </div>
      <div style="font-size: 0.85rem; color: #cbd5e1; background: rgba(0,0,0,0.3); padding: 0.85rem; border-radius: 6px; border-left: 3px solid #f43f5e;">
        <strong>TPM Action Protocol:</strong> ${protocol}
      </div>
    `;
  }

  impactSelect.addEventListener('change', calculate);
  severitySelect.addEventListener('change', calculate);
  calculate();
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
