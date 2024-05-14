<script setup lang="ts">
import type { CsvDataTable } from '@/helpers/helpers'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { ref, watch } from 'vue'
import * as dataForge from 'data-forge'

const heatmapStore = useHeatmapStore()

const isOpen = ref(true)

const hierarchyLayers: ('None' | number)[] = ['None', 1, 2, 3, 4]

const fileInput = ref<HTMLInputElement | null>(null)

const temporaryDataTable = ref<CsvDataTable | null>(null)
const naNColumns = ref<string[]>([])

function toggleAccordion() {
  isOpen.value = !isOpen.value
}

function selectDataTable(dataTable: CsvDataTable) {
  heatmapStore.setActiveDataTable(dataTable)
}
function triggerFileInput() {
  fileInput.value?.click()
}

function uploadCsvFile(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const contents = e.target?.result as string
    const df = dataForge.fromCSV(contents, { dynamicTyping: true, skipEmptyLines: true }).bake()
    let fileNameNoExtension = file.name.split('.').slice(0, -1).join('.')
    while (heatmapStore.getAllDataTableNames.includes(fileNameNoExtension)) {
      fileNameNoExtension += '_1'
    }

    const newDataTable: CsvDataTable = {
      tableName: fileNameNoExtension,
      df: df,
      selectedAttributes: [],
      selectedItemNameColumn: null,
      collectionColumnNames: [],
      collectionColorMap: {}
    }
    console.log(newDataTable)
    temporaryDataTable.value = newDataTable
    setNanColumns()
    const nonNanColumns = df.getColumnNames().filter((columnName) => !isColumnNaN(columnName))
    temporaryDataTable.value.selectedAttributes = nonNanColumns
    if (naNColumns.value.length > 0) {
      temporaryDataTable.value.selectedItemNameColumn = naNColumns.value[0]
    }
  }
  reader.readAsText(file)

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function saveDataTable() {
  if (temporaryDataTable.value === null) {
    return
  }
  heatmapStore.saveDataTable(temporaryDataTable.value)
}

function toggleAttribute(attribute: string) {
  if (temporaryDataTable.value === null) return
  if (temporaryDataTable.value.selectedAttributes.includes(attribute)) {
    temporaryDataTable.value.selectedAttributes =
      temporaryDataTable.value.selectedAttributes.filter((attr) => attr !== attribute)
  } else {
    temporaryDataTable.value.selectedAttributes.push(attribute)
  }
}

function isColumnNaN(columnName: string): boolean {
  return naNColumns.value.includes(columnName)
}

function setNanColumns(): void {
  if (temporaryDataTable.value === null) {
    return
  }
  const typeFrequencies = temporaryDataTable.value.df.detectTypes().bake()

  const nanTypeColumns = typeFrequencies.where((row) => row.Type !== 'number' && row.Frequency > 0)
  const columnsWithNaN = nanTypeColumns
    .distinct((row) => row.Column)
    .select((row) => row.Column)
    .toArray()

  naNColumns.value = columnsWithNaN
}

function getColumnCollectionHierarchy(columnName: string): 'None' | number {
  if (temporaryDataTable.value === null) {
    return 'None'
  }
  const foundIndex = temporaryDataTable.value.collectionColumnNames.indexOf(columnName)
  if (foundIndex === -1) {
    return 'None'
  } else {
    return foundIndex + 1
  }
}

function updateHierarchyLayer(event: Event, columnName: string) {
  if (!(event.target instanceof HTMLSelectElement)) {
    console.error('Event target is not an HTMLSelectElement:', event.target)
    return
  }
  const selectedHierarchyLayer = event.target.value

  if (selectedHierarchyLayer === 'None') {
    //Remove the column name from the collectionColumnNames array
    const foundIndex = temporaryDataTable.value?.collectionColumnNames.indexOf(columnName)
    if (foundIndex !== undefined && foundIndex !== -1) {
      temporaryDataTable.value?.collectionColumnNames.splice(foundIndex, 1)
    }
  } else {
    // Insert the column name at the selected hierarchy layer
    const hierarchyLayer = parseInt(selectedHierarchyLayer)
    const foundIndex = temporaryDataTable.value?.collectionColumnNames.indexOf(columnName)
    if (foundIndex !== undefined && foundIndex !== -1) {
      temporaryDataTable.value?.collectionColumnNames.splice(foundIndex, 1)
    }
    temporaryDataTable.value?.collectionColumnNames.splice(hierarchyLayer - 1, 0, columnName)
  }
  console.log(temporaryDataTable.value?.collectionColumnNames)
}

