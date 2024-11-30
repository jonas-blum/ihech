import { Column, AggregateColumn, AttributeColumn } from '@/classes/Column'
import type { ColumnSorter } from '@/classes/ColumnSorter'
import type { HierarchicalAttribute } from '@/helpers/helpers'
import { useMainStore } from '@/stores/mainStore'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'

export class AttributeTree {
  root: AggregateColumn
  columnSorter: ColumnSorter
  // this mapping will allow the rows to do a O(1) lookup of the updated cell position
  // TODO: this mapping is updated every time the columns are reordered (??? necessary ???)
  originalIndexToColumn: Map<number, Column> = new Map()
  maxDepth: number = 0 // keeps track of the maximum depth of the tree; used for several display purposes
  columnsAsArray: Column[] = [] 

  // TODO: for now I just roll with the current data structure. this will likely change later.
  constructor(
    hierarchicalAttribute: HierarchicalAttribute,
    minAttributeValues: number[],
    maxAttributeValues: number[],
    attributeDissimilarities: number[],
    columnSorter: ColumnSorter,
  ) {
    this.root = this.buildAttributeTree(hierarchicalAttribute) as AggregateColumn
    this.columnSorter = columnSorter
    this.sort()
    this.columnsAsArray = this.getAllColumns()
  }

  buildAttributeTree(
    hierarchicalAttribute: HierarchicalAttribute,
    parent: Column | null = null,
  ): Column {
    let column: Column

    if (hierarchicalAttribute.children) {
      column = new AggregateColumn(
        hierarchicalAttribute.attributeName,
        hierarchicalAttribute.dataAttributeIndex,
        hierarchicalAttribute.std,
        hierarchicalAttribute.originalAttributeOrder,
        parent,
        hierarchicalAttribute.isOpen,
      )
      const children = hierarchicalAttribute.children.map((child: HierarchicalAttribute) =>
        this.buildAttributeTree(child, column),
      )
      // @ts-ignore - we can be sure that row is an AggregateRow here and has a children property
      column.children = children
    } else {
      column = new AttributeColumn(
        hierarchicalAttribute.attributeName,
        hierarchicalAttribute.dataAttributeIndex,
        hierarchicalAttribute.std,
        hierarchicalAttribute.originalAttributeOrder,
        parent,
      )
    }
    this.originalIndexToColumn.set(hierarchicalAttribute.dataAttributeIndex, column)
    return column
  }

  toggleColumnExpansion(column: AggregateColumn) {
    if (column.isOpen) {
      this.closeColumn(column)
    } else {
      this.expandColumn(column)
    }
    useMainStore().updateCellPositionsOfCurrentlyDisplayedRows()
  }

  expandColumn(column: AggregateColumn) {
    column.open()
    this.updatePositionsAndDepth()

    // Update the maxDepth if necessary
    if (column.depth >= this.maxDepth) {
      this.maxDepth = column.depth + 1
    }

    this.updateHeatmapVisibilityOfColumns()
  }

  closeColumn(column: AggregateColumn) {
    column.close()
    this.updatePositionsAndDepth()

    // update the maxDepth if necessary
    // NOTE: I am not happy how inefficient this is, as we have to traverse the whole tree to find the new maxDepth
    //      but I don't see a better way right now
    this.calculateMaxDepth()

    this.updateHeatmapVisibilityOfColumns()
  }

  calculateMaxDepth() {
    let maxDepth = 0
    this.getVisibleColumns().forEach((column) => {
      if (column.depth > maxDepth) {
        maxDepth = column.depth
      }
    })
    this.maxDepth = maxDepth
  }

  updatePositionsAndDepth(startColumn: Column = this.root) {
    let pointer: Column | null = startColumn // By default start at the root, otherwise start traversal at the specified column
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

      // Start traversal of the children if the current column is an aggregated column and is open
      if (pointer instanceof AggregateColumn && pointer.isOpen && pointer.hasChildren()) {
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
  updateHeatmapVisibilityOfColumns() {
    const heatmapLayoutStore = useHeatmapLayoutStore()
    const firstVisibleColumnIndex = heatmapLayoutStore.firstVisibleColumnIndex
    const lastVisibleColumnIndex = heatmapLayoutStore.lastVisibleColumnIndex
    this.columnsAsArray.forEach((column) => {
      column.setHeatmapVisibility(
        column.position !== -1 &&
          column.position >= firstVisibleColumnIndex &&
          column.position <= lastVisibleColumnIndex,
      )
    })
  }

  getAllColumns(): Column[] {
    const columns: Column[] = []
    let pointer: Column | null = this.root

    while (pointer !== null) {
      columns.push(pointer)

      // Traverse to the first child if there is one
      if (pointer instanceof AggregateColumn && pointer.hasChildren()) {
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

    return columns
  }

  getVisibleColumns(): Column[] {
    const columns: Column[] = []
    let pointer: Column | null = this.root

    while (pointer !== null) {
      columns.push(pointer)

      // Start traversal of the children if the current column is an aggregated column and is open
      if (pointer instanceof AggregateColumn && pointer.isOpen && pointer.hasChildren()) {
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

    return columns
  }

  getVisibleColumnsCount(): number {
    return this.getVisibleColumns().length
  }

  // NOTE: should only be called when the columnSorter changed! for other operations, the updatePositionsAndDepth method should be used
  // apply the columnSorter to all columns on the same depth level
  sort(parent: AggregateColumn = this.root) {
    if (!parent.hasChildren()) {
      return
    }

    // Apply the columnSorter to get the sorted array of children
    const childrenSorted = this.columnSorter.sort(parent.children)

    // Set `prevSibling` and `nextSibling` pointers while looping through sorted children
    for (let i = 0; i < childrenSorted.length; i++) {
      const child = childrenSorted[i]

      // Set `prevSibling` and `nextSibling` for each child
      child.prevSibling = i > 0 ? childrenSorted[i - 1] : null
      child.nextSibling = i < childrenSorted.length - 1 ? childrenSorted[i + 1] : null

      // Recursively sort children if they are AggregateColumns
      if (child instanceof AggregateColumn) {
        this.sort(child as AggregateColumn)
      }
    }
  }

  getAttributeCount(): number {
    // TODO: this might break if we introduce gaps (e.g. for aggregated columns)
    return this.originalIndexToColumn.size
  }

  expandAllColumns(column: Column = this.root) {
    if (column === this.root) {
      this.columnsAsArray.forEach((column) => {
        if (column instanceof AggregateColumn) {
          column.open()
        }
      })
    } else {
      if (column instanceof AggregateColumn) {
        column.openDeep()
      }
    }
    
    this.updatePositionsAndDepth()
    this.calculateMaxDepth()
    this.updateHeatmapVisibilityOfColumns()
    useMainStore().updateCellPositionsOfCurrentlyDisplayedRows()
  }
}
