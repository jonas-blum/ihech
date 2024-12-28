# Voting Dataset Preparation

## Dataset of all Gemeinden and their Sprachgebiet

1. Download csv file from [atlas.bfs.admin.ch](https://www.atlas.bfs.admin.ch/maps/13/de/17138_17137_235_227/26599.html) and save it as `sprachgebiete_original.csv`
2. Run script `sprachgebiete.py` --> will produce `sprachgebiete.csv`

| GEO_ID | GEO_NAME          | DESC_VAL               |
|--------|-------------------|------------------------|
| 1      | Aeugst am Albis   | Deutsches Sprachgebiet |
| 2      | Affoltern am Albis| Deutsches Sprachgebiet |
| 3      | Bonstetten        | Deutsches Sprachgebiet |
| 4      | Hausen am Albis   | Deutsches Sprachgebiet |
| 5      | Hedingen          | Deutsches Sprachgebiet |


## Dataset of all Voting results since 1980 on Kanton, Bezirk, and Gemeinde Level

1. Download the metadata file from [opendata.swiss](https://opendata.swiss/de/dataset/echtzeitdaten-am-abstimmungstag-zu-eidgenoessischen-abstimmungsvorlagen) ("Metadatenzugriff" -> "API (JSON)") and save it as `voting_results_metadata.json`
2. Run `fetch_voting_results.py` to download the json files for the individual votes (may take a while..)
3. Run `voting_results.py` --> will produce `voting_results.csv`

| vorlage_id | kanton_name | gemeinde_name     | gemeinde_geoId | gemeinde_yesPercentage |
|---------------|-------------|-------------------|----------------|------------------------|
| 388          | Zürich      | Aeugst am Albis   | 1              | 45.82278481            |
| 388          | Zürich      | Affoltern am Albis| 2              | 42.41821397            |
| 388          | Zürich      | Bonstetten        | 3              | 51.218062983           |
| 388          | Zürich      | Hausen am Albis   | 4              | 44.277673546           |
| 388          | Zürich      | Hedingen          | 5              | 45.313710302           |


## Dataset of all Volksabstimmungen

1. Download csv file from [swissvotes.ch](https://swissvotes.ch/page/dataset) and save it as `swissvotes_original.csv`
2. Run `swissvotes.py` --> will produce `swissvotes.csv`

| vorlage_id | Datum       | Kurztitel                                         | Rechtsform               | Politikbereich | Departement | Bundesrat | Parlament   | Nationalrat | Ständerat   |
|------------|-------------|--------------------------------------------------|--------------------------|----------------|-------------|-----------|-------------|-------------|-------------|
| 193        | 1960-05-29  | Weiterführung befristeter Preiskontrollmassnahmen | Obligatorisches Referendum | Wirtschaft     | WBF         | N/A       | Befürwortend | Befürwortend | Befürwortend |
| 194        | 1960-12-04  | Massnahmen für die Milchwirtschaft                | Fakultatives Referendum   | Landwirtschaft | WBF         | Befürwortend | Befürwortend | Befürwortend | Befürwortend |
| 195        | 1961-03-05  | Artikel betreffend Leitungsanlagen für Treibstoffe| Obligatorisches Referendum | Energie        | UVEK        | N/A       | Befürwortend | Befürwortend | Befürwortend |




## Merge datasets

1. Run the `create_dataset_[votePercentage/yesPercentage].py` script --> will produce the final `Voting-Data.json` file
2. Copy the json file to the `frontend > public` folder to make it available in the tool


- `vorlage_id` can be used as a merge key
- `GEO_ID` of sprachgebiete dataset matches with `gemeinde_geoId` of voting_results.csv