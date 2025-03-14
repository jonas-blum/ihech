<script setup lang="ts">
import { Icon } from '@iconify/vue'

import { onMounted, watch, ref } from 'vue'
import { useMouse, watchThrottled } from '@vueuse/core'

import { useMainStore } from '@stores/mainStore'
import { useHeatmapLayoutStore } from '@stores/heatmapLayoutStore'

import { PixiHeatmapApp } from '@/pixiComponents/PixiHeatmapApp'
import { PixiRow, PixiStickyRow, PixiItemRow, PixiAggregateRow } from '@/pixiComponents/PixiRow'
import {
  PixiRowLabel,
  PixiStickyRowLabel,
  PixiItemRowLabel,
  PixiAggregateRowLabel,
} from '@/pixiComponents/PixiRowLabel'
import {
  PixiColumnLabel,
  PixiAttributeColumnLabel,
  PixiAggregateColumnLabel,
} from '@/pixiComponents/PixiColumnLabel'
import { AggregateRow, ItemRow, Row } from '@/classes/Row'
import { AggregateColumn, AttributeColumn, Column } from '@/classes/Column'
import type { PixiHeatmapCell } from '@/pixiComponents/PixiHeatmapCell'
import RowSorterSettings from '@/components/RowSorterSettings.vue'
import ColumnSorterSettings from '@/components/ColumnSorterSettings.vue'
import ColorMap from '@/components/ColorMap.vue'
import Search from '@/components/Search.vue'
import ContextMenuColumnLabel from '@/components/ContextMenuColumnLabel.vue'
import ContextMenuRowLabel from '@/components/ContextMenuRowLabel.vue'
import { ColoringHeatmapEnum } from '@/helpers/helpers'
import MiscSettings from './MiscSettings.vue'

const { x: mouseX, y: mouseY } = useMouse()

const tooltipStyle = ref({
  left: '0px',
  top: '0px',
})

// Watch mouse coordinates to update tooltip position
watch([mouseX, mouseY], ([x, y]) => {
  tooltipStyle.value.left = `${x + 10}px`
  tooltipStyle.value.top = `${y + 10}px`
})

const mainStore = useMainStore()
const heatmapLayoutStore = useHeatmapLayoutStore()

let pixiHeatmapApp: PixiHeatmapApp | null = null

const heatmapCanvas = ref<HTMLCanvasElement | null>(null)

const pixiHeatmapInitialized = ref(false)

// this mechanism is needed to prevent interaction on the canvas elements below menus or tooltips
watch(
  () => mainStore.mouseOverMenuOrTooltip,
  (value) => {
    // disable interaction on the whole canvas if hovering over a menu or tooltip
    if (pixiHeatmapApp) {
      pixiHeatmapApp.stage.eventMode = value ? 'none' : 'auto'
    }
  },
)

// watch for changes is highlightedRow
watch(
  () => mainStore.highlightedRow,
  (newRow, oldRow) => {
    // console.log('highlightedRow changed from', oldRow, 'to', newRow)

    if (!pixiHeatmapApp) {
      console.warn('pixiHeatmapApp is not set')
      return
    }

    // remove the highlight from the old row
    if (oldRow?.pixiRow) {
      // oldRow.pixiRow.removeHighlight()
      oldRow.pixiRow.updateHighlightedDisplay(false)
      oldRow.pixiRowLabel?.updateHighlightedDisplay(false)
      oldRow.stickyPixiRow?.updateHighlightedDisplay(false)
      oldRow.stickyPixiRowLabel?.updateHighlightedDisplay(false)
    }

    // add the highlight to the new row
    if (newRow?.pixiRow) {
      // newRow.pixiRow.addHighlight()
      newRow.pixiRow.updateHighlightedDisplay(true)
      newRow.pixiRowLabel?.updateHighlightedDisplay(true)
      newRow.stickyPixiRow?.updateHighlightedDisplay(true)
      newRow.stickyPixiRowLabel?.updateHighlightedDisplay(true)
    }
  },
)

