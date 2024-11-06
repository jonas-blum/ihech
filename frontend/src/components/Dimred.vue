<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'
import { useMouse } from '@vueuse/core'

import { useHeatmapStore } from '@/stores/heatmapStore'
import { useDimredLayoutStore } from '@/stores/dimredLayoutStore'

import { PixiDimredApp } from '@/pixiComponents/PixiDimredApp'
import { Row } from '@/classes/Row'
import { PixiBubble } from '@/pixiComponents/PixiBubble'

const heatmapStore = useHeatmapStore()
const dimredLayoutStore = useDimredLayoutStore()
const dimredCanvas = ref<HTMLCanvasElement | null>(null)

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

let pixiDimredApp: PixiDimredApp | null = null
const pixiDimredInitialized = ref(false)

// watch for changes is highlightedRow
// NOTE: I guess having watcher in the Heatmap and Dimred components is not the most efficient way, but for seperation of concerns it is justifiable
watch(
  () => heatmapStore.highlightedRow,
  (newRow, oldRow) => {
    // console.log('highlightedRow changed from', oldRow, 'to', newRow)

    if (!pixiDimredApp) {
      console.warn('pixiDimredApp is not set')
      return
    }

    // remove the highlight from the old row
    if (oldRow?.pixiBubble) {
      // oldRow.pixiRow.removeHighlight()
      oldRow.pixiBubble.updateHighlightedDisplay(false)
    }

    // add the highlight to the new row
    if (newRow?.pixiBubble) {
      // newRow.pixiRow.addHighlight()
      newRow.pixiBubble.updateHighlightedDisplay(true)
    }
  },
)


function update() {
  console.log('🔄 Dimred.vue update')

  if (!dimredCanvas.value) {
    console.warn('dimredCanvas is not set')
    return
  }

  dimredLayoutStore.canvasWidth = dimredCanvas.value.clientWidth
  dimredLayoutStore.canvasHeight = dimredCanvas.value.clientHeight
  // console.log('📏 Dimred canvas size', dimredCanvas.value.width, dimredCanvas.value.height)

  // init the pixi containers and graphics (only once)
  if (!pixiDimredInitialized.value) {
    pixiDimredApp = new PixiDimredApp(dimredCanvas.value)

    // traverse the item tree with all rows and create the pixiBubbles
    let rows = heatmapStore.itemTree?.getAllRows()
    if (!rows) {
      console.warn('rows is not set')
      return
    }

    for (let row of rows) {
      let pixiBubble = new PixiBubble(row) // create PixiBubble with reference to the Row
      row.pixiBubble = pixiBubble // set the reference to the PixiBubble in the Row
      pixiDimredApp.addBubble(pixiBubble) // adds the PixiBubble to the PixiDimredApp
    }

    pixiDimredInitialized.value = true
    console.log('💨 Dimred components are initialized', pixiDimredApp)
  }
}

watch(
  () => heatmapStore.getDataChanging,
  () => {
    update()
  },
)

onMounted(async () => {
  window.addEventListener('resize', () => heatmapStore.changeHeatmap())

  update()
})
</script>

<template>
  <div class="w-full h-full">
    <canvas class="w-full h-full" ref="dimredCanvas"></canvas>
    <div
      class="absolute p-[2px] border-[1px] border-black bg-white shadow-md"
      :style="tooltipStyle"
      v-show="heatmapStore.hoveredPixiBubble"
    >
      <!-- <span>{{ heatmapStore.highlightedRow?.name }}</span
      ><br />
      <span>{{ heatmapStore.highlightedColumn?.name }}</span
      ><br /> -->
      <span>
        {{ heatmapStore.hoveredPixiBubble?.row.name }}
      </span>
    </div>
  </div>
</template>

<style scoped></style>
