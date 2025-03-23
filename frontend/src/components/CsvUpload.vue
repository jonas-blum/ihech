<script setup lang="ts">
import { useMainStore } from '@/stores/mainStore'
import { onMounted } from 'vue'
import * as dataForge from 'data-forge'
import {
  ScalingEnum,
  DimReductionAlgoEnum,
  SortOrderAttributes,
  type JsonDataTableProfile,
  ColoringHeatmapEnum,
  type IndexLabelInterface,
  type UploadedJsonData,
} from '@/helpers/helpers'


const mainStore = useMainStore()

function uploadJsonFileFromFile(uploadedJsonData: UploadedJsonData, fetchData = true) {
  let df: dataForge.IDataFrame = dataForge
    .fromCSV(uploadedJsonData.csvFile, { skipEmptyLines: true })
    .resetIndex()
    .bake()

  const csvFile = df.toCSV()

  const itemNameColumnName = df.getColumnNames()[0]
  const rowsBeforeFirstEmptyRow: IndexLabelInterface[] = []

  let selectRow = true
  for (const [rowIndex, row] of df.toPairs()) {
    if (Object.values(row).find((cell) => cell !== '') === undefined) {
      break
    }
    rowsBeforeFirstEmptyRow.push({
      index: rowIndex,
      label: row[itemNameColumnName],
      selected: selectRow,
    })
    selectRow = false
  }

  let columnNamesBeforeFirstEmptyColumn: IndexLabelInterface[] = []
  let notYetSkippedFirstColumn = true
  let selectColumn = true
  let i = 0
  for (const column of df.getColumns()) {
    if (notYetSkippedFirstColumn === true) {
      notYetSkippedFirstColumn = false
      continue
    }
    if (column.series.toArray().find((cell) => cell !== '') === undefined) {
      break
    }
    columnNamesBeforeFirstEmptyColumn.push({
      index: i++,
      label: column.name,
      selected: selectColumn,
    })
    selectColumn = false
  }

  const newDataTable: JsonDataTableProfile = {
    ...uploadedJsonData,
    df: df,

    collectionColorMap: {},
    itemCollectionMap: {},
    firstLayerCollectionNames: [],
    selectedFirstLayerCollections: [],

    showOnlyStickyItemsInDimReduction: false,

    csvFile: csvFile,

    itemNamesColumnName: df.getColumnNames()[0],
    hierarchicalRowsMetadataColumnNames: columnNamesBeforeFirstEmptyColumn,
    hierarchicalColumnsMetadataRowIndexes: rowsBeforeFirstEmptyRow,

    allRowIndexes: df.getIndex().toArray(),
    allColumnNames: df.getColumnNames(),

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

    itemAggregateMethod: 'mean',
    attributeAggregateMethod: 'mean',

    scaling: ScalingEnum.STANDARDIZING,

    coloringHeatmap: ColoringHeatmapEnum.ABSOLUTE,
  }

  mainStore.saveDataTable(newDataTable, fetchData)
}

function uploadJsonFile(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const contents = JSON.parse(e.target?.result as string)
    uploadJsonFileFromFile(contents)
  }
  reader.readAsText(file)
}

async function fetchJsonFileByFileName(fileName: string, fetchData: boolean) {
  const response = await fetch(fileName)
  if (!response.ok) {
    throw new Error('Failed to fetch the JSON file.')
  }
  const jsonText = JSON.parse(await response.text())
  uploadJsonFileFromFile(jsonText, fetchData)
}

onMounted(async () => {
  if (mainStore.getAllDatasetNames.length === 0) {
    // await fetchJsonFileByFileName('Age-Groups.json', false)
    // await fetchJsonFileByFileName('Voting-Data.json', false)
    // await fetchJsonFileByFileName('Chess-Data.json', false)
    // await fetchJsonFileByFileName('Chess-Data-Black.json', false)
    await fetchJsonFileByFileName('DEBUG-Data.json', false)
    // await fetchJsonFileByFileName('Chess-Data-White.json', false)
    // await fetchJsonFileByFileName('TEI-Data.json', false)
    await fetchJsonFileByFileName('Voting-Data-NEW.json', false)
    await mainStore.fetchData()
  }
})
</script>

<template>
</template>

<style scoped>
</style>
