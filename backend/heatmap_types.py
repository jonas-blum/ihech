import json
from typing import List, Literal

AbsRelLogType = Literal["ABS", "REL", "LOG"]

DimReductionAlgoType = Literal["PCA", "TSNE", "UMAP"]

SortOrderColumns = Literal[
    "STDEV",
    "ASC",
    "DESC",
    "ALPHABETICAL",
]


class HeatmapSettings:
    csvFile: str
    idsColumnName: str
    rowNamesColumnName: str
    collectionColumnNames: List[str]

    selectedRowIds: List[str]
    selectedColumns: List[str]

    stickyColumns: List[str]
    sortColumnsBasedOnStickyRows: bool
    sortOrderColumns: SortOrderColumns

    stickyRowIds: List[str]
    clusterRowsBasedOnStickyColumns: bool

    clusterByCollections: bool

    clusterSize: int
    dimReductionAlgo: DimReductionAlgoType
    clusterAfterDimRed: bool

    absRelLog: AbsRelLogType

    def __init__(self, dict):
        self.csvFile = dict["csvFile"]
        self.idsColumnName = dict["idsColumnName"]
        self.rowNamesColumnName = dict["rowNamesColumnName"]
        self.collectionColumnNames = dict["collectionColumnNames"]

        self.selectedRowIds = dict["selectedRowIds"]
        self.selectedColumns = dict["selectedColumns"]

        self.stickyColumns = dict["stickyColumns"]
        self.sortColumnsBasedOnStickyRows = dict["sortColumnsBasedOnStickyRows"]
        self.sortOrderColumns = dict["sortOrderColumns"]

        self.stickyRowIds = dict["stickyRowIds"]
        self.clusterRowsBasedOnStickyColumns = dict["clusterRowsBasedOnStickyColumns"]

        self.clusterByCollections = dict["clusterByCollections"]

        self.clusterSize = int(dict["clusterSize"])
        self.dimReductionAlgo = dict["dimReductionAlgo"]
        self.clusterAfterDimRed = dict["clusterAfterDimRed"]

        self.absRelLog = dict["absRelLog"]


class HeatmapJSON:
    def __init__(self):
        self.heatmapCSV: str = ""
        self.colDissimilarities: List[float] = []

    def generate_json(self):
        return json.dumps(self, default=lambda o: o.__dict__, indent=4)
