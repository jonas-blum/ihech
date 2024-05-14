import { defineStore } from 'pinia'
import {
  type HeatmapJSON,
  type ItemNameAndData,
  findRowByName,
  type CsvDataTable
} from '../helpers/helpers'

import * as dataForge from 'data-forge'

export enum AbsRelLogEnum {
  REL = 'REL',
  ABS = 'ABS',
  LOG = 'LOG'
}

export enum MedianMaxMinEnum {
  MEDIAN = 'MEDIAN',
  MIN = 'MIN',
  MAX = 'MAX'
}

export enum DimReductionAlgoEnum {
  PCA = 'PCA',
  UMAP = 'UMAP',
  TSNE = 'TSNE'
}

export enum StructuralFeatureEnum {
  BINARY_TAG_EXISTS = 'BINARY_TAG_EXISTS',
  AMOUNT_OF_ATTRIBUTES = 'AMOUNT_OF_ATTRIBUTES',
  AMOUNT_OF_DIFFERENT_ATTRIBUTES = 'AMOUNT_OF_DIFFERENT_ATTRIBUTES',
  AMOUNT_OF_TAGS = 'AMOUNT_OF_TAGS',
  AMOUNT_OF_SIBLING_TAGS = 'AMOUNT_OF_SIBLING_TAGS',
  AMOUNT_OF_DIRECT_CHILDREN_TAGS = 'AMOUNT_OF_DIRECT_CHILDREN_TAGS',
  AMOUNT_OF_INDIRECT_CHILDREN_TAGS = 'AMOUNT_OF_INDIRECT_CHILDREN_TAGS',
  LENGTH_OF_CONTENT_INSIDE_TAG = 'LENGTH_OF_CONTENT_INSIDE_TAG',
  LENGTH_OF_CONTENT_ALL_CHILDREN = 'LENGTH_OF_CONTENT_ALL_CHILDREN',
  DEPTH_OF_TAG = 'DEPTH_OF_TAG'
}

export enum SortOrderAttributes {
  STDEV = 'STDEV',
  ASC = 'ASC',
  DESC = 'DESC',
  ALPHABETICAL = 'ALPHABETICAL'
}

export interface HeatmapSettings {
  csvFile: string

  idsColumnName: string
  itemNamesColumnName: string
  collectionColumnNames: string[]

  selectedItemIds: string[]
  selectedAttributes: string[]

  stickyAttributes: string[]
  sortAttributesBasedOnStickyItems: boolean
  sortOrderAttributes: SortOrderAttributes

  stickyItemIds: string[]
  clusterItemsBasedOnStickyAttributes: boolean

  clusterByCollections: boolean

  clusterSize: number
  dimReductionAlgo: DimReductionAlgoEnum
  clusterAfterDimRed: boolean

  absRelLog: AbsRelLogEnum

  medianMaxMin: MedianMaxMinEnum
  structuralFeature: StructuralFeatureEnum
}

export interface HeatmapStoreState {
  dataTables: CsvDataTable[]
  activeDataTable: CsvDataTable | null

  csvFile: string

  idsColumnName: string
  itemNamesColumnName: string
  collectionColumnNames: string[]

  selectedItemIds: string[]
  selectedAttributes: string[]

  heatmap: HeatmapJSON
  initialAttributeOrder: string[]
  initialColDissimilarities: number[]
  selectedFeature: StructuralFeatureEnum
  selectedAbsRel: AbsRelLogEnum
  selectedMedianMaxMin: MedianMaxMinEnum
  clusterByEditions: boolean
  sortOrderColumns: SortOrderAttributes
  sortColumnsBasedOnStickyItems: boolean
  clusterSize: number
  dimReductionAlgoEnum: DimReductionAlgoEnum
  dataChanging: number
  highlightedRow: ItemNameAndData | null
  amountOfStickyItems: number
  loading: boolean
  stickyAttributes: string[]
  clusterItemsBasedOnStickyAttributes: boolean
  showOnlyStickyItemsInDimReduction: boolean
  clusterAfterDimRed: boolean
  timer: number
}

