const ADMIN_PASS = "123";

let statTypes = ["pac", "sho", "pas", "dri", "def", "phy", "gk"];
let players = [];

let teams = [
  { id: "t1", name: "Đội 1", slots: [null, null, null, null, null] },
  { id: "t2", name: "Đội 2", slots: [null, null, null, null, null] }
];

const tooltip = document.getElementById('radarTooltip');

async function loadCloudData() {
  try {
    const { data: statsData } = await supabaseClient.from('stat_types').select('name');
    if (statsData && statsData.length > 0) {
      statTypes = statsData.map(s => s.name);
    }

    const { data: playersData, error } = await supabaseClient.from('players').select('*').order('created_at', { ascending: true });
    if (error) throw error;

    if (playersData && playersData.length > 0) {
      players = playersData;
    } else {
      const defaultPlayers = [
        { id: "p1", name: "Nguyễn Văn A", role: "FW", stats: { pac: 8, sho: 8, pas: 7, dri: 8, def: 4, phy: 7, gk: 4 }, notes: "Chạy chỗ tốt, dứt điểm bén", synergies: "" },
        { id: "p2", name: "Trần Văn B", role: "DF", stats: { pac: 6, sho: 4, pas: 6, dri: 5, def: 9, phy: 8, gk: 5 }, notes: "Tranh chấp rát", synergies: "" },
        { id: "p3", name: "Lê Văn C", role: "MF", stats: { pac: 7, sho: 6, pas: 9, dri: 8, def: 6, phy: 7, gk: 4 }, notes: "Chuyền ban bật ngắn", synergies: "" },
        { id: "p4", name: "Phạm Văn D", role: "GK", stats: { pac: 6, sho: 4, pas: 6, dri: 5, def: 6, phy: 7, gk: 8 }, notes: "Phản xạ cận thành ổn", synergies: "" },
        { id: "p5", name: "Hoàng Văn E", role: "FW", stats: { pac: 7, sho: 8, pas: 6, dri: 7, def: 4, phy: 7, gk: 4 }, notes: "Sút xa căng", synergies: "" },
        { id: "p6", name: "Đặng Văn F", role: "DF", stats: { pac: 7, sho: 4, pas: 6, dri: 6, def: 8, phy: 8, gk: 5 }, notes: "Bọc lót tốt", synergies: "" },
        { id: "p7", name: "Vũ Văn G", role: "MF", stats: { pac: 7, sho: 7, pas: 7, dri: 7, def: 7, phy: 7, gk: 5 }, notes: "Công thủ đều", synergies: "" },
        { id: "p8", name: "Bùi Văn H", role: "GK", stats: { pac: 6, sho: 4, pas: 6, dri: 5, def: 6, phy: 7, gk: 8 }, notes: "Bắt penalty tốt", synergies: "" },
        { id: "p9", name: "Đỗ Văn I", role: "DF", stats: { pac: 6, sho: 3, pas: 5, dri: 5, def: 8, phy: 8, gk: 5 }, notes: "Cản bóng bổng", synergies: "" },
        { id: "p10", name: "Hồ Văn K", role: "FW", stats: { pac: 8, sho: 9, pas: 7, dri: 8, def: 4, phy: 8, gk: 4 }, notes: "Dứt điểm toàn diện", synergies: "" }
      ];
      await supabaseClient.from('players').insert(defaultPlayers);
      players = defaultPlayers;
    }
  } catch (err) {
    console.error("Lỗi tải Supabase:", err);
  } finally {
    renderTeams();
  }
}

function calculateOVR(player) {
  if (!player || !player.stats || statTypes.length === 0) return 0;
  const total = statTypes.reduce((sum, key) => sum + (Number(player.stats[key]) || 5), 0);
  return Number((total / statTypes.length).toFixed(1));
}

function calculateTeamPower(team) {
  const active = team.slots.filter(p => p !== null);
  const sum = active.reduce((s, p) => s + calculateOVR(p), 0);
  return Number(sum.toFixed(1));
}

function drawMiniPolygon(canvas, statsObj) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const maxR = 12;
  const n = statTypes.length;

  ctx.clearRect(0, 0, w, h);
  if (n < 3) return;

  const angleStep = (Math.PI * 2) / n;

  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const x = cx + maxR * Math.cos(angle);
    const y = cy + maxR * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1;
  ctx.stroke();

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
  ctx.fillStyle = 'rgba(59, 130, 246, 0.6)';
  ctx.fill();
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

