<script setup lang="ts">
import type { IndexLabelInterface } from '@/helpers/helpers'
import { useMainStore } from '@stores/mainStore'
import { computed, ref, watch, watchEffect } from 'vue'
import ResizableSelect from '@/components/ResizableSelect.vue'
import MultiSelect from '@/components/MultiSelect.vue'
import { type JsonDataTableProfile } from '@/helpers/helpers'

const mainStore = useMainStore()

const datasetOptions = computed(() => {
  return mainStore.getAllDataTables.map((dataTable) => ({
    label: dataTable.datasetName,
    value: dataTable.datasetName,
  }))
})

const kOptions = [
  { label: 'no clustering', value: '-1' },
  { label: 'k=2', value: '2' },
  { label: 'k=3', value: '3' },
  { label: 'k=4', value: '4' },
  { label: 'k=5', value: '5' },
  { label: 'k=6', value: '6' },
  { label: 'k=7', value: '7' },
  { label: 'k=8', value: '8' },
  { label: 'k=9', value: '9' },
  { label: 'k=10', value: '10' },
  { label: 'k=11', value: '11' },
  { label: 'k=12', value: '12' },
  { label: 'k=13', value: '13' },
  { label: 'k=14', value: '14' },
  { label: 'k=15', value: '15' },
]

const clusterAfterDimRedOptions = [
  { label: 'high-dimensional', value: 'false' },
  { label: 'dimensionality reduced', value: 'true' },
]

function selectDataTable(event: Event) {
  if (!(event.target instanceof HTMLSelectElement)) {
    console.error('Event target is not an HTMLSelectElement:', event.target)
    return
  }
  const dataTableName = event.target.value
  const dataTable = mainStore.getAllDataTables.find((dt) => dt.datasetName === dataTableName)
  if (!dataTable) {
    console.error('Could not find data table with name:', dataTableName)
    return
  }
  mainStore.setActiveDataTable(dataTable)
  mainStore.fetchData()
}

async function updateItemsClusterSize(event: Event) {
  if (!(event.target instanceof HTMLSelectElement)) {
    console.error('Event target is not an HTMLSelectElement:', event.target)
    return
  }
  mainStore.setItemsClusterSize(parseInt(event.target.value, 10))
  mainStore.setIsOutOfSync(true)
}

async function updateAttributesClusterSize(event: Event) {
  if (!(event.target instanceof HTMLSelectElement)) {
    console.error('Event target is not an HTMLSelectElement:', event.target)
    return
  }
  mainStore.setAttributesClusterSize(parseInt(event.target.value, 10))
  mainStore.setIsOutOfSync(true)
}

async function updateClusterAfterDimRed() {
  mainStore.setClusterAfterDimRed(!mainStore.getActiveDataTable?.clusterAfterDimRed)
  mainStore.setIsOutOfSync(true)
}

const selectedHierarchicalRowsMetadataColumnNames = computed<IndexLabelInterface[]>(() =>
  mainStore.getHierarchicalRowsMetadataColumnNames.filter((item) => item.selected),
)
const selectedHierarchicalColumnsMetadataRowIndexes = computed<IndexLabelInterface[]>(() =>
  mainStore.getHierarchicalColumnsMetadataRowIndexes.filter((item) => item.selected),
)
</script>

<template>
  <div class="text-md">
    <ResizableSelect
      class="inline-block"
      :options="datasetOptions"
      :selected="String(mainStore.getActiveDataTable?.datasetName || '')"
      :callback="selectDataTable"
      selectClasses="select select-sm text-md uppercase w-min mr-1 ml-0 pl-0 pb-0 mb-2 text-xl font-bold border-b-1 border-t-0 border-x-0 border-black rounded-none"
    ></ResizableSelect>

    <p>{{ mainStore.getActiveDataTable?.descriptionText }}</p>

    <!-- Item Settings -->
    <p>
      <span class="capitalize">{{ mainStore.getActiveDataTable?.itemNamePlural }}</span>
      are
      <span v-if="!selectedHierarchicalRowsMetadataColumnNames.length">not</span>
      grouped
      <span>(</span>
      <MultiSelect :options="mainStore.getHierarchicalRowsMetadataColumnNames"></MultiSelect
      ><span>) and recursively clustered (</span>
      <ResizableSelect
        class="inline-block"
        :options="kOptions"
        :selected="String(mainStore.getActiveDataTable?.itemsClusterSize || '')"
        :callback="updateItemsClusterSize"
        selectClasses="select select-xs"
      >
      </ResizableSelect>
      ) on the
      <ResizableSelect
        class="inline-block"
        :options="clusterAfterDimRedOptions"
        :selected="String(mainStore.getActiveDataTable?.clusterAfterDimRed)"
        :callback="updateClusterAfterDimRed"
        selectClasses="select select-xs"
      >
      </ResizableSelect>
      data.
    </p>

    <!-- Attribute Settings -->
    <p>
      <span class="capitalize">{{ mainStore.getActiveDataTable?.attributeNamePlural }}</span>
      are
      <span v-if="!selectedHierarchicalColumnsMetadataRowIndexes.length">not</span>
      grouped
      <span>(</span>
      <MultiSelect :options="mainStore.getHierarchicalColumnsMetadataRowIndexes"></MultiSelect>
      <span>)</span>
      and recursively clustered (
      <ResizableSelect
        class="inline-block"
        :options="kOptions"
        :selected="String(mainStore.getActiveDataTable?.attributesClusterSize || '')"
        :callback="updateAttributesClusterSize"
        selectClasses="select select-xs"
      ></ResizableSelect>
      ).

      <!-- TODO: here I could add the k-means attribute clustering parameter. for now I "disabled" it by settings the parameter to -1 -->
    </p>
  </div>
</template>

<style scoped lang="scss"></style>
