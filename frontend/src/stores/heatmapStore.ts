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
  getDistinctColor,
} from '../helpers/helpers'
import { nextTick } from 'vue'

export interface HeatmapStoreState {
  dataTables: CsvDataTableProfile[]
  activeDataTable: CsvDataTableProfile | null

  heatmap: HeatmapJSON
  highlightedRow: ItemNameAndData | null

  //From the "newIdx" -> original Index (of the heatmap.attributeNames)
  attributeMap: Map<number, number>

  rowCollectionsMap: Map<ItemNameAndData, Set<string>>

  allItems: ItemNameAndData[]

  dataChanging: number
  loading: boolean
  timer: number

  outOfSync: boolean
  reloadingScheduled: boolean

  csvUploadOpen: boolean
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
      maxAttributeValues: [],
      minAttributeValues: [],
    },
    highlightedRow: null,

    attributeMap: new Map(),

    rowCollectionsMap: new Map(),

    allItems: [],

    dataChanging: 1,
    loading: false,
    timer: 0,

    outOfSync: false,
    reloadingScheduled: false,

    csvUploadOpen: true,
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
    getMaxAttributeValues: (state) => state.heatmap.maxAttributeValues,
    getMinAttributeValues: (state) => state.heatmap.minAttributeValues,

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

    getNonStickyItems: (state) => {
      if (!state.activeDataTable) {
        return []
      }
      return state.heatmap.itemNamesAndData.slice(state.activeDataTable.stickyItemIndexes.length)
    },

    getAllItems: (state) => state.allItems,

    getLogShiftValue: (state) => state.heatmap.minHeatmapValue + 1,

    getDataChanging: (state) => state.dataChanging,
    isLoading: (state) => state.loading,
    getTimer: (state) => state.timer,

    isOutOfSync: (state) => state.outOfSync,

    isCsvUploadOpen: (state) => state.csvUploadOpen,

    isColorScaleNotShown: (state) => {
      if (!state.activeDataTable) {
        return false
      }
      return (
        state.activeDataTable.coloringHeatmap === ColoringHeatmapEnum.ITEM_RELATIVE ||
        state.activeDataTable.coloringHeatmap === ColoringHeatmapEnum.ATTRIBUTE_RELATIVE
      )
    },
  },
  actions: {
    saveDataTable(dataTable: CsvDataTableProfile, fetchHeatmap = true) {
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
      if (fetchHeatmap) {
        this.fetchHeatmap()
      }
    },
    setActiveDataTable(dataTable: CsvDataTableProfile) {
      this.activeDataTable = dataTable
    },
    setCsvUploadOpen(open: boolean) {
      nextTick(() => {
        this.csvUploadOpen = open
      })
    },

    getInitialAttrIdx(newAttrIdx: number): number {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return newAttrIdx
      }
      return this.attributeMap.get(newAttrIdx) ?? newAttrIdx
    },

    getAttrFromNewIdx(newAttrIdx: number): string {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return ''
      }
      const initialIdx = this.attributeMap.get(newAttrIdx)
      if (initialIdx === undefined) {
        return ''
      }
      return this.heatmap.attributeNames[initialIdx]
    },

    getAttrDissFromNewIdx(newAttrIdx: number): number {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return 0
      }
      const initialIdx = this.attributeMap.get(newAttrIdx)
      if (initialIdx === undefined) {
        return 0
      }
      return this.heatmap.attributeDissimilarities[initialIdx]
    },

    recomputeAttributeMap(): void {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return
      }
      const correctAttributesOrder = this.getAttributesInCorrectOrder()
      for (
        let originalIndex = 0;
        originalIndex < this.heatmap.attributeNames.length;
        originalIndex++
      ) {
        const attributeName = this.heatmap.attributeNames[originalIndex]
        this.attributeMap.set(correctAttributesOrder.indexOf(attributeName), originalIndex)
      }
    },

    async fetchHeatmap() {
      if (this.reloadingScheduled) {
        console.log('Reloading scheduled, skipping fetchHeatmap')
        return
      }
      if (this.isLoading) {
        console.log('Already loading, skipping fetchHeatmap, queuing reload')
        this.reloadingScheduled = true
        return
      }

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

        const receivedHeatmap: HeatmapJSON | null = await response.json()

        if (!receivedHeatmap) {
          console.error('No heatmap data received.')
          return
        }
        if (this.activeDataTable === null) {
          console.error('No active data table')
          return
        }

        this.heatmap = receivedHeatmap

        this.heatmap.itemNamesAndData.forEach((row) => {
          setParentOfRowsRec(row, null)
        })

        //Deal with sticky items and correct order
        const stickyRows: ItemNameAndData[] = []

        for (const stickyRow of this.activeDataTable.stickyItemIndexes) {
          this.heatmap.itemNamesAndData.forEach((row) => {
            const foundRow = findRowByIndex(row, stickyRow)
            if (foundRow) {
              stickyRows.push(foundRow)
            }
          })
        }

        this.activeDataTable.stickyItemIndexes = stickyRows
          .map((row) => row.index)
          .filter((index) => index !== null) as number[]

        this.heatmap.itemNamesAndData = [...stickyRows, ...this.heatmap.itemNamesAndData]

        //Deal with sticky Attributes and correct order
        this.activeDataTable.stickyAttributes = this.activeDataTable.stickyAttributes.filter(
          (attr) => this.heatmap.attributeNames.includes(attr),
        )
        this.recomputeAttributeMap()

        this.openAllStickyItems()
        this.buildRowCollectionsMap()
        this.setAllItems()

        console.log('Done fetching heatmap in', new Date().getTime() - startTime, 'ms.')
        this.setIsOutOfSync(false)
        nextTick(() => {
          this.changeHeatmap()
        })
      } catch (error) {
        console.error('Error during fetching heatmap', error)
        this.setIsOutOfSync(true)
      } finally {
        this.loading = false
        if (this.reloadingScheduled) {
          this.reloadingScheduled = false
          this.fetchHeatmap()
        }
      }
    },
    getAttributesInCorrectOrder() {
      if (this.activeDataTable === null) {
        return []
      }
      const nonStickyAttributes = this.heatmap.attributeNames.filter(
        (a) => !this.activeDataTable?.stickyAttributes.includes(a),
      )
      const newAttributeOrder = [...this.activeDataTable.stickyAttributes, ...nonStickyAttributes]

      return newAttributeOrder
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
    setClusterItemsBasedOnStickyAttributes(clusterItemsBasedOnStickyAttributes: boolean) {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return
      }
      this.activeDataTable.clusterItemsBasedOnStickyAttributes = clusterItemsBasedOnStickyAttributes
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

    buildRowCollectionsMapRecursively(item: ItemNameAndData): Set<string> {
      let collectionOfItem = undefined
      if (item.index !== null) {
        collectionOfItem = this.activeDataTable?.itemCollectionMap[item.index]
      }
      const allCollections = new Set<string>()
      if (collectionOfItem !== undefined) {
        allCollections.add(collectionOfItem)
      }
      if (item.children) {
        for (const child of item.children) {
          this.buildRowCollectionsMapRecursively(child).forEach((collection) => {
            allCollections.add(collection)
          })
        }
      }
      this.rowCollectionsMap.set(item, allCollections)
      return allCollections
    },
    buildRowCollectionsMap(): void {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return
      }
      this.heatmap.itemNamesAndData.forEach((item) => {
        this.buildRowCollectionsMapRecursively(item)
      })
    },

    getCollectionNamesOfItem(item: ItemNameAndData): string[] {
      return Array.from(this.rowCollectionsMap.get(item) ?? [])
    },
    updateSelectedItemIndexesBasedOnSelectedCollections(): void {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return
      }
      const newSelectedItemIndexes: number[] = []
      if (
        this.activeDataTable.collectionColumnNames.length === 0 ||
        this.activeDataTable.selectedFirstLayerCollections.length === 0
      ) {
        this.activeDataTable.df.forEach((row, index) => {
          newSelectedItemIndexes.push(index)
        })
      } else {
        const selectedCollections = this.activeDataTable.selectedFirstLayerCollections
        const collectionColumnName = this.activeDataTable.collectionColumnNames[0]

        this.activeDataTable.df.forEach((row, index) => {
          const rowCollection = row[collectionColumnName]
          if (selectedCollections.includes(rowCollection)) {
            newSelectedItemIndexes.push(index)
          }
        })
      }
      this.activeDataTable.selectedItemIndexes = newSelectedItemIndexes
    },

    isCollectionEnabled(collection: string): boolean {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return false
      }
      return this.activeDataTable.selectedFirstLayerCollections.includes(collection)
    },
    areAllCollectionsEnabled(): boolean {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return false
      }

      return (
        this.activeDataTable.selectedFirstLayerCollections.length ===
        this.activeDataTable.firstLayerCollectionNames.length
      )
    },
    toggleAllCollectionsEnabled() {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return
      }
      if (this.areAllCollectionsEnabled()) {
        this.activeDataTable.selectedFirstLayerCollections = []
      } else {
        this.activeDataTable.selectedFirstLayerCollections =
          this.activeDataTable.firstLayerCollectionNames
      }
      this.updateSelectedItemIndexesBasedOnSelectedCollections()
      this.changeHeatmap()
      this.setIsOutOfSync(true)
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
        while (topMostParent.parent !== null && topMostParent.parent.parent !== null) {
          topMostParent = topMostParent.parent
        }
        const childrenOfTopmostItem = this.getNonStickyItems[0]?.children
        if (childrenOfTopmostItem === null || childrenOfTopmostItem === undefined) {
          return ['black']
        }
        const index = childrenOfTopmostItem.indexOf(topMostParent)
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

      if (this.activeDataTable.stickyAttributes.includes(attribute)) {
        this.activeDataTable.stickyAttributes = this.activeDataTable.stickyAttributes.filter(
          (attr) => attr !== attribute,
        )
      } else {
        this.activeDataTable.stickyAttributes.unshift(attribute)
      }

      this.recomputeAttributeMap()

      this.changeHeatmap()
    },

    expandRow(row: ItemNameAndData) {
      row.isOpen = true
      this.changeHeatmap()
    },

    closeRow(row: ItemNameAndData) {
      row.isOpen = false
      this.closeChildRowsRecursively(row)
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

    closeChildRowsRecursively(row: ItemNameAndData) {
      row.isOpen = false
      const areAllChildRowsClosed = row.children?.every((child) => !child.isOpen)
      if (!areAllChildRowsClosed) {
        row.children?.forEach((child) => {
          this.closeChildRowsRecursively(child)
        })
      }
    },

    toggleOpenRow(row: ItemNameAndData) {
      if (row.isOpen) {
        this.closeRow(row)
      } else {
        this.expandRow(row)
      }
    },
    findItemByIndexRecursively(
      index: number,
      itemNamesAndData: ItemNameAndData,
    ): ItemNameAndData | undefined {
      if (itemNamesAndData.index === index) {
        return itemNamesAndData
      }
      if (itemNamesAndData.children) {
        for (const child of itemNamesAndData.children) {
          const foundItem = this.findItemByIndexRecursively(index, child)
          if (foundItem) {
            return foundItem
          }
        }
      }
    },
    findItemByIndex(index: number) {
      if (!this.heatmap) {
        return
      }
      for (const item of this.heatmap.itemNamesAndData) {
        const foundItem = this.findItemByIndexRecursively(index, item)
        if (foundItem) {
          return foundItem
        }
      }
    },
    getAllChildrenRecursively(item: ItemNameAndData): ItemNameAndData[] {
      const leafNodes: ItemNameAndData[] = []
      if (item.children && item.children.length > 0) {
        for (const child of item.children) {
          if (!child.children || child.children.length === 0) {
            leafNodes.push(child)
          }
          leafNodes.push(...this.getAllChildrenRecursively(child))
        }
      }
      return leafNodes
    },

    setAllItems(): void {
      if (!this.heatmap) {
        return
      }
      const leafNodes: ItemNameAndData[] = []
      for (const item of this.getNonStickyItems) {
        if (!item.children || item.children.length === 0) {
          leafNodes.push(item)
        }
        if (item.children && item.children.length > 0) {
          leafNodes.push(...this.getAllChildrenRecursively(item))
        }
      }
      leafNodes.sort((a, b) => a.itemName.localeCompare(b.itemName))
      this.allItems = leafNodes
    },

    expandItemAndAllParents(item: ItemNameAndData | null) {
      if (!item) {
        return
      }
      let parent = item.parent
      while (parent) {
        parent.isOpen = true
        parent = parent.parent
      }
      item.isOpen = true
      this.highlightedRow = item
      this.changeHeatmap()
    },

    openAllStickyItems() {
      if (this.getStickyItems.length > 3) {
        return
      }
      for (const item of this.getStickyItems) {
        item.isOpen = true
        let parent: ItemNameAndData | null = item.parent
        while (parent !== null) {
          parent.isOpen = true
          parent = parent.parent
        }
      }
    },
  },
})

function setParentOfRowsRec(row: ItemNameAndData, parent: ItemNameAndData | null) {
  row.parent = parent
  if (row.children) {
    row.children.forEach((child) => {
      setParentOfRowsRec(child, row)
    })
  }
}