function updateItemNamesColumn(columName: string) {
  if (temporaryDataTable.value === null) {
    return
  }
  temporaryDataTable.value.selectedItemNameColumn = columName
}

function discardChanges() {
  temporaryDataTable.value = heatmapStore.getActiveDataTable
}

watch(
  () => heatmapStore.getActiveDataTable,
  () => {
    if (heatmapStore.getActiveDataTable === null) {
      temporaryDataTable.value = null
      naNColumns.value = []
    } else {
      temporaryDataTable.value = {
        tableName: heatmapStore.getActiveDataTable.tableName,
        df: heatmapStore.getActiveDataTable.df,
        selectedAttributes: [...heatmapStore.getActiveDataTable.selectedAttributes],
        selectedItemNameColumn: heatmapStore.getActiveDataTable.selectedItemNameColumn,
        collectionColumnNames: [...heatmapStore.getActiveDataTable.collectionColumnNames],
        collectionColorMap: { ...heatmapStore.getActiveDataTable.collectionColorMap }
      }
      setNanColumns()
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
        <div class="file-input-container" @click="triggerFileInput">
          <button type="button">Upload Csv File</button>
        </div>
        <!-- Actual file input, hidden but functional -->
        <input type="file" ref="fileInput" @change="uploadCsvFile($event)" style="display: none" />
        <ul
          :style="{
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            border: '1px solid black',
            padding: '5px'
          }"
        >
          <li :key="index" v-for="(dataTable, index) in heatmapStore.getAllDataTables">
            <button @click.stop="selectDataTable(dataTable)">
              {{ dataTable.tableName }}
            </button>
          </li>
        </ul>
      </div>
      <div :style="{ display: temporaryDataTable ? 'flex' : 'none', flexDirection: 'column' }">
        <div
          style="
            display: grid;
            gap: 10px;
            grid-template-columns: 1fr 1fr auto 1fr 1fr;
            margin-right: auto;
          "
        >
          <button class="btn-success" @click.stop="saveDataTable">Save Data Table</button>
          <button class="btn-warning" @click.stop="discardChanges">Discard Changes</button>
          <h1 :style="{ fontSize: '25px', fontWeight: 'bold', marginLeft: '20px' }">
            {{ temporaryDataTable?.tableName }}
          </h1>
          <div></div>
          <div></div>
        </div>
        <table class="data-table">
          <thead>
            <th :key="index" v-for="(columnName, index) in temporaryDataTable?.df.getColumnNames()">
              <div :style="{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }">
                <input
                  @click.stop="updateItemNamesColumn(columnName)"
                  type="checkbox"
                  class="toggle"
                  :checked="temporaryDataTable?.selectedItemNameColumn === columnName"
                />
                <select
                  @change="updateHierarchyLayer($event, columnName)"
                  @click.stop
                  class="select select-primary max-w-xs"
                >
                  <option
                    :selected="getColumnCollectionHierarchy(columnName) === hierarchyLayer"
                    v-for="hierarchyLayer in hierarchyLayers"
                    :key="hierarchyLayer"
                  >
                    {{ hierarchyLayer }}
                  </option>
                </select>
                <div>
                  {{ columnName }}
                </div>
                <input
                  :disabled="isColumnNaN(columnName)"
                  @click.stop="toggleAttribute(columnName)"
                  type="checkbox"
                  :checked="temporaryDataTable?.selectedAttributes.includes(columnName)"
                />
              </div>
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

.file-input-container {
  padding: 5px;
  border: 1px solid #ccc;
  display: flex;
  cursor: pointer;
  margin-bottom: 20px;
}
.file-input-container span {
  margin-right: 10px;
}
</style>
