<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'
import { useMouse } from '@vueuse/core'

import { useHeatmapStore } from '@/stores/heatmapStore'
import { useDimredLayoutStore } from '@/stores/dimredLayoutStore'

import { PixiDimredApp } from '@/pixiComponents/PixiDimredApp'
import { Row } from '@/classes/Row'

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

  // NOTE: not sure if this is needed
  if (dimredCanvas.value) {
    dimredLayoutStore.canvasWidth = dimredCanvas.value.width
    dimredLayoutStore.canvasHeight = dimredCanvas.value.height
  }

  // init the pixi containers and graphics (only once)
  if (!pixiDimredInitialized.value) {
    pixiDimredApp = new PixiDimredApp(dimredCanvas.value)

    // TODO: draw circle for each Row and set pointers

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
  // window.addEventListener('resize', () => heatmapStore.changeHeatmap())

  update()
})
</script>

<template>
  <div class="w-full h-full">
    <canvas class="heatmap-canvas w-full h-full" ref="dimredCanvas"></canvas>
  </div>
</template>

<style scoped></style>
