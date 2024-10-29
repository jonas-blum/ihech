import { Container } from 'pixi.js'
import { PixiRow } from '@/pixiComponents/PixiRow'
import { PixiRowLabel } from '@/pixiComponents/PixiRowLabel'
import { useHeatmapStore } from '@/stores/heatmapStore'
import type { PixiColumnLabel } from './PixiColumnLabel'

export class PixiHeatmap {
  public container: Container = new Container() // rowContainer, rowLabelsContainer, columnLabelsContainer as children
  public rowContainer: Container = new Container() // PixiRow[] as children
  public stickyRowContainer: Container = new Container() // PixiRow[] as children
  public columnLabelsContainer: Container = new Container() // PixiColumnLabel[] as children

  constructor() {
    // add the containers to the main container
    this.container.addChild(this.rowContainer)
    this.container.addChild(this.stickyRowContainer)
    this.container.addChild(this.columnLabelsContainer)

    // set the position of the containers
    // TODO
    this.rowContainer.position.set(0, 200)
    this.stickyRowContainer.position.set(0, 200)
    this.columnLabelsContainer.position.set(200, 0)
  }

  addRow(row: PixiRow) {
    this.rowContainer.addChild(row.container)
  }

  addStickyRow(row: PixiRow) {
    this.stickyRowContainer.addChild(row.container)
  }

  destroyStickyRows() {
    this.stickyRowContainer.removeChildren()
  }

  addColumnLabel(columnLabel: PixiColumnLabel) {
    this.columnLabelsContainer.addChild(columnLabel.container)
  }
}
