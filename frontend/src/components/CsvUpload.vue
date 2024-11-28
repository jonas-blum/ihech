<script setup lang="ts">
import { useMainStore } from '@/stores/mainStore'
import { onMounted, ref, watch } from 'vue'
import * as dataForge from 'data-forge'
import {
  ScalingEnum,
  DimReductionAlgoEnum,
  SortOrderAttributes,
  type CsvDataTableProfile,
  ColoringHeatmapEnum,
  getDistinctColor,
  CSV_UPLOAD_COLLAPSED_HEIGHT,
  CSV_UPLOAD_CONTENT_HEIGHT,
} from '@/helpers/helpers'
import SettingsIcon from '@assets/settings.svg'

const GAP_COLLAPSED_EXPANDED = 0
const PADDING_BOTTOM = 10

const CSV_UPLOAD_CONTENT_HEIGHT_FINAL =
  CSV_UPLOAD_CONTENT_HEIGHT - GAP_COLLAPSED_EXPANDED - PADDING_BOTTOM

const MAX_CELL_WIDTH = 300
const TABLE_PADDING = 10

const mainStore = useMainStore()

const hierarchyLayers: ('None' | number)[] = ['None', 1, 2, 3, 4]

const fileInput = ref<HTMLInputElement | null>(null)

const dataTablesList = ref<HTMLUListElement | null>(null)

function toggleAccordion() {
  mainStore.setCsvUploadOpen(!mainStore.isCsvUploadOpen)
}

function selectDataTable(dataTable: CsvDataTableProfile) {
  mainStore.setActiveDataTable(dataTable)
  mainStore.fetchData()
}
function triggerFileInput() {
  fileInput.value?.click()
  mainStore.setCsvUploadOpen(true)
}

function isNumeric(value: any): boolean {
  return !isNaN(parseFloat(value)) && isFinite(value)
}

function uploadCsvFileFromFile(contents: string, fileName: string, fetchData = true) {
  let df: dataForge.IDataFrame = dataForge
    .fromCSV(contents, { skipEmptyLines: true })
    .resetIndex()
    .bake()

  const firstRow = df.first()

  let numericColumns = []
  let nonNumericColumns = []

  for (const column of df.getColumnNames()) {
    const firstValue = firstRow[column]
    if (isNumeric(firstValue)) {
      numericColumns.push(column)
    } else {
      nonNumericColumns.push(column)
    }
  }

  df = df.subset(nonNumericColumns.concat(numericColumns))

  const csvFile = df.toCSV()
  let fileNameNoExtension = fileName.split('.').slice(0, -1).join('.')
  while (mainStore.getAllDataTableNames.includes(fileNameNoExtension)) {
    fileNameNoExtension = '1_' + fileNameNoExtension
    console.log(
      'File name already exists, adding 1 to the beginning of the file name',
      fileNameNoExtension,
    )
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
    sortOrderAttributes: SortOrderAttributes.HETEROGENIC,

    stickyItemIndexes: [],
    clusterItemsBasedOnStickyAttributes: false,

    clusterItemsByCollections: true,
    clusterAttributesByCollections: true,

    itemsClusterSize: 7,
    attributesClusterSize: -1,
    dimReductionAlgo: DimReductionAlgoEnum.PCA,
    clusterAfterDimRed: false,

    scaling: ScalingEnum.STANDARDIZING,

    coloringHeatmap: ColoringHeatmapEnum.ABSOLUTE,
  }

  mainStore.saveDataTable(newDataTable, fetchData)
}

function uploadCsvFile(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const contents = e.target?.result as string
    uploadCsvFileFromFile(contents, file.name)
  }
  reader.readAsText(file)
}

function getColumnCollectionHierarchy(columnName: string): 'None' | number {
  if (mainStore.getActiveDataTable === null) {
    return 'None'
  }
  const foundIndex = mainStore.getActiveDataTable.collectionColumnNames.indexOf(columnName)
  if (foundIndex === -1) {
    return 'None'
  } else {
    return foundIndex + 1
  }
}

function updateItemCollectionMap() {
  if (mainStore.getActiveDataTable === null) {
    return
  }
  if (mainStore.getActiveDataTable.collectionColumnNames.length === 0) {
    mainStore.getActiveDataTable.itemCollectionMap = {}
    return
  }

  const collectionColumnName = mainStore.getActiveDataTable.collectionColumnNames[0]

  const itemCollectionMap: Record<number, string> = {}
  mainStore.getActiveDataTable.df.forEach((row, index) => {
    itemCollectionMap[index] = row[collectionColumnName]
  })
  mainStore.getActiveDataTable.itemCollectionMap = itemCollectionMap
}

