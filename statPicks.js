// Player Stat Picks Game Logic

let todaysPicks = [];
let currentStreak = 0;
let bestStreak = 0;
let userSelections = {};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  setupPicksEventListeners();
});

function setupPicksEventListeners() {
  const statPicksBtn = document.getElementById('stat-picks-btn');
  const backBtn = document.getElementById('back-from-picks');
  const refreshBtn = document.getElementById('refresh-picks');
  const historyBtn = document.getElementById('view-picks-history-btn');
  
  if (statPicksBtn) {
    statPicksBtn.addEventListener('click', () => {
      switchToStatPicks();
    });
  }
  
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      switchToScores();
    });
  }
  
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      await generateTodaysPicks(true);
      renderPicksList();
    });
  }
  
  if (historyBtn) {
    historyBtn.addEventListener('click', showPicksHistory);
  }
}

async function switchToStatPicks() {
  // Hide all views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
    view.classList.add('hidden');
  });
  
  // Show picks view
  const picksView = document.getElementById('stat-picks-view');
  picksView.classList.remove('hidden');
  picksView.classList.add('active');
  
  // Hide date navigation
  const dateNav = document.getElementById('date-navigation');
  if (dateNav) dateNav.style.display = 'none';
  
  // Initialize picks
  await initializeStatPicks();
}

async function initializeStatPicks() {
  await loadStreakData();
  await loadTodaysPicks();
  renderStreakDisplay();
  renderPicksList();
}

// ============================================
// DATA LOADING
// ============================================

async function loadStreakData() {
  const streaks = await getStorageData('statPicks_streaks') || {
    current: 0,
    best: 0,
    history: []
  };
  
  currentStreak = streaks.current;
  bestStreak = streaks.best;
}

async function loadTodaysPicks() {
  const today = getTodayDateString();
  const currentPicks = await getStorageData('statPicks_current');
  
  if (currentPicks && currentPicks.date === today) {
    todaysPicks = currentPicks.picks || [];
    userSelections = currentPicks.selections || {};
  } else {
    // Generate new picks for today
    await generateTodaysPicks();
  }
}

async function generateTodaysPicks(force = false) {
  const today = getTodayDateString();
  
  if (!force) {
    const currentPicks = await getStorageData('statPicks_current');
    if (currentPicks && currentPicks.date === today) {
      return; // Already have picks for today
    }
  }
  
  showPicksLoading();
  
  try {
    const games = await fetchTodaysSchedule();

    if (!games || games.length === 0) {
      todaysPicks = [];
      userSelections = {};
      await setStorageData('statPicks_current', {
        date: today,
        picks: [],
        selections: {}
      });
      showNoGamesPicksMessage();
      return;
    }
    const picks = [];
    
    // Generate Over/Under picks (3)
    const overUnderPicks = await generateOverUnderPicks(games);
    picks.push(...overUnderPicks);
    
    // Generate Head-to-Head picks (2)
    const h2hPicks = await generateHeadToHeadPicks(games);
    picks.push(...h2hPicks);
    
    // Generate Prop picks (1-2)
    const propPicks = generatePropPicks(games);
    picks.push(...propPicks);
    
    todaysPicks = picks;
    userSelections = {};
    
    // Save to storage
    await setStorageData('statPicks_current', {
      date: today,
      picks: picks,
      selections: {}
    });
    
  } catch (error) {
    console.error('Error generating picks:', error);
    showPicksError();
  }
}

