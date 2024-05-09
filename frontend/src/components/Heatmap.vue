<script setup lang="ts">
import HeatmapSettings from './HeatmapSettings.vue'
import HeatmapRowLabel from './HeatmapRowLabel.vue'
import DimReductionVisual from './DimReductionVisual.vue'
import { useHeatmapStore, NON_ATTRIBUTE_COLUMNS, AbsRelEnum } from '@/stores/heatmapStore'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { getHeatmapColor } from '@/helpers/helpers'

const heatmapStore = useHeatmapStore()

const MIN_CELL_HEIGHT = 17
const GAP_HEIGHT = 2
const COL_LABELS_HEIGHT = 100
const DIM_REDUCTION_WIDTH = 250
const MIN_ROW_LABELS_WIDTH = 175

const STICKY_GAP = 10

const tooltip = ref<HTMLElement | null>(null)
const highlightOverlay = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)

function handleFileUpload(event: InputEvent) {
  if (!(event.target instanceof HTMLInputElement) || !event.target.files) return
  const file = event.target.files[0]
  if (file && file.type === 'text/csv') {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (!e.target || !e.target.result) return
      heatmapStore.uploadCsvFile(e.target.result as string)
    }
    reader.readAsText(file)
  } else {
    alert('Please upload a CSV file.')
  }
}

const stickyColumnsGap = computed(() => {
  let stickyColumnsGapTemp = STICKY_GAP
  if (heatmapStore.clusterRowsBasedOnStickyColumns) {
    stickyColumnsGapTemp *= 2
  }
  return heatmapStore.isStickyColumnsGapVisible ? stickyColumnsGapTemp : 0
})

const stickyRowsGap = computed(() => {
  let stickyRowsGapTemp = STICKY_GAP
  if (heatmapStore.isSortColumnsBasedOnStickyRows) {
    stickyRowsGapTemp *= 2
  }
  return heatmapStore.isStickyRowsGapVisible ? stickyRowsGapTemp : 0
})

const heatmapWidth = ref<number>(0)
const heatmapHeight = ref<number>(0)

const rowLabelsWidth = ref<number>(0)

const cellWidth = ref<number>(0)
const cellHeight = ref<number>(0)

const colNames = ref<string[]>([])

function updateRowLabelsWidth() {
  rowLabelsWidth.value = window.innerWidth - heatmapWidth.value - DIM_REDUCTION_WIDTH
}

function updateHeatmapWidth() {
  let minWidth = Math.round(window.innerWidth - MIN_ROW_LABELS_WIDTH - DIM_REDUCTION_WIDTH)
  console.log('Min width', minWidth)
  console.log('col names value', colNames.value.length)
  minWidth += stickyColumnsGap.value
  const remainderMin = minWidth % colNames.value.length
  minWidth -= remainderMin
  minWidth += stickyColumnsGap.value
  heatmapWidth.value = minWidth
}

function updateHeatmapHeight() {
  heatmapHeight.value = MIN_CELL_HEIGHT * heatmapStore.getNumberOfVisibleRows + stickyRowsGap.value
}

function updateCellWidth() {
  cellWidth.value = Math.round(
    (heatmapWidth.value - stickyColumnsGap.value) / colNames.value.length
  )
}

function updateCellHeight() {
  cellHeight.value = Math.round(
    (heatmapHeight.value - stickyRowsGap.value) / heatmapStore.getNumberOfVisibleRows
  )
}

function updateColNames() {
  colNames.value = heatmapStore.getVisibleHeatmap.dropSeries(NON_ATTRIBUTE_COLUMNS).getColumnNames()
}

function drawEverything() {
  if (!canvas.value) {
    console.error('Canvas not found')
    return
  }
  const ctx = canvas.value.getContext('2d')
  if (!ctx) {
    console.error('Canvas context not found')
    return
  }
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

  nextTick(() => {
    const time = performance.now()
    const rawHeatmapData = heatmapStore.getVisibleHeatmapOnlyAttributes.toRows()
    console.log('Time to get raw heatmap data', performance.now() - time)
    console.log('Drawing heatmap', rawHeatmapData.length, cellHeight.value, cellWidth.value)

    rawHeatmapData.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        let adjustedValue = value
        if (heatmapStore.getSelectedAbsRel === AbsRelEnum.REL) {
          const maxRowValue = Math.max(...row)
          adjustedValue = value / maxRowValue
        } else if (heatmapStore.getSelectedAbsRel === AbsRelEnum.LOG) {
          adjustedValue = Math.log(value + 1)
        }

        let x = colIndex * cellWidth.value
        let y = rowIndex * cellHeight.value

        if (colIndex >= heatmapStore.getStickyColumns.length) {
          x += stickyColumnsGap.value
        }
        if (rowIndex >= heatmapStore.getStickyRowsIndexes.length) {
          y += stickyRowsGap.value
        }
        const color = getHeatmapColor(
          adjustedValue,
          heatmapStore.getMinHeatmapValue,
          heatmapStore.getHeatmapColorMaxValue
        )
        ctx.fillStyle = color

        ctx.fillRect(x, y, cellWidth.value, cellHeight.value)
      })
    })
  })
}

