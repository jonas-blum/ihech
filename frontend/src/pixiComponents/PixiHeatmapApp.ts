import { Application, Container } from 'pixi.js'
import { PixiRow } from '@/pixiComponents/PixiRow'
import type { PixiColumnLabel } from '@/pixiComponents/PixiColumnLabel'
import { PixiVerticalScrollbar } from '@/pixiComponents/PixiVerticalScrollbar'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'

export class PixiHeatmapApp extends Application {
  public rowContainer: Container = new Container() // PixiRow[] as children
  public stickyRowContainer: Container = new Container() // PixiRow[] as children
  public columnLabelsContainer: Container = new Container() // PixiColumnLabel[] as children
  public verticalScrollbar: PixiVerticalScrollbar = new PixiVerticalScrollbar()

  constructor(canvasElement: HTMLCanvasElement) {
    const heatmapLayoutStore = useHeatmapLayoutStore()

    super()
    // init app
    this.init({
      canvas: canvasElement,
      width: heatmapLayoutStore.canvasWidth,
      height: heatmapLayoutStore.canvasHeight,
      backgroundColor: heatmapLayoutStore.heatmapCanvasBackgroundColor,
      antialias: true,
      resolution: 1,
      // autoDensity: true, // not sure what this does
    })

    // position the stage (which is the root container)
    this.stage.position.set(
      useHeatmapLayoutStore().heatmapLeftMargin,
      heatmapLayoutStore.heatmapTopMargin,
    )

    // add the children to the main container
    this.stage.addChild(this.rowContainer)
    this.stage.addChild(this.stickyRowContainer)
    this.stage.addChild(this.columnLabelsContainer)
    this.stage.addChild(this.verticalScrollbar)

    // set the position of the containers
    this.rowContainer.position.set(0, heatmapLayoutStore.columnLabelHeight)
    this.stickyRowContainer.position.set(0, heatmapLayoutStore.columnLabelHeight)
    this.columnLabelsContainer.position.set(heatmapLayoutStore.rowLabelWidth, 0)
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
