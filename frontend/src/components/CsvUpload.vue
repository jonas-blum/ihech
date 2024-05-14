<script setup lang="ts">
import type { CsvDataTable } from '@/helpers/helpers'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { ref, watch } from 'vue'
import * as dataForge from 'data-forge'

const heatmapStore = useHeatmapStore()

const isOpen = ref(true)

const temporaryDataTable = ref<CsvDataTable | null>(null)

function toggleAccordion() {
  isOpen.value = !isOpen.value
}

function selectDataTable(dataTable: CsvDataTable) {
  heatmapStore.setActiveDataTable(dataTable)
}

function uploadCsvFile(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const contents = e.target?.result as string
    const df = dataForge.fromCSV(contents)
    const newDataTable: CsvDataTable = {
      tableName: file.name,
      df: df,
      selectedAttributes: [],
      selectedItemNameColumn: null,
      collectionColumnNames: [],
      collectionColorMap: {}
    }
    console.log(newDataTable)
    temporaryDataTable.value = newDataTable
  }
  reader.readAsText(file)
}

function saveDataTable() {
  if (temporaryDataTable.value === null) return
  heatmapStore.addDataTable(temporaryDataTable.value)
}

watch(
  () => heatmapStore.getActiveDataTable,
  () => {
    if (heatmapStore.getActiveDataTable === null) {
      temporaryDataTable.value = null
    } else {
      temporaryDataTable.value = {
        tableName: heatmapStore.getActiveDataTable.tableName,
        df: heatmapStore.getActiveDataTable.df,
        selectedAttributes: [...heatmapStore.getActiveDataTable.selectedAttributes],
        selectedItemNameColumn: heatmapStore.getActiveDataTable.selectedItemNameColumn,
        collectionColumnNames: [...heatmapStore.getActiveDataTable.collectionColumnNames],
        collectionColorMap: { ...heatmapStore.getActiveDataTable.collectionColorMap }
      }
    }
  }
)
</script>

<template>
  <div style="width: 100%" class="collapse collapse-arrow bg-base-200" @click="toggleAccordion">
    <input type="checkbox" class="hidden" v-model="isOpen" />
    <div class="collapse-title text-xl font-medium">Stored Data Tables</div>
    <div class="collapse-content content-grid" v-if="isOpen">
      <div style="display: flex; flex-direction: column">
        Upload new CSV <input type="file" @change="uploadCsvFile($event)" />
        <ul>
          <li :key="index" v-for="(dataTable, index) in heatmapStore.getAllDataTables">
            <button @click="selectDataTable(dataTable)">
              {{ dataTable.tableName }}
            </button>
          </li>
        </ul>
      </div>
      <table class="data-table" :style="{ display: temporaryDataTable ? 'block' : 'block' }">
        <thead>
          <th :key="index" v-for="(columnName, index) in temporaryDataTable?.df.getColumnNames()">
            {{ columnName }}
          </th>
        </thead>
        <tbody>
          <tr :key="index" v-for="(row, index) in temporaryDataTable?.df.head(5).toArray()">
            <td :key="index" v-for="(value, index) in row">
              {{ value }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.content-grid {
  display: grid;
  grid-template-columns: 3fr 9fr;
  gap: 10px;
  overflow: auto;
}

.data-table {
  border-collapse: separate;
  border-spacing: 10px;

  th,
  td {
    padding: 10px;
    text-align: left;
  }
}
</style>
