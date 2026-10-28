// Week 05: Agile and Engineering Workflows Logic

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initSprintCalculator();
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

// Backlog Items Data
const backlogItems = [
  { id: 'item_1', title: 'Biometric FaceID Login Flow', category: 'Feature', catClass: 'cat-feature', points: 5, rice: 850, checked: true },
  { id: 'item_2', title: 'Redis In-Memory Session Cache Layer', category: 'Tech Debt', catClass: 'cat-debt', points: 3, rice: 720, checked: true },
  { id: 'item_3', title: 'Evaluate ClickHouse for Analytics Spike', category: 'Spike', catClass: 'cat-spike', points: 3, rice: 410, checked: true },
  { id: 'item_4', title: 'Stripe Idempotency Header Integration', category: 'Feature', catClass: 'cat-feature', points: 5, rice: 680, checked: true },
  { id: 'item_5', title: 'Upgrade Node.js & Patch Vulnerable NPM Deps', category: 'Tech Debt', catClass: 'cat-debt', points: 2, rice: 600, checked: true },
  { id: 'item_6', title: 'Database Read Replicas & Connection Pool Tuning', category: 'Tech Debt', catClass: 'cat-debt', points: 5, rice: 590, checked: false },
  { id: 'item_7', title: 'One-Click Apple Pay & Google Pay Button', category: 'Feature', catClass: 'cat-feature', points: 8, rice: 520, checked: false },
  { id: 'item_8', title: 'Social Feed Recommendation Re-ranking Algorithm', category: 'Feature', catClass: 'cat-feature', points: 13, rice: 380, checked: false }
];

function initSprintCalculator() {
  const container = document.getElementById('backlogItemsContainer');
  const pointsText = document.getElementById('currentPointsText');
  const statusBadge = document.getElementById('capacityStatusBadge');
  const progressFill = document.getElementById('progressFill');
  const MAX_CAPACITY = 40;

  if (!container) return;

  function renderItems() {
    container.innerHTML = '';
    let totalPoints = 0;

    backlogItems.forEach(item => {
      if (item.checked) totalPoints += item.points;

      const row = document.createElement('div');
      row.className = `backlog-item ${item.checked ? 'selected' : ''}`;
      row.innerHTML = `
        <div class="item-left">
          <input type="checkbox" class="item-checkbox" ${item.checked ? 'checked' : ''} data-id="${item.id}">
          <div>
            <span class="item-title">${item.title}</span>
            <span class="item-category ${item.catClass}">${item.category}</span>
          </div>
        </div>
        <div class="item-right">
          <span class="item-points">${item.points} pts</span>
          <span class="item-rice">RICE: ${item.rice}</span>
        </div>
      `;

      const checkbox = row.querySelector('.item-checkbox');
      checkbox.addEventListener('change', (e) => {
        item.checked = e.target.checked;
        renderItems();
      });

      container.appendChild(row);
    });

    // Update stats
    pointsText.textContent = totalPoints;
    const percentage = Math.min((totalPoints / MAX_CAPACITY) * 100, 100);
    progressFill.style.width = `${percentage}%`;

    if (totalPoints > MAX_CAPACITY) {
      progressFill.style.backgroundColor = '#f43f5e';
      statusBadge.textContent = `⚠️ Overcommitted by ${totalPoints - MAX_CAPACITY} pts`;
      statusBadge.className = 'status-badge over';
    } else if (totalPoints >= 30) {
      progressFill.style.backgroundColor = '#10b981';
      statusBadge.textContent = '✅ Optimal Commitment';
      statusBadge.className = 'status-badge s200';
    } else {
      progressFill.style.backgroundColor = '#3b82f6';
      statusBadge.textContent = 'ℹ️ Under Capacity (Room for more)';
      statusBadge.className = 'status-badge s200';
    }
  }

  renderItems();
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