function resetFirstLayerCollectionNames() {
  if (mainStore.getActiveDataTable === null) {
    return
  }
  if (mainStore.getActiveDataTable.collectionColumnNames.length === 0) {
    mainStore.getActiveDataTable.firstLayerCollectionNames = []
    mainStore.getActiveDataTable.selectedFirstLayerCollections = []
    return
  }

  const collectionColumnName = mainStore.getActiveDataTable.collectionColumnNames[0]
  const newFirstLayerCollectionNames: string[] = []
  mainStore.getActiveDataTable.df.forEach((row, index) => {
    newFirstLayerCollectionNames.push(row[collectionColumnName])
  })
  const uniqueFirstLayerCollectionNames = [...new Set(newFirstLayerCollectionNames)]
  mainStore.getActiveDataTable.firstLayerCollectionNames = uniqueFirstLayerCollectionNames
  mainStore.getActiveDataTable.selectedFirstLayerCollections = uniqueFirstLayerCollectionNames
}

function resetCollectionColorMap(): void {
  if (mainStore.getActiveDataTable === null) {
    return
  }
  if (mainStore.getActiveDataTable.firstLayerCollectionNames.length === 0) {
    mainStore.getActiveDataTable.collectionColorMap = {}
    return
  }

  const colorMap: Record<string, string> = {}
  let index = 0
  mainStore.getActiveDataTable.firstLayerCollectionNames.forEach((collection) => {
    if (collection in colorMap) {
      return
    }
    colorMap[collection] = getDistinctColor(index)
    index++
  })
  mainStore.getActiveDataTable.collectionColorMap = colorMap
}

function handleHierarchyLayerInput(event: Event, columnName: string) {
  if (!(event.target instanceof HTMLSelectElement)) {
    console.error('Event target is not an HTMLSelectElement:', event.target)
    return
  }
  const selectedHierarchyLayer = event.target.value
  updateHierarchyLayer(selectedHierarchyLayer, columnName)
}

function updateHierarchyLayer(selectedHierarchyLayer: string, columnName: string) {
  if (mainStore.getActiveDataTable === null) {
    return
  }

  mainStore.getActiveDataTable.selectedAttributes =
    mainStore.getActiveDataTable.selectedAttributes.filter((attr) => attr !== columnName)

  if (selectedHierarchyLayer === 'None') {
    //Remove the column name from the collectionColumnNames array
    const foundIndex = mainStore.getActiveDataTable?.collectionColumnNames.indexOf(columnName)
    if (foundIndex !== undefined && foundIndex !== -1) {
      mainStore.getActiveDataTable?.collectionColumnNames.splice(foundIndex, 1)
    }
  } else {
    // Insert the column name at the selected hierarchy layer
    const hierarchyLayer = parseInt(selectedHierarchyLayer)
    const foundIndex = mainStore.getActiveDataTable?.collectionColumnNames.indexOf(columnName)
    if (foundIndex !== undefined && foundIndex !== -1) {
      mainStore.getActiveDataTable?.collectionColumnNames.splice(foundIndex, 1)
    }
    mainStore.getActiveDataTable?.collectionColumnNames.splice(hierarchyLayer - 1, 0, columnName)
  }
  if (mainStore.getActiveDataTable.collectionColumnNames.length > 4) {
    mainStore.getActiveDataTable.collectionColumnNames =
      mainStore.getActiveDataTable.collectionColumnNames.slice(0, 4)
  }
  resetFirstLayerCollectionNames()
  updateItemCollectionMap()
  resetCollectionColorMap()
  mainStore.updateSelectedItemIndexesBasedOnSelectedCollections()
  mainStore.setIsOutOfSync(true)
}

function updateItemNamesColumn(columName: string) {
  if (mainStore.getActiveDataTable === null) {
    return
  }
  mainStore.getActiveDataTable.itemNamesColumnName = columName
  mainStore.setIsOutOfSync(true)
}

function toggleAttribute(attribute: string) {
  if (mainStore.getActiveDataTable === null) return
  if (mainStore.getActiveDataTable.selectedAttributes.includes(attribute)) {
    mainStore.getActiveDataTable.selectedAttributes =
      mainStore.getActiveDataTable.selectedAttributes.filter((attr) => attr !== attribute)
  } else {
    mainStore.getActiveDataTable.selectedAttributes.push(attribute)
  }
  mainStore.setIsOutOfSync(true)
}

