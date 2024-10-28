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
from clustering_functions import cluster_items_recursively


logger = logging.getLogger("IHECH Logger")


def sort_attributes(
    original_df: pd.DataFrame,
    scaled_df: pd.DataFrame,
    settings: HeatmapSettings,
) -> Tuple[pd.DataFrame, pd.DataFrame]:

    original_dropped_df = drop_columns(
        original_df,
        settings.itemNamesColumnName,
        settings.collectionColumnNames,
    )
    original_df_to_sort = original_dropped_df

    additional_columns = list(
        set(
            [
                settings.itemNamesColumnName,
            ]
            + settings.collectionColumnNames
        )
    )

    if settings.sortAttributesBasedOnStickyItems:
        sticky_df = original_dropped_df.loc[settings.stickyItemIndexes]
        if not sticky_df.empty:
            original_df_to_sort = sticky_df
    if settings.sortOrderAttributes == "ASC":
        column_means = original_df_to_sort.mean()
        sorted_columns = column_means.sort_values().index

        scaled_df = scaled_df[sorted_columns]
        original_df = original_df[list(sorted_columns) + additional_columns]
    elif settings.sortOrderAttributes == "DESC":
        column_means = original_df_to_sort.mean()
        sorted_columns = column_means.sort_values(ascending=False).index

        scaled_df = scaled_df[sorted_columns]
        original_df = original_df[list(sorted_columns) + additional_columns]

    elif settings.sortOrderAttributes == "ALPHABETICAL":
        scaled_df = scaled_df.sort_index(axis=1)
        original_df = original_df.sort_index(axis=1)
    elif settings.sortOrderAttributes == "HETEROGENIC":
        if original_df_to_sort.shape[0] < 2:
            original_df_to_sort = original_dropped_df
        std_devs = original_df_to_sort.std()
        col_std_map = {
            col: std_val for col, std_val in zip(original_df_to_sort.columns, std_devs)
        }
        sorted_columns = sorted(col_std_map, key=col_std_map.get, reverse=True)

        scaled_df = scaled_df[sorted_columns]
        original_df = original_df[list(sorted_columns) + additional_columns]
    elif settings.sortOrderAttributes == "HOMOGENIC":
        if original_df_to_sort.shape[0] < 2:
            original_df_to_sort = original_dropped_df
        std_devs = original_df_to_sort.std()
        col_std_map = {
            col: std_val for col, std_val in zip(original_df_to_sort.columns, std_devs)
        }
        sorted_columns = sorted(col_std_map, key=col_std_map.get, reverse=False)

        scaled_df = scaled_df[sorted_columns]
        original_df = original_df[list(sorted_columns) + additional_columns]
    else:
        raise ValueError(
            "SortOrderColumns not implemented: " + str(settings.sortOrderAttributes)
        )
    return original_df, scaled_df


def filter_attributes_and_items(
    original_df: pd.DataFrame, settings: HeatmapSettings
) -> pd.DataFrame:

    original_df = original_df.loc[settings.selectedItemIndexes]

    extracted_columns = extract_columns(
        original_df,
        settings.itemNamesColumnName,
        settings.collectionColumnNames,
    )

    valid_columns = [
        col for col in settings.selectedAttributes if col in original_df.columns
    ]

    original_df = original_df[valid_columns]

    for col in valid_columns:
        original_df[col] = pd.to_numeric(original_df[col], errors="coerce")

    original_df = original_df.dropna(axis=1, how="all")

    medians = original_df.median()
    original_df = original_df.fillna(medians)

    if original_df.empty:
        raise ValueError("No attributes left after filtering")

    original_df = pd.concat([extracted_columns, original_df], axis=1)
    return original_df


def do_scaling(
    original_filtered_df: pd.DataFrame,
    all_data_df: pd.DataFrame,
    settings: HeatmapSettings,
) -> pd.DataFrame:

    if settings.scaling == "NO_SCALING":
        return original_filtered_df
    elif settings.scaling == "STANDARDIZING":
        scaler = StandardScaler()
        fitted_scaler = scaler.fit(all_data_df)
        scaled_df = fitted_scaler.transform(original_filtered_df)
        scaled_df = pd.DataFrame(
            scaled_df,
            index=original_filtered_df.index,
            columns=original_filtered_df.columns,
        )
        return scaled_df
    else:
        raise ValueError("Invalid absRelLog value")


