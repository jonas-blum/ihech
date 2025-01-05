import pandas as pd

# import csv file as pandas dataframe; use first column as index
editionen = pd.read_csv('editionen_links.csv', index_col=0)

print(editionen)