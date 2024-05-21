import gzip
import json
from typing import List
import pandas as pd


def drop_columns(
    df: pd.DataFrame, row_names_column_name: str, collection_column_names: List[str]
) -> pd.DataFrame:
    return df.drop([row_names_column_name] + collection_column_names, axis=1)


def extract_columns(
    df: pd.DataFrame, row_names_column_name: str, collection_column_names: List[str]
) -> pd.DataFrame:
    unique_columns = list(set([row_names_column_name] + collection_column_names))
    return df[unique_columns]


def compress_json(data):
    json_str = json.dumps(data).encode("utf-8")
    compressed_data = gzip.compress(json_str)
    return compressed_data
