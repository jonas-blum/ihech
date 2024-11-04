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

let pixiDimredApp: PixiDimredApp | null = null
const pixiDimredInitialized = ref(false)

function update() {
  console.log('🔄 Dimred.vue update')

  if (!dimredCanvas.value) {
    console.warn('dimredCanvas is not set')
    return
  }

  dimredLayoutStore.canvasWidth = dimredCanvas.value.clientWidth
  dimredLayoutStore.canvasHeight = dimredCanvas.value.clientHeight
  console.log('📏 Dimred canvas size', dimredCanvas.value.width, dimredCanvas.value.height)

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
      // pixiBubble.updatePosition() // TODO: implement updatePosition in PixiBubble
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
  </div>
</template>

<style scoped></style>
