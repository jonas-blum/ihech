<script setup lang="ts">
import { nextTick, onMounted, watch } from 'vue'
import { ref } from 'vue'
import ExpRowComponent from './ExpRowComponent.vue'

import { ColoringHeatmapEnum, getHeatmapColor, type ItemNameAndData } from '@helpers/helpers'
import { useHeatmapStore } from '@stores/heatmapStore'

import DimReductionVisual from './DimReductionVisual.vue'

import HeatmapSettings from './HeatmapSettings.vue'
import CsvUpload from './CsvUpload.vue'

const heatmapStore = useHeatmapStore()

const MIN_CELL_HEIGHT = 17
const GAP_HEIGHT = 2
const COL_LABELS_HEIGHT = 100
const TOP_SCROLLBAR_OFFSET = 15
const MIN_DIM_REDUCTION_WIDTH = 250
const ROW_LABELS_WIDTH = 200
const MIN_COL_LABELS_WIDTH = 12
const BORDER_WIDTH = 3
const SPACE_BETWEEN_COL_LABELS_AND_HEATMAP = 5
const SPACE_BETWEEN_ITEM_LABELS_AND_HEATMAP = 10
const MARGIN_RIGHT = 40

const STICKY_GAP = 10

const dataChangingRef = ref<number>(1)

const tooltip = ref<HTMLElement | null>(null)
const tooltipValue = ref<HTMLElement | null>(null)
const tooltipRow = ref<HTMLElement | null>(null)
const tooltipCol = ref<HTMLElement | null>(null)

const colLabelContainer = ref<HTMLElement | null>(null)

const highlightOverlay = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)

const topScrollbarContainer = ref<HTMLElement | null>(null)
const bottomScrollbarContainer = ref<HTMLElement | null>(null)

const visibleRows = ref<ItemNameAndData[]>([])

const dimReductionWidth = ref<number>(MIN_DIM_REDUCTION_WIDTH)

const heatmapWidth = ref<number>(0)
const heatmapContainerWidth = ref<number>(0)
const cellWidth = ref<number>(0)
const heatmapHeight = ref<number>(0)
const cellHeight = ref<number>(0)

const entireColLabelHeight = ref<number>(0)

const editionNames = ref<string[]>([])
const stickyAttributesGap = ref<number>(0)
const stickyItemsGap = ref<number>(0)

function updateDimReductionWidth() {
  dimReductionWidth.value = Math.min(
    window.innerWidth -
      heatmapContainerWidth.value -
      ROW_LABELS_WIDTH -
      SPACE_BETWEEN_ITEM_LABELS_AND_HEATMAP -
      MARGIN_RIGHT,
    window.innerHeight / 1.5,
  )
}

function updateHeatmapWidth() {
  heatmapWidth.value = MIN_COL_LABELS_WIDTH * heatmapStore.getHeatmap.attributeNames.length
}

function updateCellWidth() {
  cellWidth.value = Math.round(
    (heatmapWidth.value - stickyAttributesGap.value) /
      heatmapStore.getHeatmap.attributeNames.length,
  )
}

function updateHeatmapHeight() {
  heatmapHeight.value = MIN_CELL_HEIGHT * visibleRows.value.length + stickyItemsGap.value
}

function updateCellHeight() {
  cellHeight.value = Math.round(
    (heatmapHeight.value - stickyItemsGap.value) / visibleRows.value.length,
  )
}

function updateEditionNames() {
  editionNames.value = heatmapStore.getHeatmap.itemNamesAndData.map((row) => row.itemName)
}

function updateStickyAttributesGap() {
  let stickyAttributesGapTemp = STICKY_GAP
  if (heatmapStore.getActiveDataTable?.clusterItemsBasedOnStickyAttributes) {
    stickyAttributesGapTemp *= 2
  }
  stickyAttributesGap.value = heatmapStore.isStickyAttributesGapVisible
    ? stickyAttributesGapTemp
    : 0
}

function updateStickyItemsGap() {
  let stickyItemsGapTemp = STICKY_GAP
  if (heatmapStore.getActiveDataTable?.sortAttributesBasedOnStickyItems) {
    stickyItemsGapTemp *= 2
  }
  stickyItemsGap.value = heatmapStore.isStickyItemsGapVisible ? stickyItemsGapTemp : 0
}

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

