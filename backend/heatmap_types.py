import json
from typing import List, Literal, Union
import numpy as np


ScalingType = Literal[
    "NO_SCALING",
    "STANDARDIZING",
]

MedianMaxMinType = Literal["MEDIAN", "MIN", "MAX"]

DimReductionAlgoType = Literal["PCA", "TSNE", "UMAP"]

StructuralFeatureType = Literal[
    "AMOUNT_OF_TAGS",
    "BINARY_TAG_EXISTS",
    "AMOUNT_OF_DIFFERENT_ATTRIBUTES",
    "AMOUNT_OF_ATTRIBUTES",
    "AMOUNT_OF_SIBLING_TAGS",
    "AMOUNT_OF_DIRECT_CHILDREN_TAGS",
    "AMOUNT_OF_INDIRECT_CHILDREN_TAGS",
    "LENGTH_OF_CONTENT_INSIDE_TAG",
    "LENGTH_OF_CONTENT_ALL_CHILDREN",
    "DEPTH_OF_TAG",
]

SortOrderAttributes = Literal["HETEROGENIC", "HOMOGENIC", "DESC", "ASC", "ALPHABETICAL"]


class ExtendedVectorRepresentation:
    __slots__ = [
        "tag",
        "vector",
        "attributes",
        "tag_depth",
        "amount_of_attributes",
        "character_amount_inside_of_tag",
        "character_amount_all_children",
        "tag_amount_parent_tag",
        "tag_amount_directly_inside_tag",
        "tag_amount_all_children",
        "document_id",
        "file_name",
        "edition",
    ]

    def __init__(self):
        self.tag: str = ""
        self.vector: List[str] = []
        self.attributes: List[str] = []
        self.tag_depth: int = 0
        self.amount_of_attributes: int = 0
        self.character_amount_inside_of_tag: int = 0
        self.character_amount_all_children: int = 0
        self.tag_amount_parent_tag: int = 0
        self.tag_amount_directly_inside_tag: int = 0
        self.tag_amount_all_children: int = 0
        self.document_id: str = ""
        self.file_name: str = ""
        self.edition: str = ""


class ItemNameAndData:
    index: Union[int, None]
    itemName: str
    isOpen: bool
    data: np.ndarray
    amountOfDataPoints: int
    dimReductionX: float
    dimReductionY: float
    children: Union["List[ItemNameAndData]", None]

    def __init__(
        self,
        index: Union[int, None],
        itemName: str,
        isOpen: bool,
        data: np.ndarray,
        amountOfDataPoints: int,
        dimReductionX: float,
        dimReductionY: float,
        children: Union["List[ItemNameAndData]", None],
    ):
        self.index: Union[int, None] = index
        self.itemName: str = itemName
        self.isOpen: bool = isOpen
        self.data: np.ndarray = data
        self.amountOfDataPoints: int = amountOfDataPoints
        self.dimReductionX: float = dimReductionX
        self.dimReductionY: float = dimReductionY
        self.children: Union[List[ItemNameAndData], None] = children


def custom_encoder(obj):
    if isinstance(obj, np.float32):
        return float(obj)
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, HeatmapJSON):
        return obj.__dict__
    elif isinstance(obj, ItemNameAndData):

        return {
            "index": obj.index,
            "itemName": obj.itemName,
            "isOpen": obj.isOpen,
            "data": obj.data.tolist(),
            "amountOfDataPoints": obj.amountOfDataPoints,
            "dimReductionX": obj.dimReductionX,
            "dimReductionY": obj.dimReductionY,
            "children": (
                [custom_encoder(child) for child in obj.children]
                if obj.children
                else None
            ),
        }

    elif isinstance(obj, HierarchicalAttribute):
        return {
            "attributeName": obj.attributeName,
            "dataAttributeIndex": obj.dataAttributeIndex,
            "std": obj.std,
            "originalAttributeOrder": obj.originalAttributeOrder,
            "isOpen": obj.isOpen,
            "selected": obj.selected,
            "children": (
                [custom_encoder(child) for child in obj.children]
                if obj.children
                else None
            ),
        }

    elif hasattr(obj, "__dict__"):
        return obj.__dict__
    raise TypeError(f"Object of type {obj.__class__.__name__} is not JSON serializable")


