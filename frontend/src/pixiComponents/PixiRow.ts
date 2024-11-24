import { Container, Graphics, Texture } from 'pixi.js'
import { OutlineFilter, DropShadowFilter, GlowFilter } from 'pixi-filters'
import { Row } from '@/classes/Row'
import { Column } from '@/classes/Column'
import { PixiHeatmapCell } from '@/pixiComponents/PixiHeatmapCell'
import { PixiContainer } from '@/pixiComponents/PixiContainer'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'
import { gsap } from 'gsap'

export class PixiRow extends PixiContainer {
  public isSticky: boolean // true for sticky rows
  public row: Row // reference to data structure Row

  constructor(row: Row, cellTexture: Texture, isSticky: boolean = false) {
    super()
    this.row = row
    this.isSticky = isSticky

    const heatmapLayoutStore = useHeatmapLayoutStore()

    // create all the cells for the row
    for (let i = 0; i < row.data.length; i++) {
      const value = row.data[i]
      const adjustedValue = row.dataAdjusted[i]
      const cell = new PixiHeatmapCell(cellTexture, value, adjustedValue, i)
      this.addChild(cell)
    }

    // this.updatePosition()
    this.updateVisibility()
    this.updateCellPositions(false)
  }

  updatePosition(animate: boolean = true) {
    const heatmapLayoutStore = useHeatmapLayoutStore()
    // if the oldPosition is -1, we want to animate from the parent row position (if available)
    const startPosition =
      this.row.oldPosition === -1 ? (this.row.parent?.position ?? 0) : this.row.oldPosition
    gsap.fromTo(
      this,
      { y: startPosition * heatmapLayoutStore.rowHeight },
      {
        y: this.row.position * heatmapLayoutStore.rowHeight,
        duration:
          animate && heatmapLayoutStore.allowAnimations ? heatmapLayoutStore.animationDuration : 0,
      },
    )

  }

  updateCellPositions(animate: boolean = true) {
    const heatmapLayoutStore = useHeatmapLayoutStore()

    for (let i = 0; i < this.children.length; i++) {
      const cell = this.children[i] as Container

      // lookup the position of the column
      const column = useHeatmapStore()?.attributeTree?.originalIndexToColumn.get(i)

      // update visibility of the cell
      cell.visible = column?.position !== -1

      // if the oldPosition is -1, we want to animate from the parent column position (if available)
      const startPosition =
        column?.oldPosition === -1 ? (column?.parent?.position ?? 0) : (column?.oldPosition ?? 0)
      const endPosition = column?.position ?? column?.parent?.position ?? 0

      gsap.fromTo(
        cell,
        { x: startPosition * heatmapLayoutStore.columnWidth },
        {
          x: endPosition * heatmapLayoutStore.columnWidth,
          duration:
            animate && heatmapLayoutStore.allowAnimations
              ? heatmapLayoutStore.animationDuration
              : 0,
        },
      )
    }
  }

  updateCellColoring() {
    for (let i = 0; i < this.children.length; i++) {
      const cell = this.children[i] as PixiHeatmapCell
      const color = useHeatmapStore()?.colorMap?.getColor(cell.adjustedValue)
      cell.updateTint(color)
    }
  }

  updateVisibility() {
    const heatmapLayoutStore = useHeatmapLayoutStore()

    if (this.isSticky) {
      this.visible = true
      return
    }

    // this is our custom culling mechanism -> prevent rendering if not in visible viewport
    // TODO: disabled for debugging
    // this.visible =
    //   this.row.position !== -1 &&
    //   this.row.position >= heatmapLayoutStore.firstVisibleRowIndex &&
    //   this.row.position <= heatmapLayoutStore.lastVisibleRowIndex
  }

  updateHighlightedDisplay(highlighted: boolean) {
    // if (this.pixiRowLabel) {
    //   // make font bold of text object
    //   this.pixiRowLabel.text.style.fontWeight = highlighted ? 'bold' : 'normal'

    //   // make background of row label glow
    //   this.pixiRowLabel.background.filters = highlighted ? [new GlowFilter()] : []
    // }

    // make sure the higlighted row is rendered last, otherwise the glow filter is not visible
    if (highlighted && this.parent) {
      this.parent.setChildIndex(this, this.parent.children.length - 1)
    }

    // this.filters = highlighted ? [new OutlineFilter()] : []
    // this.filters = highlighted ? [new DropShadowFilter()] : []
    this.filters = highlighted ? [new GlowFilter()] : []
  }
}
