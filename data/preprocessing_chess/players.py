import pandas as pd

# read in the games_with_openings.csv as a pandas dataframe
games_with_openings = pd.read_csv('games_with_openings.csv')

# get value counts for white and black players
white_counts = games_with_openings['white'].value_counts()
black_counts = games_with_openings['black'].value_counts()

# get all unique players and common players more efficiently
all_players = set(white_counts.index).union(set(black_counts.index))
common_players = set(white_counts.index).intersection(set(black_counts.index))
print(f'There are {len(common_players)} players that have played both as white and as black.')

# create the dataframe more efficiently using the value counts
df = pd.DataFrame(index=list(all_players))
df['games_as_white'] = white_counts.reindex(df.index).fillna(0).astype(int)
df['games_as_black'] = black_counts.reindex(df.index).fillna(0).astype(int)
df['games_as_white_and_black'] = df['games_as_white'] + df['games_as_black']

# add two empty columns called 'nationality' and 'birthyear'
df['nationality'] = None
df['birthyear'] = None

# sort
df = df.sort_values('games_as_white_and_black', ascending=False)
print(df.head())
print(df.describe())

# store data in csv file
df.to_csv('players.csv')