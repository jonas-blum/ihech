<script setup lang="ts">
import { useHeatmapStore } from '@/stores/heatmapStore'
import { ref, watch } from 'vue'
import * as dataForge from 'data-forge'
import {
  AbsRelLogEnum,
  DimReductionAlgoEnum,
  SortOrderAttributes,
  type CsvDataTableProfile
} from '@/helpers/helpers'

const heatmapStore = useHeatmapStore()

const isOpen = ref(true)

const hierarchyLayers: ('None' | number)[] = ['None', 1, 2, 3, 4]

const fileInput = ref<HTMLInputElement | null>(null)

const temporaryDataTable = ref<CsvDataTableProfile | null>(null)

function toggleAccordion() {
  isOpen.value = !isOpen.value
}

function selectDataTable(dataTable: CsvDataTableProfile) {
  heatmapStore.setActiveDataTable(dataTable)
}
function triggerFileInput() {
  fileInput.value?.click()
  isOpen.value = true
}

function getNanColumns(df: dataForge.IDataFrame): string[] {
  const typeFrequencies = df.detectTypes().bake()

  const nanTypeColumns = typeFrequencies.where((row) => row.Type !== 'number' && row.Frequency > 0)
  const columnsWithNaN = nanTypeColumns
    .distinct((row) => row.Column)
    .select((row) => row.Column)
    .toArray()

  return columnsWithNaN
}

function uploadCsvFile(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const contents = e.target?.result as string
    const df: dataForge.IDataFrame = dataForge
      .fromCSV(contents, { dynamicTyping: true, skipEmptyLines: true })
      .resetIndex()
      .bake()

    const csvFile = df.toCSV()
    let fileNameNoExtension = file.name.split('.').slice(0, -1).join('.')
    while (heatmapStore.getAllDataTableNames.includes(fileNameNoExtension)) {
      fileNameNoExtension += '_1'
    }

    const naNColumns = getNanColumns(df)
    console.log(naNColumns)
    const nonNanColumns = df
      .getColumnNames()
      .filter((columnName) => !naNColumns.includes(columnName))

    const selectedItemNameColumn = naNColumns.length > 0 ? naNColumns[0] : nonNanColumns[0]

    const newDataTable: CsvDataTableProfile = {
      tableName: fileNameNoExtension,
      df: df,

      nanColumns: naNColumns,
      nonNanColumns: nonNanColumns,

      collectionColorMap: {},

      showOnlyStickyItemsInDimReduction: false,

      csvFile: csvFile,

      itemNamesColumnName: selectedItemNameColumn,
      collectionColumnNames: [],

      selectedItemIndexes: df.getIndex().toArray(),
      selectedAttributes: nonNanColumns,

      stickyAttributes: [],
      sortAttributesBasedOnStickyItems: false,
      sortOrderAttributes: SortOrderAttributes.STDEV,

      stickyItemIndexes: [],
      clusterItemsBasedOnStickyAttributes: false,

      clusterByCollections: false,

      clusterSize: 6,
      dimReductionAlgo: DimReductionAlgoEnum.PCA,
      clusterAfterDimRed: false,

      absRelLog: AbsRelLogEnum.LOG
    }
    console.log(newDataTable)
    temporaryDataTable.value = newDataTable
  }
  reader.readAsText(file)
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
}

function updateItemNamesColumn(columName: string) {
  if (temporaryDataTable.value === null) {
    return
  }
  temporaryDataTable.value.itemNamesColumnName = columName
}

function discardChanges() {
  setActiveTableAsTemporary()
}

function setActiveTableAsTemporary() {
  if (heatmapStore.getActiveDataTable === null) {
    temporaryDataTable.value = null
  } else {
    temporaryDataTable.value = {
      tableName: heatmapStore.getActiveDataTable.tableName,
      df: heatmapStore.getActiveDataTable.df,

      nanColumns: [...heatmapStore.getActiveDataTable.nanColumns],
      nonNanColumns: [...heatmapStore.getActiveDataTable.nonNanColumns],

      collectionColorMap: { ...heatmapStore.getActiveDataTable.collectionColorMap },

      showOnlyStickyItemsInDimReduction:
        heatmapStore.getActiveDataTable.showOnlyStickyItemsInDimReduction,

      csvFile: heatmapStore.getActiveDataTable.csvFile,

      itemNamesColumnName: heatmapStore.getActiveDataTable.itemNamesColumnName,
      collectionColumnNames: [...heatmapStore.getActiveDataTable.collectionColumnNames],

      selectedItemIndexes: [...heatmapStore.getActiveDataTable.selectedItemIndexes],
      selectedAttributes: [...heatmapStore.getActiveDataTable.selectedAttributes],

      stickyAttributes: [...heatmapStore.getActiveDataTable.stickyAttributes],
      sortAttributesBasedOnStickyItems:
        heatmapStore.getActiveDataTable.sortAttributesBasedOnStickyItems,
      sortOrderAttributes: heatmapStore.getActiveDataTable.sortOrderAttributes,

      stickyItemIndexes: [...heatmapStore.getActiveDataTable.stickyItemIndexes],
      clusterItemsBasedOnStickyAttributes:
        heatmapStore.getActiveDataTable.clusterItemsBasedOnStickyAttributes,

      clusterByCollections: heatmapStore.getActiveDataTable.clusterByCollections,

      clusterSize: heatmapStore.getActiveDataTable.clusterSize,
      dimReductionAlgo: heatmapStore.getActiveDataTable.dimReductionAlgo,
      clusterAfterDimRed: heatmapStore.getActiveDataTable.clusterAfterDimRed,

      absRelLog: heatmapStore.getActiveDataTable.absRelLog
    }
  }
}

watch(
  () => heatmapStore.getActiveDataTable,
  () => {
    setActiveTableAsTemporary()
  }
)
</script>

<template>
  <div
    style="width: 90vw; margin-bottom: 50px"
    class="collapse collapse-arrow bg-base-200"
    @click.stop="toggleAccordion"
  >
    <input type="checkbox" class="hidden" v-model="isOpen" />
    <div class="collapse-title text-xl font-medium">Stored Data Tables</div>
    <div class="collapse-content content-grid" v-if="isOpen">
      <div style="display: flex; flex-direction: column; width: 200px">
        <div class="file-input-container" @click.stop="triggerFileInput">
          <button @click.stop type="button">Upload Csv File</button>
        </div>

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
            <button
              :style="{
                fontWeight:
                  temporaryDataTable?.tableName === dataTable.tableName ? 'bold' : 'normal'
              }"
              @click.stop="selectDataTable(dataTable)"
            >
              {{ dataTable.tableName }}
            </button>
          </li>

          <li v-if="heatmapStore.getAllDataTables.length === 0">
            You don't have any saved data tables
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
                  :checked="temporaryDataTable?.itemNamesColumnName === columnName"
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
                  :disabled="temporaryDataTable?.nanColumns.includes(columnName)"
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
  grid-template-columns: 1fr auto;
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