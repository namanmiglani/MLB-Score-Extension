// Daily Draft Game Logic

let currentLineup = [null, null, null, null, null, null, null, null, null]; // 9 positions
let availablePlayers = [];
let filteredPlayers = [];
let currentFilter = 'ALL';
let currentSort = 'salary-desc';
let playersCache = null;
let playersCacheDate = null;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  // Don't initialize draft until view is opened
  setupDraftEventListeners();
});

function setupDraftEventListeners() {
  const dailyDraftBtn = document.getElementById('daily-draft-btn');
  const backBtn = document.getElementById('back-from-draft');
  const submitBtn = document.getElementById('submit-lineup-btn');
  const historyBtn = document.getElementById('view-draft-history-btn');
  
  if (dailyDraftBtn) {
    dailyDraftBtn.addEventListener('click', () => {
      switchToDailyDraft();
    });
  }
  
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      switchToScores();
    });
  }
  
  if (submitBtn) {
    submitBtn.addEventListener('click', submitLineup);
  }
  
  if (historyBtn) {
    historyBtn.addEventListener('click', showDraftHistory);
  }
}

async function switchToDailyDraft() {
  // Hide all views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
    view.classList.add('hidden');
  });
  
  // Show draft view
  const draftView = document.getElementById('daily-draft-view');
  draftView.classList.remove('hidden');
  draftView.classList.add('active');
  
  // Hide date navigation
  const dateNav = document.getElementById('date-navigation');
  if (dateNav) dateNav.style.display = 'none';
  
  // Initialize draft
  await initializeDraft();
}

async function initializeDraft() {
  await loadCurrentLineup();
  await loadPlayers();
  renderLineupSlots();
  renderPositionFilters();
  setupPlayerControls();
  renderPlayersList();
  updateBudgetDisplay();
}

// ============================================
// DATA LOADING
// ============================================

async function loadCurrentLineup() {
  const today = getTodayDateString();
  const currentDraft = await getStorageData('dailyDraft_current');
  
  if (currentDraft && currentDraft.date === today) {
    currentLineup = currentDraft.lineup || [null, null, null, null, null, null, null, null, null];
  } else {
    // New day, reset lineup
    currentLineup = [null, null, null, null, null, null, null, null, null];
    await setStorageData('dailyDraft_current', {
      date: today,
      lineup: currentLineup,
      locked: false
    });
  }
}

async function loadPlayers() {
  const today = getTodayDateString();
  const weekKey = getWeekKey();

  // Check cache first
  const cachedData = await getLocalStorageData('players_cache');
  if (cachedData && cachedData.date === today && cachedData.weekKey === weekKey) {
    availablePlayers = cachedData.players;
    filteredPlayers = [...availablePlayers];
    return;
  }

  showPlayersLoading();

  try {
    const games = await fetchTodaysSchedule();

    if (!games || games.length === 0) {
      availablePlayers = [];
      filteredPlayers = [];
      showNoGamesMessage();
      return;
    }

    const teamMap = getTeamsFromSchedule(games);
    const teamIds = Array.from(teamMap.keys());

    const playersData = await buildPlayersFromRosters(teamMap, teamIds, games);

    availablePlayers = playersData;
    filteredPlayers = [...availablePlayers];

    await setLocalStorageData('players_cache', {
      date: today,
      weekKey,
      players: playersData
    });

  } catch (error) {
    console.error('Error loading players:', error);
    showPlayersError();
  }
}

async function enrichPlayersWithStats(players) {
  for (const player of players) {
    try {
      const stats = await fetchPlayerStats(player.id);

      if (stats?.stats && stats.stats.length > 0) {
        const seasonStats = stats.stats.find(s => s.type.displayName === 'season');

        if (seasonStats?.splits?.[0]?.stat) {
          const stat = seasonStats.splits[0].stat;

          if (player.position === 'P') {
            player.salary = calculatePitcherSalary(stat);
            player.stats = {
              era: stat.era?.toFixed(2) || '0.00',
              strikeouts: stat.strikeOuts || 0,
              wins: stat.wins || 0
            };
          } else {
            player.salary = calculateHitterSalary(stat);
            player.stats = {
              avg: stat.avg?.toFixed(3) || '.000',
              hr: stat.homeRuns || 0,
              rbi: stat.rbi || 0
            };
          }
        } else {
          player.salary = 5000;
          player.stats = player.position === 'P'
            ? { era: '0.00', strikeouts: 0, wins: 0 }
            : { avg: '.000', hr: 0, rbi: 0 };
        }
      } else {
        player.salary = 5000;
        player.stats = player.position === 'P'
          ? { era: '0.00', strikeouts: 0, wins: 0 }
          : { avg: '.000', hr: 0, rbi: 0 };
      }
    } catch (error) {
      console.error(`Error fetching stats for ${player.name}:`, error);
      player.salary = 5000;
      player.stats = player.position === 'P'
        ? { era: '0.00', strikeouts: 0, wins: 0 }
        : { avg: '.000', hr: 0, rbi: 0 };
    }
  }
}