function updateHeatmapContainerWidth() {
  let maxWidth = Math.round(
    window.innerWidth -
      ROW_LABELS_WIDTH -
      MIN_DIM_REDUCTION_WIDTH -
      SPACE_BETWEEN_ITEM_LABELS_AND_HEATMAP -
      MARGIN_RIGHT,
  )

  const width = Math.min(maxWidth, heatmapWidth.value + 2 * BORDER_WIDTH)
  heatmapContainerWidth.value = width
}

function updateEntireColLabelHeight() {
  if (!topScrollbarContainer.value || !colLabelContainer.value) {
    return
  }
  entireColLabelHeight.value =
    topScrollbarContainer.value.offsetHeight +
    colLabelContainer.value.offsetHeight +
    TOP_SCROLLBAR_OFFSET +
    SPACE_BETWEEN_COL_LABELS_AND_HEATMAP
}

function getHeatmapColorMaxValue() {
  if (heatmapStore?.getActiveDataTable?.coloringHeatmap === ColoringHeatmapEnum.RELATIVE) {
    return 1
  } else if (
    heatmapStore?.getActiveDataTable?.coloringHeatmap === ColoringHeatmapEnum.LOGARITHMIC
  ) {
    return Math.log(heatmapStore.getHeatmapMaxValue + 1)
  } else if (heatmapStore?.getActiveDataTable?.coloringHeatmap === ColoringHeatmapEnum.ABSOLUTE) {
    return heatmapStore.getHeatmapMaxValue
  }
  return heatmapStore.getHeatmapMaxValue
}

function drawEverything() {
  if (!canvas.value) {
    return
  }
  const ctx = canvas.value.getContext('2d')
  if (!ctx) {
    return
  }
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

  nextTick(() => {
    const heatmapMaxValue = getHeatmapColorMaxValue()
    visibleRows.value.forEach((row, rowIndex) => {
      let maxRowValue = 1
      if (heatmapStore?.getActiveDataTable?.coloringHeatmap === ColoringHeatmapEnum.RELATIVE) {
        maxRowValue = Math.max(...row.data)
      }
      row.data.forEach((value, colIndex) => {
        let adjustedValue = value
        if (heatmapStore?.getActiveDataTable?.coloringHeatmap === ColoringHeatmapEnum.RELATIVE) {
          adjustedValue = value / maxRowValue
        } else if (
          heatmapStore?.getActiveDataTable?.coloringHeatmap === ColoringHeatmapEnum.LOGARITHMIC
        ) {
          adjustedValue = Math.log(value + 1)
        }

        let x = colIndex * cellWidth.value
        let y = rowIndex * cellHeight.value

        if (colIndex >= heatmapStore.getAmountOfStickyAttributes) {
          x += stickyAttributesGap.value
        }
        if (rowIndex >= heatmapStore.getAmountOfStickyItems) {
          y += stickyItemsGap.value
        }
        ctx.fillStyle = getHeatmapColor(
          adjustedValue,
          heatmapStore.getHeatmapMinValue,
          heatmapMaxValue,
        )
        ctx.fillRect(x, y, cellWidth.value, cellHeight.value)
      })
    })
  })
}

function resetHoverStyles(resetHighlightedRow = true) {
  if (!tooltip.value || !highlightOverlay.value || !colLabelContainer.value) {
    return
  }
  highlightOverlay.value.style.display = 'none'
  tooltip.value.style.display = 'none'

  if (resetHighlightedRow) {
    heatmapStore.setHighlightedRow(null)
  }
  for (const child of colLabelContainer.value.children) {
    ;(child as HTMLElement).style.fontWeight = 'normal'
  }
}

function clickCanvas(e: MouseEvent, leftClick: boolean) {
  e.preventDefault()
  e.stopPropagation()
  if (!e.target) return
  resetHoverStyles()
  if (!(e.target instanceof HTMLElement)) {
    console.error('Event target is not an HTMLElement:', e.target)
    return
  }
  const rect = e.target.getBoundingClientRect()
  let x = e.clientX - rect.left - BORDER_WIDTH
  let y = e.clientY - rect.top - BORDER_WIDTH

  if (heatmapStore.isStickyAttributesGapVisible) {
    const startX = heatmapStore.getAmountOfStickyAttributes * cellWidth.value
    const endX = startX + stickyAttributesGap.value
    if (x >= startX && x <= endX) {
      return
    }
    if (x > endX) {
      x -= stickyAttributesGap.value
    }
  }

  if (heatmapStore.isStickyItemsGapVisible) {
    const startY = heatmapStore.getAmountOfStickyItems * cellHeight.value
    const endY = startY + stickyItemsGap.value
    if (y >= startY && y <= endY) {
      return
    }
    if (y > endY) {
      y -= stickyItemsGap.value
    }
  }

  const colIdx = Math.floor(x / cellWidth.value)
  const rowIdx = Math.floor(y / cellHeight.value)
  if (colIdx < 0 || rowIdx < 0) return
  const selectedRow = visibleRows.value[rowIdx]
  if (leftClick) {
    if (selectedRow.children) {
      heatmapStore.expandRow(selectedRow)
    } else {
      heatmapStore.toggleStickyItem(selectedRow)
    }
  } else {
    heatmapStore.closeNearestOpenParent(selectedRow)
  }
}

