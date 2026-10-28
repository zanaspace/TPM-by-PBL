// Week 06: Engineering Collaboration Logic

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initPrSimulator();
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

function initPrSimulator() {
  const approveBtn = document.getElementById('approvePrBtn');
  const changesBtn = document.getElementById('requestChangesBtn');
  const resultMsg = document.getElementById('prResultMsg');

  approveBtn.addEventListener('click', () => {
    resultMsg.innerHTML = '<span style="color: #10b981;">🚀 PR #402 Approved! Automated deployment triggered to Staging environment.</span>';
  });

  changesBtn.addEventListener('click', () => {
    resultMsg.innerHTML = '<span style="color: #f43f5e;">⚠️ Changes Requested: Did you consider cache invalidation when a user posts a new photo? Please add a webhook listener.</span>';
  });
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
