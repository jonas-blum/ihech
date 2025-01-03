import requests
from bs4 import BeautifulSoup
import pandas as pd


def fetch_tei_guidelines():
    url = 'https://tei-c.org/release/doc/tei-p5-doc/en/html/REF-ELEMENTS.html#'
    response = requests.get(url)
    
    # Dictionary to store all attribute groups and their attributes
    tei_data = {}

    soup = BeautifulSoup(response.content, 'html.parser')
    by_mod = soup.find('div', id='byMod')
    attribute_groups = by_mod.find_all('div', recursive=False)

    for attribute_group in attribute_groups:
        attribute_group_name = attribute_group.find('h3').text
        attribute_group_name = attribute_group_name.split(' ')[0][1:-1]
        
        # Initialize empty list for attributes in this group
        tei_data[attribute_group_name] = []

        print(f'Scraping attributes from attribute_group {attribute_group_name}')
        attributes = attribute_group.find_all('a')
        for attribute in attributes:
            attribute_url = 'https://tei-c.org/release/doc/tei-p5-doc/en/html/' + attribute['href']
            attribute_response = requests.get(attribute_url)
            attribute_soup = BeautifulSoup(attribute_response.content, 'html.parser')
            
            description = attribute_soup.select_one('table.wovenodd > tr > td').text
            description = ' '.join(description.split())
            start_index = description.find('> ')
            end_index = description.find(' [')
            description = description[start_index + 2:end_index]

            # Store attribute info as dictionary in the list
            tei_data[attribute_group_name].append({
                'name': attribute.text,
                'description': description
            })
    
    return tei_data
            
tei_data = fetch_tei_guidelines()

print(tei_data)

# create array of format 'tag' | 'module' | 'description'
tei_data_array = []
for key, value in tei_data.items():
    for attribute in value:
        tei_data_array.append([attribute['name'], key, attribute['description']])
        
# store as csv file
df = pd.DataFrame(tei_data_array, columns=['tag', 'module', 'description'])
df.to_csv('tei_tags.csv', index=False)
