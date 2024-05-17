<script setup lang="ts">
import { defineProps, defineEmits, ref, computed, onMounted, watch, nextTick, onUpdated } from 'vue'
import { getDistinctEditionsOfRow, type ItemNameAndData } from '@helpers/helpers'

import { useHeatmapStore } from '@stores/heatmapStore'

const props = defineProps<{
  row: ItemNameAndData
  cellHeight: number
  gapHeight: number
  depth: number
  borderWidth: number
  rowLabelsWidth: number
  stickyItemsGapSize: number
  yStartHeatmap: number
  editionIndex?: number
  editionCount?: number
}>()

const tooltipVisible = ref(false)
const tooltipContent = ref('')
const tooltipX = ref(0)
const tooltipY = ref(0)

const isRowHighlighted = ref(false)

const marginTop = ref(0)

const rowTextElement = ref<HTMLElement | null>(null)

const buttonSize = computed(() => props.cellHeight - props.gapHeight + 'px')

const rightClickButton = (e: MouseEvent) => {
  e.preventDefault()
  toggleOpen()
}

const showTooltip = (e: MouseEvent) => {
  if (!props.row.children) return
  tooltipX.value = e.clientX + 10
  tooltipY.value = e.clientY + 10
  //   tooltipContent.value = computeTooltipContent(props.row)
  tooltipVisible.value = true
}

const hideTooltip = () => {
  tooltipVisible.value = false
}

function computeTooltipContent(row: ItemNameAndData): string {
  const editions = getDistinctEditionsOfRow(row)
  return Array.from(editions).join('\n')
}

function applyMultipleColors(colors: string[]) {
  if (!rowTextElement.value) return
  const text = rowTextElement.value.innerText
  const textLength = text.length
  const partLength = Math.ceil(textLength / colors.length)
  let coloredText = ''

  for (let i = 0; i < colors.length; i++) {
    const start = i * partLength
    let end = start + partLength
    if (end > textLength) end = textLength

    const textPart = text.slice(start, end)
    coloredText += `<span  style="color: ${colors[i]}; max-width:${Math.max(
      15,
      props.rowLabelsWidth - props.depth * 30,
    )}px">${textPart}</span>`
  }
  if (colors.length > 1) {
    coloredText += `<span style="display: flex;gap: 2px; margin-left:5px">`
    for (let i = 0; i < colors.length; i++) {
      coloredText += `<span style="background-color: ${colors[i]}; width: ${
        props.cellHeight / 2
      }px; height: ${props.cellHeight / 2}px; border-radius: 50%;"></span>`
    }
    coloredText += `</span>`
  }

  rowTextElement.value.innerHTML = coloredText
}

// function doColoring() {
//   const editionSet = getDistinctEditionsOfRow(props.row)
//   const editionList = Array.from(editionSet)
//   const editionColorList = editionList.map((edition) => editionStore.editionColor(edition))
//   applyMultipleColors(editionColorList)
// }

function updateMarginTop() {
  let y = rowTextElement.value?.getBoundingClientRect().bottom
  if (!y) {
    if (marginTop.value !== 0) {
      marginTop.value = 0
    }
    return
  }
  y -= props.yStartHeatmap + props.borderWidth
  if (heatmapStore.isStickyItemsGapVisible) {
    const startY = heatmapStore.getAmountOfStickyItems * props.cellHeight
    const endY = startY + props.stickyItemsGapSize
    if (y > endY && y < endY + props.cellHeight) {
      if (marginTop.value !== props.stickyItemsGapSize) {
        marginTop.value = props.stickyItemsGapSize
      }
      return
    }
  }
  if (marginTop.value !== 0) {
    marginTop.value = 0
  }
}

function updateIsRowHighlighted() {
  if (isRowHighlighted.value !== (heatmapStore.getHighlightedRow === props.row)) {
    isRowHighlighted.value = heatmapStore.getHighlightedRow === props.row
  }
}

function toggleOpen() {
  heatmapStore.toggleOpenRow(props.row)
}

const heatmapStore = useHeatmapStore()

watch(
  () => heatmapStore.getHighlightedRow,
  () => {
    updateIsRowHighlighted()
  },
)

watch(
  () => heatmapStore.getDataChanging,
  () => {
    nextTick(() => {
      updateMarginTop()
    })
  },
)
</script>

<template>
  <div
    class="children-container"
    :style="{
      gap: props.gapHeight + 'px',
      marginLeft: buttonSize,
      marginTop: marginTop + 'px',
    }"
  >
    <div class="row-div">
      <button
        :style="{
          height: buttonSize,
          width: buttonSize,
        }"
        v-if="props.row.children"
        @click="toggleOpen"
        @contextmenu="rightClickButton"
        class="expand-button"
      >
        <div class="symbol-container">
          <img
            :style="{ transform: props.row.isOpen ? 'rotate(90deg)' : '' }"
            src="@assets/chevron-right.svg"
          />
        </div>
      </button>

      <div
        :style="{
          display: 'flex',
          alignItems: 'center',
          height: props.cellHeight - props.gapHeight + 'px',
          maxWidth: '110px',
        }"
      >
        <button
          :style="{
            width: buttonSize,
          }"
          class="sticky-button"
          @click="heatmapStore.toggleStickyItem(props.row)"
          v-if="!props.row.children"
        >
          {{
            heatmapStore?.getActiveDataTable?.stickyItemIndexes.includes(props.row.index)
              ? '-'
              : '+'
          }}
        </button>

        <div
          ref="rowTextElement"
          @mouseenter="showTooltip"
          @mouseleave="hideTooltip"
          :style="{
            fontWeight: isRowHighlighted ? 900 : 'normal',
            height: props.cellHeight - props.gapHeight + 'px',
            fontSize: props.cellHeight * 0.9 - props.gapHeight + 'px',
          }"
          class="text-div"
        >
          {{ props.row.itemName }}
        </div>
      </div>
    </div>

    <div
      v-if="props.row.isOpen && props.row.children && props.row.children.length > 0"
      class="children-container"
      :style="{ gap: props.gapHeight + 'px' }"
    >
      <ExpRowComponent
        v-for="(child, index) in props.row.children"
        :key="index"
        :row="child"
        :cell-height="props.cellHeight"
        :gap-height="props.gapHeight"
        :depth="(props.depth || 0) + 1"
        :borderWidth="props.borderWidth"
        :row-labels-width="props.rowLabelsWidth"
        :sticky-items-gap-size="props.stickyItemsGapSize"
        :y-start-heatmap="props.yStartHeatmap"
      />
    </div>

    <div
      v-if="tooltipVisible"
      class="tooltip"
      :style="{ top: tooltipY + 'px', left: tooltipX + 'px' }"
    >
      {{ tooltipContent }}
    </div>
  </div>
</template>

<style scoped>
.children-container {
  display: flex;
  flex-direction: column;
}

.row-div {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 3px;
}

.sticky-button {
  cursor: pointer;
  margin-right: 5px;
  border-radius: 50%;
  background-color: white;
  transition:
    background-color 0.2s,
    transform 0.2s;
}

.sticky-button:hover {
  background-color: grey;
  outline: none;
}

.expand-button {
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

.expand-button:hover {
  background-color: grey;
  outline: none;
}

.symbol-container {
  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 1.25em;
  font-weight: 600;
  text-align: center;
}

.text-div {
  display: flex;
  align-items: center;
  max-width: 110px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tooltip {
  position: fixed;
  padding: 10px;
  background-color: black;
  color: white;
  border-radius: 5px;
  z-index: 100;
  white-space: pre-line;
}
</style>
