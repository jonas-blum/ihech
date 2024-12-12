import { defineStore } from 'pinia'
import {
  type HeatmapJSON,
  type ItemNameAndData,
  findRowByIndex,
  type JsonDataTableProfile,
  ScalingEnum,
  DimReductionAlgoEnum,
  SortOrderAttributes,
  type HeatmapSettings,
  ColoringHeatmapEnum,
  getDistinctColor,
  interpolateColor,
  type HierarchicalAttribute,
} from '@/helpers/helpers'
import { ItemTree } from '@/classes/ItemTree'
import { Row, AggregateRow, ItemRow } from '@/classes/Row'
import { AttributeTree } from '@/classes/AttributeTree'
import { Column, AggregateColumn, AttributeColumn } from '@/classes/Column'
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
  ColumnSorterCriterionByOriginalAttributeOrder,
  ColumnSorterCriterionByStandardDeviation,
} from '@/classes/ColumnSorter'
import { Container } from 'pixi.js'
import { PixiRow } from '@/pixiComponents/PixiRow'
import { PixiHeatmapCell } from '@/pixiComponents/PixiHeatmapCell'
import { PixiRowLabel } from '@/pixiComponents/PixiRowLabel'
import { PixiColumnLabel } from '@/pixiComponents/PixiColumnLabel'
import { PixiBubble } from '@/pixiComponents/PixiBubble'
import { Breakpoint, ColorMap } from '@/classes/ColorMap'
import { nextTick } from 'vue'

