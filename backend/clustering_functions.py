import logging
import time
from typing import List, Tuple, Union
import numpy as np
import pandas as pd
from sklearn.cluster import AgglomerativeClustering, KMeans, MiniBatchKMeans
from sklearn.exceptions import ConvergenceWarning
from helpers import drop_columns
from heatmap_types import HierarchicalAttribute, HierarchicalItem
import warnings


warnings.simplefilter("ignore", ConvergenceWarning)

logger = logging.getLogger("IHECH Logger")

rounding_precision = 3


def all_rows_same(df):
    return (df == df.iloc[0]).all().all()

def all_cols_same(df):
    return (df == df.iloc[1]).all().all()

def cluster_attributes_recursively(
    heatmap_data: List[List[float]],
    original_attribute_names: List[str],
    original_df: pd.DataFrame,
    original_df_dropped: pd.DataFrame,
    scaled_df: pd.DataFrame,
    cluster_size: int,
    cluster_by_collections: bool
):
    if original_df_dropped.shape[1] <= cluster_size or all_cols_same(scaled_df):
        if original_df_dropped.shape[1] == 0:
            raise Exception("No attributes in cluster")
        if original_df_dropped.shape[1] == 1:
            raise Exception("Only one attribute in cluster")
        new_hierarchical_attributes = List[HierarchicalAttribute]
        for i in range(original_df_dropped.shape[1]):
            current_attribute_name = original_df_dropped.columns[i]
            new_hierarchical_attributes.append(HierarchicalAttribute(
                attributeName=current_attribute_name,
                dataAttributeIndex=original_attribute_names.index(current_attribute_name),
                isOpen=False,
                children=None,
            ))
        return new_hierarchical_attributes
    else:
        if scaled_df.shape[0] > 5000:
            kmeans = MiniBatchKMeans(n_clusters=cluster_size, n_init=1, random_state=42)
            labels = kmeans.fit_predict(scaled_df)
        else:
            hierarchical = AgglomerativeClustering(
                n_clusters=cluster_size, linkage="ward"
            )
            labels = hierarchical.fit_predict(scaled_df)

        new_clustered_item_names_and_data: List[Tuple[HierarchicalItem, float]] = []

        cluster_indices = {
            cluster_id: original_df.index[labels == cluster_id]
            for cluster_id in np.unique(labels)
        }

        for _, indices in cluster_indices.items():

            scaled_cluster_df = scaled_df.loc[indices]
            original_cluster_df_dropped = original_df_dropped.loc[indices]
            dim_red_cluster_df = dim_red_df.loc[indices]
            original_cluster_df = original_df.loc[indices]

            if original_cluster_df.shape[0] <= 0:
                continue

            if original_cluster_df.shape[0] == original_df.shape[0]:
                new__cluster_item_names = (
                    original_cluster_df[item_names_column_name].astype(str).tolist()
                )
                dimReductionsX = np.round(
                    dim_red_cluster_df[0], rounding_precision
                ).tolist()
                dimReductionsY = np.round(
                    dim_red_cluster_df[1], rounding_precision
                ).tolist()
                all_data = np.round(
                    original_cluster_df_dropped.values, rounding_precision
                ).tolist()
                scaled_df_list = scaled_cluster_df.values.tolist()

                for i in range(original_cluster_df.shape[0]):
                    heatmap_data.append(all_data[i])
                    new_item_name_and_data = HierarchicalItem(
                        index=original_cluster_df.index[i],
                        dataItemIndex=len(heatmap_data)-1,
                        itemName=new__cluster_item_names[i],
                        isOpen=is_open,
                        amountOfDataPoints=1,
                        dimReductionX=dimReductionsX[i],
                        dimReductionY=dimReductionsY[i],
                        children=None,
                    )

                    new_clustered_item_names_and_data.append(
                        (new_item_name_and_data, scaled_df_list[i])
                    )
                continue

            if original_cluster_df.shape[0] == 1:
                new_item_name = (
                    original_cluster_df[item_names_column_name].astype(str).iat[0]
                )
                mean_value_scaled_df = scaled_cluster_df.mean().mean()
                new_data = np.round(
                    original_cluster_df_dropped.iloc[0], rounding_precision
                ).tolist()
                
                heatmap_data.append(new_data)
                new_item_name_and_data = HierarchicalItem(
                    index=original_cluster_df.index[0],
                    dataItemIndex=len(heatmap_data)-1,
                    itemName=new_item_name,
                    isOpen=is_open,
                    amountOfDataPoints=1,
                    dimReductionX=np.round(
                        dim_red_cluster_df.iloc[0][0], rounding_precision
                    ),
                    dimReductionY=np.round(
                        dim_red_cluster_df.iloc[0][1], rounding_precision
                    ),
                    children=None,
                )
                new_clustered_item_names_and_data.append(
                    (new_item_name_and_data, mean_value_scaled_df)
                )
                continue

            tag_data_aggregated_mean = original_cluster_df_dropped.mean()

            tag_data_aggregated = np.round(
                tag_data_aggregated_mean, rounding_precision
            ).tolist()

            dim_reduction_aggregated = np.round(
                dim_red_cluster_df.mean(), rounding_precision
            ).tolist()

            mean_value_scaled_df = scaled_cluster_df.mean().mean()

            new_item_name = str(original_cluster_df.shape[0])

            children = cluster_items_recursively(
                heatmap_data,
                original_cluster_df,
                original_cluster_df_dropped,
                scaled_cluster_df,
                dim_red_cluster_df,
                cluster_size,
                item_names_column_name,
                cluster_by_collections,
                collection_column_names,
                level + 1,
            )

            heatmap_data.append(tag_data_aggregated)
            new_aggregated_item_name_and_data = HierarchicalItem(
                index=None,
                dataItemIndex=len(heatmap_data)-1,
                itemName=new_item_name,
                isOpen=is_open,
                amountOfDataPoints=original_cluster_df.shape[0],
                dimReductionX=dim_reduction_aggregated[0],
                dimReductionY=dim_reduction_aggregated[1],
                children=children,
            )
            new_clustered_item_names_and_data.append(
                (new_aggregated_item_name_and_data, mean_value_scaled_df)
            )

        new_clustered_item_names_and_data = sorted(
            new_clustered_item_names_and_data, key=lambda x: x[1], reverse=True
        )

        new_clustered_item_names_and_data_to_return = [
            x[0] for x in new_clustered_item_names_and_data
        ]
        return new_clustered_item_names_and_data_to_return
        

