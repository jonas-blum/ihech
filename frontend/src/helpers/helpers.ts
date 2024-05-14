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

export interface ItemNameAndData {
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

export interface CsvDataTable {
  tableName: string | null
  df: dataForge.IDataFrame<any, any>
  selectedAttributes: string[]
  selectedItemNameColumn: string | null
  collectionColumnNames: string[]
  collectionColorMap: Record<string, string>
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

export function findRowByName(row: ItemNameAndData, name: string): ItemNameAndData | null {
  if (row.itemName === name) {
    return row
  }

  if (row.children) {
    for (const child of row.children) {
      const found = findRowByName(child, name)
      if (found) {
        return found
      }
    }
  }

  return null
}
