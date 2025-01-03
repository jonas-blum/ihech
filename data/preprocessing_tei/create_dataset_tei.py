import pandas as pd
import re
import json

# read in csv files
tags = pd.read_csv('tags.csv', header=0)
documents = pd.read_csv('documents.csv', header=0)

# NOTE: see this github issue for data structure explanation: https://github.com/jonas-blum/ihech/issues/17
# the metadata columns that can be used to semantically aggregate items
item_metadata_columns = ['Name', 'Edition']

# the metadata columns that can be used to semantically aggregate columns
column_metadata_rows = ['Module']

# build the first row
first_row = item_metadata_columns + [''] + tags['tag'].tolist()

# build the remaining metadata rows
metadata_rows = []
row = ['Module'] + ['unknown']*(len(item_metadata_columns)-1) + [''] + tags['module'].tolist()
metadata_rows.append(row)
# NOTE: here I could add more metadata rows if needed

# add an empty row
empty_row = ['']*(len(item_metadata_columns)+1+len(tags))

# prepare the data rows
data_rows = []

for index, document in documents.iterrows():
    row = [document['name'], document['edition'], '']
    
    tag_string = document['attributes']
    for tag_index, tag in tags.iterrows():
        value = len(re.findall(f'<{tag["tag"]}>', tag_string))
        # print(f'Document: {document["name"]}, Tag: {tag["tag"]}, Value: {value}')
        row.append(value)

    data_rows.append(row)

# combine all parts into the final dataframe
dataframe = [first_row] + metadata_rows + [empty_row] + data_rows
df = pd.DataFrame(dataframe, index=None, columns=None)
# save as csv
df.to_csv('TEI-Data.csv', index=False, header=False)

# create as json file
dic = {
    "datasetName": "TEI Dataset",
    "descriptionText": "You are exploring the usage of TEI tags across documents.",
    "itemNameSingular": "document",
    "itemNamePlural": "documents",
    "attributeNameSingular": "tag",
    "attributeNamePlural": "tags",
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
        "itemsClusterSize": 5,
        "attributesClusterSize": -1,
        "dimReductionAlgo": "UMAP",
        "clusterAfterDimRed": False,
        "itemAggregateMethod": "binary",
        "attributeAggregateMethod": "binary", 
        "colorMapBreakpoints": {
            "1": "#eeeeee",
            "100": "#000000"
        },
        "colorMapZeroColor": "#ffffff",
        "colorMapLogarithmic": True,
        "groupAttributesBy": ["Module"],
        "groupItemsBy": ["Edition"],
    },
    "csvFile": df.to_csv(index=False, header=False),
}

with open ("TEI-Data.json", "w") as f:
    f.write(json.dumps(dic, indent=4, ))
    
# also write it to the frontend/public folder
with open ("../../frontend/public/TEI-Data.json", "w") as f:
    f.write(json.dumps(dic, indent=4, ))