class HierarchicalAttribute:
    attributeName: str
    dataAttributeIndex: int
    std: float
    originalAttributeOrder: float
    isOpen: bool
    selected: bool
    children: Union["List[HierarchicalAttribute]", None]

    def __init__(
        self,
        attributeName: str,
        dataAttributeIndex: int,
        std: float,
        originalAttributeOrder: float,
        isOpen: bool,
        selected: bool,
        children: Union["List[HierarchicalAttribute]", None],
    ):
        self.attributeName: str = attributeName
        self.dataAttributeIndex: int = dataAttributeIndex
        self.std: float = std
        self.originalAttributeOrder: float = originalAttributeOrder
        self.isOpen: bool = isOpen
        self.selected: bool = selected
        self.children: Union[List[HierarchicalAttribute], None] = children


class HeatmapJSON:
    def __init__(self):
        self.attributeDissimilarities: List[List[float]] = []
        self.itemNamesAndData: List[ItemNameAndData] = []
        self.hierarchicalAttributes: List[HierarchicalAttribute] = []
        self.maxHeatmapValue: float = 0
        self.minHeatmapValue: float = 0
        self.minAttributeValues: List[float] = []
        self.maxAttributeValues: List[float] = []

    def add_cluster(self, cluster: ItemNameAndData):
        self.itemNamesAndData.append(cluster)


class HeatmapSettings:
    csvFile: str

    hierarchicalRowsMetadataColumnNames: List[str]
    hierarchicalColumnsMetadataRowIndexes: List[int]

    selectedItemsRowIndexes: List[str]
    selectedAttributesColumnNames: List[str]

    stickyAttributesColumnNames: List[str]
    sortAttributesBasedOnStickyItems: bool
    sortOrderAttributes: SortOrderAttributes

    stickyItemsRowIndexes: List[str]
    clusterItemsBasedOnStickyAttributes: bool

    clusterItemsByCollections: bool
    clusterAttributesByCollections: bool

    itemsClusterSize: int
    attributesClusterSize: int
    dimReductionAlgo: DimReductionAlgoType
    clusterAfterDimRed: bool

    scaling: ScalingType

    def __init__(self, dict):
        self.csvFile = dict["csvFile"]

        self.hierarchicalRowsMetadataColumnNames = dict[
            "hierarchicalRowsMetadataColumnNames"
        ]
        self.hierarchicalColumnsMetadataRowIndexes = dict[
            "hierarchicalColumnsMetadataRowIndexes"
        ]

        self.selectedItemsRowIndexes = dict["selectedItemsRowIndexes"]
        self.selectedAttributesColumnNames = dict["selectedAttributesColumnNames"]

        self.stickyAttributesColumnNames = dict["stickyAttributesColumnNames"]
        self.sortAttributesBasedOnStickyItems = dict["sortAttributesBasedOnStickyItems"]
        self.sortOrderAttributes = dict["sortOrderAttributes"]

        self.stickyItemsRowIndexes = dict["stickyItemsRowIndexes"]
        self.clusterItemsBasedOnStickyAttributes = dict[
            "clusterItemsBasedOnStickyAttributes"
        ]

        self.clusterItemsByCollections = dict["clusterItemsByCollections"]
        self.clusterAttributesByCollections = dict["clusterAttributesByCollections"]

        self.itemsClusterSize = dict["itemsClusterSize"]
        self.attributesClusterSize = dict["attributesClusterSize"]
        self.dimReductionAlgo = dict["dimReductionAlgo"]
        self.clusterAfterDimRed = dict["clusterAfterDimRed"]

        self.scaling = dict["scaling"]
