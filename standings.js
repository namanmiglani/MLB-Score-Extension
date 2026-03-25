// MLB Standings - Data fetching, parsing, and rendering
// ======================================================

// Constants
const STANDINGS_API = 'https://statsapi.mlb.com/api/v1/standings';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
let standingsCache = null;
let lastFetchTime = null;

// ======================================================
// Data Fetching & Caching
// ======================================================

async function fetchStandings(forceRefresh = false) {
  const now = Date.now();

  // Return cached data if still valid and not forcing refresh
  if (!forceRefresh && standingsCache && lastFetchTime && (now - lastFetchTime) < CACHE_DURATION) {
    console.log('Using cached standings data');
    return standingsCache;
  }

  try {
    const currentYear = new Date().getFullYear();
    const url = `${STANDINGS_API}?leagueId=103,104&season=${currentYear}&standingsTypes=regularSeason,wildCard&hydrate=team,division,league`;

    console.log('Fetching standings from API:', url);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    standingsCache = parseStandingsData(data);
    lastFetchTime = now;

    console.log('Standings data fetched and cached successfully');
    return standingsCache;
  } catch (error) {
    console.error('Error fetching standings:', error);

    // Return cached data if available, even if expired
    if (standingsCache) {
      console.log('Using stale cached data due to fetch error');
      return standingsCache;
    }

    return null;
  }
}

// ======================================================
// Data Parsing
// ======================================================

function parseStandingsData(apiData) {
  const standings = {
    divisions: [],
    wildCard: {
      american: [],
      national: []
    },
    lastUpdated: new Date()
  };

  if (!apiData || !apiData.records) {
    console.error('Invalid API data structure');
    return standings;
  }

  // Parse division standings
  apiData.records.forEach(division => {
    if (division.standingsType === 'regularSeason') {
      const divisionData = {
        name: division.division.name,
        leagueName: division.league.name,
        teams: division.teamRecords.map((team, index) => ({
          rank: index + 1,
          name: team.team.name,
          wins: team.wins,
          losses: team.losses,
          winningPercentage: team.winningPercentage,
          gamesBack: team.gamesBack || '-',
          wildCardRank: team.wildCardRank || '-',
          wildCardGamesBack: team.wildCardGamesBack || '-',
          wildCardEliminationNumber: team.wildCardEliminationNumber || '-',
          eliminationNumber: team.eliminationNumber || '-',
          divisionLeader: team.divisionLeader || false,
          clinched: team.clinched || false,
          clinchIndicator: team.clinchIndicator || ''
        }))
      };

      standings.divisions.push(divisionData);
    }
  });

  // Parse wild card standings
  apiData.records.forEach(record => {
    if (record.standingsType === 'wildCard') {
      const leagueKey = record.league.name.includes('American') ? 'american' : 'national';

      record.teamRecords.forEach((team, index) => {
        standings.wildCard[leagueKey].push({
          rank: index + 1,
          name: team.team.name,
          wins: team.wins,
          losses: team.losses,
          winningPercentage: team.winningPercentage,
          wildCardGamesBack: team.wildCardGamesBack || '-',
          wildCardEliminationNumber: team.wildCardEliminationNumber || '-',
          clinched: team.clinched || false,
          clinchIndicator: team.clinchIndicator || ''
        });
      });
    }
  });

  return standings;
}

// ======================================================
// Magic Number Calculations
// ======================================================

function calculateMagicNumber(leaderWins, leaderLosses, chaserWins, chaserLosses) {
  const gamesRemaining = 162 - (leaderWins + leaderLosses);
  const gamesBehind = ((leaderWins - chaserWins) - (chaserLosses - leaderLosses)) / 2;
  const magicNumber = gamesRemaining - Math.floor(gamesBehind) + 1;

  return magicNumber > 0 ? magicNumber : 0;
}

