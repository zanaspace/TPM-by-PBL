// Week 10: Full System Integration Logic

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initStepper();
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

// Integration Steps Data
const integrationSteps = [
  {
    step: 1,
    title: 'Client Ingestion & API Gateway Ingress',
    source: 'Eater iOS App ➔ Envoy API Gateway',
    protocol: 'HTTPS / TLS 1.3 / HTTP/2',
    desc: 'The iOS client dispatches POST /api/v1/orders with user JWT and item payload. The Envoy Gateway handles TLS termination and checks rate limit quotas.',
    code: 'POST /api/v1/orders HTTP/2\nHost: api.ubereats.com\nAuthorization: Bearer eyJhbGciOi...\nIdempotency-Key: e82f-410a-981c\nContent-Type: application/json\n\n{\n  "restaurant_id": "rest_9921",\n  "items": [{"id": "item_401", "qty": 2}]\n}'
  },
  {
    step: 2,
    title: 'Stateless Authentication & Token Verification',
    source: 'API Gateway ➔ Auth Service',
    protocol: 'Internal gRPC (< 8ms)',
    desc: 'The Gateway validates cryptographic JWT signature with public keys. Verifies user is active, unbanned, and has verified phone number.',
    code: 'gRPC VerifyToken(TokenRequest {\n  token: "eyJhbGciOi...",\n  required_scope: "orders:write"\n}) \n➔ TokenResponse { valid: true, user_id: "usr_5502" }'
  },
  {
    step: 3,
    title: 'Atomic Inventory Lock & Order Creation',
    source: 'Order Service ➔ Redis Distributed Lock',
    protocol: 'TCP / Redis SETNX (Redlock)',
    desc: 'Prevents selling the last pizza to two simultaneous users. Acquires temporary 60-second lock while payment processes.',
    code: 'SET inventory_lock:item_401 "usr_5502" NX EX 60\n➔ "OK" (Lock acquired)'
  },
  {
    step: 4,
    title: 'Synchronous Payment Intent Capture',
    source: 'Billing Service ➔ Stripe Payment Gateway',
    protocol: 'External REST Webhook (280ms)',
    desc: 'Submits payment pre-authorization to banking rails. If card is declined, Redis lock is immediately released (Compensating Transaction).',
    code: 'POST https://api.stripe.com/v1/payment_intents/pi_99182/confirm\n➔ HTTP 200 OK\n{\n  "status": "succeeded",\n  "amount_captured": 3850\n}'
  },
  {
    step: 5,
    title: 'Asynchronous Event Fan-Out & Kitchen Dispatch',
    source: 'Order Service ➔ Apache Kafka Event Stream',
    protocol: 'Kafka Binary Protocol (Non-blocking)',
    desc: 'The order is officially CONFIRMED! Publishes order.created event. Restaurant tablet rings, delivery courier algorithm prepares dispatch, and customer receives confirmation receipt.',
    code: 'Kafka.publish("orders.events", {\n  "event": "ORDER_CONFIRMED",\n  "order_id": "ord_88201",\n  "user_id": "usr_5502",\n  "prep_time_minutes": 18\n})'
  }
];

function initStepper() {
  const stageCard = document.getElementById('stepperStageCard');
  const indicator = document.getElementById('stepIndicator');
  const prevBtn = document.getElementById('stepPrevBtn');
  const nextBtn = document.getElementById('stepNextBtn');

  let currentIdx = 0;

  function renderStep(idx) {
    const s = integrationSteps[idx];
    indicator.textContent = `Step ${s.step} of ${integrationSteps.length}`;
    stageCard.innerHTML = `
      <div style="margin-bottom: 1rem;">
        <span style="font-size: 0.75rem; font-weight: 700; color: #10b981; text-transform: uppercase;">${s.source}</span>
        <h3 style="font-size: 1.25rem; color: #f9fafb; margin-top: 0.25rem;">${s.title}</h3>
        <p style="color: #9ca3af; font-size: 0.88rem; margin-top: 0.5rem;">${s.desc}</p>
        <span style="font-size: 0.75rem; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 0.2rem 0.5rem; border-radius: 4px; display: inline-block; margin-top: 0.5rem;">
          Protocol: ${s.protocol}
        </span>
      </div>

      <div style="background: #0d1117; border: 1px solid #30363d; border-radius: 8px; overflow: hidden;">
        <div style="background: #161b22; padding: 0.4rem 1rem; font-size: 0.75rem; color: #8b949e; font-family: monospace;">Payload & Wire Trace:</div>
        <pre style="padding: 1rem; font-family: monospace; font-size: 0.82rem; color: #cbd5e1; overflow-x: auto;"><code>${s.code}</code></pre>
      </div>
    `;

    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx === integrationSteps.length - 1;
  }

  prevBtn.addEventListener('click', () => {
    if (currentIdx > 0) {
      currentIdx--;
      renderStep(currentIdx);
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentIdx < integrationSteps.length - 1) {
      currentIdx++;
      renderStep(currentIdx);
    }
  });

  renderStep(0);
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
