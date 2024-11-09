<script setup lang="ts">
import { useHeatmapStore } from '@/stores/heatmapStore'
import InformationIcon from '@assets/information-icon.svg'

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
    <div :style="{ display: 'flex', gap: '5px', alignItems: 'center' }">
      <input
        :style="{ width: '20px', height: '20px' }"
        type="checkbox"
        :checked="heatmapStore.areAllCollectionsEnabled()"
        @change="heatmapStore.toggleAllCollectionsEnabled()"
      />
      <h2 class="text-lg font-bold">Collections:</h2>
      <div class="self-tooltip">
        <span class="tooltiptext-right"
          ><div>In this section you can see the first layer of collections.</div>
          <div>
            You can enable or disable the collections by clicking on the checkbox. This helps you to
            focus on the collections you are interested in.
          </div>

          <div>The colors of the collections can be changed by clicking on the color picker.</div>
        </span>
        <InformationIcon :style="{ height: '15px', width: '15px' }" />
      </div>
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

<style scoped>
.self-tooltip {
  position: relative;
  display: inline-block;
}

.self-tooltip .tooltiptext-right {
  display: none;
  width: 300px;
  background-color: darkgray;
  color: black;
  padding: 8px;
  border-radius: 6px;
  top: 0%;
  left: 105%;
  text-wrap: pretty;
  hyphens: auto;
  font-size: 16px;

  position: absolute;
  z-index: 10000000;

  flex-direction: column;
  gap: 8px;
}

.self-tooltip:hover .tooltiptext-right {
  display: flex;
}
</style>
