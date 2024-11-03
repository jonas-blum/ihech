import { Container, Graphics } from 'pixi.js'
import { useLayoutStore } from '@/stores/layoutStore'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { PixiRow } from '@/pixiComponents/PixiRow'
import type { PixiColumnLabel } from '@/pixiComponents/PixiColumnLabel'
import { PixiVerticalScrollbar } from '@/pixiComponents/PixiVerticalScrollbar'


export class PixiHeatmap extends Container {
  public rowContainer: Container = new Container() // PixiRow[] as children
  public stickyRowContainer: Container = new Container() // PixiRow[] as children
  public columnLabelsContainer: Container = new Container() // PixiColumnLabel[] as children
  public verticalScrollbar: PixiVerticalScrollbar = new PixiVerticalScrollbar()

  constructor() {
    super();
    const layoutStore = useLayoutStore()

    // add the children to the main container
    this.addChild(this.rowContainer)
    this.addChild(this.stickyRowContainer)
    this.addChild(this.columnLabelsContainer)
    this.addChild(this.verticalScrollbar)

    // set the position of the containers
    this.rowContainer.position.set(0, layoutStore.columnLabelHeight)
    this.stickyRowContainer.position.set(0, layoutStore.columnLabelHeight)
    this.columnLabelsContainer.position.set(layoutStore.rowLabelWidth, 0)
    this.verticalScrollbar.update()
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