// watch for changes is highlightedColumn
watch(
  () => mainStore.highlightedColumn,
  (newColumn, oldColumn) => {
    // console.log('highlightedColumn changed from', oldColumn, 'to', newColumn)

    if (!pixiHeatmapApp) {
      console.warn('pixiHeatmapApp is not set')
      return
    }

    // remove the highlight from the old column
    if (oldColumn?.pixiColumnLabel) {
      oldColumn.pixiColumnLabel.updateHighlightedDisplay(false)

      // TODO: if I would like to highlight all cells of this column, this could be triggered here
      // however, this is not straightforward, because there is no container column like for the rows
      // somehow highlighting the individual cells would be possible, but complicated because the PIXI.Filters
      // would need to applied to the individual cells, resulting in cell highlighting instead of column highlighting

      // TODO: once we have sticky attributes, we need to update the stickyColumn as well
    }

    // add the highlight to the new column
    if (newColumn?.pixiColumnLabel) {
      newColumn.pixiColumnLabel.updateHighlightedDisplay(true)

      // TODO: once we have sticky attributes, we need to update the stickyColumn as well
    }
  },
)

// watch for changes is highlightedCell
watch(
  () => mainStore.hoveredPixiHeatmapCell,
  (newCell, oldCell) => {
    // console.log('hoveredPixiHeatmapCell changed from', oldCell, 'to', newCell)
  },
)

// Watch for changes in the stickyRows array
// NOTE: shallow watch is enough, because the stickyRows array is always a new array (because deep watch would be too expensive)
watch(
  () => mainStore.itemTree?.stickyRows,
  (newStickyRows, oldStickyRows) => {
    // console.log('stickyRows changed from', oldStickyRows, 'to', newStickyRows)

    if (!pixiHeatmapApp) {
      console.warn('pixiHeatmapApp is not set')
      return
    }

    // find difference between old and new sticky rows
    let stickyRowsToRemove = oldStickyRows?.filter(
      (oldStickyRow) => !newStickyRows?.includes(oldStickyRow),
    )
    // console.log('stickyRowsToRemove', stickyRowsToRemove)

    // find new sticky rows
    let stickyRowsToAdd = newStickyRows?.filter(
      (newStickyRow) => !oldStickyRows?.includes(newStickyRow),
    )
    // console.log('stickyRowsToAdd', stickyRowsToAdd)

    // loop over the sticky rows to remove
    stickyRowsToRemove?.forEach((row) => {
      // remove the PixiRow from the PixiHeatmap.stickyRowsContainer
      if (row?.stickyPixiRow && row?.stickyPixiRowLabel) {
        if (row.stickyPixiRow instanceof PixiRow) {
          pixiHeatmapApp?.matrixTile.stickyRowsContainer.removeRow(row.stickyPixiRow)
        }
        if (row.stickyPixiRowLabel instanceof PixiRowLabel) {
          pixiHeatmapApp?.rowLabelTile.stickyRowLabelsContainer.removeRowLabel(
            row.stickyPixiRowLabel,
          )
        }
      }

      // in case the row is not expanded, its bubble should not be visible anymore
      row?.pixiBubble?.updatePositionAndVisibility(false)
    })

    // add new sticky rows
    stickyRowsToAdd?.forEach((row, index) => {
      const pixiRow = new PixiStickyRow(row as Row) // create PixiRow with reference to the Row
      row.stickyPixiRow = pixiRow // set the reference to the (sticky) PixiRow in the Row
      pixiHeatmapApp?.matrixTile.stickyRowsContainer.addRow(pixiRow) // adds the PixiRow to the PixiHeatmapApp.stickyRowsContainer

      const pixiRowLabel = new PixiStickyRowLabel(row as Row) // create PixiRowLabel with reference to the Row
      row.stickyPixiRowLabel = pixiRowLabel // set the reference to the (sticky) PixiRowLabel in the Row
      pixiHeatmapApp?.rowLabelTile.stickyRowLabelsContainer.addRowLabel(pixiRowLabel) // adds the PixiRowLabel to the PixiHeatmapApp.stickyRowLabelsContainer

      row.pixiBubble?.updatePositionAndVisibility(false)
      row.pixiBubble?.updateSize()
    })

    // update the position of all rows
    newStickyRows?.forEach((row, index) => {
      if (row.stickyPixiRow) {
        row.stickyPixiRow.position.y = index * heatmapLayoutStore.rowHeight // Set position based on index
        row.stickyPixiRowLabel!.position.y = index * heatmapLayoutStore.rowHeight // Set position based on index
      }
    })

    // TODO: Update the vertical position of the row container (and the mask) to account for sticky rows
    pixiHeatmapApp?.matrixTile.updateVerticalPosition()
    pixiHeatmapApp?.rowLabelTile.updateVerticalPosition()
  },
)

