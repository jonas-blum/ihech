from calculate_attribute_std import calculate_attribute_std
from numba.core.errors import NumbaDeprecationWarning
import warnings


warnings.filterwarnings(
    "ignore",
    category=NumbaDeprecationWarning,
)

import logging
from typing import Dict, Tuple

import numpy as np
import pandas as pd
import time
from sklearn.decomposition import PCA
from sklearn.discriminant_analysis import StandardScaler
from sklearn.manifold import TSNE
from umap import UMAP
from helpers import drop_columns, extract_columns
from heatmap_types import HeatmapJSON, HeatmapSettings
from clustering_functions import (
    cluster_items_recursively,
    cluster_attributes_recursively,
)


logger = logging.getLogger("IHECH Logger")


def filter_attributes_and_items(
    item_names_df: pd.DataFrame,
    hierarchical_rows_metadata_df: pd.DataFrame,
    hierarchical_columns_metadata_df: pd.DataFrame,
    raw_data_df: pd.DataFrame,
    settings: HeatmapSettings,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:

    valid_indexes = list(
        set(settings.selectedItemsRowIndexes).intersection(raw_data_df.index)
    )
    valid_columns = [
        col
        for col in settings.selectedAttributesColumnNames
        if col in raw_data_df.columns
    ]

    raw_data_df = raw_data_df.loc[valid_indexes]
    hierarchical_rows_metadata_df = hierarchical_rows_metadata_df.loc[valid_indexes]
    item_names_df = item_names_df.loc[valid_indexes]

    raw_data_df = raw_data_df[valid_columns]
    hierarchical_columns_metadata_df = hierarchical_columns_metadata_df[valid_columns]

    for col in valid_columns:
        raw_data_df[col] = pd.to_numeric(raw_data_df[col], errors="coerce")

    na_row_indexes = raw_data_df[raw_data_df.isna().all(axis=1)].index
    raw_data_df = raw_data_df.drop(na_row_indexes)
    hierarchical_rows_metadata_df = hierarchical_rows_metadata_df.drop(na_row_indexes)
    item_names_df = item_names_df.drop(na_row_indexes)

    medians = raw_data_df.median()
    raw_data_df = raw_data_df.fillna(medians)

    if raw_data_df.empty:
        raise ValueError("No attributes left after filtering")

    return (
        item_names_df,
        hierarchical_rows_metadata_df,
        hierarchical_columns_metadata_df,
        raw_data_df,
    )


def do_scaling(
    raw_data_df: pd.DataFrame,
    settings: HeatmapSettings,
) -> pd.DataFrame:

    if settings.scaling == "NO_SCALING":
        scaled_df = raw_data_df.copy()
        return scaled_df
    elif settings.scaling == "STANDARDIZING":
        scaler = StandardScaler()
        scaled_df = scaler.fit_transform(raw_data_df)
        scaled_df = pd.DataFrame(
            scaled_df, index=raw_data_df.index, columns=raw_data_df.columns
        )
        return scaled_df
    else:
        raise ValueError("Invalid absRelLog value")


def create_heatmap(
    original_df: pd.DataFrame, settings: HeatmapSettings, start_heatmap: float
) -> HeatmapJSON:
    logger.info("Starting Filtering...")
    start_filtering = start_heatmap

    empty_col_index = original_df.columns[original_df.isnull().all()].tolist()
    if empty_col_index:
        first_empty_col = empty_col_index[0]
        split_index = original_df.columns.get_loc(first_empty_col)

        before_first_empty_col = original_df.iloc[:, :split_index]
        after_first_empty_col = original_df.iloc[:, split_index + 1 :]
    else:
        raise Exception("No empty column found")

    first_empty_row_index = original_df.isna().all(axis=1).idxmax()
    before_first_empty_row = original_df.iloc[:first_empty_row_index]
    after__first_empty_row = original_df.iloc[first_empty_row_index + 1 :]

    number_columns_before_first_empty_col = before_first_empty_col.shape[1]
    number_rows_before_first_empty_row = before_first_empty_row.shape[0]

    hierarchical_columns_metadata_df = original_df.iloc[
        :number_rows_before_first_empty_row, number_columns_before_first_empty_col:
    ]
    hierarchical_rows_metadata_df = original_df.iloc[
        number_rows_before_first_empty_row:, 1:number_columns_before_first_empty_col
    ]
    raw_data_df = original_df.iloc[
        number_rows_before_first_empty_row:, number_columns_before_first_empty_col:
    ]
    item_names_df = original_df.iloc[number_rows_before_first_empty_row:, :1]

    settings.stickyAttributesColumnNames = [
        attr
        for attr in settings.stickyAttributesColumnNames
        if attr in raw_data_df.columns
    ]
    settings.stickyItemsRowIndexes = [
        index for index in settings.stickyItemsRowIndexes if index in raw_data_df.index
    ]

    (
        item_names_df,
        hierarchical_rows_metadata_df,
        hierarchical_columns_metadata_df,
        raw_data_df,
    ) = filter_attributes_and_items(
        item_names_df,
        hierarchical_rows_metadata_df,
        hierarchical_columns_metadata_df,
        raw_data_df,
        settings,
    )

    scaled_raw_data_df = do_scaling(raw_data_df, settings)

    if settings.clusterItemsBasedOnStickyAttributes:
        sticky_columns = [
            col
            for col in settings.stickyAttributesColumnNames
            if col in scaled_raw_data_df.columns
        ]
        scaled_filtered_sticky_df = scaled_raw_data_df[sticky_columns]
        if not scaled_filtered_sticky_df.empty:
            scaled_raw_data_df = scaled_filtered_sticky_df
        else:
            logger.warning("No sticky attributes found in cleaned dataframe")

    logger.info(
        f"Filtering and sorting done: {round(time.perf_counter() - start_filtering, 2)}"
    )
    logger.info(
        "Number of attributes before filtering selected: "
        + str(len(settings.selectedAttributesColumnNames))
    )
    logger.info(
        "Number of attributes after filtering: "
        + str(
            raw_data_df.shape[1] - len(settings.hierarchicalRowsMetadataColumnNames) - 1
        )
    )
    logger.info(
        "Number of items before filtering selected: "
        + str(len(settings.selectedItemsRowIndexes))
    )
    logger.info("Number of items after filtering: " + str(raw_data_df.shape[0]))

    logger.info("Starting dim reduction...")
    start_dim_red = time.perf_counter()

    if scaled_raw_data_df.shape[1] == 1:
        scaled_raw_data_df["null_col"] = 1

    if settings.dimReductionAlgo == "UMAP":
        dim_reduction = UMAP(n_components=2, random_state=42)
        dim_red_df = dim_reduction.fit_transform(scaled_raw_data_df)
    elif settings.dimReductionAlgo == "TSNE":
        dim_reduction = TSNE(n_components=2, random_state=42)
        dim_red_df = dim_reduction.fit_transform(scaled_raw_data_df)
    elif settings.dimReductionAlgo == "PCA":
        dim_reduction = PCA(n_components=2, random_state=42)
        dim_red_df = dim_reduction.fit_transform(scaled_raw_data_df)
        explained_variance = dim_reduction.explained_variance_ratio_
        logger.info(f"Explained variance by component: {explained_variance}")
        logger.info(f"Total variance explained: {sum(explained_variance) * 100:.2f}%")
    else:
        raise ValueError("Invalid dim reduction algorithm")

    dim_red_df = pd.DataFrame(dim_red_df, index=raw_data_df.index)
    x_centered = dim_red_df[0] - dim_red_df[0].mean()
    y_centered = dim_red_df[1] - dim_red_df[1].mean()
    max_range = max(np.abs(x_centered).max(), np.abs(y_centered).max())
    x_scaled = x_centered / (2 * max_range) + 0.5
    y_scaled = y_centered / (2 * max_range) + 0.5
    dim_red_df = pd.DataFrame({0: x_scaled, 1: y_scaled}, index=dim_red_df.index)

    if (
        len(settings.stickyItemsRowIndexes) >= 2
        and settings.sortAttributesBasedOnStickyItems
    ):
        original_dropped_sticky_df = raw_data_df.loc[settings.stickyItemsRowIndexes]
        std_devs = original_dropped_sticky_df.std()
    else:
        std_devs = raw_data_df.std()

    min_dissimilarity = std_devs.min()
    max_dissimilarity = std_devs.max()
    if min_dissimilarity == max_dissimilarity:
        min_dissimilarity = 0
        max_dissimilarity = 1
    normalized_dissimilarities = (std_devs - min_dissimilarity) / (
        max_dissimilarity - min_dissimilarity
    )

    if "null_col" in scaled_raw_data_df.columns:
        scaled_raw_data_df = scaled_raw_data_df.drop("null_col", axis=1)

    if settings.clusterAfterDimRed:
        scaled_raw_data_for_clustering_items_df = dim_red_df.copy()
    else:
        scaled_raw_data_for_clustering_items_df = scaled_raw_data_df.copy()

    heatmap_json = HeatmapJSON()
    heatmap_json.attributeDissimilarities = normalized_dissimilarities.tolist()

    heatmap_json.maxHeatmapValue = raw_data_df.max().max()
    heatmap_json.minHeatmapValue = raw_data_df.min().min()
    heatmap_json.minAttributeValues = raw_data_df.min().tolist()
    heatmap_json.maxAttributeValues = raw_data_df.max().tolist()

    logger.info(f"Dim reduction done: {round(time.perf_counter() - start_dim_red, 2)}")
    logger.info("Starting clustering items...")
    start_clustering_items = time.perf_counter()

    raw_data_df = raw_data_df.copy()
    scaled_raw_data_df = scaled_raw_data_df.copy()
    dim_red_df = dim_red_df.copy()

    rotated_raw_data_df = raw_data_df.T.reset_index(drop=True).copy()
    rotated_scaled_raw_data_df = scaled_raw_data_df.T.reset_index(drop=True).copy()
    rotated_hierarchical_columns_metadata_df = (
        hierarchical_columns_metadata_df.T.reset_index(drop=True).copy()
    )
    rotated_hierarchical_columns_metadata_df.columns = (
        hierarchical_columns_metadata_df.index
    )
    rotated_hierarchical_columns_metadata_df.columns = (
        rotated_hierarchical_columns_metadata_df.columns.map(str)
    )

    rotated_column_names_df = pd.DataFrame(raw_data_df.columns)

    item_names_and_data = cluster_items_recursively(
        raw_data_df,
        hierarchical_rows_metadata_df,
        item_names_df,
        scaled_raw_data_for_clustering_items_df,
        dim_red_df,
        settings.itemsClusterSize,
        settings.clusterItemsByCollections,
        settings.hierarchicalRowsMetadataColumnNames,
        level=0,
    )

    if item_names_and_data is None:
        raise Exception("No items in cluster")

    heatmap_json.itemNamesAndData = item_names_and_data

    logger.info(
        f"Clustering items done: {round(time.perf_counter() - start_clustering_items, 2)}"
    )
    logger.info("Starting clustering attributes...")
    start_clustering_attributes = time.perf_counter()

    hierarchical_attributes = cluster_attributes_recursively(
        rotated_raw_data_df,
        rotated_scaled_raw_data_df,
        rotated_hierarchical_columns_metadata_df,
        rotated_column_names_df,
        item_names_and_data,
        settings.attributesClusterSize,
        settings.clusterAttributesByCollections,
        settings.hierarchicalColumnsMetadataRowIndexes,
        0,
    )
    heatmap_json.hierarchicalAttributes = hierarchical_attributes
    logger.info(
        f"Clustering attributes done: {round(time.perf_counter() - start_clustering_attributes, 2)}"
    )

    return heatmap_json
