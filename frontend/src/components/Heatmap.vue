<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'
import { useMouse } from '@vueuse/core'
import { Graphics, Sprite, RenderTexture, Texture, createLevelBuffersFromKTX } from 'pixi.js'

import { useHeatmapStore } from '@stores/heatmapStore'
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

const heatmapStore = useHeatmapStore()
const heatmapLayoutStore = useHeatmapLayoutStore()

let pixiHeatmapApp: PixiHeatmapApp | null = null

const heatmapCanvas = ref<HTMLCanvasElement | null>(null)

const pixiHeatmapInitialized = ref(false)

// watch for changes is highlightedRow
watch(
  () => heatmapStore.highlightedRow,
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
      oldRow.stickyPixiRow?.updateHighlightedDisplay(false)
    }

    // add the highlight to the new row
    if (newRow?.pixiRow) {
      // newRow.pixiRow.addHighlight()
      newRow.pixiRow.updateHighlightedDisplay(true)
      newRow.stickyPixiRow?.updateHighlightedDisplay(true)
    }
  },
)

// watch for changes is highlightedColumn
watch(
  () => heatmapStore.highlightedColumn,
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
  () => heatmapStore.hoveredPixiHeatmapCell,
  (newCell, oldCell) => {
    // console.log('hoveredPixiHeatmapCell changed from', oldCell, 'to', newCell)
  },
)

// Watch for changes in the stickyRows array
// NOTE: shallow watch is enough, because the stickyRows array is always a new array (because deep watch would be too expensive)
watch(
  () => heatmapStore.itemTree?.stickyRows,
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
      if (row?.stickyPixiRow) {
        if (row.stickyPixiRow instanceof PixiRow) {
          pixiHeatmapApp?.removeStickyRow(row.stickyPixiRow)
        }
      }
    })

    // add new sticky rows
    stickyRowsToAdd?.forEach((row, index) => {
      const pixiRow = new PixiRow(row, pixiHeatmapApp!.heatmapCellTexture, true) // create PixiRow with reference to the Row
      row.stickyPixiRow = pixiRow // set the reference to the (sticky) PixiRow in the Row
      pixiHeatmapApp?.addStickyRow(pixiRow) // adds the PixiRow to the PixiHeatmapApp.stickyRowsContainer
    })

    // update the position of all rows
    newStickyRows?.forEach((row, index) => {
      if (row.stickyPixiRow) {
        row.stickyPixiRow.position.y = index * heatmapLayoutStore.rowHeight // Set position based on index
      }
    })

    // Update the vertical position of the row container (and the mask) to account for sticky rows
    pixiHeatmapApp.updateRowContainerPosition()
    pixiHeatmapApp.updateRowContainerMask()
  },
)