function updateEntireHeatmap() {
  updateColNames()
  updateHeatmapWidth()
  updateHeatmapHeight()
  updateCellWidth()
  updateCellHeight()
  updateRowLabelsWidth()
  drawEverything()
}

watch(() => heatmapStore.isDataChanging, updateEntireHeatmap)

onMounted(async () => {
  const response = await fetch('/assets/data/abs_amount_different_attributes.csv')
  const csvData = await response.text()
  heatmapStore.uploadCsvFile(csvData)
})
</script>

<template>
  <div style="height: 50px">
    <h1 v-if="!heatmapStore.isLoading">IHECH</h1>
    <span v-else class="loading loading-spinner loading-lg"></span>
  </div>
  <div ref="tooltip" class="tooltip">
    <div class="flex-tooltip">
      <div class="rows-tooltip">
        <div>Value:</div>
        <div class="value bold"></div>
      </div>
      <div class="rows-tooltip">
        <div>Document:</div>
        <div class="row-name bold"></div>
      </div>
      <div class="rows-tooltip">
        <div>Tag:</div>
        <div class="col-name bold"></div>
      </div>
    </div>
  </div>
  <div ref="highlightOverlay" class="highlight-overlay"></div>
  <input type="file" @change="handleFileUpload" accept=".csv" />
  <HeatmapSettings></HeatmapSettings>
  <div class="heatmap-container">
    <div
      :style="{
        width: DIM_REDUCTION_WIDTH + 'px',
        height: DIM_REDUCTION_WIDTH + 'px',
        paddingTop: COL_LABELS_HEIGHT - 25 + 'px',
        position: 'sticky',
        top: 0
      }"
    >
      <div style="display: flex; flex-direction: column; align-items: center">
        <p>{{ heatmapStore.getDimReductionAlgo }}</p>
        <DimReductionVisual style="border: 1px solid black" :width="DIM_REDUCTION_WIDTH" />
      </div>
    </div>
    <div
      :key="'row-label-' + heatmapStore.isDataChanging"
      :style="{
        height: heatmapHeight + 'px',
        marginTop: COL_LABELS_HEIGHT + 'px',
        gap: GAP_HEIGHT + 'px'
      }"
      class="row-label-container"
    >
      <div
        class="edition-row-labels"
        v-for="(row, index) in heatmapStore.getHeatmap.row_names_and_data"
      >
        <HeatmapRowLabel
          class="box-content"
          :gap-height="GAP_HEIGHT"
          :cellHeight="cellHeight"
          :row="row"
          :depth="1"
          :edition-index="index"
          :row-labels-width="rowLabelsWidth"
          @toggle-open="toggleOpenRow"
          :edition-count="editionNames.length"
          :sticky-items-gap-size="stickyItemsGap"
          :y-start-heatmap="canvas ? canvas.getBoundingClientRect().top : 0"
        />
      </div>
    </div>
    <div style="justify-self: flex-end">
      <div
        :key="'col-label-' + heatmapStore.getDataChanging"
        :style="{
          width: heatmapWidth + 'px',
          marginLeft: cellWidth / 2,
          height: COL_LABELS_HEIGHT - 4 + 'px',
          marginBottom: '4px'
        }"
        class="col-label-container"
      >
        <button
          @click="heatmapStore.toggleStickyAttribute(colName)"
          v-for="(colName, index) in heatmapStore.getHeatmap.col_names"
          :id="'col-label-' + index"
          class="col-label"
          :style="{
            width: cellWidth + 'px',
            height: 'auto',
            position: 'relative',
            color: 'black',
            textAlign: 'center',
            cursor: 'pointer',
            marginLeft:
              index === heatmapStore.getStickyAttributes.length ? stickyAttributesGap + 'px' : 0
          }"
        >
          <div
            :style="{
              position: 'absolute',
              width: '100%',
              height: heatmapStore.getColDissimilarities[index] * 100 + '%',
              backgroundColor: '#ccc',
              top: '10px',
              left: 0,
              zIndex: 0
            }"
          ></div>
          <div
            :style="{
              position: 'absolute',
              top: '0',
              width: '100%',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center'
            }"
          >
            <div :style="{ width: '100%', display: 'flex', alignItems: 'center' }">
              {{ heatmapStore.getStickyAttributes.includes(colName) ? '-' : '+' }}
            </div>
          </div>
          <div
            :style="{
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              top: '10px',
              width: '100%',
              zIndex: 1
            }"
          >
            <div>{{ colName }}</div>
          </div>
        </button>
      </div>
      <canvas
        :width="heatmapWidth"
        :height="heatmapHeight"
        ref="canvas"
        class="heatmap-canvas"
      ></canvas>
    </div>
  </div>
</template>

<style scoped>
.tooltip {
  position: absolute;
  display: none;
  padding: 4px;
  background-color: white;
  color: black;
  border-radius: 4px;
  font-size: 18px;
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

.heatmap-container {
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  margin-bottom: 500px;
}
</style>
