import { defineStore } from 'pinia'
import {
  type ItemNameAndData,
  type JsonDataTableProfile,
  DimReductionAlgoEnum,
  SortOrderAttributes,
  type HeatmapSettings,
  ColoringHeatmapEnum,
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
  ColumnSorterCriterionByHasChildren,
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

    dataChanging: 1,
    loading: false,

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

    getHierarchicalRowsMetadataColumnNames: (state) =>
      state.activeDataTable?.hierarchicalRowsMetadataColumnNames ?? [],
    getHierarchicalColumnsMetadataRowIndexes: (state) =>
      state.activeDataTable?.hierarchicalColumnsMetadataRowIndexes ?? [],

    isLoading: (state) => state.loading,

    isOutOfSync: (state) => state.outOfSync,
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
      console.log('💥 mainStore.setActiveDataTable', this.activeDataTable)


      // load the default settings
      const defaultSettings = dataTable.defaultSettings
      this.setClusterItemsByCollections(defaultSettings.clusterItemsByCollections)
      this.setClusterAttributesByCollections(defaultSettings.clusterAttributesByCollections)
      this.setItemsClusterSize(defaultSettings.itemsClusterSize)
      this.setAttributesClusterSize(defaultSettings.attributesClusterSize)
      this.setDimReductionAlgo(defaultSettings.dimReductionAlgo)
      this.setClusterAfterDimRed(defaultSettings.clusterAfterDimRed)
      this.setItemAggregateMethod(defaultSettings.itemAggregateMethod)
      this.setAttributeAggregateMethod(defaultSettings.attributeAggregateMethod)
      this.setScaling(defaultSettings.scaling)

      // set the default semantic aggregations
      this.getHierarchicalRowsMetadataColumnNames.forEach((column) => {
        if (defaultSettings.groupItemsBy.includes(column.label)) {
          column.selected = true
        } else {
          column.selected = false
        }
      })
      this.getHierarchicalColumnsMetadataRowIndexes.forEach((column) => {
        if (defaultSettings.groupAttributesBy.includes(column.label)) {
          column.selected = true
        } else {
          column.selected = false
        }
      })

      // set the default color map breakpoints
      this.colorMap.clearBreakpoints()
      for (const [value, color] of Object.entries(defaultSettings.colorMapBreakpoints as Record<string, number | string>)) {
        console.log('value:', value, 'color:', color)
        this.colorMap.addBreakpoint(new Breakpoint(Number(value), color))
      }
      this.colorMap.setZeroColor(defaultSettings.colorMapZeroColor)
      this.colorMap.setLogarithmic(defaultSettings.colorMapLogarithmic)
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
        console.log('settings sent to backend:', settings)

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
        console.log('this.activeDataTable:', this.activeDataTable)

        // initialize rowSorter
        // TODO: I should probably store the rowSorter in the store, otherwise the settings are reset when the heatmap is refetched..
        const criterion1 = new RowSorterCriterionByName()
        const criterion2 = new RowSorterCriterionByHasChildren()
        const criterion3 = new RowSorterCriterionByAmountOfChildren()
        const rowSorter = new RowSorter([criterion2, criterion1])
        // criterion2.toggleReverse()

        // initialize columnSorter
        const criterionA = new ColumnSorterCriterionByOriginalAttributeOrder()
        const criterionB = new ColumnSorterCriterionByName()
        const criterionC = new ColumnSorterCriterionByStandardDeviation()
        const criterionD = new ColumnSorterCriterionByHasChildren()
        const columnSorter = new ColumnSorter([criterionD, criterionA, criterionB, criterionC])

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

    // useDivergentColorMap() {
    //   this.colorMap.clearBreakpoints()
    //   const b1 = new Breakpoint(0, 0xff0000)
    //   const b2 = new Breakpoint(50, 0xffffff)
    //   const b3 = new Breakpoint(100, 0x0000ff)
    //   this.colorMap.addBreakpoint(b1)
    //   this.colorMap.addBreakpoint(b2)
    //   this.colorMap.addBreakpoint(b3)
    // },

    // useUniformColorMap() {
    //   this.colorMap.clearBreakpoints()
    //   const b1 = new Breakpoint(0, 0xffffff)
    //   const b2 = new Breakpoint(100, 0x000000)
    //   this.colorMap.addBreakpoint(b1)
    //   this.colorMap.addBreakpoint(b2)
    // },

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
    setItemAggregateMethod(itemAggregateMethod: string) {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return
      }
      this.activeDataTable.itemAggregateMethod = itemAggregateMethod
    },
    setAttributeAggregateMethod(attributeAggregateMethod: string) {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return
      }
      this.activeDataTable.attributeAggregateMethod = attributeAggregateMethod
    },

    getSelectedItemsRowIndexes(): number[] {
      if (!this.activeDataTable) {
        console.error('No active data table')
        return []
      }

      // if there is no ItemTree yet, simply return all row indexes
      if (!this.itemTree || this.itemTree.datasetName !== this.activeDataTable.datasetName) {
        return this.activeDataTable.allRowIndexes
      }

      // get selected item names from ItemTree
      const selectedItemsNames = this.itemTree.getSelectedItems().map(item => item.name)
      
      let selectedItemsRowIndexes: number[] = []
      // loop over dataset and get all the indexes of the selected items
      this.activeDataTable.df.forEach((row, index) => {
        let itemName = row[this.activeDataTable!.allColumnNames[0]] // first column is the item name column
        if (selectedItemsNames.includes(itemName)) {
          selectedItemsRowIndexes.push(index)
        }
      })

      return selectedItemsRowIndexes
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

        selectedItemsRowIndexes: this.getSelectedItemsRowIndexes(),

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

        itemAggregateMethod: this.activeDataTable.itemAggregateMethod,
        attributeAggregateMethod: this.activeDataTable.attributeAggregateMethod,

        scaling: this.activeDataTable.scaling,
      }
    },
    changeHeatmap(): void {
      this.dataChanging++
      console.log('changing heatmap', this.dataChanging)
    },

    setIsOutOfSync(outOfSync: boolean) {
      this.outOfSync = outOfSync
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
        this.attributeTree.updateHeatmapVisibilityOfColumns()
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
