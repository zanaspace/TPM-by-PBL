// Week 03: APIs and Data Flow Interactive Sandbox

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initApiTester();
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

// API Presets & Mock Simulator
const apiPresets = {
  'stripe-success': {
    method: 'POST',
    url: 'https://api.stripe.com/v1/payment_intents',
    body: JSON.stringify({
      amount: 5000,
      currency: 'usd',
      payment_method_types: ['card'],
      description: 'PCIP Student Masterclass Course Fee',
      receipt_email: 'student@example.com'
    }, null, 2),
    status: '200 OK',
    statusClass: 's200',
    response: {
      id: 'pi_3NzKl7LkdIwHu7ix0rWk7JvC',
      object: 'payment_intent',
      amount: 5000,
      currency: 'usd',
      status: 'succeeded',
      client_secret: 'pi_3NzKl7_secret_yZ892h...',
      created: 1731776400,
      livemode: false,
      payment_method: 'pm_1NzKl5LkdIwHu7ix7f6z',
      charges: {
        total_count: 1,
        data: [{
          id: 'ch_3NzKl7LkdIwHu7ix0',
          paid: true,
          seller_message: 'Payment complete.'
        }]
      }
    }
  },
  'stripe-declined': {
    method: 'POST',
    url: 'https://api.stripe.com/v1/payment_intents',
    body: JSON.stringify({
      amount: 99900,
      currency: 'usd',
      payment_method: 'pm_card_chargeCustomerFail'
    }, null, 2),
    status: '402 Payment Required',
    statusClass: 's400',
    response: {
      error: {
        code: 'card_declined',
        decline_code: 'insufficient_funds',
        doc_url: 'https://stripe.com/docs/error-codes/card-declined',
        message: 'Your card has insufficient funds.',
        type: 'card_error'
      }
    }
  },
  'stripe-unauth': {
    method: 'POST',
    url: 'https://api.stripe.com/v1/payment_intents',
    body: JSON.stringify({ amount: 1000 }, null, 2),
    status: '401 Unauthorized',
    statusClass: 's400',
    response: {
      error: {
        message: 'You did not provide an API key. You need to provide your API key in the Authorization header using Bearer auth (e.g. \'Authorization: Bearer sk_test_...\').',
        type: 'invalid_request_error'
      }
    }
  },
  'google-directions': {
    method: 'GET',
    url: 'https://maps.googleapis.com/maps/api/directions/json?origin=Victoria+Island+Lagos&destination=Ikeja+City+Mall&key=AIzaSyDEMO',
    body: '// GET requests do not have a request body in HTTP standards.\n// Parameters are encoded in the URL query string.',
    status: '200 OK',
    statusClass: 's200',
    response: {
      geocoded_waypoints: [
        { geocoder_status: 'OK', place_id: 'ChIJ68y...' },
        { geocoder_status: 'OK', place_id: 'ChIJb6a...' }
      ],
      routes: [{
        summary: 'Ikorodu Rd and Third Mainland Bridge',
        legs: [{
          distance: { text: '24.2 km', value: 24200 },
          duration: { text: '42 mins', value: 2520 },
          duration_in_traffic: { text: '1 hour 15 mins', value: 4500 },
          start_address: 'Victoria Island, Lagos, Nigeria',
          end_address: 'Ikeja City Mall, Alausa, Ikeja, Nigeria'
        }],
        overview_polyline: {
          points: 'mz_yAv~c`@eB~CaG{Dw@fBu@bAo@~...[compressed string]'
        }
      }],
      status: 'OK'
    }
  },
  'rate-limited': {
    method: 'GET',
    url: 'https://api.example.com/v1/search?query=iphone',
    body: '// High volume rapid automated polling detected',
    status: '429 Too Many Requests',
    statusClass: 's429',
    response: {
      error: {
        status: 429,
        code: 'rate_limit_exceeded',
        message: 'Rate limit of 60 requests per minute exceeded for this client IP.',
        retry_after_seconds: 14
      }
    }
  }
};

function initApiTester() {
  const methodSelect = document.getElementById('apiMethod');
  const urlInput = document.getElementById('apiUrl');
  const bodyArea = document.getElementById('requestBodyText');
  const responseOutput = document.getElementById('responseOutput');
  const statusBadge = document.getElementById('responseStatusBadge');
  const sendBtn = document.getElementById('sendRequestBtn');
  const presetBtns = document.querySelectorAll('.preset-btn');

  let currentPreset = 'stripe-success';

  function applyPreset(key) {
    const p = apiPresets[key];
    if (!p) return;
    currentPreset = key;
    methodSelect.value = p.method;
    urlInput.value = p.url;
    bodyArea.value = p.body;
  }

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.style.borderColor = '');
      btn.style.borderColor = '#06b6d4';
      applyPreset(btn.dataset.preset);
    });
  });

  sendBtn.addEventListener('click', () => {
    responseOutput.innerHTML = `<code>⏳ Connecting to gateway... Transmitting TLS 1.3 handshake...</code>`;
    sendBtn.disabled = true;
    sendBtn.textContent = '⏳ Processing...';

    setTimeout(() => {
      const p = apiPresets[currentPreset] || apiPresets['stripe-success'];
      statusBadge.textContent = p.status;
      statusBadge.className = `status-badge ${p.statusClass}`;
      responseOutput.innerHTML = `<code>${JSON.stringify(p.response, null, 2)}</code>`;
      sendBtn.disabled = false;
      sendBtn.textContent = '🚀 Send API Request';
    }, 450);
  });

  // Load default
  applyPreset('stripe-success');
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
