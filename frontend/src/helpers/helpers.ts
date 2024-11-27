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
  '#6A5ACD', // SlateBlue (replaced Wheat)
  '#32CD32', // LimeGreen (replaced AntiqueWhite)
]

export const CSV_UPLOAD_COLLAPSED_HEIGHT = 60
export const CSV_UPLOAD_CONTENT_HEIGHT = 365
export const CSV_UPLOAD_EXPANDED_HEIGHT = CSV_UPLOAD_COLLAPSED_HEIGHT + CSV_UPLOAD_CONTENT_HEIGHT

export function getDistinctColor(index: number, colorList = COLORS): string {
  const newIndex = index % colorList.length
  const selectedColor = colorList[newIndex]

  return selectedColor
}

export function interpolateColor(
  minColor: number,
  maxColor: number,
  value: number,
  min: number,
  max: number,
): number {
  // Normalize `value` to a 0-1 range based on `min` and `max`
  const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)))

  // Extract RGB components from minColor
  const minR = (minColor >> 16) & 0xff
  const minG = (minColor >> 8) & 0xff
  const minB = minColor & 0xff

  // Extract RGB components from maxColor
  const maxR = (maxColor >> 16) & 0xff
  const maxG = (maxColor >> 8) & 0xff
  const maxB = maxColor & 0xff

  // Interpolate each color component based on normalizedValue
  const r = Math.round(minR + (maxR - minR) * normalizedValue)
  const g = Math.round(minG + (maxG - minG) * normalizedValue)
  const b = Math.round(minB + (maxB - minB) * normalizedValue)

  // Combine RGB components back into a single hex number
  return (r << 16) | (g << 8) | b
}

export function mapSortOderAttributesEnum(sortOrderAttributes: SortOrderAttributes): string {
  switch (sortOrderAttributes) {
    case SortOrderAttributes.HOMOGENIC:
      return 'Homogeneity'
    case SortOrderAttributes.HETEROGENIC:
      return 'Heterogeneity'
    case SortOrderAttributes.ASC:
      return 'Ascending'
    case SortOrderAttributes.DESC:
      return 'Descending'
    case SortOrderAttributes.ALPHABETICAL:
      return 'Alphabetical'
  }
}

export function mapScalingEnum(scaling: ScalingEnum): string {
  switch (scaling) {
    case ScalingEnum.NO_SCALING:
      return 'No Scaling'
    case ScalingEnum.STANDARDIZING:
      return 'Standardizing'
  }
}

export function mapDimReductionAlgoEnum(dimReductionAlgo: DimReductionAlgoEnum): string {
  switch (dimReductionAlgo) {
    case DimReductionAlgoEnum.PCA:
      return 'PCA'
    case DimReductionAlgoEnum.UMAP:
      return 'UMAP'
    case DimReductionAlgoEnum.TSNE:
      return 't-SNE'
  }
}

export function mapColoringHeatmapEnum(coloringHeatmap: ColoringHeatmapEnum): string {
  switch (coloringHeatmap) {
    case ColoringHeatmapEnum.ABSOLUTE:
      return 'Absolute'
    case ColoringHeatmapEnum.LOGARITHMIC:
      return 'Logarithmic'
    case ColoringHeatmapEnum.ITEM_RELATIVE:
      return 'Item Relative'
    case ColoringHeatmapEnum.ATTRIBUTE_RELATIVE:
      return 'Attribute Relative'
  }
}

export enum SortOrderAttributes {
  HETEROGENIC = 'HETEROGENIC',
  HOMOGENIC = 'HOMOGENIC',
  DESC = 'DESC',
  ASC = 'ASC',
  ALPHABETICAL = 'ALPHABETICAL',
}

export enum ScalingEnum {
  NO_SCALING = 'NO_SCALING',
  STANDARDIZING = 'STANDARDIZING',
}

export enum DimReductionAlgoEnum {
  PCA = 'PCA',
  TSNE = 'TSNE',
  UMAP = 'UMAP',
}

export enum ColoringHeatmapEnum {
  ABSOLUTE = 'ABSOLUTE',
  LOGARITHMIC = 'LOGARITHMIC',
  ITEM_RELATIVE = 'ITEM_RELATIVE',
  ATTRIBUTE_RELATIVE = 'ATTRIBUTE_RELATIVE',
}

export interface HierarchicalAttribute {
  attributeName: string
  dataAttributeIndex: number
  std: number
  originalAttributeOrder: number
  isOpen: boolean
  children: HierarchicalAttribute[] | null
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
  // pixiRow: PixiRow | null // maps 1:1 to PixiRow
}

export interface HeatmapJSON {
  attributeDissimilarities: number[]
  itemNamesAndData: ItemNameAndData[]
  hierarchicalAttributes: HierarchicalAttribute[]
  maxHeatmapValue: number
  minHeatmapValue: number
  maxAttributeValues: number[]
  minAttributeValues: number[]
}

export interface HeatmapSettings {
  csvFile: string

  hierarchicalRowsMetadataColumnNames: string[]
  hierarchicalColumnsMetadataRowIndexes: number[]

  selectedItemsRowIndexes: number[]
  selectedAttributesColumnNames: string[]

  stickyAttributesColumnNames: string[]
  sortAttributesBasedOnStickyItems: boolean
  sortOrderAttributes: SortOrderAttributes

  stickyItemsRowIndexes: number[]
  clusterItemsBasedOnStickyAttributes: boolean

  clusterItemsByCollections: boolean
  clusterAttributesByCollections: boolean

  itemsClusterSize: number
  attributesClusterSize: number
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

  clusterItemsByCollections: boolean
  clusterAttributesByCollections: boolean

  itemsClusterSize: number
  attributesClusterSize: number
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