def cluster_items_recursively(
    heatmap_data: List[List[float]],
    original_df: pd.DataFrame,
    original_df_dropped: pd.DataFrame,
    scaled_df: pd.DataFrame,
    dim_red_df: pd.DataFrame,
    cluster_size: int,
    item_names_column_name: str,
    cluster_by_collections: bool,
    collection_column_names: List[str],
    level: int,
) -> Union[List[HierarchicalItem], None]:
    if level == 0:
        tag_data_0_aggregated_mean = original_df_dropped.mean()
        tag_data_0_aggregated = np.round(
            tag_data_0_aggregated_mean, rounding_precision
        ).tolist()
        dim_reduction_0_aggregated = np.round(
            dim_red_df.mean(), rounding_precision
        ).tolist()

        new_item_name_0 = str(original_df.shape[0])

        children_0 = cluster_items_recursively(
            heatmap_data,
            original_df,
            original_df_dropped,
            scaled_df,
            dim_red_df,
            cluster_size,
            item_names_column_name,
            cluster_by_collections,
            collection_column_names,
            level + 1,
        )
        
        heatmap_data.append(tag_data_0_aggregated)
        new_aggregated_item_name_and_data = HierarchicalItem(
            index=None,
            dataItemIndex=len(heatmap_data) -1,
            itemName=new_item_name_0,
            isOpen=True,
            amountOfDataPoints=original_df.shape[0],
            dimReductionX=dim_reduction_0_aggregated[0],
            dimReductionY=dim_reduction_0_aggregated[1],
            children=children_0,
        )

        return [new_aggregated_item_name_and_data]

    is_open = False

    if cluster_by_collections and len(collection_column_names) > 0:
        new_collection_item_names_and_data: List[Tuple[HierarchicalItem, float]] = []
        collection_column_name = collection_column_names[0]
        for collection, original_group_df in original_df.groupby(
            collection_column_name
        ):
            remaining_collection_column_names = collection_column_names[1:]

            scaled_temp_df = scaled_df.loc[original_group_df.index]
            dim_red_temp_df = dim_red_df.loc[original_group_df.index]
            original_temp_df_dropped = original_df_dropped.loc[original_group_df.index]
            original_temp_df = original_group_df.drop(collection_column_name, axis=1)

            tag_data_aggregated = np.round(
                original_temp_df_dropped.mean(), rounding_precision
            ).tolist()

            dim_reduction_aggregated = np.round(
                dim_red_temp_df.mean(), rounding_precision
            ).tolist()
            new_item_name = str(collection) + " " + str(original_group_df.shape[0])

            if (
                original_group_df.shape[0] == 1
                and len(remaining_collection_column_names) == 0
            ):
                solo_child_name = str(original_group_df.iloc[0][item_names_column_name])
                solo_child_data = np.round(original_temp_df_dropped.iloc[0],rounding_precision).tolist()
                
                heatmap_data.append(solo_child_data)
                new_children = [
                    HierarchicalItem(
                        index=original_group_df.index[0],
                        dataItemIndex=len(heatmap_data)-1,
                        itemName=solo_child_name,
                        isOpen=is_open,
                        amountOfDataPoints=1,
                        dimReductionX=np.round(
                            dim_red_df.loc[original_group_df.index].iloc[0][0],
                            rounding_precision,
                        ),
                        dimReductionY=np.round(
                            dim_red_df.loc[original_group_df.index].iloc[0][1],
                            rounding_precision,
                        ),
                        children=None,
                    )
                ]
            else:
                new_children = cluster_items_recursively(
                    heatmap_data,
                    original_temp_df,
                    original_temp_df_dropped,
                    scaled_temp_df,
                    dim_red_temp_df,
                    cluster_size,
                    item_names_column_name,
                    cluster_by_collections,
                    remaining_collection_column_names,
                    level + 1,
                )

            heatmap_data.append(tag_data_aggregated)
            new_item_name_and_data = HierarchicalItem(
                index=None,
                dataItemIndex=len(heatmap_data)-1,
                itemName=new_item_name,
                isOpen=is_open,
                amountOfDataPoints=original_group_df.shape[0],
                dimReductionX=dim_reduction_aggregated[0],
                dimReductionY=dim_reduction_aggregated[1],
                children=new_children,
            )
            scaled_temp_df_mean = scaled_temp_df.mean().mean()

            new_collection_item_names_and_data.append(
                (new_item_name_and_data, scaled_temp_df_mean)
            )

        new_collection_item_names_and_data = sorted(
            new_collection_item_names_and_data, key=lambda x: x[1], reverse=True
        )
        new_collection_item_names_and_data_to_return = [
            x[0] for x in new_collection_item_names_and_data
        ]
        return new_collection_item_names_and_data_to_return

    if original_df.shape[0] <= cluster_size or all_rows_same(scaled_df):
        if original_df.shape[0] == 0:
            raise Exception("No items in cluster")
        if original_df.shape[0] == 1:
            raise Exception("Only one item in cluster")

        new_item_names_and_data: List[Tuple[HierarchicalItem, float]] = []
        new_item_names = original_df[item_names_column_name].astype(str).tolist()
        dimReductionsX = np.round(dim_red_df[0], rounding_precision).tolist()
        dimReductionsY = np.round(dim_red_df[1], rounding_precision).tolist()
        all_data = np.round(original_df_dropped.values, rounding_precision).tolist()
        scaled_df_list = scaled_df.values.tolist()

        for i in range(original_df.shape[0]):

            heatmap_data.append(all_data[i])
            new_item_name_and_data = HierarchicalItem(
                index=original_df.index[i],
                dataItemIndex=len(heatmap_data)-1,
                itemName=new_item_names[i],
                isOpen=is_open,
                amountOfDataPoints=1,
                dimReductionX=dimReductionsX[i],
                dimReductionY=dimReductionsY[i],
                children=None,
            )

            new_item_names_and_data.append((new_item_name_and_data, scaled_df_list[i]))

        new_item_names_and_data = sorted(
            new_item_names_and_data, key=lambda x: x[1], reverse=True
        )
        new_item_names_and_data_to_return = [x[0] for x in new_item_names_and_data]
        return new_item_names_and_data_to_return

    else:
        if scaled_df.shape[0] > 5000:
            kmeans = MiniBatchKMeans(n_clusters=cluster_size, n_init=1, random_state=42)
            labels = kmeans.fit_predict(scaled_df)
        else:
            hierarchical = AgglomerativeClustering(
                n_clusters=cluster_size, linkage="ward"
            )
            labels = hierarchical.fit_predict(scaled_df)

        new_clustered_item_names_and_data: List[Tuple[HierarchicalItem, float]] = []

        cluster_indices = {
            cluster_id: original_df.index[labels == cluster_id]
            for cluster_id in np.unique(labels)
        }

        for _, indices in cluster_indices.items():

            scaled_cluster_df = scaled_df.loc[indices]
            original_cluster_df_dropped = original_df_dropped.loc[indices]
            dim_red_cluster_df = dim_red_df.loc[indices]
            original_cluster_df = original_df.loc[indices]

            if original_cluster_df.shape[0] <= 0:
                continue

            if original_cluster_df.shape[0] == original_df.shape[0]:
                new__cluster_item_names = (
                    original_cluster_df[item_names_column_name].astype(str).tolist()
                )
                dimReductionsX = np.round(
                    dim_red_cluster_df[0], rounding_precision
                ).tolist()
                dimReductionsY = np.round(
                    dim_red_cluster_df[1], rounding_precision
                ).tolist()
                all_data = np.round(
                    original_cluster_df_dropped.values, rounding_precision
                ).tolist()
                scaled_df_list = scaled_cluster_df.values.tolist()

                for i in range(original_cluster_df.shape[0]):
                    heatmap_data.append(all_data[i])
                    new_item_name_and_data = HierarchicalItem(
                        index=original_cluster_df.index[i],
                        dataItemIndex=len(heatmap_data)-1,
                        itemName=new__cluster_item_names[i],
                        isOpen=is_open,
                        amountOfDataPoints=1,
                        dimReductionX=dimReductionsX[i],
                        dimReductionY=dimReductionsY[i],
                        children=None,
                    )

                    new_clustered_item_names_and_data.append(
                        (new_item_name_and_data, scaled_df_list[i])
                    )
                continue

            if original_cluster_df.shape[0] == 1:
                new_item_name = (
                    original_cluster_df[item_names_column_name].astype(str).iat[0]
                )
                mean_value_scaled_df = scaled_cluster_df.mean().mean()
                new_data = np.round(
                    original_cluster_df_dropped.iloc[0], rounding_precision
                ).tolist()
                
                heatmap_data.append(new_data)
                new_item_name_and_data = HierarchicalItem(
                    index=original_cluster_df.index[0],
                    dataItemIndex=len(heatmap_data)-1,
                    itemName=new_item_name,
                    isOpen=is_open,
                    amountOfDataPoints=1,
                    dimReductionX=np.round(
                        dim_red_cluster_df.iloc[0][0], rounding_precision
                    ),
                    dimReductionY=np.round(
                        dim_red_cluster_df.iloc[0][1], rounding_precision
                    ),
                    children=None,
                )
                new_clustered_item_names_and_data.append(
                    (new_item_name_and_data, mean_value_scaled_df)
                )
                continue

            tag_data_aggregated_mean = original_cluster_df_dropped.mean()

            tag_data_aggregated = np.round(
                tag_data_aggregated_mean, rounding_precision
            ).tolist()

            dim_reduction_aggregated = np.round(
                dim_red_cluster_df.mean(), rounding_precision
            ).tolist()

            mean_value_scaled_df = scaled_cluster_df.mean().mean()

            new_item_name = str(original_cluster_df.shape[0])

            children = cluster_items_recursively(
                heatmap_data,
                original_cluster_df,
                original_cluster_df_dropped,
                scaled_cluster_df,
                dim_red_cluster_df,
                cluster_size,
                item_names_column_name,
                cluster_by_collections,
                collection_column_names,
                level + 1,
            )

            heatmap_data.append(tag_data_aggregated)
            new_aggregated_item_name_and_data = HierarchicalItem(
                index=None,
                dataItemIndex=len(heatmap_data)-1,
                itemName=new_item_name,
                isOpen=is_open,
                amountOfDataPoints=original_cluster_df.shape[0],
                dimReductionX=dim_reduction_aggregated[0],
                dimReductionY=dim_reduction_aggregated[1],
                children=children,
            )
            new_clustered_item_names_and_data.append(
                (new_aggregated_item_name_and_data, mean_value_scaled_df)
            )

        new_clustered_item_names_and_data = sorted(
            new_clustered_item_names_and_data, key=lambda x: x[1], reverse=True
        )

        new_clustered_item_names_and_data_to_return = [
            x[0] for x in new_clustered_item_names_and_data
        ]
        return new_clustered_item_names_and_data_to_return
