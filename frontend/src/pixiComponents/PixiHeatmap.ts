import { Container, Graphics } from 'pixi.js'
import { PixiRow } from '@/pixiComponents/PixiRow'
import { useLayoutStore } from '@/stores/layoutStore'
import { useHeatmapStore } from '@/stores/heatmapStore'
import type { PixiColumnLabel } from './PixiColumnLabel'

export class PixiHeatmap extends Container {
  public rowContainer: Container = new Container() // PixiRow[] as children
  public stickyRowContainer: Container = new Container() // PixiRow[] as children
  public columnLabelsContainer: Container = new Container() // PixiColumnLabel[] as children

  constructor() {
    super();

    // add the children to the main container
    this.addChild(this.rowContainer)
    this.addChild(this.stickyRowContainer)
    this.addChild(this.columnLabelsContainer)

    // set the position of the containers
    this.rowContainer.position.set(0, useLayoutStore().columnLabelHeight)
    this.stickyRowContainer.position.set(0, useLayoutStore().columnLabelHeight)
    this.columnLabelsContainer.position.set(useLayoutStore().rowLabelWidth, 0)
  }

  addRow(row: PixiRow) {
    this.rowContainer.addChild(row)
  }

  addStickyRow(row: PixiRow) {
    this.stickyRowContainer.addChild(row)
  }

  removeStickyRow(row: PixiRow) {
    this.stickyRowContainer.removeChild(row)
    row.destroy()
  }

  addColumnLabel(columnLabel: PixiColumnLabel) {
    this.columnLabelsContainer.addChild(columnLabel)
  }
}
