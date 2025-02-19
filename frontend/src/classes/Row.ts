import { ColoringHeatmapEnum } from '@/helpers/helpers'
import { useMainStore } from '@/stores/mainStore'
import { PixiRow } from '@/pixiComponents/PixiRow'
import { PixiRowLabel } from '@/pixiComponents/PixiRowLabel'
import type { PixiBubble } from '@/pixiComponents/PixiBubble'

interface DimredPosition {
  x: number
  y: number
}

export abstract class Row {
  name: string
  totalChildrenCount: number // corresponds to the 'amountOfDataPoints' in the backend data
  data: number[]
  dataAdjusted: number[] = []
  dimredPosition: DimredPosition
  parent: Row | null
  position: number = -1 // position in the list of rows; -1 if not visible
  oldPosition: number = -1 // used for animations
  depth: number = -1 // indentation level in the tree
  color: number | null = null // color of the row; used for rendering
  prevSibling: Row | null = null
  nextSibling: Row | null = null
  pixiRow: PixiRow | null = null // reference to the corresponding PixiRow for rendering
  pixiRowLabel: PixiRowLabel | null = null // reference to the corresponding PixiRowLabel for rendering
  stickyPixiRow: PixiRow | null = null // reference to the corresponding (sticky!) PixiRow for rendering
  stickyPixiRowLabel: PixiRowLabel | null = null // reference to the corresponding (sticky!) PixiRowLabel for rendering
  pixiBubble: PixiBubble | null = null // reference to the corresponding PixiBubble for rendering
  heatmapVisibility: boolean = false // wheter the row is visible in the heatmap; used for culling

  protected constructor(
    name: string,
    totalChildrenCount: number,
    data: number[],
    dimredPosition: DimredPosition,
    parent: Row | null = null,
  ) {
    this.name = name
    this.totalChildrenCount = totalChildrenCount
    this.data = data
    this.computeAdjustedData()
    this.dimredPosition = dimredPosition
    this.parent = parent
  }

  abstract hasChildren(): boolean

  computeAdjustedData(): void {
    const data = this.data
    let dataAdjusted: number[] = []
    if (useMainStore()?.getActiveDataTable?.coloringHeatmap === ColoringHeatmapEnum.ITEM_RELATIVE) {
      const maxValue = Math.max(...data)
      dataAdjusted = data.map((value) => value / maxValue)
    } else if (
      useMainStore()?.getActiveDataTable?.coloringHeatmap === ColoringHeatmapEnum.ATTRIBUTE_RELATIVE
    ) {
      for (let i = 0; i < data.length; i++) {
        const minAttributeValue = useMainStore()?.getMinAttributeValues[i]
        const maxAttributeValue = useMainStore()?.getMaxAttributeValues[i]
        const difference =
          maxAttributeValue - minAttributeValue === 0 ? 1 : maxAttributeValue - minAttributeValue
        dataAdjusted.push((data[i] - minAttributeValue) / difference)
      }
    } else if (
      useMainStore()?.getActiveDataTable?.coloringHeatmap === ColoringHeatmapEnum.LOGARITHMIC
    ) {
      dataAdjusted = data.map((value) => Math.log(value + useMainStore()?.getLogShiftValue))
    } else {
      dataAdjusted = data
    }

    this.dataAdjusted = dataAdjusted
  }

  getName(): string {
    return this.name
  }

  setPosition(position: number) {
    this.oldPosition = this.position
    this.position = position

    // update the pixiRow rendering
    this.pixiRow?.updateVisibility()
    // this.pixiRow?.updatePosition()
    this.pixiRowLabel?.updateVisibility()
    this.pixiRowLabel?.updatePosition()

    // update the pixiBubble rendering
    this.pixiBubble?.updatePositionAndVisibility()
  }

  setDepth(depth: number) {
    this.depth = depth

    // update the pixiRow rendering
    this.pixiRow?.updatePosition()
    this.pixiRowLabel?.updatePosition()

    // update the pixiBubble rendering
    this.pixiBubble?.updateSize()
  }

