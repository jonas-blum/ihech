import { PixiColumnLabel } from '@/pixiComponents/PixiColumnLabel'

export abstract class Column {
  name: string
  originalIndex: number // corresponds to the 'index' in the backend data; useful for finding the correct PixiHeatmapCell in the PixiRow.pixiHeatmapCellsContainer
  standardDeviation: number // corresponds to the 'heterogeneity' in the backend data
  originalAttributeOrder: number
  parent: Column | null
  position: number = -1
  oldPosition: number = -1
  depth: number = -1
  prevSibling: Column | null = null
  nextSibling: Column | null = null
  pixiColumnLabel: PixiColumnLabel | null = null
  heatmapVisibility: boolean = false // whether the row is visible in the heatmap; used for culling

  protected constructor(
    name: string,
    originalIndex: number,
    originalAttributeOrder: number,
    standardDeviation: number,
    parent: Column | null = null,
  ) {
    this.name = name
    this.originalIndex = originalIndex
    this.originalAttributeOrder = originalAttributeOrder
    this.standardDeviation = standardDeviation
    this.parent = parent
  }

  abstract hasChildren(): boolean

  setPosition(position: number) {
    this.oldPosition = this.position
    this.position = position

    // rendering side effects
    this.pixiColumnLabel?.updateVisibility()
    this.pixiColumnLabel?.updatePosition()
  }

  setDepth(depth: number) {
    this.depth = depth

    // rendering side effects
    this.pixiColumnLabel?.updatePosition()
  }

  // TODO: Work in progress; for more efficient culling
  setHeatmapVisibility(visibility: boolean) {
    if (this.heatmapVisibility !== visibility) {
      console.log('setHeatmapVisibility', this.name, visibility)
      this.heatmapVisibility = visibility
      this.pixiColumnLabel?.updateVisibility()
    }
  }
}

export class AttributeColumn extends Column {
  constructor(
    name: string,
    originalIndex: number,
    originalAttributeOrder: number,
    standardDeviation: number,
    parent?: Column | null,
  ) {
    super(name, originalIndex, standardDeviation, originalAttributeOrder, parent)
  }

  hasChildren(): boolean {
    return false
  }
}

export class AggregatedColumn extends Column {
  isOpen: boolean
  children: Column[] = []

  constructor(
    name: string,
    originalIndex: number,
    originalAttributeOrder: number,
    standardDeviation: number,
    parent?: Column | null,
    isOpen: boolean = false,
  ) {
    super(name, originalIndex, standardDeviation, originalAttributeOrder, parent)
    this.isOpen = isOpen
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
   * @returns {Column | null} The first child if found, otherwise null.
   */
  findFirstChild(): Column | null {
    let pointer: Column | null = this.children[0]
    while (pointer !== null) {
      if (pointer.prevSibling === null) {
        return pointer
      }
      pointer = pointer.nextSibling
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
      if (child instanceof AggregatedColumn) {
        child.close()
      }
    })
  }
}
