// Shared utilities for Daily Draft and Stat Picks games

// ============================================
// CONSTANTS
// ============================================
const SALARY_CAP = 50000;
const POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'OF', 'P'];
const LINEUP_SIZE = 9;
const LINEUP_POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'OF', 'OF', 'OF', 'P'];

// Fantasy scoring rules
const SCORING_RULES = {
  hitting: {
    single: 3,
    double: 5,
    triple: 8,
    homeRun: 10,
    rbi: 2,
    run: 2,
    stolenBase: 5,
    walk: 2,
    strikeout: -1
  },
  pitching: {
    inningPitched: 3,
    strikeout: 2,
    win: 5,
    qualityStart: 5, // 6+ IP, ≤3 ER
    earnedRun: -2,
    hitAllowed: -0.5,
    walkAllowed: -0.5
  }
};

// ============================================
// STORAGE HELPERS
// ============================================

// Get data from chrome.storage.sync
async function getStorageData(key) {
  return new Promise((resolve) => {
    chrome.storage.sync.get([key], (result) => {
      resolve(result[key] || null);
    });
  });
}

// Set data to chrome.storage.sync
async function setStorageData(key, value) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [key]: value }, () => {
      resolve();
    });
  });
}

// Get data from chrome.storage.local (for larger data like player cache)
async function getLocalStorageData(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] || null);
    });
  });
}

// Set data to chrome.storage.local
async function setLocalStorageData(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => {
      resolve();
    });
  });
}

// ============================================
// API HELPERS
// ============================================

// Fetch today's schedule with probable pitchers
async function fetchTodaysSchedule() {
  const today = new Date();
  const dateStr = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
  const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${dateStr}&hydrate=probablePitcher,team`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.dates?.[0]?.games || [];
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return [];
  }
}

// Fetch player stats
async function fetchPlayerStats(playerId, season = 2026) {
  const url = `https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=season,lastXGames&season=${season}&group=hitting,pitching`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching stats for player ${playerId}:`, error);
    return null;
  }
}

// Fetch live game data for scoring
async function fetchLiveGameData(gamePk) {
  const url = `https://statsapi.mlb.com/api/v1/game/${gamePk}/feed/live`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching live game ${gamePk}:`, error);
    return null;
  }
}

// Fetch all active MLB players
async function fetchActivePlayers(season = 2026) {
  const url = `https://statsapi.mlb.com/api/v1/sports/1/players?season=${season}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.people || [];
  } catch (error) {
    console.error('Error fetching active players:', error);
    return [];
  }
}