// watch for deep changes in ColorMap
watch(
  () => mainStore.colorMap,
  (newColorMap, oldColorMap) => {
    if (!pixiHeatmapApp) {
      console.warn('pixiHeatmapApp is not set')
      return
    }

    // update color for each heatmap cell
    for (let row of mainStore.itemTree?.rowsAsArray ?? []) {
      if (row.pixiRow) {
        row.pixiRow.updateCellColoring()
      }
      if (row.stickyPixiRow) {
        row.stickyPixiRow.updateCellColoring()
      }
    }
  },
  { deep: true },
)

// watch for requiredHeight changes
watch(
  () => heatmapLayoutStore.availableHeightForRows,
  (newAvailableHeightForRows, oldAvailableHeightForRows) => {
    // update the vertical scrollbar
    if (pixiHeatmapApp) {
      pixiHeatmapApp.verticalScrollbar.update()
    }
  },
)

// watch for requiredWidth changes
watch(
  () => heatmapLayoutStore.availableWidthForColumns,
  (newAvailableWidthForColumns, oldAvailableWidthForColumns) => {
    // console.log('availableWidthForColumns changed from', oldAvailableWidthForColumns, 'to', newAvailableWidthForColumns)

    // update the horizontal scrollbar
    if (pixiHeatmapApp) {
      pixiHeatmapApp.horizontalScrollbar.update()
    }
  },
)

// watch for availableHeightForRows changes
watch(
  () => heatmapLayoutStore.requiredHeightOfRows,
  (newRequiredHeightOfRows, oldRequiredHeightOfRows) => {
    // console.log('requiredHeightOfRows changed from', oldRequiredHeightOfRows, 'to', newRequiredHeightOfRows)

    // update the vertical scrollbar
    if (pixiHeatmapApp) {
      pixiHeatmapApp.verticalScrollbar.update()
    }
  },
)

// watch for availableWidthForColumns changes
watch(
  () => heatmapLayoutStore.requiredWidthOfColumns,
  (newRequiredWidthOfColumns, oldRequiredWidthOfColumns) => {
    // console.log('requiredWidthOfColumns changed from', oldRequiredWidthOfColumns, 'to', newRequiredWidthOfColumns)

    // update the horizontal scrollbar
    if (pixiHeatmapApp) {
      pixiHeatmapApp.horizontalScrollbar.update()
    }
  },
)

// watch for verticalScrollPosition changes
watch(
  () => heatmapLayoutStore.verticalScrollPosition,
  (newVerticalScrollPosition, oldVerticalScrollPosition) => {
    // update the vertical position of the row container
    if (pixiHeatmapApp) {
      pixiHeatmapApp.verticalScrollbar.update()

      // this sliding of the containers results in the scrolling effect
      pixiHeatmapApp.matrixTile.updateVerticalPosition()
      pixiHeatmapApp.rowLabelTile.updateVerticalPosition()

      // update visibility of all rows (because they might be outside the viewport)
      // TODO: culling implementation.. maybe throttle this?
      mainStore.itemTree?.updateHeatmapVisibilityOfRows()
    }
  },
)

