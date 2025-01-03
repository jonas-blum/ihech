import pandas as pd

# read in the tei_tags.csv file and the custom_tags.csv file
tei_tags = pd.read_csv('tei_tags.csv')
custom_tags = pd.read_csv('custom_tags.csv')

# merge the two dataframes
tags = pd.concat([tei_tags, custom_tags])

# store as csv file
tags.to_csv('tags.csv', index=False)