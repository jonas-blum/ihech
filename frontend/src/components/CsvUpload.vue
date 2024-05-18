<script setup lang="ts">
import { useHeatmapStore } from '@/stores/heatmapStore'
import { ref, watch } from 'vue'
import * as dataForge from 'data-forge'
import {
  ScalingEnum,
  DimReductionAlgoEnum,
  SortOrderAttributes,
  type CsvDataTableProfile,
  ColoringHeatmapEnum,
  getDistinctColor,
} from '@/helpers/helpers'
import SettingsIcon from '@assets/settings.svg'

const heatmapStore = useHeatmapStore()

const isOpen = ref(true)

const hierarchyLayers: ('None' | number)[] = ['None', 1, 2, 3, 4]

const fileInput = ref<HTMLInputElement | null>(null)

const oldStateDataTable = ref<CsvDataTableProfile | null>(null)

function toggleAccordion() {
  isOpen.value = !isOpen.value
}

function selectDataTable(dataTable: CsvDataTableProfile) {
  heatmapStore.setActiveDataTable(dataTable)
  heatmapStore.fetchHeatmap()
}
function triggerFileInput() {
  fileInput.value?.click()
  isOpen.value = true
}

function uploadCsvFile(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const contents = e.target?.result as string
    const df: dataForge.IDataFrame = dataForge
      .fromCSV(contents, { skipEmptyLines: true })
      .resetIndex()
      .bake()

    const csvFile = df.toCSV()
    let fileNameNoExtension = file.name.split('.').slice(0, -1).join('.')
    while (heatmapStore.getAllDataTableNames.includes(fileNameNoExtension)) {
      fileNameNoExtension = '_1' + fileNameNoExtension
    }

    const newDataTable: CsvDataTableProfile = {
      tableName: fileNameNoExtension,
      df: df,

      nanColumns: [],
      nonNanColumns: [],

      collectionColorMap: {},
      itemCollectionMap: {},
      firstLayerCollectionNames: [],
      selectedFirstLayerCollections: [],

      showOnlyStickyItemsInDimReduction: false,

      csvFile: csvFile,

      itemNamesColumnName: df.getColumnNames()[0],
      collectionColumnNames: [],

      selectedItemIndexes: df.getIndex().toArray(),
      selectedAttributes: df.getColumnNames(),

      stickyAttributes: [],
      sortAttributesBasedOnStickyItems: false,
      sortOrderAttributes: SortOrderAttributes.STDEV,

      stickyItemIndexes: [],
      clusterItemsBasedOnStickyAttributes: false,

      clusterByCollections: false,

      clusterSize: 6,
      dimReductionAlgo: DimReductionAlgoEnum.PCA,
      clusterAfterDimRed: true,

      scaling: ScalingEnum.STANDARDIZING,

      coloringHeatmap: ColoringHeatmapEnum.ABSOLUTE,
    }
    console.log(newDataTable)
    heatmapStore.saveDataTable(newDataTable)
  }
  reader.readAsText(file)
}

function saveDataTable() {
  if (heatmapStore.getActiveDataTable === null) {
    return
  }
  heatmapStore.saveDataTable(heatmapStore.getActiveDataTable)
}

function toggleAttribute(attribute: string) {
  if (heatmapStore.getActiveDataTable === null) return
  if (heatmapStore.getActiveDataTable.selectedAttributes.includes(attribute)) {
    heatmapStore.getActiveDataTable.selectedAttributes =
      heatmapStore.getActiveDataTable.selectedAttributes.filter((attr) => attr !== attribute)
  } else {
    heatmapStore.getActiveDataTable.selectedAttributes.push(attribute)
  }
}

function getColumnCollectionHierarchy(columnName: string): 'None' | number {
  if (heatmapStore.getActiveDataTable === null) {
    return 'None'
  }
  const foundIndex = heatmapStore.getActiveDataTable.collectionColumnNames.indexOf(columnName)
  if (foundIndex === -1) {
    return 'None'
  } else {
    return foundIndex + 1
  }
}

function updateItemCollectionMap() {
  if (heatmapStore.getActiveDataTable === null) {
    return
  }
  if (heatmapStore.getActiveDataTable.collectionColumnNames.length === 0) {
    heatmapStore.getActiveDataTable.itemCollectionMap = {}
    return
  }

  const collectionColumnName = heatmapStore.getActiveDataTable.collectionColumnNames[0]

  const itemCollectionMap: Record<number, string> = {}
  heatmapStore.getActiveDataTable.df.forEach((row, index) => {
    itemCollectionMap[index] = row[collectionColumnName]
  })
  heatmapStore.getActiveDataTable.itemCollectionMap = itemCollectionMap
}

