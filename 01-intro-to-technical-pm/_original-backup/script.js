// Week 01: Introduction to Technical Product Management
// Interactive Teaching Logic, Real-Time Architecture Simulators & Student Utilities

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initSimulatorModeTabs();
  initUberSimulator();
  initSpotifySimulator();
  initCopyTemplate();
  initScrollSpy();
});

// ==========================================
// 1. THEME MANAGEMENT (Dark / Light)
// ==========================================
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

// ==========================================
// 2. CASE STUDY TAB SWITCHING (Module 1.4)
// ==========================================
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

// ==========================================
// 3. SIMULATOR MODE TABS (Uber vs Spotify)
// ==========================================
function initSimulatorModeTabs() {
  const simTabs = document.querySelectorAll('.sim-mode-btn');
  const uberPanel = document.getElementById('uberSimulatorPanel');
  const spotifyPanel = document.getElementById('spotifySimulatorPanel');

  simTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      simTabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const simType = btn.dataset.sim;
      if (simType === 'uber') {
        if (uberPanel) uberPanel.classList.add('active');
        if (spotifyPanel) spotifyPanel.classList.remove('active');
      } else if (simType === 'spotify') {
        if (uberPanel) uberPanel.classList.remove('active');
        if (spotifyPanel) spotifyPanel.classList.add('active');
      }
    });
  });
}

