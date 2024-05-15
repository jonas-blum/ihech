import logging
import pandas as pd
import time
from heatmap_types import HeatmapSettings


from typing import Tuple
import pandas as pd
from pandas.core.groupby import DataFrameGroupBy
import warnings

from sklearn.cluster import KMeans
from heatmap_types import (
    MedianMaxMinType,
    StructuralFeatureType,
)
from sklearn.exceptions import ConvergenceWarning


logger = logging.getLogger("IHECH Logger")


AGGREGATION_COLUMN = "aggregation_column"

# Is not here anymore
EXTENDED_VECTORS = "../data/extended_vectors.csv"


warnings.simplefilter("ignore", ConvergenceWarning)


def do_aggregation_based_on_structural_feature_type(
    grouped_df: DataFrameGroupBy,
    type: StructuralFeatureType,
    median_max_min: MedianMaxMinType,
) -> pd.DataFrame:
    if type == "AMOUNT_OF_TAGS":
        return aggregate_amount_of_tags(grouped_df, median_max_min)
    elif type == "BINARY_TAG_EXISTS":
        return aggregate_binary_tag_exists(grouped_df, median_max_min)
    elif type == "AMOUNT_OF_DIFFERENT_ATTRIBUTES":
        return aggregate_amount_of_different_attributes(grouped_df, median_max_min)
    elif type == "AMOUNT_OF_ATTRIBUTES":
        return aggregate_amount_of_attributes(grouped_df, median_max_min)
    elif type == "AMOUNT_OF_SIBLING_TAGS":
        return aggregate_amount_of_sibling_tags(grouped_df, median_max_min)
    elif type == "AMOUNT_OF_DIRECT_CHILDREN_TAGS":
        return aggregate_amount_of_direct_children_tags(grouped_df, median_max_min)
    elif type == "AMOUNT_OF_INDIRECT_CHILDREN_TAGS":
        return aggregate_amount_of_indirect_children_tags(grouped_df, median_max_min)
    elif type == "LENGTH_OF_CONTENT_INSIDE_TAG":
        return aggregate_length_of_content_inside_tag(grouped_df, median_max_min)
    elif type == "LENGTH_OF_CONTENT_ALL_CHILDREN":
        return aggregate_length_of_content_all_children(grouped_df, median_max_min)
    elif type == "DEPTH_OF_TAG":
        return aggregate_depth_of_tag(grouped_df, median_max_min)

    else:
        raise ValueError("StructuralFeatureType not implemented" + str(type))


def aggregate_amount_of_different_attributes(
    grouped_df: DataFrameGroupBy, median_max_min: MedianMaxMinType
) -> pd.DataFrame:
    column_name = "attributes"
    aggregated_df = grouped_df.agg({column_name: lambda x: len(set(x))}).reset_index()
    aggregated_df.rename(columns={column_name: AGGREGATION_COLUMN}, inplace=True)
    return aggregated_df


def aggregate_amount_of_tags(
    grouped_df: DataFrameGroupBy, median_max_min: MedianMaxMinType
) -> pd.DataFrame:
    aggregated_df = grouped_df.size().reset_index(name=AGGREGATION_COLUMN)
    return aggregated_df


def aggregate_binary_tag_exists(
    grouped_df: DataFrameGroupBy, median_max_min: MedianMaxMinType
) -> pd.DataFrame:
    aggregated_df = grouped_df.size().reset_index(name=AGGREGATION_COLUMN)
    aggregated_df[AGGREGATION_COLUMN] = 1
    return aggregated_df


def aggregate_amount_of_sibling_tags(
    grouped_df: DataFrameGroupBy, median_max_min: MedianMaxMinType
) -> pd.DataFrame:
    column_name = "tag_amount_parent_tag"
    aggregated_df = grouped_df.agg({column_name: median_max_min.lower()}).reset_index()
    aggregated_df.rename(columns={column_name: AGGREGATION_COLUMN}, inplace=True)
    return aggregated_df


