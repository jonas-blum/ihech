import { Container } from 'pixi.js'
import { Row } from '@/classes/Row'
import { PixiHeatmapCell } from '@/pixiComponents/PixiHeatmapCell'
import { PixiRowLabel } from '@/pixiComponents/PixiRowLabel'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { useLayoutStore } from '@/stores/layoutStore'
import { gsap } from 'gsap'

export class PixiRow {
  public container: Container = new Container() // contains pixiHeatmapCellsContainer and pixiRowLabel
  public pixiHeatmapCellsContainer: Container = new Container() // PixiHeatmapCell[] as children
  public pixiRowLabel: PixiRowLabel | null // reference to the corresponding PixiRowLabel for rendering
  public row: Row // reference to data structure Row

  constructor(row: Row) {
    this.row = row
    this.pixiRowLabel = new PixiRowLabel(row)

    this.container.addChild(this.pixiHeatmapCellsContainer)
    this.container.addChild(this.pixiRowLabel.container)

    this.pixiHeatmapCellsContainer.position.set(useLayoutStore().rowLabelWidth, 0)

    // create all the cells for the row
    for (let i = 0; i < row.data.length; i++) {
      const value = row.data[i]
      const adjustedValue = row.dataAdjusted[i]
      const cell = new PixiHeatmapCell(value, adjustedValue, i, this.onCellClick.bind(this))
      this.pixiHeatmapCellsContainer.addChild(cell)
    }

    // this.updatePosition()
    this.updateVisibility()
    this.updateCellPositions(false)
  }

  updatePosition(animate: boolean = true) {
    // if the oldPosition is -1, we want to animate from the parent row position (if available)
    let startPosition =
      this.row.oldPosition === -1 ? (this.row.parent?.position ?? 0) : this.row.oldPosition
    gsap.fromTo(
      this.container,
      { y: startPosition * useLayoutStore().rowHeight },
      {
        y: this.row.position * useLayoutStore().rowHeight,
        duration: animate ? useLayoutStore().animationDuration : 0,
      },
    )
    this.pixiRowLabel?.updatePosition()
  }

  updateCellPositions(animate: boolean = true) {
    for (let i = 0; i < this.pixiHeatmapCellsContainer.children.length; i++) {
      const cell = this.pixiHeatmapCellsContainer.children[i] as PixiHeatmapCell

      // lookup the position of the cell
      const columnIndex =
        useHeatmapStore()?.attributeTree?.originalIndexToColumn.get(i)?.position ?? -1

      gsap.to(cell, {
        x: columnIndex * useLayoutStore().columnWidth,
        duration: animate ? useLayoutStore().animationDuration : 0,
      })
    }
  }

  updateVisibility() {
    this.container.visible = this.row.position !== -1
  }

  onCellClick(pixiHeatmapCell: PixiHeatmapCell) {
    useHeatmapStore()?.cellClickEvent(this.row, pixiHeatmapCell.column)
  }
}