// ==========================================
// 4. UBER REAL-TIME RIDE DISPATCH SIMULATOR
// ==========================================
function initUberSimulator() {
  // Elements
  const canvas = document.getElementById('uberMapCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const surgeSlider = document.getElementById('surgeSlider');
  const surgeSliderVal = document.getElementById('surgeSliderVal');
  const surgeDisplayBadge = document.getElementById('surgeDisplayBadge');
  const requestBtn = document.getElementById('requestUberBtn');
  const rideOpts = document.querySelectorAll('.ride-opt');
  const pickupSelect = document.getElementById('uberPickupSelect');
  const dropoffSelect = document.getElementById('uberDropoffSelect');
  const driverStatusPin = document.getElementById('driverStatusPin');
  const driverStatusPinText = document.getElementById('driverStatusPinText');
  const wireTraceOutput = document.getElementById('wireTraceOutput');
  const wireLatencyBadge = document.getElementById('wireLatencyBadge');
  const stageStatus = document.getElementById('uberStageStatus');
  const phoneClock = document.getElementById('phoneClock');
  const injectCancelBtn = document.getElementById('injectCancelBtn');
  const injectTunnelBtn = document.getElementById('injectTunnelBtn');

  // Phone Clock updater
  function updatePhoneClock() {
    if (!phoneClock) return;
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    phoneClock.textContent = `${hours}:${minutes} ${ampm}`;
  }
  updatePhoneClock();
  setInterval(updatePhoneClock, 30000);

  // Geographic coordinates for demo presets
  const locations = {
    lekki: { x: 80, y: 190, name: 'Lekki Phase 1, Admiralty Way' },
    vi: { x: 130, y: 120, name: 'Victoria Island, Adeola Odeku' },
    ikeja: { x: 70, y: 60, name: 'Ikeja City Mall, Alausa' },
    airport: { x: 350, y: 60, name: 'International Airport (Terminal 2)' },
    ikoyi: { x: 250, y: 130, name: 'Ikoyi Golf Club, Kingsway' },
    techhub: { x: 330, y: 200, name: 'Yaba Innovation Tech Hub' }
  };

  // Drivers simulation state
  const drivers = [
    {
      id: 'DRV_9821',
      name: 'Babatunde O. (Toyota Camry • 4.92 ★)',
      x: 180,
      y: 160,
      targetX: 180,
      targetY: 160,
      angle: 0,
      speed: 0.8,
      isMatched: false,
      isEnRoute: false,
      color: '#38bdf8'
    },
    {
      id: 'DRV_4419',
      name: 'Chidi N. (Honda Accord • 4.88 ★)',
      x: 230,
      y: 90,
      targetX: 230,
      targetY: 90,
      angle: 0,
      speed: 0.6,
      isMatched: false,
      isEnRoute: false,
      color: '#34d399'
    },
    {
      id: 'DRV_1105',
      name: 'Amina K. (Hyundai Elantra • 4.95 ★)',
      x: 290,
      y: 170,
      targetX: 290,
      targetY: 170,
      angle: 0,
      speed: 0.7,
      isMatched: false,
      isEnRoute: false,
      color: '#fbbf24'
    }
  ];

  let currentSurge = 1.0;
  let selectedRideType = 'uberx';
  let selectedRideBase = 18;
  let activeDriverIndex = 0;
  let isDispatching = false;
  let dispatchTimeoutId = null;
  let routeAnimationProgress = 0;

  // Surge Price Calculation
  function updatePricing() {
    currentSurge = parseFloat(surgeSlider.value);
    let surgeText = `${currentSurge.toFixed(1)}x `;
    if (currentSurge === 1.0) {
      surgeText += '(Normal)';
      surgeSliderVal.style.color = '#38bdf8';
      surgeDisplayBadge.className = 'surge-badge normal';
      surgeDisplayBadge.textContent = 'Surge: 1.0x';
    } else if (currentSurge < 1.7) {
      surgeText += '(Elevated Demand)';
      surgeSliderVal.style.color = '#fbbf24';
      surgeDisplayBadge.className = 'surge-badge surge';
      surgeDisplayBadge.textContent = `Surge: ${currentSurge.toFixed(1)}x`;
    } else {
      surgeText += '(High Peak Surge)';
      surgeSliderVal.style.color = '#f43f5e';
      surgeDisplayBadge.className = 'surge-badge surge';
      surgeDisplayBadge.textContent = `⚡ Surge: ${currentSurge.toFixed(1)}x`;
    }
    surgeSliderVal.textContent = surgeText;

    // Update prices on cards
    document.getElementById('priceUberX').textContent = `$${(18 * currentSurge).toFixed(2)}`;
    document.getElementById('priceComfort').textContent = `$${(26 * currentSurge).toFixed(2)}`;
    document.getElementById('priceBlack').textContent = `$${(45 * currentSurge).toFixed(2)}`;

    updateButtonLabel();
  }

  function updateButtonLabel() {
    const typeNames = { uberx: 'UberX', comfort: 'Comfort', black: 'Black' };
    const currentPrice = (selectedRideBase * currentSurge).toFixed(2);
    if (!isDispatching) {
      requestBtn.textContent = `🚀 Request ${typeNames[selectedRideType]} ($${currentPrice})`;
    }
  }

  surgeSlider.addEventListener('input', updatePricing);

  // Ride Option Selector
  rideOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      rideOpts.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      selectedRideType = opt.dataset.type;
      selectedRideBase = parseFloat(opt.dataset.base);
      updateButtonLabel();
    });
  });

  // Polyline waypoints generator (simple road simulation)
  function getRoutePoints(start, end) {
    // Generate simple Manhattan / road waypoints
    const midX = (start.x + end.x) / 2;
    return [
      { x: start.x, y: start.y },
      { x: midX, y: start.y },
      { x: midX, y: end.y },
      { x: end.x, y: end.y }
    ];
  }

  // Draw H3 Hexagonal Grid overlay on canvas
  function drawHexagon(ctx, x, y, radius, strokeColor, fillColor) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i + Math.PI / 6;
      const hx = x + radius * Math.cos(angle);
      const hy = y + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Draw Car Icon
  function drawCar(ctx, x, y, angle, color, label, isMatched) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Car Body Glow
    if (isMatched) {
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
    }

    // Car chassis
    ctx.fillStyle = isMatched ? '#ffffff' : color;
    ctx.beginPath();
    ctx.roundRect(-12, -7, 24, 14, 4);
    ctx.fill();

    // Windshield
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(2, -5, 5, 10);
    ctx.fillRect(-8, -5, 4, 10);

    // Headlights
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(11, -6, 2, 3);
    ctx.fillRect(11, 3, 2, 3);

    // Light beam
    if (isMatched) {
      const grad = ctx.createLinearGradient(12, 0, 30, 0);
      grad.addColorStop(0, 'rgba(254, 240, 138, 0.4)');
      grad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(12, -6);
      ctx.lineTo(32, -12);
      ctx.lineTo(32, 12);
      ctx.lineTo(12, 6);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    // Text Label above car
    ctx.fillStyle = isMatched ? '#38bdf8' : '#94a3b8';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y - 12);
  }

  // Main Canvas Render Loop
  function renderCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Dark city map background
    ctx.fillStyle = '#080d19';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Stylized Water Body / River
    ctx.fillStyle = '#0e1e38';
    ctx.beginPath();
    ctx.moveTo(180, 0);
    ctx.bezierCurveTo(195, 80, 215, 160, 240, 260);
    ctx.lineTo(210, 260);
    ctx.bezierCurveTo(185, 160, 165, 80, 150, 0);
    ctx.closePath();
    ctx.fill();

    // Bridge over water
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(140, 130);
    ctx.lineTo(230, 130);
    ctx.stroke();

    // 3. Road Network Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 6;
    const roads = [
      // Horizontals
      [{ x: 0, y: 60 }, { x: 420, y: 60 }],
      [{ x: 0, y: 130 }, { x: 420, y: 130 }],
      [{ x: 0, y: 190 }, { x: 420, y: 190 }],
      // Verticals
      [{ x: 80, y: 0 }, { x: 80, y: 260 }],
      [{ x: 130, y: 0 }, { x: 130, y: 260 }],
      [{ x: 250, y: 0 }, { x: 250, y: 260 }],
      [{ x: 330, y: 0 }, { x: 330, y: 260 }]
    ];
    roads.forEach(r => {
      ctx.beginPath();
      ctx.moveTo(r[0].x, r[0].y);
      ctx.lineTo(r[1].x, r[1].y);
      ctx.stroke();
    });

    // Street inner dash lines
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    roads.forEach(r => {
      ctx.beginPath();
      ctx.moveTo(r[0].x, r[0].y);
      ctx.lineTo(r[1].x, r[1].y);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // 4. H3 Hexagonal Geospatial Cells
    const hexRadius = 46;
    const hexCenters = [
      { x: 90, y: 80, id: '882685623ffffff' },
      { x: 170, y: 80, id: '882685622ffffff' },
      { x: 250, y: 80, id: '882685621ffffff' },
      { x: 330, y: 80, id: '882685620ffffff' },
      { x: 130, y: 160, id: '882685624ffffff' },
      { x: 210, y: 160, id: '882685625ffffff' },
      { x: 290, y: 160, id: '882685626ffffff' },
      { x: 90, y: 240, id: '882685627ffffff' }
    ];
    hexCenters.forEach(hex => {
      const isCurrentPickupHex = hex.id === '882685623ffffff';
      const stroke = isCurrentPickupHex ? 'rgba(56, 189, 248, 0.45)' : 'rgba(255, 255, 255, 0.05)';
      const fill = isCurrentPickupHex ? 'rgba(56, 189, 248, 0.07)' : null;
      drawHexagon(ctx, hex.x, hex.y, hexRadius, stroke, fill);
    });

    // 5. Pickup & Dropoff locations
    const pickupLoc = locations[pickupSelect.value] || locations.lekki;
    const dropoffLoc = locations[dropoffSelect.value] || locations.airport;

    // Draw planned trip route line (Dashed green)
    const tripRoute = getRoutePoints(pickupLoc, dropoffLoc);
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(tripRoute[0].x, tripRoute[0].y);
    for (let i = 1; i < tripRoute.length; i++) {
      ctx.lineTo(tripRoute[i].x, tripRoute[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Pickup Marker (Green Pin)
    ctx.save();
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(pickupLoc.x, pickupLoc.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pickupLoc.x, pickupLoc.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 9px system-ui';
    ctx.fillText('PICKUP', pickupLoc.x - 16, pickupLoc.y + 18);

    // Draw Dropoff Marker (Red Pin)
    ctx.save();
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(dropoffLoc.x, dropoffLoc.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(dropoffLoc.x, dropoffLoc.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#fb7185';
    ctx.font = 'bold 9px system-ui';
    ctx.fillText('DESTINATION', dropoffLoc.x - 28, dropoffLoc.y + 18);

    // 6. Matched Driver Path to Pickup
    const matchedDriver = drivers[activeDriverIndex];
    if (matchedDriver && matchedDriver.isEnRoute) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(matchedDriver.x, matchedDriver.y);
      ctx.lineTo(pickupLoc.x, pickupLoc.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 7. Update and Render Cars
    drivers.forEach((driver, idx) => {
      if (driver.isEnRoute && driver.isMatched) {
        // Driver moving towards pickup pin
        const dx = pickupLoc.x - driver.x;
        const dy = pickupLoc.y - driver.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 3) {
          driver.angle = Math.atan2(dy, dx);
          driver.x += Math.cos(driver.angle) * driver.speed * 1.5;
          driver.y += Math.sin(driver.angle) * driver.speed * 1.5;

          // Update driver overlay text
          const distanceKm = (dist / 40).toFixed(1);
          const etaMin = Math.max(1, Math.round(dist / 25));
          if (driverStatusPinText) {
            driverStatusPinText.textContent = `${driver.name} is ${distanceKm} km away (ETA: ${etaMin}m)`;
          }
        } else {
          // Arrived at pickup
          driver.isEnRoute = false;
          if (driverStatusPinText) {
            driverStatusPinText.innerHTML = `<strong>🚗 Driver Arrived!</strong> ${driver.name} is waiting at pickup location.`;
          }
          if (stageStatus) {
            stageStatus.className = 'stage-status-pill success';
            stageStatus.textContent = 'Status: Driver Arrived at Pickup';
          }
        }
      } else {
        // Idle roaming along streets
        if (Math.random() < 0.02) {
          // Pick new random road intersection
          const rx = [80, 130, 250, 330][Math.floor(Math.random() * 4)];
          const ry = [60, 130, 190][Math.floor(Math.random() * 3)];
          driver.targetX = rx;
          driver.targetY = ry;
        }

        const dx = driver.targetX - driver.x;
        const dy = driver.targetY - driver.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 2) {
          driver.angle = Math.atan2(dy, dx);
          driver.x += Math.cos(driver.angle) * driver.speed;
          driver.y += Math.sin(driver.angle) * driver.speed;
        }
      }

      drawCar(ctx, driver.x, driver.y, driver.angle, driver.color, driver.id, driver.isMatched);
    });

    requestAnimationFrame(renderCanvas);
  }

  // Start Canvas animation
  renderCanvas();

  // Helper to log wire trace messages
  function logWire(text, latency = 12) {
    if (!wireTraceOutput) return;
    wireTraceOutput.textContent = text;
    if (wireLatencyBadge) {
      wireLatencyBadge.textContent = `Latency: ${latency} ms`;
    }
  }

  // Pipeline step visual activator
  function setPipelineStep(stepNum, status) {
    const stepEl = document.getElementById(`step${stepNum}`);
    if (!stepEl) return;
    stepEl.classList.remove('current', 'done', 'error');
    if (status === 'current') stepEl.classList.add('current');
    if (status === 'done') stepEl.classList.add('done');
    if (status === 'error') stepEl.classList.add('error');
  }

  function resetPipelineSteps() {
    for (let i = 1; i <= 6; i++) {
      const stepEl = document.getElementById(`step${i}`);
      if (stepEl) stepEl.classList.remove('current', 'done', 'error');
    }
  }

  // Trigger Ride Dispatch Flow
  requestBtn.addEventListener('click', () => {
    if (isDispatching) return;
    isDispatching = true;
    requestBtn.disabled = true;
    requestBtn.textContent = '⏳ Matching Driver...';
    resetPipelineSteps();

    drivers.forEach(d => {
      d.isMatched = false;
      d.isEnRoute = false;
    });
    activeDriverIndex = 0;
    driverStatusPin.style.display = 'flex';
    driverStatusPinText.textContent = 'Contacting Uber Dispatch Mesh...';

    stageStatus.className = 'stage-status-pill active';
    stageStatus.textContent = 'Status: Dispatch In Flight';

    const pickupLoc = locations[pickupSelect.value] || locations.lekki;
    const dropoffLoc = locations[dropoffSelect.value] || locations.airport;
    const ridePrice = (selectedRideBase * currentSurge).toFixed(2);

    // STEP 1: Envoy API Gateway Handshake
    setPipelineStep(1, 'current');
    logWire(`[POST /v1/trips/dispatch HTTP/2]
Host: dispatch-edge.uberinternal.com
Authorization: Bearer jwt_rider_token_99381
X-Uber-Device: iPhone 16 Pro (iOS 18.2)
X-Client-Trace-Id: trace_7fa091bd3302

Payload: {
  "rider_id": "usr_rider_55102",
  "pickup": { "lat": 6.4418, "lon": 3.4209, "address": "${pickupLoc.name}" },
  "dropoff": { "lat": 6.5774, "lon": 3.3212, "address": "${dropoffLoc.name}" },
  "ride_tier": "${selectedRideType.toUpperCase()}"
}
--> 200 OK (Envoy Gateway Authenticated • Rate-Limit: 1/200 req/min)`, 11);

    // STEP 2: H3 Geospatial Indexing (after 900ms)
    dispatchTimeoutId = setTimeout(() => {
      setPipelineStep(1, 'done');
      setPipelineStep(2, 'current');

      logWire(`[H3 Geospatial Service • Microsecond Spatial Query]
H3 Resolution: 8
Pickup Cell Index: 0x882685623ffffff
K-Ring Radius: k=1 (7 neighboring hexagons queried)

Querying In-Memory Redis Cluster:
> GEOSEARCH driver_geo_stream FROMLONLAT 3.4209 6.4418 BYRADIUS 3.0 km WITHCOORD WITHDIST
Result: 3 Drivers in hex cell
  [0] DRV_9821 (Toyota Camry) - 1.2 km away (bearing 45°)
  [1] DRV_4419 (Honda Accord) - 2.1 km away (bearing 180°)
  [2] DRV_1105 (Hyundai Elantra) - 2.8 km away (bearing 310°)`, 18);

      // STEP 3: Surge Pricing & Dijkstra Routing (after 1800ms)
      setTimeout(() => {
        setPipelineStep(2, 'done');
        setPipelineStep(3, 'current');

        logWire(`[Surge Pricing Engine & Dijkstra Graph Engine]
Dynamic Pricing Multiplier: ${currentSurge.toFixed(1)}x
Demand Count: 142 trip requests/min in Hex 882685623ffffff
Active Driver Supply: 88 drivers online
Calculated Trip Fare: $${ridePrice} (Base: $${selectedRideBase}.00)

Dijkstra Road Graph Route:
Distance: 4.8 km • Base Travel Time: 9 mins
Historical Traffic Factor: 1.15 (Moderate congestion on Ozumba Mbadiwe)
Estimated Time of Arrival: 10 mins`, 34);

        // STEP 4: WebSocket Offer & Redlock Atomic Lock (after 2800ms)
        setTimeout(() => {
          setPipelineStep(3, 'done');
          setPipelineStep(4, 'current');

          const matched = drivers[activeDriverIndex];
          matched.isMatched = true;

          logWire(`[Driver WebSocket Broker & Redis Distributed Lock]
Target Driver: ${matched.id} (${matched.name})
WebSocket Frame Pushed: EVENT_DISPATCH_OFFER
{
  "trip_id": "trip_ub_9091823",
  "fare_est": "$${ridePrice}",
  "pickup_distance": "1.2 km",
  "countdown_seconds": 15
}

Acquiring Distributed Redlock:
> SET lock:driver:${matched.id} "trip_ub_9091823" NX PX 15000
Status: 200 OK (Atomic lock acquired - driver cannot receive secondary offers)`, 42);

          // STEP 5: Stripe Pre-Authorization Hold (after 3800ms)
          setTimeout(() => {
            setPipelineStep(4, 'done');
            setPipelineStep(5, 'current');

            logWire(`[Stripe Payments API • Asynchronous Pre-Authorization]
POST https://api.stripe.com/v1/payment_intents
Idempotency-Key: idemp_trip_ub_9091823_auth
Authorization: Bearer sk_live_uber_payments_secret...

{
  "amount": ${Math.round(parseFloat(ridePrice) * 100)},
  "currency": "usd",
  "customer": "cus_991823",
  "capture_method": "manual",
  "metadata": { "trip_id": "trip_ub_9091823", "surge": "${currentSurge}x" }
}
Status: 200 OK (PaymentIntent: pi_3P8a192 - requires_capture)
Funds pre-authorized on Rider's Mastercard ending in 4242.`, 310);

            // STEP 6: Real-Time Driver En Route Telemetry (after 4800ms)
            setTimeout(() => {
              setPipelineStep(5, 'done');
              setPipelineStep(6, 'current');

              matched.isEnRoute = true;
              requestBtn.textContent = '✅ Driver En Route!';
              stageStatus.className = 'stage-status-pill success';
              stageStatus.textContent = 'Status: Driver Matched & Heading to Pickup';

              logWire(`[Real-Time Driver Telemetry Stream (WebSockets)]
Driver ${matched.id} accepted the trip!
Publishing GPS stream via Kafka topic 'driver.telemetry.v1':
{
  "event": "location_ping",
  "trip_id": "trip_ub_9091823",
  "lat": 6.4429,
  "lon": 3.4215,
  "bearing": 112,
  "speed_kmh": 42.5,
  "eta_seconds": 240,
  "timestamp": ${Date.now()}
}
Client receiving real-time vehicle position stream every 4000ms.`, 22);

              setTimeout(() => {
                setPipelineStep(6, 'done');
                isDispatching = false;
                requestBtn.disabled = false;
                updateButtonLabel();
              }, 4000);
            }, 1000);
          }, 1000);
        }, 1000);
      }, 1000);
    }, 900);
  });

  // FAILURE INJECTION 1: Driver Cancellation
  if (injectCancelBtn) {
    injectCancelBtn.addEventListener('click', () => {
      const currentMatched = drivers[activeDriverIndex];
      if (!currentMatched || !currentMatched.isMatched) {
        alert('Please click "Request UberX" first to start a ride dispatch before simulating a cancellation.');
        return;
      }

      setPipelineStep(4, 'error');
      setPipelineStep(6, 'error');
      currentMatched.isMatched = false;
      currentMatched.isEnRoute = false;

      driverStatusPinText.innerHTML = `⚠️ <strong style="color: #fb7185;">Driver ${currentMatched.id} Cancelled!</strong> Automatic failover re-dispatch initiated...`;
      stageStatus.className = 'stage-status-pill error';
      stageStatus.textContent = 'Status: Driver Cancelled • Re-dispatching';

      logWire(`[⚠️ TRIP FAILURE MODE: Driver Cancellation]
Driver ${currentMatched.id} submitted cancellation reason: "Vehicle mechanical issue / flat tire".

TPM Failover Protocol Executing:
1. Releasing Redlock: DEL lock:driver:${currentMatched.id}
2. Voiding old driver dispatch assignment
3. Zero penalty charged to rider card (Stripe authorization preserved with Idempotency Key)
4. Fallback: Querying next nearest driver in H3 hexagon...`, 15);

      // Re-dispatch to driver 2
      setTimeout(() => {
        activeDriverIndex = 1;
        const fallbackDriver = drivers[activeDriverIndex];
        fallbackDriver.isMatched = true;
        fallbackDriver.isEnRoute = true;

        setPipelineStep(4, 'done');
        setPipelineStep(6, 'current');

        driverStatusPinText.innerHTML = `✅ <strong style="color: #34d399;">New Driver Found!</strong> ${fallbackDriver.name} is on the way!`;
        stageStatus.className = 'stage-status-pill success';
        stageStatus.textContent = `Status: Matched with Fallback Driver (${fallbackDriver.id})`;

        logWire(`[Failover Success: Driver Re-assigned]
New Driver: ${fallbackDriver.id} (${fallbackDriver.name})
WebSocket Offer Accepted.
Trip ID: trip_ub_9091823 remains contiguous without rider intervention.
Rider notified with in-app banner update.`, 28);
      }, 2500);
    });
  }

  // FAILURE INJECTION 2: Tunnel Network Drop
  if (injectTunnelBtn) {
    injectTunnelBtn.addEventListener('click', () => {
      setPipelineStep(1, 'error');
      stageStatus.className = 'stage-status-pill error';
      stageStatus.textContent = 'Status: 📵 Network Drop (HTTP 504 / Tunnel)';

      driverStatusPinText.innerHTML = `📵 <strong style="color: #fb7185;">Tunnel Network Drop!</strong> WebSocket disconnected. Retrying with Exponential Backoff...`;

      logWire(`[⚠️ TPM FAILURE MODE: Tunnel Network Drop / Client Offline]
WebSocket connection state: CLOSED (Code 1006 - Abnormal Closure)
Client ping to gateway timed out: HTTP 504 Gateway Timeout.

Client TPM Resilience Pattern:
- Storing active trip state in local SQLite / Encrypted SharedPreferences
- Initiating Exponential Backoff Retry Loop:
    Attempt 1: wait 1000ms
    Attempt 2: wait 2000ms
    Attempt 3: wait 4000ms`, 999);

      setTimeout(() => {
        setPipelineStep(1, 'current');
        driverStatusPinText.innerHTML = `🔄 Attempting reconnection (Backoff 2000ms)...`;

        setTimeout(() => {
          setPipelineStep(1, 'done');
          stageStatus.className = 'stage-status-pill success';
          stageStatus.textContent = 'Status: Reconnected & State Synchronized';
          driverStatusPinText.innerHTML = `✅ <strong style="color: #34d399;">Reconnected!</strong> Active trip state restored seamlessly.`;

          logWire(`[Reconnection Success: Telemetry Restored]
Envoy API Gateway TLS 1.3 handshake completed.
WebSocket connection re-established with session token.
Missed GPS coordinate frames retrieved from Kafka consumer offset.
Zero data loss occurred.`, 16);
        }, 2000);
      }, 1500);
    });
  }
}

// ==========================================
// 5. SPOTIFY INSTANT AUDIO STREAMING SIMULATOR
// ==========================================
function initSpotifySimulator() {
  const playBtn = document.getElementById('spPlayBtn');
  if (!playBtn) return;

  const prevBtn = document.getElementById('spPrevBtn');
  const nextBtn = document.getElementById('spNextBtn');
  const waves = document.getElementById('nowPlayingWaves');
  const trackTitle = document.getElementById('trackTitle');
  const trackArtist = document.getElementById('trackArtist');
  const userTierBadge = document.getElementById('userTierBadge');
  const bufferSecondsText = document.getElementById('bufferSecondsText');
  const bufferFilledBar = document.getElementById('bufferFilledBar');
  const playbackPlayedBar = document.getElementById('playbackPlayedBar');
  const playbackCurrentTime = document.getElementById('playbackCurrentTime');
  const playbackTotalTime = document.getElementById('playbackTotalTime');
  const networkSelect = document.getElementById('spNetworkSelect');
  const bitrateSelect = document.getElementById('spBitrateSelect');
  const spStreamStatus = document.getElementById('spStreamStatus');
  const spChunkBadge = document.getElementById('spChunkBadge');
  const spWireOutput = document.getElementById('spWireOutput');

  // Playlist data
  const playlist = [
    { title: 'Blinding Lights', artist: 'The Weeknd • After Hours (2020)', totalSec: 200, durationStr: '3:20' },
    { title: 'Levitating', artist: 'Dua Lipa • Future Nostalgia (2020)', totalSec: 203, durationStr: '3:23' },
    { title: 'Starboy', artist: 'The Weeknd ft. Daft Punk (2016)', totalSec: 230, durationStr: '3:50' }
  ];

  let currentTrackIndex = 0;
  let isPlaying = false;
  let currentSeconds = 0;
  let bufferedSeconds = 0;
  let tickerInterval = null;
  let chunkCounter = 1;
  let royaltyMilestoneFired = false;

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function logSpotifyWire(text, chunkStr = null) {
    if (spWireOutput) spWireOutput.textContent = text;
    if (chunkStr && spChunkBadge) spChunkBadge.textContent = chunkStr;
  }

  function setSpotifyStep(stepNum, status) {
    const el = document.getElementById(`spStep${stepNum}`);
    if (!el) return;
    el.classList.remove('current', 'done', 'error');
    if (status === 'current') el.classList.add('current');
    if (status === 'done') el.classList.add('done');
    if (status === 'error') el.classList.add('error');
  }

  function resetSpotifySteps() {
    for (let i = 1; i <= 5; i++) {
      const el = document.getElementById(`spStep${i}`);
      if (el) el.classList.remove('current', 'done', 'error');
    }
  }

  function updateTrackUI() {
    const track = playlist[currentTrackIndex];
    if (trackTitle) trackTitle.textContent = track.title;
    if (trackArtist) trackArtist.textContent = track.artist;
    if (playbackTotalTime) playbackTotalTime.textContent = track.durationStr;
    playbackCurrentTime.textContent = formatTime(currentSeconds);

    const playPercent = (currentSeconds / track.totalSec) * 100;
    const bufPercent = (bufferedSeconds / track.totalSec) * 100;

    if (playbackPlayedBar) playbackPlayedBar.style.width = `${playPercent}%`;
    if (bufferFilledBar) bufferFilledBar.style.width = `${Math.min(100, bufPercent)}%`;

    const aheadSec = Math.max(0, Math.round(bufferedSeconds - currentSeconds));
    const bitrate = parseInt(bitrateSelect.value);
    const ramMb = ((aheadSec * (bitrate / 8)) / 1024).toFixed(1);
    if (bufferSecondsText) {
      bufferSecondsText.textContent = `Buffered: ${aheadSec}s ahead (${ramMb} MB in RAM)`;
    }
  }

  function togglePlay() {
    if (isPlaying) {
      pausePlayback();
    } else {
      startPlayback();
    }
  }

  function pausePlayback() {
    isPlaying = false;
    playBtn.textContent = '▶';
    if (waves) waves.classList.remove('playing');
    if (spStreamStatus) {
      spStreamStatus.className = 'stage-status-pill idle';
      spStreamStatus.textContent = 'Stream: Paused';
    }
    clearInterval(tickerInterval);
  }

  function startPlayback() {
    isPlaying = true;
    playBtn.textContent = '⏸';
    if (waves) waves.classList.add('playing');

    const network = networkSelect.value;
    const bitrate = bitrateSelect.value;
    const track = playlist[currentTrackIndex];

    if (spStreamStatus) {
      spStreamStatus.className = 'stage-status-pill success';
      spStreamStatus.textContent = `Stream: Playing (${bitrate}kbps • HTTP/3)`;
    }

    // Pipeline Step 1: LRU Disk Cache
    setSpotifyStep(1, 'current');
    logSpotifyWire(`[1. Local LRU Flash Storage Cache Probe]
Track ID: sp_track_${track.title.toLowerCase().replace(/\s+/g, '_')}
Checking local cache on client device:
Result: Cache Header Hit! (< 15ms)
Decrypting local AES-128 key for introductory 5-second chunk...
Audio engine begins immediate instant playback in 18ms!`, `Chunk: 1 / ${Math.round(track.totalSec / 10)}`);

    setTimeout(() => {
      setSpotifyStep(1, 'done');
      setSpotifyStep(2, 'current');

      // Pipeline Step 2: Hermes Gateway
      logSpotifyWire(`[2. Hermes Playback Gateway & DRM License Validation]
POST https://hermes.spotify.com/v1/playback/license
User ID: usr_premium_90241 (Tier: Spotify Premium)
Requested Bitrate: ${bitrate} kbps (Ogg Vorbis)
Widevine DRM Decryption Token Verified.
Fastly CDN Edge URI allocated:
https://audio-cf.spotifycdn.com/tracks/${track.title.toLowerCase().replace(/\s+/g, '')}.ogg`, `License: OK`);

      setTimeout(() => {
        setSpotifyStep(2, 'done');
        setSpotifyStep(3, 'current');

        // Pipeline Step 3: HTTP/3 Byte-Range
        logSpotifyWire(`[3. CDN Edge HTTP/3 Range Request Engine]
GET /tracks/${track.title.toLowerCase().replace(/\s+/g, '')}.ogg HTTP/3
Host: audio-cf.spotifycdn.com
Range: bytes=0-524288
Priority: u=1, i (High-priority audio stream)

Status: 206 Partial Content
Content-Range: bytes 0-524287/8400000
Content-Type: audio/ogg; codecs="vorbis"
Round Trip Time: ${network === '5g' ? '12ms' : network === '3g' ? '240ms' : 'OFFLINE'}`, `Chunk: 1 / 20`);

        setSpotifyStep(4, 'current');
      }, 700);
    }, 700);

    // Initial buffer jump
    if (bufferedSeconds === 0) {
      bufferedSeconds = 15;
    }

    clearInterval(tickerInterval);
    tickerInterval = setInterval(streamTick, 1000);
  }

  function streamTick() {
    const track = playlist[currentTrackIndex];
    const network = networkSelect.value;
    const bitrate = parseInt(bitrateSelect.value);

    // Check offline buffer underrun
    if (network === 'offline' && bufferedSeconds <= currentSeconds) {
      // Buffer Starvation!
      pausePlayback();
      setSpotifyStep(4, 'error');
      if (spStreamStatus) {
        spStreamStatus.className = 'stage-status-pill error';
        spStreamStatus.textContent = '⚠️ Buffer Starvation (Offline)';
      }
      logSpotifyWire(`[⚠️ STREAM STALL: Circular Buffer Underrun]
Device is offline (airplane/subway mode) and local ring buffer is exhausted!
Buffer Size: 0.0 MB remaining.
Audio player paused automatically to prevent harsh audio distortion.
TPM Strategy: Render offline toast and alert user to sync playlists.`, `Underrun`);
      return;
    }

    currentSeconds++;

    // Buffer Growth depends on network speed
    if (network === '5g') {
      bufferedSeconds = Math.min(track.totalSec, bufferedSeconds + 3); // Fills fast
    } else if (network === '3g') {
      bufferedSeconds = Math.min(track.totalSec, bufferedSeconds + 1); // Fills moderately
    } else {
      // Offline: buffer does NOT grow at all!
    }

    // 30-Second Royalty Milestone Trigger!
    if (currentSeconds >= 30 && !royaltyMilestoneFired) {
      royaltyMilestoneFired = true;
      setSpotifyStep(5, 'done');

      logSpotifyWire(`[🎉 30-SECOND ROYALTY MILESTONE EVENT PUBLISHED]
Topic: 'telemetry.playback.royalty_events'
Key: 'sp_track_${track.title.toLowerCase().replace(/\s+/g, '_')}'
Payload:
{
  "event_type": "QUALIFIED_PLAY_COUNT",
  "track_id": "sp_tr_${track.title.toLowerCase().replace(/\s+/g, '_')}",
  "user_id": "usr_premium_90241",
  "playback_ms": 30000,
  "royalty_eligible": true,
  "payout_pool": "direct_licensing_pool",
  "timestamp": "${new Date().toISOString()}"
}
--> Kafka Broker Acknowledged. Artist stream counted for royalties!`, `Milestone: 30s ✓`);
    } else if (currentSeconds % 10 === 0 && network !== 'offline') {
      chunkCounter++;
      const byteStart = chunkCounter * 524288;
      const byteEnd = byteStart + 524287;
      logSpotifyWire(`[HTTP/3 Range Request • Chunk #${chunkCounter}]
GET /tracks/${track.title.toLowerCase().replace(/\s+/g, '')}.ogg HTTP/3
Range: bytes=${byteStart}-${byteEnd}
Status: 206 Partial Content (${(524288 / 1024).toFixed(0)} KB downloaded)
Circular Ring Buffer Allocated: ${Math.round(bufferedSeconds - currentSeconds)}s ahead in memory`, `Chunk: ${chunkCounter} / ${Math.round(track.totalSec / 10)}`);
    }

    if (currentSeconds >= track.totalSec) {
      nextTrack();
    } else {
      updateTrackUI();
    }
  }

  function nextTrack() {
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    resetTrack();
  }

  function prevTrack() {
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    resetTrack();
  }

  function resetTrack() {
    currentSeconds = 0;
    bufferedSeconds = 0;
    chunkCounter = 1;
    royaltyMilestoneFired = false;
    resetSpotifySteps();
    updateTrackUI();
    if (isPlaying) {
      startPlayback();
    }
  }

  playBtn.addEventListener('click', togglePlay);
  if (nextBtn) nextBtn.addEventListener('click', nextTrack);
  if (prevBtn) prevBtn.addEventListener('click', prevTrack);

  if (networkSelect) {
    networkSelect.addEventListener('change', () => {
      const net = networkSelect.value;
      if (net === 'offline') {
        logSpotifyWire(`[Network Condition Changed: OFFLINE]
Airplane / Subway mode active.
All outbound HTTP/3 CDN requests suspended.
Playback will now rely strictly on unconsumed circular RAM buffer!`, `Offline`);
      } else {
        logSpotifyWire(`[Network Condition Changed: ${net.toUpperCase()}]
CDN connection re-established. Resuming byte-range downloads.`, `Connected`);
      }
    });
  }

  if (bitrateSelect) {
    bitrateSelect.addEventListener('change', () => {
      const br = bitrateSelect.value;
      if (userTierBadge) {
        userTierBadge.textContent = br === '320' ? 'Spotify Premium (320 kbps)' : br === '160' ? 'Spotify Standard (160 kbps)' : 'Data Saver (96 kbps)';
      }
      logSpotifyWire(`[Adaptive Bitrate Switch: ${br} kbps]
Audio transcode requested from edge cache.
Ogg Vorbis stream adjusted dynamically without audio stutter.`, `${br} kbps`);
    });
  }

  updateTrackUI();
}

// ==========================================
// 6. COPY MARKDOWN TEMPLATE TO CLIPBOARD
// ==========================================
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
        alert('Template copied to clipboard!');
      }
    });
  }
}

// ==========================================
// 7. SUB-NAV ACTIVE SCROLLSPY
// ==========================================
function initScrollSpy() {
  const links = document.querySelectorAll('.sub-link');
  const sections = document.querySelectorAll('.content-card');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    links.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}
