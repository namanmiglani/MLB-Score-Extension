import statsapi
import json

table = {
statsapi.standings(leagueId="103,104", division="all", include_wildcard=True, season=None, standingsTypes=None, date=None)
}

tableList = list(table)
print(type(tableList))


json_object = json.dumps(tableList, indent=6)

with open("standings.json", "w") as outfile:
    outfile.write(json_object)