export const useHeatmapStore = defineStore('heatmapStore', {
  state: (): HeatmapStoreState => ({
    dataTables: [],
    activeDataTable: null,
    csvFile: '',
    idsColumnName: 'document_id',
    itemNamesColumnName: 'document_id',
    collectionColumnNames: ['tei-edition-label'],
    selectedItemIds: [],
    selectedAttributes: [],
    heatmap: {
      attributeNames: [],
      attributeDissimilarities: [],
      itemNamesAndData: [],
      maxHeatmapValue: 100,
      minHeatmapValue: 0,
      maxDimRedXValue: 100,
      maxDimRedYValue: 0,
      minDimRedXValue: 0,
      minDimRedYValue: 100
    },
    initialAttributeOrder: [],
    initialColDissimilarities: [],
    selectedFeature: StructuralFeatureEnum.BINARY_TAG_EXISTS,
    selectedAbsRel: AbsRelLogEnum.REL,
    selectedMedianMaxMin: MedianMaxMinEnum.MEDIAN,
    clusterByEditions: false,
    sortOrderColumns: SortOrderAttributes.STDEV,
    sortColumnsBasedOnStickyItems: false,
    clusterSize: 6,
    dimReductionAlgoEnum: DimReductionAlgoEnum.PCA,
    dataChanging: 1,
    highlightedRow: null,
    amountOfStickyItems: 0,
    loading: false,
    stickyAttributes: [],
    clusterItemsBasedOnStickyAttributes: false,
    showOnlyStickyItemsInDimReduction: false,
    clusterAfterDimRed: false,
    timer: 0
  }),
  getters: {
    getAllDataTables: (state) => state.dataTables,
    getActiveDataTable: (state) => state.activeDataTable,
    getHeatmap: (state) => state.heatmap,
    getHeatmapMaxValue: (state) => state.heatmap.maxHeatmapValue,
    getHeatmapMinValue: (state) => state.heatmap.minHeatmapValue,
    getDimRedMaxXValue: (state) => state.heatmap.maxDimRedXValue,
    getDimRedMinXValue: (state) => state.heatmap.minDimRedXValue,
    getDimRedMaxYValue: (state) => state.heatmap.maxDimRedYValue,
    getDimRedMinYValue: (state) => state.heatmap.minDimRedYValue,
    getSelectedFeature: (state) => state.selectedFeature,
    getSelectedAbsRel: (state) => state.selectedAbsRel,
    getSelectedMedianMaxMin: (state) => state.selectedMedianMaxMin,
    getSortOrderColumns: (state) => state.sortOrderColumns,
    isSortColumnsBasedOnStickyItems: (state) => state.sortColumnsBasedOnStickyItems,
    getClusterSize: (state) => state.clusterSize,
    getDimReductionAlgo: (state) => state.dimReductionAlgoEnum,
    getDataChanging: (state) => state.dataChanging,
    getHighlightedRow: (state) => state.highlightedRow,
    getAmountOfStickyItems: (state) => state.amountOfStickyItems,
    getStickyItems: (state) =>
      state.heatmap?.itemNamesAndData?.slice(0, state.amountOfStickyItems) || [],
    getStickyAttributes: (state) => state.stickyAttributes,
    getColDissimilarities: (state) => state.heatmap.attributeDissimilarities,
    isMedianMaxMinDisabled: (state) =>
      state.selectedFeature === StructuralFeatureEnum.AMOUNT_OF_TAGS ||
      state.selectedFeature === StructuralFeatureEnum.AMOUNT_OF_DIFFERENT_ATTRIBUTES ||
      state.selectedFeature === StructuralFeatureEnum.BINARY_TAG_EXISTS,
    isClusteredByEditions: (state) => state.clusterByEditions,
    isLoading: (state) => state.loading,
    isClusterItemsBasedOnStickyAttributes: (state) => state.clusterItemsBasedOnStickyAttributes,
    isOnlyStickyItemsShownInDimReduction: (state) => state.showOnlyStickyItemsInDimReduction,
    isClusterAfterDimRed: (state) => state.clusterAfterDimRed,
    isStickyAttributesGapVisible: (state) => state.stickyAttributes.length > 0,
    isStickyItemsGapVisible: (state) => state.amountOfStickyItems > 0,
    getTimer: (state) => state.timer
  },
  actions: {
    addDataTable(dataTable: CsvDataTable) {
      if (
        dataTable.tableName === null ||
        dataTable.df === null ||
        dataTable.selectedItemNameColumn === null
      ) {
        console.error('Error during adding data table to heatmap store')
      }
      this.dataTables.push(dataTable)
    },
    setActiveDataTable(dataTable: CsvDataTable) {
      this.activeDataTable = dataTable
    },
    async fetchHeatmap() {
      console.log('fetchingHeatmap....')
      this.loading = true
      const startTime = new Date().getTime()
      const settings: HeatmapSettings = this.getCurrentHeatmapSettings()
      console.log('settings', settings)
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
      receivedHeatmap.itemNamesAndData.forEach((row) => {
        setParentOfRowsRec(row, null)
      })
      receivedHeatmap.itemNamesAndData.forEach((row) => {
        recursivelyCopyData(row)
      })

      this.initialAttributeOrder = [...receivedHeatmap.attributeNames]
      this.initialColDissimilarities = [...receivedHeatmap.attributeDissimilarities]

      const stickyRows: ItemNameAndData[] = []

      for (const stickyRow of settings.stickyItemIds) {
        receivedHeatmap.itemNamesAndData.forEach((row) => {
          const foundRow = findRowByName(row, stickyRow)
          if (foundRow) {
            stickyRows.push(foundRow)
          }
        })
      }
      this.amountOfStickyItems = stickyRows.length

      receivedHeatmap.itemNamesAndData = [...stickyRows, ...receivedHeatmap.itemNamesAndData]
      // await usePCAStore().updatePCA()
      this.heatmap = receivedHeatmap

      this.toggleStickyAttribute(this.initialAttributeOrder[0])
      this.toggleStickyAttribute(this.initialAttributeOrder[0])
      this.reorderAllDataBasedOnNewAttributeOrder()
      console.log('Done fetching heatmap in', new Date().getTime() - startTime, 'ms.')
      this.changeHeatmap()
      this.loading = false
    },
    setTimer(timer: number) {
      this.timer = timer
    },
    setStructuralFeature(structuralFeature: StructuralFeatureEnum) {
      this.selectedFeature = structuralFeature
    },
    setAbsRel(absRel: AbsRelLogEnum) {
      this.selectedAbsRel = absRel
    },
    setMedianMaxMin(medianMaxMin: MedianMaxMinEnum) {
      this.selectedMedianMaxMin = medianMaxMin
    },
    setClusterByEditions(clusterByEditions: boolean) {
      this.clusterByEditions = clusterByEditions
    },
    setSortOrderColumns(sortOrderColumns: SortOrderAttributes) {
      this.sortOrderColumns = sortOrderColumns
    },
    setSortColumnsBasedOnStickyItems(sortColumnsBasedOnStickyItems: boolean) {
      this.sortColumnsBasedOnStickyItems = sortColumnsBasedOnStickyItems
    },
    setClusterSize(clusterSize: number) {
      this.clusterSize = clusterSize
    },
    setDimReductionAlgo(dimReductionAlgo: DimReductionAlgoEnum) {
      this.dimReductionAlgoEnum = dimReductionAlgo
    },
    setHighlightedRow(row: ItemNameAndData | null) {
      this.highlightedRow = row
    },
    setIsClusterAfterDimRed(clusterAfterDim: boolean) {
      this.clusterAfterDimRed = clusterAfterDim
    },
    async uploadCsvFile(csvFile: string) {
      this.idsColumnName = 'row_id'
      this.itemNamesColumnName = 'row_id'
      this.collectionColumnNames = ['edition']

      this.csvFile = csvFile
      const heatmapDF: dataForge.IDataFrame<any, any> = dataForge
        .fromCSV(csvFile, { dynamicTyping: true })
        .setIndex(this.idsColumnName)

      this.selectedItemIds = heatmapDF.getIndex().toArray()
      this.selectedAttributes = heatmapDF.dropSeries(['row_id', 'edition']).getColumnNames()

      await this.fetchHeatmap()
    },
    resetSettings() {
      // ;(this.heatmap = {
      //   attributeNames: [],
      //   attributeDissimilarities: [],
      //   itemNamesAndData: [],
      //   maxHeatmapValue: 100,
      //   minHeatmapValue: 0,
      //   maxDimRedXValue: 100,
      //   maxDimRedYValue: 0,
      //   minDimRedXValue: 0,
      //   minDimRedYValue: 100
      // }),
      //   (this.initialAttributeOrder = []),
      //   (this.initialColDissimilarities = []),
      //   (this.selectedFeature = StructuralFeatureEnum.BINARY_TAG_EXISTS),
      //   (this.selectedAbsRel = AbsRelLogEnum.REL),
      //   (this.selectedMedianMaxMin = MedianMaxMinEnum.MEDIAN),
      //   (this.clusterByEditions = false),
      //   (this.sortOrderColumns = SortOrderAttributes.STDEV),
      //   (this.sortColumnsBasedOnStickyItems = false),
      //   (this.clusterSize = 6),
      //   (this.dimReductionAlgoEnum = DimReductionAlgoEnum.PCA),
      //   (this.dataChanging = 1),
      //   (this.highlightedRow = null),
      //   (this.amountOfStickyItems = 0),
      //   (this.loading = false),
      //   (this.stickyAttributes = []),
      //   (this.clusterItemsBasedOnStickyAttributes = false),
      //   (this.showOnlyStickyItemsInDimReduction = false),
      //   (this.clusterAfterDimRed = false)
    },
    getCurrentHeatmapSettings(): HeatmapSettings {
      return {
        csvFile: this.csvFile,

        idsColumnName: this.idsColumnName,
        itemNamesColumnName: this.itemNamesColumnName,
        collectionColumnNames: this.collectionColumnNames,

        selectedItemIds: this.selectedItemIds,
        selectedAttributes: this.selectedAttributes,

        stickyAttributes: this.stickyAttributes,
        sortAttributesBasedOnStickyItems: this.sortColumnsBasedOnStickyItems,
        sortOrderAttributes: this.sortOrderColumns,

        stickyItemIds: this.getStickyItems.map((item: ItemNameAndData) => item.itemName),
        clusterItemsBasedOnStickyAttributes: this.clusterItemsBasedOnStickyAttributes,

        clusterByCollections: this.clusterByEditions,

        clusterSize: this.clusterSize,
        dimReductionAlgo: this.dimReductionAlgoEnum,
        clusterAfterDimRed: this.clusterAfterDimRed,

        absRelLog: this.selectedAbsRel,

        medianMaxMin: this.selectedMedianMaxMin,
        structuralFeature: this.selectedFeature
      }
    },
    changeHeatmap(): void {
      this.dataChanging++
      console.log('changing heatmap', this.dataChanging)
    },
    reorderColDissimilarities(): void {
      const indexMap = new Map<string, number>()
      this.initialAttributeOrder.forEach((attribute, index) => {
        indexMap.set(attribute, index)
      })

      const indexNumbers = this.heatmap.attributeNames.map((colName) => indexMap.get(colName))
      const newColDissimilarities = new Array(this.initialColDissimilarities.length)
      indexNumbers.forEach((originalIndex, newIndex) => {
        if (originalIndex) {
          newColDissimilarities[newIndex] = this.initialColDissimilarities[originalIndex]
        }
      })
      this.heatmap.attributeDissimilarities = newColDissimilarities
    },
    toggleShowOnlyStickyItemsInDimReduction(showOnlyStickyItemsInDimRed: boolean) {
      this.showOnlyStickyItemsInDimReduction = showOnlyStickyItemsInDimRed
    },
    toggleStickyAttribute(attribute: string) {
      this.stickyAttributes = this.stickyAttributes.filter((attr) =>
        this.heatmap.attributeNames.includes(attr)
      )
      if (this.stickyAttributes.includes(attribute)) {
        this.stickyAttributes = this.stickyAttributes.filter((attr) => attr !== attribute)
        this.heatmap.attributeNames = this.heatmap.attributeNames.sort((a, b) => {
          if (!this.stickyAttributes.includes(a) && !this.stickyAttributes.includes(b)) {
            return this.initialAttributeOrder.indexOf(a) - this.initialAttributeOrder.indexOf(b)
          }
          if (this.stickyAttributes.includes(a) && !this.stickyAttributes.includes(b)) {
            return -1
          }
          if (this.stickyAttributes.includes(b) && !this.stickyAttributes.includes(a)) {
            return 1
          }
          return 0
        })
      } else {
        this.stickyAttributes.push(attribute)
        this.heatmap.attributeNames = this.heatmap.attributeNames.sort((a, b) => {
          if (a === attribute) {
            return -2
          }
          if (this.stickyAttributes.includes(a) && !this.stickyAttributes.includes(b)) {
            return -1
          }
          if (this.stickyAttributes.includes(b) && !this.stickyAttributes.includes(a)) {
            return 1
          }
          return 0
        })
      }
      this.reorderAllDataBasedOnNewAttributeOrder()
      this.reorderColDissimilarities()
      this.changeHeatmap()
    },
    createIndexMap(): number[] {
      const map = new Map<string, number>()
      this.initialAttributeOrder.forEach((attribute, index) => {
        map.set(attribute, index)
      })

      return this.heatmap.attributeNames.map((colName) => map.get(colName) || 0)
    },
    reorderDataBasedOnColNames(row: ItemNameAndData, newIndexOrder: number[]): void {
      if (row.initial_data) {
        const newData = new Array(newIndexOrder.length)
        newIndexOrder.forEach((originalIndex, newIndex) => {
          if (row.initial_data) {
            newData[newIndex] = row.initial_data[originalIndex]
          } else {
            console.error('Error during "reorderDataBasedOnColNames"')
          }
        })
        row.data = newData
      }

      if (row.children) {
        row.children.forEach((child) => {
          this.reorderDataBasedOnColNames(child, newIndexOrder)
        })
      }
    },

    reorderAllDataBasedOnNewAttributeOrder(): void {
      const indexMap = this.createIndexMap()

      this.heatmap.itemNamesAndData.forEach((row) => {
        this.reorderDataBasedOnColNames(row, indexMap)
      })
    },
    setClusterItemsBasedOnStickyAttributes(clusterItemsBasedOnStickyAttributes: boolean) {
      this.clusterItemsBasedOnStickyAttributes = clusterItemsBasedOnStickyAttributes
    },
    toggleStickyItem(row: ItemNameAndData) {
      if (row.children) {
        return
      }
      let removing = false
      let stickyItems = this.heatmap.itemNamesAndData.slice(0, this.amountOfStickyItems)
      if (stickyItems.includes(row)) {
        stickyItems = stickyItems.filter((item) => item !== row)
        removing = true
      } else {
        stickyItems.push(row)
        removing = false
      }
      this.heatmap.itemNamesAndData = [
        ...stickyItems,
        ...this.heatmap.itemNamesAndData.slice(this.amountOfStickyItems)
      ]
      if (removing) {
        this.amountOfStickyItems--
      } else {
        this.amountOfStickyItems++
      }
      this.changeHeatmap()
    },

    expandRow(row: ItemNameAndData) {
      row.isOpen = true
      this.changeHeatmap()
    },
    closeNearestOpenParent(targetRow: ItemNameAndData) {
      if (targetRow.isOpen) {
        targetRow.isOpen = false
        this.closeChildRowsRecursively(targetRow)
        this.changeHeatmap()
        return
      }
      const parent = targetRow.parent

      if (parent?.isOpen) {
        parent.isOpen = false
        this.closeChildRowsRecursively(parent)
        this.changeHeatmap()
        return
      }
      this.changeHeatmap()
    },
    closeRow(row: ItemNameAndData) {
      row.isOpen = false
      this.closeChildRowsRecursively(row)
      this.changeHeatmap()
    },
    closeChildRowsRecursively(row: ItemNameAndData) {
      row.isOpen = false
      row.children?.forEach((child) => {
        this.closeChildRowsRecursively(child)
      })
    },
    toggleOpenRow(row: ItemNameAndData) {
      if (row.isOpen) {
        this.closeRow(row)
      } else {
        this.expandRow(row)
      }
    }
  }
})

function recursivelyCopyData(row: ItemNameAndData): void {
  if (row.children) {
    row.children.forEach((child) => {
      recursivelyCopyData(child)
    })
  }
  row.initial_data = [...row.data]
}

function setParentOfRowsRec(row: ItemNameAndData, parent: ItemNameAndData | null) {
  row.parent = parent
  if (row.children) {
    row.children.forEach((child) => {
      setParentOfRowsRec(child, row)
    })
  }
}
