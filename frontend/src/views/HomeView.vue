<script setup lang="ts">
import Heatmap from '@/components/Heatmap.vue'
import Dimred from '@/components/Dimred.vue'
import HeatmapSettings from '@/components/HeatmapSettings.vue'
import CsvUpload from '@/components/CsvUpload.vue'
import InteractiveSettings from '@/components/InteractiveSettings.vue'
import { useHeatmapStore } from '@stores/heatmapStore'
import { useHeatmapLayoutStore } from '@stores/heatmapLayoutStore'

const heatmapStore = useHeatmapStore()
const heatmapLayoutStore = useHeatmapLayoutStore()

function reloadHeatmap() {
  heatmapStore.setCsvUploadOpen(false)
  heatmapStore.fetchHeatmap()
}
</script>

<template>
  <div class="w-full h-full flex white">
    <div class="w-1/3 h-full flex flex-col">
      <!-- TODO: calculate width dynamically -->
      <div
        class="p-5 z-10 flex flex-col gap-2"
        :style="{
          width: `${700}px`,
          height: `${heatmapLayoutStore.columnLabelHeight + heatmapLayoutStore.tileMargin}px`,
        }"
      >
        <InteractiveSettings />
        <div class="flex gap-2 relative h-min">
          <button @click="heatmapStore?.itemTree?.expandAllRows()" class="btn btn-sm">
            Expand All
          </button>
          <button
            @click="reloadHeatmap()"
            :class="{
              btn: true,
              'btn-sm': true,
              'btn-neutral': !heatmapStore.isOutOfSync,
              'btn-warning': heatmapStore.isOutOfSync,
              'text-sm': true,
            }"
          >
            Update
            <span v-if="heatmapStore.isOutOfSync">(unsaved changes!)</span>
            <span v-if="heatmapStore.isLoading" class="loading loading-spinner"></span>
          </button>
        </div>
      </div>
      <div
        class="w-full"
        :style="{
          height: `calc(100% - ${heatmapLayoutStore.columnLabelHeight + heatmapLayoutStore.tileMargin}px)`,
        }"
      >
        <Dimred />
      </div>
    </div>
    <div class="w-2/3">
      <Heatmap />
    </div>
  </div>
  <CsvUpload />
  <HeatmapSettings />
</template>
