import { Row, AggregateRow, ItemRow } from '@/classes/Row'
import { RowSorter } from '@/classes/RowSorter'
import {
  scaleSequential,
  scaleOrdinal,
  interpolateRainbow,
  schemePaired,
  schemeCategory10,
} from 'd3'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'

export class ItemTree {
  root: AggregateRow
  rowSorter: RowSorter
  // NOTE: to allow change detection in the sticky rows via shallow watchers, always replace the array instead of modifying it
  stickyRows: ItemRow[] = [] // for now we only allow sticky rows to be ItemRows; might change in the future
  maxDepth: number = 0 // keeps track of the maximum depth of the tree; used for several display purposes
  colorScheme: any
  rowsAsArray: Row[] = []

  constructor(itemNameAndData: any, rowSorter: RowSorter) {
    this.root = this.buildItemTree(itemNameAndData) as AggregateRow
    this.rowSorter = rowSorter
    // this.colorScheme = scaleSequential(interpolateRainbow)
    this.colorScheme = scaleOrdinal(schemeCategory10)

    this.sort()
    this.updatePositionsAndDepth()
    this.calculateMaxDepth()
    this.assignColorToTopLevelRows()

    this.rowsAsArray = this.getAllRows()
  }

  buildItemTree(itemNameAndData: any, parent: Row | null = null): Row {
    let row: Row

    if (itemNameAndData.children) {
      // Create the row instance first, without children initially
      row = new AggregateRow(
        itemNameAndData.itemName,
        itemNameAndData.amountOfDataPoints,
        itemNameAndData.data,
        { x: itemNameAndData.dimReductionX, y: itemNameAndData.dimReductionY },
        parent,
        itemNameAndData.isOpen, // NOTE: the backend impacts the initial state of the row (open/closed)
      )

      // Now create children, correctly passing `row` as the parent
      const children = itemNameAndData.children.map((child: any) => this.buildItemTree(child, row))
      // @ts-ignore - we can be sure that row is an AggregateRow here and has a children property
      row.children = children // Assign children to the row after they've been created

      // // Set prevSibling and nextSibling for each child
      // for (let i = 0; i < children.length; i++) {
      //   if (i > 0) {
      //     children[i].prevSibling = children[i - 1]
      //   }
      //   if (i < children.length - 1) {
      //     children[i].nextSibling = children[i + 1]
      //   }
      // }
    } else {
      row = new ItemRow(
        itemNameAndData.itemName,
        itemNameAndData.amountOfDataPoints,
        itemNameAndData.data,
        { x: itemNameAndData.dimReductionX, y: itemNameAndData.dimReductionY },
        parent,
      )
    }

    return row
  }

  toggleRowExpansion(row: AggregateRow) {
    if (row.isOpen) {
      this.closeRow(row)
    } else {
      this.expandRow(row)
    }
  }

  expandRow(row: AggregateRow) {
    row.open()
    this.updatePositionsAndDepth(row)

    // update the maxDepth if necessary
    if (row.depth >= this.maxDepth) {
      this.maxDepth = row.depth + 1
    }

    this.updateHeatmapVisibilityOfRows()
  }

  closeRow(row: AggregateRow) {
    row.close()
    this.updatePositionsAndDepth(row)

    // update the maxDepth if necessary
    // NOTE: I am not happy how inefficient this is, as we have to traverse the whole tree to find the new maxDepth
    //      but I don't see a better way right now
    this.calculateMaxDepth()

    this.updateHeatmapVisibilityOfRows()
  }

  calculateMaxDepth() {
    let maxDepth = 0
    this.getVisibleRows().forEach((row) => {
      if (row.depth > maxDepth) {
        maxDepth = row.depth
      }
    })
    this.maxDepth = maxDepth
  }

