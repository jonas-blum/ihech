from typing import List, Union
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans

from helpers import drop_columns


data_index_map = {
    "row_index": 0,
    "parent_index": 1,
    "row_id": 2,
    "row_name": 3,
    "amount_of_data_points": 4,
    "dim_reduction_x": 5,
    "dim_reduction_y": 6,
}

# row_index: number, parent_index: number, row_id: string, row_name: string, amount_of_data_points: number, dim_reduction_x: number, dim_reduction_y: number, ...tags: number[]


def all_rows_same(df):
    return (df == df.iloc[0]).all().all()


def cluster_documents_recursively(
    original_df: pd.DataFrame,
    transformed_df: pd.DataFrame,
    dim_red_df: pd.DataFrame,
    data: List[List[Union[float, str]]],
    cluster_size: int,
    parent_index: int,
    ids_column_name: str,
    row_names_column_name: str,
    cluster_by_collections: bool = False,
    collection_column_names: List[str] = None,
) -> None:

    if cluster_by_collections and len(collection_column_names) > 0:
        index_aggregated = parent_index + 1
        collection_column_name = collection_column_names[0]
        for collection, orig_group_df in original_df.groupby(collection_column_name):
            trans_group_df = transformed_df[
                transformed_df[collection_column_name] == collection
            ]
            dim_red_temp_df = dim_red_df[collection_column_name] == collection

            orig_temp_df = orig_group_df.drop(collection_column_name, axis=1)
            trans_temp_df = trans_group_df.drop(collection_column_name, axis=1)
            dim_red_temp_df = dim_red_temp_df.drop(collection_column_name, axis=1)

            remaining_collection_column_names = collection_column_names[1:]

            tag_data_aggregated = (
                drop_columns(
                    orig_temp_df,
                    row_names_column_name,
                    remaining_collection_column_names,
                )
                .mean()
                .tolist()
            )
            dim_reduction_aggregated = dim_red_temp_df.mean().tolist()

            new_row_name = collection_column_name + " " + str(orig_group_df.shape[0])
            new_data_aggregated = [
                index_aggregated,
                parent_index,
                np.nan,
                f"{new_row_name}",
                orig_group_df.shape[0],
                dim_reduction_aggregated[0],
                dim_reduction_aggregated[1],
            ] + tag_data_aggregated

            data.append(new_data_aggregated)

            cluster_documents_recursively(
                orig_temp_df,
                trans_temp_df,
                dim_red_temp_df,
                data,
                cluster_size,
                index_aggregated,
                ids_column_name,
                row_names_column_name,
                cluster_by_collections,
                collection_column_names[1:],
            )

            index_aggregated += orig_group_df.shape[0]

    if original_df.shape[0] <= cluster_size or all_rows_same(transformed_df):
        if original_df.shape[0] == 0:
            return None
        if original_df.shape[0] == 1:
            tag_data = (
                drop_columns(original_df, row_names_column_name, []).iloc[0].tolist()
            )
            dim_reduction = dim_red_df.iloc[0].tolist()

            new_row_name = str(original_df.iloc[0][row_names_column_name])

            new_row_id = original_df.index[0]

            new_data = [
                parent_index + 1,
                parent_index,
                new_row_id,
                f"{new_row_name}",
                1,
                dim_reduction[0],
                dim_reduction[1],
            ] + tag_data

            data.append(new_data)

        tag_data_aggregated = (
            drop_columns(original_df, row_names_column_name, []).mean().tolist()
        )
        dim_reduction_aggregated = dim_red_df.mean().tolist()
        index_aggregated = parent_index + 1

        new_row_name = str(original_df.shape[0])
        new_data_aggregated = [
            index_aggregated,
            parent_index,
            np.nan,
            f"{new_row_name}",
            original_df.shape[0],
            dim_reduction_aggregated[0],
            dim_reduction_aggregated[1],
        ] + tag_data_aggregated

        data.append(new_data_aggregated)

        for i in range(original_df.shape[0]):
            tag_data = (
                drop_columns(original_df, row_names_column_name, []).iloc[i].tolist()
            )
            dim_reduction = dim_red_df.iloc[i].tolist()

            new_row_name = str(original_df.iloc[i][row_names_column_name])

            new_row_id = original_df.index[i]

            new_data = [
                index_aggregated + i + 1,
                index_aggregated,
                new_row_id,
                f"{new_row_name}",
                1,
                dim_reduction[0],
                dim_reduction[1],
            ] + tag_data

            data.append(new_data)

        return None

    else:
        n_clusters = cluster_size
        kmeans = KMeans(n_clusters=n_clusters, random_state=9283, n_init=1)
        labels = kmeans.fit_predict(transformed_df)

        original_df.loc[:, "cluster"] = labels
        transformed_df.loc[:, "cluster"] = labels
        dim_red_df.loc[:, "cluster"] = labels

        index_aggregated = parent_index + 1
        for counter, cluster_id in enumerate(sorted(original_df["cluster"].unique())):
            transformed_cluster_df = transformed_df[
                transformed_df["cluster"] == cluster_id
            ].drop("cluster", axis=1)
            original_cluster_df = original_df[
                original_df["cluster"] == cluster_id
            ].drop("cluster", axis=1)
            dim_red_cluster_df = dim_red_df[dim_red_df["cluster"] == cluster_id].drop(
                "cluster", axis=1
            )

            if (
                original_cluster_df.shape[0] <= 0
                or original_cluster_df.shape[0] == original_df.shape[0]
            ):
                print("Skipping cluster with 0 or all documents")
                continue

            tag_data_aggregated = (
                drop_columns(original_cluster_df, row_names_column_name, [])
                .mean()
                .tolist()
            )
            dim_reduction_aggregated = dim_red_cluster_df.mean().tolist()

            new_row_name = str(original_cluster_df.shape[0])
            new_data_aggregated = [
                index_aggregated,
                parent_index,
                np.nan,
                f"{new_row_name}",
                original_cluster_df.shape[0],
                dim_reduction_aggregated[0],
                dim_reduction_aggregated[1],
            ] + tag_data_aggregated

            data.append(new_data_aggregated)

            cluster_documents_recursively(
                original_cluster_df,
                transformed_cluster_df,
                dim_red_cluster_df,
                data,
                cluster_size,
                index_aggregated,
                ids_column_name,
                row_names_column_name,
            )

            index_aggregated += original_cluster_df.shape[0]
