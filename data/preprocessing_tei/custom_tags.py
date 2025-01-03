import pandas as pd
import re

documents = pd.read_csv('documents.csv')
tei_tags = pd.read_csv('tei_tags.csv')

def parse_custom_attributes():
    tei_tag_names = tei_tags['tag'].tolist()
    pattern = r'<([^/][^>]*)>'
    custom_attributes = set()

    # loop over items
    for _, document in documents.iterrows():
        tag_string = document.attributes
        tags_of_document = re.findall(pattern, tag_string)

        # loop over tags and check if they are in the list of TEI attributes
        for tag in tags_of_document:
            if tag not in tei_tag_names:
                custom_attributes.add(tag)

    print('Custom attributes:')
    print(custom_attributes)


    custom_tags = []
    if custom_attributes:   
        for custom_attribute in custom_attributes:
            # Store attribute info as dictionary in the list
            custom_tags.append({
                'tag': custom_attribute,
                'module': 'custom',
                'description': 'N/A'
            })
            
    return custom_tags
            
custom_tags = parse_custom_attributes()

# store as csv file
df = pd.DataFrame(custom_tags, columns=['tag', 'module', 'description'])
df.to_csv('custom_tags.csv', index=False)