// @ts-ignore: weird error because pixi object type cannot be resolved, couldn't find a fix
export const useMainStore = defineStore('mainStore', {
  state: () => ({
    dataTables: [] as JsonDataTableProfile[],
    activeDataTable: null as JsonDataTableProfile | null,

    itemTree: null as ItemTree | null,
    attributeTree: null as AttributeTree | null,

    // NOTE: "hovered" means the mouse is over the element, "selected" means the context menu is open
    hoveredPixiHeatmapCell: null as PixiHeatmapCell | null,
    hoveredPixiRowLabel: null as PixiRowLabel | null,
    hoveredPixiColumnLabel: null as PixiColumnLabel | null,
    hoveredPixiBubble: null as PixiBubble | null,
    selectedPixiColumnLabel: null as PixiColumnLabel | null,
    selectedPixiRowLabel: null as PixiRowLabel | null,
    selectedPixiBubble: null as PixiBubble | null,

    colorMap: new ColorMap(),

    searchResultBoxOpen: false as boolean,
    mouseOverMenuOrTooltip: false as boolean,

    heatmap: {
      attributeDissimilarities: [] as number[],
      itemNamesAndData: [] as ItemNameAndData[],
      hierarchicalAttributes: [] as HierarchicalAttribute[],
      maxHeatmapValue: 100 as number,
      minHeatmapValue: 0 as number,
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
    // various rendering functions need to know the max depth of the itemTree
    itemsMaxDepth(): number {
      return this.itemTree?.maxDepth ?? 0
    },

    // various rendering functions need to know the max depth of the attributeTree
    attributesMaxDepth(): number {
      return this.attributeTree?.maxDepth ?? 0
    },

    highlightedRow(): Row | null {
      if (this.hoveredPixiRowLabel) {
        return this.hoveredPixiRowLabel.row as Row
      } else if (this.hoveredPixiHeatmapCell) {
        return this.hoveredPixiHeatmapCell.parent?.row as Row
      } else if (this.hoveredPixiBubble) {
        return (this.hoveredPixiBubble?.row as Row) ?? null
      }
      return null
    },

    highlightedColumn(): Column | null {
      if (this.hoveredPixiColumnLabel) {
        return this.hoveredPixiColumnLabel.column as Column
      }
      if (this.hoveredPixiHeatmapCell) {
        const originalColumnIndex: number = this.hoveredPixiHeatmapCell.originalColumnIndex
        const mappedColumn = this.attributeTree?.originalIndexToColumn?.get(originalColumnIndex) as
          | Column
          | undefined
        return mappedColumn || null
      }
      return null
    },

    getAllDataTables: (state) => state.dataTables,
    getAllDatasetNames: (state) => state.dataTables.map((table) => table.datasetName),
    getActiveDataTable: (state) => state.activeDataTable,

    getHeatmap: (state) => state.heatmap,
    getHeatmapMaxValue: (state) => state.heatmap.maxHeatmapValue,
    getHeatmapMinValue: (state) => state.heatmap.minHeatmapValue,
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

    getHierarchicalRowsMetadataColumnNames: (state) =>
      state.activeDataTable?.hierarchicalRowsMetadataColumnNames ?? [],
    getHierarchicalColumnsMetadataRowIndexes: (state) =>
      state.activeDataTable?.hierarchicalColumnsMetadataRowIndexes ?? [],

    getAllItems: (state) => state.allItems,

    getLogShiftValue: (state) => state.heatmap.minHeatmapValue + 1,

    getDataChanging: (state) => state.dataChanging,
    isLoading: (state) => state.loading,
    getTimer: (state) => state.timer,

    isOutOfSync: (state) => state.outOfSync,

    isJsonUploadOpen: (state) => state.csvUploadOpen,

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
    saveDataTable(dataTable: JsonDataTableProfile, fetchData = true) {
      if (
        dataTable.datasetName === null ||
        dataTable.df === null ||
        dataTable.itemNamesColumnName === null
      ) {
        console.error('Error during adding data table to heatmap store')
      }
      if (this.getAllDatasetNames.includes(dataTable.datasetName)) {
        const index = this.dataTables.findIndex(
          (table) => table.datasetName === dataTable.datasetName,
        )
        this.dataTables[index] = dataTable
      } else {
        this.dataTables.push(dataTable)
      }
      this.setActiveDataTable(dataTable)
      if (fetchData) {
        this.fetchData()
      }
    },
    setActiveDataTable(dataTable: JsonDataTableProfile) {
      this.activeDataTable = dataTable
    },
    setJsonUploadOpen(open: boolean) {
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

    async fetchData() {
      if (this.reloadingScheduled) {
        console.log('Reloading scheduled, skipping fetchData')
        return
      }
      if (this.isLoading) {
        console.log('Already loading, skipping fetchData, queuing reload')
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
            const t = true
            while (t) {
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
        const criterion1 = new RowSorterCriterionByName()
        const criterion2 = new RowSorterCriterionByHasChildren()
        const criterion3 = new RowSorterCriterionByAmountOfChildren()
        const rowSorter = new RowSorter([criterion1, criterion2, criterion3])

        // initialize columnSorter
        const criterionA = new ColumnSorterCriterionByOriginalAttributeOrder()
        const criterionB = new ColumnSorterCriterionByName()
        const criterionC = new ColumnSorterCriterionByStandardDeviation()

        const columnSorter = new ColumnSorter([criterionA, criterionB, criterionC])

        // initialize itemTree with the data received from the backend, starting at the root
        const itemTreeRoot = this.heatmap.itemNamesAndData[0]
        this.itemTree = new ItemTree(itemTreeRoot, rowSorter, this.activeDataTable.datasetName)

        console.log('ItemTree:', this.itemTree)

        const attributeTreeRoot = this.heatmap.hierarchicalAttributes[0]
        // initialize attributeTree with the data received from the backend
        this.attributeTree = new AttributeTree(
          attributeTreeRoot,
          this.heatmap.minAttributeValues,
          this.heatmap.maxAttributeValues,
          this.heatmap.attributeDissimilarities,
          columnSorter,
          this.activeDataTable.datasetName,
        )
        this.attributeTree.sort()
        this.attributeTree.updatePositionsAndDepth()
        this.attributeTree.calculateMaxDepth()
        console.log('AttributeTree:', this.attributeTree)

        // divergent color map
        const b1 = new Breakpoint(0, 0xff0000)
        const b2 = new Breakpoint(50, 0xffffff)
        const b3 = new Breakpoint(100, 0x0000ff)
        this.colorMap.addBreakpoint(b1)
        this.colorMap.addBreakpoint(b2)
        this.colorMap.addBreakpoint(b3)

        // uniform color map
        // const b1 = new Breakpoint(0, 0xffffff)
        // const b2 = new Breakpoint(100, 0x000000)
        // this.colorMap.addBreakpoint(b1)
        // this.colorMap.addBreakpoint(b2)

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
          this.fetchData()
        }
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
    setClusterItemsByCollections(clusterByCollections: boolean) {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return
      }
      this.activeDataTable.clusterItemsByCollections = clusterByCollections
    },
    setClusterAttributesByCollections(clusterByCollections: boolean) {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return
      }
      this.activeDataTable.clusterAttributesByCollections = clusterByCollections
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
    setItemsClusterSize(clusterSize: number) {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return
      }
      this.activeDataTable.itemsClusterSize = clusterSize
    },
    setAttributesClusterSize(clusterSize: number) {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return
      }
      this.activeDataTable.attributesClusterSize = clusterSize
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
      let selectedColumnNames = this.activeDataTable.allColumnNames
      if (
        this.attributeTree &&
        this.attributeTree.datasetName === this.activeDataTable.datasetName
      ) {
        selectedColumnNames = this.attributeTree.getSelectedAttributesColumnNames()
      }
      return {
        csvFile: this.activeDataTable.csvFile,

        hierarchicalRowsMetadataColumnNames: this.getHierarchicalRowsMetadataColumnNames
          .filter((i) => i.selected)
          .map((i) => i.label),
        hierarchicalColumnsMetadataRowIndexes: this.getHierarchicalColumnsMetadataRowIndexes
          .filter((i) => i.selected)
          .map((i) => i.index),

        selectedItemsRowIndexes: this.activeDataTable.allRowIndexes,

        selectedAttributesColumnNames: selectedColumnNames,

        stickyAttributesColumnNames: this.activeDataTable.stickyAttributes,
        sortAttributesBasedOnStickyItems: this.activeDataTable.sortAttributesBasedOnStickyItems,
        sortOrderAttributes: this.activeDataTable.sortOrderAttributes,

        stickyItemsRowIndexes: this.activeDataTable.stickyItemIndexes,
        clusterItemsBasedOnStickyAttributes:
          this.activeDataTable.clusterItemsBasedOnStickyAttributes,

        clusterItemsByCollections: this.activeDataTable.clusterItemsByCollections,
        clusterAttributesByCollections: this.activeDataTable.clusterAttributesByCollections,

        itemsClusterSize: this.activeDataTable.itemsClusterSize,
        attributesClusterSize: this.activeDataTable.attributesClusterSize,
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
        this.activeDataTable.hierarchicalRowsMetadataColumnNames.length === 0 ||
        this.activeDataTable.selectedFirstLayerCollections.length === 0
      ) {
        this.activeDataTable.df.forEach((row, index) => {
          newSelectedItemIndexes.push(index)
        })
      } else {
        const selectedCollections = this.activeDataTable.selectedFirstLayerCollections
        const collectionColumnName = this.activeDataTable.hierarchicalRowsMetadataColumnNames[0]

        this.activeDataTable.df.forEach((row, index) => {
          const rowCollection = row[collectionColumnName.label]
          if (selectedCollections.includes(rowCollection)) {
            newSelectedItemIndexes.push(index)
          }
        })
      }
      this.activeDataTable.allRowIndexes = newSelectedItemIndexes
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
      if (this.activeDataTable.hierarchicalRowsMetadataColumnNames.length === 0) {
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

    // used as a trigger from the RowSorter to re-sort the rows
    sortRows() {
      if (this.itemTree) {
        this.itemTree.sort()
        this.itemTree.updatePositionsAndDepth()
        this.itemTree.updateHeatmapVisibilityOfRows()
      }
    },

    // used as a trigger from the ColumnSorter to re-sort the columns
    sortColumns() {
      if (this.attributeTree) {
        this.attributeTree.sort()
        this.attributeTree.updatePositionsAndDepth()
        this.updateCellPositionsOfCurrentlyDisplayedRows()
      }
    },

    updateCellPositionsOfCurrentlyDisplayedRows(animate: boolean = true) {
      const rowsVisibleInHeatmap = this.itemTree?.getRowsVisibleInHeatmap()
      rowsVisibleInHeatmap!.forEach((row) => {
        row.pixiRow?.updateCellPositions(animate)
      })
      const stickyRows = this.itemTree?.stickyRows
      stickyRows!.forEach((row) => {
        row.stickyPixiRow?.updateCellPositions(animate)
      })
    },

    handleRowClick(row: Row) {
      console.log('handleRowClick', row)
      if (row instanceof AggregateRow) {
        this.itemTree?.toggleRowExpansion(row)
      } else if (row instanceof ItemRow) {
        this.itemTree?.toggleStickyRow(row)
      }
    },

    setHoveredPixiHeatmapCell(cell: PixiHeatmapCell | null) {
      this.hoveredPixiHeatmapCell = cell
    },

    setHoveredPixiRowLabel(pixiRowLabel: PixiRowLabel | null) {
      this.hoveredPixiRowLabel = pixiRowLabel
    },

    setHoveredPixiColumnLabel(pixiColumnLabel: PixiColumnLabel | null) {
      this.hoveredPixiColumnLabel = pixiColumnLabel
    },

    setHoveredPixiBubble(pixiBubble: PixiBubble | null) {
      this.hoveredPixiBubble = pixiBubble
    },

    cellClickEvent(cell: PixiHeatmapCell) {
      console.log('cellClickEvent', cell)
      const row = (cell.parent as PixiRow).row
      // let column = cell.column // not used at the moment

      this.handleRowClick(row)
    },

    rowLabelClickEvent(pixiRowLabel: PixiRowLabel) {
      const row = pixiRowLabel.row
      this.handleRowClick(row)
    },

    rowLabelRightClickEvent(pixiRowLabel: PixiRowLabel) {
      console.log('right clicked the label of', pixiRowLabel.row)
      this.selectedPixiRowLabel = pixiRowLabel
      // if (row instanceof AggregateRow) {
      //   this.itemTree?.expandAllRows(row)
      // }
    },

    columnLabelClickEvent(column: Column) {
      console.log('clicked the label of', column)

      if (column instanceof AggregateColumn) {
        this.attributeTree?.toggleColumnExpansion(column)
      } else if (column instanceof AttributeColumn) {
        column.toggleSelected()
      }
    },

    columnLabelRightClickEvent(columnLabel: PixiColumnLabel | null) {
      console.log('right clicked the label of', columnLabel?.column)
      this.selectedPixiColumnLabel = columnLabel
      // if (column instanceof AggregateColumn) {
      //   this.attributeTree?.expandAllColumns(column)
      // }
    },

    bubbleClickEvent(bubble: PixiBubble) {
      console.log('bubbleClickEvent', bubble)
      const row = bubble.row
      // NOTE: the term Row is a bit irritating here, but because the the data structure is conceptualized as Rows and Columns, I will keep it like this for now
      this.handleRowClick(row)
    },

    bubbleRightClickEvent(bubble: PixiBubble) {
      console.log('bubbleRightClickEvent', bubble)
      this.selectedPixiBubble = bubble
      // if (row instanceof AggregateRow) {
      //   this.itemTree?.expandAllRows(row)
      // }
    },

    closeMenus() {
      this.selectedPixiColumnLabel = null
      this.selectedPixiRowLabel = null
      this.selectedPixiBubble = null
      this.searchResultBoxOpen = false

      this.mouseOverMenuOrTooltip = false
    }
  },
})
