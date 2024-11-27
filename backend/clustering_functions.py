import logging
import time
from typing import List, Tuple, Union
import numpy as np
import pandas as pd
from sklearn.cluster import AgglomerativeClustering, KMeans, MiniBatchKMeans
from sklearn.exceptions import ConvergenceWarning
from heatmap_types import ItemNameAndData, HierarchicalAttribute
import warnings


warnings.simplefilter("ignore", ConvergenceWarning)

logger = logging.getLogger("IHECH Logger")

rounding_precision = 3


def all_rows_same(df):
    return (df == df.iloc[0]).all().all()


def insert_value_in_list_at_index(
    value: float, index: int, list_to_insert: List[float]
) -> List[float]:
    return list_to_insert[:index] + [value] + list_to_insert[index:]


def insert_value_in_item_name_and_data_at_index(
    value: float, index: int, item_name_and_data: ItemNameAndData
) -> None:
    item_name_and_data.data = insert_value_in_list_at_index(
        value, index, item_name_and_data.data
    )
    for child in item_name_and_data.children:
        insert_value_in_item_name_and_data_at_index(value, index, child)


def append_average_item_by_attribute_indexes(
    indexes: List[int], item_name_and_data: ItemNameAndData
) -> None:
    if item_name_and_data is None:
        return
    data = item_name_and_data.data
    avg_data = np.round(np.mean([data[i] for i in indexes]), rounding_precision)
    item_name_and_data.data.append(avg_data)
    if item_name_and_data.children is None:
        return
    for child in item_name_and_data.children:
        if child is not None:
            append_average_item_by_attribute_indexes(indexes, child)


def append_all_average_items_by_attribute_indexes(
    indexes: List[int], item_names_and_data: List[ItemNameAndData]
):
    for item_name_and_data in item_names_and_data:
        append_average_item_by_attribute_indexes(indexes, item_name_and_data)


def get_current_data_length(item_names_and_data: List[ItemNameAndData]):
    return len(item_names_and_data[0].data)