async function fetchCsvFileByFileName(fileName: string, fetchData: boolean) {
  const response = await fetch(fileName)
  if (!response.ok) {
    throw new Error('Failed to fetch the CSV file.')
  }
  const csvText = await response.text()
  uploadCsvFileFromFile(csvText, fileName, fetchData)
}

function focusActiveDataTable(scrollBehavior: ScrollBehavior = 'instant') {
  const activeDataTableName = mainStore.getActiveDataTable?.tableName
  if (activeDataTableName && dataTablesList.value) {
    const activeDataTableElement = dataTablesList.value.querySelector(
      `#dataTableEntry-${activeDataTableName}`,
    )
    if (activeDataTableElement) {
      activeDataTableElement.scrollIntoView({ behavior: scrollBehavior, block: 'end' })
    } else {
      console.error('DataTable element not found:', activeDataTableName)
    }
  }
}

onMounted(async () => {
  if (mainStore.getAllDataTableNames.length === 0) {
    // await fetchCsvFileByFileName('amount_different_attributes.csv', false)
    // updateHierarchyLayer('1', 'edition')
    // await fetchCsvFileByFileName('length_of_content_inside_tag.csv', false)
    // updateHierarchyLayer('1', 'edition')
    // await fetchCsvFileByFileName('tag_count.csv', false)
    // updateHierarchyLayer('1', 'edition')
    // await fetchCsvFileByFileName('tag_depth.csv', false)
    // updateHierarchyLayer('1', 'edition')
    // await fetchCsvFileByFileName('frauen_stimmbeteiligung.csv', false)
    // await fetchCsvFileByFileName('stadt_zuerich_abstimmungen.csv', false)
    // await fetchCsvFileByFileName('zeitreihen_parteien.csv', true)
    // await fetchCsvFileByFileName('2019_neue_fahrzeuge_absolute.csv', false)
    // updateHierarchyLayer('1', 'Kanton')
    // await fetchCsvFileByFileName('2019_neue_fahrzeuge_relative.csv', false)
    // updateHierarchyLayer('1', 'Kanton')
    // await fetchCsvFileByFileName('Beteiligung_in_Prozent_Volksabstimmungen.csv', false)
    // updateHierarchyLayer('1', 'Kanton')
    // await fetchCsvFileByFileName('Ja_in_Prozent_Volksabstimmungen.csv', false)
    // updateHierarchyLayer('1', 'Kanton')
    // await fetchCsvFileByFileName('2019_staatsangehörigkeit_absolute.csv', false)
    // updateHierarchyLayer('1', 'Kanton')
    // await fetchCsvFileByFileName('2019_staatsangehörigkeit_relative.csv', false)
    // updateHierarchyLayer('1', 'Kanton')
    // await fetchCsvFileByFileName('2019_altersklassen_absolute.csv', false)
    // updateHierarchyLayer('1', 'Kanton')
    // await fetchCsvFileByFileName('2019_altersklassen_relative.csv', false)
    // await fetchCsvFileByFileName('voting_Institution.csv', false)
    // updateHierarchyLayer('1', 'Sprachregion')
    // updateHierarchyLayer('2', 'Kanton')
    // await fetchCsvFileByFileName('DEBUG-voting_Institution.csv', false)
    // updateHierarchyLayer('1', 'Sprachregion')
    // updateHierarchyLayer('2', 'Kanton')
    // await fetchCsvFileByFileName('voting_Vote trigger.csv', false)
    // updateHierarchyLayer('1', 'Sprachregion')
    // updateHierarchyLayer('2', 'Kanton')
    // await fetchCsvFileByFileName('voting_Vote trigger actor.csv', false)
    // updateHierarchyLayer('1', 'Sprachregion')
    // updateHierarchyLayer('2', 'Kanton')
    // await fetchCsvFileByFileName('voting_Theme 1.csv', false)
    // updateHierarchyLayer('1', 'Sprachregion')
    // updateHierarchyLayer('2', 'Kanton')
    // await fetchCsvFileByFileName('voting_Theme 2.csv', false)
    // updateHierarchyLayer('1', 'Sprachregion')
    // updateHierarchyLayer('2', 'Kanton')
    // await fetchCsvFileByFileName('voting_Theme 3.csv', false)
    // updateHierarchyLayer('1', 'Sprachregion')
    // updateHierarchyLayer('2', 'Kanton')
    // await fetchCsvFileByFileName('2019_age_groups_2-layers.csv', false)
    // updateHierarchyLayer('1', 'Sprachregion')
    // updateHierarchyLayer('2', 'Kanton')
    // await fetchCsvFileByFileName('2019_age_groups_1-layer.csv', false)
    // updateHierarchyLayer('1', 'Sprachregion')
    // updateHierarchyLayer('2', 'Kanton')
    await fetchCsvFileByFileName('DEBUG-2019_age_groups_1-layer.csv', false)
    updateHierarchyLayer('1', 'Sprachregion')
    updateHierarchyLayer('2', 'Kanton')

    focusActiveDataTable('smooth')

    await mainStore.fetchData()
  } else {
    focusActiveDataTable()
  }
})
</script>

