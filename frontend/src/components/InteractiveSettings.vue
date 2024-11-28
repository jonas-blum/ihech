<script setup lang="ts">
import type { IndexLabelInterface } from '@/helpers/helpers'
import { useMainStore } from '@stores/mainStore'
import { computed, ref, watch, watchEffect } from 'vue'
import Multiselect from 'vue-multiselect'

const mainStore = useMainStore()

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
  mainStore.setItemsClusterSize(parseInt(size, 10))
  mainStore.setIsOutOfSync(true)
}

async function updateClusterItemsByCollections(event: Event) {
  if (!(event.target instanceof HTMLInputElement)) {
    console.error('Event target is not an HTMLInputElement:', event.target)
    return
  }
  mainStore.setClusterItemsByCollections(event.target.checked)
  mainStore.setIsOutOfSync(true)
}

async function updateClusterAfterDimRed() {
  mainStore.setClusterAfterDimRed(!mainStore.getActiveDataTable?.clusterAfterDimRed)
  mainStore.setIsOutOfSync(true)
}

async function updateAttributesClusterByCollections(event: Event) {
  if (!(event.target instanceof HTMLInputElement)) {
    console.error('Event target is not an HTMLInputElement:', event.target)
    return
  }
  mainStore.setClusterAttributesByCollections(event.target.checked)
  mainStore.setIsOutOfSync(true)
}

const selectedHierarchicalRowsMetadataColumnNames = ref<IndexLabelInterface[]>(
  mainStore.getHierarchicalRowsMetadataColumnNames.filter((item) => item.selected),
)
const selectedHierarchicalColumnsMetadataRowIndexes = ref<IndexLabelInterface[]>(
  mainStore.getHierarchicalColumnsMetadataRowIndexes.filter((item) => item.selected),
)

function updateHierarchicalRowsMetadataColumnNames(option: IndexLabelInterface, id: number) {
  mainStore.getHierarchicalRowsMetadataColumnNames.forEach((item) => {
    item.selected = selectedHierarchicalRowsMetadataColumnNames.value.includes(item)
  })
  mainStore.getHierarchicalRowsMetadataColumnNames.sort(
    (a, b) =>
      selectedHierarchicalRowsMetadataColumnNames.value.indexOf(a) -
      selectedHierarchicalRowsMetadataColumnNames.value.indexOf(b),
  )
  mainStore.setIsOutOfSync(true)
}

function updateHierarchicalColumnsMetadataRowIndexes(option: IndexLabelInterface, id: number) {
  mainStore.getHierarchicalColumnsMetadataRowIndexes.forEach((item) => {
    item.selected = selectedHierarchicalColumnsMetadataRowIndexes.value.includes(item)
  })
  mainStore.getHierarchicalColumnsMetadataRowIndexes.sort(
    (a, b) =>
      selectedHierarchicalColumnsMetadataRowIndexes.value.indexOf(a) -
      selectedHierarchicalColumnsMetadataRowIndexes.value.indexOf(b),
  )
  mainStore.setIsOutOfSync(true)
}

watch(
  () => mainStore.getDataChanging,
  () => {
    selectedHierarchicalRowsMetadataColumnNames.value =
      mainStore.getHierarchicalRowsMetadataColumnNames.filter((item) => item.selected)
    selectedHierarchicalColumnsMetadataRowIndexes.value =
      mainStore.getHierarchicalColumnsMetadataRowIndexes.filter((item) => item.selected)
  },
)
</script>

<template>
  <div class="text-md">
    <h2 class="text-xl font-bold underline mb-2">C&G Version - 🚧 Work In Progress 🚧</h2>
    <p>You are exploring the age distribution of residents across municipalities in Switzerland.</p>

    <!-- Item Settings -->
    <p>
      Municipalities are
      <span v-if="!mainStore.getActiveDataTable?.clusterItemsByCollections">not</span> grouped (
      <input
        @click="updateClusterItemsByCollections"
        type="checkbox"
        class="toggle toggle-xs translate-y-[4px]"
        :checked="mainStore.getActiveDataTable?.clusterItemsByCollections"
      />
      )
      <span v-if="mainStore.getActiveDataTable?.clusterItemsByCollections">
        by

        <multiselect
          class="inline-block w-64 mx-2 align-middle"
          v-model="selectedHierarchicalRowsMetadataColumnNames"
          :options="mainStore.getHierarchicalRowsMetadataColumnNames"
          track-by="index"
          :show-labels="false"
          :multiple="true"
          label="label"
          :searchable="false"
          :close-on-select="true"
          @select="updateHierarchicalRowsMetadataColumnNames"
          @remove="updateHierarchicalRowsMetadataColumnNames"
        >
        </multiselect>
      </span>
      and recursively clustered using the k-means algorithm with
      <select
        @change="updateItemsClusterSize($event)"
        class="select select-bordered select-xs w-min mx-1"
      >
        <option
          v-for="option in kOptions"
          :value="option.value"
          :selected="mainStore.getActiveDataTable?.itemsClusterSize === option.value"
        >
          {{ option.label }}
        </option>
      </select>
      on the
      <select
        @change="updateClusterAfterDimRed"
        class="select select-bordered select-xs w-min mx-1"
      >
        <option :selected="!mainStore.getActiveDataTable?.clusterAfterDimRed">
          high-dimensional
        </option>
        <option :selected="mainStore.getActiveDataTable?.clusterAfterDimRed">
          dimensionality reduced
        </option>
      </select>
      data.
    </p>

    <!-- Attribute Settings -->
    <p>
      Age groups are
      <span v-if="!mainStore.getActiveDataTable?.clusterAttributesByCollections">not</span>
      grouped (
      <input
        @click="updateAttributesClusterByCollections"
        type="checkbox"
        class="toggle toggle-xs translate-y-[4px]"
        :checked="mainStore.getActiveDataTable?.clusterAttributesByCollections"
      />
      )
      <span v-if="mainStore.getActiveDataTable?.clusterAttributesByCollections"> by </span>
      <multiselect
        class="inline-block w-64 mx-2 align-middle"
        v-model="selectedHierarchicalColumnsMetadataRowIndexes"
        :options="mainStore.getHierarchicalColumnsMetadataRowIndexes"
        track-by="index"
        :show-labels="false"
        :multiple="true"
        label="label"
        :searchable="false"
        :close-on-select="true"
        @select="updateHierarchicalColumnsMetadataRowIndexes"
        @remove="updateHierarchicalColumnsMetadataRowIndexes"
      >
      </multiselect>
      <!-- TODO: here I could add the k-means attribute clustering parameter. for now I "disabled" it by settings the parameter to -1 -->
    </p>
  </div>
</template>
