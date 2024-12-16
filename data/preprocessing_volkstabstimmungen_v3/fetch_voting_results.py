import requests
import json


with open('voting_results_metadata.json', 'r') as metadata_file:
    metadata = json.load(metadata_file)
    
    resources = metadata['result']['resources']
    print(f'There are {len(resources)} resources to download')

    count = 0
    for resource in resources:
        download_url = resource['download_url']
        id = resource['id']

        count += 1
        print(f'({count}/{len(resources)}) Downloading resource {id}')
        response = requests.get(download_url)
        data = response.json()

        # store data in json file
        file_path = f'voting_results/{id}.json'
        with open(file_path, 'w') as file:
            json.dump(data, file)