function resetFirstLayerCollectionNames() {
  if (heatmapStore.getActiveDataTable === null) {
    return
  }
  if (heatmapStore.getActiveDataTable.collectionColumnNames.length === 0) {
    heatmapStore.getActiveDataTable.firstLayerCollectionNames = []
    heatmapStore.getActiveDataTable.selectedFirstLayerCollections = []
    return
  }

  const collectionColumnName = heatmapStore.getActiveDataTable.collectionColumnNames[0]
  const newFirstLayerCollectionNames: string[] = []
  heatmapStore.getActiveDataTable.df.forEach((row, index) => {
    newFirstLayerCollectionNames.push(row[collectionColumnName])
  })
  const uniqueFirstLayerCollectionNames = [...new Set(newFirstLayerCollectionNames)]
  heatmapStore.getActiveDataTable.firstLayerCollectionNames = uniqueFirstLayerCollectionNames
  heatmapStore.getActiveDataTable.selectedFirstLayerCollections = uniqueFirstLayerCollectionNames
}

function resetCollectionColorMap(): void {
  if (heatmapStore.getActiveDataTable === null) {
    return
  }
  if (heatmapStore.getActiveDataTable.firstLayerCollectionNames.length === 0) {
    heatmapStore.getActiveDataTable.collectionColorMap = {}
    return
  }

  const colorMap: Record<string, string> = {}
  let index = 0
  heatmapStore.getActiveDataTable.firstLayerCollectionNames.forEach((collection) => {
    if (collection in colorMap) {
      return
    }
    colorMap[collection] = getDistinctColor(index)
    index++
  })
  heatmapStore.getActiveDataTable.collectionColorMap = colorMap
}

function updateHierarchyLayer(event: Event, columnName: string) {
  if (!(event.target instanceof HTMLSelectElement)) {
    console.error('Event target is not an HTMLSelectElement:', event.target)
    return
  }
  const selectedHierarchyLayer = event.target.value

  if (heatmapStore.getActiveDataTable === null) {
    return
  }

  heatmapStore.getActiveDataTable.selectedAttributes =
    heatmapStore.getActiveDataTable.selectedAttributes.filter((attr) => attr !== columnName)

  if (selectedHierarchyLayer === 'None') {
    //Remove the column name from the collectionColumnNames array
    const foundIndex = heatmapStore.getActiveDataTable?.collectionColumnNames.indexOf(columnName)
    if (foundIndex !== undefined && foundIndex !== -1) {
      heatmapStore.getActiveDataTable?.collectionColumnNames.splice(foundIndex, 1)
    }
  } else {
    // Insert the column name at the selected hierarchy layer
    const hierarchyLayer = parseInt(selectedHierarchyLayer)
    const foundIndex = heatmapStore.getActiveDataTable?.collectionColumnNames.indexOf(columnName)
    if (foundIndex !== undefined && foundIndex !== -1) {
      heatmapStore.getActiveDataTable?.collectionColumnNames.splice(foundIndex, 1)
    }
    heatmapStore.getActiveDataTable?.collectionColumnNames.splice(hierarchyLayer - 1, 0, columnName)
  }
  if (heatmapStore.getActiveDataTable.collectionColumnNames.length > 4) {
    heatmapStore.getActiveDataTable.collectionColumnNames =
      heatmapStore.getActiveDataTable.collectionColumnNames.slice(0, 4)
  }
  resetFirstLayerCollectionNames()
  updateItemCollectionMap()
  resetCollectionColorMap()
  heatmapStore.updateSelectedItemIndexesBasedOnSelectedCollections()
}

function updateItemNamesColumn(columName: string) {
  if (heatmapStore.getActiveDataTable === null) {
    return
  }
  heatmapStore.getActiveDataTable.itemNamesColumnName = columName
}

function discardChanges() {
  resetToOldStateDataTable()
}

function resetToOldStateDataTable() {
  if (oldStateDataTable.value === null) {
    return
  }
  heatmapStore.setActiveDataTable(oldStateDataTable.value)
}

