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
  interpolateColor,
} from '@/helpers/helpers'
import { ItemTree } from '@/classes/ItemTree'
import { Row, AggregatedRow, ItemRow } from '@/classes/Row'
import { AttributeTree } from '@/classes/AttributeTree'
import { Column, AggregatedColumn, AttributeColumn } from '@/classes/Column'
import {
  RowSorter,
  RowSorterCriterion,
  RowSorterCriterionByName,
  RowSorterCriterionByHasChildren,
  RowSorterCriterionByAmountOfChildren,
} from '@/classes/RowSorter'
import {
  ColumnSorter,
  ColumnSorterCriterion,
  ColumnSorterCriterionByName,
  ColumnSorterCriterionByStandardDeviation,
} from '@/classes/ColumnSorter'
import { Container } from 'pixi.js'
import { PixiRow } from '@/pixiComponents/PixiRow'
import { PixiHeatmapCell } from '@/pixiComponents/PixiHeatmapCell'
import { PixiRowLabel } from '@/pixiComponents/PixiRowLabel'
import { PixiColumnLabel } from '@/pixiComponents/PixiColumnLabel'
import { nextTick } from 'vue'

// @ts-ignore: weird error because pixi object type cannot be resolved, couldn't find a fix
export const useHeatmapStore = defineStore('heatmapStore', {
  state: () => ({
    dataTables: [] as CsvDataTableProfile[],
    activeDataTable: null as CsvDataTableProfile | null,

    itemTree: null as ItemTree | null,
    attributeTree: null as AttributeTree | null,

    hoveredPixiHeatmapCell: null as PixiHeatmapCell | null,
    hoveredPixiRowLabel: null as PixiRowLabel | null,
    hoveredPixiColumnLabel: null as PixiColumnLabel | null,

    heatmap: {
      attributeNames: [] as string[],
      attributeDissimilarities: [] as number[],
      itemNamesAndData: [] as ItemNameAndData[],
      maxHeatmapValue: 100 as number,
      minHeatmapValue: 0 as number,
      maxDimRedXValue: 100 as number,
      maxDimRedYValue: 0 as number,
      minDimRedXValue: 0 as number,
      minDimRedYValue: 100 as number,
      maxAttributeValues: [] as number[],
      minAttributeValues: [] as number[],
    },

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
    highlightedPixiRow(): PixiRow | null {
      if (this.hoveredPixiRowLabel) {
        // if row label (which is child of pixiRow) is currently hovered, we can return the pixiRow
        return this.hoveredPixiRowLabel.parent as PixiRow
      }
      if (this.hoveredPixiHeatmapCell) {
        // if heatmap cell (which is child of a pixiRow) is hovered, this parent row is highlighted
        return this.hoveredPixiHeatmapCell.parent.parent as PixiRow
      }
      // if none of the above is the case, no row is highlighted
      return null
    },

    highlightedRow(): Row | null {
      const highlightedPixiRow = this.highlightedPixiRow
      return highlightedPixiRow?.row ?? null
    },

    highlightedColumn(): Column | null {
      if (this.hoveredPixiColumnLabel) {
        return this.hoveredPixiColumnLabel.column as Column
      }
      if (this.hoveredPixiHeatmapCell) {
        let originalColumnIndex: number = this.hoveredPixiHeatmapCell.column
        let mappedColumn = this.attributeTree?.originalIndexToColumn?.get(originalColumnIndex) as Column | undefined;
        return mappedColumn || null
      }
      return null
    },

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

        const requestInit: RequestInit = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings }),
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/heatmap`, requestInit)
        if (!response.body) {
          console.error('Error during fetching heatmap', response)
          this.setIsOutOfSync(true)
          return
        }

        const reader = response.body.getReader()
        let receivedData = new Uint8Array()

        const stream = new ReadableStream({
          async start(controller) {
            while (true) {
              const { done, value } = await reader.read()
              if (done) {
                controller.close()
                break
              }
              // Accumulate the chunks
              const newData = new Uint8Array(receivedData.length + value.length)
              newData.set(receivedData)
              newData.set(value, receivedData.length)
              receivedData = newData

              controller.enqueue(value)
            }
          },
        })

        const newResponse = new Response(stream)
        const receivedHeatmap = await newResponse.json()

        if (!receivedHeatmap) {
          console.error('No heatmap data received.')
          return
        }
        if (this.activeDataTable === null) {
          console.error('No active data table')
          return
        }

        this.heatmap = receivedHeatmap

        console.log('Received heatmap:', this.heatmap)

        // initialize rowSorter
        // TODO: I should probably store the rowSorter in the store, otherwise the settings are reset when the heatmap is refetched..
        let criterion1 = new RowSorterCriterionByName()
        let criterion2 = new RowSorterCriterionByHasChildren()
        let criterion3 = new RowSorterCriterionByAmountOfChildren()
        let rowSorter = new RowSorter([criterion1, criterion2, criterion3])

        // initialize columnSorter
        let criterionA = new ColumnSorterCriterionByName()
        let criterionB = new ColumnSorterCriterionByStandardDeviation()
        let columnSorter = new ColumnSorter([criterionA, criterionB])

        // initialize itemTree with the data received from the backend, starting at the root
        let itemTreeRoot = this.heatmap.itemNamesAndData[0]
        this.itemTree = new ItemTree(itemTreeRoot, rowSorter)
        this.itemTree.sort()
        this.itemTree.updatePositionsAndDepth()
        console.log('ItemTree:', this.itemTree)

        // initialize attributeTree with the data received from the backend
        this.attributeTree = new AttributeTree(
          this.heatmap.attributeNames,
          this.heatmap.minAttributeValues,
          this.heatmap.maxAttributeValues,
          this.heatmap.attributeDissimilarities,
          columnSorter,
        )
        this.attributeTree.sort()
        this.attributeTree.updatePositionsAndDepth()
        console.log('AttributeTree:', this.attributeTree)

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

    getHeatmapColor(value: number): number {
      let min = this.getHeatmapMinValue
      let max = this.getHeatmapMaxValue
      let minColor = 0xefefff
      let maxColor = 0x0000ff
      return interpolateColor(minColor, maxColor, value, min, max)
    },

    // used as a trigger from the RowSorter to re-sort the rows
    sortRows() {
      if (this.itemTree) {
        this.itemTree.sort()
        this.itemTree.updatePositionsAndDepth()
      }
    },

    // used as a trigger from the ColumnSorter to re-sort the columns
    sortColumns() {
      if (this.attributeTree) {
        this.attributeTree.sort()
        this.attributeTree.updatePositionsAndDepth()
        this.itemTree?.updateCellPositions()
      }
    },

    handleRowClick(row: Row) {
      console.log('handleRowClick', row)
      if (row instanceof AggregatedRow) {
        this.itemTree?.toggleRowExpansion(row)
      } else if (row instanceof ItemRow) {
        this.itemTree?.toggleStickyRow(row)
      }
    },

    setHoveredPixiHeatmapCell(cell: PixiHeatmapCell | null) {
      console.log('setHoveredPixiHeatmapCell', cell)
      this.hoveredPixiHeatmapCell = cell
    },

    setHoveredPixiRowLabel(pixiRowLabel: PixiRowLabel | null) {
      this.hoveredPixiRowLabel = pixiRowLabel
    },

    setHoveredPixiColumnLabel(pixiColumnLabel: PixiColumnLabel | null) {
      this.hoveredPixiColumnLabel = pixiColumnLabel
    },

    cellClickEvent(cell: PixiHeatmapCell) {
      console.log('cellClickEvent', cell)
      let row = (cell.parent.parent as PixiRow).row
      // let column = cell.column // not used at the moment

      this.handleRowClick(row)
    },

    rowLabelClickEvent(pixiRowLabel: PixiRowLabel) {
      let row = (pixiRowLabel.parent as PixiRow).row
      this.handleRowClick(row)
    },

    columnLabelClickEvent(column: Column) {
      console.log('clicked the label of', column)

      if (column instanceof AggregatedColumn) {
        this.attributeTree?.toggleColumnExpansion(column)
      }
    },
  },
})