function updateTooltip(e: MouseEvent) {
  if (
    !highlightOverlay.value ||
    !colLabelContainer.value ||
    !tooltip.value ||
    !tooltipValue.value ||
    !tooltipRow.value ||
    !tooltipCol.value
  ) {
    return
  }

  if (!(e.target instanceof HTMLElement)) {
    console.error('Event target is not an HTMLElement:', e.target)
    return
  }
  if (!e.target) return

  const rect = e.target.getBoundingClientRect()
  let x = e.clientX - rect.left - BORDER_WIDTH
  let y = e.clientY - rect.top - BORDER_WIDTH

  let incorporateStickyAttributesGap = false
  let incorporateStickyItemsGap = false

  if (heatmapStore.isStickyAttributesGapVisible) {
    const startX = heatmapStore.getAmountOfStickyAttributes * cellWidth.value
    const endX = startX + stickyAttributesGap.value
    if (x >= startX && x <= endX) {
      resetHoverStyles(true)
      return
    }
    if (x > endX) {
      x -= stickyAttributesGap.value
      incorporateStickyAttributesGap = true
    }
  }

  if (heatmapStore.isStickyItemsGapVisible) {
    const startY = heatmapStore.getAmountOfStickyItems * cellHeight.value
    const endY = startY + stickyItemsGap.value
    if (y >= startY && y <= endY) {
      resetHoverStyles(true)
      return
    }
    if (y > endY) {
      y -= stickyItemsGap.value
      incorporateStickyItemsGap = true
    }
  }

  resetHoverStyles(false)

  const colIdx = Math.floor(x / cellWidth.value)
  const rowIdx = Math.floor(y / cellHeight.value)
  if (colIdx < 0 || rowIdx < 0) return
  const selectedRow = visibleRows.value[rowIdx]
  if (heatmapStore.getHighlightedRow !== selectedRow) {
    heatmapStore.setHighlightedRow(selectedRow)
  }

  let dataValue = selectedRow.data[colIdx]

  let overlayX = colIdx * cellWidth.value + rect.left + scrollX
  let overlayY = rowIdx * cellHeight.value + rect.top + scrollY

  if (incorporateStickyAttributesGap) {
    overlayX += stickyAttributesGap.value
  }

  if (incorporateStickyItemsGap) {
    overlayY += stickyItemsGap.value
  }

  overlayX += BORDER_WIDTH
  overlayY += BORDER_WIDTH

  highlightOverlay.value.style.width = `${Math.max(cellWidth.value - 4, 1)}px`
  highlightOverlay.value.style.height = `${Math.max(cellHeight.value - 4, 1)}px`
  highlightOverlay.value.style.left = `${overlayX}px`
  highlightOverlay.value.style.top = `${overlayY}px`
  highlightOverlay.value.style.display = 'block'

  const tooltipHeight = tooltip.value.offsetHeight

  const tooltipTop = e.clientY - tooltipHeight - 10 + window.scrollY

  tooltip.value.style.top = `${tooltipTop}px`
  tooltip.value.style.display = 'block'
  tooltip.value.style.zIndex = '1000'

  tooltipValue.value.textContent = dataValue.toFixed(3).toString()
  tooltipRow.value.textContent = selectedRow.itemName
  tooltipCol.value.textContent = heatmapStore.getHeatmap.attributeNames[colIdx]

  const tooltipXRight = e.clientX + 20
  const maxRight = window.innerWidth - tooltip.value.offsetWidth * 1.3
  if (maxRight < tooltipXRight) {
    tooltip.value.style.left = `${e.clientX - tooltip.value.offsetWidth - 20}px`
  } else {
    tooltip.value.style.left = `${tooltipXRight}px`
  }

  const colLabelChildren = colLabelContainer.value.children
  if (colLabelChildren.length > colIdx) {
    const colLabel = colLabelChildren[colIdx] as HTMLElement
    colLabel.style.fontWeight = '900'
  }
}

