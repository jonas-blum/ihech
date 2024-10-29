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

// watch for changes in the stickyRows (itemTree.stickyRows)
watch(
  () => heatmapStore.itemTree?.stickyRows.length,
  (newLength, oldLength) => {
    console.log('stickyRows length changed from', oldLength, 'to', newLength)

    // TODO: create new pixiRow and pixiRowLabel for each new sticky row
    // TODO: add/remove sticky rows 
    if (!pixiApplicationManager) {
      console.warn('pixiApplicationManager is not set')
      return
    }

    // destroy all PixiRow instances of the sticky rows (this is a bit brute force, but pragmatic)
    pixiApplicationManager.heatmap.destroyStickyRows()

    if (newLength == undefined) {
      console.warn('newLength is not set')
      return
    }

    // create a new PixiRow for each sticky row
    for (let i = 0; i < newLength; i++) {
      let row = heatmapStore.itemTree?.stickyRows[i] as Row
      if (!row) {
        console.warn('row is not set')
        return
      }

      let pixiRow = new PixiRow(row) // create PixiRow with reference to the Row
      pixiRow.container.position.y = i * layoutStore.rowHeight // otherwise they are positoned based on the row.position from the Row class
      if (pixiRow.pixiRowLabel) {
        pixiRow.pixiRowLabel.container.position.x = 0 // otherwise they are positoned based on the row.depth from the Row class
      }
      pixiApplicationManager.heatmap.addStickyRow(pixiRow) // adds the PixiRow to the PixiHeatmap
    }

    // need to update the vertical position of the row container (because the space needed for the sticky rows changed)
    pixiApplicationManager.heatmap.rowContainer.position.y = layoutStore.columnLabelHeight + layoutStore.gapAfterStickyRows + newLength * layoutStore.rowHeight

    console.log('🪡 added sticky rows', pixiApplicationManager)
  }
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