async function buildPlayersFromRosters(teamMap, teamIds, games) {
  const playersData = [];

  for (const teamId of teamIds) {
    const teamInfo = teamMap.get(teamId);
    if (!teamInfo) continue;

    const roster = await fetchTeamRoster(teamId);
    for (const entry of roster) {
      const person = entry.person;
      const position = normalizePosition(entry.position?.abbreviation);

      if (!POSITIONS.includes(position)) continue;

      playersData.push({
        id: person.id,
        name: person.fullName,
        team: teamInfo.teamAbbr,
        teamId: teamInfo.teamId,
        position,
        gameTime: teamInfo.gameTime,
        opponent: teamInfo.opponentAbbr,
        gamePk: teamInfo.gamePk
      });
    }
  }

  await enrichPlayersWithStats(playersData);
  return playersData;
}

// ============================================
// LINEUP MANAGEMENT
// ============================================

function addPlayerToLineup(player) {
  // Find first empty slot for this position
  const positionIndex = findEmptySlotForPosition(player.position);
  
  if (positionIndex === -1) {
    alert(`No empty ${player.position} slot available`);
    return;
  }
  
  // Check budget
  const currentSalary = calculateLineupSalary(currentLineup);
  const remaining = SALARY_CAP - currentSalary;
  
  if (player.salary > remaining) {
    alert(`Not enough budget! Need ${formatSalary(player.salary)}, have ${formatSalary(remaining)}`);
    return;
  }
  
  // Add to lineup
  currentLineup[positionIndex] = player;
  
  // Save and update UI
  saveCurrentLineup();
  renderLineupSlots();
  updateBudgetDisplay();
  updateSubmitButton();
}

function removePlayerFromLineup(index) {
  currentLineup[index] = null;
  saveCurrentLineup();
  renderLineupSlots();
  updateBudgetDisplay();
  updateSubmitButton();
}

function findEmptySlotForPosition(position) {
  for (let i = 0; i < LINEUP_POSITIONS.length; i++) {
    if (LINEUP_POSITIONS[i] === position && currentLineup[i] === null) {
      return i;
    }
  }
  return -1;
}

async function saveCurrentLineup() {
  const today = getTodayDateString();
  await setStorageData('dailyDraft_current', {
    date: today,
    lineup: currentLineup,
    locked: false
  });
}

async function submitLineup() {
  if (!isLineupComplete(currentLineup)) {
    alert('Please fill all 9 lineup slots before submitting!');
    return;
  }
  
  const confirmed = confirm('Submit this lineup? You will not be able to make changes after submission.');
  if (!confirmed) return;
  
  const today = getTodayDateString();
  
  // Mark as locked
  await setStorageData('dailyDraft_current', {
    date: today,
    lineup: currentLineup,
    locked: true
  });
  
  alert('Lineup submitted! Check back after games complete to see your score.');
  
  // Disable submit button
  document.getElementById('submit-lineup-btn').disabled = true;
  document.getElementById('submit-lineup-btn').textContent = 'Lineup Locked';
}

// ============================================
// PLAYER FILTERING & SORTING
// ============================================

function setupPlayerControls() {
  const sortSelect = document.getElementById('sort-players');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      sortPlayers();
      renderPlayersList();
    });
  }
}

function filterPlayersByPosition(position) {
  currentFilter = position;
  
  if (position === 'ALL') {
    filteredPlayers = [...availablePlayers];
  } else {
    filteredPlayers = availablePlayers.filter(p => p.position === position);
  }
  
  sortPlayers();
  renderPlayersList();
}

function sortPlayers() {
  switch (currentSort) {
    case 'salary-desc':
      filteredPlayers.sort((a, b) => b.salary - a.salary);
      break;
    case 'salary-asc':
      filteredPlayers.sort((a, b) => a.salary - b.salary);
      break;
    case 'points-desc':
      // For now, sort by salary as proxy for projected points
      filteredPlayers.sort((a, b) => b.salary - a.salary);
      break;
  }
}

// ============================================
// RENDERING
// ============================================

function renderLineupSlots() {
  const container = document.getElementById('lineup-slots');
  if (!container) return;
  
  container.innerHTML = '';
  
  LINEUP_POSITIONS.forEach((position, index) => {
    const slot = document.createElement('div');
    slot.className = 'lineup-slot';
    
    const player = currentLineup[index];
    
    if (player) {
      slot.innerHTML = `
        <div class="lineup-slot-filled">
          <div class="slot-position">${position}</div>
          <div class="slot-player-row">
            <img src="${getPlayerHeadshot(player.id, 'small')}" alt="${player.name}" class="slot-player-headshot">
            <img src="${teamLogo(player.teamId)}" alt="${player.team}" class="slot-team-logo">
          </div>
          <div class="slot-player-name">${player.name}</div>
          <div class="slot-player-stats">${formatPlayerStats(player)}</div>
          <div class="slot-player-salary">${formatSalary(player.salary)}</div>
          <button class="remove-player-btn" data-index="${index}">✕</button>
        </div>
      `;
      
      const removeBtn = slot.querySelector('.remove-player-btn');
      removeBtn.addEventListener('click', () => removePlayerFromLineup(index));
    } else {
      slot.innerHTML = `
        <div class="lineup-slot-empty">
          <div class="slot-position">${position}</div>
          <div class="slot-label">Empty</div>
        </div>
      `;
    }
    
    container.appendChild(slot);
  });
  
  // Update lineup count
  const filledCount = currentLineup.filter(p => p !== null).length;
  document.getElementById('lineup-count').textContent = filledCount;
}

