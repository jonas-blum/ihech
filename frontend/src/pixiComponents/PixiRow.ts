import { Container } from 'pixi.js'
import { Row } from '@/classes/Row'
import { PixiHeatmapCell } from '@/pixiComponents/PixiHeatmapCell'
import { useHeatmapStore } from '@/stores/heatmapStore'

// maps 1:1 to ItenNameAndData
export class PixiRow {
  public container: Container // PixiHeatmapCell[] as children
  public row: Row // reference to data structure Row

  constructor(row: Row) {
    this.container = new Container()
    this.row = row

    // create all the cells for the row
    for (let i = 0; i < row.data.length; i++) {
      const value = row.data[i]
      const adjustedValue = row.dataAdjusted[i]
      const cell = new PixiHeatmapCell(value, adjustedValue, i, this.onCellClick.bind(this))
      this.container.addChild(cell)
    }

    this.updatePosition()
    this.updateVisibility()
    this.updateCellPositions()
  }

  updatePosition() {
    this.container.y = this.row.position * 20 // TODO: hardcoded for the moment
  }

  updateCellPositions() {
    for (let i = 0; i < this.container.children.length; i++) {
      const cell = this.container.children[i] as PixiHeatmapCell

      // lookup the position of the cell
      const columnIndex = useHeatmapStore()?.attributeTree?.originalIndexToColumn.get(i)?.position ?? -1
      cell.x = columnIndex * 20 // TODO: hardcoded for the moment
    }
  }

  updateVisibility() {
    this.container.visible = this.row.position !== -1
  }

  onCellClick(pixiHeatmapCell: PixiHeatmapCell) {
    useHeatmapStore()?.cellClickEvent(this.row, pixiHeatmapCell.column)
  }
}
