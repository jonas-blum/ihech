import pandas as pd

"""
"GEO_ID";"GEO_NAME";"VARIABLE";VALUE;"UNIT";"STATUS";"STATUS_DESC";"DESC_VAL";"PERIOD_REF";"SOURCE";"LAST_UPDATE";"GEOM_CODE";"GEOM";"GEOM_PERIOD";"MAP_ID";"MAP_URL"
"1";"Aeugst am Albis";"Sprachgebiete";1;"Sprachgebiete";"A";"Normaler Wert";"Deutsches Sprachgebiet";"2020-01-01";"BFS – Raumgliederungen der Schweiz, Strukturerhebung (SE)";"2022-12-20";"polg";"Politische Gemeinden";"2022-05-01";"26599";"https://www.atlas.bfs.admin.ch/maps/13/map/mapIdOnly/26599_de.html"
"""


# read in sprachgebiete_original.csv
df = pd.read_csv('sprachgebiete_original.csv', sep=";")
voting_results = pd.read_csv('voting_results.csv')

# only keep these columns
columns = ['GEO_ID', 'GEO_NAME', 'DESC_VAL']
df = df[columns]

# save as csv
df.to_csv('sprachgebiete.csv', index=False)

    
