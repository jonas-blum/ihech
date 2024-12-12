<script setup lang="ts">
import { defineProps, computed, ref, watch } from 'vue'
import { useMouse, watchThrottled } from '@vueuse/core'
import { Icon } from '@iconify/vue'

import { ColorMap, Breakpoint } from '@/classes/ColorMap'
import { ColoringHeatmapEnum, mapColoringHeatmapEnum } from '@/helpers/helpers'
import { Row, ItemRow, AggregateRow } from '@/classes/Row'

import { useMainStore } from '@/stores/mainStore'

const mainStore = useMainStore()

const { x: mouseX, y: mouseY } = useMouse()

const contextMenuStyle = ref({
  top: '0px',
  left: '0px',
  display: 'none',
})

const row = computed(() => {
  return mainStore.selectedPixiBubble?.row
})

const isAggregateRow = computed(() => {
  return row.value instanceof AggregateRow
})

// watch for selectedPixiBubble to change
watch(
  () => mainStore.selectedPixiBubble,
  (newValue) => {
    console.log('selectedPixiBubble changed to:', newValue)

    contextMenuStyle.value = {
      top: `${mouseY.value + 10}px`,
      left: `${mouseX.value + 1}px`,
      display: newValue ? 'block' : 'none',
    }
  },
)

</script>
<template>
  <div
    class="w-36 p-1 rounded-sm absolute z-[99999999] text-sm"
    :style="contextMenuStyle"
    @click.stop="mainStore.closeMenus"
  >
    <ul v-if="!isAggregateRow" class="menu menu-xs w-full p-0 [&_li>*]:rounded-none">
      <li>
        <a @click="mainStore.itemTree?.toggleStickyRow(row)">{{ mainStore.itemTree?.isRowSticky(row) ? 'Unselect' : 'Select' }}</a>
      </li>
    </ul>
    <ul v-if="isAggregateRow" class="menu menu-xs w-full p-0 [&_li>*]:rounded-none">
      <li>
        <a @click="mainStore.itemTree?.toggleRowExpansion(row)">{{
          row?.isOpen ? 'Close' : 'Expand'
        }}</a>
      </li>
      <li>
        <a @click="mainStore.itemTree?.expandAllRows(row)">Expand Deep</a>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss"></style>
