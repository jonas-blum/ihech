<script setup lang="ts">
import { useHeatmapStore } from '@/stores/heatmapStore'

const heatmapStore = useHeatmapStore()

function handleCollectionColorChange(event: Event, collection: string) {
  const target = event.target as HTMLInputElement
  heatmapStore.setColorOfCollection(collection, target.value)
}
</script>

<template>
  <div
    v-if="heatmapStore.getActiveDataTable?.firstLayerCollectionNames?.length || 0 > 0"
    :style="{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: '5px' }"
  >
    <div :style="{ display: 'flex', gap: '5px ' }">
      <input
        :style="{ width: '20px', height: '20px' }"
        type="checkbox"
        :checked="heatmapStore.areAllCollectionsEnabled()"
        @change="heatmapStore.toggleAllCollectionsEnabled()"
      />
      <h2 class="text-lg font-bold">Collections:</h2>
    </div>
    <ul
      :style="{
        alignSelf: 'flex-start',
        marginBottom: '50px',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
      }"
    >
      <li
        v-for="collection in heatmapStore.getActiveDataTable?.firstLayerCollectionNames"
        :key="collection"
        :style="{ display: 'flex', gap: '5px', alignItems: 'center' }"
      >
        <input
          :style="{ width: '20px', height: '20px' }"
          type="checkbox"
          :checked="heatmapStore.isCollectionEnabled(collection)"
          @change="heatmapStore.toggleCollectionEnabled(collection)"
        />
        <input
          :style="{ width: '20px', height: '20px' }"
          @change="handleCollectionColorChange($event, collection)"
          type="color"
          :value="heatmapStore.getColorOfCollection(collection)"
        />
        <p :style="{ color: heatmapStore.getColorOfCollection(collection) }">{{ collection }}</p>
      </li>
    </ul>
  </div>
</template>
