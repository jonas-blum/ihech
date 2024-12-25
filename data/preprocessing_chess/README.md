# Chess Dataset Preparation

## Chess Openings
We use a curated chess openings database: [Chess Openings](https://github.com/lichess-org/chess-openings?tab=readme-ov-file) containing the following information for each opening:

- **ECO Volume**: B
- **ECO Code**: B31
- **Name**: Sicilian Defense: Nyezhmetdinov-Rossolimo Attack, Fianchetto Variation, Totsky Attack
- **PGN**: `1. e4 c5 2. Nf3 Nc6 3. Bb5 g6 4. O-O Bg7 5. c3 Nf6 6. Qa4`
- **UCI**: `e2e4 c7c5 g1f3 b8c6 f1b5 g7g6 e1g1 f8g7 c2c3 g8f6 d1a4`
- **EPD**: `r1bqk2r/pp1pppbp/2n2np1/1Bp5/Q3P3/2P2N2/PP1P1PPP/RNB2RK1 b kq -`


## Chess Games
1. Download the [40H](http://www.nk-qy.info/40h/) Grandmaster game collection of 760435 games and put the pgn files (except `cc-tcec.pgn`) in the data folder.
2. Run `merge_pgn_-_files.py` --> will create file called `all_games.png`
3. Run `enrich_with_openings.py` --> will create csv called `games_with_openings.csv`:

| white               | black                  | result   | opening_eco | opening_family  | opening_variation       | opening_subvariation   |
|---------------------|------------------------|----------|-------------|-----------------|-------------------------|------------------------|
| Bulcourf, Carlos    | Olivera, Horacio       | 1-0      | A00         | Polish Opening  | King's Indian Variation |                        |
| Caro, Alberto N.    | Zorigt, D.             | 0-1      | A00         | Polish Opening  | King's Indian Variation | Sokolsky Attack        |
| Chemin, Vitorio     | Silva Nazzari, Roberto | 1-0      | A00         | Polish Opening  |                         |                        |
| Damjanovic, Mato    | Bertok, Mario          | 1/2-1/2  | A00         | Polish Opening  | King's Indian Variation | Schiffler Attack       |


- get set of all unique players
- for every player: 
    - filter their games (optionally by white or black)
    - get the total amount of games played per opening
    - compute the relative play percentage per opening









## NOTES
differentiate between games with white and games with black? lets not differentiate for now. later I can create two separate datasets for white and black.

player_white, player_black, eco, opening_family, variation, subvariation, result
