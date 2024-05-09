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
  'row_id',
  'row_name',
  'amount_of_data_points',
  'dim_reduction_1',
  'dim_reduction_2',
  'is_open',
  'is_visible'
]

export interface HeatmapJSON {
  heatmapCSV: string
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
  visibleHeatmap: dataForge.IDataFrame<any, any>
  initialColumnsOrder: string[]

  col_dissimilarities: number[]
  initial_col_dissimilarities: number[]

  dataChanging: number
  highlightedRowIndex: number | null
  stickyRowsIndexes: string[]
  stickyColumns: string[]
  loading: boolean

  minHeatmapValue: number
  maxHeatmapValue: number
  heatmapColorMaxValue: number

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
    visibleHeatmap: new dataForge.DataFrame<any, any>(),
    initialColumnsOrder: [],

    col_dissimilarities: [],
    initial_col_dissimilarities: [],

    dataChanging: 1,
    highlightedRowIndex: null,
    stickyRowsIndexes: [],
    stickyColumns: [],
    loading: false,

    minHeatmapValue: 0,
    maxHeatmapValue: 100,
    heatmapColorMaxValue: 100,

    selectedAbsRel: AbsRelEnum.ABS,
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
    getHeatmapOnlyAttributes: (state) => state.heatmap.dropSeries(NON_ATTRIBUTE_COLUMNS),
    getVisibleHeatmap: (state) => state.visibleHeatmap,
    getVisibleHeatmapOnlyAttributes: (state) =>
      state.visibleHeatmap.dropSeries(NON_ATTRIBUTE_COLUMNS),

    getNumberOfVisibleRows: (state) => state.visibleHeatmap.count(),

    isDataChanging: (state) => state.dataChanging,
    getHighlightedRowIndex: (state) => state.highlightedRowIndex,
    getStickyRowsIndexes: (state) => state.stickyRowsIndexes,
    getStickyColumns: (state) => state.stickyColumns,
    isLoading: (state) => state.loading,

    getColDissimilarities: (state) => state.col_dissimilarities,

    isStickyRowsGapVisible: (state) => state.stickyRowsIndexes.length > 0,

    isStickyColumnsGapVisible: (state) => state.stickyColumns.length > 0,

    getMinHeatmapValue: (state) => state.minHeatmapValue,
    getMaxHeatmapValue: (state) => state.maxHeatmapValue,
    getHeatmapColorMaxValue: (state) => state.heatmapColorMaxValue,

    getSelectedAbsRel: (state) => state.selectedAbsRel,
    isClusterByCollections: (state) => state.clusterByCollections,
    getSortOrderColumns: (state) => state.sortOrderColumns,
    getClusterSize: (state) => state.clusterSize,
    getDimReductionAlgo: (state) => state.dimReductionAlgoEnum,
    isClusterRowsBasedOnStickyColumns: (state) => state.clusterRowsBasedOnStickyColumns,
    isSortColumnsBasedOnStickyRows: (state) => state.sortColumnsBasedOnStickyRows,
    isOnlyStickyRowsShownInDimReduction: (state) => state.showOnlyStickyRowsInDimReduction
  },
  actions: {
    async fetchHeatmap() {
      const startTime = new Date().getTime()

      console.log('fetchingHeatmap....')
      this.loading = true

      const settings: HeatmapSettings = this.getCurrentHeatmapSettings()

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/heatmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      })

      const receivedHeatmap: HeatmapJSON = await response.json()
      if (!receivedHeatmap) {
        console.error('No heatmap data received.')
        return
      }

      let heatmapDF: dataForge.IDataFrame<any, any> = dataForge
        .fromCSV(receivedHeatmap.heatmapCSV, { dynamicTyping: true })
        .setIndex('row_index')

      const heatmapDFCopy: dataForge.IDataFrame<any, any> = dataForge
        .fromCSV(receivedHeatmap.heatmapCSV, { dynamicTyping: true })
        .setIndex('row_index')

      heatmapDF = heatmapDF.generateSeries({
        is_open: (row) => (row.parent_index === 0 ? true : false)
      })

      const heatmapDFCopy2 = heatmapDF

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

      heatmapDF = heatmapDF.generateSeries({
        is_visible: (row) => {
          if (row.is_open) {
            return true
          }
          if (row.parent_index === 0) {
            return true
          }
          const parentRows = heatmapDFCopy2.where(
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

      this.updateMaxMinValues()

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
      this.selectedColumns = heatmapDF.dropSeries(['row_ids', 'edition']).getColumnNames()

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
      this.visibleHeatmap = this.heatmap.where((row) => row.is_visible)
      this.dataChanging += 1
      console.log('Data changing', this.dataChanging)
    },
    getCurrentHeatmapSettings(): HeatmapSettings {
      return {
        csvFile: this.csvFile,
        idsColumnName: this.idsColumnName,
        rowNamesColumnName: this.rowNamesColumnName,
        collectionColumnNames: this.collectionColumnNames,
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
    },
    updateMaxMinValues() {
      this.minHeatmapValue = 0
      this.maxHeatmapValue = 100
      if (this.getSelectedAbsRel === AbsRelEnum.REL) {
        this.heatmapColorMaxValue = 1
      } else if (this.getSelectedAbsRel === AbsRelEnum.LOG) {
        this.heatmapColorMaxValue = Math.log(this.maxHeatmapValue + 1)
      } else if (this.getSelectedAbsRel === AbsRelEnum.ABS) {
        this.heatmapColorMaxValue = this.maxHeatmapValue
      }
      this.heatmapColorMaxValue = this.maxHeatmapValue
    }
  }
})
