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

SortOrderAttributes = Literal[
  "HETEROGENIC",
  "HOMOGENIC",
  "DESC",
  "ASC",
  "ALPHABETICAL"
]


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


class HierarchicalItem:
    index: Union[int, None]
    dataItemIndex: int
    itemName: str
    isOpen: bool
    amountOfDataPoints: int
    dimReductionX: float
    dimReductionY: float
    children: Union["List[HierarchicalItem]", None]

    def __init__(
        self,
        index: Union[int, None],
        dataItemIndex: int,
        itemName: str,
        isOpen: bool,
        amountOfDataPoints: int,
        dimReductionX: float,
        dimReductionY: float,
        children: Union["List[HierarchicalItem]", None],
    ):
        self.index: Union[int, None] = index
        self.dataItemIndex: int = dataItemIndex
        self.itemName: str = itemName
        self.isOpen: bool = isOpen
        self.amountOfDataPoints: int = amountOfDataPoints
        self.dimReductionX: float = dimReductionX
        self.dimReductionY: float = dimReductionY
        self.children: Union[List[HierarchicalItem], None] = children
        
class HierarchicalAttribute:
    attributeName: str
    dataAttributeIndex: int
    isOpen: bool
    children: Union["List[HierarchicalAttribute]", None]

    def __init__(
        self,
        attributeName: str,
        dataAttributeIndex: int,
        isOpen: bool,
        children: Union["List[HierarchicalAttribute]", None],
    ):
        self.attributeName: str = attributeName
        self.dataAttributeIndex: int = dataAttributeIndex
        self.isOpen: bool = isOpen
        self.children: Union[List[HierarchicalAttribute], None] = children


def custom_encoder(obj):
    if isinstance(obj, np.float32):
        return float(obj)
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, HeatmapJSON):
        return obj.__dict__
    
    elif isinstance(obj, HierarchicalItem):
        return {
            "index": obj.index,
            "dataItemIndex": obj.dataItemIndex,
            "itemName": obj.itemName,
            "isOpen": obj.isOpen,
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
            "isOpen": obj.isOpen,
            "children": (
                [custom_encoder(child) for child in obj.children]
                if obj.children
                else None
            ),
        }
        
    elif hasattr(obj, "__dict__"):
        return obj.__dict__
    raise TypeError(f"Object of type {obj.__class__.__name__} is not JSON serializable")


class HeatmapJSON:
    def __init__(self):
        self.heatmapData: List[List[float]] = []
        self.attributeNames: List[str] = []
        self.attributeDissimilarities: List[List[float]] = []
        self.hierarchicalItems: List[HierarchicalItem] = []
        self.hierarchicalAttributes: List[HierarchicalAttribute] = []
        self.maxHeatmapValue: float = 0
        self.minHeatmapValue: float = 0
        self.maxDimRedXValue: float = 0
        self.minDimRedXValue: float = 0
        self.maxDimRedYValue: float = 0
        self.minDimRedYValue: float = 0
        self.minAttributeValues: List[float] = []
        self.maxAttributeValues: List[float] = []

    def add_cluster(self, cluster: HierarchicalItem):
        self.hierarchicalItems.append(cluster)


class HeatmapSettings:
    csvFile: str

    itemNamesColumnName: str
    collectionColumnNames: List[str]

    selectedItemIndexes: List[str]
    selectedAttributes: List[str]

    stickyAttributes: List[str]
    sortAttributesBasedOnStickyItems: bool
    sortOrderAttributes: SortOrderAttributes

    stickyItemIndexes: List[str]
    clusterItemsBasedOnStickyAttributes: bool

    clusterByCollections: bool

    clusterSize: int
    dimReductionAlgo: DimReductionAlgoType
    clusterAfterDimRed: bool

    scaling: ScalingType

    def __init__(self, dict):
        self.csvFile = dict["csvFile"]

        self.itemNamesColumnName = dict["itemNamesColumnName"]
        self.collectionColumnNames = dict["collectionColumnNames"]

        self.selectedItemIndexes = dict["selectedItemIndexes"]
        self.selectedAttributes = dict["selectedAttributes"]

        self.stickyAttributes = dict["stickyAttributes"]
        self.sortAttributesBasedOnStickyItems = dict["sortAttributesBasedOnStickyItems"]
        self.sortOrderAttributes = dict["sortOrderAttributes"]

        self.stickyItemIndexes = dict["stickyItemIndexes"]
        self.clusterItemsBasedOnStickyAttributes = dict[
            "clusterItemsBasedOnStickyAttributes"
        ]

        self.clusterByCollections = dict["clusterByCollections"]

        self.clusterSize = dict["clusterSize"]
        self.dimReductionAlgo = dict["dimReductionAlgo"]
        self.clusterAfterDimRed = dict["clusterAfterDimRed"]

        self.scaling = dict["scaling"]