function showTooltip(e, player) {
  let statsHtml = '';
  statTypes.forEach(st => {
    const val = player.stats && player.stats[st] !== undefined ? player.stats[st] : 5;
    statsHtml += `
      <div class="tooltip-stat-line">
        <span>${st.toUpperCase()}</span>
        <b>${val}/10</b>
      </div>
    `;
  });

  tooltip.innerHTML = `
    <div class="tooltip-title">${player.name} (${player.role} - OVR ${calculateOVR(player)})</div>
    ${statsHtml}
    ${player.notes ? `<div class="tooltip-notes">${player.notes}</div>` : ''}
  `;

  tooltip.style.display = 'block';
  tooltip.style.left = (e.clientX + 14) + 'px';
  tooltip.style.top = (e.clientY - 20) + 'px';
}

function hideTooltip() {
  tooltip.style.display = 'none';
}

function renderTeams() {
  const container = document.getElementById('teamsContainer');
  container.innerHTML = '';

  teams.forEach((team, teamIndex) => {
    const card = document.createElement('div');
    card.className = 'team-card';

    const header = document.createElement('div');
    header.className = 'team-card-header';
    header.innerHTML = `
      <div class="team-title-wrap">
        <h3>${team.name}</h3>
        <span class="team-power-tag">Power: ${calculateTeamPower(team)}</span>
      </div>
      ${teams.length > 2 ? `<button class="btn-del-team" onclick="deleteTeam(${teamIndex})" title="Xóa team">&minus;</button>` : ''}
    `;

    const slotList = document.createElement('div');
    slotList.className = 'slot-list';

    team.slots.forEach((slotPlayer, slotIndex) => {
      const row = document.createElement('div');
      row.className = 'slot-item';

      const dropdownWrap = document.createElement('div');
      dropdownWrap.className = 'search-dropdown-wrap';

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'search-input';
      input.placeholder = 'Tìm cầu thủ...';
      input.value = slotPlayer ? `${slotPlayer.name} (${slotPlayer.role} - OVR: ${calculateOVR(slotPlayer)})` : '';

      const listMenu = document.createElement('div');
      listMenu.className = 'dropdown-list';

      function populateOptions(filterText = '') {
        listMenu.innerHTML = '';

        const emptyOpt = document.createElement('div');
        emptyOpt.className = 'dropdown-item empty-opt';
        emptyOpt.innerText = '-- Để trống slot --';
        emptyOpt.addEventListener('click', () => {
          team.slots[slotIndex] = null;
          renderTeams();
        });
        listMenu.appendChild(emptyOpt);

        const filtered = players.filter(p => p.name.toLowerCase().includes(filterText.toLowerCase()));
        filtered.forEach(p => {
          const item = document.createElement('div');
          item.className = 'dropdown-item';
          item.innerHTML = `<span>${p.name}</span><small>${p.role} - OVR: ${calculateOVR(p)}</small>`;
          item.addEventListener('click', () => {
            team.slots[slotIndex] = p;
            renderTeams();
          });
          listMenu.appendChild(item);
        });

        if (filtered.length === 0) {
          const noMatch = document.createElement('div');
          noMatch.className = 'dropdown-item';
          noMatch.style.color = 'var(--text-muted)';
          noMatch.innerText = 'Không có kết quả khớp';
          listMenu.appendChild(noMatch);
        }
      }

      input.addEventListener('focus', () => {
        document.querySelectorAll('.dropdown-list').forEach(el => el.style.display = 'none');
        populateOptions('');
        listMenu.style.display = 'block';
        input.select();
      });

      input.addEventListener('input', (e) => {
        populateOptions(e.target.value.trim());
      });

      dropdownWrap.appendChild(input);
      dropdownWrap.appendChild(listMenu);
      row.appendChild(dropdownWrap);

      if (slotPlayer) {
        const miniWrap = document.createElement('div');
        miniWrap.className = 'mini-radar-wrap';
        miniWrap.title = 'Rê chuột để xem nhanh chỉ số';

        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        miniWrap.appendChild(canvas);
        drawMiniPolygon(canvas, slotPlayer.stats);

        miniWrap.addEventListener('mouseenter', (e) => showTooltip(e, slotPlayer));
        miniWrap.addEventListener('mousemove', (e) => {
          tooltip.style.left = (e.clientX + 14) + 'px';
          tooltip.style.top = (e.clientY - 20) + 'px';
        });
        miniWrap.addEventListener('mouseleave', hideTooltip);

        row.appendChild(miniWrap);
      }

      const removeBtn = document.createElement('button');
      removeBtn.className = 'slot-remove-btn';
      removeBtn.innerHTML = '&times;';
      removeBtn.title = 'Xóa slot này';
      removeBtn.addEventListener('click', () => {
        team.slots.splice(slotIndex, 1);
        renderTeams();
      });

      row.appendChild(removeBtn);
      slotList.appendChild(row);
    });

    const footer = document.createElement('div');
    footer.className = 'team-card-footer';
    footer.innerHTML = `<button class="btn-add-slot">+ Thêm người</button>`;
    footer.querySelector('.btn-add-slot').addEventListener('click', () => {
      team.slots.push(null);
      renderTeams();
    });

    card.appendChild(header);
    card.appendChild(slotList);
    card.appendChild(footer);
    container.appendChild(card);
  });
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-dropdown-wrap')) {
    document.querySelectorAll('.dropdown-list').forEach(el => el.style.display = 'none');
  }
});

