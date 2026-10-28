// Week 02: Systems Thinking & Architecture Logic

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTabs();
  initErdExplorer();
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

// Instagram ERD Table Data
const instagramSchema = [
  {
    tableName: 'users',
    icon: '👤',
    description: 'Core user authentication, handle, and profile flags.',
    fields: [
      { name: 'user_id', type: 'BIGINT (PK)', desc: 'Instagram 64-bit sharded unique identifier' },
      { name: 'username', type: 'VARCHAR(30)', desc: 'Unique handle indexed for instant lookup' },
      { name: 'email', type: 'VARCHAR(255)', desc: 'Encrypted user email address' },
      { name: 'bio', type: 'VARCHAR(150)', desc: 'Short profile biography text' },
      { name: 'is_verified', type: 'BOOLEAN', desc: 'Blue check verification status' },
      { name: 'created_at', type: 'TIMESTAMP', desc: 'Account registration epoch' }
    ],
    sampleSql: 'SELECT user_id, username, is_verified FROM users WHERE username = \'cristiano\';',
    tpmNotes: 'Indexed on (username) with B-Tree index to ensure sub-5ms profile lookups.'
  },
  {
    tableName: 'posts',
    icon: '🖼️',
    description: 'User photo/video publication metadata.',
    fields: [
      { name: 'post_id', type: 'BIGINT (PK)', desc: 'Unique sharded post ID' },
      { name: 'user_id', type: 'BIGINT (FK)', desc: 'Foreign Key referencing users.user_id' },
      { name: 'caption', type: 'TEXT', desc: 'Post description, hashtags, and mentions' },
      { name: 'location_tag', type: 'VARCHAR(100)', desc: 'Geotag city/venue name' },
      { name: 'likes_count', type: 'INTEGER', desc: 'Cached denormalized counter for fast UI rendering' },
      { name: 'created_at', type: 'TIMESTAMP', desc: 'Indexed descending for reverse-chronological feed' }
    ],
    sampleSql: 'SELECT * FROM posts WHERE user_id = 1204892 ORDER BY created_at DESC LIMIT 12;',
    tpmNotes: 'Composite index on (user_id, created_at DESC) allows the user grid to load instantly without table scans.'
  },
  {
    tableName: 'media',
    icon: '📹',
    description: 'Binary media storage pointers (stored on AWS S3 / Cloudflare CDN).',
    fields: [
      { name: 'media_id', type: 'BIGINT (PK)', desc: 'Unique media file record' },
      { name: 'post_id', type: 'BIGINT (FK)', desc: 'Foreign Key referencing posts.post_id' },
      { name: 'media_type', type: 'ENUM', desc: '\'IMAGE\' or \'VIDEO\'' },
      { name: 'cdn_url', type: 'VARCHAR(512)', desc: 'Edge CDN link (e.g. scontent.cdninstagram.com)' },
      { name: 'width_px', type: 'INT', desc: 'Pixel width for client layout pre-calculation' },
      { name: 'height_px', type: 'INT', desc: 'Pixel height to prevent cumulative layout shift (CLS)' }
    ],
    sampleSql: 'SELECT cdn_url, media_type FROM media WHERE post_id = 998234;',
    tpmNotes: 'Never store actual binary files in SQL! Always store CDN URLs; store blobs on Object Storage (S3).'
  },
  {
    tableName: 'likes',
    icon: '❤️',
    description: 'High-velocity Join Table tracking which user liked which post.',
    fields: [
      { name: 'post_id', type: 'BIGINT (PK/FK)', desc: 'Composite PK part 1 -> posts.post_id' },
      { name: 'user_id', type: 'BIGINT (PK/FK)', desc: 'Composite PK part 2 -> users.user_id' },
      { name: 'created_at', type: 'TIMESTAMP', desc: 'Timestamp of the like gesture' }
    ],
    sampleSql: 'INSERT INTO likes (post_id, user_id) VALUES (998234, 44211) ON CONFLICT DO NOTHING;',
    tpmNotes: 'Composite Primary Key (post_id, user_id) guarantees a user cannot like the same post twice!'
  },
  {
    tableName: 'follows',
    icon: '🤝',
    description: 'The Instagram Social Graph (N:M Many-to-Many Relationship).',
    fields: [
      { name: 'follower_id', type: 'BIGINT (PK/FK)', desc: 'User who initiated follow -> users.user_id' },
      { name: 'followee_id', type: 'BIGINT (PK/FK)', desc: 'User being followed -> users.user_id' },
      { name: 'status', type: 'ENUM', desc: '\'ACCEPTED\' or \'PENDING_PRIVATE\'' },
      { name: 'created_at', type: 'TIMESTAMP', desc: 'When connection was made' }
    ],
    sampleSql: 'SELECT follower_id FROM follows WHERE followee_id = 44211;',
    tpmNotes: 'For accounts with millions of followers, querying this table directly during post publishing will freeze the DB. Instagram caches top follow lists in Redis.'
  }
];

