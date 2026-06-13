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
import type { useMainStore } from '@/stores/mainStore'

type MainStore = ReturnType<typeof useMainStore>

export interface LazyDatasetEntry {
  datasetName: string
  fileName: string
}

// Datasets that are too large to eagerly fetch + parse at startup
// (17 x ~19 MB SDG datasets). They show up in the dataset selectors and are
// loaded on first selection. `datasetName` must match the JSON's datasetName.
export const LAZY_DATASETS: LazyDatasetEntry[] = [
  { datasetName: 'SDG 1: No Poverty', fileName: 'SDG-01-Data.json' },
  { datasetName: 'SDG 2: Zero Hunger', fileName: 'SDG-02-Data.json' },
  { datasetName: 'SDG 3: Good Health and Well-Being', fileName: 'SDG-03-Data.json' },
  { datasetName: 'SDG 4: Quality Education', fileName: 'SDG-04-Data.json' },
  { datasetName: 'SDG 5: Gender Equality', fileName: 'SDG-05-Data.json' },
  { datasetName: 'SDG 6: Clean Water and Sanitation', fileName: 'SDG-06-Data.json' },
  { datasetName: 'SDG 7: Affordable and Clean Energy', fileName: 'SDG-07-Data.json' },
  { datasetName: 'SDG 8: Decent Work and Economic Growth', fileName: 'SDG-08-Data.json' },
  { datasetName: 'SDG 9: Industry, Innovation and Infrastructure', fileName: 'SDG-09-Data.json' },
  { datasetName: 'SDG 10: Reduced Inequalities', fileName: 'SDG-10-Data.json' },
  { datasetName: 'SDG 11: Sustainable Cities and Communities', fileName: 'SDG-11-Data.json' },
  { datasetName: 'SDG 12: Responsible Consumption and Production', fileName: 'SDG-12-Data.json' },
  { datasetName: 'SDG 13: Climate Action', fileName: 'SDG-13-Data.json' },
  { datasetName: 'SDG 14: Life Below Water', fileName: 'SDG-14-Data.json' },
  { datasetName: 'SDG 15: Life on Land', fileName: 'SDG-15-Data.json' },
  { datasetName: 'SDG 16: Peace, Justice and Strong Institutions', fileName: 'SDG-16-Data.json' },
  { datasetName: 'SDG 17: Partnerships for the Goals', fileName: 'SDG-17-Data.json' },
]

export function registerUploadedJsonData(
  mainStore: MainStore,
  uploadedJsonData: UploadedJsonData,
  fetchData = true,
) {
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

export async function fetchJsonDatasetFile(
  mainStore: MainStore,
  fileName: string,
  fetchData: boolean,
) {
  const response = await fetch(fileName)
  if (!response.ok) {
    throw new Error('Failed to fetch the JSON file.')
  }
  const jsonText = JSON.parse(await response.text())
  registerUploadedJsonData(mainStore, jsonText, fetchData)
}
