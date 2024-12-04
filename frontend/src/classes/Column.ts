import { PixiColumnLabel } from '@/pixiComponents/PixiColumnLabel'
import { useMainStore } from '@/stores/mainStore'

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

  getName(): string {
    return this.name
  }

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
      this.heatmapVisibility = visibility
      this.pixiColumnLabel?.updateVisibility()
    }
  }
}

export class AttributeColumn extends Column {
  selected: boolean = true // if not selected, the column (attribute) is not considered for the dimred calculation

  constructor(
    name: string,
    originalIndex: number,
    originalAttributeOrder: number,
    standardDeviation: number,
    selected: boolean,
    parent?: Column | null,
  ) {
    super(name, originalIndex, standardDeviation, originalAttributeOrder, parent)
    this.selected = selected
  }

  hasChildren(): boolean {
    return false
  }

  setSelected(selected: boolean) {
    this.selected = selected

    if (this.selected) {
      // recursively increase the selectedChildrenCount of all parents
      let parent: Column | null = this.parent
      while (parent !== null) {
        if (parent instanceof AggregateColumn) {
          parent.selectedChildrenCount++
          // also update the name of the parent
          parent.pixiColumnLabel?.updateText()
        }
        parent = parent.parent
      }
    } else {
      // recursively decrease the selectedChildrenCount of all parents
      let parent: Column | null = this.parent
      while (parent !== null) {
        if (parent instanceof AggregateColumn) {
          parent.selectedChildrenCount--
          parent.pixiColumnLabel?.updateText()
        }
        parent = parent.parent
      }
    }
    this.pixiColumnLabel?.updateIcon()
  }

  toggleSelected() {
    this.setSelected(!this.selected)
  }
}

export class AggregateColumn extends Column {
  isOpen: boolean
  children: Column[] = []
  childrenCount: number = 0 // number of AttributeColumn children (not AggregateColumn children)
  selectedChildrenCount: number = 0 // number of selected AttributeColumn children

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

  getName(): string {
    // if the backend provided a name, use it because its a semantic cluster
    if (this.name) {
      return `${this.name} (${this.selectedChildrenCount} / ${this.childrenCount})`
    } else {
      return `${this.childrenCount} ${useMainStore().getActiveDataTable?.attributeNamePlural}`
    }
  }

  addChildren(children: Column[]) {
    this.children = children
    for (const child of children) {
      if (child instanceof AttributeColumn) {
        const increaseSelectedChildrenCount = child.selected

        this.childrenCount++
        if (increaseSelectedChildrenCount) {
          this.selectedChildrenCount++
        }

        // increase the counts of the parents as well
        let parent: Column | null = this.parent
        while (parent !== null) {
          if (parent instanceof AggregateColumn) {
            parent.childrenCount++
            if (increaseSelectedChildrenCount) {
              parent.selectedChildrenCount++
            }
          }
          parent = parent.parent
        }
      }
    }
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

  openDeep() {
    this.open()
    this.children.forEach((child) => {
      if (child instanceof AggregateColumn) {
        child.openDeep()
      }
    })
  }

  close() {
    this.isOpen = false
    // Close all children
    this.children.forEach((child) => {
      // set position to -1 to not render it anymore
      child.setPosition(-1)
      if (child instanceof AggregateColumn) {
        child.close()
      }
    })
  }

  selectChildrenDeep() {
    this.children.forEach((child) => {
      if (child instanceof AttributeColumn && !child.selected) {
        child.setSelected(true)
      } else if (child instanceof AggregateColumn) {
        child.selectChildrenDeep()
      }
    })
  }

  unselectChildrenDeep() {
    this.children.forEach((child) => {
      if (child instanceof AttributeColumn && child.selected) {
        child.setSelected(false)
      } else if (child instanceof AggregateColumn) {
        child.unselectChildrenDeep()
      }
    })
  }
}
