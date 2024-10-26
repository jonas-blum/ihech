<script setup lang="ts">
import { nextTick, onMounted, watch } from 'vue'
import { ref } from 'vue'

import { ColoringHeatmapEnum, type ItemNameAndData, getHeatmapColor } from '@helpers/helpers'
import { useHeatmapStore } from '@stores/heatmapStore'

import { PixiApplicationManager, PixiHeatmap, PixiRow, PixiHeatmapCell } from '@helpers/PixiComponents'

const heatmapStore = useHeatmapStore()

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

  const heatmapMaxValue = heatmapStore.getHeatmapMaxValue
  const heatmapMinValue = heatmapStore.getHeatmapMinValue

  // Iterate over each visibleRow
  for (const [visibleRowIdx, visibleRow] of visibleRows.value.entries()) {
    console.log('visibleRow', visibleRow)
    let maxRowValue = getMaxRowValue(visibleRow)

    // Iterate over each attribute in the visibleRow
    for (const [attrIdx, attrValue] of visibleRow.data.entries()) {

      // because the attributes are not in the same order as in the original data due to sorting / stickyness (?)
      const initialAttrIdx = heatmapStore.getInitialAttrIdx(attrIdx)
      const initialValue = visibleRow.data[initialAttrIdx]

      let adjustedValue = initialValue
      // Adjust the value based on the coloring heatmap type
      if (heatmapStore?.getActiveDataTable?.coloringHeatmap === ColoringHeatmapEnum.ITEM_RELATIVE) {
        // if ITEM_RELATIVE, adjust the value based on the maximum value in the row
        adjustedValue = initialValue / maxRowValue
      } else if (
        heatmapStore?.getActiveDataTable?.coloringHeatmap === ColoringHeatmapEnum.ATTRIBUTE_RELATIVE
      ) {
        // if ATTRIBUTE_RELATIVE, do a column-wise lookup for min and max values
        // do a column-wise lookup for min and max values
        const maxAttributeValue = heatmapStore.getMaxAttributeValues[initialAttrIdx]
        const minAttributeValue = heatmapStore.getMinAttributeValues[initialAttrIdx]
        // Calculate the difference between the max and min values
        const difference =
          maxAttributeValue - minAttributeValue === 0 ? 1 : maxAttributeValue - minAttributeValue
        // Adjust the value based on the min and max values
        adjustedValue = (adjustedValue - minAttributeValue) / difference
      } else if (
        heatmapStore?.getActiveDataTable?.coloringHeatmap === ColoringHeatmapEnum.LOGARITHMIC
      ) {
        // if LOGARITHMIC, adjust the value based on the logarithm of the value
        // NOTE: this seems a bit counterintuitive, because applying a log should be an independent option ?!
        adjustedValue = Math.log(initialValue + heatmapStore.getLogShiftValue)
      }

      // Calculate the position of the cell
      let x = attrIdx * cellWidth.value
      let y = visibleRowIdx * cellHeight.value

      // Adjust position if there are sticky attributes or items
      if (attrIdx >= heatmapStore.getAmountOfStickyAttributes) {
        x += stickyAttributesGap.value
      }
      if (visibleRowIdx >= heatmapStore.getAmountOfStickyItems) {
        y += stickyItemsGap.value
      }

      let color = getHeatmapColor(adjustedValue, heatmapMinValue, heatmapMaxValue)

      let newHeatmapCell = new PixiHeatmapCell()
      newHeatmapCell.draw(cellWidth.value, cellHeight.value, color)
      pixiApplicationManager.value?.heatmap.cellContainer.addChild(newHeatmapCell)
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

  console.log(pixiApplicationManager.value)
})
</script>

<template>
  <canvas class="heatmap-canvas w-full h-full" ref="canvas"></canvas>
</template>

<style scoped></style>