def aggregate_amount_of_direct_children_tags(
    grouped_df: DataFrameGroupBy, median_max_min: MedianMaxMinType
) -> pd.DataFrame:
    column_name = "tag_amount_directly_inside_tag"
    aggregated_df = grouped_df.agg({column_name: median_max_min.lower()}).reset_index()
    aggregated_df.rename(columns={column_name: AGGREGATION_COLUMN}, inplace=True)
    return aggregated_df


def aggregate_amount_of_indirect_children_tags(
    grouped_df: DataFrameGroupBy, median_max_min: MedianMaxMinType
) -> pd.DataFrame:
    column_name = "tag_amount_all_children"
    aggregated_df = grouped_df.agg({column_name: median_max_min.lower()}).reset_index()
    aggregated_df.rename(columns={column_name: AGGREGATION_COLUMN}, inplace=True)
    return aggregated_df


def aggregate_length_of_content_inside_tag(
    grouped_df: DataFrameGroupBy, median_max_min: MedianMaxMinType
) -> pd.DataFrame:
    column_name = "character_amount_inside_of_tag"
    aggregated_df = grouped_df.agg({column_name: median_max_min.lower()}).reset_index()
    aggregated_df.rename(columns={column_name: AGGREGATION_COLUMN}, inplace=True)
    return aggregated_df


def aggregate_length_of_content_all_children(
    grouped_df: DataFrameGroupBy, median_max_min: MedianMaxMinType
) -> pd.DataFrame:
    column_name = "character_amount_all_children"
    aggregated_df = grouped_df.agg({column_name: median_max_min.lower()}).reset_index()
    aggregated_df.rename(columns={column_name: AGGREGATION_COLUMN}, inplace=True)
    return aggregated_df


def aggregate_depth_of_tag(
    grouped_df: DataFrameGroupBy, median_max_min: str
) -> pd.DataFrame:
    column_name = "tag_depth"
    aggregated_df = grouped_df.agg({column_name: median_max_min.lower()}).reset_index()
    aggregated_df.rename(columns={column_name: AGGREGATION_COLUMN}, inplace=True)
    return aggregated_df


def aggregate_amount_of_attributes(
    grouped_df: DataFrameGroupBy, median_max_min: MedianMaxMinType
) -> pd.DataFrame:
    column_name = "amount_of_attributes"
    aggregated_df = grouped_df.agg({column_name: median_max_min.lower()}).reset_index()
    aggregated_df.rename(columns={column_name: AGGREGATION_COLUMN}, inplace=True)
    return aggregated_df


def do_aggregation_of_df(
    extended_vectors_df: pd.DataFrame,
    type: StructuralFeatureType,
    median_max_min: MedianMaxMinType,
) -> pd.DataFrame:
    grouped_df = extended_vectors_df.groupby(["tag", "document_id"])
    aggregated_df = do_aggregation_based_on_structural_feature_type(
        grouped_df, type, median_max_min
    )

    aggregated_df.reset_index(inplace=True)

    original_df = aggregated_df.pivot(
        index="document_id", columns="tag", values=AGGREGATION_COLUMN
    ).fillna(0)

    original_df["document_id"] = original_df.index

    return original_df


class HeatmapData:
    def __init__(self):
        start = time.perf_counter()
        logger.info("Loading Heatmap Data...")

        self.vectors_df = pd.read_csv(EXTENDED_VECTORS)

        tei_elements = pd.read_csv("../data/tei_elements.csv")
        self.unique_elements = tei_elements["element"].unique()

        logger.info(f"Time to load data: {time.perf_counter() - start}")
        logger.info("\n -------- \nHEATMAP DATA IS READY\n -------- \n")

    def create_data_frame_csv(self, settings: HeatmapSettings) -> pd.DataFrame:
        filtered_df = self.vectors_df[
            self.vectors_df["document_id"].isin(settings.selectedItemIndexes)
        ]

        original_df = do_aggregation_of_df(
            filtered_df,
            "AMOUNT_OF_TAGS",
            "MEDIAN",
        )

        original_df.columns.name = None

        original_df.loc[:, "tei-edition-label"] = original_df.index.to_series().apply(
            lambda x: x.split("//")[0]
        )

        return original_df
