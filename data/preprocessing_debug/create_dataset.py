import pandas as pd
import json
import numpy as np

# read in csv files
attributes = ['Att_1', 'Att_2', 'Att_3', 'Att_4']
attributes_metadata = ['group_1', 'group_1', 'group_2', 'group_2']
items = ['Item_1', 'Item_2', 'Item_3', 'Item_4']
items_metadata = ['group_1', 'group_1', 'group_1', 'group_2']

# the metadata columns that can be used to semantically aggregate items
item_metadata_columns = ['Item_name', 'Item_semantic_1']

# the metadata columns that can be used to semantically aggregate columns
column_metadata_rows = ['Att_semantic_1']

# NOTE: see this github issue for data structure explanation: https://github.com/jonas-blum/ihech/issues/17

# build the first row
first_row = item_metadata_columns + [''] + attributes

# build the remaining metadata rows
metadata_rows = []
for column_metadata_row in column_metadata_rows:
    row = [column_metadata_row] + ['unknown']*(len(item_metadata_columns)-1) + [''] 
    row.extend(attributes_metadata)
    metadata_rows.append(row)

# add an empty row
empty_row = ['']*(len(item_metadata_columns)+1+len(attributes))

# Prepare the data rows
data_rows = []
for i in range(len(items)):
    row = [items[i], items_metadata[i], '']

    values = []
    for j in range(len(attributes)):
        values.append(np.random.randint(0, 101))
    row.extend(values)
    
    data_rows.append(row)


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
df.to_csv('DEBUG-Data.csv', index=False, header=False)


# find min and max values
# min_value = raw_data_df.min().min()
# max_value = raw_data_df.max().max()

# create as json file
dic = {
    "datasetName": "DEBUG DATASET",
    "descriptionText": "descriptionText",
    "itemNameSingular": "item",
    "itemNamePlural": "items",
    "attributeNameSingular": "attribute",
    "attributeNamePlural": "attributes",
    "cellHoverTextSnippet1": "Items of",
    "cellHoverTextSnippet2": {
        "single": "have",
        "plural": "have aggregatedly"
    },
    "cellHoverTextSnippet3": {
        "single": "",
        "plural": "in this group of"
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
            "1": "#eeeeee",
            "100": "#000000"
        },
        "colorMapZeroColor": "#ff0000",
        "colorMapLogarithmic": False,
        "groupAttributesBy": [
            "Att_semantic_1"
        ],
        "groupItemsBy": [
            "Item_semantic_1"
        ],
        "scaling": "STANDARDIZING"
    },
    "csvFile": df.to_csv(index=False, header=False),
}

with open ("DEBUG-Data.json", "w") as f:
    f.write(json.dumps(dic, indent=4, ))
    
# also write it to the frontend/public folder
with open ("../../frontend/public/DEBUG-Data.json", "w") as f:
    f.write(json.dumps(dic, indent=4, ))




