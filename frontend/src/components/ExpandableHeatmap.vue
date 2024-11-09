<script setup lang="ts">
import { nextTick, onMounted, watch } from 'vue'
import { ref } from 'vue'
import ExpRowComponent from './ExpRowComponent.vue'
import InformationIcon from '@assets/information-icon.svg'

import {
  ColoringHeatmapEnum,
  type ItemNameAndData,
  CSV_UPLOAD_COLLAPSED_HEIGHT,
  CSV_UPLOAD_EXPANDED_HEIGHT,
} from '@helpers/helpers'
import { useHeatmapStore } from '@stores/heatmapStore'

import DimReductionVisual from './DimReductionVisual.vue'
import CollectionSelector from './CollectionSelector.vue'
import HelpModal from './HelpModal.vue'

import HeatmapSettings from './HeatmapSettings.vue'
import CsvUpload from './CsvUpload.vue'

const heatmapStore = useHeatmapStore()

const COL_LABELS_HEIGHT = 150
const ROW_LABELS_WIDTH = 200
const SPACE_BETWEEN_COL_LABELS_AND_HEATMAP = 0
const SPACE_BETWEEN_ITEM_LABELS_AND_HEATMAP = 10

const MIN_CELL_HEIGHT = 17
const GAP_HEIGHT = 2

const HEATMAP_BORDER_BOTTOM_RIGHT = 20

const MIN_DIM_REDUCTION_WIDTH = 250

const MIN_COL_LABELS_WIDTH = 15
const MAX_COL_LABELS_WIDTH = MIN_COL_LABELS_WIDTH * 2
const BORDER_WIDTH = 4

const MARGIN_RIGHT = 20
const MARGIN_LEFT = 20
const MARGIN_TOP = 20
const MARGIN_BOTTOM = 20
const GAP_CSV_HEATMAP = 40
const GAP_SETTINGS_HEATMAP = 30
const SETTINGS_HEIGHT = 60

const STICKY_GAP = 4
const STICKY_GAP_MULTIPLIER = 1

const tooltip = ref<HTMLElement | null>(null)
const tooltipValue = ref<HTMLElement | null>(null)
const tooltipRow = ref<HTMLElement | null>(null)
const tooltipCol = ref<HTMLElement | null>(null)
const colLabelContainer = ref<HTMLElement | null>(null)
const highlightOverlay = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const dimRedCollections = ref<HTMLElement | null>(null)

const visibleRows = ref<ItemNameAndData[]>([])

const dimReductionWidth = ref<number>(MIN_DIM_REDUCTION_WIDTH)

const heatmapWidth = ref<number>(0)
const entireVisibleHeatmapWidth = ref<number>(0)
const cellWidth = ref<number>(0)
const heatmapHeight = ref<number>(0)
const entireVisibleHeatmapHeight = ref<number>(0)
const cellHeight = ref<number>(0)

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
    stickyAttributesGapTemp *= STICKY_GAP_MULTIPLIER
  }
  stickyAttributesGap.value = heatmapStore.isStickyAttributesGapVisible
    ? stickyAttributesGapTemp
    : 0
}

