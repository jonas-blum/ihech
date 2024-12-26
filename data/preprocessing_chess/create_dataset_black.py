import pandas as pd
import json

# read in the games_with_openings.csv as a pandas dataframe
games_with_openings = pd.read_csv('games_with_openings.csv')

# combine the unique opening family, variation, and subvariation into a single column of the following format: 'family: variation, subvariation'
games_with_openings['opening'] = games_with_openings['opening_family'] + ':' + games_with_openings['opening_variation'] + ',' + games_with_openings['opening_subvariation']
print(games_with_openings['opening'].head())

# all unique combinations of opening family, variation, and subvariation
unique_openings = games_with_openings[['opening_eco_book', 'opening_family', 'opening_variation', 'opening_subvariation', 'opening']].drop_duplicates()
print(f'There are {len(unique_openings)} unique openings.')
print(unique_openings.head())

MINIMUM_GAMES_REQUIRED = 100

# get all unique players black
unique_black_players = games_with_openings['black'].unique()
print(f'There are {len(unique_black_players)} players that have played both as black')

# for each individual player, get the number of games played as black
games_as_black = games_with_openings['black'].value_counts()

# filter out players that have played less than MINIMUM_GAMES_REQUIRED games
games_as_black = games_as_black[games_as_black >= MINIMUM_GAMES_REQUIRED]

# sort by the number of games played as black
games_as_black = games_as_black.sort_values(ascending=False)
print(games_as_black.describe())

########################################################################################

item_metadata_columns = ['Name'] # we currently have no semantic metadata; could be a problem for the frontend
column_metadata_rows = ['ECO Category', 'Opening Family', 'Opening Variation']

# build the first row
first_row = item_metadata_columns + [' '] + unique_openings['opening'].tolist()

# build the remaining metadata rows
metadata_rows = []
row = ['ECO Category'] + ['unknown']*(len(item_metadata_columns)-1) + [''] + unique_openings['opening_eco_book'].tolist()
metadata_rows.append(row)
row = ['Opening Family'] + ['unknown']*(len(item_metadata_columns)-1) + [''] + unique_openings['opening_family'].tolist()
metadata_rows.append(row)
row = ['Opening Variation'] + ['unknown']*(len(item_metadata_columns)-1) + [''] + unique_openings['opening_variation'].tolist()
metadata_rows.append(row)

# add an empty row
empty_row = ['']*(len(item_metadata_columns)+1+len(unique_openings))

# prepare the data rows
data_rows = []
openings_dict = {opening: idx for idx, opening in enumerate(unique_openings['opening'])}

# create a dictionary to store the number of games played by each player for each opening
player_opening_games = {player: [0] * len(unique_openings) for player in games_as_black.index}

# iterate over the games and populate the dictionary
for _, game in games_with_openings.iterrows():
    if game['white'] in player_opening_games:
        player_opening_games[game['white']][openings_dict[game['opening']]] += 1
    if game['black'] in player_opening_games:
        player_opening_games[game['black']][openings_dict[game['opening']]] += 1

# convert the dictionary to data rows with percentages
for player, games_played in player_opening_games.items():
    total_games = sum(games_played)
    games_played_percentage = [round((count / total_games) * 100, 2) if total_games > 0 else 0 for count in games_played]
    row = [player, ''] + games_played_percentage
    data_rows.append(row)
    
# combine all parts into the final dataframe
dataframe = [first_row] + metadata_rows + [empty_row] + data_rows
df = pd.DataFrame(dataframe, index=None, columns=None)

# save as csv
df.to_csv('Chess-Data-Black.csv', index=False, header=False)

# create as json file
dic = {
    "datasetName": "Chess Dataset Black",
    "descriptionText": "You are exploring the utility of chess openings of chess grandmasters.",
    "itemNameSingular": "player",
    "itemNamePlural": "players",
    "attributeNameSingular": "opening",
    "attributeNamePlural": "openings",
    "cellHoverTextSnippet1": "",
    "cellHoverTextSnippet2": {
        "single": "",
        "plural": ""
    },
    "cellHoverTextSnippet3": {
        "single": "",
        "plural": ""
    },
    "defaultSettings": {
        "clusterItemsByCollections": True,
        "clusterAttributesByCollections": True,
        "itemsClusterSize": 8,
        "attributesClusterSize": -1,
        "dimReductionAlgo": "UMAP",
        "clusterAfterDimRed": False,
        "itemAggregateMethod": "mean",
        "attributeAggregateMethod": "sum",
        "colorMapBreakpoints": {
            "0.01": "#eeeeee",
            "100": "#000000"
        },
        "colorMapZeroColor": "#ffffff",
        "colorMapLogarithmic": True,
        "groupAttributesBy": ["ECO Category", "Opening Family"],
        "groupItemsBy": [],
    },
    "csvFile": df.to_csv(index=False, header=False),
}

with open ("Chess-Data-Black.json", "w") as f:
    f.write(json.dumps(dic, indent=4, ))
    
# also write it to the frontend/public folder
with open ("../../frontend/public/Chess-Data-Black.json", "w") as f:
    f.write(json.dumps(dic, indent=4, ))



