import pandas as pd
import json

# read in the games_with_openings.csv as a pandas dataframe
games_with_openings = pd.read_csv('games_with_openings.csv')

# read in the players_gpt_enriched.csv as a pandas dataframe
players_df = pd.read_csv('players_gpt_enriched.csv')

# filter players for which the 'nationality' or 'birthyear' is not available
players_df = players_df[players_df['nationality'].notnull() & players_df['birthyear'].notnull()]
print(f'There are {len(players_df)} players with a nationality and birthyear.')


# combine the unique opening family, variation, and subvariation into a single column of the following format: 'family: variation, subvariation'
games_with_openings['opening'] = games_with_openings['opening_family'] + ':' + games_with_openings['opening_variation'] + ',' + games_with_openings['opening_subvariation']
print(games_with_openings['opening'].head())

# all unique combinations of opening family, variation, and subvariation
unique_openings = games_with_openings[['opening_eco_book', 'opening_family', 'opening_variation', 'opening_subvariation', 'opening']].drop_duplicates()
print(f'There are {len(unique_openings)} unique openings.')
print(unique_openings.head())

########################################################################################

item_metadata_columns = ['Name', 'Nationality', 'Birthyear']
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

# create a dictionary to store the number of games played for each player in players_df
player_opening_games = {player: [0] * len(unique_openings) for player in players_df.player}

# iterate over the games and populate the dictionary
for _, game in games_with_openings.iterrows():
    white_player = game['white']
    black_player = game['black']
    opening = game['opening']
    if white_player in player_opening_games:
        player_opening_games[white_player][openings_dict[opening]] += 1
    if black_player in player_opening_games:
        player_opening_games[black_player][openings_dict[opening]] += 1

# convert the dictionary to data rows with percentages
for _, player_row in players_df.iterrows():
    player = player_row['player']
    games_played = player_opening_games[player]
    total_games = sum(games_played)
    games_played_percentage = [round((count / total_games) * 100, 2) if total_games > 0 else 0 for count in games_played]
    row = [player, player_row['nationality'], player_row['birthyear'], ''] + games_played_percentage
    data_rows.append(row)
    
# combine all parts into the final dataframe
dataframe = [first_row] + metadata_rows + [empty_row] + data_rows
df = pd.DataFrame(dataframe, index=None, columns=None)

# save as csv
df.to_csv('Chess-Data.csv', index=False, header=False)

# create as json file
dic = {
    "datasetName": "Chess Dataset",
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

with open ("Chess-Data.json", "w") as f:
    f.write(json.dumps(dic, indent=4, ))
    
# also write it to the frontend/public folder
with open ("../../frontend/public/Chess-Data.json", "w") as f:
    f.write(json.dumps(dic, indent=4, ))



