let statTypes = ["pac", "sho", "pas", "dri", "def", "phy", "gk"];
let players = [];
let selectedPlayerId = null;

async function initViewData() {
  try {
    const { data: statsData } = await supabaseClient.from('stat_types').select('name');
    if (statsData && statsData.length > 0) {
      statTypes = statsData.map(s => s.name);
    }

    const { data: playersData, error } = await supabaseClient.from('players').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    players = playersData || [];

    renderSidebar();
    if (players.length > 0) {
      selectPlayer(players[0]);
    }
  } catch (err) {
    console.error("Lỗi tải dữ liệu:", err);
  }
}

function calculateOVR(player) {
  if (!player || !player.stats || statTypes.length === 0) return 0;
  const total = statTypes.reduce((sum, key) => sum + (Number(player.stats[key]) || 5), 0);
  return Number((total / statTypes.length).toFixed(1));
}

function selectPlayer(player) {
  selectedPlayerId = player.id;
  renderSidebar();
  renderDetail(player);
}

function renderSidebar() {
  const sidebar = document.getElementById('playerSidebar');
  sidebar.innerHTML = '';

  players.forEach(p => {
    const item = document.createElement('div');
    item.className = `player-nav-item ${selectedPlayerId === p.id ? 'active' : ''}`;
    item.innerHTML = `<span>${p.name}</span><small>${p.role} (${calculateOVR(p)})</small>`;
    item.addEventListener('click', () => selectPlayer(p));
    sidebar.appendChild(item);
  });
}

function renderDetail(player) {
  const box = document.getElementById('playerViewContent');
  box.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--panel-border); padding-bottom: 10px;">
      <h2 style="margin: 0;">${player.name}</h2>
      <div style="display: flex; gap: 10px; align-items: center;">
        <span class="role-badge">${player.role}</span>
        <span class="team-power-tag" style="font-size: 16px;">OVR: ${calculateOVR(player)}</span>
      </div>
    </div>

    <div class="stat-visual-wrap" style="margin-top: 10px;">
      <canvas id="viewRadarCanvas" class="radar-canvas" width="220" height="220"></canvas>
      <div class="stat-sliders-grid" id="viewStatGrid"></div>
    </div>

    <div class="view-info-card">
      <label>Ghi chú (Điểm mạnh / Điểm yếu):</label>
      <p>${player.notes || 'Chưa có ghi chú.'}</p>
    </div>

    <div class="view-info-card">
      <label>Phối hợp (Ăn ý / Khắc chế):</label>
      <p>${player.synergies || 'Chưa có thông tin phối hợp.'}</p>
    </div>
  `;

  const grid = document.getElementById('viewStatGrid');
  statTypes.forEach(s => {
    const val = player.stats && player.stats[s] !== undefined ? player.stats[s] : 5;
    const row = document.createElement('div');
    row.className = 'slider-row';
    row.innerHTML = `
      <span style="font-weight: 600;">${s.toUpperCase()}</span>
      <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${(val / 10) * 100}%;"></div></div>
      <b>${val}</b>
    `;
    grid.appendChild(row);
  });

  drawPolygonRadar('viewRadarCanvas', player.stats, 85);
}

function drawPolygonRadar(canvasId, statsObj, maxR) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const n = statTypes.length;
  if (n < 3) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const angleStep = (Math.PI * 2) / n;

  [0.5, 1.0].forEach(level => {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const r = level * maxR;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = '#333';
    ctx.stroke();
  });

  for (let i = 0; i < n; i++) {
    const angle = i * angleStep - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + maxR * Math.cos(angle), cy + maxR * Math.sin(angle));
    ctx.strokeStyle = '#282828';
    ctx.stroke();
  }

  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const val = statsObj ? (Number(statsObj[statTypes[i]]) || 0) : 0;
    const r = (Math.min(10, Math.max(0, val)) / 10) * maxR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(59, 130, 246, 0.45)';
  ctx.fill();
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.stroke();
}

initViewData();