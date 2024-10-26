<script setup lang="ts">
import { Application, Graphics, Container } from 'pixi.js'
import { nextTick, onMounted, watch } from 'vue'
import { ref } from 'vue'

import { ColoringHeatmapEnum, type ItemNameAndData, getHeatmapColor } from '@helpers/helpers'
import { useHeatmapStore } from '@stores/heatmapStore'

const heatmapStore = useHeatmapStore()

class Heatmap {
  public container: Container
  public cellContainer: Container
  public rowLabelsContainer: Container
  public columnLabelsContainer: Container

  constructor() {
    // main container for everything in the heatmap (including the row and column labels)
    this.container = new Container()

    // container for the cells
    this.cellContainer = new Container()
    this.cellContainer.position.set(rowLabelsWidth.value, columnLabelsHeight.value)

    // containers for the row and column labels
    this.rowLabelsContainer = new Container()
    this.rowLabelsContainer.position.set(0, columnLabelsHeight.value)
    this.columnLabelsContainer = new Container()
    this.columnLabelsContainer.position.set(rowLabelsWidth.value, 0)

    // add the containers to the main container
    this.container.addChild(this.cellContainer)
    this.container.addChild(this.rowLabelsContainer)
    this.container.addChild(this.columnLabelsContainer)
  }
}

class PixiApplicationManager {
  app: Application
  heatmap: Heatmap

  constructor(canvasElement: HTMLCanvasElement, canvasWidth: number, canvasHeight: number) {
    // init app
    this.app = new Application()
    this.app.init({
      canvas: canvasElement,
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: 0xffffff,
      antialias: true,
      resolution: 2,
      // autoDensity: true, // not sure what this does
    })

    // add heatmap
    this.heatmap = new Heatmap()
    this.app.stage.addChild(this.heatmap.container)
    // TODO: this needs to be moved
    this.heatmap.container.position.set(0, 0)

    console.log('PixiApplicationManager constructor')
    console.log(this.app, this.app.stage)
  }
}

const pixiApplicationManager = ref<PixiApplicationManager | null>(null)

const canvas = ref<HTMLCanvasElement | null>(null)

const visibleRows = ref<ItemNameAndData[]>([])

const heatmapWidth = ref<number>(0)
const heatmapHeight = ref<number>(0)
const cellWidth = ref<number>(15)
const cellHeight = ref<number>(15)
const rowLabelsWidth = ref<number>(200)
const columnLabelsHeight = ref<number>(200)

const stickyAttributesGap = ref<number>(0)
const stickyItemsGap = ref<number>(0)

// updates the hierarchical structure of the visibleRows recursively
function updateVisibleRows() {
  function getVisibleRowsRecursively(row: ItemNameAndData): ItemNameAndData[] {
    if (!row.isOpen || row.children === null) {
      return [row]
    } else if (row.isOpen && row.children) {
      return [row].concat(
        row.children.flatMap((child: ItemNameAndData) => getVisibleRowsRecursively(child)),
      )
    }
    return []
  }
  visibleRows.value = heatmapStore.getHeatmap.itemNamesAndData.flatMap((row) =>
    getVisibleRowsRecursively(row),
  )
}

function update() {
  // TODO: this nees to be computed based on available space (?)
  // cellWidth.value = 10
  // cellHeight.value = 10
  // rowLabelsWidth.value = 200
  // columnLabelsHeight.value = 200

  updateVisibleRows()
  drawEverything()
}

// Function to get the maximum value in a row based on the coloring heatmap type
function getMaxRowValue(item: ItemNameAndData) {
  return heatmapStore?.getActiveDataTable?.coloringHeatmap === ColoringHeatmapEnum.ITEM_RELATIVE
    ? Math.max(...item.data) // If ITEM_RELATIVE, return the maximum value in the row
    : 1 // Otherwise, return 1
}

function drawEverything() {
  console.log('🖌️ drawEverything')

  if (!pixiApplicationManager.value) {
    console.warn('pixiApplicationManager is not set')
    return
  }

  // draw a rectangle to see if it works
  //   const graphics = new Graphics()
  //   graphics.rect(0, 0, 50, 50).fill(0xff0000)
  //   pixiApplicationManager.value.app.stage.children[0].addChild(graphics)

  // if (!canvas.value) {
  //   return
  // }
  // const ctx = canvas.value.getContext('2d')
  // if (!ctx) {
  //   return
  // }

  const heatmapMaxValue = heatmapStore.getHeatmapMaxValue
  const heatmapMinValue = heatmapStore.getHeatmapMinValue

  // Iterate over each row (item)
  for (let itemIdx = 0; itemIdx < visibleRows.value.length; itemIdx++) {
    const item = visibleRows.value[itemIdx]
    let maxRowValue = getMaxRowValue(item)

    // Iterate over each attribute in the row
    for (let attrIdx = 0; attrIdx < item.data.length; attrIdx++) {
      const initialAttrIdx = heatmapStore.getInitialAttrIdx(attrIdx)
      const initialValue = item.data[initialAttrIdx]

      let adjustedValue = initialValue
      // Adjust the value based on the coloring heatmap type
      if (heatmapStore?.getActiveDataTable?.coloringHeatmap === ColoringHeatmapEnum.ITEM_RELATIVE) {
        adjustedValue = initialValue / maxRowValue
      } else if (
        heatmapStore?.getActiveDataTable?.coloringHeatmap === ColoringHeatmapEnum.ATTRIBUTE_RELATIVE
      ) {
        const maxAttributeValue = heatmapStore.getMaxAttributeValues[initialAttrIdx]
        const minAttributeValue = heatmapStore.getMinAttributeValues[initialAttrIdx]
        const difference =
          maxAttributeValue - minAttributeValue === 0 ? 1 : maxAttributeValue - minAttributeValue
        adjustedValue = (adjustedValue - minAttributeValue) / difference
      } else if (
        heatmapStore?.getActiveDataTable?.coloringHeatmap === ColoringHeatmapEnum.LOGARITHMIC
      ) {
        adjustedValue = Math.log(initialValue + heatmapStore.getLogShiftValue)
      }

      // Calculate the position of the cell
      let x = attrIdx * cellWidth.value
      let y = itemIdx * cellHeight.value

      // Adjust position if there are sticky attributes or items
      if (attrIdx >= heatmapStore.getAmountOfStickyAttributes) {
        x += stickyAttributesGap.value
      }
      if (itemIdx >= heatmapStore.getAmountOfStickyItems) {
        y += stickyItemsGap.value
      }

      // Set the fill color and draw the cell
      // ctx.fillStyle = getHeatmapColor(adjustedValue, heatmapMinValue, heatmapMaxValue)
      // ctx.fillRect(x, y, cellWidth.value, cellHeight.value)

      let color = getHeatmapColor(adjustedValue, heatmapMinValue, heatmapMaxValue)
      let rect = new Graphics().rect(x, y, cellWidth.value, cellHeight.value).fill(color)
      // let rect = new Graphics().rect(100, 100, 400, 400).fill(0xff0000)

      pixiApplicationManager.value?.heatmap.cellContainer.addChild(rect)
    }
  }
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

  pixiApplicationManager.value = new PixiApplicationManager(
    canvas.value,
    heatmapWidth.value,
    heatmapHeight.value,
  )

  update()

  console.log(pixiApplicationManager.value)
})
</script>

<template>
  <canvas class="heatmap-canvas w-full h-full" ref="canvas"></canvas>
</template>

<style scoped></style>
