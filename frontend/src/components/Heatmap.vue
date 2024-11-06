<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'
import { useMouse } from '@vueuse/core'

import { useHeatmapStore } from '@stores/heatmapStore'
import { useHeatmapLayoutStore } from '@stores/heatmapLayoutStore'

import { PixiHeatmapApp } from '@/pixiComponents/PixiHeatmapApp'
import { PixiRow } from '@/pixiComponents/PixiRow'
import { PixiRowLabel } from '@/pixiComponents/PixiRowLabel'
import { PixiColumnLabel } from '@/pixiComponents/PixiColumnLabel'
import { Row } from '@/classes/Row'
import type { PixiHeatmapCell } from '@/pixiComponents/PixiHeatmapCell'

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

const heatmapWidth = ref<number>(0)
const heatmapHeight = ref<number>(0)

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
      const pixiRow = new PixiRow(row, true) // create PixiRow with reference to the Row
      row.stickyPixiRow = pixiRow // set the reference to the (sticky) PixiRow in the Row
      pixiHeatmapApp?.addStickyRow(pixiRow) // adds the PixiRow to the PixiHeatmapApp.stickyRowsContainer
    })

    // update the position of all rows
    newStickyRows?.forEach((row, index) => {
      if (row.stickyPixiRow) {
        row.stickyPixiRow.position.y = index * heatmapLayoutStore.rowHeight // Set position based on index
      }
    })

    // Update the vertical position of the row container to account for sticky rows
    pixiHeatmapApp.rowContainer.position.y = heatmapLayoutStore.rowsVerticalStartPosition
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
    }
  },
)

function update() {
  console.log('🔄 Heatmap.vue update')
  // update the heatmapLayoutStore with the current canvas dimensions
  if (heatmapCanvas.value) {
    heatmapLayoutStore.canvasWidth = heatmapCanvas.value.clientWidth
    heatmapLayoutStore.canvasHeight = heatmapCanvas.value.clientHeight
    // console.log('📏 Heatmap canvas size', heatmapCanvas.value.clientWidth, heatmapCanvas.value.clientHeight)
  }

  // only once I need to init the pixi containers and graphics
  if (!pixiHeatmapInitialized.value) {
    if (!heatmapCanvas.value) {
      console.warn('canvas is not set')
      return
    }

    pixiHeatmapApp = new PixiHeatmapApp(heatmapCanvas.value)

    // traverse the item tree with all rows and create the pixiRows
    let rows = heatmapStore.itemTree?.getAllRows()
    if (!rows) {
      console.warn('rows is not set')
      return
    }

    for (let row of rows) {
      let pixiRow = new PixiRow(row) // create PixiRow with reference to the Row
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

    pixiHeatmapInitialized.value = true
    console.log('💨 Heatmap components are initialized', pixiHeatmapApp)
  }
}

function debug() {
  console.log('🐞', pixiHeatmapApp)
  pixiHeatmapApp?.rowContainer.position.set(0, 0)
}

watch(
  () => heatmapStore.getDataChanging,
  () => {
    update()
  },
)

onMounted(async () => {
  window.addEventListener('resize', () => heatmapStore.changeHeatmap())

  heatmapStore.changeHeatmap()
})
</script>

<template>
  <div class="w-full h-full">
    <canvas class="w-full h-full" ref="heatmapCanvas"></canvas>
    <button class="btn btn-primary btn-small" @click="debug()">Debug</button>
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
  </div>
</template>

<style scoped></style>
