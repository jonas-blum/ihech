import * as dataForge from 'data-forge'

export const COLORS = [
  '#FF0000', // Red
  '#0000FF', // Blue
  '#FF00FF', // Magenta
  '#800000', // Maroon
  '#808000', // Olive
  '#008000', // Green
  '#800080', // Purple
  '#008080', // Teal
  '#000080', // Navy
  '#FF4500', // OrangeRed
  '#FFD700', // Gold
  '#C71585', // MediumVioletRed
  '#DAA520', // GoldenRod
  '#4682B4', // SteelBlue
  '#9ACD32', // YellowGreen
  '#F5DEB3', // Wheat
  '#FAEBD7', // AntiqueWhite
]

export function getHeatmapColor(value: number, min: number, max: number) {
  const normalizedValue = (value - min) / (max - min)
  const l = 90 - normalizedValue * 65
  return `hsl(215, 100%, ${l}%)`
}

export function getDistinctColor(index: number, colorList = COLORS): string {
  const newIndex = index % colorList.length
  const selectedColor = colorList[newIndex]

  return selectedColor
}

export enum SortOrderAttributes {
  STDEV = 'STDEV',
  ASC = 'ASC',
  DESC = 'DESC',
  ALPHABETICAL = 'ALPHABETICAL',
}

export enum ScalingEnum {
  NO_SCALING = 'NO_SCALING',
  STANDARDIZING = 'STANDARDIZING',
}

export enum DimReductionAlgoEnum {
  PCA = 'PCA',
  UMAP = 'UMAP',
  TSNE = 'TSNE',
}

export enum ColoringHeatmapEnum {
  ABSOLUTE = 'ABSOLUTE',
  LOGARITHMIC = 'LOGARITHMIC',
  RELATIVE = 'RELATIVE',
}

export interface ItemNameAndData {
  index: number | null
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

  scaling: ScalingEnum
}

export interface CsvDataTableProfile {
  tableName: string | null
  df: dataForge.IDataFrame<any, any>

  nanColumns: string[]
  nonNanColumns: string[]

  collectionColorMap: Record<string, string>
  itemCollectionMap: Record<number, string>
  firstLayerCollectionNames: string[]
  selectedFirstLayerCollections: string[]

  showOnlyStickyItemsInDimReduction: boolean

  coloringHeatmap: ColoringHeatmapEnum

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

  scaling: ScalingEnum
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