function copyDataTableState() {
  if (heatmapStore.getActiveDataTable === null) {
    oldStateDataTable.value = null
  } else {
    const copiedItemCollectionMap: Record<number, string> = {}
    for (const key in heatmapStore.getActiveDataTable.itemCollectionMap) {
      copiedItemCollectionMap[key] = heatmapStore.getActiveDataTable.itemCollectionMap[key]
    }

    oldStateDataTable.value = {
      tableName: heatmapStore.getActiveDataTable.tableName,
      df: heatmapStore.getActiveDataTable.df,

      nanColumns: [...heatmapStore.getActiveDataTable.nanColumns],
      nonNanColumns: [...heatmapStore.getActiveDataTable.nonNanColumns],

      collectionColorMap: { ...heatmapStore.getActiveDataTable.collectionColorMap },
      itemCollectionMap: copiedItemCollectionMap,
      firstLayerCollectionNames: [...heatmapStore.getActiveDataTable.firstLayerCollectionNames],
      selectedFirstLayerCollections: [
        ...heatmapStore.getActiveDataTable.selectedFirstLayerCollections,
      ],

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

      scaling: heatmapStore.getActiveDataTable.scaling,

      coloringHeatmap: heatmapStore.getActiveDataTable.coloringHeatmap,
    }
  }
}

watch(
  () => heatmapStore.getActiveDataTable,
  () => {
    copyDataTableState()
  },
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
            padding: '5px',
          }"
        >
          <li :key="index" v-for="(dataTable, index) in heatmapStore.getAllDataTables">
            <button
              :style="{
                fontWeight:
                  heatmapStore.getActiveDataTable?.tableName === dataTable.tableName
                    ? 'bold'
                    : 'normal',
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
      <div
        :style="{
          display: heatmapStore.getActiveDataTable ? 'flex' : 'none',
          flexDirection: 'column',
        }"
      >
        <div
          style="
            display: grid;
            gap: 10px;
            grid-template-columns: 1fr 1fr auto 1fr 1fr;
            margin-right: auto;
          "
        >
          <button class="btn-success" @click.stop="saveDataTable">Save Changes</button>
          <button class="btn-warning" @click.stop="discardChanges">Discard Changes</button>
          <h1 :style="{ fontSize: '25px', fontWeight: 'bold', marginLeft: '20px' }">
            {{ heatmapStore.getActiveDataTable?.tableName }}
          </h1>
          <div></div>
          <div></div>
        </div>
        <table class="data-table">
          <thead>
            <th
              :key="index"
              v-for="(columnName, index) in heatmapStore.getActiveDataTable?.df.getColumnNames()"
            >
              <div :style="{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }">
                <details @click.stop class="dropdown">
                  <summary
                    :style="{
                      margin: '0px',
                      zIndex: 99999,
                    }"
                    class="m-1 btn"
                  >
                    <SettingsIcon :style="{ height: '15px', width: '15px' }" />
                  </summary>
                  <ul
                    :style="{ width: '250px' }"
                    class="p-2 shadow menu dropdown-content z-[1] bg-base-100 rounded-box w-52"
                  >
                    <li>
                      <a :style="{ display: 'flex', gap: '5px' }">
                        <p>Item Name Column?</p>
                        <input
                          @click.stop="updateItemNamesColumn(columnName)"
                          type="checkbox"
                          class="toggle"
                          :checked="
                            heatmapStore.getActiveDataTable?.itemNamesColumnName === columnName
                          "
                        />
                      </a>
                    </li>
                    <li>
                      <a :style="{ display: 'flex', gap: '5px' }">
                        <p>Set hierarchy Layer:</p>
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
                      </a>
                    </li>
                  </ul>
                </details>

                <div :style="{ display: 'flex', gap: '5px' }">
                  <input
                    @click.stop="toggleAttribute(columnName)"
                    type="checkbox"
                    :checked="
                      heatmapStore.getActiveDataTable?.selectedAttributes.includes(columnName)
                    "
                    :disabled="
                      heatmapStore.getActiveDataTable?.collectionColumnNames.includes(columnName)
                    "
                  />
                  <div>
                    {{ columnName }}
                  </div>
                </div>
              </div>
            </th>
          </thead>
          <tbody>
            <tr
              :key="index"
              v-for="(row, index) in heatmapStore.getActiveDataTable?.df.head(5).toArray()"
            >
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
