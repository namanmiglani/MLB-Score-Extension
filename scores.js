const date = new Date();

const apiURL = 'http://statsapi.mlb.com/api/v1/schedule/games/?sportId=1&date=';
const template = 'http://statsapi.mlb.com'
const currentDayAPILink = 'http://localhost:8080/getScores'
let teamLink;
let gamesURL;
let scoreData;
let inningData;
let idf;
let teamNameData;
let currentDate;
let myMap = new Map();
let scoreUpdateInterval = null;
const body = document.querySelector('body');

function load() {
  document.querySelector('#show').style.display = "block";
  document.querySelector('#loading').style.display = "none";
}

function monthConversion(n) {
    switch (n) {
       case 0:
         return "JAN";
         break;
       case 1:
         return "FEB";
         break;
       case 2:
         return "MAR";
         break;
       case 3:
         return "APR";
         break;
       case 4:
         return "MAY";
         break;
       case 5:
         return "JUN";
         break;
       case 6:
         return "JUL";
       case 7:
         return "AUG";
         break;
       case 8:
         return "SEP";
         break;
       case 9:
         return "OCT";
         break;
       case 10:
         return "NOV";
         break;
       case 11:
         return "DEC";
         break;
    }
}

// Convert game time to user's local timezone
function formatGameTime(gameDate) {
  // Return a user-friendly 'TBD' when the gameDate is missing or invalid
  if (!gameDate) return 'TBD';

  const date = new Date(gameDate);
  if (isNaN(date.getTime())) return 'TBD';

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function dateDaysBefore(days) {
    let d = new Date();
    d.setDate(d.getDate() - days);
    //let fullForm = d.toISOString().substring(5,10);

    return monthConversion(d.getMonth()) + " " + d.getDate()
}

function dateDaysBeforeLink(days) {
    let d = new Date();
    d.setDate(d.getDate() - days);

    gamesURL = `${apiURL}${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`
}

function headerDaysBeforeAfter() {
    const header = document.querySelector('header');
    const dateNav = document.getElementById('date-navigation');
    
    if (!dateNav) return;
    
    let twoDayAgo = dateDaysBefore(2)
    let twoDayAgoDiv = document.createElement('button')
    twoDayAgoDiv.classList = "days"
    twoDayAgoDiv.textContent=twoDayAgo;
    twoDayAgoDiv.addEventListener('click', function(){
      dateDaysBeforeLink(2);
      fetchScoresData(); // Immediate update
    });
    dateNav.appendChild(twoDayAgoDiv)

    let oneDayAgo = dateDaysBefore(1)
    let oneDayAgoDiv = document.createElement('button')
    oneDayAgoDiv.classList = "days"
    oneDayAgoDiv.textContent=oneDayAgo;
    oneDayAgoDiv.addEventListener('click', function(){
      dateDaysBeforeLink(1);
      fetchScoresData(); // Immediate update
    });
    dateNav.appendChild(oneDayAgoDiv)


    let today = dateDaysBefore(0)
    let todayDiv = document.createElement('button')
    todayDiv.classList = "days"
    todayDiv.textContent=today;
    todayDiv.addEventListener('click', function(){
      dateDaysBeforeLink(0);
      fetchScoresData(); // Immediate update
    });
    dateNav.appendChild(todayDiv)

    let oneDayAhead = dateDaysBefore(-1)
    let oneDayAheadDiv = document.createElement('button')
    oneDayAheadDiv.classList = "days"
    oneDayAheadDiv.textContent=oneDayAhead;
    oneDayAheadDiv.addEventListener('click', function(){
      dateDaysBeforeLink(-1);
      fetchScoresData(); // Immediate update
    });
    dateNav.appendChild(oneDayAheadDiv)

    let twoDaysAhead = dateDaysBefore(-2)
    let twoDaysAheadDiv = document.createElement('button')
    twoDaysAheadDiv.classList = "days"
    twoDaysAheadDiv.textContent=twoDaysAhead;
    twoDaysAheadDiv.addEventListener('click', function(){
      dateDaysBeforeLink(-2);
      fetchScoresData(); // Immediate update
    });
    dateNav.appendChild(twoDaysAheadDiv)
}

headerDaysBeforeAfter()


function getDate() {
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();

 
    currentDate = year + ('0' + month).slice(-2)
             + ('0' + day).slice(-2) 
    //`${month}${day}${year}`;
    
    gamesURL = `${apiURL}${month}/${day}/${year}`

    
}

getDate();


function boxScore(home, away){
    return "https://www.cbssports.com/mlb/gametracker/boxscore/MLB_"+ currentDate +"_" + away + "@" + home + "/";
}

function inningSearch(){
  idf.forEach(game => {
    // Only add to map if linescore data exists
    if (game?.linescore?.inningHalf && game?.linescore?.currentInningOrdinal) {
      myMap.set(game.gameGuid, game.linescore.inningHalf + " " + game.linescore.currentInningOrdinal);
    }
  });
}


const populateScoreboard = (game, body) => {
  // Safely read status and scores
  const detailedState = game?.status?.detailedState;
  const abstractState = game?.status?.abstractGameState;
  const homeScore = game?.teams?.home?.score;
  const awayScore = game?.teams?.away?.score;

  // If game is In Progress, render with inning info
  if (detailedState === "In Progress") {
    if (homeScore === undefined || awayScore === undefined) return; // skip incomplete entry

    // Get inning info from map, fallback to "Live" if not available
    const inningInfo = myMap.get(game.gameGuid) || "Live";

    const gameBox = document.createElement('div');
    gameBox.classList = 'score-box grid-item';
    gameBox.innerHTML = ` 
      <a href=${boxScore(teamAbbreviation(game.teams.home.team.name), teamAbbreviation(game.teams.away.team.name))} target="_blank">
        <p class="status">${inningInfo}<p>
        <div class="with-image">
          <img src=${teamLogo(game.teams.home.team.name)} height="20px" width="20px">
          <div>${teamAbbreviation(game.teams.home.team.name)} : ${homeScore} </div>
        </div>
        <div class="with-image">
          <img src=${teamLogo(game.teams.away.team.name)} height="20px" width="20px">
          <div>${teamAbbreviation(game.teams.away.team.name)} : ${awayScore}</div>
        </div>
      </a>
    `;
    document.getElementById('grid-container').appendChild(gameBox);
    return;
  }

  // If game is Final (check multiple possible final states)
  if (abstractState === "Final" || detailedState === "Final" || 
      detailedState === "Game Over" || detailedState === "Completed Early") {
    if (homeScore === undefined || awayScore === undefined) return; // skip incomplete final

    const gameBox = document.createElement('div');
    gameBox.classList = 'score-box grid-item';
    gameBox.innerHTML = ` 
      <a href=${boxScore(teamAbbreviation(game.teams.home.team.name), teamAbbreviation(game.teams.away.team.name))} target="_blank">
        <p class="status">Final<p>
        <div class="with-image">
          <img src=${teamLogo(game.teams.home.team.name)} height="20px" width="20px">
          <div>${teamAbbreviation(game.teams.home.team.name)} : ${homeScore} </div>
        </div>
        <div class="with-image">
          <img src=${teamLogo(game.teams.away.team.name)} height="20px" width="20px">
          <div>${teamAbbreviation(game.teams.away.team.name)} : ${awayScore}</div>
        </div>
      </a>
    `;
    document.getElementById('grid-container').appendChild(gameBox);
    return;
  }

  // If game is Preview/Scheduled/Pre-Game, show start time
  // Check this BEFORE checking for scores, since Pre-Game games have score: 0
  if (abstractState === "Preview" || 
      detailedState === "Pre-Game" || 
      detailedState === "Scheduled" ||
      detailedState === "Warmup") {
    const gameBox = document.createElement('div');
    gameBox.classList = 'score-box grid-item';
    gameBox.innerHTML = ` 
      <a href=${boxScore(teamAbbreviation(game.teams.home.team.name), teamAbbreviation(game.teams.away.team.name))} target="_blank">
        <p class="status">${formatGameTime(game.gameDate)}<p>
        <div class="with-image">
          <img src=${teamLogo(game.teams.home.team.name)} height="20px" width="20px">
          <div>${teamAbbreviation(game.teams.home.team.name)}</div>
        </div>
        <div class="with-image">
          <img src=${teamLogo(game.teams.away.team.name)} height="20px" width="20px">
          <div>${teamAbbreviation(game.teams.away.team.name)}</div>
        </div>
      </a>
    `;
    document.getElementById('grid-container').appendChild(gameBox);
    return;
  }

  // If game has scores but didn't match above states, treat as Final
  // This handles edge cases where the status might not be set correctly
  if (homeScore !== undefined && awayScore !== undefined) {
    const gameBox = document.createElement('div');
    gameBox.classList = 'score-box grid-item';
    gameBox.innerHTML = ` 
      <a href=${boxScore(teamAbbreviation(game.teams.home.team.name), teamAbbreviation(game.teams.away.team.name))} target="_blank">
        <p class="status">Final<p>
        <div class="with-image">
          <img src=${teamLogo(game.teams.home.team.name)} height="20px" width="20px">
          <div>${teamAbbreviation(game.teams.home.team.name)} : ${homeScore} </div>
        </div>
        <div class="with-image">
          <img src=${teamLogo(game.teams.away.team.name)} height="20px" width="20px">
          <div>${teamAbbreviation(game.teams.away.team.name)} : ${awayScore}</div>
        </div>
      </a>
    `;
    document.getElementById('grid-container').appendChild(gameBox);
    return;
  }

  // Default: scheduled / preview games - show matchup and time
  const gameBox = document.createElement('div');
  gameBox.classList = 'score-box grid-item';
  gameBox.innerHTML = ` 
    <a href=${boxScore(teamAbbreviation(game.teams.home.team.name), teamAbbreviation(game.teams.away.team.name))} target="_blank">
      <p class="status">${formatGameTime(game.gameDate)}<p>
      <div class="with-image">
        <img src=${teamLogo(game.teams.home.team.name)} height="20px" width="20px">
        <div>${teamAbbreviation(game.teams.home.team.name)}</div>
      </div>
      <div class="with-image">
        <img src=${teamLogo(game.teams.away.team.name)} height="20px" width="20px">
        <div>${teamAbbreviation(game.teams.away.team.name)}</div>
      </div>
    </a>
  `;
  document.getElementById('grid-container').appendChild(gameBox);
}

const populateScoresForDay = (data, day, body) => {
    const entireDayContainer = document.createElement("div");
    document.getElementById('grid-container').innerHTML = "";

    if (data){
        // If there are no games for that date, just show "No Games Scheduled"
        if (!data.length || data.length === 0){
            //renderNoGamesScreen(entireDayContainer);
        } else {
            data.forEach(gameItem => {
                //console.log(gameItem)
                populateScoreboard(gameItem, entireDayContainer);
            });
        }
    }
    body && body.appendChild(entireDayContainer);
}

const updateScore = (scoreboardId, data, isError) => {
    const body = document.getElementById(scoreboardId);


    if (isError){
        //
    } else {
        //console.log(((data['dates'])[0])['games'])
        populateScoresForDay(((data['dates'])[0])['games'], date, body);
        

    }
}

function fetchScoresData() {
    return fetch(gamesURL)
    .then(response => {
        return response.json();
    })
    .then(function(data){
        scoreData = data;
        updateScore("liveScoreboard", scoreData);
    })
    .catch((err) => {
        updateScore("liveScoreboard", scoreData, true);
        console.error(err);
    });
}

const updateInning = (data, isError) => {
  //console.log((((data["dates"])[0])['games']))
  idf = (((data["dates"])[0])['games'])
  console.log(idf)
  inningSearch()
  
}

const myHeaders = new Headers();
myHeaders.append("sec-ch-ua", "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Google Chrome\";v=\"126\"");
myHeaders.append("Referer", "https://www.mlb.com/");
myHeaders.append("sec-ch-ua-mobile", "?0");
myHeaders.append("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36");
myHeaders.append("sec-ch-ua-platform", "\"Windows\"");

const requestOptions = {
  method: "GET",
  headers: myHeaders,
  redirect: "follow"
};


function addOne(number){
  return number+1;
}

function inningLinkGen(){
  return "https://statsapi.mlb.com/api/v1/schedule?sportId=1&sportId=51&sportId=21&startDate="+date.getFullYear() + "-" +  addOne(date.getMonth())  + "-" + date.getDate() +"&endDate="+date.getFullYear() + "-" + addOne(date.getMonth()) + "-" + date.getDate() +"&timeZone=America/New_York&gameType=E&&gameType=S&&gameType=R&&gameType=F&&gameType=D&&gameType=L&&gameType=W&&gameType=A&&gameType=C&language=en&leagueId=104&&leagueId=103&&leagueId=160&&leagueId=590&hydrate=team,linescore(matchup,runners),xrefId,story,flags,statusFlags,broadcasts(all),venue(location),decisions,person,probablePitcher,stats,game(content(media(epg),summary),tickets),seriesStatus(useOverride=true)&sortBy=gameDate,gameStatus,gameType"
}

function fetchInningsData() {
    return fetch(inningLinkGen(), requestOptions)
    .then((response) => response.json())
    .then((result) => updateInning(result))
    .catch((error) => console.error(error));
}

// Synchronized initial load to prevent UI flickering
async function initializeApp() {
    try {
        // Fetch both essential pieces of data before showing the UI
        await Promise.all([
            fetchInningsData(),
            fetchScoresData()
        ]);
    } catch (error) {
        console.error("Error during initialization:", error);
    } finally {
        // Hide loading screen only after both (or failed) fetches
        load();
        
        // Start intervals for regular updates
        if (!scoreUpdateInterval) {
            scoreUpdateInterval = setInterval(fetchScoresData, 1000);
        }
        setInterval(fetchInningsData, 30000); // Update innings every 30 seconds
    }
}

initializeApp();


// ======================================================
// View Switching Logic
// ======================================================

let currentView = 'scores';

function switchToStandings() {
  console.log('Switching to standings view');
  
  // Hide scores view
  const scoresView = document.getElementById('scores-view');
  const standingsView = document.getElementById('standings-view');
  const standingsBtn = document.getElementById('standings-btn');
  const dateNav = document.getElementById('date-navigation');
  
  if (scoresView) scoresView.classList.add('hidden');
  if (standingsView) {
    standingsView.classList.remove('hidden');
    standingsView.classList.add('active');
  }
  if (standingsBtn) standingsBtn.classList.add('active');
  if (dateNav) dateNav.style.display = 'none';
  
  // Pause score updates to save resources
  if (scoreUpdateInterval) {
    clearInterval(scoreUpdateInterval);
    scoreUpdateInterval = null;
  }
  
  currentView = 'standings';
  
  // Load standings data
  if (window.loadStandings) {
    window.loadStandings();
  }
}

function switchToScores() {
  console.log('Switching to scores view');
  
  // Hide all views
  const allViews = document.querySelectorAll('.view');
  allViews.forEach(view => {
    view.classList.remove('active');
    view.classList.add('hidden');
  });
  
  // Show scores view
  const scoresView = document.getElementById('scores-view');
  const dateNav = document.getElementById('date-navigation');
  const standingsBtn = document.getElementById('standings-btn');
  
  if (scoresView) {
    scoresView.classList.remove('hidden');
    scoresView.classList.add('active');
  }
  
  if (standingsBtn) {
    standingsBtn.classList.remove('active');
  }
  
  if (dateNav) dateNav.style.display = 'flex';
  
  // Resume score updates
  if (!scoreUpdateInterval) {
    // Restart the score fetching
    fetchScoresData();
    scoreUpdateInterval = setInterval(fetchScoresData, 1000);
  }
  
  currentView = 'scores';
}

// Initialize navigation event listeners
document.addEventListener('DOMContentLoaded', () => {
    const standingsBtn = document.getElementById('standings-btn');
    const backToScoresBtn = document.getElementById('back-to-scores');
    const refreshStandingsBtn = document.getElementById('refresh-standings');
    
    if (standingsBtn) {
      standingsBtn.addEventListener('click', switchToStandings);
    }
    
    if (backToScoresBtn) {
      backToScoresBtn.addEventListener('click', switchToScores);
    }
    
    if (refreshStandingsBtn) {
      refreshStandingsBtn.addEventListener('click', () => {
        if (window.loadStandings) {
          window.loadStandings(true); // Force refresh
        }
      });
    }
});