watch(
  () => heatmapStore.getDataChanging,
  () => {
    updateHeatmap()
    // dataChangingRef.value++
  },
)

function updateHeatmap() {
  updateVisibleRows()
  updateStickyAttributesGap()
  updateStickyItemsGap()

  updateHeatmapWidth()
  updateHeatmapContainerWidth()
  updateCellWidth()

  updateDimReductionWidth()

  updateHeatmapHeight()
  updateCellHeight()

  updateEditionNames()

  nextTick(() => {
    updateEntireColLabelHeight()
  })

  drawEverything()
}

function syncScroll(event: Event) {
  if (!(event.target instanceof HTMLElement)) {
    console.error('Event target is not an HTMLElement:', event.target)
    return
  }
  if (!topScrollbarContainer.value || !bottomScrollbarContainer.value) {
    return
  }

  if (event.target === topScrollbarContainer.value) {
    bottomScrollbarContainer.value.scrollLeft = event.target.scrollLeft
  } else if (event.target === bottomScrollbarContainer.value) {
    topScrollbarContainer.value.scrollLeft = event.target.scrollLeft
  }
}

onMounted(async () => {
  heatmapStore.resetSettings()
  if (!canvas.value) {
    return
  }

  window.addEventListener('resize', () => heatmapStore.changeHeatmap())

  canvas.value.addEventListener('mousemove', updateTooltip)
  canvas.value.addEventListener('mouseout', () => {
    resetHoverStyles()
  })
  canvas.value.addEventListener('contextmenu', (event) => {
    event.preventDefault()
    clickCanvas(event, false)
  })

  canvas.value.addEventListener('click', (event) => {
    clickCanvas(event, true)
  })
})
</script>