def cluster_attributes_recursively(
    rotated_scaled_raw_data_df: pd.DataFrame,
    rotated_hierarchical_columns_metadata_df: pd.DataFrame,
    rotated_column_names_df: pd.DataFrame,
    item_names_and_data: List[ItemNameAndData],
    cluster_size: int,
    cluster_by_collections: bool,
    hierarchical_column_metadata_row_indexes: List[str],
    level: int,
) -> Union[List[ItemNameAndData], None]:
    # Case: root level
    if level == 0:
        indexes = list(range(rotated_scaled_raw_data_df.shape[0]))
        append_all_average_items_by_attribute_indexes(indexes, item_names_and_data)
        new_attribute_name = f"All_Attributes {str(len(indexes))}"
        new_attribute_index = len(indexes)

        children_0 = cluster_attributes_recursively(
            rotated_scaled_raw_data_df,
            rotated_hierarchical_columns_metadata_df,
            rotated_column_names_df,
            item_names_and_data,
            cluster_size,
            cluster_by_collections,
            hierarchical_column_metadata_row_indexes,
            level + 1,
        )

        new_hierarchical_attribute = HierarchicalAttribute(
            attributeName=new_attribute_name,
            dataAttributeIndex=new_attribute_index,
            std=-1000,
            originalAttributeOrder=0,
            isOpen=True,
            children=children_0,
        )

        return [new_hierarchical_attribute]

    # Case: Cluster by collections
    if cluster_by_collections and len(hierarchical_column_metadata_row_indexes) > 0:
        new_collection_hierarchical_attributes: List[Tuple[ItemNameAndData, float]] = []
        collection_row_index = hierarchical_column_metadata_row_indexes[0]
        for (
            collection,
            rotated_hierarchical_columns_metadata_group_df,
        ) in rotated_hierarchical_columns_metadata_df.groupby(collection_row_index):
            indexes_of_current_group = (
                rotated_hierarchical_columns_metadata_group_df.index
            )
            remaining_collection_row_indexes = hierarchical_column_metadata_row_indexes[
                1:
            ]

            rotated_scaled_raw_data_group_df = rotated_scaled_raw_data_df.loc[
                indexes_of_current_group
            ]
            rotated_column_names_group_df = rotated_column_names_df.loc[
                indexes_of_current_group
            ]

            new_hierarchical_attribute_names = (
                str(collection)
                + " "
                + str(rotated_hierarchical_columns_metadata_group_df.shape[0])
            )

            if (
                rotated_hierarchical_columns_metadata_group_df.shape[0] == 1
                and len(remaining_collection_row_indexes) == 0
            ):
                solo_child_name = str(
                    rotated_column_names_df.loc[
                        rotated_hierarchical_columns_metadata_group_df.iloc[0].index
                    ]
                )
                solo_child_attribute_index = (
                    rotated_hierarchical_columns_metadata_group_df.index[0]
                )

                new_children = [
                    HierarchicalAttribute(
                        attributeName=solo_child_name,
                        dataAttributeIndex=solo_child_attribute_index,
                        std=-1000,
                        originalAttributeOrder=solo_child_attribute_index,
                        children=None,
                    )
                ]
            else:
                new_children = cluster_attributes_recursively(
                    rotated_scaled_raw_data_group_df,
                    rotated_hierarchical_columns_metadata_group_df,
                    rotated_column_names_group_df,
                    item_names_and_data,
                    cluster_size,
                    cluster_by_collections,
                    remaining_collection_row_indexes,
                    level + 1,
                )
            group_data_attribute_index = get_current_data_length(item_names_and_data)
            average_hierarchical_attribute_index = np.mean(
                indexes_of_current_group.tolist()
            )
            new_hierarchical_attribute = HierarchicalAttribute(
                attributeName=new_hierarchical_attribute_names,
                dataAttributeIndex=group_data_attribute_index,
                std=-1000,
                originalAttributeOrder=average_hierarchical_attribute_index,
                children=new_children,
            )

            new_collection_hierarchical_attributes.append(new_hierarchical_attribute)

        return new_collection_hierarchical_attributes

    # Case: Only few items left or all items are the same or cluster size set to <= 1
    if (
        rotated_scaled_raw_data_df.shape[0] <= cluster_size
        or all_rows_same(rotated_scaled_raw_data_df)
        or cluster_size <= 1
    ):
        if rotated_scaled_raw_data_df.shape[0] == 0:
            raise Exception("No attributes in cluster")
        if rotated_scaled_raw_data_df.shape[0] == 1:
            raise Exception("Only one attribute in cluster")

        new_attributes: List[HierarchicalAttribute] = []
        new_attribute_names = rotated_column_names_df.iloc[:, 0].astype(str).tolist()
        new_attribute_indexes = rotated_scaled_raw_data_df.index.tolist()

        for i in range(rotated_scaled_raw_data_df.shape[0]):
            new_attribute_index = new_attribute_indexes[i]
            new_attribute = HierarchicalAttribute(
                attributeName=new_attribute_names[i],
                dataAttributeIndex=new_attribute_index,
                std=-1000,
                originalAttributeOrder=new_attribute_index,
                isOpen=False,
                children=None,
            )

            new_attributes.append(new_attribute)

        return new_attributes

    # Case: Dynamic clustering based on item similarity
    else:
        if rotated_scaled_raw_data_df.shape[0] > 5000:
            kmeans = MiniBatchKMeans(n_clusters=cluster_size, n_init=1, random_state=42)
            labels = kmeans.fit_predict(rotated_scaled_raw_data_df)
        else:
            hierarchical = AgglomerativeClustering(
                n_clusters=cluster_size, linkage="ward"
            )
            labels = hierarchical.fit_predict(rotated_scaled_raw_data_df)

        new_clustered_hierarchical_attributes: List[HierarchicalAttribute] = []

        cluster_indices = {
            cluster_id: rotated_scaled_raw_data_df.index[labels == cluster_id]
            for cluster_id in np.unique(labels)
        }

        for _, current_cluster_indexes in cluster_indices.items():

            rotated_scaled_raw_data_cluster_df = rotated_scaled_raw_data_df.loc[
                current_cluster_indexes
            ]
            rotated_hierarchical_columns_metadata_cluster_df = (
                rotated_hierarchical_columns_metadata_df.loc[current_cluster_indexes]
            )
            rotated_column_names_cluster_df = rotated_column_names_df.loc[
                current_cluster_indexes
            ]

            if rotated_scaled_raw_data_cluster_df.shape[0] <= 0:
                continue

            if (
                rotated_scaled_raw_data_cluster_df.shape[0]
                == rotated_scaled_raw_data_df.shape[0]
            ):

                new_cluster_attribute_names = (
                    rotated_column_names_cluster_df.iloc[:, 0].astype(str).tolist()
                )

                for i in range(rotated_scaled_raw_data_cluster_df.shape[0]):
                    new_attribute = HierarchicalAttribute(
                        attributeName=new_cluster_attribute_names[i],
                        dataAttributeIndex=rotated_scaled_raw_data_cluster_df.index[i],
                        std=-1000,
                        originalAttributeOrder=rotated_scaled_raw_data_cluster_df.index[
                            i
                        ],
                        isOpen=False,
                        children=None,
                    )

                    new_clustered_hierarchical_attributes.append(new_attribute)
                continue

            if rotated_scaled_raw_data_cluster_df.shape[0] == 1:
                new_attribute_name = rotated_column_names_cluster_df.iloc[0, 0]

                new_attribute = HierarchicalAttribute(
                    attributeName=new_attribute_name,
                    dataAttributeIndex=rotated_scaled_raw_data_cluster_df.index[0],
                    std=-1000,
                    originalAttributeOrder=rotated_scaled_raw_data_cluster_df.index[0],
                    isOpen=False,
                    children=None,
                )
                new_clustered_hierarchical_attributes.append(new_attribute)
                continue

            children = cluster_attributes_recursively(
                rotated_scaled_raw_data_cluster_df,
                rotated_hierarchical_columns_metadata_cluster_df,
                rotated_column_names_cluster_df,
                item_names_and_data,
                cluster_size,
                cluster_by_collections,
                hierarchical_column_metadata_row_indexes,
                level + 1,
            )
            indices_list = list(current_cluster_indexes)
            new_index = get_current_data_length(item_names_and_data)
            append_all_average_items_by_attribute_indexes(
                indices_list, item_names_and_data
            )
            average_index = np.mean(indices_list)
            new_hierarchical_attribute_name = str(
                rotated_scaled_raw_data_cluster_df.shape[0]
            )
            new_hierarchical_attribute = HierarchicalAttribute(
                attributeName=new_hierarchical_attribute_name,
                dataAttributeIndex=new_index,
                std=-1000,
                originalAttributeOrder=average_index,
                isOpen=False,
                children=children,
            )
            new_clustered_hierarchical_attributes.append(new_hierarchical_attribute)

        return new_clustered_hierarchical_attributes


