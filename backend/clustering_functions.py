import logging
import time
from typing import List, Union
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.exceptions import ConvergenceWarning
from helpers import drop_columns
from heatmap_types import ItemNameAndData
import warnings


warnings.simplefilter("ignore", ConvergenceWarning)

logger = logging.getLogger("IHECH Logger")


def all_rows_same(df):
    return (df == df.iloc[0]).all().all()


def cluster_items_recursively(
    original_df: pd.DataFrame,
    scaled_df: pd.DataFrame,
    dim_red_df: pd.DataFrame,
    cluster_size: int,
    item_names_column_name: str,
    cluster_by_collections: bool,
    collection_column_names: List[str],
    level: int = 0,
) -> Union[List[ItemNameAndData], None]:

    original_df_dropped = drop_columns(
        original_df, item_names_column_name, collection_column_names
    )

    is_open = False

    if cluster_by_collections and len(collection_column_names) > 0:
        new_item_names_and_data: List[ItemNameAndData] = []
        collection_column_name = collection_column_names[0]
        for collection, original_group_df in original_df.groupby(
            collection_column_name
        ):
            remaining_collection_column_names = collection_column_names[1:]

            scaled_temp_df = scaled_df.loc[original_group_df.index]
            dim_red_temp_df = dim_red_df.loc[original_group_df.index]
            original_temp_df_dropped = original_df_dropped.loc[original_group_df.index]
            original_temp_df = original_group_df.drop(collection_column_name, axis=1)

            tag_data_aggregated = original_temp_df_dropped.mean().tolist()

            dim_reduction_aggregated = dim_red_temp_df.mean().tolist()
            new_item_name = str(collection) + " " + str(original_group_df.shape[0])

            if (
                original_group_df.shape[0] == 1
                and len(remaining_collection_column_names) == 0
            ):
                solo_child_name = str(original_group_df.iloc[0][item_names_column_name])
                solo_child_data = (
                    original_group_df.drop(collection_column_name, axis=1)
                    .iloc[0]
                    .tolist()
                )
                new_children = [
                    ItemNameAndData(
                        index=original_group_df.index[0],
                        itemName=solo_child_name,
                        isOpen=is_open,
                        data=solo_child_data,
                        amountOfDataPoints=1,
                        dimReductionX=dim_red_df.loc[original_group_df.index].iloc[0][
                            0
                        ],
                        dimReductionY=dim_red_df.loc[original_group_df.index].iloc[0][
                            1
                        ],
                        children=None,
                    )
                ]
            else:
                new_children = cluster_items_recursively(
                    original_temp_df,
                    scaled_temp_df,
                    dim_red_temp_df,
                    cluster_size,
                    item_names_column_name,
                    cluster_by_collections,
                    remaining_collection_column_names,
                    level + 1,
                )

            new_item_name_and_data = ItemNameAndData(
                index=None,
                itemName=new_item_name,
                isOpen=is_open,
                data=tag_data_aggregated,
                amountOfDataPoints=original_group_df.shape[0],
                dimReductionX=dim_reduction_aggregated[0],
                dimReductionY=dim_reduction_aggregated[1],
                children=new_children,
            )

            new_item_names_and_data.append(new_item_name_and_data)

        return new_item_names_and_data

    if original_df.shape[0] <= cluster_size or all_rows_same(scaled_df):
        if original_df.shape[0] == 0:
            raise Exception("No items in cluster")
        if original_df.shape[0] == 1:
            raise Exception("Only one item in cluster")

        new_item_names_and_data: List[ItemNameAndData] = []

        for i in range(original_df.shape[0]):
            new_item_name = str(original_df.iloc[i][item_names_column_name])

            new_item_name_and_data = ItemNameAndData(
                index=original_df.index[i],
                itemName=new_item_name,
                isOpen=is_open,
                data=original_df_dropped.iloc[i].tolist(),
                amountOfDataPoints=1,
                dimReductionX=dim_red_df.iloc[i][0],
                dimReductionY=dim_red_df.iloc[i][1],
                children=None,
            )

            new_item_names_and_data.append(new_item_name_and_data)

        return new_item_names_and_data

    else:
        n_clusters = cluster_size
        kmeans = KMeans(n_clusters=n_clusters, random_state=9283, n_init=1)
        labels = kmeans.fit_predict(scaled_df)

        original_df.loc[:, "cluster"] = labels

        new_item_names_and_data: List[ItemNameAndData] = []
        for cluster_id in sorted(original_df["cluster"].unique()):
            original_cluster_df = original_df[
                original_df["cluster"] == cluster_id
            ].drop("cluster", axis=1)

            scaled_cluster_df = scaled_df.loc[original_cluster_df.index]
            original_cluster_df_dropped = original_df_dropped.loc[
                original_cluster_df.index
            ]

            dim_red_cluster_df = dim_red_df.loc[original_cluster_df.index]

            if (
                original_cluster_df.shape[0] <= 0
                or original_cluster_df.shape[0] == original_df.shape[0]
            ):
                continue

            if original_cluster_df.shape[0] == 1:
                new_item_name = str(original_cluster_df.iloc[0][item_names_column_name])
                new_data = original_cluster_df_dropped.iloc[0].tolist()
                new_item_name_and_data = ItemNameAndData(
                    index=original_cluster_df.index[0],
                    itemName=new_item_name,
                    isOpen=is_open,
                    data=new_data,
                    amountOfDataPoints=1,
                    dimReductionX=dim_red_cluster_df.iloc[0][0],
                    dimReductionY=dim_red_cluster_df.iloc[0][1],
                    children=None,
                )
                new_item_names_and_data.append(new_item_name_and_data)
                continue

            tag_data_aggregated = original_cluster_df_dropped.mean().tolist()
            dim_reduction_aggregated = dim_red_cluster_df.mean().tolist()
            new_item_name = str(original_cluster_df.shape[0])

            children = cluster_items_recursively(
                original_cluster_df,
                scaled_cluster_df,
                dim_red_cluster_df,
                cluster_size,
                item_names_column_name,
                cluster_by_collections,
                collection_column_names,
                level + 1,
            )

            new_aggregated_item_name_and_data = ItemNameAndData(
                index=None,
                itemName=new_item_name,
                isOpen=is_open,
                data=tag_data_aggregated,
                amountOfDataPoints=original_cluster_df.shape[0],
                dimReductionX=dim_reduction_aggregated[0],
                dimReductionY=dim_reduction_aggregated[1],
                children=children,
            )
            new_item_names_and_data.append(new_aggregated_item_name_and_data)

        return new_item_names_and_data