// watch for horizontalScrollPosition changes
watch(
  () => heatmapLayoutStore.horizontalScrollPosition,
  (newHorizontalScrollPosition, oldHorizontalScrollPosition) => {
    // Update the horizontal position of the column container
    if (pixiHeatmapApp) {
      pixiHeatmapApp.horizontalScrollbar.update()

      pixiHeatmapApp.matrixTile.updateHorizontalPosition()
      pixiHeatmapApp.columnLabelTile.updateHorizontalPosition()
    }

    mainStore.attributeTree?.updateHeatmapVisibilityOfColumns()
    mainStore.updateCellPositionsOfCurrentlyDisplayedRows(false)
  },
)

// watch for attributesMaxDepth changes
watch(
  () => mainStore.attributesMaxDepth,
  (newAttributeMaxDepth, oldAttributeMaxDepth) => {
    // console.log('attributeMaxDepth changed from', oldAttributeMaxDepth, 'to', newAttributeMaxDepth)

    // update the position of all column labels
    for (let column of mainStore.attributeTree?.getVisibleColumns() ?? []) {
      if (column.pixiColumnLabel) {
        column.pixiColumnLabel.updatePosition()
      }
    }
  },
)

// watch coloringHeatmap change
watch(
  () => mainStore.activeDataTable?.coloringHeatmap,
  (newColoringHeatmap, oldColoringHeatmap) => {
    // console.log('coloringHeatmap changed from', oldColoringHeatmap, 'to', newColoringHeatmap)
    mainStore.itemTree?.computeAdjustedData()
  },
)

function shrinkCells() {
  heatmapLayoutStore.setRowAndColumnSize(heatmapLayoutStore.rowHeight - 5, heatmapLayoutStore.columnWidth - 5)
  stopRenderer()
  setTimeout(() => {
    startRenderer()
  }, 1000)
}

function growCells() {
  heatmapLayoutStore.setRowAndColumnSize(heatmapLayoutStore.rowHeight + 5, heatmapLayoutStore.columnWidth + 5)
  stopRenderer()
  setTimeout(() => {
    startRenderer()
  }, 1000)
}

function clear() {
  console.log('🧹 Heatmap.vue clear')
  const clearStart = performance.now()
  if (pixiHeatmapApp) {
    pixiHeatmapApp.clear()
    pixiHeatmapInitialized.value = false
  }
  console.log(`🧹 Heatmap.vue clear took ${performance.now() - clearStart}ms`)
}

function init() {
  console.log('🚀 Heatmap.vue init')
  if (!heatmapCanvas.value) {
    console.warn('canvas is not set')
    return
  }

  updateCanvasDimensions()

  pixiHeatmapApp = new PixiHeatmapApp(heatmapCanvas.value)

  // this is necessary to ensure that the renderer is ready
  function ensureRendererReady(callback: () => void) {
    if (pixiHeatmapApp?.renderer) {
      callback()
    } else {
      requestAnimationFrame(() => ensureRendererReady(callback))
    }
  }

  ensureRendererReady(() => {
    pixiHeatmapApp?.generateTextures()
  })
}