// watch for deep changes in ColorMap
watch(
  () => heatmapStore.colorMap,
  (newColorMap, oldColorMap) => {
    if (!pixiHeatmapApp) {
      console.warn('pixiHeatmapApp is not set')
      return
    }

    // update color for each heatmap cell
    for (let row of heatmapStore.itemTree?.getAllRows() ?? []) {
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
  () => heatmapLayoutStore.requiredHeight,
  (newRequiredHeight, oldRequiredHeight) => {
    // console.log('requiredHeight changed from', oldRequiredHeight, 'to', newRequiredHeight)

    // update the vertical scrollbar
    if (pixiHeatmapApp) {
      pixiHeatmapApp.verticalScrollbar.update()
    }
  },
)

// watch for verticalScrollPosition changes
watch(
  () => heatmapLayoutStore.verticalScrollPosition,
  (newVerticalScrollPosition, oldVerticalScrollPosition) => {
    // update the vertical position of the row container
    if (pixiHeatmapApp) {
      pixiHeatmapApp.rowContainer.position.y =
        heatmapLayoutStore.rowsVerticalStartPosition - newVerticalScrollPosition

      // update visibility of all rows (because they might be outside the viewport)
      for (let row of heatmapStore.itemTree?.getAllRows() ?? []) {
        if (row.pixiRow) {
          row.pixiRow.updateVisibility()
        }
      }
    }
  },
)

// watch for attributesMaxDepth changes
watch(
  () => heatmapStore.attributesMaxDepth,
  (newAttributeMaxDepth, oldAttributeMaxDepth) => {
    // console.log('attributeMaxDepth changed from', oldAttributeMaxDepth, 'to', newAttributeMaxDepth)

    // update the position of all column labels
    for (let column of heatmapStore.attributeTree?.getVisibleColumns() ?? []) {
      if (column.pixiColumnLabel) {
        column.pixiColumnLabel.updatePosition()
      }
    }
  },
)

function clear() {
  console.log('🧹 Heatmap.vue clear')
  if (pixiHeatmapApp) {
    // TODO: necessary to free memory (Pixi graphics, textures, etc.)? or is pixi automatically cleaning up?
    pixiHeatmapApp.clear()
    pixiHeatmapInitialized.value = false
  }
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
  updateCanvasDimensions()

  if (!pixiHeatmapApp) {
    console.warn('pixiHeatmapApp is not set')
    return
  }

  // only once I need to init the pixi containers and graphics
  if (!pixiHeatmapInitialized.value) {
    // traverse the item tree with all rows and create the pixiRows
    let rows = heatmapStore.itemTree?.getAllRows()
    if (!rows) {
      console.warn('rows is not set')
      return
    }

    for (let row of rows) {
      let pixiRow = new PixiRow(row, pixiHeatmapApp.heatmapCellTexture) // create PixiRow with reference to the Row
      row.pixiRow = pixiRow // set the reference to the PixiRow in the Row
      pixiRow.updatePosition()
      pixiHeatmapApp.addRow(pixiRow) // adds the PixiRow to the PixiHeatmapApp
    }

    // traverse the attribute tree with all columns and create the pixiColumnLabels
    let columns = heatmapStore.attributeTree?.getAllColumns()
    if (!columns) {
      console.warn('columns is not set')
      return
    }

    for (let column of columns) {
      let pixiColumnLabel = new PixiColumnLabel(column) // create PixiColumnLabel with reference to the Column
      column.pixiColumnLabel = pixiColumnLabel // set the reference to the PixiColumnLabel in the Column
      pixiHeatmapApp.addColumnLabel(pixiColumnLabel) // adds the PixiColumnLabel to the PixiHeatmapApp
    }

    console.log('💨 Pixi Heatmap components are created', pixiHeatmapApp)
    pixiHeatmapInitialized.value = true
  }
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
    const mask = new Graphics()
    mask.rect(0, 0, 500, 500).fill(0xff0000)
    pixiHeatmapApp.stage.addChild(mask)
    pixiHeatmapApp.rowContainer.mask = mask
  }
}

watch(
  () => heatmapStore.getDataChanging,
  () => {
    clear()
    update()
  },
)

onMounted(async () => {
  window.addEventListener('resize', () => heatmapStore.changeHeatmap())

  init()
})
</script>

<template>
  <div class="w-full h-full relative p-0">
    <canvas class="w-full h-full" ref="heatmapCanvas"></canvas>
    <!-- <button class="btn btn-primary btn-small absolute bottom-0" @click="debug()">Debug</button> -->
    <span>{{ heatmapLayoutStore.requiredHeight }}</span>

    <div
      class="absolute p-[2px] border-[1px] border-black bg-white shadow-md"
      :style="tooltipStyle"
      v-show="heatmapStore.hoveredPixiHeatmapCell"
    >
      <span>{{ heatmapStore.highlightedRow?.name }}</span
      ><br />
      <span>{{ heatmapStore.highlightedColumn?.name }}</span
      ><br />
      <span>
        {{ heatmapStore.hoveredPixiHeatmapCell?.value }}
      </span>
    </div>
    <RowSorterSettings
      class="absolute"
      :style="{
        top: `${heatmapLayoutStore.rowsVerticalStartPosition + heatmapLayoutStore.rowHeight - 3}px`,
        left: `${heatmapLayoutStore.rowLabelWidth - 0}px`,
      }"
    />
    <ColumnSorterSettings
      class="absolute"
      :style="{
        top: `${heatmapLayoutStore.tileMargin}px`,
        left: `${heatmapLayoutStore.rowLabelWidth + 2 * heatmapLayoutStore.tileMargin + heatmapLayoutStore.tilePadding + 3}px`,
      }"
    />
    <ColorMap
      :colorMap="heatmapStore.colorMap"
      class="absolute z-10"
      :style="{
        top: `${heatmapLayoutStore.rowsVerticalStartPosition - 50}px`,
        left: `${heatmapLayoutStore.tileMargin}px`,
        width: `${heatmapLayoutStore.rowLabelWidth}px`
      }"
    />
  </div>
</template>

<style scoped></style>