<template>
  <main class="box-content">
    <div ref="tooltip" class="tooltip">
      <div class="flex-tooltip">
        <div style="font-weight: bold" class="rows-tooltip">
          <div>Value:</div>
          <div ref="tooltipValue"></div>
        </div>
        <div class="rows-tooltip">
          <div>Document:</div>
          <div ref="tooltipRow"></div>
        </div>
        <div class="rows-tooltip">
          <div>Tag:</div>
          <div ref="tooltipCol"></div>
        </div>
      </div>
    </div>
    <div ref="highlightOverlay" class="highlight-overlay"></div>

    <div class="ihech-heading">
      <h1 v-if="!heatmapStore.isLoading">IHECH</h1>
      <span v-else class="loading loading-spinner loading-lg"></span>
    </div>

    <CsvUpload />

    <HeatmapSettings />

    <div class="heatmap-container">
      <div
        :style="{
          width: dimReductionWidth + 'px',
          height: dimReductionWidth + 'px',
          paddingTop: entireColLabelHeight - 25 + 'px',
          position: 'sticky',
          top: 0,
        }"
      >
        <div
          :style="{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }"
        >
          <p style="height: 25px">{{ heatmapStore.getActiveDataTable?.dimReductionAlgo }}</p>
          <DimReductionVisual style="border: 1px solid black" :width="dimReductionWidth" />
        </div>
      </div>
      <div
        :key="'row-label-' + dataChangingRef"
        :style="{
          height: heatmapHeight + 'px',
          marginTop: entireColLabelHeight + 'px',
          gap: GAP_HEIGHT + 'px',
          marginRight: SPACE_BETWEEN_ITEM_LABELS_AND_HEATMAP + 'px',
          width: ROW_LABELS_WIDTH + 'px',
        }"
        class="row-label-container"
      >
        <div
          :id="'row-label-' + index"
          class="edition-row-labels"
          :key="index"
          v-for="(row, index) in heatmapStore.getHeatmap.itemNamesAndData"
        >
          <ExpRowComponent
            class="box-content"
            :gap-height="GAP_HEIGHT"
            :cellHeight="cellHeight"
            :row="row"
            :border-width="BORDER_WIDTH"
            :depth="1"
            :edition-index="index"
            :row-labels-width="ROW_LABELS_WIDTH"
            :edition-count="editionNames.length"
            :sticky-items-gap-size="stickyItemsGap"
            :y-start-heatmap="canvas ? canvas.getBoundingClientRect().top : 0"
          />
        </div>
      </div>
      <div
        ref="heatmapAndColumnsContainer"
        :style="{
          width: heatmapContainerWidth + 'px',
          marginRight: 'auto',
        }"
      >
        <div
          class="sticky-top"
          :style="{
            overflowX: 'auto',
            width: heatmapContainerWidth + 'px',
            marginBottom: TOP_SCROLLBAR_OFFSET + 'px',
            boxSizing: 'border-box',
          }"
          @scroll="syncScroll"
          ref="topScrollbarContainer"
        >
          <div
            :style="{
              width: heatmapWidth + 'px',
              height: 1 + 'px',
            }"
          ></div>
        </div>
        <div
          :style="{
            width: heatmapContainerWidth + 'px',
            overflowX: 'auto',
            paddingBottom: TOP_SCROLLBAR_OFFSET + 'px',
          }"
          @scroll="syncScroll"
          ref="bottomScrollbarContainer"
        >
          <div
            ref="colLabelContainer"
            :key="'col-label-' + dataChangingRef"
            :style="{
              width: heatmapWidth + 'px',
              marginLeft: BORDER_WIDTH + 'px',
              height: COL_LABELS_HEIGHT - SPACE_BETWEEN_COL_LABELS_AND_HEATMAP + 'px',
              marginBottom: SPACE_BETWEEN_COL_LABELS_AND_HEATMAP + 'px',

              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              fontSize: 'small',
            }"
            class="sticky-top"
          >
            <button
              :key="colName"
              @click="heatmapStore.toggleStickyAttribute(colName)"
              v-for="(colName, index) in heatmapStore.getHeatmap.attributeNames"
              class="col-label"
              :style="{
                width: cellWidth + 'px',
                height: 'auto',
                position: 'relative',
                color: 'black',
                textAlign: 'center',
                cursor: 'pointer',
                marginLeft:
                  index === heatmapStore.getActiveDataTable?.stickyAttributes.length
                    ? stickyAttributesGap + 'px'
                    : 0,
              }"
            >
              <div
                :style="{
                  position: 'absolute',
                  width: '100%',
                  height: heatmapStore.getHeatmap.attributeDissimilarities[index] * 100 + '%',
                  backgroundColor: '#ccc',
                  top: '10px',
                  left: 0,
                  zIndex: 0,
                }"
              ></div>
              <div
                :style="{
                  position: 'absolute',
                  top: '0',
                  width: '100%',
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                }"
              >
                <div
                  :style="{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                  }"
                >
                  {{
                    heatmapStore.getActiveDataTable?.stickyAttributes.includes(colName) ? '-' : '+'
                  }}
                </div>
              </div>
              <div
                :style="{
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  top: '10px',
                  width: '100%',
                  zIndex: 1,
                }"
              >
                <div>{{ colName }}</div>
              </div>
            </button>
          </div>

          <canvas
            :style="{
              border: BORDER_WIDTH + 'px solid black',
              boxSizing: 'content-box',
            }"
            :width="heatmapWidth"
            :height="heatmapHeight"
            class="heatmap-canvas"
            ref="canvas"
          ></canvas>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
main {
  margin-top: 20px;
  margin-left: 10px;
  margin-right: 10px;
  box-sizing: content-box;
  font-family: 'Roboto Condensed';

  .ihech-heading {
    height: 50px;
  }

  h1 {
    font-size: 30px;
    font-weight: bold;
  }
}

.sticky-top {
  position: -webkit-sticky;
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: white;
}

.highlight-overlay {
  box-sizing: content-box;
  position: absolute;
  width: 10px;
  height: 10px;
  border: 2px solid black;
  display: none;
  pointer-events: none;
}

.tooltip {
  position: absolute;
  display: none;
  padding: 4px;
  background-color: white;
  color: black;
  border-radius: 4px;
  font-size: 18px;
  pointer-events: none;
}

.flex-tooltip {
  display: flex;
  flex-direction: column;
}

.rows-tooltip {
  display: flex;
  flex-direction: row;
  gap: 5px;
}

.bold {
  font-weight: bold;
}

.row-label-container {
  display: flex;
  justify-self: flex-start;
  flex-direction: column;
}

.edition-row-labels {
  display: flex;
  flex-direction: column;
}

.heatmap-container {
  display: grid;
  grid-template-columns: auto auto 1fr;
  width: 100%;
  margin-bottom: 500px;
}

.col-label {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  writing-mode: vertical-lr;
  text-orientation: mixed;
  transform: rotate(180deg);
  font-size: 13px;
  margin: 0;
  padding: 0;
}

.input-container {
  display: grid;
  gap: 10px;
  grid-template-columns: auto auto;
  grid-template-rows: auto auto;
  margin-bottom: 20px;
}
</style>