  updatePositionsAndDepth(startRow: Row = this.root) {
    let pointer: Row | null = startRow // By default start at the root, otherwise start traversal at the specified row
    let position = pointer.position
    let depth = pointer.depth

    if (pointer === this.root) {
      position = 0
      depth = 0
    }

    while (pointer !== null) {
      pointer.setPosition(position)
      pointer.setDepth(depth)
      position++

      // Start traversal of the children if the current row is an aggregated row and is open
      if (pointer instanceof AggregateRow && pointer.isOpen && pointer.hasChildren()) {
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

  // this function might be moved to the heatmapLayoutStore
  updateHeatmapVisibilityOfRows() {
    const heatmapLayoutStore = useHeatmapLayoutStore()
    const firstVisibleRowIndex = heatmapLayoutStore.firstVisibleRowIndex
    const lastVisibleRowIndex = heatmapLayoutStore.lastVisibleRowIndex
    this.rowsAsArray.forEach((row) => {
      row.setHeatmapVisibility(
        row.position !== -1 &&
          row.position >= firstVisibleRowIndex &&
          row.position <= lastVisibleRowIndex,
      )
    })
  }

  // NOTE: because I need access to all rows in a flat array quite often, maybe I should store them in a flat array for instant access without traversal
  getAllRows(): Row[] {
    const rows: Row[] = []
    let pointer: Row | null = this.root

    while (pointer !== null) {
      rows.push(pointer)

      // Traverse to the first child if there is one
      if (pointer instanceof AggregateRow && pointer.hasChildren()) {
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

  // "visible" in the sense of which rows are currently displayed in the heatmap
  getRowsVisibleInHeatmap(): Row[] {
    return this.rowsAsArray.filter((row) => row.heatmapVisibility)
  }

  // "visible" in the sense of  the data structure, not the rendering
  getVisibleRows(): Row[] {
    const rows: Row[] = []
    let pointer: Row | null = this.root

    while (pointer !== null) {
      rows.push(pointer)

      // Start traversal of the children if the current row is an aggregated row and is open
      if (pointer instanceof AggregateRow && pointer.isOpen && pointer.hasChildren()) {
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

  // NOTE: should only be called when the rowSorter changed! for other operations, the updatePositionsAndDepth method should be used
  // apply the rowSorter to all rows on the same depth level
  sort(parent: AggregateRow = this.root) {
    if (!parent.hasChildren()) {
      return
    }

    // Apply the rowSorter to get the sorted array of children
    const childrensSorted = this.rowSorter.sort(parent.children)

    // Set `prevSibling` and `nextSibling` pointers while looping through sorted children
    for (let i = 0; i < childrensSorted.length; i++) {
      const child = childrensSorted[i]

      // Set `prevSibling` and `nextSibling` for each child
      child.prevSibling = i > 0 ? childrensSorted[i - 1] : null
      child.nextSibling = i < childrensSorted.length - 1 ? childrensSorted[i + 1] : null

      // Recursively sort children if they are AggregateRows
      if (child instanceof AggregateRow) {
        this.sort(child as AggregateRow)
      }
    }
  }

  toggleStickyRow(row: ItemRow) {
    if (this.stickyRows.includes(row)) {
      this.removeStickyRow(row)
    } else {
      this.addStickyRow(row)
    }

    // sort the sticky
    this.rowSorter.sort(this.stickyRows)
  }

  addStickyRow(row: ItemRow) {
    this.stickyRows = [...this.stickyRows, row]
  }

  removeStickyRow(row: ItemRow) {
    const index = this.stickyRows.indexOf(row)
    if (index > -1) {
      this.stickyRows = [...this.stickyRows.slice(0, index), ...this.stickyRows.slice(index + 1)]
    }
  }

  getVisibleRowsCount(): number {
    return this.getVisibleRows().length
  }

  getAllRowsCount(): number {
    return this.rowsAsArray.length
  }

  expandAllRows() {
    // this.rowsAsArray.forEach((row) => {
    //   if (row instanceof AggregateRow && !row.isOpen) {
    //     this.expandRow(row)
    //   }
    // })

    this.rowsAsArray.forEach((row) => {
      if (row instanceof AggregateRow) {
        row.open()
      }
    })

    this.updatePositionsAndDepth()
    this.calculateMaxDepth()
    this.updateHeatmapVisibilityOfRows()
  }

  assignColorToTopLevelRows() {
    this.root.children.forEach((row, index) => {
      row.color = this.colorScheme(index / (this.root.children.length - 1))
    })
  }
}
