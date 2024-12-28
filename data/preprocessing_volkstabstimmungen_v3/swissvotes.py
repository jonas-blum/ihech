import pandas as pd

# read in csv with 'd1e1', 'd1e2', 'd1e3' as string
df = pd.read_csv('swissvotes_original.csv', sep=";", dtype={'d1e1': str, 'd1e2': str, 'd1e3': str})

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
    'd1e2', # Betroffene Politikbereiche (2. Ebene)
    'd1e3', # Betroffene Politikbereiche (3. Ebene)
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

# Politikbereich mapping
politikbereich_mapping = {
    ".": 'Unbekannt',
    "1": 'Staatsordnung',
    "1.1": 'Nationale Identität',
    "1.2": 'Politisches System',
    "1.21": 'Bundesverfassung',
    "1.22": 'Verfassungsgebungsverfahren',
    "1.23": 'Gesetzgebungsverfahren',
    "1.24": 'Wahlsystem',
    "1.3": 'Institutionen',
    "1.31": 'Regierung, Verwaltung',
    "1.32": 'Parlament',
    "1.33": 'Gerichte',
    "1.34": 'Nationalbank',
    "1.4": 'Volksrechte',
    "1.41": 'Initiative',
    "1.42": 'Referendum',
    "1.43": 'Stimmrecht',
    "1.5": 'Föderalismus',
    "1.51": 'Territorialfragen',
    "1.52": 'Beziehungen zwischen Bund und Kantonen',
    "1.53": 'Aufgabenteilung',
    "1.6": 'Rechtsordnung',
    "1.61": 'Internationales Recht',
    "1.62": 'Grundrechte',
    "1.63": 'Bürgerrecht',
    "1.64": 'Privatrecht',
    "1.65": 'Strafrecht',
    "1.66": 'Datenschutz',
    "2": 'Aussenpolitik',
    "2.1": 'Aussenpolitische Grundhaltung',
    "2.11": 'Neutralität',
    "2.12": 'Unabhängigkeit',
    "2.13": 'Gute Dienste',
    "2.2": 'Europapolitik',
    "2.21": 'EFTA',
    "2.22": 'EU',
    "2.23": 'EWR',
    "2.24": 'Andere europäische Organisationen',
    "2.3": 'Internationale Organisationen',
    "2.31": 'UNO',
    "2.32": 'Andere internationale Organisationen',
    "2.4": 'Entwicklungszusammenarbeit',
    "2.5": 'Staatsverträge mit einzelnen Staaten',
    "2.6": 'Aussenwirtschaftspolitik',
    "2.61": 'Exportförderung',
    "2.62": 'Zollwesen',
    "2.7": 'Diplomatie',
    "2.8": 'Auslandschweizer:innen',
    "3": 'Sicherheitspolitik',
    "3.1": 'Öffentliche Sicherheit',
    "3.11": 'Bevölkerungsschutz',
    "3.12": 'Staatsschutz',
    "3.13": 'Polizei',
    "3.2": 'Armee',
    "3.21": 'Armee (allgemein)',
    "3.22": 'Militärorganisation',
    "3.23": 'Rüstung',
    "3.24": 'Militäranlagen',
    "3.25": 'Dienstverweigerung, Zivildienst',
    "3.26": 'Armeeabschaffung',
    "3.27": 'Militärische Ausbildung',
    "3.28": 'Internationale Einsätze',
    "3.3": 'Landesversorgung',
    "4": 'Wirtschaft',
    "4.1": 'Wirtschaftspolitik',
    "4.11": 'Konjunkturpolitik',
    "4.12": 'Wettbewerbspolitik',
    "4.13": 'Strukturpolitik',
    "4.14": 'Preispolitik',
    "4.15": 'Konsumentenschutz',
    "4.16": 'Gesellschaftsrecht',
    "4.2": 'Arbeit und Beschäftigung',
    "4.21": 'Arbeitsbedingungen',
    "4.22": 'Arbeitszeit',
    "4.23": 'Sozialpartnerschaft',
    "4.24": 'Beschäftigungspolitik',
    "4.3": 'Finanzwesen',
    "4.31": 'Geld- und Währungspolitik',
    "4.32": 'Banken, Börsen, Versicherungen',
    "4.4": 'Freizeit und Tourismus',
    "4.41": 'Fremdenverkehr',
    "4.42": 'Hotellerie und Gastgewerbe',
    "4.43": 'Geldspiele',
    "5": 'Landwirtschaft',
    "5.1": 'Agrarpolitik',
    "5.2": 'Tierische Produktion',
    "5.3": 'Pflanzliche Produktion',
    "5.4": 'Forstwirtschaft',
    "5.5": 'Fischerei, Jagd, Haustiere',
    "6": 'Öffentliche Finanzen',
    "6.1": 'Steuerwesen',
    "6.11": 'Steuerpolitik',
    "6.12": 'Steuersystem',
    "6.13": 'Direkte Steuern',
    "6.14": 'Indirekte Steuern',
    "6.2": 'Finanzordnung',
    "6.3": 'Öffentliche Ausgaben',
    "6.4": 'Spar- und Sanierungsmassnahmen',
    "7": 'Energie',
    "7.1": 'Energiepolitik',
    "7.2": 'Kernenergie',
    "7.3": 'Wasserkraft',
    "7.4": 'Alternativenergien',
    "7.5": 'Erdöl, Gas',
    "8": 'Verkehr und Infrastruktur',
    "8.1": 'Verkehrspolitik',
    "8.11": 'Agglomerationsverkehr',
    "8.12": 'Transitverkehr',
    "8.2": 'Strassenverkehr',
    "8.21": 'Strassenbau',
    "8.22": 'Schwerverkehr',
    "8.3": 'Schienenverkehr',
    "8.31": 'Güterverkehr',
    "8.32": 'Personenverkehr',
    "8.4": 'Luftverkehr',
    "8.5": 'Schifffahrt',
    "8.6": 'Post',
    "8.7": 'Telekommunikation',
    "9": 'Umwelt und Lebensraum',
    "9.1": 'Boden',
    "9.11": 'Raumplanung',
    "9.12": 'Bodenrecht',
    "9.2": 'Wohnen',
    "9.21": 'Mietwesen',
    "9.22": 'Wohnungsbau, Wohneigentum',
    "9.3": 'Umwelt',
    "9.31": 'Umweltpolitik',
    "9.32": 'Lärmschutz',
    "9.33": 'Luftreinhaltung',
    "9.34": 'Gewässerschutz',
    "9.35": 'Bodenschutz',
    "9.36": 'Abfälle',
    "9.37": 'Natur- und Heimatschutz',
    "9.38": 'Tierschutz',
    "10": 'Sozialpolitik',
    "10.1": 'Gesundheit',
    "10.11": 'Gesundheitspolitik',
    "10.12": 'Medizinforschung und –technik',
    "10.13": 'Medikamente',
    "10.14": 'Suchtmittel',
    "10.15": 'Fortpflanzungsmedizin',
    "10.2": 'Sozialversicherungen',
    "10.21": 'Alters- und Hinterbliebenenversicherung',
    "10.22": 'Invalidenversicherung',
    "10.23": 'Berufliche Vorsorge',
    "10.24": 'Kranken- und Unfallversicherung',
    "10.25": 'Mutterschaftsversicherung',
    "10.26": 'Arbeitslosenversicherung',
    "10.27": 'Erwerbsersatzordnung',
    "10.28": 'Fürsorge',
    "10.3": 'Soziale Gruppen',
    "10.31": 'Ausländer:innen',
    "10.32": 'Flüchtlinge',
    "10.33": 'Stellung der Frau',
    "10.34": 'Familienpolitik',
    "10.35": 'Kinder und Jugendliche',
    "10.36": 'Senior:innen',
    "10.37": 'Behinderte',
    "10.38": 'Homosexuelle',
    "11": 'Bildung und Forschung',
    "11.1": 'Bildungspolitik',
    "11.2": 'Schulen',
    "11.3": 'Hochschulen',
    "11.4": 'Forschung',
    "11.41": 'Gentechnologie',
    "11.42": 'Tierversuche',
    "11.5": 'Berufsbildung',
    "12": 'Kultur, Religion, Medien',
    "12.1": 'Kulturpolitik',
    "12.2": 'Sprachpolitik',
    "12.3": 'Religion, Kirchen',
    "12.4": 'Sport',
    "12.5": 'Medien und Kommunikation',
    "12.51": 'Medienpolitik',
    "12.52": 'Presse',
    "12.53": 'Radio, Fernsehen, Elektronische Medien',
    "12.54": 'Medienfreiheit',
}
df['d1e1'] = df['d1e1'].map(politikbereich_mapping)
df['d1e2'] = df['d1e2'].map(politikbereich_mapping)
df['d1e3'] = df['d1e3'].map(politikbereich_mapping)

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
    'd1e1': 'Bereich (1. Level)',
    'd1e2': 'Bereich (2. Level)',
    'd1e3': 'Bereich (3. Level)',
    'dep': 'Departement',
    'br-pos': 'Bundesrat',
    'bv-pos': 'Parlament',
    'nr-pos': 'Nationalrat',
    'sr-pos': 'Ständerat',
})

# save new csv
df.to_csv('swissvotes.csv', index=False)