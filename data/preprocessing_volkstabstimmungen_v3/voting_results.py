import os
import json
import csv


vorlagen = []
kanton_results = []
gemeinde_results = []

data_folder = 'voting_results'
files = os.listdir(data_folder)

float_count = 0
string_count = 0
none_count = 0

count = 0
for file_name in files:
    count += 1
    print(f'({count}/{len(files)}) Processing {file_name}')

    file_path = f'{data_folder}/{file_name}'
    with open(file_path, 'r') as file:
        data = json.load(file)
        abstimmtag = data['abstimmtag']

        for vorlage in data['schweiz']['vorlagen']:
            vorlage_text_DE = vorlage['vorlagenTitel'][0]['text']
            vorlage_text_EN = vorlage['vorlagenTitel'][4]['text']
            vorlage_id = str(vorlage['vorlagenId'])[:3] # only keep first 3 digits; last is always 0; this is the same as the 'anr' column in the swissvotes.csv file
            vorlage_accepted = vorlage['vorlageAngenommen'] # this could differ from the aggregated kanton results due to the Ständemehr
            
            vorlagen.append({
                'date': abstimmtag,
                'vorlage_id': vorlage_id,
                'vorlage_text_DE': vorlage_text_DE,
                'vorlage_text_EN': vorlage_text_EN,
                'vorlage_accepted': vorlage_accepted
            })
            
            for kanton in vorlage['kantone']:
                kanton_name = kanton['geoLevelname']
                kanton_geoId = kanton['geoLevelnummer']
                kanton_yesPercentage = kanton['resultat']['jaStimmenInProzent']                
                # kanton_yesCount = kanton['resultat']['jaStimmenAbsolut']
                # kanton_noCount = kanton['resultat']['neinStimmenAbsolut']
                # kanton_eligibleVoters = kanton['resultat']['anzahlStimmberechtigte']
                # kanton_receivedVotes = kanton['resultat']['eingelegteStimmzettel']
                # kanton_validVotes = kanton['resultat']['gueltigeStimmen']
                # kanton_votePercentage = kanton['resultat']['stimmbeteiligungInProzent'] # should be a derived attribute
                
                kanton_results.append({
                    'vorlage_id': vorlage_id,
                    'kanton_name': kanton_name,
                    'kanton_geoId': kanton_geoId,
                    'kanton_yesPercentage': kanton_yesPercentage,
                    # 'kanton_yesCount': kanton_yesCount,
                    # 'kanton_noCount': kanton_noCount,
                    # 'kanton_eligibleVoters': kanton_eligibleVoters,
                    # 'kanton_receivedVotes': kanton_receivedVotes,
                    # 'kanton_validVotes': kanton_validVotes
                })
                
                bezirk_dict = {}
                for bezirk in kanton['bezirke']:
                    bezirk_name = bezirk['geoLevelname']
                    bezirk_geoId = bezirk['geoLevelnummer']
                    bezirk_dict[bezirk_geoId] = bezirk_name
                    
                
                for gemeinde in kanton['gemeinden']:
                    gemeinde_name = gemeinde['geoLevelname']
                    gemeinde_geoId = gemeinde['geoLevelnummer']
                    gemeinde_yesPercentage = gemeinde['resultat']['jaStimmenInProzent']
                    gemeinde_votePercentage = gemeinde['resultat']['stimmbeteiligungInProzent']
                    
                    if isinstance(gemeinde_yesPercentage, float):
                        float_count += 1
                        # reduce to 2 decimal places
                        gemeinde_yesPercentage = round(gemeinde_yesPercentage, 2)
                    elif isinstance(gemeinde_yesPercentage, str):
                        string_count += 1
                    else:
                        none_count += 1
                        print(f'gemeinde_yesPercentage: {gemeinde_yesPercentage} for gemeinde {gemeinde_name} in kanton {kanton_name}')
                    
                    # gemeinde_yesCount = gemeinde['resultat']['jaStimmenAbsolut']
                    # gemeinde_noCount = gemeinde['resultat']['neinStimmenAbsolut']
                    # gemeinde_eligibleVoters = gemeinde['resultat']['anzahlStimmberechtigte']
                    # gemeinde_receivedVotes = gemeinde['resultat']['eingelegteStimmzettel']
                    # gemeinde_validVotes = gemeinde['resultat']['gueltigeStimmen']      
                    
                    gemeinde_results.append({
                        'vorlage_id': vorlage_id,
                        'kanton_name': kanton_name,
                        'bezirk_name': bezirk_dict[gemeinde['geoLevelParentnummer']], # get the bezirk name from the bezirk_dict
                        'gemeinde_name': gemeinde_name,
                        'gemeinde_geoId': gemeinde_geoId,
                        'gemeinde_yesPercentage': gemeinde_yesPercentage,
                        # 'gemeinde_yesCount': gemeinde_yesCount,
                        # 'gemeinde_noCount': gemeinde_noCount,
                        # 'gemeinde_eligibleVoters': gemeinde_eligibleVoters,
                        # 'gemeinde_receivedVotes': gemeinde_receivedVotes,
                        # 'gemeinde_validVotes': gemeinde_validVotes
                        'gemeinde_votePercentage': gemeinde_votePercentage
                    })
                    
print(f'float_count: {float_count}')
print(f'string_count: {string_count}')
print(f'none_count: {none_count}')
                

# write to csv files
# vorlagen_file = 'vorlagen.csv'
# kanton_results_file = 'kanton_results.csv'
gemeinde_results_file = 'voting_results.csv'

# NOTE: not needed for this project, we fetch all Abstimmungen from another source
# with open(vorlagen_file, 'w', newline='') as csvfile:
#     writer = csv.DictWriter(csvfile, fieldnames=vorlagen[0].keys())
#     writer.writeheader()
#     for row in vorlagen:
#         writer.writerow(row)
        
# NOTE: for this project, we are not interested in the kanton results (they are implicitly included in the gemeinde results)
# with open(kanton_results_file, 'w', newline='') as csvfile:
#     writer = csv.DictWriter(csvfile, fieldnames=kanton_results[0].keys())
#     writer.writeheader()
#     for row in kanton_results:
#         writer.writerow(row)
        
with open(gemeinde_results_file, 'w', newline='') as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=gemeinde_results[0].keys())
    writer.writeheader()
    for row in gemeinde_results:
        writer.writerow(row)
        
print(f'Wrote {len(vorlagen)} vorlagen, {len(kanton_results)} kanton results and {len(gemeinde_results)} gemeinde results to csv files')