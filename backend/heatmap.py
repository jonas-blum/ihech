from numba.core.errors import NumbaDeprecationWarning
import warnings

warnings.filterwarnings(
    "ignore",
    category=NumbaDeprecationWarning,
)

import logging
from typing import Tuple

import numpy as np
import pandas as pd
import time
from sklearn.decomposition import PCA
from sklearn.discriminant_analysis import StandardScaler
from sklearn.manifold import TSNE
from umap import UMAP
from helpers import drop_columns, extract_columns
from heatmap_types import HeatmapJSON, HeatmapSettings
from clustering_functions import cluster_items_recursively


logger = logging.getLogger("IHECH Logger")


def sort_attributes(
    original_df: pd.DataFrame,
    transformed_df: pd.DataFrame,
    settings: HeatmapSettings,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    transformed_df_to_sort = transformed_df

    additional_columns = list(
        set(
            [
                settings.itemNamesColumnName,
            ]
            + settings.collectionColumnNames
        )
    )

    if settings.sortAttributesBasedOnStickyItems:
        sticky_df = transformed_df.loc[settings.stickyItemIndexes]
        if not sticky_df.empty:
            transformed_df_to_sort = sticky_df
    if settings.sortOrderAttributes == "ASC":
        column_means = transformed_df_to_sort.mean()
        sorted_columns = column_means.sort_values().index

        transformed_df = transformed_df[sorted_columns]
        original_df = original_df[list(sorted_columns) + additional_columns]
    elif settings.sortOrderAttributes == "DESC":
        column_means = transformed_df_to_sort.mean()
        sorted_columns = column_means.sort_values(ascending=False).index

        transformed_df = transformed_df[sorted_columns]
        original_df = original_df[list(sorted_columns) + additional_columns]

    elif settings.sortOrderAttributes == "ALPHABETICAL":
        transformed_df = transformed_df.sort_index(axis=1)
        original_df = original_df.sort_index(axis=1)
    elif settings.sortOrderAttributes == "STDEV":
        if transformed_df_to_sort.shape[0] < 2:
            transformed_df_to_sort = transformed_df
        std_devs = transformed_df_to_sort.std()
        col_std_map = {
            col: std_val
            for col, std_val in zip(transformed_df_to_sort.columns, std_devs)
        }
        sorted_columns = sorted(col_std_map, key=col_std_map.get, reverse=True)

        transformed_df = transformed_df[sorted_columns]
        original_df = original_df[list(sorted_columns) + additional_columns]
    else:
        raise ValueError(
            "SortOrderColumns not implemented: " + str(settings.sortOrderAttributes)
        )
    return original_df, transformed_df


def filter_attributes_and_items(
    original_df: pd.DataFrame, settings: HeatmapSettings
) -> pd.DataFrame:

    extracted_columns = extract_columns(
        original_df,
        settings.itemNamesColumnName,
        settings.collectionColumnNames,
    )

    valid_columns = [
        col for col in settings.selectedAttributes if col in original_df.columns
    ]

    original_df = original_df[valid_columns]

    original_df = original_df.select_dtypes(include=[np.number])
    original_df = original_df.dropna(axis=1, how="all")

    medians = original_df.median()
    original_df = original_df.fillna(medians)

    if original_df.empty:
        raise ValueError("No attributes left after filtering")

    original_df = pd.concat([extracted_columns, original_df], axis=1)
    return original_df


def set_abs_rel_log(
    transformed_df: pd.DataFrame, settings: HeatmapSettings
) -> pd.DataFrame:

    # TODO: Implement this
    # if settings.absRelLog == "REL":
    #     row_maxes = transformed_df.max(axis=1)
    #     row_maxes = row_maxes.replace(0, 1)
    #     transformed_df = transformed_df.div(row_maxes, axis=0)
    # elif settings.absRelLog == "LOG":
    #     transformed_df = np.log(transformed_df + 1)
    # elif settings.absRelLog == "ABS":
    #     pass
    # else:
    #     raise ValueError("Invalid absRelLog value")

    return transformed_df


def create_heatmap(
    original_df: pd.DataFrame,
    settings: HeatmapSettings,
) -> str:
    start = time.perf_counter()

    original_filtered_df = filter_attributes_and_items(original_df, settings)

    transformed_filtered_df = drop_columns(
        original_filtered_df,
        settings.itemNamesColumnName,
        settings.collectionColumnNames,
    )

    transformed_filtered_df = set_abs_rel_log(transformed_filtered_df, settings)

    original_filtered_df, transformed_filtered_df = sort_attributes(
        original_filtered_df, transformed_filtered_df, settings
    )

    if settings.clusterItemsBasedOnStickyAttributes:
        sticky_columns = [
            col
            for col in settings.stickyAttributes
            if col in transformed_filtered_df.columns
        ]
        transformed_filtered_sticky_df = transformed_filtered_df[sticky_columns]
        if not transformed_filtered_df.empty:
            transformed_filtered_df = transformed_filtered_sticky_df
        else:
            logger.warning("No sticky attributes found in cleaned dataframe")

    logger.info(f"Filtering and sorting done: {round(time.perf_counter() - start, 3)}")
    logger.info(
        "Number of attributes selected: " + str(len(settings.selectedAttributes))
    )
    logger.info(
        "Number of attributes after filtering: "
        + str(original_filtered_df.shape[1] - len(settings.collectionColumnNames) - 1)
    )
    logger.info("Number of items: " + str(original_filtered_df.shape[0]))
    logger.info("Starting dim reduction...")
    start = time.perf_counter()

    if settings.dimReductionAlgo == "UMAP":
        dim_reduction = UMAP(n_components=2, random_state=42)
    elif settings.dimReductionAlgo == "TSNE":
        dim_reduction = TSNE(n_components=2, random_state=42)
    elif settings.dimReductionAlgo == "PCA":
        dim_reduction = PCA(n_components=2, random_state=42)
    else:
        raise ValueError("Invalid dim reduction algorithm")
    scaler = StandardScaler()

    if transformed_filtered_df.shape[1] == 1:
        transformed_filtered_df["null_col"] = 1

    transformed_filtered_dim_red_df = scaler.fit_transform(transformed_filtered_df)
    transformed_filtered_dim_red_df = dim_reduction.fit_transform(
        transformed_filtered_dim_red_df
    )
    transformed_filtered_dim_red_df = pd.DataFrame(
        transformed_filtered_dim_red_df, index=original_filtered_df.index
    )

    transformed_sticky_df = transformed_filtered_df.loc[settings.stickyItemIndexes]
    if (
        transformed_sticky_df.shape[0] >= 2
        and settings.sortAttributesBasedOnStickyItems
    ):
        std_devs = transformed_sticky_df.std()
    else:
        std_devs = transformed_filtered_df.std()

    min_dissimilarity = std_devs.min()
    max_dissimilarity = std_devs.max()
    if min_dissimilarity == max_dissimilarity:
        min_dissimilarity = 0
        max_dissimilarity = 1
    normalized_dissimilarities = (std_devs - min_dissimilarity) / (
        max_dissimilarity - min_dissimilarity
    )

    if "null_col" in transformed_filtered_df.columns:
        transformed_filtered_df = transformed_filtered_df.drop("null_col", axis=1)

    if "null_col" in transformed_filtered_dim_red_df.columns:
        transformed_filtered_dim_red_df = transformed_filtered_dim_red_df.drop(
            "null_col", axis=1
        )

    if settings.clusterAfterDimRed:
        clustering_transformed_df = transformed_filtered_dim_red_df
    else:
        clustering_transformed_df = transformed_filtered_df

    original_filtered_df_dropped = drop_columns(
        original_filtered_df,
        settings.itemNamesColumnName,
        settings.collectionColumnNames,
    )

    heatmap_json = HeatmapJSON()
    heatmap_json.attributeDissimilarities = normalized_dissimilarities.tolist()
    heatmap_json.attributeNames = list(original_filtered_df_dropped.columns)

    heatmap_json.maxHeatmapValue = original_filtered_df_dropped.max().max()
    heatmap_json.minHeatmapValue = original_filtered_df_dropped.min().min()
    heatmap_json.maxDimRedXValue = transformed_filtered_dim_red_df[0].max()
    heatmap_json.minDimRedXValue = transformed_filtered_dim_red_df[0].min().min()
    heatmap_json.maxDimRedYValue = transformed_filtered_dim_red_df[1].max()
    heatmap_json.minDimRedYValue = transformed_filtered_dim_red_df[1].min().min()

    filtered_collection_column_names = [
        col
        for col in settings.collectionColumnNames
        if col in original_filtered_df.columns
    ]
    if not settings.clusterByCollections:

        original_filtered_df = original_filtered_df.drop(
            filtered_collection_column_names, axis=1
        )
        filtered_collection_column_names = []

    logger.info(f"Dim reduction done: {round(time.perf_counter() - start,3 )}")
    logger.info("Starting clustering...")

    item_names_and_data = cluster_items_recursively(
        original_filtered_df,
        clustering_transformed_df,
        transformed_filtered_dim_red_df,
        settings.clusterSize,
        settings.itemNamesColumnName,
        settings.clusterByCollections,
        filtered_collection_column_names,
        level=0,
    )

    if item_names_and_data is None:
        raise Exception("No items in cluster")

    heatmap_json.itemNamesAndData = item_names_and_data

    logger.info(f"Clustering done: {round(time.perf_counter() - start, 3)}")
    logger.info("Starting to generate json...")
    start = time.perf_counter()

    heatmap_json_str = heatmap_json.generate_json()

    logger.info(f"Generating JSON Done: {round(time.perf_counter() - start, 3)}")

    return heatmap_json_str