function getMagicNumbers(standings) {
  const magicNumbers = {
    divisions: [],
    wildCard: { american: [], national: [] }
  };

  const currentMonth = new Date().getMonth();
  const isSeptember = currentMonth >= 8; // September = 8, October = 9

  if (!isSeptember) {
    return magicNumbers; // Don't show magic numbers before September
  }

  // Calculate division magic numbers
  standings.divisions.forEach(division => {
    const leader = division.teams[0];
    if (leader && !leader.clinched && division.teams.length > 1) {
      const secondPlace = division.teams[1];
      const magicNumber = calculateMagicNumber(
        leader.wins, leader.losses,
        secondPlace.wins, secondPlace.losses
      );

      if (magicNumber > 0 && magicNumber < 50) {
        magicNumbers.divisions.push({
          division: division.name,
          team: leader.name,
          magicNumber: magicNumber
        });
      }
    }
  });

  // Calculate wild card magic numbers
  ['american', 'national'].forEach(league => {
    const wcTeams = standings.wildCard[league];
    if (wcTeams.length >= 3) {
      const thirdWC = wcTeams[2]; // WC3 spot

      if (!thirdWC.clinched && wcTeams.length > 3) {
        const fourthPlace = wcTeams[3];
        const magicNumber = calculateMagicNumber(
          thirdWC.wins, thirdWC.losses,
          fourthPlace.wins, fourthPlace.losses
        );

        if (magicNumber > 0 && magicNumber < 50) {
          magicNumbers.wildCard[league].push({
            team: thirdWC.name,
            magicNumber: magicNumber
          });
        }
      }
    }
  });

  return magicNumbers;
}

// ======================================================
// Rendering Functions
// ======================================================

function renderStandings(data) {
  const container = document.getElementById('standings-container');

  if (!data) {
    container.innerHTML = '<p class="error-message">Unable to load standings. Please try again later.</p>';
    return;
  }

  container.innerHTML = '';

  const magicNumbers = getMagicNumbers(data);

  // Render magic number box if applicable
  if (magicNumbers.divisions.length > 0 ||
    magicNumbers.wildCard.american.length > 0 ||
    magicNumbers.wildCard.national.length > 0) {
    container.appendChild(renderMagicNumberBox(magicNumbers));
  }

  // Render wild card standings
  container.appendChild(renderWildCardSection(data.wildCard));

  // Render division standings
  const al = data.divisions.filter(d => d.leagueName.includes('American'));
  const nl = data.divisions.filter(d => d.leagueName.includes('National'));

  const alSection = document.createElement('div');
  alSection.className = 'league-section';
  alSection.innerHTML = '<h3 class="league-title">American League</h3>';
  al.forEach(division => alSection.appendChild(renderDivision(division)));
  container.appendChild(alSection);

  const nlSection = document.createElement('div');
  nlSection.className = 'league-section';
  nlSection.innerHTML = '<h3 class="league-title">National League</h3>';
  nl.forEach(division => nlSection.appendChild(renderDivision(division)));
  container.appendChild(nlSection);

  // Update last updated time
}

function renderMagicNumberBox(magicNumbers) {
  const box = document.createElement('div');
  box.className = 'magic-number-box';

  let html = '<h3>🎯 Playoff Race - Magic Numbers</h3><div class="magic-content">';

  if (magicNumbers.divisions.length > 0) {
    html += '<div class="magic-section"><strong>Division Leaders:</strong><ul>';
    magicNumbers.divisions.forEach(item => {
      html += `<li>${teamAbbreviation(item.team)}: <span class="magic-num">${item.magicNumber}</span></li>`;
    });
    html += '</ul></div>';
  }

  if (magicNumbers.wildCard.american.length > 0 || magicNumbers.wildCard.national.length > 0) {
    html += '<div class="magic-section"><strong>Wild Card Clinch:</strong><ul>';
    magicNumbers.wildCard.american.forEach(item => {
      html += `<li>AL - ${teamAbbreviation(item.team)}: <span class="magic-num">${item.magicNumber}</span></li>`;
    });
    magicNumbers.wildCard.national.forEach(item => {
      html += `<li>NL - ${teamAbbreviation(item.team)}: <span class="magic-num">${item.magicNumber}</span></li>`;
    });
    html += '</ul></div>';
  }

  html += '</div>';
  box.innerHTML = html;

  return box;
}

function renderWildCardSection(wildCard) {
  const section = document.createElement('div');
  section.className = 'wildcard-section';
  section.innerHTML = '<h3 class="wildcard-title">🌟 Wild Card Race</h3>';

  const alWC = renderWildCardTable(wildCard.american, 'American League');
  const nlWC = renderWildCardTable(wildCard.national, 'National League');

  section.appendChild(alWC);
  section.appendChild(nlWC);

  return section;
}