def create_heatmap(
    original_df: pd.DataFrame, settings: HeatmapSettings, start_heatmap: float
) -> HeatmapJSON:
    logger.info("Starting Filtering...")
    start_filtering = start_heatmap

    settings.stickyAttributes = [
        attr for attr in settings.stickyAttributes if attr in original_df.columns
    ]
    settings.stickyItemIndexes = [
        index for index in settings.stickyItemIndexes if index in original_df.index
    ]

    original_filtered_df = filter_attributes_and_items(original_df, settings)

    original_filtered_dropped = drop_columns(
        original_filtered_df,
        settings.itemNamesColumnName,
        settings.collectionColumnNames,
    )

    all_data_df = original_df[original_filtered_dropped.columns]
    all_data_df_medians = all_data_df.median()
    all_data_df = all_data_df.fillna(all_data_df_medians)

    scaled_filtered_df = do_scaling(original_filtered_dropped, all_data_df, settings)

    original_filtered_df, scaled_filtered_df = sort_attributes(
        original_filtered_df, scaled_filtered_df, settings
    )

    if settings.clusterItemsBasedOnStickyAttributes:
        sticky_columns = [
            col
            for col in settings.stickyAttributes
            if col in scaled_filtered_df.columns
        ]
        scaled_filtered_sticky_df = scaled_filtered_df[sticky_columns]
        if not scaled_filtered_sticky_df.empty:
            scaled_filtered_df = scaled_filtered_sticky_df
        else:
            logger.warning("No sticky attributes found in cleaned dataframe")

    logger.info(
        f"Filtering and sorting done: {round(time.perf_counter() - start_filtering, 2)}"
    )
    logger.info(
        "Number of attributes before filtering selected: "
        + str(len(settings.selectedAttributes))
    )
    logger.info(
        "Number of attributes after filtering: "
        + str(original_filtered_df.shape[1] - len(settings.collectionColumnNames) - 1)
    )
    logger.info(
        "Number of items before filtering selected: "
        + str(len(settings.selectedItemIndexes))
    )
    logger.info(
        "Number of items after filtering: " + str(original_filtered_df.shape[0])
    )

    logger.info("Starting dim reduction...")
    start_dim_red = time.perf_counter()

    if scaled_filtered_df.shape[1] == 1:
        scaled_filtered_df["null_col"] = 1

    if settings.dimReductionAlgo == "UMAP":
        dim_reduction = UMAP(n_components=2, random_state=42)
        dim_red_df = dim_reduction.fit_transform(scaled_filtered_df)
    elif settings.dimReductionAlgo == "TSNE":
        dim_reduction = TSNE(n_components=2, random_state=42)
        dim_red_df = dim_reduction.fit_transform(scaled_filtered_df)
    elif settings.dimReductionAlgo == "PCA":
        dim_reduction = PCA(n_components=2, random_state=42)
        dim_red_df = dim_reduction.fit_transform(scaled_filtered_df)
        explained_variance = dim_reduction.explained_variance_ratio_
        logger.info(f"Explained variance by component: {explained_variance}")
        logger.info(f"Total variance explained: {sum(explained_variance) * 100:.2f}%")
    else:
        raise ValueError("Invalid dim reduction algorithm")

    dim_red_df = pd.DataFrame(dim_red_df, index=original_filtered_df.index)

    original_filtered_df_dropped = drop_columns(
        original_filtered_df,
        settings.itemNamesColumnName,
        settings.collectionColumnNames,
    )

    if (
        len(settings.stickyItemIndexes) >= 2
        and settings.sortAttributesBasedOnStickyItems
    ):
        original_dropped_sticky_df = original_filtered_df_dropped.loc[
            settings.stickyItemIndexes
        ]
        std_devs = original_dropped_sticky_df.std()
    else:
        std_devs = original_filtered_df_dropped.std()

    min_dissimilarity = std_devs.min()
    max_dissimilarity = std_devs.max()
    if min_dissimilarity == max_dissimilarity:
        min_dissimilarity = 0
        max_dissimilarity = 1
    normalized_dissimilarities = (std_devs - min_dissimilarity) / (
        max_dissimilarity - min_dissimilarity
    )

    if "null_col" in scaled_filtered_df.columns:
        scaled_filtered_df = scaled_filtered_df.drop("null_col", axis=1)

    if "null_col" in dim_red_df.columns:
        dim_red_df = dim_red_df.drop("null_col", axis=1)

    if settings.clusterAfterDimRed:
        scaled_filtered_df = dim_red_df.copy()

    heatmap_json = HeatmapJSON()
    heatmap_json.attributeDissimilarities = normalized_dissimilarities.tolist()
    heatmap_json.attributeNames = [
        attr.replace("\n", " ") for attr in original_filtered_df_dropped.columns
    ]

    heatmap_json.maxHeatmapValue = original_filtered_df_dropped.max().max()
    heatmap_json.minHeatmapValue = original_filtered_df_dropped.min().min()
    heatmap_json.maxDimRedXValue = dim_red_df[0].max()
    heatmap_json.minDimRedXValue = dim_red_df[0].min().min()
    heatmap_json.maxDimRedYValue = dim_red_df[1].max()
    heatmap_json.minDimRedYValue = dim_red_df[1].min().min()
    heatmap_json.minAttributeValues = original_filtered_df_dropped.min().tolist()
    heatmap_json.maxAttributeValues = original_filtered_df_dropped.max().tolist()

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

    logger.info(f"Dim reduction done: {round(time.perf_counter() - start_dim_red, 2)}")
    logger.info("Starting clustering...")
    start_clustering = time.perf_counter()

    cluster_column = pd.DataFrame(
        {"cluster": [-1] * len(original_filtered_df)}, index=original_filtered_df.index
    )
    original_filtered_df = pd.concat([original_filtered_df, cluster_column], axis=1)

    # Copying dataframes so they are "clean" in memory
    original_filtered_df = original_filtered_df.copy()
    original_filtered_df_dropped = original_filtered_df_dropped.copy()
    scaled_filtered_df = scaled_filtered_df.copy()
    dim_red_df = dim_red_df.copy()

    heatmap_data=[]
    item_names_and_data = cluster_items_recursively(
        heatmap_data,
        original_filtered_df,
        original_filtered_df_dropped,
        scaled_filtered_df,
        dim_red_df,
        settings.clusterSize,
        settings.itemNamesColumnName,
        settings.clusterByCollections,
        filtered_collection_column_names,
        level=0,
    )

    if item_names_and_data is None:
        raise Exception("No items in cluster")

    heatmap_json.hierarchicalItems = item_names_and_data
    heatmap_json.heatmapData = heatmap_data

    logger.info(f"Clustering done: {round(time.perf_counter() - start_clustering, 2)}")

    return heatmap_json