function updateStickyItemsGap() {
  let stickyItemsGapTemp = STICKY_GAP
  if (heatmapStore.getActiveDataTable?.sortAttributesBasedOnStickyItems) {
    stickyItemsGapTemp *= STICKY_GAP_MULTIPLIER
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

function updateEntireVisibleHeatmapWidth() {
  const scrollableWidth = window.innerWidth - MIN_DIM_REDUCTION_WIDTH - MARGIN_RIGHT - MARGIN_LEFT

  const nonScrollableWidth =
    heatmapWidth.value +
    2 * BORDER_WIDTH +
    STICKY_GAP +
    ROW_LABELS_WIDTH +
    SPACE_BETWEEN_ITEM_LABELS_AND_HEATMAP +
    2 * HEATMAP_BORDER_BOTTOM_RIGHT

  entireVisibleHeatmapWidth.value = Math.min(scrollableWidth, nonScrollableWidth)
}

function updateEntireVisibleHeatmapHeight() {
  const scrollableHeight =
    window.innerHeight - MARGIN_TOP - MARGIN_BOTTOM - CSV_UPLOAD_COLLAPSED_HEIGHT - GAP_CSV_HEATMAP

  let nonScrollableHeight =
    heatmapHeight.value +
    2 * BORDER_WIDTH +
    stickyItemsGap.value +
    COL_LABELS_HEIGHT +
    SPACE_BETWEEN_COL_LABELS_AND_HEATMAP +
    2 * HEATMAP_BORDER_BOTTOM_RIGHT

  entireVisibleHeatmapHeight.value = Math.min(scrollableHeight, nonScrollableHeight)
}

function updateHeatmapHeight() {
  heatmapHeight.value = MIN_CELL_HEIGHT * visibleRows.value.length + stickyItemsGap.value
  cellHeight.value = MIN_CELL_HEIGHT
}

function updateEditionNames() {
  editionNames.value = heatmapStore.getHeatmap.itemNamesAndData.map((row) => row.itemName)
}

function updateDimReductionWidth() {
  const usingExactlyRemainingSpace =
    window.innerWidth - entireVisibleHeatmapWidth.value - MARGIN_RIGHT - MARGIN_LEFT
  const maximumWidth = window.innerHeight / 1.5

  dimReductionWidth.value = Math.min(usingExactlyRemainingSpace, maximumWidth)
}

function updateHeatmap() {
  updateVisibleRows()
  updateStickyAttributesGap()
  updateStickyItemsGap()

  updateHeatmapWidth()
  updateEntireVisibleHeatmapWidth()

  updateHeatmapHeight()

  updateEditionNames()

  updateDimReductionWidth()

  updateEntireVisibleHeatmapHeight()

  drawEverything()
}

function getHeatmapColorMaxValue() {
  switch (heatmapStore?.getActiveDataTable?.coloringHeatmap) {
    case ColoringHeatmapEnum.ITEM_RELATIVE:
      return 1
    case ColoringHeatmapEnum.ATTRIBUTE_RELATIVE:
      return 1
    case ColoringHeatmapEnum.LOGARITHMIC:
      return Math.log(heatmapStore.getHeatmapMaxValue + heatmapStore.getLogShiftValue)
    case ColoringHeatmapEnum.ABSOLUTE:
      return heatmapStore.getHeatmapMaxValue
    default:
      return heatmapStore.getHeatmapMaxValue
  }
}

function getHeatmapColorMinValue() {
  switch (heatmapStore?.getActiveDataTable?.coloringHeatmap) {
    case ColoringHeatmapEnum.ITEM_RELATIVE:
      return 0
    case ColoringHeatmapEnum.ATTRIBUTE_RELATIVE:
      return 0
    case ColoringHeatmapEnum.LOGARITHMIC:
      return Math.log(heatmapStore.getHeatmapMinValue + heatmapStore.getLogShiftValue)
    case ColoringHeatmapEnum.ABSOLUTE:
      return heatmapStore.getHeatmapMinValue
    default:
      return heatmapStore.getHeatmapMinValue
  }
}

function drawEverything() {
  if (!canvas.value) {
    return
  }
  const ctx = canvas.value.getContext('2d')
  if (!ctx) {
    return
  }

  const width = heatmapWidth.value
  const height = heatmapHeight.value

  nextTick(() => {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, width, height)

    const heatmapMaxValue = getHeatmapColorMaxValue()
    const heatmapMinValue = getHeatmapColorMinValue()

    for (let itemIdx = 0; itemIdx < visibleRows.value.length; itemIdx++) {
      const item = visibleRows.value[itemIdx]
      let maxRowValue = 1
      if (heatmapStore?.getActiveDataTable?.coloringHeatmap === ColoringHeatmapEnum.ITEM_RELATIVE) {
        maxRowValue = Math.max(...item.data)
      }

      for (let attrIdx = 0; attrIdx < item.data.length; attrIdx++) {
        const initialAttrIdx = heatmapStore.getInitialAttrIdx(attrIdx)
        const initialValue = item.data[initialAttrIdx]

        let adjustedValue = initialValue
        if (
          heatmapStore?.getActiveDataTable?.coloringHeatmap === ColoringHeatmapEnum.ITEM_RELATIVE
        ) {
          adjustedValue = initialValue / maxRowValue
        } else if (
          heatmapStore?.getActiveDataTable?.coloringHeatmap ===
          ColoringHeatmapEnum.ATTRIBUTE_RELATIVE
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

        let x = attrIdx * cellWidth.value
        let y = itemIdx * cellHeight.value

        if (attrIdx >= heatmapStore.getAmountOfStickyAttributes) {
          x += stickyAttributesGap.value
        }
        if (itemIdx >= heatmapStore.getAmountOfStickyItems) {
          y += stickyItemsGap.value
        }
        ctx.fillStyle = 'red'
        ctx.fillRect(x, y, cellWidth.value, cellHeight.value)
      }
    }
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
    // cursor is in gap between sticky attributes and the other attributes
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
  if (
    colIdx < 0 ||
    colIdx >= heatmapStore.getHeatmap.attributeNames.length ||
    rowIdx < 0 ||
    rowIdx >= visibleRows.value.length
  ) {
    return
  }

  const initialColIdx = heatmapStore.getInitialAttrIdx(colIdx)

  const selectedRow = visibleRows.value[rowIdx]
  if (heatmapStore.getHighlightedRow !== selectedRow) {
    heatmapStore.setHighlightedRow(selectedRow)
  }

  let dataValue = selectedRow.data[initialColIdx]

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
  highlightOverlay.value.style.zIndex = '1000000'

  tooltip.value.style.display = 'block'
  tooltip.value.style.zIndex = '1000000'

  tooltipValue.value.textContent = dataValue.toFixed(3).toString()
  tooltipRow.value.textContent = selectedRow.itemName
  tooltipCol.value.textContent = heatmapStore.getHeatmap.attributeNames[initialColIdx]

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

function getMiddleColorScaleValue() {
  if (heatmapStore.isColorScaleNotShown) {
    return 0
  }
  if (heatmapStore.activeDataTable?.coloringHeatmap === ColoringHeatmapEnum.LOGARITHMIC) {
    return (
      Math.sqrt(
        (heatmapStore.getHeatmapMinValue + heatmapStore.getLogShiftValue) *
          (heatmapStore.getHeatmapMaxValue + heatmapStore.getLogShiftValue),
      ) - heatmapStore.getLogShiftValue
    )
  }
  return (heatmapStore.getHeatmapMinValue + heatmapStore.getHeatmapMaxValue) / 2
}

watch(
  () => heatmapStore.getDataChanging,
  () => {
    updateHeatmap()
  },
)

watch(
  () => heatmapStore.isCsvUploadOpen,
  () => {
    nextTick(() => {
      updateEntireVisibleHeatmapHeight()
    })
    updateEntireVisibleHeatmapHeight()
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
      marginBottom: MARGIN_BOTTOM + 'px',
      marginLeft: MARGIN_LEFT + 'px',
      marginRight: MARGIN_RIGHT + 'px',
      fontFamily: 'Roboto Condensed',
      minHeight: `calc(100vh - ${MARGIN_TOP + MARGIN_BOTTOM}px)`,
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
          <div :style="{ display: 'flex', flexWrap: 'wrap' }" ref="tooltipCol"></div>
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
          justifyContent: 'space-between',
          gap: '20px',
          marginBottom: GAP_SETTINGS_HEATMAP + 'px',
        }"
      >
        <HeatmapSettings />

        <div :style="{ display: 'flex', gap: '20px', alignItems: 'center' }">
          <div
            v-if="!heatmapStore.isCsvUploadOpen"
            :style="{ height: CSV_UPLOAD_COLLAPSED_HEIGHT + 'px' }"
          >
            <CsvUpload />
          </div>
          <HelpModal />
        </div>
      </div>

      <div :style="{ display: 'flex' }">
        <div
          :style="{
            width: dimReductionWidth + 'px',
            backgroundColor: 'white',
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
              <div :style="{ display: 'flex', gap: '5px', alignItems: 'center' }">
                <strong style="font-size: 20px">{{
                  heatmapStore.getActiveDataTable?.dimReductionAlgo
                }}</strong>
                <div class="self-tooltip">
                  <span class="tooltiptext-right"
                    ><div>
                      This is the dimensionality reduction visual. It is a mirror of the visible
                      heatmap. The points with a black border represent a group of items and points
                      without a border are individual items.
                    </div>
                    <div>
                      When points are spatially close together it is an indication, that they are
                      similar based on the attributes.
                    </div>
                    <div>Left click on a Bubble/Group in the visual to expand it</div>
                    <div>Right click on a Bubble/Group in the visual to collapse it</div>
                    <div>
                      You can change the algorithm used for this visual in the "Dim Reduction"
                      Settings
                    </div>
                  </span>
                  <InformationIcon :style="{ height: '15px', width: '15px' }" />
                </div>
              </div>
              <DimReductionVisual style="border: 1px solid black" :width="dimReductionWidth" />
            </div>
            <CollectionSelector />
          </div>
        </div>

        <div
          :style="{
            overflow: 'auto',
            position: 'relative',
            display: heatmapStore.heatmap.itemNamesAndData.length !== 0 ? 'grid' : 'none',
            gridTemplateColumns:
              ROW_LABELS_WIDTH + SPACE_BETWEEN_ITEM_LABELS_AND_HEATMAP + 'px auto',
            gridTemplateRows: COL_LABELS_HEIGHT + SPACE_BETWEEN_COL_LABELS_AND_HEATMAP + 'px auto',
            width: entireVisibleHeatmapWidth + 'px',
            height: entireVisibleHeatmapHeight + 'px',
            paddingBottom: HEATMAP_BORDER_BOTTOM_RIGHT + 'px',
            paddingRight: HEATMAP_BORDER_BOTTOM_RIGHT + 'px',
          }"
        >
          <div
            :style="{
              top: '0px',
              left: '0px',
              position: 'sticky',
              gridRow: 1,
              gridColumn: 1,
              backgroundColor: 'white',
              zIndex: 10000,

              height: COL_LABELS_HEIGHT + SPACE_BETWEEN_COL_LABELS_AND_HEATMAP + 'px',
              width: ROW_LABELS_WIDTH + SPACE_BETWEEN_ITEM_LABELS_AND_HEATMAP + 'px',

              display: 'flex',
            }"
            class="grid-corner"
          >
            <div
              v-if="!heatmapStore.isColorScaleNotShown"
              id="color-scale-container"
              :style="{ marginBottom: cellWidth + 'px' }"
            >
              <div class="color-scale-labels">
                <span class="min-label">{{
                  parseFloat(heatmapStore.getHeatmapMinValue.toFixed(3))
                }}</span>
                <span class="middle-label">{{
                  parseFloat(getMiddleColorScaleValue().toFixed(3))
                }}</span>
                <span class="max-label">{{
                  parseFloat(heatmapStore.getHeatmapMaxValue.toFixed(3))
                }}</span>
              </div>
              <div
                :style="{
                  background: 'linear-gradient(to right, ' + 'red' + ', ' + 'red' + ')',
                }"
                class="color-scale"
              >
                <div class="middle-marker"></div>
              </div>
            </div>

            <!-- <div
              :style="{
                position: 'absolute',
                top: COL_LABELS_HEIGHT / 4 + 'px',
                left: ROW_LABELS_WIDTH - 20 + 'px',
                zIndex: 20000,
              }"
              class="self-tooltip"
            >
              <span class="tooltiptext-right"
                ><div>
                  Here are the attributes of the heatmap. You can click on the + icon to make an
                  attribute of interest "sticky".
                </div>
                <div>
                  Once there are sticky attributes, the grouping behavior of the items can be
                  changed to be based solely on the sticky attributes. This setting can be found in
                  "Items Grouping".
                </div>
                <div>
                  By default, the attributes are sorted by how much they deviate across all items.
                  The sorting behavior of the attributes can be changed in the setting "Attributes".
                </div>
                <div>
                  The grey bars behind the attributes indicate how much the attribute deviates
                  across all items (or across all sticky items when "Sort based on Sticky Items" is
                  selected)
                </div>
              </span>
              <InformationIcon :style="{ height: '15px', width: '15px' }" />
            </div>

            <div
              :style="{
                position: 'absolute',
                top: COL_LABELS_HEIGHT - 20 + 'px',
                left: 20 + 'px',
                zIndex: 20000,
              }"
              class="self-tooltip"
            >
              <span class="tooltiptext-right"
                ><div>
                  Here are the items of the heatmap. You can click on the + icon to make an item of
                  interest "sticky".
                </div>
                <div>
                  Once there are sticky items, the sorting behavior of the attributes can be changed
                  to be based solely on the sticky items. This setting can be found in "Attributes".
                </div>

                <div>
                  The grouping of the items, and if they should be first grouped by collections, can
                  be controlled through the setting "Items Grouping".
                </div>
              </span>
              <InformationIcon :style="{ height: '15px', width: '15px' }" />
            </div> -->
          </div>
          <div
            class="grid-row-labels"
            :key="'row-label-' + heatmapStore.getDataChanging"
            :style="{
              gridRow: 2,
              gridColumn: 1,
              position: 'sticky',
              top: '0px',
              left: '0px',

              display: 'flex',
              flexDirection: 'column',
              gap: GAP_HEIGHT + 'px',

              height: heatmapHeight + 2 * BORDER_WIDTH + 1 + 'px',
              width: ROW_LABELS_WIDTH + SPACE_BETWEEN_ITEM_LABELS_AND_HEATMAP + 'px',

              paddingTop: BORDER_WIDTH + 'px',
              paddingBottom: BORDER_WIDTH + 'px',
              paddingRight: SPACE_BETWEEN_ITEM_LABELS_AND_HEATMAP + 'px',

              backgroundColor: 'white',
              zIndex: 5000,
            }"
          >
            <div
              :id="'row-label-' + index"
              :style="{
                display: 'flex',
                flexDirection: 'column',
                zIndex: 99,
              }"
              :key="index"
              v-for="(row, index) in heatmapStore.getHeatmap.itemNamesAndData"
            >
              <ExpRowComponent
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

          <div
            ref="colLabelContainer"
            class="grid-col-labels"
            :key="'col-label-' + heatmapStore.getDataChanging"
            :style="{
              gridRow: 1,
              gridColumn: 2,
              position: 'sticky',
              top: '0px',
              left: '0px',
              zIndex: 5000,

              paddingLeft: BORDER_WIDTH + 'px',
              paddingRight: BORDER_WIDTH + 'px',

              width: heatmapWidth + 2 * BORDER_WIDTH + 'px',
              height: COL_LABELS_HEIGHT + SPACE_BETWEEN_COL_LABELS_AND_HEATMAP + 'px',
              paddingBottom: SPACE_BETWEEN_COL_LABELS_AND_HEATMAP + 'px',

              display: 'flex',
              flexDirection: 'row',
              backgroundColor: 'white',
            }"
          >
            <div
              :key="heatmapStore.getInitialAttrIdx(newIdx)"
              v-for="(_, newIdx) in heatmapStore.getHeatmap.attributeNames.length"
              class="col-label"
              :style="{
                width: cellWidth + 'px',
                height: 'auto',
                position: 'relative',
                color: 'black',
                textAlign: 'center',
                cursor: 'pointer',
                marginLeft:
                  newIdx === heatmapStore.getActiveDataTable?.stickyAttributes.length
                    ? stickyAttributesGap + 'px'
                    : 0,
                display: 'flex',
                alignItems: 'center',
                writingMode: 'vertical-lr',
                textOrientation: 'mixed',
                transform: 'rotate(180deg)',
                fontSize: '13px',
                padding: '0px',
              }"
            >
              <div
                :style="{
                  position: 'absolute',
                  width: '100%',
                  height: heatmapStore.getAttrDissFromNewIdx(newIdx) * 100 + '%',
                  backgroundColor: '#ccc',
                  top: cellWidth + 'px',
                  left: 0,
                  zIndex: 0,
                }"
              ></div>

              <div
                :style="{
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  top: cellWidth + 'px',
                  width: '100%',
                  zIndex: 1,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }"
              >
                {{ heatmapStore.getAttrFromNewIdx(newIdx) }}
              </div>

              <button
                :style="{
                  position: 'absolute',
                  top: '0px',
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  width: cellWidth + 'px',
                  height: cellWidth + 'px',
                  fontSize: (4 / 5) * cellWidth + 'px',
                }"
                @click="heatmapStore.toggleStickyAttribute(heatmapStore.getAttrFromNewIdx(newIdx))"
                class="sticky-col-button"
              >
                {{
                  heatmapStore.getActiveDataTable?.stickyAttributes.includes(
                    heatmapStore.getAttrFromNewIdx(newIdx),
                  )
                    ? '-'
                    : '+'
                }}
              </button>
            </div>
          </div>

          <canvas
            :style="{
              gridRow: 2,
              gridColumn: 2,
              height: heatmapHeight + 2 * BORDER_WIDTH + 'px',
              width: heatmapWidth + 2 * BORDER_WIDTH + 'px',
              border: BORDER_WIDTH + 'px solid black',
              zIndex: 100,
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
.self-tooltip {
  position: relative;
  display: inline-block;
}