window.deleteTeam = (idx) => {
  if (teams.length <= 2) return;
  teams.splice(idx, 1);
  renderTeams();
};

document.getElementById('addTeamBtn').addEventListener('click', () => {
  teams.push({
    id: 't_' + Date.now(),
    name: `Đội ${teams.length + 1}`,
    slots: [null, null, null, null, null]
  });
  renderTeams();
});

function isConflicting(playerA, playerB) {
  if (!playerA || !playerB) return false;

  const getDislikes = (p) => {
    const text = `${p.notes || ''} ${p.synergies || ''}`.toLowerCase();
    const regex = /(?:kỵ|ky|tranh|dislike|avoid|ghét|ghet)\s*:\s*([^,\n;]+)/gi;
    const names = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      names.push(match[1].trim());
    }
    return names;
  };

  const aDislikes = getDislikes(playerA);
  const bDislikes = getDislikes(playerB);

  const bName = playerB.name.toLowerCase();
  const aName = playerA.name.toLowerCase();

  const aAvoidsB = aDislikes.some(d => bName.includes(d) || d.includes(bName));
  const bAvoidsA = bDislikes.some(d => aName.includes(d) || d.includes(aName));

  return aAvoidsB || bAvoidsA;
}

function hasTeamConflict(teamPlayers) {
  for (let i = 0; i < teamPlayers.length; i++) {
    for (let j = i + 1; j < teamPlayers.length; j++) {
      if (isConflicting(teamPlayers[i], teamPlayers[j])) {
        return true;
      }
    }
  }
  return false;
}

document.getElementById('autoSplitBtn').addEventListener('click', () => {
  const text = document.getElementById('pasteInput').value.trim();
  if (!text) return;

  const rawNames = text.split(/[\n,]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
  const matched = [];

  rawNames.forEach(raw => {
    const found = players.find(p => p.name.toLowerCase() === raw || p.name.toLowerCase().includes(raw));
    if (found && !matched.some(m => m.id === found.id)) {
      matched.push(found);
    }
  });

  if (matched.length === 0) {
    alert("Không tìm thấy tên nào khớp với cơ sở dữ liệu!");
    return;
  }

  let bestAlloc = null;
  let minDiff = Infinity;
  let bestAllocWithoutConflict = null;
  let minDiffWithoutConflict = Infinity;
  const numTeams = teams.length;

  for (let loop = 0; loop < 1500; loop++) {
    const shuffled = [...matched].sort(() => Math.random() - 0.5);
    const temp = Array.from({ length: numTeams }, () => []);

    shuffled.forEach((p, i) => temp[i % numTeams].push(p));

    const powers = temp.map(arr => arr.reduce((s, p) => s + calculateOVR(p), 0));
    const diff = Math.max(...powers) - Math.min(...powers);

    if (diff < minDiff) {
      minDiff = diff;
      bestAlloc = temp;
    }

    const anyConflict = temp.some(t => hasTeamConflict(t));
    if (!anyConflict && diff < minDiffWithoutConflict) {
      minDiffWithoutConflict = diff;
      bestAllocWithoutConflict = temp;
    }
  }

  const finalAlloc = bestAllocWithoutConflict || bestAlloc;

  if (!bestAllocWithoutConflict && matched.length > 1) {
    console.warn("Không tìm được phương án tách triệt để người kỵ nhau, đã dùng phương án cân bằng OVR nhất.");
  }

  teams.forEach((t, i) => {
    const allocated = finalAlloc[i] || [];
    t.slots = [...allocated];
    while (t.slots.length < 5) t.slots.push(null);
  });

  renderTeams();
});

document.getElementById('shuffleBtn').addEventListener('click', () => {
  const currentAssigned = [];
  teams.forEach(t => {
    t.slots.forEach(p => { if (p) currentAssigned.push(p); });
  });

  if (currentAssigned.length === 0) return;

  const shuffled = currentAssigned.sort(() => Math.random() - 0.5);
  teams.forEach(t => {
    const len = Math.max(5, t.slots.length);
    t.slots = new Array(len).fill(null);
  });

  shuffled.forEach((p, idx) => {
    teams[idx % teams.length].slots[Math.floor(idx / teams.length)] = p;
  });

  renderTeams();
});

const passModal = document.getElementById('passModal');
document.getElementById('openPassModalBtn').addEventListener('click', () => {
  passModal.style.display = 'flex';
  const passInput = document.getElementById('adminPassword');
  passInput.value = '';
  document.getElementById('authError').style.display = 'none';
  passInput.focus();
});

document.getElementById('closePassModalBtn').addEventListener('click', () => {
  passModal.style.display = 'none';
});

function handleAuthSubmit() {
  const pass = document.getElementById('adminPassword').value;
  if (pass === ADMIN_PASS) {
    sessionStorage.setItem('IS_ADMIN_AUTH', 'true');
    window.location.href = 'admin.html';
  } else {
    document.getElementById('authError').style.display = 'block';
  }
}

document.getElementById('submitPassBtn').addEventListener('click', handleAuthSubmit);
document.getElementById('adminPassword').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleAuthSubmit();
});

