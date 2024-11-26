import { Container, Graphics, Texture } from 'pixi.js'
import { OutlineFilter, DropShadowFilter, GlowFilter } from 'pixi-filters'
import { Row } from '@/classes/Row'
import { Column } from '@/classes/Column'
import { PixiHeatmapCell } from '@/pixiComponents/PixiHeatmapCell'
import { PixiContainer } from '@/pixiComponents/PixiContainer'
import { useMainStore } from '@/stores/mainStore'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'
import { gsap } from 'gsap'

export class PixiRow extends PixiContainer {
  public isSticky: boolean // true for sticky rows
  public row: Row // reference to data structure Row
  public mainStore: ReturnType<typeof useMainStore>
  public heatmapLayoutStore: ReturnType<typeof useHeatmapLayoutStore>
  public cellsCreated: boolean = false

  constructor(row: Row, isSticky: boolean = false) {
    super()
    this.row = row
    this.isSticky = isSticky
    // this.cullable = true

    this.heatmapLayoutStore = useHeatmapLayoutStore()
    this.mainStore = useMainStore()

    // WIP: experimenting with lazy loading
    // this.createCells()

    // this.updatePosition()
    this.updateVisibility()
    this.updateCellPositions(false)
  }

  createCells() {
    // create all the cells for the row
    for (let i = 0; i < this.row.data.length; i++) {
      const value = this.row.data[i]
      const adjustedValue = this.row.dataAdjusted[i]
      const cell = new PixiHeatmapCell(this.heatmapLayoutStore.heatmapCellTexture as Texture, value, adjustedValue, i)
      this.addChild(cell)
    }

    // for WHATEVER MYSTICAL REASON, this needs to be called. otherwise the cells are only being rendered after the first mouse interaction
    if (this.parent) {
      this.parent.setChildIndex(this, this.parent.children.length - 1)
    }
  }

  destroyCells() {
    this.children.forEach((child) => {
      if (child instanceof PixiHeatmapCell) {
        child.destroy()
      }
    })
  }

  updatePosition(animate: boolean = true) {
    // if the oldPosition is -1, we want to animate from the parent row position (if available)
    const startPosition =
      this.row.oldPosition === -1 ? (this.row.parent?.position ?? 0) : this.row.oldPosition
    gsap.fromTo(
      this,
      { y: startPosition * this.heatmapLayoutStore.rowHeight },
      {
        y: this.row.position * this.heatmapLayoutStore.rowHeight,
        duration:
          animate && this.heatmapLayoutStore.allowAnimations
            ? this.heatmapLayoutStore.animationDuration
            : 0,
      },
    )
  }

  updateCellPositions(animate: boolean = true) {
    // only proceed if the row is visible (or sticky); otherwise we can skip
    if (!this.row.heatmapVisibility && !this.isSticky) {
      return
    }

    // create cells if they don't exist yet
    if (!this.cellsCreated) {
      this.createCells()
      this.cellsCreated = true
    }

    for (let i = 0; i < this.children.length; i++) {
      const cell = this.children[i] as Container
      // console.log('cell', cell)

      // lookup the position of the column
      const column = this.mainStore?.attributeTree?.originalIndexToColumn.get(i)
      if (column?.heatmapVisibility == false) {
        cell.visible = false
        continue
      }

      cell.visible = true

      // if the oldPosition is -1, we want to animate from the parent column position (if available)
      const startPosition =
        column?.oldPosition === -1 ? (column?.parent?.position ?? 0) : (column?.oldPosition ?? 0)
      const endPosition = column?.position ?? column?.parent?.position ?? 0

      if (startPosition === endPosition) {
        cell.x = endPosition * this.heatmapLayoutStore.columnWidth
        continue
      }

      if (!animate || !this.heatmapLayoutStore.allowAnimations) {
        cell.x = endPosition * this.heatmapLayoutStore.columnWidth
        continue
      }

      gsap.fromTo(
        cell,
        { x: startPosition * this.heatmapLayoutStore.columnWidth },
        {
          x: endPosition * this.heatmapLayoutStore.columnWidth,
          duration: this.heatmapLayoutStore.animationDuration,
        },
      )
    }
  }

  updateCellColoring() {
    for (let i = 0; i < this.children.length; i++) {
      const cell = this.children[i] as PixiHeatmapCell
      const color = this.mainStore?.colorMap?.getColor(cell.adjustedValue)
      cell.updateTint(color)
    }
  }

  updateVisibility() {
    if (this.isSticky) {
      this.visible = true
      return
    }

    this.visible = this.row.heatmapVisibility
  }

  updateHighlightedDisplay(highlighted: boolean) {
    // make sure the higlighted row is rendered last, otherwise the glow filter is not visible
    if (highlighted && this.parent) {
      this.parent.setChildIndex(this, this.parent.children.length - 1)
    }

    // this.filters = highlighted ? [new OutlineFilter()] : []
    // this.filters = highlighted ? [new DropShadowFilter()] : []
    this.filters = highlighted ? [new GlowFilter()] : []
  }
}
