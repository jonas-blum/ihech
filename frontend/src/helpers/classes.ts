import { PixiRow, PixiRowLabel } from './PixiComponents'
import { useHeatmapStore } from '../stores/heatmapStore'
import { ColoringHeatmapEnum } from './helpers'

interface DimRedPosition {
  x: number
  y: number
}

export class Tree {
  root: AggregatedRow

  constructor(itemNameAndData: any) {
    this.root = this.buildTree(itemNameAndData) as AggregatedRow
  }

  buildTree(itemNameAndData: any, parent: Row | null = null): Row {
    let row: Row

    if (itemNameAndData.children) {
      // Create the row instance first, without children initially
      row = new AggregatedRow(
        itemNameAndData.itemName,
        itemNameAndData.data,
        { x: itemNameAndData.dimReductionX, y: itemNameAndData.dimReductionY },
        parent,
        -1, // Position will be set later
        -1, // Temporary depth, will be adjusted later
        null, // prevSibling will be set later
        null, // nextSibling will be set later
        itemNameAndData.isOpen,
        [], // Children will be set later
      )

      // Now create children, correctly passing `row` as the parent
      const children = itemNameAndData.children.map((child: any) => this.buildTree(child, row))
      // @ts-ignore - we can be sure that row is an AggregatedRow here and has a children property
      row.children = children // Assign children to the row after they've been created

      // Set prevSibling and nextSibling for each child
      for (let i = 0; i < children.length; i++) {
        if (i > 0) {
          children[i].prevSibling = children[i - 1]
        }
        if (i < children.length - 1) {
          children[i].nextSibling = children[i + 1]
        }
      }
    } else {
      row = new ItemRow(
        itemNameAndData.itemName,
        itemNameAndData.data,
        { x: itemNameAndData.dimReductionX, y: itemNameAndData.dimReductionY },
        [],
        parent,
        -1, // Position will be set later
        -1, // Temporary depth, will be adjusted later
        null, // prevSibling will be set later
        null, // nextSibling will be set later
      )
    }

    return row
  }

  toggleRowExpansion(row: AggregatedRow) {
    if (row.isOpen) {
      this.closeRow(row)
    } else {
      this.expandRow(row)
    }
  }

  expandRow(row: AggregatedRow) {
    row.open()
    this.updatePositionsAndDepth(row)
  }

  closeRow(row: AggregatedRow) {
    row.close()
    this.updatePositionsAndDepth(row)
  }

  updatePositionsAndDepth(startRow: Row = this.root) {
    let pointer: Row | null = startRow // By default start at the root, otherwise start traversal at the specified row
    let position = pointer.position
    let depth = pointer.depth

    while (pointer !== null) {
      pointer.setPosition(position)
      pointer.setDepth(depth)
      position++

      // Start traversal of the children if the current row is an aggregated row and is open
      if (pointer instanceof AggregatedRow && pointer.isOpen && pointer.hasChildren()) {
        pointer = pointer.findFirstChild()
        depth++
      } else {
        // Traverse to the next sibling, or backtrack to the parent if no siblings are available
        while (pointer.nextSibling === null && pointer.parent !== null) {
          pointer = pointer.parent
          depth--
        }
        // Move to the next sibling or set pointer to null if end of traversal
        pointer = pointer.nextSibling
      }
    }
  }

  getAllRows(): Row[] {
    const rows: Row[] = []
    let pointer: Row | null = this.root

    while (pointer !== null) {
      rows.push(pointer)

      // Traverse to the first child if there is one
      if (pointer instanceof AggregatedRow && pointer.hasChildren()) {
        pointer = pointer.findFirstChild()
      } else {
        // Move to the next sibling if possible
        while (pointer !== null && pointer.nextSibling === null) {
          pointer = pointer.parent // Backtrack to the parent when no next sibling
        }
        // Move to the next sibling if available
        if (pointer !== null) {
          pointer = pointer.nextSibling
        }
      }
    }

    return rows
  }

  getVisisbleRows(): Row[] {
    const rows: Row[] = []
    let pointer: Row | null = this.root

    while (pointer !== null) {
      rows.push(pointer)

      // Start traversal of the children if the current row is an aggregated row and is open
      if (pointer instanceof AggregatedRow && pointer.isOpen && pointer.hasChildren()) {
        pointer = pointer.findFirstChild()
      } else {
        // Traverse to the next sibling, or backtrack to the parent if no siblings are available
        while (pointer.nextSibling === null && pointer.parent !== null) {
          pointer = pointer.parent
        }
        // Move to the next sibling or set pointer to null if end of traversal
        pointer = pointer.nextSibling
      }
    }

    return rows
  }
}

export abstract class Row {
  name: string
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
    data: number[],
    dimRedPosition: DimRedPosition,
    parent: Row | null = null,
    position: number = 0,
    depth: number = 0,
    prevSibling: Row | null = null,
    nextSibling: Row | null = null,
  ) {
    this.name = name
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
    data: number[],
    dimRedPosition: DimRedPosition,
    children?: Row[],
    parent?: Row | null,
    position?: number,
    depth?: number,
    prevSibling?: Row | null,
    nextSibling?: Row | null,
  ) {
    super(name, data, dimRedPosition, parent, position, depth, prevSibling, nextSibling)
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
    super(name, data, dimRedPosition, parent, position, depth, prevSibling, nextSibling)
    this.isOpen = isOpen
    this.children = children
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

  hasChildren(): boolean {
    return this.children.length > 0
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
