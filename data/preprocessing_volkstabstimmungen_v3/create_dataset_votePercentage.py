import pandas as pd
import json

# read in csv files
swissvotes = pd.read_csv('swissvotes.csv')
sprachgebiete = pd.read_csv('sprachgebiete.csv')
voting_results = pd.read_csv('voting_results.csv')

# the metadata columns that can be used to semantically aggregate items
item_metadata_columns = ['Gemeinde', 'Sprachgebiet', 'Kanton', 'Bezirk']

# the metadata columns that can be used to semantically aggregate columns
column_metadata_rows = ['Rechtsform', 'Bereich (1. Level)', 'Bereich (2. Level)', 'Bereich (3. Level)', 'Departement', 'Bundesrat', 'Parlament', 'Nationalrat', 'Ständerat']

# NOTE: see this github issue for data structure explanation: https://github.com/jonas-blum/ihech/issues/17

# build the first row
first_row = item_metadata_columns + [''] + swissvotes['Kurztitel'].tolist()

# build the remaining metadata rows
metadata_rows = []
for column_metadata_row in column_metadata_rows:
    row = [column_metadata_row] + ['unknown']*(len(item_metadata_columns)-1) + [''] 
    row.extend(swissvotes[column_metadata_row].tolist())
    metadata_rows.append(row)

# add an empty row
empty_row = ['']*(len(item_metadata_columns)+1+len(swissvotes))

# Merge voting_results with sprachgebiete to get the Sprachgebiet
voting_results = voting_results.merge(sprachgebiete[['GEO_ID', 'DESC_VAL']], left_on='gemeinde_geoId', right_on='GEO_ID', how='left')

# Create a pivot table for faster lookups
pivot_table = voting_results.pivot_table(index='gemeinde_geoId', columns='vorlage_id', values='gemeinde_votePercentage', aggfunc='first')

# Prepare the data rows
data_rows = []
for i, gemeinde in sprachgebiete.iterrows():
    geo_id = gemeinde['GEO_ID']
    gemeinde_name = gemeinde['GEO_NAME']
    sprachgebiet = gemeinde['DESC_VAL']
    
    # find one matching gemeinde in voting_results to retrieve the remaining item metadata
    voting_result = voting_results[voting_results['gemeinde_geoId'] == geo_id]
    if voting_result.empty:
        continue
    voting_result = voting_result.iloc[0]

    row = [voting_result['gemeinde_name'], sprachgebiet, voting_result['kanton_name'], voting_result['bezirk_name'], '']
    
    # to fill the data matrix we need to loop over all votings
    yes_percentages = pivot_table.loc[geo_id].reindex(swissvotes['vorlage_id']).fillna('')
    
    row.extend(yes_percentages.tolist())
    
    data_rows.append(row)
    # if i == 3:
    #     break

# Print the length of all parts
# print(len(first_row))
# print(len(metadata_rows[0]))
# print(len(empty_row))
# print(len(data_rows[0]))



# Combine all parts into the final dataframe
dataframe = [first_row] + metadata_rows + [empty_row] + data_rows
df = pd.DataFrame(dataframe, index=None, columns=None)

# get the indexes of all columns that contain only empty strings
raw_data_df = df.iloc[len(column_metadata_rows)+1:, len(item_metadata_columns)+1:]
empty_columns = raw_data_df.columns[(raw_data_df == '').all()]
# drop all these columns (in the original dataframe and in the raw_data_df)
df = df.drop(columns=empty_columns) # NOTE: doing this is very important, otherwise we have columns without any value --> backend crashes
raw_data_df = raw_data_df.drop(columns=empty_columns)


# save as csv
df.to_csv('Voting-Data-NEW.csv', index=False, header=False)


# find min and max values
# min_value = raw_data_df.min().min()
# max_value = raw_data_df.max().max()

# create as json file
dic = {
    "datasetName": "Voting Data From Switzerland",
    "descriptionText": "You are exploring the voting results of 'popular votes' (Volksabstimmungen) of Switzerland.",
    "itemNameSingular": "municipality",
    "itemNamePlural": "municipalities",
    "attributeNameSingular": "vote",
    "attributeNamePlural": "votes",
    "cellHoverTextSnippet1": "Municipalities of",
    "cellHoverTextSnippet2": {
        "single": "participated in",
        "plural": "participated on average in"
    },
    "cellHoverTextSnippet3": {
        "single": "% of votes",
        "plural": "% of votes on this group of"
    },
    "defaultSettings": {
        "clusterItemsByCollections": True,
        "clusterAttributesByCollections": True,
        "itemsClusterSize": 6,
        "attributesClusterSize": -1,
        "dimReductionAlgo": "PCA",
        "clusterAfterDimRed": False,
        "itemAggregateMethod": "mean",
        "attributeAggregateMethod": "mean",
        "colorMapBreakpoints": {
            "25": "#eeeeee",
            "75": "#000000"
        },
        "colorMapZeroColor": "#ff0000",
        "colorMapLogarithmic": False,
        "groupAttributesBy": ["Bereich (1. Level)", "Bereich (2. Level)", "Bereich (3. Level)"],
        "groupItemsBy": ["Sprachgebiet", "Kanton"],
    },
    "csvFile": df.to_csv(index=False, header=False),
}

with open ("Voting-Data-NEW.json", "w") as f:
    f.write(json.dumps(dic, indent=4, ))
    
# also write it to the frontend/public folder
with open ("../../frontend/public/Voting-Data-NEW.json", "w") as f:
    f.write(json.dumps(dic, indent=4, ))




