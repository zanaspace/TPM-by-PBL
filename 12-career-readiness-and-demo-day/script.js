// Week 12: Career Readiness and Demo Day Logic

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initPitchTimer();
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

function initPitchTimer() {
  const clock = document.getElementById('timerClock');
  const reminder = document.getElementById('timerSlideReminder');
  const startBtn = document.getElementById('startTimerBtn');
  const pauseBtn = document.getElementById('pauseTimerBtn');
  const resetBtn = document.getElementById('resetTimerBtn');

  let totalSeconds = 600; // 10 minutes
  let timerInterval = null;
  let isRunning = false;

  function updateDisplay() {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    clock.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Update slide reminder cue based on time remaining
    if (totalSeconds > 540) {
      reminder.textContent = 'Slide 1: Problem & Product Scope (Target: 1 min)';
      reminder.style.borderColor = '#f59e0b';
    } else if (totalSeconds > 420) {
      reminder.textContent = 'Slide 2: System Architecture Blueprint (Target: 2 mins)';
      reminder.style.borderColor = '#38bdf8';
    } else if (totalSeconds > 330) {
      reminder.textContent = 'Slide 3: ERD & Data Relationships (Target: 1.5 mins)';
      reminder.style.borderColor = '#8b5cf6';
    } else if (totalSeconds > 240) {
      reminder.textContent = 'Slide 4: API Design & Contracts (Target: 1.5 mins)';
      reminder.style.borderColor = '#06b6d4';
    } else if (totalSeconds > 150) {
      reminder.textContent = 'Slide 5: Scalability & Performance Strategy (Target: 1.5 mins)';
      reminder.style.borderColor = '#34d399';
    } else if (totalSeconds > 90) {
      reminder.textContent = 'Slide 6: Security & SRE Reliability (Target: 1 min)';
      reminder.style.borderColor = '#f43f5e';
    } else if (totalSeconds > 0) {
      reminder.textContent = 'Slide 7: Live Artifact Demo & Facilitator Defense (Target: 1.5 mins)';
      reminder.style.borderColor = '#10b981';
    } else {
      reminder.textContent = '🔔 Time is up! Thank the facilitators and proceed to Q&A.';
      reminder.style.borderColor = '#f59e0b';
    }
  }

  startBtn.addEventListener('click', () => {
    if (isRunning) return;
    isRunning = true;
    timerInterval = setInterval(() => {
      if (totalSeconds > 0) {
        totalSeconds--;
        updateDisplay();
      } else {
        clearInterval(timerInterval);
        isRunning = false;
      }
    }, 1000);
  });

  pauseBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    isRunning = false;
  });

  resetBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    isRunning = false;
    totalSeconds = 600;
    updateDisplay();
  });

  updateDisplay();
}
