<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'
import { useMouse } from '@vueuse/core'

import { useHeatmapStore } from '@stores/heatmapStore'
import { useLayoutStore } from '@stores/layoutStore'

import { PixiApplicationManager } from '@/pixiComponents/PixiApplicationManager'
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
const layoutStore = useLayoutStore()

let pixiApplicationManager: PixiApplicationManager | null = null

const canvas = ref<HTMLCanvasElement | null>(null)

const heatmapWidth = ref<number>(0)
const heatmapHeight = ref<number>(0)

const pixiInitialized = ref(false)

// watch for changes is highlightedRow
watch(
  () => heatmapStore.highlightedRow,
  (newRow, oldRow) => {
    // console.log('highlightedRow changed from', oldRow, 'to', newRow)

    if (!pixiApplicationManager) {
      console.warn('pixiApplicationManager is not set')
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

    if (!pixiApplicationManager) {
      console.warn('pixiApplicationManager is not set')
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

    if (!pixiApplicationManager) {
      console.warn('pixiApplicationManager is not set')
      return
    }

    // find difference between old and new sticky rows
    let stickyRowsToRemove = oldStickyRows?.filter(
      (oldStickyRow) => !newStickyRows?.includes(oldStickyRow),
    )
    console.log('stickyRowsToRemove', stickyRowsToRemove)

    // find new sticky rows
    let stickyRowsToAdd = newStickyRows?.filter(
      (newStickyRow) => !oldStickyRows?.includes(newStickyRow),
    )
    console.log('stickyRowsToAdd', stickyRowsToAdd)

    // loop over the sticky rows to remove
    stickyRowsToRemove?.forEach((row) => {
      // remove the PixiRow from the PixiHeatmap.stickyRowsContainer
      if (row?.stickyPixiRow) {
        if (row.stickyPixiRow instanceof PixiRow) {
          pixiApplicationManager?.heatmap.removeStickyRow(row.stickyPixiRow)
        }
      }
    })

    // add new sticky rows
    stickyRowsToAdd?.forEach((row, index) => {
      const pixiRow = new PixiRow(row, true) // create PixiRow with reference to the Row
      row.stickyPixiRow = pixiRow // set the reference to the (sticky) PixiRow in the Row
      pixiApplicationManager?.heatmap.addStickyRow(pixiRow) // adds the PixiRow to the PixiHeatmap.stickyRowsContainer
    })

    // update the position of all rows
    newStickyRows?.forEach((row, index) => {
      if (row.stickyPixiRow) {
        row.stickyPixiRow.position.y = index * layoutStore.rowHeight // Set position based on index
      }
    })

    // Update the vertical position of the row container to account for sticky rows
    pixiApplicationManager.heatmap.rowContainer.position.y =
      layoutStore.columnLabelHeight +
      (newStickyRows?.length ? layoutStore.gapAfterStickyRows : 0) +
      (newStickyRows?.length ?? 0) * layoutStore.rowHeight
  },
)

// watch for deep changes in ColorMap
watch(
  () => heatmapStore.colorMap,
  (newColorMap, oldColorMap) => {
    if (!pixiApplicationManager) {
      console.warn('pixiApplicationManager is not set')
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

function update() {
  // only once I need to init the pixi containers and graphics
  if (!pixiInitialized.value) {
    if (!pixiApplicationManager) {
      console.warn('pixiApplicationManager is not set')
      return
    }

    let pixiHeatmap = pixiApplicationManager.heatmap

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
      pixiHeatmap.addRow(pixiRow) // adds the PixiRow to the PixiHeatmap
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
      pixiHeatmap.addColumnLabel(pixiColumnLabel) // adds the PixiColumnLabel to the PixiHeatmap
    }

    pixiInitialized.value = true
    console.log('💨 pixi components are initialized', pixiApplicationManager)
  }
}

function debug() {
  console.log('🐞', pixiApplicationManager)
  console.log(heatmapStore.hoveredPixiHeatmapCell)
  console.log(heatmapStore.hoveredPixiRowLabel)
  console.log(heatmapStore.hoveredPixiColumnLabel)
  console.log(heatmapStore.highlightedPixiRow)
  console.log(heatmapStore.highlightedColumn)
  console.log(heatmapStore.highlightedRow)
}

watch(
  () => heatmapStore.getDataChanging,
  () => {
    update()
  },
)

onMounted(async () => {
  if (!canvas.value) {
    return
  }

  // indirecly update heatmap
  window.addEventListener('resize', () => heatmapStore.changeHeatmap())

  // canvas.value.addEventListener('mousemove', updateTooltip)
  // canvas.value.addEventListener('mouseout', () => {
  //   resetHoverStyles()
  // })
  // canvas.value.addEventListener('contextmenu', (event) => {
  //   event.preventDefault()
  //   clickCanvas(event, false)
  // })

  // canvas.value.addEventListener('click', (event) => {
  //   clickCanvas(event, true)
  // })

  // get the width and height of the canvas
  heatmapWidth.value = canvas.value.clientWidth
  heatmapHeight.value = canvas.value.clientHeight

  pixiApplicationManager = new PixiApplicationManager(
    canvas.value,
    heatmapWidth.value,
    heatmapHeight.value,
  )

  console.log(pixiApplicationManager)
})
</script>

<template>
  <div class="w-full h-full">
    <canvas class="heatmap-canvas w-full h-full" ref="canvas"></canvas>
    <button class="btn btn-primary btn-small" @click="debug()">Debug</button>

    <div
      class="absolute p-[2px] border-[1px] border-black bg-white shadow-md"
      :style="tooltipStyle"
      v-show="heatmapStore.hoveredPixiHeatmapCell"
    >
      <span>{{ heatmapStore.highlightedRow?.name }}</span><br>
      <span>{{ heatmapStore.highlightedColumn?.name }}</span><br>
      <span>
        {{ heatmapStore.hoveredPixiHeatmapCell?.value }}
      </span>
    </div>
  </div>
</template>

<style scoped></style>
