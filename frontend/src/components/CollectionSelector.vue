<script setup lang="ts">
import { useMainStore } from '@/stores/mainStore'
import InformationIcon from '@assets/information-icon.svg'

const mainStore = useMainStore()

function handleCollectionColorChange(event: Event, collection: string) {
  const target = event.target as HTMLInputElement
  mainStore.setColorOfCollection(collection, target.value)
}
</script>

<template>
  <div
    v-if="mainStore.getActiveDataTable?.firstLayerCollectionNames?.length || 0 > 0"
    :style="{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: '5px' }"
  >
    <div :style="{ display: 'flex', gap: '5px', alignItems: 'center' }">
      <input
        :style="{ width: '20px', height: '20px' }"
        type="checkbox"
        :checked="mainStore.areAllCollectionsEnabled()"
        @change="mainStore.toggleAllCollectionsEnabled()"
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
        v-for="collection in mainStore.getActiveDataTable?.firstLayerCollectionNames"
        :key="collection"
        :style="{ display: 'flex', gap: '5px', alignItems: 'center' }"
      >
        <input
          :style="{ width: '20px', height: '20px' }"
          type="checkbox"
          :checked="mainStore.isCollectionEnabled(collection)"
          @change="mainStore.toggleCollectionEnabled(collection)"
        />
        <input
          :style="{ width: '20px', height: '20px' }"
          @change="handleCollectionColorChange($event, collection)"
          type="color"
          :value="mainStore.getColorOfCollection(collection)"
        />
        <p :style="{ color: mainStore.getColorOfCollection(collection) }">{{ collection }}</p>
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
