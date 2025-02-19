<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'
import { useMouse } from '@vueuse/core'
import { Texture } from 'pixi.js'

import { useMainStore } from '@/stores/mainStore'
import { useDimredLayoutStore } from '@/stores/dimredLayoutStore'
import { useTextureStore } from '@/stores/textureStore'

import { PixiDimredApp } from '@/pixiComponents/PixiDimredApp'
import { Row, ItemRow, AggregateRow } from '@/classes/Row'
import { PixiBubble, PixiItemBubble, PixiAggregateBubble } from '@/pixiComponents/PixiBubble'


import ContextMenuBubble from '@components/ContextMenuBubble.vue'
import DimredAlgoSelection from '@components/DimredAlgoSelection.vue'

const mainStore = useMainStore()
const dimredLayoutStore = useDimredLayoutStore()
const textureStore = useTextureStore()
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

// this mechanism is needed to prevent interaction on the canvas elements below menus or tooltips
watch(
  () => mainStore.mouseOverMenuOrTooltip,
  (value) => {
    // disable interaction on the whole canvas if hovering over a menu or tooltip
    if (pixiDimredApp) {
      pixiDimredApp.stage.eventMode = value ? 'none' : 'auto'
    }
  },
)


// watch for changes is highlightedRow
// NOTE: I guess having watcher in the Heatmap and Dimred components is not the most efficient way, but for seperation of concerns it is justifiable
watch(
  () => mainStore.highlightedRow,
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

// watch for showParentBubbles
watch(
  () => dimredLayoutStore.showParentBubbles,
  (newValue, oldValue) => {
    if (!pixiDimredApp) {
      console.warn('pixiDimredApp is not set')
      return
    }

    // update position and visibility for all bubbles
    let rows = mainStore.itemTree?.rowsAsArray
    if (!rows) {
      console.warn('rows is not set')
      return
    }

    for (let row of rows) {
      row.pixiBubble?.updateVisibility()
    }
  },
)

// Watch for changes in the stickyRows array
// NOTE: shallow watch is enough, because the stickyRows array is always a new array (because deep watch would be too expensive)
// NOTE: Having watcher in the Heatmap and Dimred components is not the most efficient way, but for seperation of concerns it is justifiable
watch(
  () => mainStore.itemTree?.stickyRows,
  (newStickyRows, oldStickyRows) => {
    // console.log('stickyRows changed from', oldStickyRows, 'to', newStickyRows)

    if (!pixiDimredApp) {
      console.warn('pixiDimredApp is not set')
      return
    }

    // find difference between old and new sticky rows
    let stickyRowsToRemove = oldStickyRows?.filter(
      (oldStickyRow) => !newStickyRows?.includes(oldStickyRow),
    )
    // find new sticky rows
    let stickyRowsToAdd = newStickyRows?.filter(
      (newStickyRow) => !oldStickyRows?.includes(newStickyRow),
    )

    stickyRowsToRemove?.forEach((row, index) => {
      row.pixiBubble?.changeTexture(textureStore.bubbleTexture as Texture)
    })

    stickyRowsToAdd?.forEach((row, index) => {
      row.pixiBubble?.changeTexture(textureStore.stickyBubbleTexture as Texture)
    })
  },
)

// watch for change in dimredNeedsToBeScaled counter
watch(
  () => dimredLayoutStore.dimredNeedsToBeScaled,
  (newValue, oldValue) => {
    if (!pixiDimredApp) {
      console.warn('pixiDimredApp is not set')
      return
    }

    // console.log('🔍 Dimred.vue dimredNeedsToBeScaled changed from', oldValue, 'to', newValue)

    // lets re-scale immediately in case there is no animation ...
    // pixiDimredApp?.testScaling()

    // ... and re-scale after the animation is finished
    setTimeout(() => {
      pixiDimredApp?.testScaling()
    }, dimredLayoutStore.animationDuration * 1000)
  },
)

function clear() {
  console.log('🧹 Dimred.vue clear')
  const clearStart = performance.now()
  if (pixiDimredApp) {
    pixiDimredApp.clear()
    pixiDimredInitialized.value = false
  }
  console.log(`🧹 Dimred.vue clear took ${performance.now() - clearStart}ms`)
}

function init() {
  console.log('🚀 Dimred.vue init')

  if (!dimredCanvas.value) {
    console.warn('dimredCanvas is not set')
    return
  }

  updateCanvasDimensions()

  pixiDimredApp = new PixiDimredApp(dimredCanvas.value)

  // this is necessary to ensure that the renderer is ready
  function ensureRendererReady(callback: () => void) {
    if (pixiDimredApp?.renderer) {
      callback()
    } else {
      requestAnimationFrame(() => ensureRendererReady(callback))
    }
  }

  ensureRendererReady(() => {
    pixiDimredApp?.generateTextures()
  })
}

function update() {
  console.log('🔄 Dimred.vue update')
  updateCanvasDimensions()

  if (!pixiDimredApp) {
    console.warn('pixiDimredApp is not set')
    return
  }

  // init the pixi containers and graphics (only once)
  if (!pixiDimredInitialized.value) {
    console.time('initPixiDimredComponents')
    // traverse the item tree with all rows and create the pixiBubbles
    let rows = mainStore.itemTree?.rowsAsArray
    if (!rows) {
      console.warn('rows is not set')
      return
    }

    for (let row of rows) {
      let pixiBubble: PixiBubble | null = null
      if (row instanceof ItemRow) {
        pixiBubble = new PixiItemBubble(row)
      } else if (row instanceof AggregateRow) {
        pixiBubble = new PixiAggregateBubble(row)
      }

      if (pixiBubble) {
        row.pixiBubble = pixiBubble // set the reference to the PixiBubble in the Row
        pixiDimredApp.addBubble(pixiBubble) // adds the PixiBubble to the PixiDimredApp
      }
    }

    console.timeEnd('initPixiDimredComponents')

    pixiDimredInitialized.value = true
    console.log('💨 Dimred components are initialized', pixiDimredApp)
  }
}

function updateCanvasDimensions() {
  if (dimredCanvas.value) {
    dimredLayoutStore.canvasWidth = dimredCanvas.value.clientWidth
    dimredLayoutStore.canvasHeight = dimredCanvas.value.clientHeight
  }
}

watch(
  () => mainStore.loading,
  (loading) => {
    if (loading === true) {
      // we are about to fetch new data, so this is a good time to clear the canvas
      // stop first, because we don't want to update the canvas while it is being cleared
      if (pixiDimredApp && pixiDimredApp?.renderer) {
        // stop the auto-renderer (essentially freezes the canvas)
        pixiDimredApp.stop()
        // activate loading state
        pixiDimredApp?.activateLoadingState()
        // render once more to display the loading state
        pixiDimredApp?.render()
      }
      // now clear all kinds of PIXI stuff
      clear()

    } else {
      // we have new data, so we need to update the canvas
      update()
      pixiDimredApp?.start() // start again
      pixiDimredApp?.deactivateLoadingState()
    }
  },
)

onMounted(async () => {
  window.addEventListener('resize', () => mainStore.changeHeatmap())

  init()
})

const containerX = ref(0)
const containerV = ref(0)

function debug() {

}


function debug2() {
  if (pixiDimredApp) {
    pixiDimredApp.testScaling()
  }
}
</script>

<template>
  <div class="w-full h-full relative">

    <!-- <div class="absolute z-10 bottom-12 w-[300px] flex gap-2 bg-white p-2 border-[1px] border-black">
      <button @click="debug" class="btn btn-xs">DEBUG</button>
      <button @click="debug2" class="btn btn-xs">testScaling</button>
      <span>{{ dimredLayoutStore.dimredSize }}</span>
    </div> -->

    <canvas class="w-full h-full" ref="dimredCanvas" @contextmenu.prevent></canvas>

    <DimredAlgoSelection class="absolute" :style="{
      top: `${dimredLayoutStore.tileMargin}px`,
      left: `${dimredLayoutStore.tileMargin}px`,
    }" />
    <div class="absolute" :style="{
      top: `${dimredLayoutStore.tileMargin}px`,
      right: `${dimredLayoutStore.tileMargin}px`,
    }">
      <span class="text-xs mr-1">Show Parent Bubbles?</span>
      <input v-model="dimredLayoutStore.showParentBubbles" type="checkbox" class="toggle toggle-xs translate-y-[4px]" />
    </div>
  </div>
  <!-- Tooltip -->
  <div class="absolute p-[2px] border-[1px] border-black bg-white shadow-md" :style="tooltipStyle"
    v-show="mainStore.hoveredPixiBubble">
    <!-- <span>{{ mainStore.highlightedRow?.name }}</span
      ><br />
      <span>{{ mainStore.highlightedColumn?.name }}</span
      ><br /> -->
    <span>
      {{ mainStore.hoveredPixiBubble?.row.getName() }}
    </span>
  </div>

  <!-- bubble right-click menu -->
  <ContextMenuBubble class="border-[1px] border-black bg-white shadow-md"
    @mouseenter="mainStore.mouseOverMenuOrTooltip = true" @mouseleave="mainStore.mouseOverMenuOrTooltip = false">
  </ContextMenuBubble>
</template>

<style scoped></style>