async function generateOverUnderPicks(games) {
  const picks = [];
  const targetCount = 3;
  
  // Get players from today's games
  const players = [];
  
  for (const game of games.slice(0, 5)) { // Look at first 5 games
    if (game.teams?.away?.probablePitcher) {
      players.push({
        ...game.teams.away.probablePitcher,
        team: game.teams.away.team.abbreviation,
        teamId: game.teams.away.team.id,
        opponent: game.teams.home.team.abbreviation,
        gamePk: game.gamePk,
        gameTime: game.gameDate,
        isPitcher: true
      });
    }
    
    if (game.teams?.home?.probablePitcher) {
      players.push({
        ...game.teams.home.probablePitcher,
        team: game.teams.home.team.abbreviation,
        teamId: game.teams.home.team.id,
        opponent: game.teams.away.team.abbreviation,
        gamePk: game.gamePk,
        gameTime: game.gameDate,
        isPitcher: true
      });
    }
  }
  
  // Add some mock hitters
  const mockHitters = [
    { id: 592450, fullName: 'Aaron Judge', team: 'NYY', teamId: 147, stat: 'totalBases', line: 2.5, seasonAvg: 2.8 },
    { id: 660670, fullName: 'Ronald Acuna Jr.', team: 'ATL', teamId: 144, stat: 'hits', line: 1.5, seasonAvg: 1.9 },
    { id: 605141, fullName: 'Mookie Betts', team: 'LAD', teamId: 119, stat: 'hits', line: 1.5, seasonAvg: 1.7 }
  ];
  
  for (let i = 0; i < Math.min(targetCount, mockHitters.length); i++) {
    const player = mockHitters[i];
    const game = games.find(g => 
      g.teams.away.team.abbreviation === player.team || 
      g.teams.home.team.abbreviation === player.team
    );
    
    if (game) {
      const isAway = game.teams.away.team.abbreviation === player.team;
      
      picks.push({
        id: `ou_${player.id}_${player.stat}_${player.line}`,
        type: 'overUnder',
        playerId: player.id,
        playerName: player.fullName,
        team: player.team,
        teamId: player.teamId,
        opponent: isAway ? game.teams.home.team.abbreviation : game.teams.away.team.abbreviation,
        stat: player.stat,
        statDisplay: formatStatName(player.stat),
        line: player.line,
        seasonAvg: player.seasonAvg,
        gamePk: game.gamePk,
        gameTime: game.gameDate,
        status: 'pending'
      });
    }
  }
  
  return picks;
}

async function generateHeadToHeadPicks(games) {
  const picks = [];
  const targetCount = 2;
  
  // Mock head-to-head matchups
  const matchups = [
    {
      player1: { id: 605141, fullName: 'Mookie Betts', team: 'LAD', teamId: 119 },
      player2: { id: 660670, fullName: 'Ronald Acuna Jr.', team: 'ATL', teamId: 144 },
      stat: 'hits',
      statDisplay: 'Hits'
    },
    {
      player1: { id: 592450, fullName: 'Aaron Judge', team: 'NYY', teamId: 147 },
      player2: { id: 677594, fullName: 'Julio Rodriguez', team: 'SEA', teamId: 136 },
      stat: 'homeRuns',
      statDisplay: 'Home Runs'
    }
  ];
  
  for (let i = 0; i < Math.min(targetCount, matchups.length); i++) {
    const matchup = matchups[i];
    
    // Find games for both players
    const game1 = games.find(g => 
      g.teams.away.team.abbreviation === matchup.player1.team || 
      g.teams.home.team.abbreviation === matchup.player1.team
    );
    
    const game2 = games.find(g => 
      g.teams.away.team.abbreviation === matchup.player2.team || 
      g.teams.home.team.abbreviation === matchup.player2.team
    );
    
    if (game1 && game2) {
      picks.push({
        id: `h2h_${matchup.player1.id}_${matchup.player2.id}_${matchup.stat}`,
        type: 'headToHead',
        player1Id: matchup.player1.id,
        player1Name: matchup.player1.fullName,
        player1Team: matchup.player1.team,
        player1TeamId: matchup.player1.teamId,
        player2Id: matchup.player2.id,
        player2Name: matchup.player2.fullName,
        player2Team: matchup.player2.team,
        player2TeamId: matchup.player2.teamId,
        stat: matchup.stat,
        statDisplay: matchup.statDisplay,
        gamePk1: game1.gamePk,
        gamePk2: game2.gamePk,
        gameTime: new Date(Math.max(new Date(game1.gameDate), new Date(game2.gameDate))),
        status: 'pending'
      });
    }
  }
  
  return picks;
}

function generatePropPicks(games) {
  const picks = [];
  
  // Prop bet options
  const props = [
    {
      id: 'prop_no_hitter',
      question: 'Will there be a no-hitter today?',
      context: 'Last no-hitter was 45 days ago',
      type: 'yesNo'
    },
    {
      id: 'prop_grand_slam',
      question: 'Will any player hit a grand slam?',
      context: 'Grand slams happen in ~3% of games',
      type: 'yesNo'
    }
  ];
  
  // Randomly select 1 prop
  const randomProp = props[Math.floor(Math.random() * props.length)];
  
  picks.push({
    id: randomProp.id,
    type: 'prop',
    question: randomProp.question,
    context: randomProp.context,
    propType: randomProp.type,
    status: 'pending'
  });
  
  return picks;
}

// ============================================
// PICK SELECTION
// ============================================

