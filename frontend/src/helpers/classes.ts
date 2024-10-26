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
      const children = itemNameAndData.children.map((child: any) => this.buildTree(child, row))

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
        children,
      )

      // set prevSibling and nextSibling for each child
      // assumption: the order returned by the server is the order in which the children should be displayed
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

  updatePositionsAndDepth() {
    let position = 0
    let pointer: Row | null = this.root
    let depth = 0 // Initialize depth to 0 for the root level

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
}

export abstract class Row {
  name: string
  data: number[]
  dimRedPosition: DimRedPosition
  parent: Row | null
  position: number
  depth: number
  prevSibling: Row | null
  nextSibling: Row | null

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
    this.dimRedPosition = dimRedPosition
    this.parent = parent
    this.position = position
    this.depth = depth
    this.prevSibling = prevSibling
    this.nextSibling = nextSibling
  }

  setPosition(position: number) {
    this.position = position
  }

  setDepth(depth: number) {
    this.depth = depth
  }

  abstract hasChildren(): boolean
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
   * Finds the first child in the list of children.
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
}
