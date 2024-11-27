<script setup lang="ts">
import { useMainStore } from '@stores/mainStore'
import { computed } from 'vue'

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

const hierarchicalColumnsMetadataRowIndexes = computed({
  get() {
    return mainStore.getHierarchicalColumnsMetadataRowIndexes.map((item) => item)
  },
  set(selectedOptions) {
    const selectedIndexes = selectedOptions.map((item) => item.index)
    mainStore.getHierarchicalColumnsMetadataRowIndexes.forEach((item) => {
      item.selected = selectedIndexes.includes(item.index)
    })
    mainStore.setIsOutOfSync(true)
  },
})

const hierarchicalRowsMetadataColumnNames = computed({
  get() {
    return mainStore.getHierarchicalRowsMetadataColumnNames.map((item) => item)
  },
  set(selectedOptions) {
    const selectedIndexes = selectedOptions.map((item) => item.index)
    mainStore.getHierarchicalRowsMetadataColumnNames.forEach((item) => {
      item.selected = selectedIndexes.includes(item.index)
    })
    mainStore.setIsOutOfSync(true)
  },
})
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
        <select
          multiple
          v-model="hierarchicalRowsMetadataColumnNames"
          class="select select-bordered select-xs w-min mx-1"
        >
          <option
            v-for="option in mainStore.getHierarchicalRowsMetadataColumnNames"
            :key="option.index"
            :value="option"
            :selected="option.selected"
          >
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
          :value="JSON.stringify(option)"
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
      <select
        multiple
        v-model="hierarchicalColumnsMetadataRowIndexes"
        class="select select-bordered select-xs w-min mx-1"
      >
        <option
          v-for="option in mainStore.getHierarchicalColumnsMetadataRowIndexes"
          :key="option.index"
          :value="option"
          :selected="option.selected"
        >
          {{ option.label }}
        </option>
      </select>
      .
      <!-- TODO: here I could add the k-means attribute clustering parameter. for now I "disabled" it by settings the parameter to -1 -->
    </p>
  </div>
</template>
