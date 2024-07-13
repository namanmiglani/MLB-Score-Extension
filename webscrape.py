import requests
import json
from datetime import datetime
import time


todayDate = datetime.today().strftime('%Y-%m-%d')
url = "https://statsapi.mlb.com/api/v1/schedule?sportId=1&sportId=51&sportId=21&startDate="+todayDate+"&endDate="+todayDate+"&timeZone=America/New_York&gameType=E&&gameType=S&&gameType=R&&gameType=F&&gameType=D&&gameType=L&&gameType=W&&gameType=A&&gameType=C&language=en&leagueId=104&&leagueId=103&&leagueId=160&&leagueId=590&hydrate=team,linescore(matchup,runners),xrefId,story,flags,statusFlags,broadcasts(all),venue(location),decisions,person,probablePitcher,stats,game(content(media(epg),summary),tickets),seriesStatus(useOverride=true)&sortBy=gameDate,gameStatus,gameType"

payload = {}
headers = {
  'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
  'Referer': 'https://www.mlb.com/',
  'sec-ch-ua-mobile': '?0',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'sec-ch-ua-platform': '"Windows"'
}

while True:
    r = requests.get(url, headers=headers)

    #print(r.text)

    sd = r.json()



    with open("scores.json", "w") as file:
        json.dump(sd, file)
    
    time.sleep(5)



""" r = requests.get(url, headers=headers)
#print(r.text)
sd = r.json()
with open("scores.json", "w") as file:
    json.dump(sd, file) """