function initErdExplorer() {
  const grid = document.getElementById('erdTablesGrid');
  const detailCard = document.getElementById('erdDetailCard');
  if (!grid || !detailCard) return;

  grid.innerHTML = '';
  instagramSchema.forEach((table, index) => {
    const card = document.createElement('div');
    card.className = 'erd-table-card';
    card.innerHTML = `
      <div class="erd-table-title">
        <span>${table.icon} <strong>${table.tableName}</strong></span>
        <span class="erd-badge-rows">${table.fields.length} columns</span>
      </div>
      <div class="erd-field-preview">
        ${table.fields.slice(0, 3).map(f => `<div>• ${f.name} <span style="color: #6b7280;">(${f.type.split(' ')[0]})</span></div>`).join('')}
        ${table.fields.length > 3 ? `<div style="color: #9ca3af; font-size: 0.7rem;">+ ${table.fields.length - 3} more columns...</div>` : ''}
      </div>
    `;

    card.addEventListener('click', () => {
      document.querySelectorAll('.erd-table-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      renderTableDetail(table);
    });

    grid.appendChild(card);
  });

  function renderTableDetail(table) {
    detailCard.innerHTML = `
      <div style="margin-bottom: 1rem;">
        <h3 style="font-size: 1.25rem; color: #f9fafb; display: flex; align-items: center; gap: 0.5rem;">
          ${table.icon} Table: <code style="color: #c4b5fd; font-family: monospace;">${table.tableName}</code>
        </h3>
        <p style="color: #9ca3af; font-size: 0.88rem; margin-top: 0.25rem;">${table.description}</p>
      </div>

      <div class="table-responsive" style="margin-bottom: 1rem;">
        <table class="tpm-table">
          <thead>
            <tr>
              <th>Column Name</th>
              <th>Data Type / Constraint</th>
              <th>Technical TPM Purpose</th>
            </tr>
          </thead>
          <tbody>
            ${table.fields.map(f => `
              <tr>
                <td><code style="color: #38bdf8; font-family: monospace;">${f.name}</code></td>
                <td><span style="font-size: 0.8rem; background: rgba(255,255,255,0.06); padding: 0.15rem 0.4rem; border-radius: 4px;">${f.type}</span></td>
                <td>${f.desc}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem;">
        <strong style="color: #86efac; font-size: 0.8rem; text-transform: uppercase;">Sample SQL Query:</strong>
        <pre style="color: #cbd5e1; font-family: monospace; font-size: 0.82rem; margin-top: 0.4rem; overflow-x: auto;"><code>${table.sampleSql}</code></pre>
      </div>

      <div style="background: rgba(139, 92, 246, 0.08); border-left: 3px solid #8b5cf6; padding: 0.85rem; border-radius: 4px; font-size: 0.85rem; color: #ddd6fe;">
        <strong>🎓 TPM Architecture Tip:</strong> ${table.tpmNotes}
      </div>
    `;
  }

  // Select first table
  const firstCard = grid.querySelector('.erd-table-card');
  if (firstCard) firstCard.click();
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
