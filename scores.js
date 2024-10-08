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

function timeConversion(hour) {
  if (0 <= hour && hour <= 4) {
    return (hour + 8);
  } else if (5 <= hour && hour <= 16) {
    return (hour - 4);
  } else if (17 <= hour && hour <= 23) {
    return (hour - 16);
  }
}

function dayTime(hour) {
  if (4 <= hour && hour <= 15) {
    return "am";
  } else {
    return "pm";
  }
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
    const header = document.querySelector('header')
    
    let twoDayAgo = dateDaysBefore(2)
    let twoDayAgoDiv = document.createElement('button')
    twoDayAgoDiv.classList = "days"
    twoDayAgoDiv.textContent=twoDayAgo;
    twoDayAgoDiv.addEventListener('click', function(){
    dateDaysBeforeLink(2)
    });
    header.appendChild(twoDayAgoDiv)

    let oneDayAgo = dateDaysBefore(1)
    let oneDayAgoDiv = document.createElement('button')
    oneDayAgoDiv.classList = "days"
    oneDayAgoDiv.textContent=oneDayAgo;
    oneDayAgoDiv.addEventListener('click', function(){
    dateDaysBeforeLink(1)
    });
    header.appendChild(oneDayAgoDiv)


    let today = dateDaysBefore(0)
    let todayDiv = document.createElement('button')
    todayDiv.classList = "days"
    todayDiv.textContent=today;
    todayDiv.addEventListener('click', function(){
    dateDaysBeforeLink(0)
    });
    header.appendChild(todayDiv)

    let oneDayAhead = dateDaysBefore(-1)
    let oneDayAheadDiv = document.createElement('button')
    oneDayAheadDiv.classList = "days"
    oneDayAheadDiv.textContent=oneDayAhead;
    oneDayAheadDiv.addEventListener('click', function(){
    dateDaysBeforeLink(-1)
    });
    header.appendChild(oneDayAheadDiv)

    let twoDaysAhead = dateDaysBefore(-2)
    let twoDaysAheadDiv = document.createElement('button')
    twoDaysAheadDiv.classList = "days"
    twoDaysAheadDiv.textContent=twoDaysAhead;
    twoDaysAheadDiv.addEventListener('click', function(){
    dateDaysBeforeLink(-2)
    });
    header.appendChild(twoDaysAheadDiv)
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
    //console.log(game)
    myMap.set((game['gameGuid']), ((game['linescore'])['inningHalf']) + " " + ((game['linescore'])['currentInningOrdinal']))
  });
}


const populateScoreboard = (game, body) => {
  //console.log(game)
  //console.log(game)
  //${((game['status'])['detailedState'])}
    if ((((game['status'])['detailedState']) === "In Progress")){
      const gameBox  = document.createElement('div');
      gameBox.classList = 'score-box grid-item';
      gameBox.innerHTML = ` 
      
      <a href= ${boxScore(teamAbbreviation(((((game['teams'])['home'])['team'])['name'])), teamAbbreviation(((((game['teams'])['away'])['team'])['name'])))} target="_blank">
      <p class="status">
      ${myMap.get((game['gameGuid']))}
      <p>
      <div class="with-image">
      <img src=${teamLogo(((((game['teams'])['home'])['team'])['name']))} height="20px" width="20px">
      <div>${teamAbbreviation(((((game['teams'])['home'])['team'])['name']))} : ${(((game['teams'])['home'])['score'])} </div>
      </div>
      <div class="with-image">
      <img src=${teamLogo(((((game['teams'])['away'])['team'])['name']))} height="20px" width="20px">
      <div>${teamAbbreviation(((((game['teams'])['away'])['team'])['name']))} : ${(((game['teams'])['away'])['score'])}</div>
      </div>
      </a>
      `;
      document.getElementById('grid-container').appendChild(gameBox);
    } else if ((((game['status'])['abstractGameState']) === "Final") || (((game['status'])['detailedState']) === "Final")){
      const gameBox  = document.createElement('div');
      gameBox.classList = 'score-box grid-item';
      gameBox.innerHTML = ` 
      
      <a href= ${boxScore(teamAbbreviation(((((game['teams'])['home'])['team'])['name'])), teamAbbreviation(((((game['teams'])['away'])['team'])['name'])))} target="_blank">
      <p class="status">Final<p>
      <div class="with-image">
      <img src=${teamLogo(((((game['teams'])['home'])['team'])['name']))} height="20px" width="20px">
      <div>${teamAbbreviation(((((game['teams'])['home'])['team'])['name']))} : ${(((game['teams'])['home'])['score'])} </div>
      </div>
      <div class="with-image">
      <img src=${teamLogo(((((game['teams'])['away'])['team'])['name']))} height="20px" width="20px">
      <div>${teamAbbreviation(((((game['teams'])['away'])['team'])['name']))} : ${(((game['teams'])['away'])['score'])}</div>
      </div>
      </a>
      `;
      document.getElementById('grid-container').appendChild(gameBox);
    } else {
      const gameBox  = document.createElement('div');
      gameBox.classList = 'score-box grid-item';
      gameBox.innerHTML = ` 
      
      <a href= ${boxScore(teamAbbreviation(((((game['teams'])['home'])['team'])['name'])), teamAbbreviation(((((game['teams'])['away'])['team'])['name'])))} target="_blank">
      <p class="status">${String(timeConversion(Number((game['gameDate']).substring(11,13)))) + (game['gameDate']).substring(13,16) + " " + dayTime(Number((game['gameDate']).substring(11,13)))}<p>
      <div class="with-image">
      <img src=${teamLogo(((((game['teams'])['home'])['team'])['name']))} height="20px" width="20px">
      <div>${teamAbbreviation(((((game['teams'])['home'])['team'])['name']))}</div>
      </div>
      <div class="with-image">
      <img src=${teamLogo(((((game['teams'])['away'])['team'])['name']))} height="20px" width="20px">
      <div>${teamAbbreviation(((((game['teams'])['away'])['team'])['name']))}</div>
      </div>
      </a>
      `;
      document.getElementById('grid-container').appendChild(gameBox);   
    }
    //((game['status'])['detailedState'])
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

const fetchScoresData = setInterval( 
    (filterParams) => {
        fetch(gamesURL)
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
, 1000);

fetchScoresData;


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

function fetchInningsData() { //setInterval( 
    fetch(inningLinkGen(), requestOptions)
    .then((response) => response.json())
    .then((result) => updateInning(result))
    .catch((error) => console.error(error));
}
//, 1000);
fetchInningsData();

const intervalID = setInterval(fetchInningsData, 1000000)

const switchScreen = setInterval(load, 1200)