// --- XEM LỊCH SỬ CÁC TRẬN ĐẤU (CHO USER) ---
const userHistoryModal = document.getElementById('userHistoryModal');
const openUserHistoryBtn = document.getElementById('openUserHistoryBtn');
const closeUserHistoryBtn = document.getElementById('closeUserHistoryBtn');
const userHistoryListContent = document.getElementById('userHistoryListContent');

if (openUserHistoryBtn) {
  openUserHistoryBtn.addEventListener('click', async () => {
    userHistoryModal.style.display = 'flex';
    userHistoryListContent.innerHTML = '<p class="placeholder-text">Đang tải lịch sử các trận...</p>';

    try {
      const { data: matches, error } = await supabaseClient
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!matches || matches.length === 0) {
        userHistoryListContent.innerHTML = '<p class="placeholder-text">Chưa có trận đấu nào được ghi nhận!</p>';
        return;
      }

      userHistoryListContent.innerHTML = '';
      matches.forEach(m => {
        const item = document.createElement('div');
        item.style.background = '#181818';
        item.style.border = '1px solid var(--panel-border)';
        item.style.borderRadius = '8px';
        item.style.padding = '14px';
        item.style.display = 'flex';
        item.style.flexDirection = 'column';
        item.style.gap = '12px';

        const matchDate = new Date(m.created_at).toLocaleDateString('vi-VN', {
          weekday: 'long',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });

        let teamList = [];
        if (Array.isArray(m.teams) && m.teams.length > 0) {
          teamList = m.teams;
        } else {
          if (m.team_a) teamList.push(m.team_a);
          if (m.team_b) teamList.push(m.team_b);
        }

        const renderPlayerRow = (p) => `
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; padding: 4px 0; border-bottom: 1px dashed #242424;">
            <b>${p.name}</b>
            <div style="display: flex; gap: 4px; font-size: 11px;">
              <span title="Bàn thắng" style="background: #1e3a8a; color: #93c5fd; padding: 2px 5px; border-radius: 3px;">⚽ ${p.goals || 0}</span>
              <span title="Kiến tạo" style="background: #064e3b; color: #6ee7b7; padding: 2px 5px; border-radius: 3px;">👟 ${p.assists || 0}</span>
              <span title="Thủ được tấn công" style="background: #78350f; color: #fde68a; padding: 2px 5px; border-radius: 3px;">🛡️ ${p.defends || 0}</span>
              <span title="Chụp/Cứu thua" style="background: #581c87; color: #e9d5ff; padding: 2px 5px; border-radius: 3px;">🧤 ${p.saves || 0}</span>
            </div>
          </div>
        `;

        const teamsCardsHtml = teamList.map(t => `
          <div style="background: #111; padding: 10px 12px; border-radius: 6px; border: 1px solid #2a2a2a; display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; border-bottom: 1px solid #333; padding-bottom: 4px;">
              <b style="font-size: 15px; color: #fff;">${t.name || 'Đội'}</b>
              <span style="font-size: 13px; color: var(--accent); font-weight: 700;">Score: ${t.score ?? 0}</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 2px;">
              ${(t.players && t.players.length > 0) ? t.players.map(renderPlayerRow).join('') : '<span style="color: var(--text-muted); font-size: 12px;">Không có danh sách</span>'}
            </div>
          </div>
        `).join('');

        item.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; padding-bottom: 6px;">
            <span style="font-size: 13px; color: #93c5fd; font-weight: 600;">📅 ${matchDate}</span>
            <span style="font-size: 12px; color: var(--text-muted);">${m.summary || ''}</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
            ${teamsCardsHtml}
          </div>
        `;

        userHistoryListContent.appendChild(item);
      });
    } catch (err) {
      userHistoryListContent.innerHTML = `<p class="text-danger">Lỗi tải dữ liệu: ${err.message}</p>`;
    }
  });

  closeUserHistoryBtn.addEventListener('click', () => {
    userHistoryModal.style.display = 'none';
  });
}

loadCloudData();