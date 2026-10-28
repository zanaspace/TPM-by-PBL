// Week 08: Scalability and Performance Logic

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initTrafficSimulator();
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

function initTrafficSimulator() {
  const slider = document.getElementById('trafficSlider');
  const trafficText = document.getElementById('trafficValText');
  const cdnToggle = document.getElementById('toggleCdn');
  const redisToggle = document.getElementById('toggleRedis');
  const replicasToggle = document.getElementById('toggleReplicas');
  const autoscaleToggle = document.getElementById('toggleAutoscale');

  const cpuText = document.getElementById('dbCpuText');
  const cpuBar = document.getElementById('dbCpuBar');
  const latencyText = document.getElementById('latencyText');
  const latencyBar = document.getElementById('latencyBar');
  const healthText = document.getElementById('healthText');

  if (!slider) return;

  function update() {
    const rps = parseInt(slider.value, 10);
    trafficText.textContent = `${rps.toLocaleString()} Requests/Sec`;

    // Base database load without optimizations
    let effectiveRps = rps;

    // CDN absorbs 60% of static/read traffic
    if (cdnToggle.checked) {
      effectiveRps *= 0.4;
    }

    // Redis cache absorbs 75% of application queries
    if (redisToggle.checked) {
      effectiveRps *= 0.25;
    }

    // Read Replicas distribute database read query load across 4 nodes
    let dbCpu = (effectiveRps / 120);
    if (replicasToggle.checked) {
      dbCpu /= 3.5;
    }

    dbCpu = Math.min(Math.round(dbCpu), 100);

    // Latency calculation
    let latency = 25 + Math.round((dbCpu * 0.8));
    if (!autoscaleToggle.checked && rps > 40000) {
      latency += (rps - 40000) / 100;
    }
    if (dbCpu >= 90) {
      latency += 800; // Database queue saturation
    }
    latency = Math.round(latency);

    // Update UI
    cpuText.textContent = `${dbCpu}%`;
    cpuBar.style.width = `${dbCpu}%`;

    latencyText.textContent = `${latency}ms`;
    const latencyPct = Math.min((latency / 1000) * 100, 100);
    latencyBar.style.width = `${latencyPct}%`;

    if (dbCpu >= 95 || latency >= 1200) {
      cpuBar.style.background = '#f43f5e';
      latencyBar.style.background = '#f43f5e';
      healthText.textContent = '🔥 CRITICAL (OUTAGE)';
      healthText.style.color = '#f43f5e';
    } else if (dbCpu >= 70 || latency >= 350) {
      cpuBar.style.background = '#f59e0b';
      latencyBar.style.background = '#f59e0b';
      healthText.textContent = '⚠️ DEGRADED (HIGH LOAD)';
      healthText.style.color = '#f59e0b';
    } else {
      cpuBar.style.background = '#38bdf8';
      latencyBar.style.background = '#10b981';
      healthText.textContent = 'HEALTHY';
      healthText.style.color = '#10b981';
    }
  }

  slider.addEventListener('input', update);
  cdnToggle.addEventListener('change', update);
  redisToggle.addEventListener('change', update);
  replicasToggle.addEventListener('change', update);
  autoscaleToggle.addEventListener('change', update);

  update();
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
