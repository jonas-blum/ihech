<script setup lang="ts">
import { defineProps, ref, computed, watch, nextTick, onUpdated, onMounted } from 'vue'
import { type ItemNameAndData } from '@helpers/helpers'

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
  needsStickyItemsMargin: boolean
  editionIndex?: number
  editionCount?: number
}>()

const tooltip = ref<HTMLElement | null>(null)
const tooltipContent = ref('')
const tooltipX = ref(0)
const tooltipY = ref(0)

const isRowHighlighted = ref(false)

const rowTextElement = ref<HTMLElement | null>(null)

const buttonSize = computed(() => props.cellHeight - props.gapHeight + 'px')

const rightClickButton = (e: MouseEvent) => {
  e.preventDefault()
  toggleOpen()
}

const updateToolTipContent = (e: MouseEvent) => {
  if (!tooltip.value) {
    return
  }
  const collectionNamesOfItem = heatmapStore.getCollectionNamesOfItem(props.row)
  if (collectionNamesOfItem.length === 0) {
    hideTooltip()
    return
  }
  tooltipX.value = e.clientX + 10
  tooltipY.value = e.clientY + 10
  tooltipContent.value = collectionNamesOfItem.join('\n')
  showTooltip()
}

const hideTooltip = () => {
  nextTick(() => {
    if (!tooltip.value) {
      return
    }
    tooltip.value.style.display = 'none'
  })
}

const showTooltip = () => {
  if (!tooltip.value) {
    return
  }
  tooltip.value.style.display = 'block'
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

function doColoring() {
  const colorsOfItem = heatmapStore.getColorsOfItem(props.row)
  applyMultipleColors(colorsOfItem)
}

const marginTop = computed(() => {
  if (props.needsStickyItemsMargin && heatmapStore.isStickyItemsGapVisible) {
    return props.stickyItemsGapSize
  }
  return 0
})

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

onMounted(() => {
  doColoring()
  const collectionNamesOfItem = heatmapStore.getCollectionNamesOfItem(props.row)
  tooltipContent.value = collectionNamesOfItem.join('\n')
})

onUpdated(() => {
  doColoring()
  const collectionNamesOfItem = heatmapStore.getCollectionNamesOfItem(props.row)
  tooltipContent.value = collectionNamesOfItem.join('\n')
})
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
    <div class="tooltip" :data-tip="tooltipContent">
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
              heatmapStore?.getActiveDataTable?.stickyItemIndexes.includes(props.row.index ?? -1)
                ? '-'
                : '+'
            }}
          </button>

          <div
            ref="rowTextElement"
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
        :needs-sticky-items-margin="false"
      />
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
</style>
