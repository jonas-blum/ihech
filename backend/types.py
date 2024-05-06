from typing import List, Literal


DimReductionAlgoType = Literal["PCA", "TSNE", "UMAP"]

SortOrderColumns = Literal[
    "STDEV",
    "ASC",
    "DESC",
    "ALPHABETICAL",
]


class HeatmapSettings:
    selectedRowIds: List[str]
    selectedColumns: List[str]

    stickyColumns: List[str]
    sortColumnsBasedOnStickyRows: bool
    sortOrderColumns: SortOrderColumns

    stickyRowIds: List[str]
    clusterRowsBasedOnStickyColumns: bool

    clusterByCollections: bool
    collectionColumnNames: List[str]

    clusterSize: int
    dimReductionAlgo: DimReductionAlgoType
    clusterAfterDimRed: bool

    def __init__(self, dict):
        self.selectedRowIds = dict["selectedRowIds"]
        self.selectedColumns = dict["selectedColumns"]

        self.stickyColumns = dict["stickyColumns"]
        self.sortColumnsBasedOnStickyRows = dict["sortColumnsBasedOnStickyRows"]
        self.sortOrderColumns = dict["sortOrderColumns"]

        self.stickyRowIds = dict["stickyRowIds"]
        self.clusterRowsBasedOnStickyColumns = dict["clusterRowsBasedOnStickyColumns"]

        self.clusterByCollections = dict["clusterByCollections"]
        self.collectionColumnNames = dict["collectionColumnNames"]

        self.clusterSize = int(dict["clusterSize"])
        self.dimReductionAlgo = dict["dimReductionAlgo"]
        self.clusterAfterDimRed = dict["clusterAfterDimRed"]
