import { defineStore } from 'pinia'
import * as dataForge from 'data-forge'

export enum AbsRelEnum {
  REL = 'REL',
  ABS = 'ABS',
  LOG = 'LOG'
}

export enum DimReductionAlgoEnum {
  PCA = 'PCA',
  UMAP = 'UMAP',
  TSNE = 'TSNE'
}

export enum SortOrderColumns {
  STDEV = 'STDEV',
  ASC = 'ASC',
  DESC = 'DESC',
  ALPHABETICAL = 'ALPHABETICAL'
}

export const NON_ATTRIBUTE_COLUMNS = [
  'row_index',
  'parent_index',
  'children_indexes',
  'row_name',
  'amount_of_data_points',
  'dim_reduction_1',
  'dim_reduction_2',
  'is_open',
  'is_visible'
]

export interface HeatmapJSON {
  heatmap_csv: string
  col_dissimilarities: number[]
}

export interface HeatmapSettings {
  csvFile: string
  idsColumnName: string
  rowNamesColumnName: string
  collectionColumnNames: string[]

  selectedRowIds: string[]
  selectedColumns: string[]

  stickyColumns: string[]
  sortColumnsBasedOnStickyRows: boolean
  sortOrderColumns: SortOrderColumns

  stickyRowIds: string[]
  clusterRowsBasedOnStickyColumns: boolean

  clusterByCollections: boolean

  clusterSize: number
  dimReductionAlgo: DimReductionAlgoEnum
  clusterAfterDimRed: boolean

  absRelLog: AbsRelEnum
}

export interface HeatmapStoreState {
  csvFile: string
  idsColumnName: string
  rowNamesColumnName: string
  collectionColumnNames: string[]
  selectedRowIds: string[]
  selectedColumns: string[]
  heatmap: dataForge.IDataFrame<any, any>
  initialColumnsOrder: string[]

  col_dissimilarities: number[]
  initial_col_dissimilarities: number[]

  dataChanging: number
  highlightedRowIndex: number | null
  stickyRowsIndexes: string[]
  stickyColumns: string[]
  loading: boolean

  selectedAbsRel: AbsRelEnum
  clusterByCollections: boolean
  sortOrderColumns: SortOrderColumns
  sortColumnsBasedOnStickyRows: boolean
  clusterSize: number
  dimReductionAlgoEnum: DimReductionAlgoEnum
  clusterRowsBasedOnStickyColumns: boolean
  showOnlyStickyRowsInDimReduction: boolean
  clusterAfterDimRed: boolean
}

