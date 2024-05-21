<script setup lang="ts">
import { nextTick, onMounted, watch } from 'vue'
import { ref } from 'vue'
import ExpRowComponent from './ExpRowComponent.vue'

import {
  ColoringHeatmapEnum,
  getHeatmapColor,
  type ItemNameAndData,
  CSV_UPLOAD_COLLAPSED_HEIGHT,
  CSV_UPLOAD_EXPANDED_HEIGHT,
} from '@helpers/helpers'
import { useHeatmapStore } from '@stores/heatmapStore'

import DimReductionVisual from './DimReductionVisual.vue'
import CollectionSelector from './CollectionSelector.vue'

import HeatmapSettings from './HeatmapSettings.vue'
import CsvUpload from './CsvUpload.vue'

const heatmapStore = useHeatmapStore()

const MIN_CELL_HEIGHT = 17
const GAP_HEIGHT = 2
const COL_LABELS_HEIGHT = 125
const MIN_DIM_REDUCTION_WIDTH = 250
const ROW_LABELS_WIDTH = 200
const MIN_COL_LABELS_WIDTH = 15
const MAX_COL_LABELS_WIDTH = MIN_COL_LABELS_WIDTH * 2
const BORDER_WIDTH = 0
const SPACE_BETWEEN_COL_LABELS_AND_HEATMAP = 5
const SPACE_BETWEEN_ITEM_LABELS_AND_HEATMAP = 10
const MARGIN_RIGHT = 20
const MARGIN_LEFT = 20
const MARGIN_TOP = 20
const GAP_CSV_HEATMAP = 40
const GAP_SETTINGS_HEATMAP = 30
const SETTINGS_HEIGHT = 60

const STICKY_GAP = 10

const dataChangingRef = ref<number>(1)

const tooltip = ref<HTMLElement | null>(null)
const tooltipValue = ref<HTMLElement | null>(null)
const tooltipRow = ref<HTMLElement | null>(null)
const tooltipCol = ref<HTMLElement | null>(null)
const colLabelContainer = ref<HTMLElement | null>(null)
const highlightOverlay = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const bottomScrollbarContainer = ref<HTMLElement | null>(null)
const dimRedCollections = ref<HTMLElement | null>(null)

const visibleRows = ref<ItemNameAndData[]>([])

const dimReductionWidth = ref<number>(MIN_DIM_REDUCTION_WIDTH)

const heatmapWidth = ref<number>(0)
const heatmapContainerWidth = ref<number>(0)
const cellWidth = ref<number>(0)
const heatmapHeight = ref<number>(0)
const visibleHeatmapHeight = ref<number>(window.innerHeight - 20)
const cellHeight = ref<number>(0)

const entireColLabelHeight = ref<number>(0)

const editionNames = ref<string[]>([])
const stickyAttributesGap = ref<number>(0)
const stickyItemsGap = ref<number>(0)

// Updates every time the heatmap changes

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

function updateHeatmapWidth() {
  const availableWidth =
    window.innerWidth -
    stickyAttributesGap.value -
    ROW_LABELS_WIDTH -
    MIN_DIM_REDUCTION_WIDTH -
    SPACE_BETWEEN_ITEM_LABELS_AND_HEATMAP -
    MARGIN_RIGHT -
    MARGIN_LEFT -
    2 * BORDER_WIDTH

  let cellWidthTemp = Math.max(
    Math.floor(availableWidth / heatmapStore.getHeatmap.attributeNames.length),
    MIN_COL_LABELS_WIDTH,
  )
  cellWidthTemp = Math.min(cellWidthTemp, MAX_COL_LABELS_WIDTH)
  heatmapWidth.value = cellWidthTemp * heatmapStore.getHeatmap.attributeNames.length
  cellWidth.value = cellWidthTemp
}

function updateHeatmapContainerWidth() {
  let maxWidth = Math.round(
    window.innerWidth -
      ROW_LABELS_WIDTH -
      MIN_DIM_REDUCTION_WIDTH -
      SPACE_BETWEEN_ITEM_LABELS_AND_HEATMAP -
      MARGIN_RIGHT,
  )

  const width = Math.min(
    maxWidth,
    heatmapWidth.value + 2 * BORDER_WIDTH + stickyAttributesGap.value,
  )
  heatmapContainerWidth.value = width
}

