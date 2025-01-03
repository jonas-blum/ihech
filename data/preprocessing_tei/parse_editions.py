import pandas as pd
import os 
from pathlib import Path
import xml.etree.ElementTree as ET

def parse_items_and_editions():
    # List to store all items
    items = []
    
    # Every edition should be in a separate subfolder (e.g. ./editions/Atharvaveda)
    edition_folder_path = f'editions'

    edition_names = os.listdir(edition_folder_path)
    print(f'Detected {len(edition_names)} editions:')
    for edition_name in edition_names:
        print(f'\u2022 {edition_name}')

    for edition_name in edition_names:
        print(f'Processing edition {edition_name}')

        for path in Path(f'{edition_folder_path}/{edition_name}').rglob('*.xml'):
            long_path = str(path).split('/', 2)[2]
            if long_path.startswith('data/'):
                long_path = long_path[5:]
            file_name = path.name

            # get XML attributes from file
            try:
                tree = ET.parse(path)
                root = tree.getroot()
            except ET.ParseError as e:
                print(f'⚠️ Error parsing XML file {file_name}: {str(e)}')
                continue

            # make sure we only use TEI files (and not other formats like METS)
            valid_root_attributes = ['TEI', 'teiCorpus']
            root_attribute = root.tag.split('}')[-1]
            if root_attribute not in valid_root_attributes:
                print(f'⚠️ File {file_name} start with {root_attribute} and is therefore skipped.')
                continue

            attributes = ''
            nesting_level = 0
            for event, elem in ET.iterparse(path, events=("start", "end")):
                attribute_name = elem.tag.split('}')[-1]
                
                if event == "start":
                    attributes += f'<{attribute_name}>'
                    nesting_level += 1
                elif event == "end":
                    attributes += f'</{attribute_name}>'
                    nesting_level -= 1

            items.append({
                'name': long_path,
                'edition': edition_name,
                'attributes': attributes
            })
    
    return items

items = parse_items_and_editions()

# store as csv file
df = pd.DataFrame(items, columns=['name', 'edition', 'attributes'])
df.to_csv('documents.csv', index=False)

