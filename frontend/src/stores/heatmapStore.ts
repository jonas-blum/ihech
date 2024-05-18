import { defineStore } from 'pinia'
import {
  type HeatmapJSON,
  type ItemNameAndData,
  findRowByIndex,
  type CsvDataTableProfile,
  ScalingEnum,
  DimReductionAlgoEnum,
  SortOrderAttributes,
  type HeatmapSettings,
  ColoringHeatmapEnum,
  COLORS,
  getDistinctColor,
} from '../helpers/helpers'

export interface HeatmapStoreState {
  dataTables: CsvDataTableProfile[]
  activeDataTable: CsvDataTableProfile | null

  heatmap: HeatmapJSON
  highlightedRow: ItemNameAndData | null

  initialAttributeOrder: string[]
  initialAttributeDissimilarities: number[]

  dataChanging: number
  loading: boolean
  timer: number

  outOfSync: boolean
}

export const useHeatmapStore = defineStore('heatmapStore', {
  state: (): HeatmapStoreState => ({
    dataTables: [],
    activeDataTable: null,

    heatmap: {
      attributeNames: [],
      attributeDissimilarities: [],
      itemNamesAndData: [],
      maxHeatmapValue: 100,
      minHeatmapValue: 0,
      maxDimRedXValue: 100,
      maxDimRedYValue: 0,
      minDimRedXValue: 0,
      minDimRedYValue: 100,
    },
    highlightedRow: null,

    initialAttributeOrder: [],
    initialAttributeDissimilarities: [],

    dataChanging: 1,
    loading: false,
    timer: 0,

    outOfSync: false,
  }),
  getters: {
    getAllDataTables: (state) => state.dataTables,
    getAllDataTableNames: (state) => state.dataTables.map((table) => table.tableName),
    getActiveDataTable: (state) => state.activeDataTable,

    getHeatmap: (state) => state.heatmap,
    getHeatmapMaxValue: (state) => state.heatmap.maxHeatmapValue,
    getHeatmapMinValue: (state) => state.heatmap.minHeatmapValue,
    getDimRedMaxXValue: (state) => state.heatmap.maxDimRedXValue,
    getDimRedMinXValue: (state) => state.heatmap.minDimRedXValue,
    getDimRedMaxYValue: (state) => state.heatmap.maxDimRedYValue,
    getDimRedMinYValue: (state) => state.heatmap.minDimRedYValue,
    getHighlightedRow: (state) => state.highlightedRow,

    getAmountOfStickyItems: (state) =>
      state.activeDataTable ? state.activeDataTable.stickyItemIndexes.length : 0,
    getAmountOfStickyAttributes: (state) =>
      state.activeDataTable ? state.activeDataTable.stickyAttributes.length : 0,

    isStickyItemsGapVisible: (state) => {
      if (!state.activeDataTable) {
        return false
      }
      return state.activeDataTable.stickyItemIndexes.length > 0
    },

    isStickyAttributesGapVisible: (state) => {
      if (!state.activeDataTable) {
        return false
      }
      return state.activeDataTable.stickyAttributes.length > 0
    },

    getStickyItems: (state) => {
      if (!state.activeDataTable) {
        return []
      }
      return state.heatmap.itemNamesAndData.slice(0, state.activeDataTable.stickyItemIndexes.length)
    },

    getDataChanging: (state) => state.dataChanging,
    isLoading: (state) => state.loading,
    getTimer: (state) => state.timer,

    isOutOfSync: (state) => state.outOfSync,
  },
  actions: {
    saveDataTable(dataTable: CsvDataTableProfile) {
      if (
        dataTable.tableName === null ||
        dataTable.df === null ||
        dataTable.itemNamesColumnName === null
      ) {
        console.error('Error during adding data table to heatmap store')
      }
      if (this.getAllDataTableNames.includes(dataTable.tableName)) {
        const index = this.dataTables.findIndex((table) => table.tableName === dataTable.tableName)
        this.dataTables[index] = dataTable
      } else {
        this.dataTables.push(dataTable)
      }
      this.setActiveDataTable(dataTable)
      this.fetchHeatmap()
    },
    setActiveDataTable(dataTable: CsvDataTableProfile) {
      this.activeDataTable = dataTable
    },
    async fetchHeatmap() {
      try {
        if (!this.activeDataTable) {
          console.error('No active data table')
          return
        }
        console.log('fetchingHeatmap....')
        this.loading = true
        const startTime = new Date().getTime()
        const settings: HeatmapSettings = this.getCurrentHeatmapSettings()
        console.log('settings', settings)

        const requestInit: RequestInit = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings }),
        }

        console.log(import.meta.env.VITE_API_URL)
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
        this.initialAttributeDissimilarities = [...receivedHeatmap.attributeDissimilarities]

        const stickyRows: ItemNameAndData[] = []

        for (const stickyRow of settings.stickyItemIndexes) {
          receivedHeatmap.itemNamesAndData.forEach((row) => {
            const foundRow = findRowByIndex(row, stickyRow)
            if (foundRow) {
              stickyRows.push(foundRow)
            }
          })
        }

        receivedHeatmap.itemNamesAndData = [...stickyRows, ...receivedHeatmap.itemNamesAndData]

        this.heatmap = receivedHeatmap

        this.toggleStickyAttribute(this.initialAttributeOrder[0])
        this.toggleStickyAttribute(this.initialAttributeOrder[0])
        this.reorderAllDataBasedOnNewAttributeOrder()
        console.log('Done fetching heatmap in', new Date().getTime() - startTime, 'ms.')
        console.log('heatmap', this.heatmap)
        this.changeHeatmap()
      } catch (error) {
        console.error('Error during fetching heatmap', error)
      } finally {
        this.loading = false
      }
    },
    setTimer(timer: number) {
      this.timer = timer
    },
    setScaling(scaling: ScalingEnum) {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return
      }
      this.activeDataTable.scaling = scaling
    },
    setColoringHeatmap(coloringHeatmap: ColoringHeatmapEnum) {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return
      }
      this.activeDataTable.coloringHeatmap = coloringHeatmap
      this.changeHeatmap()
    },
    setClusterByCollections(clusterByCollections: boolean) {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return
      }
      this.activeDataTable.clusterByCollections = clusterByCollections
    },
    setSortOrderAttributes(sortOrderAttributes: SortOrderAttributes) {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return
      }
      this.activeDataTable.sortOrderAttributes = sortOrderAttributes
    },
    setSortAttributesBasedOnStickyItems(sortAttributesBasedOnStickyItems: boolean) {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return
      }
      this.activeDataTable.sortAttributesBasedOnStickyItems = sortAttributesBasedOnStickyItems
    },
    setClusterSize(clusterSize: number) {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return
      }
      this.activeDataTable.clusterSize = clusterSize
    },
    setDimReductionAlgo(dimReductionAlgo: DimReductionAlgoEnum) {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return
      }
      this.activeDataTable.dimReductionAlgo = dimReductionAlgo
    },
    setHighlightedRow(row: ItemNameAndData | null) {
      this.highlightedRow = row
    },
    setClusterAfterDimRed(clusterAfterDim: boolean) {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return
      }
      this.activeDataTable.clusterAfterDimRed = clusterAfterDim
    },

    getCurrentHeatmapSettings(): HeatmapSettings {
      if (!this.activeDataTable) {
        console.error('No active data table')
        throw new Error('No active data table')
      }
      return {
        csvFile: this.activeDataTable.csvFile,

        itemNamesColumnName: this.activeDataTable.itemNamesColumnName,
        collectionColumnNames: this.activeDataTable.collectionColumnNames,

        selectedItemIndexes: this.activeDataTable.selectedItemIndexes,
        selectedAttributes: this.activeDataTable.selectedAttributes,

        stickyAttributes: this.activeDataTable.stickyAttributes,
        sortAttributesBasedOnStickyItems: this.activeDataTable.sortAttributesBasedOnStickyItems,
        sortOrderAttributes: this.activeDataTable.sortOrderAttributes,

        stickyItemIndexes: this.activeDataTable.stickyItemIndexes,
        clusterItemsBasedOnStickyAttributes:
          this.activeDataTable.clusterItemsBasedOnStickyAttributes,

        clusterByCollections: this.activeDataTable.clusterByCollections,

        clusterSize: this.activeDataTable.clusterSize,
        dimReductionAlgo: this.activeDataTable.dimReductionAlgo,
        clusterAfterDimRed: this.activeDataTable.clusterAfterDimRed,

        scaling: this.activeDataTable.scaling,
      }
    },
    changeHeatmap(): void {
      this.dataChanging++
      console.log('changing heatmap', this.dataChanging)
    },

    getCollectionNamesOfItemRecursively(item: ItemNameAndData): string[] {
      if (!this.activeDataTable) {
        return []
      }
      if (item.children === null) {
        if (item.index !== null) {
          return [this.activeDataTable.itemCollectionMap[item.index]]
        }
        return []
      }
      const collections = []
      for (const child of item.children) {
        collections.push(...this.getCollectionNamesOfItemRecursively(child))
      }
      return collections
    },

    getCollectionNamesOfItem(item: ItemNameAndData): string[] {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return []
      }
      const collectionColumnNames = this.getCollectionNamesOfItemRecursively(item)
      return [...new Set(collectionColumnNames)]
    },
    updateSelectedItemIndexesBasedOnSelectedCollections(): void {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return
      }
      const newSelectedItemIndexes: number[] = []

      const selectedCollections = this.activeDataTable.selectedFirstLayerCollections
      const collectionColumnName = this.activeDataTable.collectionColumnNames[0]

      this.activeDataTable.df.forEach((row, index) => {
        const rowCollection = row[collectionColumnName]
        if (selectedCollections.includes(rowCollection)) {
          newSelectedItemIndexes.push(index)
        }
      })
      this.activeDataTable.selectedItemIndexes = newSelectedItemIndexes
    },

    isCollectionEnabled(collection: string): boolean {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return false
      }
      return this.activeDataTable.selectedFirstLayerCollections.includes(collection)
    },
    toggleCollectionEnabled(collection: string) {
      if (this.isCollectionEnabled(collection)) {
        this.disabledCollection(collection)
      } else {
        this.enableCollection(collection)
      }
    },
    enableCollection(collection: string) {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return
      }
      this.activeDataTable.selectedFirstLayerCollections.push(collection)
      this.updateSelectedItemIndexesBasedOnSelectedCollections()
      this.changeHeatmap()
      this.setIsOutOfSync(true)
    },
    disabledCollection(collection: string) {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return
      }
      this.activeDataTable.selectedFirstLayerCollections =
        this.activeDataTable.selectedFirstLayerCollections.filter((col) => col !== collection)
      this.updateSelectedItemIndexesBasedOnSelectedCollections()
      this.changeHeatmap()
      this.setIsOutOfSync(true)
    },

    setIsOutOfSync(outOfSync: boolean) {
      this.outOfSync = outOfSync
    },

    getColorsOfItem(item: ItemNameAndData): string[] {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return ['black']
      }
      if (this.activeDataTable.collectionColumnNames.length === 0) {
        let topMostParent = item
        while (topMostParent.parent !== null) {
          topMostParent = topMostParent.parent
        }
        const index =
          this.heatmap.itemNamesAndData.indexOf(topMostParent) - this.getAmountOfStickyItems
        return [getDistinctColor(index)]
      }

      const collectionsOfItem = this.getCollectionNamesOfItem(item)
      const colors: string[] = []
      for (const collection of collectionsOfItem) {
        const color = this.activeDataTable.collectionColorMap[collection]
        if (color) {
          colors.push(color)
        }
      }
      return colors
    },
    getColorOfCollection(collection: string): string {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return 'black'
      }
      return this.activeDataTable.collectionColorMap[collection] || 'black'
    },
    setColorOfCollection(collection: string, color: string) {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return
      }
      this.activeDataTable.collectionColorMap[collection] = color
      this.changeHeatmap()
    },
    reorderColDissimilarities(): void {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return
      }
      const indexMap = new Map<string, number>()
      this.initialAttributeOrder.forEach((attribute, index) => {
        indexMap.set(attribute, index)
      })

      const indexNumbers = this.heatmap.attributeNames.map((colName) => indexMap.get(colName))
      const newColDissimilarities = new Array(this.initialAttributeDissimilarities.length)

      if (!this.activeDataTable) {
        console.error('No active data table')
        return
      }

      indexNumbers.forEach((originalIndex, newIndex) => {
        if (originalIndex !== undefined) {
          newColDissimilarities[newIndex] = this.initialAttributeDissimilarities[originalIndex]
        }
      })
      this.heatmap.attributeDissimilarities = newColDissimilarities
    },
    toggleShowOnlyStickyItemsInDimReduction(showOnlyStickyItemsInDimRed: boolean) {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return
      }

      this.activeDataTable.showOnlyStickyItemsInDimReduction = showOnlyStickyItemsInDimRed
    },
    toggleStickyItem(stickyItem: ItemNameAndData) {
      if (!this.activeDataTable) {
        console.error('No active data table')
        throw new Error('No active data table')
      }

      if (stickyItem.children) {
        return
      }

      const stickyItems = this.getStickyItems

      const previousNonStickyItems = this.heatmap.itemNamesAndData.slice(
        stickyItems.length,
        undefined,
      )

      if (stickyItems.includes(stickyItem)) {
        this.activeDataTable.stickyItemIndexes = this.activeDataTable.stickyItemIndexes.filter(
          (item) => item !== stickyItem.index,
        )
        stickyItems.splice(stickyItems.indexOf(stickyItem), 1)
        this.heatmap.itemNamesAndData = [...stickyItems, ...previousNonStickyItems]
      } else {
        if (stickyItem.index !== null) {
          this.activeDataTable.stickyItemIndexes.push(stickyItem.index)
          stickyItems.push(stickyItem)
          this.heatmap.itemNamesAndData = [...stickyItems, ...previousNonStickyItems]
        }
      }

      this.changeHeatmap()
    },
    toggleStickyAttribute(attribute: string) {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return
      }

      this.activeDataTable.stickyAttributes = this.activeDataTable.stickyAttributes.filter((attr) =>
        this.heatmap.attributeNames.includes(attr),
      )
      if (this.activeDataTable.stickyAttributes.includes(attribute)) {
        this.activeDataTable.stickyAttributes = this.activeDataTable.stickyAttributes.filter(
          (attr) => attr !== attribute,
        )

        if (!this.activeDataTable) {
          console.error('No active data table')
          return
        }

        this.heatmap.attributeNames.sort((a, b) => {
          if (
            !this.activeDataTable?.stickyAttributes.includes(a) &&
            !this.activeDataTable?.stickyAttributes.includes(b)
          ) {
            return this.initialAttributeOrder.indexOf(a) - this.initialAttributeOrder.indexOf(b)
          }
          if (
            this.activeDataTable?.stickyAttributes.includes(a) &&
            !this.activeDataTable?.stickyAttributes.includes(b)
          ) {
            return -1
          }
          if (
            this.activeDataTable.stickyAttributes.includes(b) &&
            !this.activeDataTable.stickyAttributes.includes(a)
          ) {
            return 1
          }
          return 0
        })
      } else {
        if (!this.activeDataTable) {
          console.error('No active data table')
          return
        }

        this.activeDataTable.stickyAttributes.push(attribute)
        this.heatmap.attributeNames.sort((a, b) => {
          if (a === attribute) {
            return -2
          }
          if (
            this.activeDataTable?.stickyAttributes.includes(a) &&
            !this.activeDataTable?.stickyAttributes.includes(b)
          ) {
            return -1
          }
          if (
            this.activeDataTable?.stickyAttributes.includes(b) &&
            !this.activeDataTable?.stickyAttributes.includes(a)
          ) {
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
      if (!this.activeDataTable) {
        console.error('No active data table')
        throw new Error('No active data table')
      }

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
      if (!this.activeDataTable) {
        console.error('No active data table')
        throw new Error('No active data table')
      }
      this.activeDataTable.clusterItemsBasedOnStickyAttributes = clusterItemsBasedOnStickyAttributes
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
    },
  },
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
