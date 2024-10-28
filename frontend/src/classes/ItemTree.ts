import { Row, AggregatedRow, ItemRow } from '@/classes/Row'

export class ItemTree {
  root: AggregatedRow

  constructor(itemNameAndData: any) {
    this.root = this.buildItemTree(itemNameAndData) as AggregatedRow
  }

  buildItemTree(itemNameAndData: any, parent: Row | null = null): Row {
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
      const children = itemNameAndData.children.map((child: any) => this.buildItemTree(child, row))
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

    if (pointer === this.root) {
      position = 0
      depth = 0
    }

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

  sort() {
    // TODO
  }
}
