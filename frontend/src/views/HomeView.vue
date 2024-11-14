<script setup lang="ts">
import Heatmap from '@/components/Heatmap.vue'
import Dimred from '@/components/Dimred.vue'
import HeatmapSettings from '@/components/HeatmapSettings.vue'
import CsvUpload from '@/components/CsvUpload.vue'
import RowSorterSettings from '@/components/RowSorterSettings.vue'
import ColumnSorterSettings from '@/components/ColumnSorterSettings.vue'
import ColorMap from '@/components/ColorMap.vue'
import { useHeatmapStore } from '@stores/heatmapStore'
import { useHeatmapLayoutStore } from '@stores/heatmapLayoutStore'
</script>

<template>
  <div class="w-full h-full flex white">
    <div class="w-1/3 h-full flex flex-col border-blue-500 border-0">
      <div class="w-full h-1/3 flex border-violet-500 border-0">
        <div class="flex gap-2 relative h-min">
          <RowSorterSettings />
          <ColumnSorterSettings />
          <ColorMap :colorMap="useHeatmapStore().colorMap" />
          <button @click="useHeatmapStore()?.itemTree?.expandAllRows()" class="btn btn-small">
            Expand All
          </button>

          requiredHeight: {{ useHeatmapLayoutStore().requiredHeight}}<br>
          rowsVerticalStartPosition: {{ useHeatmapLayoutStore().rowsVerticalStartPosition }} <br>
          firstVisibleRowIndex: {{ useHeatmapLayoutStore().firstVisibleRowIndex }} <br>
          lastVisibleRowIndex: {{ useHeatmapLayoutStore().lastVisibleRowIndex }} <br>
        </div>
      </div>
      <div class="w-full h-2/3">
        <Dimred />
      </div>
    </div>
    <div class="w-2/3 h-full border-red-500 border-0">
      <Heatmap />
    </div>
  </div>

  <CsvUpload />
  <HeatmapSettings />
</template>
