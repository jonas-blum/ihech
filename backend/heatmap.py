import time
from typing import Tuple
import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.discriminant_analysis import StandardScaler
from backend.clustering_functions import cluster_documents_recursively
from umap import UMAP
from backend.types import HeatmapJSON, HeatmapSettings
from sklearn.manifold import TSNE


def sort_columns(
    original_df: pd.DataFrame,
    transformed_df: pd.DataFrame,
    settings: HeatmapSettings,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    transformed_df_to_sort = transformed_df

    if settings.sortColumnsBasedOnStickyRows:
        sticky_df = transformed_df.loc[settings.selectedRowIds,]
        if sticky_df.shape[0] > 0:
            transformed_df_to_sort = sticky_df
    if settings.sortOrderColumns == "ASC":
        column_means = transformed_df_to_sort.mean()
        sorted_columns = column_means.sort_values().index

        transformed_df = transformed_df[sorted_columns]
        original_df = original_df[sorted_columns]
    elif settings.sortOrderColumns == "DESC":
        column_means = transformed_df_to_sort.mean()
        sorted_columns = column_means.sort_values(ascending=False).index

        transformed_df = transformed_df[sorted_columns]
        original_df = original_df[sorted_columns]
    # elif settings.sortOrderColumns == "CLUSTER":
    #     column_means = transformed_df_to_sort.mean().values.reshape(-1, 1)
    #     n_clusters = max(1, len(transformed_df_to_sort.columns) // 10)
    #     kmeans = KMeans(n_clusters=n_clusters, random_state=0).fit(column_means)
    #     clusters = kmeans.labels_
    #     cluster_means = transformed_df_to_sort.mean()
    #     cluster_df = pd.DataFrame(
    #         {"column": transformed_df_to_sort.columns, "cluster": clusters}
    #     )
    #     cluster_df["cluster_mean"] = cluster_df["column"].apply(
    #         lambda x: cluster_means[x]
    #     )
    #     aggregated_cluster_means = cluster_df.groupby("cluster")["cluster_mean"].mean()
    #     sorted_clusters = aggregated_cluster_means.sort_values(ascending=False).index
    #     sorted_columns = (
    #         cluster_df.set_index("cluster")
    #         .loc[sorted_clusters]
    #         .sort_values("cluster_mean", ascending=False)["column"]
    #     )

    #     original_df = original_df[sorted_columns]
    #     transformed_df = transformed_df[sorted_columns]
    elif settings.sortOrderColumns == "ALPHABETICAL":
        transformed_df = transformed_df.sort_index(axis=1)
        original_df = original_df.sort_index(axis=1)
    elif settings.sortOrderColumns == "STDEV":
        if transformed_df_to_sort.shape[0] < 2:
            transformed_df_to_sort = transformed_df
        std_devs = transformed_df_to_sort.std()
        col_std_map = {
            col: std_val
            for col, std_val in zip(transformed_df_to_sort.columns, std_devs)
        }
        sorted_columns = sorted(col_std_map, key=col_std_map.get, reverse=True)

        transformed_df = transformed_df[sorted_columns]
        original_df = original_df[sorted_columns]
    else:
        raise ValueError(
            "SortOrderColumns not implemented: " + str(settings.sortOrderColumns)
        )
    return original_df, transformed_df


def createHeatmap(original_df: pd.DataFrame, settings: HeatmapSettings) -> HeatmapJSON:

    if settings.absRelLog == "REL":
        row_maxes = original_df.max(axis=1)
        transformed_df = original_df.div(row_maxes, axis=0)
    elif settings.absRelLog == "LOG":
        transformed_df = np.log(original_df + 1)
    elif settings.absRelLog == "ABS":
        transformed_df = original_df
    else:
        raise ValueError("Invalid absRelLog value")

    valid_columns = [
        col for col in settings.selectedColumns if col in original_df.columns
    ]
    if len(valid_columns) == 1:
        original_df = original_df[valid_columns]
        transformed_df = transformed_df[valid_columns]
        transformed_df["null_col"] = 1
        original_df["null_col"] = 1
    elif len(valid_columns) >= 2:
        original_df = original_df[valid_columns]
        transformed_df = transformed_df[valid_columns]
    else:
        print("Not enough columns to display")

    original_df, transformed_df = sort_columns(original_df, transformed_df, settings)

    original_filtered_df = original_df.loc[:, (original_df != 0).any(axis=0)]
    transformed_filtered_df = transformed_df.loc[:, (transformed_df != 0).any(axis=0)]

    if settings.clusterRowsBasedOnStickyColumns:
        sticky_columns = [
            col
            for col in settings.stickyColumns
            if col in transformed_filtered_df.columns
        ]
        if len(sticky_columns) == 1:
            transformed_filtered_df = transformed_filtered_df[sticky_columns]
            transformed_filtered_df["null_col"] = 1
        elif len(sticky_columns) >= 2:
            transformed_filtered_df = transformed_filtered_df[sticky_columns]
        else:
            print("Not enough sticky attributes to cluster, need at least 2")

    if settings.dimReductionAlgo == "UMAP":
        dim_reduction = UMAP(n_components=2, random_state=42)
    elif settings.dimReductionAlgo == "TSNE":
        dim_reduction = TSNE(n_components=2, random_state=42)
    elif settings.dimReductionAlgo == "PCA":
        dim_reduction = PCA(n_components=2, random_state=42)
    else:
        raise ValueError("Invalid dim reduction algorithm")

    scaler = StandardScaler()

    transformed_filtered_dim_red_df = scaler.fit_transform(transformed_filtered_df)
    transformed_filtered_dim_red_df = dim_reduction.fit_transform(
        transformed_filtered_dim_red_df
    )
    transformed_filtered_dim_red_df = pd.DataFrame(
        transformed_filtered_dim_red_df, index=original_filtered_df.index
    )

    transformed_sticky_df = transformed_df.loc[settings.selectedRowIds,]
    if transformed_sticky_df.shape[0] >= 2 and settings.sortColumnsBasedOnStickyRows:
        std_devs = transformed_sticky_df.std()
    else:
        std_devs = transformed_df.std()

    min_dissimilarity = std_devs.min()
    max_dissimilarity = std_devs.max()
    if min_dissimilarity == max_dissimilarity:
        min_dissimilarity = 0
        max_dissimilarity = 1
    normalized_dissimilarities = (std_devs - min_dissimilarity) / (
        max_dissimilarity - min_dissimilarity
    )

    if "null_col" in original_filtered_df.columns:
        original_filtered_df = original_filtered_df.drop("null_col", axis=1)

    if "null_col" in transformed_filtered_dim_red_df.columns:
        transformed_filtered_dim_red_df = transformed_filtered_dim_red_df.drop(
            "null_col", axis=1
        )

    if "null_col" in transformed_filtered_df.columns:
        transformed_filtered_df = transformed_filtered_df.drop("null_col", axis=1)

    if settings.clusterAfterDimRed:
        clustering_transformed_df = transformed_filtered_dim_red_df
    else:
        clustering_transformed_df = transformed_filtered_df

    heatmap_json = HeatmapJSON()
    heatmap_json.col_dissimilarities = normalized_dissimilarities.tolist()

    if settings.clusterByCollections:
        collection_columns = [
            col
            for col in settings.collectionColumnNames
            if col in original_filtered_df.columns
        ]

        heatmap_json.heatmap_csv = cluster_documents_recursively(
            original_filtered_df,
            clustering_transformed_df,
            transformed_filtered_dim_red_df,
            settings.clusterSize,
            0,
            True,
            collection_columns,
        )
    else:
        heatmap_json.heatmap_csv = cluster_documents_recursively(
            original_filtered_df,
            clustering_transformed_df,
            transformed_filtered_dim_red_df,
            settings.clusterSize,
            0,
            False,
            [],
        )

    return heatmap_json
