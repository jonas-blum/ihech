import { Column, AggregatedColumn, AttributeColumn } from "@/classes/Column"

export class AttributeTree {
  root: AggregatedColumn

  // TODO: for now I just roll with the current data structure. this will likely change later.
  constructor(
    attributeNames: string[],
    minAttributeValues: number[],
    maxAttributeValues: number[],
    attributeDissimilarities: number[],
  ) {
    this.root = new AggregatedColumn('age_groups')
    this.root.isOpen = true

    // TODO: this is just a hacky placeholder until the attributes are hierarchical
    // TODO: this.root = this.buildAttributeTree(...)
    let prevSibling: Column | null = null
    let nextSibling: Column | null = null
    for (let i = 0; i < attributeNames.length; i++) {
      const attributeColumn: AttributeColumn = new AttributeColumn(
        attributeNames[i],
        this.root,
        -1,
        -1,
        prevSibling,
        nextSibling,
      )
      if (prevSibling) {
        prevSibling.nextSibling = attributeColumn
      }
      prevSibling = attributeColumn
      this.root.children.push(attributeColumn)
    }
  }

  buildAttributeTree() {
    // TODO: will be needed once the attributes are hierarchical as well
  }

  toggleColumnExpansion(column: AggregatedColumn) {
    if (column.isOpen) {
      this.closeColumn(column)
    } else {
      this.expandColumn(column)
    }
  }

  expandColumn(column: AggregatedColumn) {
    column.open()
    this.updatePositionsAndDepth()
  }

  closeColumn(column: AggregatedColumn) {
    column.close()
    this.updatePositionsAndDepth()
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
      // TODO: decision: aggregated columns are not represented by a column. this feature would require a data structure change in the backend as well.
      // therefore we only increase the position if the current column is an AttributeColumn
      if (pointer instanceof AttributeColumn) {
        position++
      }

      // Start traversal of the children if the current column is an aggregated column and is open
      if (pointer instanceof AggregatedColumn && pointer.isOpen && pointer.hasChildren()) {
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

  getAllColumns(): Column[] {
    const columns: Column[] = []
    let pointer: Column | null = this.root

    while (pointer !== null) {
      columns.push(pointer)

      // Traverse to the first child if there is one
      if (pointer instanceof AggregatedColumn && pointer.hasChildren()) {
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
      if (pointer instanceof AggregatedColumn && pointer.isOpen && pointer.hasChildren()) {
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
}
