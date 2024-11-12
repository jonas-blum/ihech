import { Container, Text } from 'pixi.js'
import { OutlineFilter, DropShadowFilter, GlowFilter } from 'pixi-filters'
import { Row } from '@/classes/Row'
import { Column } from '@/classes/Column'
import { PixiHeatmapCell } from '@/pixiComponents/PixiHeatmapCell'
import { PixiRowLabel } from '@/pixiComponents/PixiRowLabel'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'
import { gsap } from 'gsap'

export class PixiRow extends Container {
  public pixiHeatmapCellsContainer: Container = new Container() // PixiHeatmapCell[] as children
  public isSticky: boolean // true for sticky rows
  public pixiRowLabel: PixiRowLabel | null // reference to the corresponding PixiRowLabel for rendering
  public row: Row // reference to data structure Row

  constructor(row: Row, isSticky: boolean = false) {
    super()
    this.row = row
    this.isSticky = isSticky
    this.pixiRowLabel = new PixiRowLabel(row, isSticky)

    this.addChild(this.pixiHeatmapCellsContainer)
    this.addChild(this.pixiRowLabel)

    this.pixiHeatmapCellsContainer.position.set(useHeatmapLayoutStore().rowLabelWidth, 0)

    // create all the cells for the row
    for (let i = 0; i < row.data.length; i++) {
      const value = row.data[i]
      const adjustedValue = row.dataAdjusted[i]
      const cell = new PixiHeatmapCell(value, adjustedValue, i)
      this.pixiHeatmapCellsContainer.addChild(cell)
    }

    // this.updatePosition()
    this.updateVisibility()
    this.updateCellPositions(false)
  }

  updatePosition(animate: boolean = true) {
    // if the oldPosition is -1, we want to animate from the parent row position (if available)
    const startPosition =
      this.row.oldPosition === -1 ? this.row.parent?.position ?? 0 : this.row.oldPosition
    gsap.fromTo(
      this,
      { y: startPosition * useHeatmapLayoutStore().rowHeight },
      {
        y: this.row.position * useHeatmapLayoutStore().rowHeight,
        duration: animate ? useHeatmapLayoutStore().animationDuration : 0,
      },
    )
    this.pixiRowLabel?.updatePosition()
  }

  updateCellPositions(animate: boolean = true) {
    for (let i = 0; i < this.pixiHeatmapCellsContainer.children.length; i++) {
      const cell = this.pixiHeatmapCellsContainer.children[i] as Container

      // lookup the position of the column
      const column = useHeatmapStore()?.attributeTree?.originalIndexToColumn.get(i)
      
      // update visibility of the cell
      cell.visible = column?.position !== -1

      // if the oldPosition is -1, we want to animate from the parent column position (if available)
      const startPosition = column?.oldPosition === -1 ? column?.parent?.position ?? 0 : column?.oldPosition ?? 0
      const endPosition = column?.position ?? column?.parent?.position ?? 0

      gsap.fromTo(
        cell,
        { x: startPosition * useHeatmapLayoutStore().columnWidth },
        {
          x: endPosition * useHeatmapLayoutStore().columnWidth,
          duration: animate ? useHeatmapLayoutStore().animationDuration : 0,
        },
      )
    }
  }

  updateCellColoring() {
    for (let i = 0; i < this.pixiHeatmapCellsContainer.children.length; i++) {
      const cell = this.pixiHeatmapCellsContainer.children[i] as PixiHeatmapCell
      const color = useHeatmapStore()?.colorMap?.getColor(cell.adjustedValue)
      cell.updateTint(color)
    }
  }

  updateVisibility() {
    this.visible = this.row.position !== -1
  }

  updateHighlightedDisplay(highlighted: boolean) {
    if (this.pixiRowLabel) {
      // make font bold of text object
      this.pixiRowLabel.text.style.fontWeight = highlighted ? 'bold' : 'normal'

      // make background of row label glow
      this.pixiRowLabel.background.filters = highlighted ? [new GlowFilter()] : []
    }

    // make sure the higlighted row is rendered last, otherwise the glow filter is not visible
    if (highlighted && this.parent) {
      this.parent.setChildIndex(this, this.parent.children.length - 1)
    }

    // this.pixiHeatmapCellsContainer.filters = highlighted ? [new OutlineFilter()] : []
    // this.pixiHeatmapCellsContainer.filters = highlighted ? [new DropShadowFilter()] : []
    this.pixiHeatmapCellsContainer.filters = highlighted ? [new GlowFilter()] : []
  }
}
