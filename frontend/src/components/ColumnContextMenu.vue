<script setup lang="ts">
import { defineProps, computed, ref, watch } from 'vue'
import { useMouse, watchThrottled } from '@vueuse/core'
import { Icon } from '@iconify/vue'

import { ColorMap, Breakpoint } from '@/classes/ColorMap'
import { ColoringHeatmapEnum, mapColoringHeatmapEnum } from '@/helpers/helpers'
import { Row, ItemRow } from '@/classes/Row'
import { Column, AttributeColumn, AggregateColumn } from '@/classes/Column'

import { useMainStore } from '@/stores/mainStore'

const mainStore = useMainStore()

const { x: mouseX, y: mouseY } = useMouse()

const contextMenuStyle = ref({
  top: '0px',
  left: '0px',
  display: 'none',
})

const column = computed(() => {
  return mainStore.selectedPixiColumnLabel?.column
})

const isAggregateColumn = computed(() => {
  return column.value instanceof AggregateColumn
})

// watch for selectedPixiColumnLabel to change
watch(
  () => mainStore.selectedPixiColumnLabel,
  (newValue) => {
    console.log('selectedPixiColumnLabel changed to:', newValue)

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
    @click.stop
  >
    <ul v-if="!isAggregateColumn" class="menu menu-xs w-full p-0 [&_li>*]:rounded-none">
      <li>
        <a @click="column?.toggleSelected">{{ column?.selected ? 'Unselect' : 'Select' }}</a>
      </li>
      <!-- TODO: there are no sticky attributes yet.. -->
      <!-- <li v-if="!isAggregateColumn"> -->
      <!-- <a> -->
      <!-- <Icon
            icon="tabler:star"
            class="p-0 text-opacity-50 w-3 h-full rotate-horizontal"
          /> -->
      <!-- <span>Add to Favorites</span> -->
      <!-- </a> -->
      <!-- </li> -->
    </ul>
    <ul v-if="isAggregateColumn" class="menu menu-xs w-full p-0 [&_li>*]:rounded-none">
      <li>
        <a
          v-if="column?.childrenCount === column?.selectedChildrenCount"
          @click="column?.unselectChildrenDeep"
        >
          <!-- All children are selected -->
          Unselect All ({{ column?.selectedChildrenCount }} / {{ column?.childrenCount }})
        </a>
        <a v-else @click="column?.selectChildrenDeep">
          <!-- Not all children are selected -->
          Select All ({{ column?.selectedChildrenCount }} / {{ column?.childrenCount }})
        </a>
      </li>
      <li>
        <a @click="mainStore.attributeTree?.toggleColumnExpansion(column)">{{
          column?.isOpen ? 'Close' : 'Expand'
        }}</a>
      </li>
      <li>
        <a @click="mainStore.attributeTree?.expandAllColumns(column)">Expand Deep</a>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss"></style>