function renderWildCardTable(teams, leagueName) {
  const div = document.createElement('div');
  div.className = 'wildcard-table-container';

  if (!teams || teams.length === 0) {
    div.innerHTML = `<p class="no-data">${leagueName} wild card data unavailable</p>`;
    return div;
  }

  const favoriteTeam = getFavoriteTeam();

  let html = `
    <h4>${leagueName}</h4>
    <table class="standings-table wildcard-table">
      <thead>
        <tr>
          <th>WC</th>
          <th>Team</th>
          <th>W</th>
          <th>L</th>
          <th>PCT</th>
          <th>GB</th>
        </tr>
      </thead>
      <tbody>
  `;

  teams.slice(0, 8).forEach((team, index) => {
    const rank = index + 1;
    const isInPlayoffs = rank <= 3;
    const isFavorite = favoriteTeam === team.name;
    const clinchBadge = team.clinchIndicator ? `<span class="clinch-indicator">${team.clinchIndicator}</span>` : '';

    let rowClass = 'standings-row';
    if (isFavorite) rowClass += ' favorite-team';
    if (isInPlayoffs) rowClass += ' wildcard-team';

    html += `
      <tr class="${rowClass}">
        <td class="wc-rank">${rank <= 3 ? `WC${rank}` : rank}</td>
        <td class="team-cell">
          ${clinchBadge}
          <img src="${teamLogo(team.name)}" height="20" width="20" alt="${team.name}">
          <span>${teamAbbreviation(team.name)}</span>
        </td>
        <td>${team.wins}</td>
        <td>${team.losses}</td>
        <td>${team.winningPercentage}</td>
        <td>${team.wildCardGamesBack}</td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  div.innerHTML = html;

  return div;
}

function renderDivision(division) {
  const div = document.createElement('div');
  div.className = 'division-block';

  const favoriteTeam = getFavoriteTeam();

  let html = `
    <h4 class="division-name">${division.name}</h4>
    <table class="standings-table">
      <thead>
        <tr>
          <th>Rk</th>
          <th>Team</th>
          <th>W</th>
          <th>L</th>
          <th>GB</th>
          <th>WC</th>
        </tr>
      </thead>
      <tbody>
  `;

  division.teams.forEach(team => {
    const isFavorite = favoriteTeam === team.name;
    const isLeader = team.rank === 1;
    const clinchBadge = team.clinchIndicator ? `<span class="clinch-indicator">${team.clinchIndicator}</span>` : '';
    const leaderBadge = isLeader ? '<span class="leader-badge">👑</span>' : '';

    let rowClass = 'standings-row';
    if (isFavorite) rowClass += ' favorite-team';
    if (isLeader) rowClass += ' division-leader';

    const wcDisplay = team.wildCardRank !== '-'
      ? `WC${team.wildCardRank}`
      : (team.wildCardGamesBack !== '-' ? team.wildCardGamesBack : '-');

    html += `
      <tr class="${rowClass}">
        <td class="rank-cell">${team.rank}</td>
        <td class="team-cell">
          ${clinchBadge}
          <img src="${teamLogo(team.name)}" height="20" width="20" alt="${team.name}">
          <span>${teamAbbreviation(team.name)}</span>
          ${leaderBadge}
        </td>
        <td>${team.wins}</td>
        <td>${team.losses}</td>
        <td>${team.gamesBack}</td>
        <td>${wcDisplay}</td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  div.innerHTML = html;

  return div;
}

function updateLastUpdatedTime(timestamp) {
  const element = document.getElementById('standings-last-updated');
  if (element) {
    const timeString = timestamp.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
    element.textContent = `Last updated: ${timeString}`;
  }
}

// ======================================================
// Helper Functions
// ======================================================

function getFavoriteTeam() {
  return localStorage.getItem('fav-team') || null;
}

function showLoadingSpinner() {
  const container = document.getElementById('standings-container');
  if (container) {
    container.innerHTML = '<div class="loading-spinner">Loading standings...</div>';
  }
}

function hideLoadingSpinner() {
  // Loading removed when content is rendered
}

// ======================================================
// Public API
// ======================================================

async function loadStandings(forceRefresh = false) {
  showLoadingSpinner();
  const data = await fetchStandings(forceRefresh);
  renderStandings(data);
}

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
  window.loadStandings = loadStandings;
}