function renderPositionFilters() {
  const container = document.getElementById('position-filters');
  if (!container) return;
  
  const positions = ['ALL', ...POSITIONS];
  
  container.innerHTML = positions.map(pos => `
    <button class="position-filter-btn ${pos === currentFilter ? 'active' : ''}" data-position="${pos}">
      ${pos}
    </button>
  `).join('');
  
  container.querySelectorAll('.position-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      container.querySelectorAll('.position-filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      filterPlayersByPosition(e.target.dataset.position);
    });
  });
}

function renderPlayersList() {
  const container = document.getElementById('players-list');
  if (!container) return;
  
  if (filteredPlayers.length === 0) {
    container.innerHTML = '<div class="no-players">No players available</div>';
    return;
  }
  
  container.innerHTML = filteredPlayers.map(player => {
    const isInLineup = currentLineup.some(p => p && p.id === player.id);
    const canAfford = player.salary <= (SALARY_CAP - calculateLineupSalary(currentLineup));
    
    return `
      <div class="player-card ${isInLineup ? 'in-lineup' : ''}">
        <div class="player-card-header">
          <img src="${getPlayerHeadshot(player.id, 'small')}" alt="${player.name}" class="player-headshot">
          <img src="${teamLogo(player.teamId)}" alt="${player.team}" class="player-team-logo">
          <div class="player-info">
            <div class="player-name">${player.name}</div>
            <div class="player-position">${player.position} - ${player.team}</div>
          </div>
          <div class="player-salary">${formatSalary(player.salary)}</div>
        </div>
        <div class="player-card-body">
          <div class="player-stats">${formatPlayerStats(player)}</div>
          <div class="player-game-info">vs ${player.opponent} • ${formatGameTime(player.gameTime)}</div>
        </div>
        <button class="add-player-btn" data-player-id="${player.id}" 
                ${isInLineup || !canAfford ? 'disabled' : ''}>
          ${isInLineup ? 'In Lineup' : !canAfford ? 'Cannot Afford' : 'Add to Lineup'}
        </button>
      </div>
    `;
  }).join('');
  
  // Add event listeners
  container.querySelectorAll('.add-player-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const playerId = parseInt(e.target.dataset.playerId);
      const player = availablePlayers.find(p => p.id === playerId);
      if (player) {
        addPlayerToLineup(player);
        renderPlayersList(); // Re-render to update button states
      }
    });
  });
}

function updateBudgetDisplay() {
  const budgetEl = document.getElementById('remaining-budget');
  if (!budgetEl) return;
  
  const spent = calculateLineupSalary(currentLineup);
  const remaining = SALARY_CAP - spent;
  
  budgetEl.textContent = formatNumber(remaining);
  
  // Color code based on budget
  if (remaining < 5000) {
    budgetEl.style.color = '#e74c3c';
  } else if (remaining < 15000) {
    budgetEl.style.color = '#f39c12';
  } else {
    budgetEl.style.color = '#27ae60';
  }
}

function updateSubmitButton() {
  const submitBtn = document.getElementById('submit-lineup-btn');
  if (!submitBtn) return;
  
  const isComplete = isLineupComplete(currentLineup);
  submitBtn.disabled = !isComplete;
}

// ============================================
// HISTORY
// ============================================

async function showDraftHistory() {
  const history = await getStorageData('dailyDraft_history') || [];
  
  if (history.length === 0) {
    alert('No draft history yet. Submit your first lineup!');
    return;
  }
  
  // Create modal or overlay with history
  // For now, just log to console
  console.log('Draft History:', history);
  alert(`You have ${history.length} completed drafts. History view coming soon!`);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatPlayerStats(player) {
  if (!player.stats) return '';
  
  if (player.position === 'P') {
    return `${player.stats.era} ERA, ${player.stats.strikeouts} K, ${player.stats.wins} W`;
  } else {
    return `${player.stats.avg} AVG, ${player.stats.hr} HR, ${player.stats.rbi} RBI`;
  }
}

function formatGameTime(gameDate) {
  const date = new Date(gameDate);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

function showPlayersLoading() {
  const container = document.getElementById('players-list');
  if (container) {
    container.innerHTML = '<div class="loading-spinner">Loading players...</div>';
  }
}

function showPlayersError() {
  const container = document.getElementById('players-list');
  if (container) {
    container.innerHTML = '<div class="error-message">Error loading players. Please try again.</div>';
  }
}

function showNoGamesMessage() {
  const container = document.getElementById('players-list');
  if (container) {
    container.innerHTML = '<div class="no-players">No MLB games scheduled for today.</div>';
  }
}
