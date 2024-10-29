<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'

import { useHeatmapStore } from '@stores/heatmapStore'
import { useLayoutStore } from '@stores/layoutStore'

import { PixiApplicationManager } from '@/pixiComponents/PixiApplicationManager'
import { PixiRow } from '@/pixiComponents/PixiRow'
import { PixiRowLabel } from '@/pixiComponents/PixiRowLabel'
import { PixiColumnLabel } from '@/pixiComponents/PixiColumnLabel'
import { Row } from '@/classes/Row'

const heatmapStore = useHeatmapStore()
const layoutStore = useLayoutStore()

let pixiApplicationManager: PixiApplicationManager | null = null

const canvas = ref<HTMLCanvasElement | null>(null)

const heatmapWidth = ref<number>(0)
const heatmapHeight = ref<number>(0)

const pixiInitialized = ref(false)

// Watch for deep changes in the stickyRows array
watch(
  () => heatmapStore.itemTree?.stickyRows,
  (newStickyRows, oldStickyRows) => {
    console.log('stickyRows changed from', oldStickyRows, 'to', newStickyRows)

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
        pixiApplicationManager?.heatmap.removeStickyRow(row.stickyPixiRow)
      }
    })

    // add new sticky rows
    stickyRowsToAdd?.forEach((row, index) => {
      const pixiRow = new PixiRow(row) // create PixiRow with reference to the Row
      row.stickyPixiRow = pixiRow // set the reference to the (sticky) PixiRow in the Row
      pixiApplicationManager?.heatmap.addStickyRow(pixiRow) // adds the PixiRow to the PixiHeatmap.stickyRowsContainer
    })

    // update the position of all rows
    newStickyRows?.forEach((row, index) => {
      if (row.stickyPixiRow) {
        row.stickyPixiRow.container.position.y = index * layoutStore.rowHeight // Set position based on index
        row.stickyPixiRow.pixiRowLabel.container.position.x = 0 // otherwise the row.depth would be used 
      }
    })

    // Update the vertical position of the row container to account for sticky rows
    pixiApplicationManager.heatmap.rowContainer.position.y =
      layoutStore.columnLabelHeight +
      layoutStore.gapAfterStickyRows +
      newStickyRows.length * layoutStore.rowHeight
  },
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
  </div>
</template>

<style scoped></style>
