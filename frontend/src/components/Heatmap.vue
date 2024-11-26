<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'
import { useMouse, watchThrottled } from '@vueuse/core'
import { Graphics, Sprite, RenderTexture, Texture, createLevelBuffersFromKTX } from 'pixi.js'

import { useMainStore } from '@stores/mainStore'
import { useHeatmapLayoutStore } from '@stores/heatmapLayoutStore'

import { PixiHeatmapApp } from '@/pixiComponents/PixiHeatmapApp'
import { PixiRow } from '@/pixiComponents/PixiRow'
import { PixiRowLabel } from '@/pixiComponents/PixiRowLabel'
import { PixiColumnLabel } from '@/pixiComponents/PixiColumnLabel'
import { Row } from '@/classes/Row'
import type { PixiHeatmapCell } from '@/pixiComponents/PixiHeatmapCell'
import RowSorterSettings from '@/components/RowSorterSettings.vue'
import ColumnSorterSettings from '@/components/ColumnSorterSettings.vue'
import ColorMap from '@/components/ColorMap.vue'

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
    })

    // add new sticky rows
    stickyRowsToAdd?.forEach((row, index) => {
      const pixiRow = new PixiRow(row, true) // create PixiRow with reference to the Row
      row.stickyPixiRow = pixiRow // set the reference to the (sticky) PixiRow in the Row
      pixiHeatmapApp?.matrixTile.stickyRowsContainer.addRow(pixiRow) // adds the PixiRow to the PixiHeatmapApp.stickyRowsContainer

      const pixiRowLabel = new PixiRowLabel(row, true) // create PixiRowLabel with reference to the Row
      row.stickyPixiRowLabel = pixiRowLabel // set the reference to the (sticky) PixiRowLabel in the Row
      pixiHeatmapApp?.rowLabelTile.stickyRowLabelsContainer.addRowLabel(pixiRowLabel) // adds the PixiRowLabel to the PixiHeatmapApp.stickyRowLabelsContainer
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
watchThrottled(
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
  { throttle: 1 },
)

// watch for horizontalScrollPosition changes
watchThrottled(
  () => heatmapLayoutStore.horizontalScrollPosition,
  (newHorizontalScrollPosition, oldHorizontalScrollPosition) => {
    // Update the horizontal position of the column container
    if (pixiHeatmapApp) {
      pixiHeatmapApp.horizontalScrollbar.update()

      pixiHeatmapApp.matrixTile.updateHorizontalPosition()
      pixiHeatmapApp.columnLabelTile.updateHorizontalPosition()
    }

    mainStore.attributeTree?.updateHeatmapVisibilityOfColumns()
    mainStore.updateCellPositionsOfCurrentlyDisplayedRows()
  },
  { throttle: 1 },
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
    pixiHeatmapApp?.generateHeatmapCellTexture()
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
      let pixiRow = new PixiRow(row)
      row.pixiRow = pixiRow
      pixiRow.updatePosition()
      pixiHeatmapApp.matrixTile.rowsContainer.addRow(pixiRow)

      let pixiRowLabel = new PixiRowLabel(row)
      row.pixiRowLabel = pixiRowLabel
      pixiHeatmapApp.rowLabelTile.rowLabelsContainer.addRowLabel(pixiRowLabel)
    }

    let columns = mainStore.attributeTree?.columnsAsArray
    if (!columns) {
      console.warn('columns is not set')
      return
    }

    for (let column of columns) {
      let pixiColumnLabel = new PixiColumnLabel(column)
      column.pixiColumnLabel = pixiColumnLabel
      pixiHeatmapApp.columnLabelTile.columnLabelsContainer.addColumnLabel(pixiColumnLabel)
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

function debug() {
  console.log('🐞', pixiHeatmapApp)

  if (pixiHeatmapApp) {
    const debugTImer = performance.now()
    // test if the updateMask functionalitiy of the PixiContainer is even working
    clear()
  }
}

watch(
  () => mainStore.loading,
  (loading) => {
    if (loading === true) {
      // we are about to fetch new data, so this is a good time to clear the canvas
      // stop first, because we don't want to update the canvas while it is being cleared
      if (pixiHeatmapApp) {
        pixiHeatmapApp.stop()
      }
      // now clear all kinds of PIXI stuff
      clear()
    } else {
      // we have new data, so we need to update the canvas
      update()
      pixiHeatmapApp?.start() // start again
    }
  },
)

// watch(
//   () => mainStore.getDataChanging,
//   () => {
//     clear()
//     update()
//   },
// )

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

    <button @click="debug" class="absolute z-[1000] btn btn-xs">Debug</button>

    <canvas class="w-full h-full" ref="heatmapCanvas"></canvas>
    <!-- <button class="btn btn-primary btn-small absolute bottom-0" @click="debug()">Debug</button> -->
    <RowSorterSettings
      class="absolute"
      :style="{
        top: `${heatmapLayoutStore.rowLabelsTileFrame.y + heatmapLayoutStore.requiredHeightOfStickyRows + 2}px`,
        left: `${heatmapLayoutStore.rowLabelWidth - 0}px`,
      }"
    />
    <ColumnSorterSettings
      class="absolute"
      :style="{
        top: `${heatmapLayoutStore.tileMargin}px`,
        left: `${heatmapLayoutStore.columnLabelsTileFrame.x + 7}px`,
      }"
    />
    <ColorMap
      :colorMap="mainStore.colorMap"
      class="absolute z-10 -translate-y-[100%]"
      :style="{
        top: `${heatmapLayoutStore.columnLabelHeight + heatmapLayoutStore.tileMargin}px`,
        left: `${heatmapLayoutStore.tileMargin}px`,
        width: `${heatmapLayoutStore.rowLabelWidth}px`,
      }"
    />
  </div>
  <!-- Tooltip -->
  <div
    class="absolute p-[2px] border-[1px] border-black bg-white shadow-md"
    :style="tooltipStyle"
    v-show="mainStore.hoveredPixiHeatmapCell"
  >
    <span>{{ mainStore.highlightedRow?.name }}</span
    ><br />
    <span>{{ mainStore.highlightedColumn?.name }}</span
    ><br />
    <span>
      {{ mainStore.hoveredPixiHeatmapCell?.value }}
    </span>
  </div>
</template>

<style scoped></style>
