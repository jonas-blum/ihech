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
        class="p-5 z-10"
        :style="{
          width: `${700}px`,
          height: `${useHeatmapLayoutStore().columnLabelHeight + useHeatmapLayoutStore().tileMargin}px`,
        }"
      >
        <InteractiveSettings />
        <div class="flex gap-2 relative h-min">
          <button @click="heatmapStore?.itemTree?.expandAllRows()" class="btn btn-sm">
            Expand All
          </button>
        </div>
      </div>
      <div
        class="w-full"
        :style="{
          height: `calc(100% - ${useHeatmapLayoutStore().columnLabelHeight + useHeatmapLayoutStore().tileMargin}px)`,
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