async function selectPick(pickId, choice) {
  userSelections[pickId] = choice;
  
  // Save selection
  const today = getTodayDateString();
  await setStorageData('statPicks_current', {
    date: today,
    picks: todaysPicks,
    selections: userSelections
  });
  
  // Re-render to show selection
  renderPicksList();
}

// ============================================
// STREAK MANAGEMENT
// ============================================

async function updateStreak(isCorrect) {
  if (isCorrect) {
    currentStreak++;
    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
    }
  } else {
    currentStreak = 0;
  }
  
  // Save streak data
  const streaks = await getStorageData('statPicks_streaks') || { history: [] };
  streaks.current = currentStreak;
  streaks.best = bestStreak;
  streaks.history.push(currentStreak);
  
  // Keep only last 60 days of history
  if (streaks.history.length > 60) {
    streaks.history = streaks.history.slice(-60);
  }
  
  await setStorageData('statPicks_streaks', streaks);
  
  renderStreakDisplay();
}

// ============================================
// RENDERING
// ============================================

function renderStreakDisplay() {
  const currentStreakEl = document.getElementById('current-streak');
  const bestStreakEl = document.getElementById('best-streak');
  
  if (currentStreakEl) {
    currentStreakEl.textContent = currentStreak;
    
    // Add fire emoji for hot streaks
    if (currentStreak >= 5) {
      currentStreakEl.textContent += ' 🔥';
    }
    if (currentStreak >= 10) {
      currentStreakEl.textContent += '🔥';
    }
  }
  
  if (bestStreakEl) {
    bestStreakEl.textContent = bestStreak;
  }
}

function renderPicksList() {
  const container = document.getElementById('picks-list');
  if (!container) return;
  
  if (todaysPicks.length === 0) {
    container.innerHTML = '<div class="no-picks">No picks available for today</div>';
    return;
  }
  
  container.innerHTML = todaysPicks.map(pick => {
    switch (pick.type) {
      case 'overUnder':
        return renderOverUnderPick(pick);
      case 'headToHead':
        return renderHeadToHeadPick(pick);
      case 'prop':
        return renderPropPick(pick);
      default:
        return '';
    }
  }).join('');
  
  // Add event listeners
  addPickEventListeners();
}

function renderOverUnderPick(pick) {
  const userChoice = userSelections[pick.id];
  const isLocked = hasGameStarted(pick.gameTime);
  
  return `
    <div class="pick-card over-under-pick">
      <div class="pick-header">
        <span class="pick-type-badge">Over/Under</span>
        <span class="pick-status ${pick.status}">${getStatusBadge(pick.status)}</span>
      </div>
      <div class="pick-player-info">
        <img src="${getPlayerHeadshot(pick.playerId, 'small')}" alt="${pick.playerName}" class="pick-player-headshot">
        <img src="${teamLogo(pick.teamId)}" alt="${pick.team}" class="pick-team-logo">
        <div class="pick-player-details">
          <div class="pick-player-name">${pick.playerName}</div>
          <div class="pick-player-team">${pick.team} vs ${pick.opponent}</div>
        </div>
      </div>
      <div class="pick-stat-line">
        <div class="stat-name">${pick.statDisplay}</div>
        <div class="stat-line">Line: ${pick.line}</div>
        <div class="stat-avg">Season Avg: ${pick.seasonAvg}</div>
      </div>
      <div class="pick-buttons">
        <button class="pick-btn over-btn ${userChoice === 'over' ? 'selected' : ''}" 
                data-pick-id="${pick.id}" data-choice="over" ${isLocked ? 'disabled' : ''}>
          OVER ${pick.line}
        </button>
        <button class="pick-btn under-btn ${userChoice === 'under' ? 'selected' : ''}" 
                data-pick-id="${pick.id}" data-choice="under" ${isLocked ? 'disabled' : ''}>
          UNDER ${pick.line}
        </button>
      </div>
      ${isLocked ? '<div class="pick-locked">🔒 Locked</div>' : ''}
    </div>
  `;
}