<template>
  <div class="box-content">
    <div class="collapse collapse-arrow bg-base-200">
      <input type="checkbox" class="hidden" v-model="mainStore.isCsvUploadOpen" />

      <div
        class="collapse-title"
        :style="{
          height: CSV_UPLOAD_COLLAPSED_HEIGHT + 'px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          overflow: 'hidden',
        }"
        @click.stop="toggleAccordion"
      >
        <div :style="{ display: 'flex', alignItems: 'center', gap: '20px' }">
          <div v-if="mainStore.isCsvUploadOpen">
            <button
              :style="{ width: '120px' }"
              class="btn btn-info"
              @click.stop="triggerFileInput"
              type="button"
            >
              Upload Csv File
            </button>

            <input
              type="file"
              ref="fileInput"
              @change="uploadCsvFile($event)"
              style="display: none"
            />
          </div>
        </div>
        <!-- <button class="btn btn-success" @click.stop="saveDataTable">Save Changes</button>
        <button class="btn btn-warning" @click.stop="discardChanges">Discard Changes</button> -->

        <h1
          v-if="mainStore.getActiveDataTable"
          class="font-bold text-2xl"
          :style="{
            overflow: 'hidden',
            textAlign: 'left',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            margin: '0px 30px',
          }"
        >
          {{ mainStore.getActiveDataTable?.tableName }}
        </h1>
      </div>

      <div
        :style="{
          marginTop: GAP_COLLAPSED_EXPANDED + 'px',
          paddingLeft: '0px',
          paddingBottom: PADDING_BOTTOM + 'px',
          marginBottom: '0px',
          height: CSV_UPLOAD_CONTENT_HEIGHT_FINAL + 'px',
        }"
        class="collapse-content content-grid"
        v-if="mainStore.isCsvUploadOpen"
        @click.stop
      >
        <div
          style="display: flex; flex-direction: column; width: 250px; gap: 5px; margin-top: 20px"
        >
          <h3 :style="{ height: '32px' }" class="text-2xl">Saved Data Tables:</h3>
          <ul
            ref="dataTablesList"
            :style="{
              display: 'flex',
              padding: '10px 0px',
              flexDirection: 'column',
              gap: '5px',
              height: CSV_UPLOAD_CONTENT_HEIGHT_FINAL - 32 - 5 - 20 - 20 - PADDING_BOTTOM + 'px',
              overflowY: 'auto',
            }"
          >
            <li
              :key="index"
              v-for="(dataTable, index) in mainStore.getAllDataTables"
              :id="`dataTableEntry-${dataTable.tableName}`"
            >
              <button
                :class="{
                  btn: true,
                  'btn-outline': true,
                  'btn-primary': true,
                  'btn-active': mainStore.getActiveDataTable?.tableName === dataTable.tableName,
                }"
                @click.stop="selectDataTable(dataTable)"
                :style="{ width: '220px' }"
              >
                <div
                  :style="{
                    overflow: 'hidden',
                    textAlign: 'left',
                    textOverflow: 'ellipsis',
                    width: '100%',
                  }"
                >
                  {{ dataTable.tableName }}
                </div>
              </button>
            </li>

            <li v-if="mainStore.getAllDataTables.length === 0">Upload a CSV File first</li>
          </ul>
        </div>
        <div
          v-if="mainStore.getActiveDataTable"
          :style="{
            flexDirection: 'column',
            display: 'flex',
          }"
        >
          <table class="data-table">
            <thead>
              <th
                :key="index"
                v-for="(columnName, index) in mainStore.getActiveDataTable?.df.getColumnNames()"
                :style="{
                  padding: TABLE_PADDING + 'px',
                }"
              >
                <div
                  :style="{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    maxWidth: MAX_CELL_WIDTH - 2 * TABLE_PADDING + 'px',
                  }"
                >
                  <div :style="{ zIndex: 99999 - index }" class="dropdown dropdown-end">
                    <div
                      :style="{
                        margin: '0px',
                        zIndex: 99999,
                      }"
                      class="m-1 btn"
                      tabindex="0"
                    >
                      <SettingsIcon :style="{ height: '15px', width: '15px' }" />
                    </div>

                    <ul
                      :style="{ width: '250px' }"
                      tabindex="0"
                      class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                    >
                      <li>
                        <div class="self-tooltip">
                          <span class="tooltiptext-right">
                            <div>
                              This setting decides which column will be used to name the individual
                              items.
                            </div>
                            <div>Only one column can be selected as the "Item Name Column".</div>
                          </span>
                          <a
                            :style="{
                              display: 'flex',
                              gap: '5px',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }"
                          >
                            <p>Item Name Column?</p>
                            <input
                              @click.stop="updateItemNamesColumn(columnName)"
                              type="checkbox"
                              class="toggle"
                              :checked="
                                mainStore.getActiveDataTable?.itemNamesColumnName === columnName
                              "
                            />
                          </a>
                        </div>
                      </li>

                      <li>
                        <div class="self-tooltip">
                          <span class="tooltiptext-right">
                            <div>
                              This setting decides which columns of the data table should be used as
                              the "Collection" columns
                            </div>
                            <div>
                              When enabling the setting "By collections" under "Items Grouping" the
                              items will first be grouped by the first "Hierarchy Layer" then by the
                              second, third and fourth.
                            </div>
                            <div>
                              The coloring of the items will be based on the first "Hierarchy
                              Layer".
                            </div>
                            <div>
                              When setting the "Hierarchy Layers" you can compare individual items
                              against entire collections and collections against other collections.
                              Additionally outliers inside a collection can be detected easily.
                            </div>
                          </span>
                          <a
                            :style="{
                              display: 'flex',
                              gap: '5px',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }"
                          >
                            <p>Hierarchy Layer:</p>
                            <select
                              @change="handleHierarchyLayerInput($event, columnName)"
                              @click.stop
                              class="select select-primary max-w-xs"
                            >
                              <option
                                :selected="
                                  getColumnCollectionHierarchy(columnName) === hierarchyLayer
                                "
                                v-for="hierarchyLayer in hierarchyLayers"
                                :key="hierarchyLayer"
                              >
                                {{ hierarchyLayer }}
                              </option>
                            </select>
                          </a>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div
                    :style="{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      maxWidth: MAX_CELL_WIDTH - 2 * TABLE_PADDING + 'px',
                    }"
                  >
                    <input
                      :style="{ width: '15px', height: '15px' }"
                      @click.stop="toggleAttribute(columnName)"
                      type="checkbox"
                      :checked="
                        mainStore.getActiveDataTable?.selectedAttributes.includes(columnName)
                      "
                      :disabled="
                        mainStore.getActiveDataTable?.collectionColumnNames.includes(columnName)
                      "
                    />
                    <div
                      :style="{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }"
                    >
                      {{ columnName }}
                    </div>
                  </div>
                </div>
              </th>
            </thead>
            <tbody>
              <tr
                :key="index"
                v-for="(row, index) in mainStore.getActiveDataTable?.df.head(5).toArray()"
                :style="{ maxWidth: MAX_CELL_WIDTH - 2 * TABLE_PADDING + 'px' }"
              >
                <td
                  :style="{ padding: TABLE_PADDING + 'px' }"
                  :key="index"
                  v-for="(value, index) in row"
                >
                  <div
                    :style="{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: MAX_CELL_WIDTH - 2 * TABLE_PADDING + 'px',
                    }"
                  >
                    {{ value }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
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
  top: -150%;
  left: 105%;
  text-wrap: pretty;
  hyphens: auto;
  font-size: 16px;
  font-weight: normal;

  position: absolute;
  z-index: 10000000;

  flex-direction: column;
  gap: 8px;
}

.self-tooltip:hover .tooltiptext-right {
  display: flex;
}

.content-grid {
  border-top: 1px solid black;
  margin-left: 10px;
  margin-right: 10px;

  display: grid;
  grid-template-columns: auto 1fr;
  gap: 50px;
  overflow-x: auto;
  overflow-y: hidden;
}

.data-table {
  border-collapse: collapse;
  border-spacing: 10px;
  td {
    vertical-align: top;
    max-height: 100px;
    overflow: hidden;
  }

  th,
  td {
    text-align: left;
    border-right: 1px solid black;
  }
  th {
    border-bottom: 3px solid black;
  }
  th:first-child,
  td:first-child {
    border-left: 1px solid black;
  }
  th:last-child,
  td:last-child {
    border-right: none;
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
