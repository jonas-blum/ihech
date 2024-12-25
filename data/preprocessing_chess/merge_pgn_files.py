import os

# open all the (pgn; chess notation) files in the data folder and merge them into one file
data_folder = 'data'
output_file = 'all_games.pgn'

with open(output_file, 'w') as outfile:
    for filename in os.listdir(data_folder):
        print(f'Processing {filename}')
        if filename.endswith('.pgn'):
            print(os.path.join(data_folder, filename))
            with open(os.path.join(data_folder, filename), 'r', encoding='latin-1') as infile:
                outfile.write(infile.read())
                outfile.write('\n')