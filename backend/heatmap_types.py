import json
from typing import List, Literal, Union
import numpy as np


AbsRelLogType = Literal["ABS", "REL", "LOG"]

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
    "STDEV",
    "ASC",
    "DESC",
    "CLUSTER",
    "ALPHABETICAL",
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


class ItemNameAndData:
    index: int | None
    itemName: str
    isOpen: bool
    data: List[float]
    amountOfDataPoints: int
    dimReductionX: float
    dimReductionY: float
    children: Union["List[ItemNameAndData]", None]

    def __init__(
        self,
        index: int | None,
        itemName: str,
        isOpen: bool,
        data: List[float],
        amountOfDataPoints: int,
        dimReductionX: float,
        dimReductionY: float,
        children: Union["List[ItemNameAndData]", None],
    ):
        self.index: int | None = index
        self.itemName: str = itemName
        self.isOpen: bool = isOpen
        self.data: List[float] = data
        self.amountOfDataPoints: int = amountOfDataPoints
        self.dimReductionX: float = dimReductionX
        self.dimReductionY: float = dimReductionY
        self.children: Union[List[ItemNameAndData], None] = children


def custom_encoder(obj):
    if isinstance(obj, np.float32): # type: ignore
        return float(obj)
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, HeatmapJSON):
        return obj.__dict__
    elif isinstance(obj, ItemNameAndData):

        return {
            "itemName": obj.itemName,
            "isOpen": obj.isOpen,
            "data": obj.data,
            "amountOfDataPoints": obj.amountOfDataPoints,
            "dimReductionX": obj.dimReductionX,
            "dimReductionY": obj.dimReductionY,
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
        self.attributeNames: List[str] = []
        self.attributeDissimilarities: List[List[float]] = []
        self.itemNamesAndData: List[ItemNameAndData] = []
        self.maxHeatmapValue: float = 0
        self.minHeatmapValue: float = 0
        self.maxDimRedXValue: float = 0
        self.minDimRedXValue: float = 0
        self.maxDimRedYValue: float = 0
        self.minDimRedYValue: float = 0

    def add_cluster(self, cluster: ItemNameAndData):
        self.itemNamesAndData.append(cluster)

    def generate_json(self):
        return json.dumps(self, default=custom_encoder, indent=4)


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

    absRelLog: AbsRelLogType



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

        self.absRelLog = dict["absRelLog"]