export const useHeatmapStore = defineStore('heatmapStore', {
  state: (): HeatmapStoreState => ({
    csvFile: '',
    idsColumnName: '',
    rowNamesColumnName: '',
    collectionColumnNames: [],
    selectedRowIds: [],
    selectedColumns: [],
    heatmap: new dataForge.DataFrame<any, any>(),
    initialColumnsOrder: [],

    col_dissimilarities: [],
    initial_col_dissimilarities: [],

    dataChanging: 1,
    highlightedRowIndex: null,
    stickyRowsIndexes: [],
    stickyColumns: [],
    loading: false,

    selectedAbsRel: AbsRelEnum.REL,
    clusterByCollections: false,
    sortOrderColumns: SortOrderColumns.STDEV,
    sortColumnsBasedOnStickyRows: false,
    clusterSize: 6,
    dimReductionAlgoEnum: DimReductionAlgoEnum.PCA,
    clusterRowsBasedOnStickyColumns: false,
    showOnlyStickyRowsInDimReduction: true,
    clusterAfterDimRed: false
  }),
  getters: {
    getHeatmap: (state) => state.heatmap,

    getDataChanging: (state) => state.dataChanging,
    getHighlightedRowIndex: (state) => state.highlightedRowIndex,
    getStickyRowsIndexes: (state) => state.stickyRowsIndexes,
    getStickyColumns: (state) => state.stickyColumns,
    isLoading: (state) => state.loading,

    getSelectedAbsRel: (state) => state.selectedAbsRel,
    isClusterByCollections: (state) => state.clusterByCollections,
    getSortOrderColumns: (state) => state.sortOrderColumns,
    getClusterSize: (state) => state.clusterSize,
    getDimReductionAlgo: (state) => state.dimReductionAlgoEnum,
    isClusterRowsBasedOnStickyColumns: (state) => state.clusterRowsBasedOnStickyColumns,
    isOnlyStickyRowsShownInDimReduction: (state) => state.showOnlyStickyRowsInDimReduction
  },
  actions: {
    async fetchHeatmap() {
      const startTime = new Date().getTime()

      console.log('fetchingHeatmap....')
      this.loading = true

      const settings: HeatmapSettings = this.getCurrentHeatmapSettings()
      console.log(settings)
      const requestInit: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/heatmap`, requestInit)

      const receivedHeatmap: HeatmapJSON = await response.json()
      if (!receivedHeatmap) {
        console.error('No heatmap data received.')
        return
      }

      let heatmapDF: dataForge.IDataFrame<any, any> = dataForge
        .fromCSV(receivedHeatmap.heatmap_csv, { dynamicTyping: true })
        .setIndex('row_index')

      let heatmapDFCopy: dataForge.IDataFrame<any, any> = dataForge
        .fromCSV(receivedHeatmap.heatmap_csv, { dynamicTyping: true })
        .setIndex('row_index')

      heatmapDF = heatmapDF.generateSeries({
        is_open: (row) => (row.parent_index === 0 ? true : false)
      })

      heatmapDF = heatmapDF.generateSeries({
        children_indexes: (row) => {
          const arrayToAdd: number[] = heatmapDFCopy
            .where((searchRow) => searchRow.parent_index === row.row_index)
            .getSeries('row_index')
            .toArray()
          if (arrayToAdd) {
            return arrayToAdd
          } else {
            return []
          }
        }
      })

      heatmapDFCopy = heatmapDF

      heatmapDF = heatmapDF.generateSeries({
        is_visible: (row) => {
          if (row.is_open) {
            return true
          }
          if (row.parent_index === 0) {
            return true
          }
          const parentRows = heatmapDFCopy.where(
            (searchRow) => searchRow.row_index === row.parent_index
          )
          if (parentRows.first().is_open) {
            return true
          }
          return false
        }
      })

      this.initialColumnsOrder = heatmapDF.dropSeries(NON_ATTRIBUTE_COLUMNS).getColumnNames()

      this.initial_col_dissimilarities = receivedHeatmap.col_dissimilarities
      this.col_dissimilarities = receivedHeatmap.col_dissimilarities

      this.heatmap = heatmapDF

      console.log('Done Fetching Heatmap', new Date().getTime() - startTime, 'ms.')

      this.changeHeatmap()
      this.loading = false
    },
    uploadCsvFile(csvFile: string) {
      this.idsColumnName = 'row_ids'
      this.rowNamesColumnName = 'row_ids'
      this.collectionColumnNames = ['edition']

      this.csvFile = csvFile
      const heatmapDF: dataForge.IDataFrame<any, any> = dataForge
        .fromCSV(csvFile, { dynamicTyping: true })
        .setIndex(this.idsColumnName)

      this.selectedRowIds = heatmapDF.getIndex().toArray()
      this.selectedColumns = heatmapDF.getColumnNames()

      this.fetchHeatmap()
    },
    setAbsRel(absRel: AbsRelEnum) {
      this.selectedAbsRel = absRel
    },
    setClusterByCollections(clusterByCollections: boolean) {
      this.clusterByCollections = clusterByCollections
    },
    setSortOrderColumns(sortOrderColumns: SortOrderColumns) {
      this.sortOrderColumns = sortOrderColumns
    },
    setSortColumnsBasedOnStickyRows(sortColumnsBasedOnStickyRows: boolean) {
      this.sortColumnsBasedOnStickyRows = sortColumnsBasedOnStickyRows
    },
    setClusterSize(clusterSize: number) {
      this.clusterSize = clusterSize
    },
    setDimReductionAlgo(dimReductionAlgo: DimReductionAlgoEnum) {
      this.dimReductionAlgoEnum = dimReductionAlgo
    },
    setHighlightedRowIndex(row: number | null) {
      this.highlightedRowIndex = row
      this.changeHeatmap()
    },
    resetSettings() {
      ;(this.csvFile = ''),
        (this.idsColumnName = ''),
        (this.rowNamesColumnName = ''),
        (this.collectionColumnNames = []),
        (this.selectedRowIds = []),
        (this.selectedColumns = []),
        (this.heatmap = new dataForge.DataFrame<any, any>()),
        (this.initialColumnsOrder = []),
        (this.col_dissimilarities = []),
        (this.initial_col_dissimilarities = []),
        (this.dataChanging = 1),
        (this.highlightedRowIndex = null),
        (this.stickyRowsIndexes = []),
        (this.stickyColumns = []),
        (this.loading = false),
        (this.selectedAbsRel = AbsRelEnum.REL),
        (this.clusterByCollections = false),
        (this.sortOrderColumns = SortOrderColumns.STDEV),
        (this.sortColumnsBasedOnStickyRows = false),
        (this.clusterSize = 6),
        (this.dimReductionAlgoEnum = DimReductionAlgoEnum.PCA),
        (this.clusterRowsBasedOnStickyColumns = false),
        (this.showOnlyStickyRowsInDimReduction = true),
        (this.clusterAfterDimRed = false)
    },
    changeHeatmap() {
      this.dataChanging += 1
      console.log('Data changing', this.dataChanging)
    },
    getCurrentHeatmapSettings(): HeatmapSettings {
      return {
        csvFile: this.csvFile,
        idsColumnName: 'row_index',
        rowNamesColumnName: 'row_ids',
        collectionColumnNames: ['edition'],
        selectedRowIds: this.selectedRowIds,
        selectedColumns: this.selectedColumns,

        stickyColumns: this.stickyColumns,
        sortColumnsBasedOnStickyRows: this.sortColumnsBasedOnStickyRows,
        sortOrderColumns: this.sortOrderColumns,

        stickyRowIds: this.stickyRowsIndexes,
        clusterRowsBasedOnStickyColumns: this.clusterRowsBasedOnStickyColumns,

        clusterByCollections: this.clusterByCollections,
        clusterSize: this.clusterSize,
        dimReductionAlgo: this.dimReductionAlgoEnum,
        clusterAfterDimRed: this.clusterAfterDimRed,
        absRelLog: this.selectedAbsRel
      }
    }
  }
})
