import * as dataForge from 'data-forge'

const COLORS_DISTINCT = ['darkGreen', 'purple']

export function getHeatmapColor(value: number, min: number, max: number) {
  const normalizedValue = (value - min) / (max - min)
  const l = 90 - normalizedValue * 65
  return `hsl(215, 100%, ${l}%)`
}

export function colorFromRangeDistinct(
  index: number,
  numColors: number,
  colorList = COLORS_DISTINCT
): string {
  const newIndex = index % colorList.length
  const selectedColor = colorList[newIndex]

  return selectedColor
}

export enum SortOrderAttributes {
  STDEV = 'STDEV',
  ASC = 'ASC',
  DESC = 'DESC',
  ALPHABETICAL = 'ALPHABETICAL'
}

export enum AbsRelLogEnum {
  REL = 'REL',
  ABS = 'ABS',
  LOG = 'LOG'
}

export enum DimReductionAlgoEnum {
  PCA = 'PCA',
  UMAP = 'UMAP',
  TSNE = 'TSNE'
}

export interface ItemNameAndData {
  index: number
  itemName: string
  isOpen: boolean
  data: number[]
  amountOfDataPoints: number
  dimReductionX: number
  dimReductionY: number
  children: ItemNameAndData[] | null

  parent: ItemNameAndData | null
  initial_data?: number[]
}

export interface HeatmapJSON {
  attributeNames: string[]
  attributeDissimilarities: number[]
  itemNamesAndData: ItemNameAndData[]
  maxHeatmapValue: number
  minHeatmapValue: number
  maxDimRedXValue: number
  minDimRedXValue: number
  maxDimRedYValue: number
  minDimRedYValue: number
}

export interface HeatmapSettings {
  csvFile: string

  itemNamesColumnName: string
  collectionColumnNames: string[]

  selectedItemIndexes: number[]
  selectedAttributes: string[]

  stickyAttributes: string[]
  sortAttributesBasedOnStickyItems: boolean
  sortOrderAttributes: SortOrderAttributes

  stickyItemIndexes: number[]
  clusterItemsBasedOnStickyAttributes: boolean

  clusterByCollections: boolean

  clusterSize: number
  dimReductionAlgo: DimReductionAlgoEnum
  clusterAfterDimRed: boolean

  absRelLog: AbsRelLogEnum
}

export interface CsvDataTableProfile {
  tableName: string | null
  df: dataForge.IDataFrame<any, any>

  nanColumns: string[]
  nonNanColumns: string[]

  collectionColorMap: Record<string, string>

  showOnlyStickyItemsInDimReduction: boolean

  //Settings for the backend
  csvFile: string

  itemNamesColumnName: string
  collectionColumnNames: string[]

  selectedItemIndexes: number[]
  selectedAttributes: string[]

  stickyAttributes: string[]
  sortAttributesBasedOnStickyItems: boolean
  sortOrderAttributes: SortOrderAttributes

  stickyItemIndexes: number[]
  clusterItemsBasedOnStickyAttributes: boolean

  clusterByCollections: boolean

  clusterSize: number
  dimReductionAlgo: DimReductionAlgoEnum
  clusterAfterDimRed: boolean

  absRelLog: AbsRelLogEnum
}

export function getDistinctEditionsOfRow(row: ItemNameAndData): Set<string> {
  const editions = new Set<string>()

  function traverse(node: ItemNameAndData) {
    if (!node.children) {
      editions.add(node.itemName.split('//')[0])
      return
    }

    node.children.forEach((child) => traverse(child))
  }

  traverse(row)
  return editions
}

export function findRowByIndex(row: ItemNameAndData, index: number): ItemNameAndData | null {
  if (row.index === index) {
    return row
  }

  if (row.children) {
    for (const child of row.children) {
      const found = findRowByIndex(child, index)
      if (found) {
        return found
      }
    }
  }

  return null
}
