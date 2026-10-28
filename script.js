// Master Curriculum Portal Logic
// Product Bosslady Academy (PBA) - Technical Product Management Track

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initCourseFiltering();
  initGradeCalculator();
  // Lock states on the week cards and the learner's progress panel (see access.js)
  if (window.TPMAccess) TPMAccess.renderPortal();
});

// Theme Management
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

// Course Search & Public Product Filtering
function initCourseFiltering() {
  const searchInput = document.getElementById('courseSearchInput');
  const filterPills = document.querySelectorAll('.filter-pill');
  const courseCards = document.querySelectorAll('.course-card');
  const countBadge = document.getElementById('courseCountBadge');

  let activeProductFilter = 'all';

  function applyFilters() {
    const query = (searchInput.value || '').toLowerCase().trim();
    let visibleCount = 0;

    courseCards.forEach(card => {
      const products = (card.dataset.products || '').toLowerCase();
      const keywords = (card.dataset.keywords || '').toLowerCase();
      const title = (card.querySelector('.course-name')?.textContent || '').toLowerCase();
      const summary = (card.querySelector('.course-summary')?.textContent || '').toLowerCase();

      const matchesSearch = !query || 
        title.includes(query) || 
        summary.includes(query) || 
        keywords.includes(query) || 
        products.includes(query);

      const matchesProduct = activeProductFilter === 'all' || 
        products.includes(activeProductFilter.toLowerCase()) || 
        products.includes('all');

      if (matchesSearch && matchesProduct) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (countBadge) {
      countBadge.textContent = `Showing ${visibleCount} of ${courseCards.length} Courses`;
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeProductFilter = pill.dataset.filter;
      applyFilters();
    });
  });
}

// Interactive 300-Mark Grading Calculator
function initGradeCalculator() {
  const inWeekly = document.getElementById('inputWeekly');
  const inCapstone = document.getElementById('inputCapstone');
  const inPortfolio = document.getElementById('inputPortfolio');
  const inAttendance = document.getElementById('inputAttendance');

  const totalScoreEl = document.getElementById('totalMarksScore');
  const percentageEl = document.getElementById('percentageText');
  const gradeBadgeEl = document.getElementById('finalGradeBadge');
  const certStatusEl = document.getElementById('certificateStatusText');

  if (!inWeekly || !inCapstone || !inPortfolio || !inAttendance) return;

  function clamp(val, min, max) {
    if (isNaN(val)) return 0;
    return Math.min(Math.max(val, min), max);
  }

  function calculate() {
    const weekly = clamp(parseFloat(inWeekly.value), 0, 120);
    const capstone = clamp(parseFloat(inCapstone.value), 0, 100);
    const portfolio = clamp(parseFloat(inPortfolio.value), 0, 50);
    const attendance = clamp(parseFloat(inAttendance.value), 0, 30);

    const total = weekly + capstone + portfolio + attendance;
    const percentage = ((total / 300) * 100);

    totalScoreEl.textContent = Math.round(total);
    percentageEl.textContent = `${percentage.toFixed(1)}%`;

    // Grade classification from curriculum PDF
    let grade = 'F';
    let gradeClass = 'f';
    let statusText = '❌ Below 50% minimum threshold. Requires revisions and additional marks to graduate.';

    if (percentage >= 90) {
      grade = 'Grade A+';
      gradeClass = 'a-plus';
      statusText = '🌟 Outstanding Distinction! Qualifies for Top Honours & Recommendation Letter.';
    } else if (percentage >= 80) {
      grade = 'Grade A';
      gradeClass = 'a';
      statusText = '✅ Excellent Performance! Qualifies for PBA Certificate of Completion.';
    } else if (percentage >= 70) {
      grade = 'Grade B+';
      gradeClass = 'b';
      statusText = '✅ Very Good Performance! Qualifies for PBA Certificate of Completion.';
    } else if (percentage >= 60) {
      grade = 'Grade B';
      gradeClass = 'b';
      statusText = '✅ Good Competence! Qualifies for PBA Certificate of Completion.';
    } else if (percentage >= 50) {
      grade = 'Grade C';
      gradeClass = 'c';
      statusText = '✅ Passed! Meets minimum requirements for Certificate of Completion.';
    } else if (percentage >= 40) {
      grade = 'Grade D';
      gradeClass = 'f';
    } else if (percentage >= 30) {
      grade = 'Grade E';
      gradeClass = 'f';
    }

    gradeBadgeEl.textContent = grade;
    gradeBadgeEl.className = `grade-badge ${gradeClass}`;
    certStatusEl.textContent = statusText;
  }

  [inWeekly, inCapstone, inPortfolio, inAttendance].forEach(input => {
    input.addEventListener('input', calculate);
  });

  calculate(); // Run on initial page load
}
