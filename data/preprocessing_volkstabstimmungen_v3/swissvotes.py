import pandas as pd

# read in csv
df = pd.read_csv('swissvotes_original.csv', sep=";")

all_columns = df.columns
# for column in all_columns:
#     print(column)

# for documentation see: https://swissvotes.ch/storage/df216507ec9e78e6873067211f1456aa8125b82483be85046dab7491736fbe36
# only keep these columns
columns = [
    'anr',  # Abstimmungsnummer
    'datum',  # Datum
    # 'titel_off_d',  # Offizieller Titel der Vorlage
    'titel_kurz_d',  # Kurzversion des offiziellen Titels (deutsch)
    # 'titel_kurz_e',  # Kurzversion des offiziellen Titels (englisch)
    # 'stichwort'  # Umgangssprachlich gängige Bezeichnung der Vorlage oder zusätzliche Inhaltsangabe
    'rechtsform',  # 1=Obligatorisches Referendum, 2=Fakultatives Referendum, 3=Volksinitiative, 4=Direkter Gegenentwurf zu einer Volksinitiative, 5=Stichfrage (seit 1987 bei Gegenüberstellung von Volksinitiativen und Gegenentwürfen)
    'd1e1', # Betroffene Politikbereiche (1. Ebene)
    # 'd1e2', # Betroffene Politikbereiche (2. Ebene)
    # 'd1e3', # Betroffene Politikbereiche (3. Ebene)
    'dep', #  Federführendes Departement
    'br-pos', # Position des Bundesrates
    'bv-pos', # Position des Parlaments
    'nr-pos', # Position des Nationalrats
    'sr-pos', # Position des Ständerats
    # 'urheber', # "Initiant" (nur bei Volksinitiativen und fakultativen Referenden)
]
df = df[columns]


# make sure the 'anr' column is an integer
df['anr'] = df['anr'].astype(int)

# map to human readable values
rechtsform_mapping = {
    1: 'Obligatorisches Referendum',
    2: 'Fakultatives Referendum',
    3: 'Volksinitiative',
    4: 'Direkter Gegenentwurf',
    5: 'Stichfrage'
}
df['rechtsform'] = df['rechtsform'].map(rechtsform_mapping)

# Politikbereich mapping (1. Ebene)
d1e1_mapping = {
    1: 'Staatsordnung',
    2: 'Aussenpolitik',
    3: 'Sicherheitspolitik',
    4: 'Wirtschaft',
    5: 'Landwirtschaft',
    6: 'Öffentliche Finanzen',
    7: 'Energie',
    8: 'Verkehr und Infrastruktur',
    9: 'Umwelt und Lebensraum',
    10: 'Sozialpolitik',
    11: 'Bildung und Forschung',
    12: 'Kultur, Religion, Medien',
}    
df['d1e1'] = df['d1e1'].map(d1e1_mapping)

# Departement mapping
dep_mapping = {
    '1': 'EDA',
    '2': 'EDI',
    '3': 'EJPD',
    '4': 'VBS',
    '5': 'EFD',
    '6': 'WBF',
    '7': 'UVEK',
    '8': 'BK',
}
df['dep'] = df['dep'].map(dep_mapping)

# Position mapping
position_mapping = {
    '1': 'Befürwortend',
    '2': 'Ablehnend',
    '3': 'Keine',
    '8': 'Vorzug für Gegenentwurf',
    '9': 'Vorzug für Initiative',
    '.': 'N/A',
    1: 'Befürwortend',
    2: 'Ablehnend',
    3: 'Keine',
    8: 'Vorzug für Gegenentwurf',
    9: 'Vorzug für Initiative',
    '.': 'N/A'
}
df['br-pos'] = df['br-pos'].map(position_mapping)
df['bv-pos'] = df['bv-pos'].map(position_mapping)
df['nr-pos'] = df['nr-pos'].map(position_mapping)
df['sr-pos'] = df['sr-pos'].map(position_mapping)

# change date format from 'dd.mm.yyyy' to 'yyyy-mm-dd'
df['datum'] = pd.to_datetime(df['datum'], format='%d.%m.%Y').dt.strftime('%Y-%m-%d')

# rename columns
df = df.rename(columns={
    'datum': 'Datum',
    'titel_kurz_d': 'Kurztitel',
    'rechtsform': 'Rechtsform',
    'anr': 'vorlage_id',
    'd1e1': 'Politikbereich',
    'dep': 'Departement',
    'br-pos': 'Bundesrat',
    'bv-pos': 'Parlament',
    'nr-pos': 'Nationalrat',
    'sr-pos': 'Ständerat',
})

# save new csv
df.to_csv('swissvotes.csv', index=False)