function update() {
  console.log('🔄 Heatmap.vue update')
  const startTime = performance.now()

  updateCanvasDimensions()

  if (!pixiHeatmapApp) {
    console.warn('pixiHeatmapApp is not set')
    return
  }

  if (!pixiHeatmapInitialized.value) {
    const initStart = performance.now()

    let rows = mainStore.itemTree?.rowsAsArray
    if (!rows) {
      console.warn('rows is not set')
      return
    }

    for (let row of rows) {
      let pixiRow: PixiRow | null = null
      if (row instanceof ItemRow) {
        pixiRow = new PixiItemRow(row)
      } else if (row instanceof AggregateRow) {
        pixiRow = new PixiAggregateRow(row)
      }

      if (pixiRow) {
        row.pixiRow = pixiRow
        pixiRow.updatePosition()
        pixiHeatmapApp.matrixTile.rowsContainer.addRow(pixiRow)

        let pixiRowLabel: PixiRowLabel | null = null
        if (row instanceof ItemRow) {
          pixiRowLabel = new PixiItemRowLabel(row)
        } else if (row instanceof AggregateRow) {
          pixiRowLabel = new PixiAggregateRowLabel(row)
        }
        row.pixiRowLabel = pixiRowLabel
        if (pixiRowLabel) {
          pixiHeatmapApp.rowLabelTile.rowLabelsContainer.addRowLabel(pixiRowLabel)
        }
      }
    }

    let columns = mainStore.attributeTree?.columnsAsArray
    if (!columns) {
      console.warn('columns is not set')
      return
    }

    for (let column of columns) {
      let pixiColumnLabel: PixiColumnLabel | null = null
      if (column instanceof AggregateColumn) {
        pixiColumnLabel = new PixiAggregateColumnLabel(column)
      } else if (column instanceof AttributeColumn) {
        pixiColumnLabel = new PixiAttributeColumnLabel(column)
      }
      column.pixiColumnLabel = pixiColumnLabel
      if (pixiColumnLabel) {
        pixiHeatmapApp.columnLabelTile.columnLabelsContainer.addColumnLabel(pixiColumnLabel)
      }
    }

    pixiHeatmapApp.matrixTile.updateHorizontalPosition()
    pixiHeatmapApp.matrixTile.updateVerticalPosition()
    pixiHeatmapApp.rowLabelTile.updateVerticalPosition()
    mainStore.itemTree?.updateHeatmapVisibilityOfRows()
    mainStore.attributeTree?.updateHeatmapVisibilityOfColumns()
    mainStore.updateCellPositionsOfCurrentlyDisplayedRows()

    console.log('💨 Pixi Heatmap components are created', pixiHeatmapApp)
    pixiHeatmapInitialized.value = true
    console.log(`⏱️ Initialization took ${performance.now() - initStart}ms`)
  }

  console.log(`⚡ Total update time: ${performance.now() - startTime}ms`)
}

function updateCanvasDimensions() {
  if (heatmapCanvas.value) {
    heatmapLayoutStore.canvasWidth = heatmapCanvas.value.clientWidth
    heatmapLayoutStore.canvasHeight = heatmapCanvas.value.clientHeight
  }
}

function stopRenderer() {
  // we are about to fetch new data, so this is a good time to clear the canvas
  // stop first, because we don't want to update the canvas while it is being cleared
  if (pixiHeatmapApp) {
    // stop the auto-renderer (essentially freezes the canvas)
    pixiHeatmapApp.stop()
    // activate loading state
    pixiHeatmapApp?.activateLoadingState()
    // render once more to display the loading state
    pixiHeatmapApp?.render()

    // re-generate the textures (in case the size changed)
    pixiHeatmapApp?.generateTextures()
  }

  // now clear all kinds of PIXI stuff
  clear()
}

function startRenderer() {
  if (pixiHeatmapApp) {
    // we have new data, so we need to update the canvas
    update()
    pixiHeatmapApp?.start() // start again
    pixiHeatmapApp?.deactivateLoadingState()
  }
}

function reloadHeatmap() {
  mainStore.setJsonUploadOpen(false)
  mainStore.fetchData()
}

watch(
  () => mainStore.loading,
  (loading) => {
    if (loading === true) {
      stopRenderer()
    } else {
      startRenderer()
    }
  },
)

onMounted(async () => {
  // window.addEventListener('resize', () => mainStore.changeHeatmap())

  init()
})
</script>