.self-tooltip .tooltiptext-right {
  display: none;
  width: 500px;
  background-color: darkgray;
  color: black;
  padding: 8px;
  border-radius: 6px;
  top: 0%;
  left: 105%;
  text-wrap: pretty;
  hyphens: auto;
  font-size: 16px;

  position: absolute;
  z-index: 10000000;

  flex-direction: column;
  gap: 8px;
}

.self-tooltip:hover .tooltiptext-right {
  display: flex;
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
  max-width: 35vw;
}

.rows-tooltip {
  display: flex;
  flex-direction: row;
  gap: 5px;
}

.bold {
  font-weight: bold;
}

.input-container {
  display: grid;
  gap: 10px;
  grid-template-columns: auto auto;
  grid-template-rows: auto auto;
  margin-bottom: 20px;
}

.sticky-col-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 50%;
  background-color: white;
  transition:
    background-color 0.2s,
    transform 0.2s;
}

.sticky-col-button:hover {
  background-color: grey;
  outline: none;
}

#color-scale-container {
  width: 100%;
  margin-left: 15px;
  margin-right: 15px;
  margin-top: auto;

  position: relative;
  padding-left: 1px;
  padding-right: 1px;
}

.color-scale {
  width: 100%;
  height: 20px;
  background: linear-gradient(to right, #f00, #ff0, #0f0);
  margin-top: 10px;
}

.color-scale:before,
.color-scale:after,
.color-scale .middle-marker {
  content: '';
  position: absolute;
  top: 19px;
  width: 4px;
  height: 15px;
  background-color: #000;
}

.color-scale:before {
  left: 1px;
}

.color-scale:after {
  right: 1px;
}

.color-scale .middle-marker {
  left: 50%;
}

.color-scale-labels {
  width: 100%;
  display: flex;
  justify-content: space-between;

  margin-bottom: 2px;
}

.color-scale-labels span {
  position: relative;
  font-size: 15px;
  font-weight: bold;
  width: 60px;
  text-align: center;
}

.color-scale-labels span:first-child {
  text-align: start;
}

.color-scale-labels span:last-child {
  text-align: end;
}
</style>
