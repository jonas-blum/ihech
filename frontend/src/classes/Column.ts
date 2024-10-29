import { PixiColumnLabel } from '@/pixiComponents/PixiColumnLabel'

export abstract class Column {
    name: string
    standardDeviation: number // corresponds to the 'heterogeneity' in the backend data
    parent: Column | null
    position: number = -1
    oldPosition: number = -1
    depth: number = -1
    prevSibling: Column | null = null
    nextSibling: Column | null = null
    pixiColumnLabel: PixiColumnLabel | null = null
  
    protected constructor(
      name: string,
      standardDeviation: number,
      parent: Column | null = null,
    ) {
      this.name = name
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
  }
  
  export class AttributeColumn extends Column {
    constructor(
      name: string,
      standardDeviation: number,
      parent?: Column | null,
    ) {
      super(name, standardDeviation, parent)
    }
  
    hasChildren(): boolean {
      return false
    }
  }
  
  export class AggregatedColumn extends Column {
    isOpen: boolean
    children: Column[]
  
    constructor(
      name: string,
      standardDeviation: number,
      parent?: Column | null,
      isOpen: boolean = false,
      children: Column[] = [],
    ) {
      super(name, standardDeviation, parent)
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
  