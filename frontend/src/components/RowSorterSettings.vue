<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMainStore } from '@/stores/mainStore'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'
import { Icon } from '@iconify/vue'

const mainStore = useMainStore()
const heatmapLayoutStore = useHeatmapLayoutStore()

// Use computed to reactively access the row sorter from the store
const rowSorter = computed(() => mainStore.itemTree?.rowSorter)
</script>

<template>
  <div class="dropdown dropdown-hover items-start align-start text-xs" >
    <div tabindex="0" role="button" class="p-2 rounded-sm flex gap-2 justify-center">
      <span>Sort</span>
      <Icon icon="iconoir:sort-down" class="p-0 w-4 h-4 text-opacity-50 cursor-pointer" />
    </div>
    <div
      v-if="rowSorter"
      tabindex="0"
      class="dropdown-content bg-base-100 z-[1] w-48 p-2 rounded-sm custom-shadow text-xs"
    >
      <p class="font-bold">Sort Rows by:</p>
      <div
        v-for="(criterion, index) in rowSorter.getCriteria()"
        :key="criterion.technicalName"
        class="flex gap-[4px] items-center"
      >
        <button
          class="btn btn-xs p-0"
          :disabled="index === 0"
          @click="rowSorter.moveCriterion(criterion.technicalName, index - 1)"
        >
          <Icon icon="stash:arrow-up" class="w-4 h-4 p-0 text-opacity-50 cursor-pointer" />
        </button>
        <button
          class="btn btn-xs p-0"
          :disabled="index === rowSorter.getCriteria().length - 1"
          @click="rowSorter.moveCriterion(criterion.technicalName, index + 1)"
        >
          <Icon icon="stash:arrow-down" class="w-4 h-4 p-0 text-opacity-50 cursor-pointer" />
        </button>
        <span class="w-64">{{ index + 1 }}. {{ criterion.humanReadableName }}</span>
        <button class="btn btn-xs p-0" @click="criterion.toggleReverse()">
          <Icon icon="system-uicons:reverse" class="w-4 h-4 p-0 text-opacity-50 cursor-pointer" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
