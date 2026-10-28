// Week 04: Technical PRD Writing Logic

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initPrdGenerator();
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

function initPrdGenerator() {
  const btn = document.getElementById('generatePrdBtn');
  const output = document.getElementById('prdOutputArea');

  function generate() {
    const feature = document.getElementById('prdFeatureName').value.trim() || 'Instant Checkout with Biometrics';
    const product = document.getElementById('prdProductName').value.trim() || 'Fintech Mobile App';
    const kpi = document.getElementById('prdKpi').value.trim() || 'Reduce checkout abandonment from 32% to 18%';
    const latency = document.getElementById('prdLatency').value.trim() || '350';

    const markdown = `# Technical PRD: ${feature}
**Product:** ${product}
**Author:** Technical Product Manager
**Target Release:** Q1 2027
**Status:** Approved for Engineering Sprint

---

## 1. Executive Summary & KPIs
- **Problem Statement:** Users currently experience friction during multi-step card entry, causing high drop-off rates on mobile checkouts.
- **Primary Business Metric:** ${kpi}.
- **Target Audience:** Mobile iOS and Android consumers making single or repeat purchases.

## 2. Functional Requirements (FR)
- **FR-1:** System shall verify biometric credentials (FaceID / TouchID) against device secure enclave via WebAuthn/FIDO2.
- **FR-2:** System shall retrieve the customer's default vaulted payment token without exposing raw PAN credit card numbers.
- **FR-3:** System shall generate an idempotency key per checkout attempt to prevent double debits.

## 3. Non-Functional Requirements (NFR)
- **Latency SLA:** The end-to-end checkout API call must return in <= ${latency}ms at P95 percentile.
- **Availability:** 99.99% uptime with redundant multi-region payment gateway failovers.
- **Security / Compliance:** Full PCI-DSS Level 1 compliance; zero cardholder data persisted on application servers.

## 4. Acceptance Criteria (Gherkin Syntax)
### Scenario 1: Successful Biometric Authentication (Happy Path)
Given a customer is on the final checkout screen with an active cart
And biometrics are enabled on the physical mobile device
When the customer confirms biometric prompt (FaceID success)
Then the client dispatches POST /api/v1/orders/instant-pay with the biometric assertion token
And the backend processes payment authorization with the payment gateway
And the user receives an order confirmation screen within ${latency}ms.

### Scenario 2: Biometric Verification Failure
Given a customer fails biometric authentication 3 consecutive times
When the biometric challenge expires
Then the app falls back seamlessly to standard 6-digit PIN entry
And logs an audit event in Datadog without locking the user account.

## 5. API Specification Contract
- **Endpoint:** POST /api/v1/orders/instant-pay
- **Headers:** 
  - Authorization: Bearer <jwt_session_token>
  - Idempotency-Key: <uuidv4>
- **Request Payload:**
{
  "order_id": "ord_882910",
  "biometric_token": "bio_sig_x99a...",
  "currency": "USD",
  "amount_cents": 4900
}
- **Success Response (200 OK):**
{
  "status": "APPROVED",
  "transaction_id": "txn_3991823",
  "estimated_delivery": "2026-12-05T18:00:00Z"
}`;

    output.value = markdown;
  }

  btn.addEventListener('click', generate);
  generate(); // Initial run
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
