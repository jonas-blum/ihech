import { PixiRow } from '@/pixiComponents/PixiRow'
import { PixiRowLabel } from '@/pixiComponents/PixiRowLabel'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { ColoringHeatmapEnum } from '@/helpers/helpers'

interface DimRedPosition {
    x: number
    y: number
  }

export abstract class Row {
    name: string
    totalChildrenCount: number // corresponds to the 'amountOfDataPoints' in the backend data
    data: number[]
    dataAdjusted: number[]
    dimRedPosition: DimRedPosition
    parent: Row | null
    position: number // position in the list of rows; -1 if not visible
    depth: number
    prevSibling: Row | null
    nextSibling: Row | null
    pixiRow: PixiRow | null // reference to the corresponding PixiRow for rendering
    pixiRowLabel: PixiRowLabel | null // reference to the corresponding PixiRowLabel for rendering
  
    protected constructor(
      name: string,
      totalChildrenCount: number,
      data: number[],
      dimRedPosition: DimRedPosition,
      parent: Row | null = null,
      position: number = -1,
      depth: number = -1,
      prevSibling: Row | null = null,
      nextSibling: Row | null = null,
    ) {
      this.name = name
      this.totalChildrenCount = totalChildrenCount
      this.data = data
      this.dataAdjusted = Row.computeAdjustedData(data)
      this.dimRedPosition = dimRedPosition
      this.parent = parent
      this.position = position
      this.depth = depth
      this.prevSibling = prevSibling
      this.nextSibling = nextSibling
      this.pixiRow = null
      this.pixiRowLabel = null
    }
  
    abstract hasChildren(): boolean
  
    static computeAdjustedData(data: number[]): number[] {
      if (
        useHeatmapStore()?.getActiveDataTable?.coloringHeatmap === ColoringHeatmapEnum.ITEM_RELATIVE
      ) {
        const maxValue = Math.max(...data)
        return data.map((value) => value / maxValue)
      } else if (
        useHeatmapStore()?.getActiveDataTable?.coloringHeatmap ===
        ColoringHeatmapEnum.ATTRIBUTE_RELATIVE
      ) {
        let adjustedData = []
        for (let i = 0; i < data.length; i++) {
          const minAttributeValue = useHeatmapStore()?.getMinAttributeValues[i]
          const maxAttributeValue = useHeatmapStore()?.getMaxAttributeValues[i]
          const difference =
            maxAttributeValue - minAttributeValue === 0 ? 1 : maxAttributeValue - minAttributeValue
          adjustedData.push((data[i] - minAttributeValue) / difference)
        }
        return adjustedData
      } else if (
        useHeatmapStore()?.getActiveDataTable?.coloringHeatmap === ColoringHeatmapEnum.LOGARITHMIC
      ) {
        return data.map((value) => Math.log(value + useHeatmapStore()?.getLogShiftValue))
      } else {
        return data
      }
    }
  
    setPosition(position: number) {
      this.position = position
  
      // rendering side effects
      this.pixiRow?.updatePosition()
      this.pixiRow?.updateVisibility()
      this.pixiRowLabel?.updatePosition()
      this.pixiRowLabel?.updateVisibility()
    }
  
    setDepth(depth: number) {
      this.depth = depth
  
      // rendering side effects
      this.pixiRow?.updatePosition()
      this.pixiRowLabel?.updatePosition()
    }
  }
  
  export class ItemRow extends Row {
    constructor(
      name: string,
      totalChildrenCount: number,
      data: number[],
      dimRedPosition: DimRedPosition,
      parent?: Row | null,
      position?: number,
      depth?: number,
      prevSibling?: Row | null,
      nextSibling?: Row | null,
    ) {
      super(name, totalChildrenCount, data, dimRedPosition, parent, position, depth, prevSibling, nextSibling)
    }
  
    hasChildren(): boolean {
      return false
    }
  }
  
  export class AggregatedRow extends Row {
    isOpen: boolean
    children: Row[]
  
    constructor(
      name: string,
      totalChildrenCount: number,
      data: number[],
      dimRedPosition: DimRedPosition,
      parent?: Row | null,
      position?: number,
      depth?: number,
      prevSibling?: Row | null,
      nextSibling?: Row | null,
      isOpen: boolean = false, // only used for aggregated rows
      children: Row[] = [],
    ) {
      super(name, totalChildrenCount, data, dimRedPosition, parent, position, depth, prevSibling, nextSibling)
      this.isOpen = isOpen
      this.children = children
    }
  
    hasChildren(): boolean {
      return this.children.length > 0
    }
  
    /**
     * Finds the "first" child in the list of children.
     *
     * This method traverses the linked list of children starting from the first child (which is not necessarily the first child in the display order)
     * and returns the first child that has no previous sibling.
     *
     * @returns {Row | null} The first child if found, otherwise null.
     */
    findFirstChild(): Row | null {
      let pointer: Row | null = this.children[0]
      while (pointer !== null) {
        if (pointer.prevSibling === null) {
          return pointer
        } else {
          pointer = pointer.prevSibling
        }
      }
      return null
    }
  
    open() {
      this.isOpen = true
    }
  
    close() {
      this.isOpen = false
      // Close all children
      this.children.forEach((child) => {
        // set position to -1 to not render it anymore
        child.setPosition(-1)
        if (child instanceof AggregatedRow) {
          // recursively close all children
          child.close()
        }
      })
    }
  }
  