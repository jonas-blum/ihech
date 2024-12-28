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
2. Run `merge_pgn_files.py` --> will create file called `all_games.png`
3. Run `enrich_with_openings.py` --> will create csv called `games_with_openings.csv`:

| white | black | result | opening_eco_book | opening_eco | opening_family | opening_variation | opening_subvariation |
|-------|-------|--------|------------------|-------------|----------------|-------------------|---------------------|
| Maciejewski, Andrzej | Doda, Zbigniew | 0-1 | A | A00 | Clemenz Opening | Others | Others |
| Ban, Jeno | Dely, Peter | 1-0 | A | A00 | Anderssen's Opening | Others | Others |
| Bloch, Nigel | Stean, Michael F. | 1-0 | A | A00 | Anderssen's Opening | Others | Others |

4. Run `players.py` --> will create `players.csv` with the unique chess players
5. Use LLM to enrich the players.csv with nationality and birthyear and save as `players_gpt_enriched` (there is no script for that, needs to be done manually. not all the data may be 100% accurate due to LLM halllucination; currently done for 500 players with most games)

| Player | Games as White | Games as Black | Total Games | Nationality | Birth Year |
|--------|---------------|----------------|-------------|-------------|------------|
| Korchnoi, Viktor | 1,923 | 1,853 | 3,776 | Switzerland | 1931 |
| Timman, Jan H. | 1,486 | 1,436 | 2,922 | Netherlands | 1951 |
| Beliavsky, Alexander G. | 1,450 | 1,384 | 2,834 | Slovenia | 1953 |
| Shirov, Alexei | 1,438 | 1,356 | 2,794 | Latvia | 1972 |

6. Run `create_dataset_white.py` and `create_dataset_black.py` --> will create the final datasets

