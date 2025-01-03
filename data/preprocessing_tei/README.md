# TEI Dataset Preparation

## Parse the Editions
1. Put all editions as subfolders in the 'editions' folder
2. Run `parse_editions.py` --> creates `documents.csv`

## Documents Overview
| name | edition | attributes |
|------|------------|------------|
| sb_berlin/Nachl_Herder_XXXII-9/01.xml | transcripts_faust_edition | `<TEI><teiHeader><fileDesc>...` |
| gsa/390652/0003.xml | transcripts_faust_edition | `<TEI><teiHeader><fileDesc>...` |
| letters.0368.xml | thomas_gray_archive_letters | `<TEI><teiHeader><fileDesc>...` |

## Fetch the TEI tags from the official guidelines
1. Run `fetch_tei_tags.py` --> creates `tei_tags.csv`

| tag | module | description |
|-----|---------|-------------|
| c | analysis | (character) represents a character. |
| cl | analysis | (clause) represents a grammatical clause. |
| interp | analysis | (interpretation) summarizes a specific interpretative annotation which can be linked to a span of text. |

## Search for custom tags
1. Run `custom_tags.py` --> creates `custom_tags.csv`

| tag | module | description |
|-----|---------|-------------|
| overw | custom | N/A |
| grLine | custom | N/A |
| over | custom | N/A |

## Combine official and custom tags
1. Run `merge_tags.py` --> creates `tags.csv`

## Create Detaset
1. Run the `create_dataset_tei.py` script --> will produce the final `TEI-Data.json` file

