<script setup lang="ts">
import { useHeatmapStore } from '@stores/heatmapStore'

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

async function updateAttributesClusterByCollections(event: Event) {
  if (!(event.target instanceof HTMLInputElement)) {
    console.error('Event target is not an HTMLInputElement:', event.target)
    return
  }
  heatmapStore.setClusterAttributesByCollections(event.target.checked)
  heatmapStore.setIsOutOfSync(true)
}
</script>

<template>
  <div class="text-md">
    <h2 class="text-xl font-bold underline mb-2">C&G Version - 🚧 Work In Progress 🚧</h2>
    <p>You are exploring the age distribution of residents across municipalities in Switzerland.</p>

    <!-- Item Settings -->
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
      <select
        @change="updateClusterAfterDimRed"
        class="select select-bordered select-xs w-min mx-1"
      >
        <option :selected="!heatmapStore.getActiveDataTable?.clusterAfterDimRed">
          high-dimensional
        </option>
        <option :selected="heatmapStore.getActiveDataTable?.clusterAfterDimRed">
          dimensionality reduced
        </option>
      </select>
      data.
    </p>

    <!-- Attribute Settings -->
    <p>
      Age groups are
      <span v-if="!heatmapStore.getActiveDataTable?.clusterAttributesByCollections">not</span>
      grouped (
      <input
        @click="updateAttributesClusterByCollections"
        type="checkbox"
        class="toggle toggle-xs translate-y-[4px]"
        :checked="heatmapStore.getActiveDataTable?.clusterAttributesByCollections"
      />
      )
      <span v-if="heatmapStore.getActiveDataTable?.clusterAttributesByCollections">
        by
        <select class="select select-bordered select-xs w-min mx-1">
          <option v-for="option in attributeGroupingOptions" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </span>
      .
      <!-- TODO: here I could add the k-means attribute clustering parameter. for now I "disabled" it by settings the parameter to -1 -->
    </p>
  </div>
</template>
