import { Application, Container } from 'pixi.js'
import { PixiRow } from '@/pixiComponents/PixiRow'
import type { PixiColumnLabel } from '@/pixiComponents/PixiColumnLabel'
import { PixiVerticalScrollbar } from '@/pixiComponents/PixiVerticalScrollbar'
import { useLayoutStore } from '@/stores/layoutStore'

export class PixiHeatmapApp extends Application {
  public rowContainer: Container = new Container() // PixiRow[] as children
  public stickyRowContainer: Container = new Container() // PixiRow[] as children
  public columnLabelsContainer: Container = new Container() // PixiColumnLabel[] as children
  public verticalScrollbar: PixiVerticalScrollbar = new PixiVerticalScrollbar()

  constructor(canvasElement: HTMLCanvasElement) {
    const layoutStore = useLayoutStore()

    super()
    // init app
    this.init({
      canvas: canvasElement,
      width: layoutStore.canvasWidth,
      height: layoutStore.canvasHeight,
      backgroundColor: layoutStore.heatmapCanvasBackgroundColor,
      antialias: true,
      resolution: 2,
      // autoDensity: true, // not sure what this does
    })

    // position the stage (which is the root container)
    this.stage.position.set(useLayoutStore().heatmapLeftMargin, layoutStore.heatmapTopMargin)

    // add the children to the main container
    this.stage.addChild(this.rowContainer)
    this.stage.addChild(this.stickyRowContainer)
    this.stage.addChild(this.columnLabelsContainer)
    this.stage.addChild(this.verticalScrollbar)

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
