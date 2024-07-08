const date = new Date();

const apiURL = 'http://statsapi.mlb.com/api/v1/schedule/games/?sportId=1&date=';
const template = 'http://statsapi.mlb.com'
let teamLink;
let gamesURL;
let scoreData;
let teamNameData;
let currentDate;
const body = document.querySelector('body');

function monthConversion(n) {
    switch (n) {
       case '01':
         return "JAN";
         break;
       case '02':
         return "FEB";
         break;
       case '03':
         return "MAR";
         break;
       case '04':
         return "APR";
         break;
       case '05':
         return "MAY";
         break;
       case '06':
         return "JUN";
         break;
       case '07':
         return "JUL";
       case '08':
         return "AUG";
         break;
       case '09':
         return "SEP";
         break;
       case '10':
         return "OCT";
         break;
       case '11':
         return "NOV";
         break;
       case '12':
         return "DEC";
         break;
    }
}

function dateDaysBefore(days) {
    var d = new Date();
    d.setDate(d.getDate() - days);
    let fullForm = d.toISOString().substring(5,10);

    return monthConversion(fullForm.substring(0,2)) + " " + fullForm.substring(3,5)
}

function dateDaysBeforeLink(days) {
    var d = new Date();
    d.setDate(d.getDate() - days);

    gamesURL = `${apiURL}${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`
}

function headerDaysBeforeAfter() {
    const header = document.querySelector('header')
    
    let twoDayAgo = dateDaysBefore(2)
    let twoDayAgoDiv = document.createElement('div')
    twoDayAgoDiv.textContent=twoDayAgo;
    twoDayAgoDiv.addEventListener('click', function(){
    dateDaysBeforeLink(2)
    console.log('clickes')
    console.log(gamesURL)
    });
    header.appendChild(twoDayAgoDiv)

    let oneDayAgo = dateDaysBefore(1)
    let oneDayAgoDiv = document.createElement('div')
    oneDayAgoDiv.textContent=oneDayAgo;
    header.appendChild(oneDayAgoDiv)


    let today = dateDaysBefore(0)
    let todayDiv = document.createElement('div')
    todayDiv.textContent=today;
    header.appendChild(todayDiv)

    let oneDayAhead = dateDaysBefore(-1)
    let oneDayAheadDiv = document.createElement('div')
    oneDayAheadDiv.textContent=oneDayAhead;
    header.appendChild(oneDayAheadDiv)

    let twoDaysAhead = dateDaysBefore(-2)
    let twoDaysAheadDiv = document.createElement('div')
    twoDaysAheadDiv.textContent=twoDaysAhead;
    header.appendChild(twoDaysAheadDiv)
}

headerDaysBeforeAfter()


function getDate() {
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();

 
    currentDate = year + ('0' + day).slice(-2)
             + ('0' + month).slice(-2) 
    //`${month}${day}${year}`;
    
    gamesURL = `${apiURL}${month}/${day}/${year}`

    
}

getDate();


function boxScore(home, away){
    return "https://www.cbssports.com/mlb/gametracker/boxscore/MLB_"+ currentDate +"_" + away + "@" + home + "/";
}



const populateScoreboard = (game, body) => {

    
    const gameBox  = document.createElement('div');
    gameBox.classList = 'score-box grid-item';
    gameBox.innerHTML = ` 
    
    <a href= ${boxScore(teamAbbreviation(((((game['teams'])['home'])['team'])['name'])), teamAbbreviation(((((game['teams'])['away'])['team'])['name'])))} target="_blank">
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

    //((((game['teams'])['home'])['team'])['name'])


//console.log(teamNameData)




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

fetchScoresData();


