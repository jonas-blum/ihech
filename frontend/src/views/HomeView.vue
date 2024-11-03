<script setup lang="ts">
import DimReductionVisual from '@/components/DimReductionVisual.vue'
// import ExpandableHeatmap from '@/components/ExpandableHeatmap.vue'
import Heatmap from '@/components/Heatmap.vue'
import HeatmapSettings from '@/components/HeatmapSettings.vue'
import CsvUpload from '@/components/CsvUpload.vue'
import RowSorterSettings from '@/components/RowSorterSettings.vue'
import ColumnSorterSettings from '@/components/ColumnSorterSettings.vue'
import ColorMap from '@/components/ColorMap.vue'
import { useHeatmapStore } from '@stores/heatmapStore'
</script>

<template>
  <div class="w-full h-full flex">
    <div class="w-1/2 h-full border-red-500 border-0">
      <Heatmap />
    </div>
    <div class="w-1/2 h-full flex flex-col border-blue-500 border-4">
      <div class="w-full h-2/3 border-cyan-500 border-4">
        <CsvUpload />
        <HeatmapSettings />
      </div>
      <div class="w-full h-1/3 flex border-violet-500 border-4">
        <!-- <DimReductionVisual /> -->
        <div class="flex gap-2 relative h-min">
          <RowSorterSettings />
          <ColumnSorterSettings />
          <ColorMap :colorMap="useHeatmapStore().colorMap"/>
        </div>
      </div>
    </div>
  </div>

  <!-- <CsvUpload /> -->
</template>