function renderHeadToHeadPick(pick) {
  const userChoice = userSelections[pick.id];
  const isLocked = hasGameStarted(pick.gameTime);
  
  return `
    <div class="pick-card h2h-pick">
      <div class="pick-header">
        <span class="pick-type-badge">Head-to-Head</span>
        <span class="pick-status ${pick.status}">${getStatusBadge(pick.status)}</span>
      </div>
      <div class="pick-question">Who will get more ${pick.statDisplay}?</div>
      <div class="h2h-matchup">
        <div class="h2h-player ${userChoice === pick.player1Id ? 'selected' : ''}">
          <img src="${getPlayerHeadshot(pick.player1Id, 'small')}" alt="${pick.player1Name}" class="h2h-player-headshot">
          <img src="${teamLogo(pick.player1TeamId)}" alt="${pick.player1Team}" class="h2h-team-logo">
          <div class="h2h-player-name">${pick.player1Name}</div>
          <div class="h2h-player-team">${pick.player1Team}</div>
          <button class="pick-btn h2h-btn" data-pick-id="${pick.id}" data-choice="${pick.player1Id}" 
                  ${isLocked ? 'disabled' : ''}>
            Pick ${pick.player1Name.split(' ')[1]}
          </button>
        </div>
        <div class="h2h-vs">VS</div>
        <div class="h2h-player ${userChoice === pick.player2Id ? 'selected' : ''}">
          <img src="${getPlayerHeadshot(pick.player2Id, 'small')}" alt="${pick.player2Name}" class="h2h-player-headshot">
          <img src="${teamLogo(pick.player2TeamId)}" alt="${pick.player2Team}" class="h2h-team-logo">
          <div class="h2h-player-name">${pick.player2Name}</div>
          <div class="h2h-player-team">${pick.player2Team}</div>
          <button class="pick-btn h2h-btn" data-pick-id="${pick.id}" data-choice="${pick.player2Id}" 
                  ${isLocked ? 'disabled' : ''}>
            Pick ${pick.player2Name.split(' ')[1]}
          </button>
        </div>
      </div>
      ${isLocked ? '<div class="pick-locked">🔒 Locked</div>' : ''}
    </div>
  `;
}

function renderPropPick(pick) {
  const userChoice = userSelections[pick.id];
  
  return `
    <div class="pick-card prop-pick">
      <div class="pick-header">
        <span class="pick-type-badge">Prop Bet</span>
        <span class="pick-status ${pick.status}">${getStatusBadge(pick.status)}</span>
      </div>
      <div class="prop-question">${pick.question}</div>
      <div class="prop-context">${pick.context}</div>
      <div class="pick-buttons">
        <button class="pick-btn yes-btn ${userChoice === 'yes' ? 'selected' : ''}" 
                data-pick-id="${pick.id}" data-choice="yes">
          YES
        </button>
        <button class="pick-btn no-btn ${userChoice === 'no' ? 'selected' : ''}" 
                data-pick-id="${pick.id}" data-choice="no">
          NO
        </button>
      </div>
    </div>
  `;
}

function addPickEventListeners() {
  document.querySelectorAll('.pick-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const pickId = e.target.dataset.pickId;
      const choice = e.target.dataset.choice;
      
      if (pickId && choice) {
        selectPick(pickId, choice);
      }
    });
  });
}

// ============================================
// HISTORY
// ============================================

async function showPicksHistory() {
  const history = await getStorageData('statPicks_history') || [];
  
  if (history.length === 0) {
    alert('No pick history yet. Make your first picks!');
    return;
  }
  
  console.log('Picks History:', history);
  alert(`You have pick history for ${history.length} days. Detailed view coming soon!`);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatStatName(stat) {
  const names = {
    hits: 'Hits',
    totalBases: 'Total Bases',
    homeRuns: 'Home Runs',
    rbi: 'RBI',
    runs: 'Runs',
    stolenBases: 'Stolen Bases',
    strikeouts: 'Strikeouts (Pitcher)',
    earnedRuns: 'Earned Runs'
  };
  return names[stat] || stat;
}

function getStatusBadge(status) {
  const badges = {
    pending: '🟡 Pending',
    live: '🔵 Live',
    correct: '✅ Correct',
    incorrect: '❌ Incorrect',
    locked: '🔒 Locked'
  };
  return badges[status] || status;
}

function showPicksLoading() {
  const container = document.getElementById('picks-list');
  if (container) {
    container.innerHTML = '<div class="loading-spinner">Generating today\'s picks...</div>';
  }
}

function showPicksError() {
  const container = document.getElementById('picks-list');
  if (container) {
    container.innerHTML = '<div class="error-message">Error loading picks. Please try again.</div>';
  }
}

function showNoGamesPicksMessage() {
  const container = document.getElementById('picks-list');
  if (container) {
    container.innerHTML = '<div class="no-picks">No MLB games scheduled for today.</div>';
  }
}