function updateHeatmapHeight() {
  heatmapHeight.value = MIN_CELL_HEIGHT * visibleRows.value.length + stickyItemsGap.value
  cellHeight.value = MIN_CELL_HEIGHT
}

function updateEditionNames() {
  editionNames.value = heatmapStore.getHeatmap.itemNamesAndData.map((row) => row.itemName)
}

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

function updateVisibleHeatmapHeight() {
  const maxHeight = window.innerHeight - MARGIN_TOP - CSV_UPLOAD_COLLAPSED_HEIGHT - GAP_CSV_HEATMAP
  const minHeight = Math.max(
    heatmapHeight.value +
      COL_LABELS_HEIGHT +
      SPACE_BETWEEN_COL_LABELS_AND_HEATMAP +
      2 * BORDER_WIDTH +
      20,
  )

  visibleHeatmapHeight.value = Math.min(maxHeight, minHeight)
}

function updateEntireColLabelHeight() {
  if (!colLabelContainer.value) {
    return
  }
  entireColLabelHeight.value = COL_LABELS_HEIGHT + SPACE_BETWEEN_COL_LABELS_AND_HEATMAP
}

function updateHeatmap() {
  updateVisibleRows()
  updateStickyAttributesGap()
  updateStickyItemsGap()

  updateHeatmapWidth()
  updateHeatmapContainerWidth()

  updateHeatmapHeight()

  updateEditionNames()

  updateDimReductionWidth()

  updateVisibleHeatmapHeight()

  nextTick(() => {
    updateEntireColLabelHeight()
  })

  drawEverything()
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

function getHeatmapColorMinValue() {
  if (heatmapStore?.getActiveDataTable?.coloringHeatmap === ColoringHeatmapEnum.RELATIVE) {
    return 0
  } else if (
    heatmapStore?.getActiveDataTable?.coloringHeatmap === ColoringHeatmapEnum.LOGARITHMIC
  ) {
    const offsetValue = heatmapStore.getHeatmapMinValue + 1
    return Math.log(heatmapStore.getHeatmapMinValue + offsetValue)
  } else if (heatmapStore?.getActiveDataTable?.coloringHeatmap === ColoringHeatmapEnum.ABSOLUTE) {
    return heatmapStore.getHeatmapMinValue
  }
  return heatmapStore.getHeatmapMinValue
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
    const heatmapMinValue = getHeatmapColorMinValue()
    let offsetValue = 1
    if (heatmapStore?.getActiveDataTable?.coloringHeatmap === ColoringHeatmapEnum.LOGARITHMIC) {
      offsetValue = heatmapStore.getHeatmapMinValue + 1
    }

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
          adjustedValue = Math.log(value + offsetValue)
        }

        let x = colIndex * cellWidth.value
        let y = rowIndex * cellHeight.value

        if (colIndex >= heatmapStore.getAmountOfStickyAttributes) {
          x += stickyAttributesGap.value
        }
        if (rowIndex >= heatmapStore.getAmountOfStickyItems) {
          y += stickyItemsGap.value
        }
        ctx.fillStyle = getHeatmapColor(adjustedValue, heatmapMinValue, heatmapMaxValue)
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
  highlightOverlay.value.style.zIndex = '10000'

  tooltip.value.style.display = 'block'
  tooltip.value.style.zIndex = '10000'

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

  tooltip.value.style.top = `${e.clientY + scrollY - tooltip.value.offsetHeight - 20}px`

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

watch(
  () => heatmapStore.isCsvUploadOpen,
  () => {
    nextTick(() => {
      updateVisibleHeatmapHeight()
    })
    updateVisibleHeatmapHeight()
  },
)

onMounted(async () => {
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
  <main
    :style="{
      display: 'flex',
      flexDirection: 'column',
      gap: GAP_CSV_HEATMAP + 'px',
      marginTop: MARGIN_TOP + 'px',
      marginLeft: MARGIN_LEFT + 'px',
      marginRight: MARGIN_RIGHT + 'px',
      boxSizing: 'content-box',
      fontFamily: 'Roboto Condensed',
    }"
    class="box-content"
  >
    <div ref="tooltip" class="tooltip">
      <div class="flex-tooltip">
        <div style="font-weight: bold" class="rows-tooltip">
          <div>Value:</div>
          <div ref="tooltipValue"></div>
        </div>
        <div class="rows-tooltip">
          <div>Item:</div>
          <div ref="tooltipRow"></div>
        </div>
        <div class="rows-tooltip">
          <div>Attribute:</div>
          <div ref="tooltipCol"></div>
        </div>
      </div>
    </div>
    <div ref="highlightOverlay" class="highlight-overlay"></div>

    <div
      v-if="heatmapStore.isCsvUploadOpen"
      :style="{
        height: CSV_UPLOAD_EXPANDED_HEIGHT + 'px',
      }"
    >
      <CsvUpload />
    </div>

    <div>
      <div
        :style="{
          display: 'flex',
          height: heatmapStore.isCsvUploadOpen
            ? SETTINGS_HEIGHT + 'px'
            : CSV_UPLOAD_COLLAPSED_HEIGHT + 'px',
          alignItems: 'center',
          gap: '20px',
        }"
      >
        <HeatmapSettings />
        <div
          v-if="!heatmapStore.isCsvUploadOpen"
          :style="{ height: CSV_UPLOAD_COLLAPSED_HEIGHT + 'px', width: '100%' }"
        >
          <CsvUpload />
        </div>
      </div>

      <div :style="{ display: 'flex' }">
        <div
          :style="{
            width: dimReductionWidth + 'px',
            minHeight: visibleHeatmapHeight - 20 + 'px',
            backgroundColor: 'white',
            zIndex: 1000,
          }"
        >
          <div
            ref="dimRedCollections"
            :style="{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',

              backgroundColor: 'white',
            }"
          >
            <div
              :style="{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
              }"
            >
              <p style="height: 25px">{{ heatmapStore.getActiveDataTable?.dimReductionAlgo }}</p>
              <DimReductionVisual style="border: 1px solid black" :width="dimReductionWidth" />
            </div>
            <CollectionSelector />
          </div>
        </div>

        <div
          :style="{
            height: visibleHeatmapHeight + 'px',
            marginTop: GAP_SETTINGS_HEATMAP + 'px',
            overflow: 'auto',
            position: 'relative',
            display: heatmapStore.heatmap.itemNamesAndData.length !== 0 ? 'grid' : 'none',
            gridTemplateColumns: 'auto 1fr',
            width: '100%',
          }"
        >
          <div
            :style="{
              display: 'flex',
              flexDirection: 'column',
              position: 'sticky',
              left: '0px',
              zIndex: 1000,
              width: ROW_LABELS_WIDTH + SPACE_BETWEEN_ITEM_LABELS_AND_HEATMAP + 'px',
            }"
          >
            <div
              :style="{
                height: COL_LABELS_HEIGHT + BORDER_WIDTH + 'px',
                backgroundColor: 'white',
                zIndex: 1001,
                position: 'relative',
              }"
            ></div>
            <div
              :key="'row-label-' + dataChangingRef"
              :style="{
                height: heatmapHeight + 'px',
                backgroundColor: 'white',
                gap: GAP_HEIGHT + 'px',

                display: 'flex',
                justifySelf: 'flex-start',
                flexDirection: 'column',
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
                  :needs-sticky-items-margin="
                    index === heatmapStore.getAmountOfStickyItems &&
                    heatmapStore.isStickyItemsGapVisible
                  "
                />
              </div>
            </div>
          </div>

          <div
            :style="{
              width: heatmapContainerWidth + 'px',

              boxSizing: 'content-box',
              height: '100%',
            }"
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
                position: 'sticky',
                top: '0px',
                left: '0px',
                zIndex: 100,
                backgroundColor: 'white',
              }"
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
                      heatmapStore.getActiveDataTable?.stickyAttributes.includes(colName)
                        ? '-'
                        : '+'
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
    </div>
  </main>
</template>

<style scoped>
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

.edition-row-labels {
  display: flex;
  flex-direction: column;
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
