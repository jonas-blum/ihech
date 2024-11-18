<script setup lang="ts">
import { useHeatmapStore } from '@stores/heatmapStore'
import { useHeatmapLayoutStore } from '@stores/heatmapLayoutStore'
import { Icon } from '@iconify/vue'

const heatmapStore = useHeatmapStore()

const itemGroupingOptions = [
  { label: 'Kanton', value: 'kanton' },
  { label: 'District', value: 'district' },
  { label: 'Language Region', value: 'language' },
]

const attributeGroupingOptions = [
  { label: 'Age Group', value: 'age' },
  { label: '???', value: '???' },
]

const kOptions = [
  { label: 'k=2', value: 2 },
  { label: 'k=3', value: 3 },
  { label: 'k=4', value: 4 },
  { label: 'k=5', value: 5 },
  { label: 'k=6', value: 6 },
  { label: 'k=7', value: 7 },
  { label: 'k=8', value: 8 },
  { label: 'k=9', value: 9 },
  { label: 'k=10', value: 10 },
]

async function updateItemsClusterSize(event: Event) {
  if (!(event.target instanceof HTMLSelectElement)) {
    console.error('Event target is not an HTMLSelectElement:', event.target)
    return
  }
  const size = event.target.value
  heatmapStore.setItemsClusterSize(parseInt(size, 10))
  heatmapStore.setIsOutOfSync(true)
}

async function updateClusterItemsByCollections(event: Event) {
  if (!(event.target instanceof HTMLInputElement)) {
    console.error('Event target is not an HTMLInputElement:', event.target)
    return
  }
  heatmapStore.setClusterItemsByCollections(event.target.checked)
  heatmapStore.setIsOutOfSync(true)
}

async function updateClusterAfterDimRed() {
  heatmapStore.setClusterAfterDimRed(!heatmapStore.getActiveDataTable?.clusterAfterDimRed)
  heatmapStore.setIsOutOfSync(true)
}
</script>

<template>
  <div class="text-md">
    <p>You are exploring the age distribution of residents across municipalities in Switzerland.</p>
    <p>
      Municipalities are
      <span v-if="!heatmapStore.getActiveDataTable?.clusterItemsByCollections">not</span> grouped (
      <input
        @click="updateClusterItemsByCollections"
        type="checkbox"
        class="toggle toggle-xs translate-y-[4px]"
        :checked="heatmapStore.getActiveDataTable?.clusterItemsByCollections"
      />
      )
      <span v-if="heatmapStore.getActiveDataTable?.clusterItemsByCollections">
        by
        <select class="select select-bordered select-xs w-min mx-1">
          <option v-for="option in itemGroupingOptions" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </span>
      and recursively clustered using the k-means algorithm with
      <select
        @change="updateItemsClusterSize($event)"
        class="select select-bordered select-xs w-min mx-1"
      >
        <option
          v-for="option in kOptions"
          :value="option.value"
          :selected="heatmapStore.getActiveDataTable?.itemsClusterSize === option.value"
        >
          {{ option.label }}
        </option>
      </select>
      on the
      <select @change="updateClusterAfterDimRed" class="select select-bordered select-xs w-min mx-1">
        <option :selected="!heatmapStore.getActiveDataTable?.clusterAfterDimRed">high-dimensional</option>
        <option :selected="heatmapStore.getActiveDataTable?.clusterAfterDimRed">dimensionality reduced</option>
      </select>
      data.
    </p>
    <p>
      <!-- TODO: toggle to disable grouping of attributes (analogously to clusterByCollections) -->
      Age groups are grouped by
      <select class="select select-bordered select-xs w-min mx-1">
        <option v-for="option in attributeGroupingOptions" :value="option.value" @change="">
          {{ option.label }}
        </option>
      </select>
      .
    </p>
  </div>
</template>
