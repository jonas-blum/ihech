# open the (pgn; chess notation) file called all_games.pgn and analyze the games
import chess.pgn
import pandas as pd
import time

# Open the PGN file
games = open("all_games.pgn")

# print how many games are in the file
# game_count = 0
# while chess.pgn.read_game(games):
#     game_count += 1
#     if game_count % 10000 == 0:
#         print(f"Total number of games: {game_count}")
# print(f"Total number of games: {game_count}")
# exit(0)

# load the openings data
openings = pd.read_parquet("hf://datasets/Lichess/chess-openings/data/train-00000-of-00001.parquet")

# ECO books mapping
eco_books_mapping = {
    'A': 'Flank Openings',
    'B': 'Semi-Open Games',
    'C': 'Open Games',
    'D': 'Closed Semi-Closed Games',
    'E': 'Indian Defences',
}

start_time = time.time()

data = []

# Create a set of EPDs for faster lookup
opening_epds = set(openings.epd.values)

# Create a dictionary to map EPDs to their corresponding openings
epd_to_opening = {epd: row for epd, row in openings.set_index('epd').iterrows()}

# iterate over the chess games
for _ in range(9999999):
    game = chess.pgn.read_game(games)
    if game is None:
        print(f"💥 No more games found; {_} games processed")
        break

    associated_opening = None

    # iterate the moves
    board = game.board()
    for move in game.mainline_moves():
        board.push(move)
        
        # check if the current epd is any of the openings
        epd = board.epd()
        if epd in opening_epds:
            associated_opening = epd_to_opening[epd]
            # break
            
    if associated_opening is None:
        print("💥 No opening found for game")
        continue
    
    opening_name = associated_opening['name']
    opening_family, *variation_parts = opening_name.split(":")
    opening_variation = variation_parts[0].split(",")[0] if variation_parts else None
    opening_subvariation = variation_parts[0].split(",")[1] if len(variation_parts) > 0 and len(variation_parts[0].split(",")) > 1 else None
    
    data.append({
        'white': game.headers['White'],
        'black': game.headers['Black'],
        'result': game.headers['Result'],
        'opening_eco_book': eco_books_mapping[associated_opening.eco[0]],
        'opening_eco': associated_opening.eco,
        'opening_family': opening_family,
        'opening_variation': opening_variation,
        'opening_subvariation': opening_subvariation,
    })
    
df = pd.DataFrame(data)

# replace all NaN values in the column 'opening_variation' with 'others'
df['opening_variation'] = df['opening_variation'].fillna('Others')

# replace all NaN values in the column 'opening_subvariation' with 'others'
df['opening_subvariation'] = df['opening_subvariation'].fillna('Others')


end_time = time.time()
print(f"Execution time: {end_time - start_time} seconds")

# store data in csv file
df.to_csv('games_with_openings.csv', index=False)