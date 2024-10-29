import { Container } from 'pixi.js'
import { PixiRow } from '@/pixiComponents/PixiRow'
import { useLayoutStore } from '@/stores/layoutStore'
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
    this.rowContainer.position.set(0, useLayoutStore().columnLabelHeight)
    this.stickyRowContainer.position.set(0, useLayoutStore().columnLabelHeight)
    this.columnLabelsContainer.position.set(useLayoutStore().rowLabelWidth, 0)
  }

  addRow(row: PixiRow) {
    this.rowContainer.addChild(row.container)
  }

  addStickyRow(row: PixiRow) {
    this.stickyRowContainer.addChild(row.container)
  }

  removeStickyRow(row: PixiRow) {
    this.stickyRowContainer.removeChild(row.container)
    row.container.destroy()
  }

  addColumnLabel(columnLabel: PixiColumnLabel) {
    this.columnLabelsContainer.addChild(columnLabel.container)
  }
}
