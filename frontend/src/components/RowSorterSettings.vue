<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useHeatmapStore } from '@/stores/heatmapStore'

const heatmapStore = useHeatmapStore()

// Use computed to reactively access the row sorter from the store
const rowSorter = computed(() => heatmapStore.itemTree?.rowSorter)
</script>

<template>
  <div class="dropdown dropdown-hover">
    <div tabindex="0" role="button" class="btn btn-md">Row Sorter</div>
    <div
      v-if="rowSorter"
      tabindex="0"
      class="dropdown-content bg-base-100 z-[1] w-64 p-2 rounded-sm shadow text-xs"
    >
      <p class="font-bold">Sort Rows by:</p>
      <!-- Use `in` instead of `of` for `v-for` and add a unique key -->
      <div
        v-for="(criterion, index) in rowSorter.getCriteria()"
        :key="criterion.technicalName"
        class="flex gap-[4px] items-center"
      >
        <!-- Correct property name to `humanReadableName` -->
        <span class="w-64">{{ index + 1 }}. {{ criterion.humanReadableName }}</span>
        <button class="btn btn-xs" @click="rowSorter.moveCriterion(criterion.technicalName, index - 1)">Up</button>
        <button class="btn btn-xs" @click="rowSorter.moveCriterion(criterion.technicalName, index + 1)">Down</button>
        <button class="btn btn-xs" @click="criterion.toggleReverse()">Reverse</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