def cluster_items_recursively(
    raw_data_df: pd.DataFrame,
    hierarchical_rows_metadata_df: pd.DataFrame,
    item_names_df: pd.DataFrame,
    scaled_raw_data_df: pd.DataFrame,
    dim_red_df: pd.DataFrame,
    cluster_size: int,
    cluster_by_collections: bool,
    hierarchical_rows_metadata_column_names: List[str],
    level: int,
) -> Union[List[ItemNameAndData], None]:
    # Case: root level
    if level == 0:
        tag_data_0_aggregated_mean = raw_data_df.mean()
        tag_data_0_aggregated = np.round(
            tag_data_0_aggregated_mean, rounding_precision
        ).tolist()
        dim_reduction_0_aggregated = np.round(
            dim_red_df.mean(), rounding_precision
        ).tolist()

        new_item_name_0 = str(raw_data_df.shape[0])

        children_0 = cluster_items_recursively(
            raw_data_df,
            hierarchical_rows_metadata_df,
            item_names_df,
            scaled_raw_data_df,
            dim_red_df,
            cluster_size,
            cluster_by_collections,
            hierarchical_rows_metadata_column_names,
            level + 1,
        )

        new_aggregated_item_name_and_data = ItemNameAndData(
            index=None,
            itemName=new_item_name_0,
            isOpen=True,
            data=tag_data_0_aggregated,
            amountOfDataPoints=raw_data_df.shape[0],
            dimReductionX=dim_reduction_0_aggregated[0],
            dimReductionY=dim_reduction_0_aggregated[1],
            children=children_0,
        )

        return [new_aggregated_item_name_and_data]

    is_open = False

    # Case: Cluster by collections
    if cluster_by_collections and len(hierarchical_rows_metadata_column_names) > 0:
        new_collection_item_names_and_data: List[Tuple[ItemNameAndData, float]] = []
        collection_column_name = hierarchical_rows_metadata_column_names[0]
        for (
            collection,
            hierarchical_rows_metadata_group_df,
        ) in hierarchical_rows_metadata_df.groupby(collection_column_name):
            indexes_of_current_group = hierarchical_rows_metadata_group_df.index
            remaining_collection_column_names = hierarchical_rows_metadata_column_names[
                1:
            ]

            raw_data_group_df = raw_data_df.loc[indexes_of_current_group]
            scaled_raw_data_group_df = scaled_raw_data_df.loc[indexes_of_current_group]
            dim_red_group_df = dim_red_df.loc[indexes_of_current_group]
            item_names_group_df = item_names_df.loc[indexes_of_current_group]

            tag_data_aggregated = np.round(
                hierarchical_rows_metadata_group_df.mean(), rounding_precision
            ).tolist()

            dim_reduction_aggregated = np.round(
                dim_red_group_df.mean(), rounding_precision
            ).tolist()
            new_item_name = (
                str(collection)
                + " "
                + str(hierarchical_rows_metadata_group_df.shape[0])
            )

            if (
                raw_data_group_df.shape[0] == 1
                and len(remaining_collection_column_names) == 0
            ):
                solo_child_name = str(
                    item_names_df.loc[hierarchical_rows_metadata_group_df.iloc[0].index]
                )
                solo_child_data = np.round(
                    raw_data_group_df.iloc[0], rounding_precision
                ).tolist()
                new_children = [
                    ItemNameAndData(
                        index=raw_data_group_df.index[0],
                        itemName=solo_child_name,
                        isOpen=is_open,
                        data=solo_child_data,
                        amountOfDataPoints=1,
                        dimReductionX=np.round(
                            dim_red_group_df.iloc[0][0],
                            rounding_precision,
                        ),
                        dimReductionY=np.round(
                            dim_red_group_df.iloc[0][1],
                            rounding_precision,
                        ),
                        children=None,
                    )
                ]
            else:
                new_children = cluster_items_recursively(
                    raw_data_group_df,
                    hierarchical_rows_metadata_group_df,
                    item_names_group_df,
                    scaled_raw_data_group_df,
                    dim_red_group_df,
                    cluster_size,
                    cluster_by_collections,
                    remaining_collection_column_names,
                    level + 1,
                )

            new_item_name_and_data = ItemNameAndData(
                index=None,
                itemName=new_item_name,
                isOpen=is_open,
                data=tag_data_aggregated,
                amountOfDataPoints=hierarchical_rows_metadata_group_df.shape[0],
                dimReductionX=dim_reduction_aggregated[0],
                dimReductionY=dim_reduction_aggregated[1],
                children=new_children,
            )

            new_collection_item_names_and_data.append(new_item_name_and_data)

        return new_collection_item_names_and_data

    # Case: Only few items left or all items are the same or cluster size set to <= 1
    if (
        raw_data_df.shape[0] <= cluster_size
        or all_rows_same(scaled_raw_data_df)
        or cluster_size <= 1
    ):
        if raw_data_df.shape[0] == 0:
            raise Exception("No items in cluster")
        if raw_data_df.shape[0] == 1:
            raise Exception("Only one item in cluster")

        new_item_names_and_data: List[Tuple[ItemNameAndData, float]] = []
        new_item_names = item_names_df[item_names_df.columns[0]].astype(str).tolist()
        dimReductionsX = np.round(dim_red_df[0], rounding_precision).tolist()
        dimReductionsY = np.round(dim_red_df[1], rounding_precision).tolist()
        all_data = np.round(raw_data_df.values, rounding_precision).tolist()

        for i in range(raw_data_df.shape[0]):

            new_item_name_and_data = ItemNameAndData(
                index=raw_data_df.index[i],
                itemName=new_item_names[i],
                isOpen=is_open,
                data=all_data[i],
                amountOfDataPoints=1,
                dimReductionX=dimReductionsX[i],
                dimReductionY=dimReductionsY[i],
                children=None,
            )

            new_item_names_and_data.append(new_item_name_and_data)

        return new_item_names_and_data

    # Case: Dynamic clustering based on item similarity
    else:
        if scaled_raw_data_df.shape[0] > 5000:
            kmeans = MiniBatchKMeans(n_clusters=cluster_size, n_init=1, random_state=42)
            labels = kmeans.fit_predict(scaled_raw_data_df)
        else:
            hierarchical = AgglomerativeClustering(
                n_clusters=cluster_size, linkage="ward"
            )
            labels = hierarchical.fit_predict(scaled_raw_data_df)

        new_clustered_item_names_and_data: List[Tuple[ItemNameAndData, float]] = []

        cluster_indices = {
            cluster_id: raw_data_df.index[labels == cluster_id]
            for cluster_id in np.unique(labels)
        }

        for _, current_cluster_indexes in cluster_indices.items():

            raw_data_cluster_df = raw_data_df.loc[current_cluster_indexes]
            scaled_raw_data_cluster_df = scaled_raw_data_df.loc[current_cluster_indexes]
            dim_red_cluster_df = dim_red_df.loc[current_cluster_indexes]
            item_names_cluster_df = item_names_df.loc[current_cluster_indexes]
            hierarchical_rows_metadata_cluster_df = hierarchical_rows_metadata_df.loc[
                current_cluster_indexes
            ]

            if raw_data_cluster_df.shape[0] <= 0:
                continue

            if raw_data_cluster_df.shape[0] == raw_data_df.shape[0]:

                new__cluster_item_names = (
                    item_names_cluster_df[item_names_cluster_df.columns[0]]
                    .astype(str)
                    .tolist()
                )
                dimReductionsX = np.round(
                    dim_red_cluster_df[0], rounding_precision
                ).tolist()
                dimReductionsY = np.round(
                    dim_red_cluster_df[1], rounding_precision
                ).tolist()
                all_data = np.round(
                    raw_data_cluster_df.values, rounding_precision
                ).tolist()

                for i in range(raw_data_cluster_df.shape[0]):
                    new_item_name_and_data = ItemNameAndData(
                        index=raw_data_cluster_df.index[i],
                        itemName=new__cluster_item_names[i],
                        isOpen=is_open,
                        data=all_data[i],
                        amountOfDataPoints=1,
                        dimReductionX=dimReductionsX[i],
                        dimReductionY=dimReductionsY[i],
                        children=None,
                    )

                    new_clustered_item_names_and_data.append(new_item_name_and_data)
                continue

            if raw_data_cluster_df.shape[0] == 1:
                new_item_name = item_names_cluster_df[
                    item_names_cluster_df.columns[0]
                ].iloc[0]
                new_data = np.round(
                    raw_data_cluster_df.iloc[0], rounding_precision
                ).tolist()
                new_item_name_and_data = ItemNameAndData(
                    index=raw_data_cluster_df.index[0],
                    itemName=new_item_name,
                    isOpen=is_open,
                    data=new_data,
                    amountOfDataPoints=1,
                    dimReductionX=np.round(
                        dim_red_cluster_df.iloc[0][0], rounding_precision
                    ),
                    dimReductionY=np.round(
                        dim_red_cluster_df.iloc[0][1], rounding_precision
                    ),
                    children=None,
                )
                new_clustered_item_names_and_data.append(new_item_name_and_data)
                continue

            tag_data_aggregated_mean = raw_data_cluster_df.mean()

            tag_data_aggregated = np.round(
                tag_data_aggregated_mean, rounding_precision
            ).tolist()

            dim_reduction_aggregated = np.round(
                dim_red_cluster_df.mean(), rounding_precision
            ).tolist()

            new_item_name = str(raw_data_cluster_df.shape[0])
            children = cluster_items_recursively(
                raw_data_cluster_df,
                hierarchical_rows_metadata_cluster_df,
                item_names_cluster_df,
                scaled_raw_data_cluster_df,
                dim_red_cluster_df,
                cluster_size,
                cluster_by_collections,
                hierarchical_rows_metadata_column_names,
                level + 1,
            )

            new_aggregated_item_name_and_data = ItemNameAndData(
                index=None,
                itemName=new_item_name,
                isOpen=is_open,
                data=tag_data_aggregated,
                amountOfDataPoints=raw_data_cluster_df.shape[0],
                dimReductionX=dim_reduction_aggregated[0],
                dimReductionY=dim_reduction_aggregated[1],
                children=children,
            )
            new_clustered_item_names_and_data.append(new_aggregated_item_name_and_data)

        return new_clustered_item_names_and_data
