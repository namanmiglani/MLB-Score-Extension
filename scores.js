const date = new Date();

const apiURL = 'http://statsapi.mlb.com/api/v1/schedule/games/?sportId=1&date=';
const template = 'http://statsapi.mlb.com'
let teamLink;
let gamesURL;
let scoreData;
let teamNameData;
let currentDate;
const body = document.querySelector('body');


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

const fetchScoresData = (filterParams) => {
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

fetchScoresData();