  // TODO: Work in progress; for more efficient culling
  setHeatmapVisibility(visibility: boolean) {
    if (this.heatmapVisibility !== visibility) {
      this.heatmapVisibility = visibility
      this.pixiRow?.updateVisibility()
      this.pixiRow?.updateCellPositions(false)
      this.pixiRowLabel?.updateVisibility()
    }
  }

  getColor(): number {
    return this.color ?? this.parent?.getColor() ?? 0x000000
  }
}

export class ItemRow extends Row {
  selected: boolean = true // if not selected, the row (item) will be removed after next update

  constructor(
    name: string,
    totalChildrenCount: number,
    data: number[],
    dimredPosition: DimredPosition,
    selected: boolean,
    parent?: Row | null,
  ) {
    super(name, totalChildrenCount, data, dimredPosition, parent)
    this.selected = selected
  }

  hasChildren(): boolean {
    return false
  }

  setSelected(selected: boolean) {
    this.selected = selected

    if (this.selected) {
      // recursively increase the selectedChildrenCount of all parents
      let parent: Row | null = this.parent
      while (parent !== null) {
        if (parent instanceof AggregateRow) {
          parent.selectedChildrenCount++
          // also update the name of the parent
          parent.pixiRowLabel?.updateText()
        }
        parent = parent.parent
      }
    } else {
      // recursively decrease the selectedChildrenCount of all parents
      let parent: Row | null = this.parent
      while (parent !== null) {
        if (parent instanceof AggregateRow) {
          parent.selectedChildrenCount--
          // also update the name of the parent
          parent.pixiRowLabel?.updateText()
        }
        parent = parent.parent
      }
    }
    this.pixiRowLabel?.updateIcon()
  }

  toggleSelected() {
    this.setSelected(!this.selected)
  }

}

export class AggregateRow extends Row {
  isOpen: boolean
  children: Row[] = []
  childrenCount: number = 0 // number of ItemRow children (not AggregateRow children)
  selectedChildrenCount: number = 0 // number of selected ItemRow children

  constructor(
    name: string,
    totalChildrenCount: number,
    data: number[],
    dimredPosition: DimredPosition,
    parent?: Row | null,
    isOpen: boolean = false, // only used for aggregated rows
  ) {
    super(name, totalChildrenCount, data, dimredPosition, parent)
    this.isOpen = isOpen
  }

  getName(): string {
    // TODO
    // if the backend provided a name, use it because its a semantic cluster 
    if (this.name) {
      return this.name
    } else {
      return `${this.totalChildrenCount} ${useMainStore().getActiveDataTable?.itemNamePlural}`
    }
  }

  addChildren(children: Row[]) {
    this.children = children
    for (const child of children) {
      if (child instanceof ItemRow) {
        const increaseSelectedChildrenCount = child.selected

        this.childrenCount++
        if (increaseSelectedChildrenCount) {
          this.selectedChildrenCount++
        }

        // increase the selectedChildrenCount of all parents
        let parent: Row | null = this.parent
        while (parent !== null) {
          if (parent instanceof AggregateRow) {
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

  openDeep() {
    this.open()
    this.children.forEach((child) => {
      if (child instanceof AggregateRow) {
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
      if (child instanceof AggregateRow) {
        // recursively close all children
        child.close()
      }
    })
  }

  selectChildrenDeep() {
    this.children.forEach((child) => {
      if (child instanceof ItemRow && !child.selected) {
        child.setSelected(true)
      } else if (child instanceof AggregateRow) {
        child.selectChildrenDeep()
      }
    })
  }

  unselectChildrenDeep() {
    this.children.forEach((child) => {
      if (child instanceof ItemRow && child.selected) {
        child.setSelected(false)
      } else if (child instanceof AggregateRow) {
        child.unselectChildrenDeep()
      }
    })
  }
}
