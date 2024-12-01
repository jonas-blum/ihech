<script setup lang="ts">
import { defineProps, computed, ref, watch } from 'vue'
import { ColorMap, Breakpoint } from '@/classes/ColorMap'
import { ColoringHeatmapEnum, mapColoringHeatmapEnum } from '@/helpers/helpers'
import { Icon } from '@iconify/vue'
import { Row, ItemRow } from '@/classes/Row'
import { Column, AttributeColumn } from '@/classes/Column'

import { useMainStore } from '@/stores/mainStore'

const mainStore = useMainStore()

const itemSearchResults = ref<ItemRow[]>([])
const attributeSearchResults = ref<AttributeColumn[]>([])
const lastSearchTime = ref<number>(0)

// computed property to get itemSearchResults sorted alphabetically
const sortedItemSearchResults = computed(() => {
  return itemSearchResults.value.sort((a, b) => a.name.localeCompare(b.name))
})

// computed property to get attributeSearchResults sorted alphabetically
const sortedAttributeSearchResults = computed(() => {
  return attributeSearchResults.value.sort((a, b) => a.name.localeCompare(b.name))
})


const onSearchChange = (event: Event): void => {
  const searchTerm = (event.target as HTMLInputElement).value

  if (!searchTerm) {
    itemSearchResults.value = []
    attributeSearchResults.value = []
    return
  }

  if (Date.now() - lastSearchTime.value < 100) {
    return
  }
  lastSearchTime.value = Date.now()

  // search items that match the search term
  const items = mainStore.itemTree?.rowsAsArray.filter((row) => {
    return row instanceof ItemRow && row.name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // search attributes that match the search term
  const attributes = mainStore.attributeTree?.columnsAsArray.filter((attribute) => {
    return attribute.name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  itemSearchResults.value = items || []
  attributeSearchResults.value = attributes || []
}

const onItemClick = (item: ItemRow) => {
  console.log('Item clicked:', item)
  mainStore.itemTree?.toggleStickyRow(item)
}

const onAttributeClick = (attribute: AttributeColumn) => {
  console.log('Attribute clicked:', attribute)
  attribute.toggleSelected()
}

</script>
<template>
  <div class="w-full p-2 rounded-none bg-white">
    <div class="p-0 rounded-none min-h-[20px]">
      <label class="input input-xs flex items-center gap-2 m-0 p-0 rounded-none">
        <Icon
          icon="material-symbols:search"
          class="p-0 text-opacity-50 w-6 h-full rotate-horizontal"
        />
        <input
          @input="onSearchChange"
          type="text"
          class="grow"
          placeholder="Search Item or Attribute"
        />
        <!-- TODO: replace with itemName and attributeName -->
      </label>
    </div>
    <div v-if="itemSearchResults.length > 0 || attributeSearchResults.length > 0" class="flex gap-2 w-[500px] max-h-[600px] p-2 absolute bg-white -translate-x-[33%] translate-y-3 custom-shadow">
      <ul
        class="w-1/2 rounded-none text-xs mt-2 flex flex-col gap-1 overflow-y-auto"
      >
        <li class="font-bold border-b-2">
          <span>Items ({{ itemSearchResults.length }})</span>
        </li>
        <li v-for="item in sortedItemSearchResults" @click="onItemClick(item)" class="flex justify-between items-center hover:bg-gray-200 cursor-pointer">
          <div class="flex gap-1 items-center">
            <Icon
              v-if="mainStore.itemTree?.isRowSticky(item)"
              icon="tabler:star-filled"
              class="p-0 text-opacity-50 w-3 h-full"
              :style="{color: item.getColor()}"
            />
            <Icon
              v-else
              icon="material-symbols:circle"
              class="p-0 text-opacity-50 w-3 h-full"
              :style="{color: item.getColor()}"
            />
            <span class="w-full">{{ item.name }}</span>
          </div>
          <!-- <Icon
            icon="material-symbols:search"
            class="p-0 text-opacity-50 w-4 h-full rotate-horizontal"
          /> -->
        </li>
      </ul>
      <div class="divider divider-horizontal"></div>
      <ul
        class="w-1/2 rounded-none text-xs mt-2 flex flex-col gap-1 overflow-y-auto"
      >
        <li class="font-bold border-b-2">
          <span>Attributes ({{ attributeSearchResults.length }})</span>
        </li>
        <li v-for="attribute in sortedAttributeSearchResults" @click="onAttributeClick(attribute)" class="flex justify-between items-center hover:bg-gray-200 cursor-pointer">
          <div class="flex gap-2 items-center">
            <Icon
              v-if="attribute.selected"
              icon="material-symbols:circle"
              class="p-0 text-opacity-50 w-3 h-3"
              :style="{color: 'darkgray'}"
            />
            <Icon
              v-else
              icon=""
              class="p-0 text-opacity-50 w-3 h-3"
            />
            <div class="w-full">{{ attribute.name }}</div>
          </div>
          
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped lang="scss">
ul {
  li {
  }
}
</style>
