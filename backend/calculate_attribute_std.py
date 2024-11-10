from typing import List
from heatmap_types import ItemNameAndData, HierarchicalAttribute
import numpy as np


def get_list_of_item_values_idx(
    item_name_and_data: List[ItemNameAndData], index: int
) -> List[float]:
    l = []
    for item in item_name_and_data:
        l.append(item.data[index])
        if item.children is not None:
            l = l + get_list_of_item_values_idx(item.children, index)
    return l


def calculate_attribute_std(
    item_name_and_data: List[ItemNameAndData],
    hierarchical_attributes: List[HierarchicalAttribute],
) -> None:
    for attribute in hierarchical_attributes:
        list_of_values = get_list_of_item_values_idx(
            item_name_and_data, attribute.dataAttributeIndex
        )
        attribute.std = np.std(list_of_values)
        if attribute.children is not None:
            calculate_attribute_std(item_name_and_data, attribute.children)