// Fetch active roster for a team
async function fetchTeamRoster(teamId, season = 2026) {
  const url = `https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?rosterType=active&season=${season}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.roster || [];
  } catch (error) {
    console.error(`Error fetching roster for team ${teamId}:`, error);
    return [];
  }
}

// ============================================
// SALARY CALCULATION
// ============================================

// Calculate pseudo-salary for a hitter based on stats
function calculateHitterSalary(stats) {
  const base = 3000;
  
  // Default values if stats are missing
  const avg = stats.avg || 0.250;
  const obp = stats.obp || 0.320;
  const slg = stats.slg || 0.400;
  const hr = stats.homeRuns || 0;
  const sb = stats.stolenBases || 0;
  const gamesPlayed = stats.gamesPlayed || 1;
  
  // wOBA approximation
  const wOBA = (obp * 0.7) + (slg * 0.3);
  
  let salary = base;
  salary += wOBA * 5000;
  salary += (hr / gamesPlayed) * 10000;
  salary += (sb / gamesPlayed) * 2000;
  salary += (avg - 0.250) * 8000;
  
  // Round to nearest 100 and clamp between 3000-12000
  salary = Math.round(salary / 100) * 100;
  return Math.max(3000, Math.min(12000, salary));
}

// Calculate pseudo-salary for a pitcher based on stats
function calculatePitcherSalary(stats) {
  const base = 3000;
  
  // Default values if stats are missing
  const era = stats.era || 4.50;
  const whip = stats.whip || 1.30;
  const strikeoutsPer9 = stats.strikeoutsPer9Inn || 7.0;
  const wins = stats.wins || 0;
  const gamesStarted = stats.gamesStarted || 1;
  
  let salary = base;
  salary += (5.0 - Math.min(era, 5.0)) * 1200;
  salary += (2.0 - Math.min(whip, 2.0)) * 2000;
  salary += (strikeoutsPer9 - 5.0) * 800;
  salary += (wins / gamesStarted) * 3000;
  
  // Round to nearest 100 and clamp between 3000-12000
  salary = Math.round(salary / 100) * 100;
  return Math.max(3000, Math.min(12000, salary));
}

// ============================================
// FANTASY SCORING
// ============================================

// Calculate fantasy points for a hitter based on game stats
function calculateHitterPoints(gameStats) {
  let points = 0;
  const rules = SCORING_RULES.hitting;
  
  if (!gameStats) return 0;
  
  // Parse hits into singles, doubles, triples, home runs
  const hits = gameStats.hits || 0;
  const doubles = gameStats.doubles || 0;
  const triples = gameStats.triples || 0;
  const homeRuns = gameStats.homeRuns || 0;
  const singles = hits - doubles - triples - homeRuns;
  
  points += singles * rules.single;
  points += doubles * rules.double;
  points += triples * rules.triple;
  points += homeRuns * rules.homeRun;
  points += (gameStats.rbi || 0) * rules.rbi;
  points += (gameStats.runs || 0) * rules.run;
  points += (gameStats.stolenBases || 0) * rules.stolenBase;
  points += (gameStats.baseOnBalls || 0) * rules.walk;
  points += (gameStats.strikeOuts || 0) * rules.strikeout;
  
  return points;
}

// Calculate fantasy points for a pitcher based on game stats
function calculatePitcherPoints(gameStats) {
  let points = 0;
  const rules = SCORING_RULES.pitching;
  
  if (!gameStats) return 0;
  
  // Innings pitched (convert "6.1" format to innings)
  const inningsPitched = parseFloat(gameStats.inningsPitched || 0);
  points += inningsPitched * rules.inningPitched;
  
  points += (gameStats.strikeOuts || 0) * rules.strikeout;
  
  // Check for win
  if (gameStats.wins && gameStats.wins > 0) {
    points += rules.win;
  }
  
  // Check for quality start (6+ IP, ≤3 ER)
  const earnedRuns = gameStats.earnedRuns || 0;
  if (inningsPitched >= 6 && earnedRuns <= 3) {
    points += rules.qualityStart;
  }
  
  points += earnedRuns * rules.earnedRun;
  points += (gameStats.hits || 0) * rules.hitAllowed;
  points += (gameStats.baseOnBalls || 0) * rules.walkAllowed;
  
  return Math.round(points * 10) / 10; // Round to 1 decimal
}

// ============================================
// DATE HELPERS
// ============================================

// Get today's date string in YYYY-MM-DD format
function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parse date string to Date object
function parseDate(dateStr) {
  return new Date(dateStr);
}

// Check if a date is today
function isToday(dateStr) {
  return dateStr === getTodayDateString();
}

// Format date for display (e.g., "Mon, Mar 24")
function formatDateForDisplay(dateStr) {
  const date = new Date(dateStr);
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// ============================================
// DATA PRUNING
// ============================================

// Prune old draft history (keep last 30 days)
async function pruneDraftHistory() {
  const history = await getStorageData('dailyDraft_history') || [];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);
  
  const prunedHistory = history.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= cutoffDate;
  });
  
  if (prunedHistory.length !== history.length) {
    await setStorageData('dailyDraft_history', prunedHistory);
  }
}

// Prune old picks history (keep last 60 days)
async function prunePicksHistory() {
  const history = await getStorageData('statPicks_history') || [];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 60);
  
  const prunedHistory = history.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= cutoffDate;
  });
  
  if (prunedHistory.length !== history.length) {
    await setStorageData('statPicks_history', prunedHistory);
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Format salary for display (e.g., 8500 -> "$8.5K")
function formatSalary(salary) {
  return `$${(salary / 1000).toFixed(1)}K`;
}

// Format large numbers with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Get position display name
function getPositionName(pos) {
  const names = {
    'C': 'Catcher',
    '1B': 'First Base',
    '2B': 'Second Base',
    '3B': 'Third Base',
    'SS': 'Shortstop',
    'OF': 'Outfield',
    'P': 'Pitcher'
  };
  return names[pos] || pos;
}

// Normalize position abbreviations to lineup positions
function normalizePosition(position) {
  if (!position) return 'UTIL';
  const pos = position.toUpperCase();
  if (pos === 'LF' || pos === 'CF' || pos === 'RF') return 'OF';
  if (pos === 'SP' || pos === 'RP') return 'P';
  if (pos === 'DH') return 'UTIL';
  return pos;
}

// Get MLB player headshot URL (fallback included)
function getPlayerHeadshot(playerId, size = 'small') {
  const sizes = { small: 80, medium: 213, large: 426 };
  const width = sizes[size] || 80;
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_${width},q_auto:best/v1/people/${playerId}/headshot/67/current`;
}

// Get week key for caching (YYYY-WW)
function getWeekKey(date = new Date()) {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
  return `${tmp.getUTCFullYear()}-${String(weekNo).padStart(2, '0')}`;
}

// Build team/game map from today's schedule
function getTeamsFromSchedule(games) {
  const teamMap = new Map();

  games.forEach((game) => {
    const away = game.teams?.away?.team;
    const home = game.teams?.home?.team;
    if (!away || !home) return;

    const gameTime = game.gameDate;
    const gamePk = game.gamePk;

    teamMap.set(away.id, {
      teamId: away.id,
      teamAbbr: away.abbreviation,
      opponentAbbr: home.abbreviation,
      opponentId: home.id,
      gamePk,
      gameTime
    });

    teamMap.set(home.id, {
      teamId: home.id,
      teamAbbr: home.abbreviation,
      opponentAbbr: away.abbreviation,
      opponentId: away.id,
      gamePk,
      gameTime
    });
  });

  return teamMap;
}

// Extract primary position from player data
function getPrimaryPosition(player) {
  if (!player.primaryPosition) return 'UTIL';
  const pos = player.primaryPosition.abbreviation;
  
  // Normalize positions
  return normalizePosition(pos);
}

// Check if lineup is complete
function isLineupComplete(lineup) {
  return lineup.length === LINEUP_SIZE && lineup.every(slot => slot !== null);
}

// Calculate total salary of lineup
function calculateLineupSalary(lineup) {
  return lineup.reduce((total, player) => {
    return total + (player ? player.salary : 0);
  }, 0);
}

// Check if game has started
function hasGameStarted(gameDate) {
  const now = new Date();
  const gameTime = new Date(gameDate);
  return now >= gameTime;
}

// Check if game is final
function isGameFinal(gameStatus) {
  return gameStatus.abstractGameState === 'Final';
}