<template>
  <div class="w-full h-full relative p-0">
    <!-- <span class="absolute z-[1000]"
      >{{ heatmapLayoutStore.requiredWidthOfColumns }} /
      {{ heatmapLayoutStore.availableWidthForColumns }} /
      {{ heatmapLayoutStore.horizontalScrollbarVisible }} /
      {{ heatmapLayoutStore.horizontalScrollPosition }}
    </span> -->
    <!-- <span class="absolute top-[1rem]"
      >{{ heatmapLayoutStore.requiredHeightOfRows }} /
      {{ heatmapLayoutStore.availableHeightForRows }} /
      {{ heatmapLayoutStore.verticalScrollbarVisible }} /
      {{ heatmapLayoutStore.verticalScrollPosition }}</span> -->

    <!-- <span class="absolute top-[2rem] z-[1000]">
        {{ heatmapLayoutStore.firstVisibleRowIndex }} / {{ heatmapLayoutStore.lastVisibleRowIndex }} /
        {{ heatmapLayoutStore.firstVisibleColumnIndex }} /
        {{ heatmapLayoutStore.lastVisibleColumnIndex }}
      </span> -->

    <canvas class="w-full h-full" ref="heatmapCanvas" @contextmenu.prevent></canvas>
    <!-- <button class="btn btn-primary btn-small absolute bottom-0" @click="debug()">Debug</button> -->

    <div class="absolute z-10 flex flex-col justify-end gap-4 bg-white" :style="{
      top: `${heatmapLayoutStore.tileMargin}px`,
      left: `${heatmapLayoutStore.tileMargin}px`,
      width: `${heatmapLayoutStore.rowLabelWidth}px`,
      height: `${heatmapLayoutStore.columnLabelHeight}px`,
    }">
      <button @click="reloadHeatmap()" class="btn btn-sm btn-block text-sm rounded-none custom-shadow" :class="{
        'btn-ghost': !mainStore.isOutOfSync,
        'btn-warning': mainStore.isOutOfSync,
      }">
        Update
        <span v-if="mainStore.isOutOfSync">(unsaved changes!)</span>
        <span v-if="mainStore.isLoading" class="loading loading-spinner"></span>
      </button>
      <Search class="custom-shadow" @mouseenter="mainStore.mouseOverMenuOrTooltip = true"
        @mouseleave="mainStore.mouseOverMenuOrTooltip = false"></Search>
      <MiscSettings class="w-full custom-shadow" @mouseenter="mainStore.mouseOverMenuOrTooltip = true"
        @mouseleave="mainStore.mouseOverMenuOrTooltip = false" />
      <div class="flex w-full gap-4">
        <RowSorterSettings class="w-full custom-shadow" @mouseenter="mainStore.mouseOverMenuOrTooltip = true"
          @mouseleave="mainStore.mouseOverMenuOrTooltip = false" />
        <ColumnSorterSettings class="w-full custom-shadow" @mouseenter="mainStore.mouseOverMenuOrTooltip = true"
          @mouseleave="mainStore.mouseOverMenuOrTooltip = false" />
      </div>
      <!-- <ColorMap
      class="custom-shadow"
      @mouseenter="mainStore.mouseOverMenuOrTooltip = true"
      @mouseleave="mainStore.mouseOverMenuOrTooltip = false"
      /> -->
    </div>
    <ColorMap class="absolute z-10 -translate-x-[100%] -translate-y-[100%] custom-shadow" :style="{
      top: `${heatmapLayoutStore.matrixTileFrame.y + heatmapLayoutStore.matrixTileFrame.height}px`,
      left: `${heatmapLayoutStore.matrixTileFrame.x + heatmapLayoutStore.matrixTileFrame.width}px`,
      width: `${heatmapLayoutStore.rowLabelWidth}px`,
    }" @mouseenter="mainStore.mouseOverMenuOrTooltip = true" @mouseleave="mainStore.mouseOverMenuOrTooltip = false" />

    <!-- zoom buttons -->
    <div class="absolute z-10 -translate-y-[100%] flex gap-2 p-2" :style="{
      top: `${heatmapLayoutStore.matrixTileFrame.y + heatmapLayoutStore.matrixTileFrame.height}px`,
      left: `${heatmapLayoutStore.matrixTileFrame.x}px`,
    }">
      <button @click="shrinkCells" class="btn btn-xs bg-white rounded-none custom-shadow p-1">
        <Icon icon="ic:baseline-minus" class="p-0 w-4 h-4 text-opacity-50 cursor-pointer" />
      </button>
      <button @click="growCells" class="btn btn-xs bg-white rounded-none custom-shadow p-1">
        <Icon icon="ic:baseline-plus" class="p-0 w-4 h-4 text-opacity-50 cursor-pointer" />
      </button>
    </div>

  </div>

  <!-- Heatmap cell Tooltip -->
  <div class="absolute p-[2px] border-[1px] border-black bg-white shadow-md max-w-[400px]" :style="tooltipStyle"
    v-show="mainStore.hoveredPixiHeatmapCell" @mouseenter="mainStore.mouseOverMenuOrTooltip = true"
    @mouseleave="mainStore.mouseOverMenuOrTooltip = false">

    <!-- The item [itemName] [.. has verb ..] -->
    <div class="inline" v-if="(mainStore.highlightedRow instanceof ItemRow)">
      <span class="mx-[3px]">The {{ mainStore.getActiveDataTable?.itemNameSingular }}</span>
      <span class="font-bold mx-[3px]">{{ mainStore.highlightedRow?.getName() }}</span>
      <span class="mx-[3px]">{{ mainStore.getActiveDataTable?.cellHoverTextSnippet2.single }}</span>
    </div>
    <!-- The group of items ([itemGroupName]) [.. have verb ..] -->
    <div class="inline" v-else>
      <span class="mx-[3px]">This group of {{ mainStore.getActiveDataTable?.itemNamePlural }}</span>
      <span class="font-bold mx-[3px]">({{ mainStore.highlightedRow?.getName() }})</span>
      <span class="mx-[3px]">{{ mainStore.getActiveDataTable?.cellHoverTextSnippet2.plural }}</span>
    </div>

    <!-- [value] [%] -->
    <div class="inline">
      <span class="font-bold mx-[3px]">
        {{ mainStore.hoveredPixiHeatmapCell?.value }} tags
      </span>
      <!-- <span>{{ mainStore.getActiveDataTable?.cellHoverTextSnippet3 }}</span> -->
    </div>

    <!-- single attribute -->
    <!-- <div class="inline" v-if="(mainStore.highlightedColumn instanceof AttributeColumn)">
      <span class="mx-[3px]">the {{ mainStore.getActiveDataTable?.attributeNameSingular }}</span>
      <span class="font-bold mx-[3px]">{{ mainStore.highlightedColumn?.getName() }}</span>
    </div> -->
    <!-- attribute aggregate  -->
    <!-- <div class="inline" v-else>
      <span class="mx-[3px]">this group of {{ mainStore.getActiveDataTable?.attributeNamePlural }}</span>
      <span class="font-bold mx-[3px]">({{ mainStore.highlightedColumn?.getName() }})</span>
    </div> -->
  </div>

  <!-- Attribute Tooltip -->
  <div class="absolute p-[2px] border-[1px] border-black bg-white shadow-md" :style="tooltipStyle"
    v-show="mainStore.hoveredPixiColumnLabel" @mouseenter="mainStore.mouseOverMenuOrTooltip = true"
    @mouseleave="mainStore.mouseOverMenuOrTooltip = false">
    <span>{{ mainStore.highlightedColumn?.getName() }}</span>
  </div>

  <!-- column right-click menu -->
  <ContextMenuColumnLabel class="border-[1px] border-black bg-white shadow-md"
    @mouseenter="mainStore.mouseOverMenuOrTooltip = true" @mouseleave="mainStore.mouseOverMenuOrTooltip = false">
  </ContextMenuColumnLabel>

  <!-- row right-click menu -->
  <ContextMenuRowLabel class="border-[1px] border-black bg-white shadow-md"
    @mouseenter="mainStore.mouseOverMenuOrTooltip = true" @mouseleave="mainStore.mouseOverMenuOrTooltip = false">
  </ContextMenuRowLabel>
</template>

<style scoped lang="scss"></style>
