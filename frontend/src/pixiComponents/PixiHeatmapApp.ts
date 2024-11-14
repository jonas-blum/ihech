import { Application, Container, Graphics, Texture } from 'pixi.js'
import { PixiRow } from '@/pixiComponents/PixiRow'
import type { PixiColumnLabel } from '@/pixiComponents/PixiColumnLabel'
import { PixiVerticalScrollbar } from '@/pixiComponents/PixiVerticalScrollbar'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'

export class PixiHeatmapApp extends Application {
  public rowContainer: Container = new Container() // PixiRow[] as children
  public rowContainerMask: Graphics = new Graphics() // mask for the row container
  public stickyRowContainer: Container = new Container() // PixiRow[] as children
  public columnLabelsContainer: Container = new Container() // PixiColumnLabel[] as children
  public verticalScrollbar: PixiVerticalScrollbar = new PixiVerticalScrollbar()
  public heatmapCellTexture: Texture = new Texture() // used to efficiently render heatmap cells as sprites

  constructor(canvasElement: HTMLCanvasElement) {
    console.log('PixiHeatmapApp constructor', canvasElement)
    console.log('width', useHeatmapLayoutStore().canvasWidth)
    console.log('height', useHeatmapLayoutStore().canvasHeight)
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
      heatmapLayoutStore.heatmapLeftMargin,
      heatmapLayoutStore.heatmapTopMargin,
    )

    // add the children to the main container
    this.stage.addChild(this.rowContainer)
    this.stage.addChild(this.rowContainerMask)
    this.stage.addChild(this.stickyRowContainer)
    this.stage.addChild(this.columnLabelsContainer)
    this.stage.addChild(this.verticalScrollbar)

    // set the position of the containers
    this.rowContainer.position.set(0, heatmapLayoutStore.columnLabelHeight)
    this.stickyRowContainer.position.set(0, heatmapLayoutStore.columnLabelHeight)
    this.columnLabelsContainer.position.set(heatmapLayoutStore.rowLabelWidth, 0)
    this.verticalScrollbar.update()

    // set the mask for the row container
    this.updateRowContainerMask()
    this.rowContainer.mask = this.rowContainerMask
  }

  clear() {
    this.rowContainer.removeChildren()
    this.stickyRowContainer.removeChildren()
    this.columnLabelsContainer.removeChildren()
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

  generateHeatmapCellTexture() {
    console.log('generateHeatmapCellTexture')
    const heatmapLayoutStore = useHeatmapLayoutStore()

    const heatmapCellGraphic = new Graphics()
    heatmapCellGraphic
      .rect(
        0,
        0,
        heatmapLayoutStore.columnWidth - heatmapLayoutStore.cellPadding,
        heatmapLayoutStore.rowHeight - heatmapLayoutStore.cellPadding,
      )
      .fill(0xffffff)
    this.heatmapCellTexture = this.renderer.generateTexture(heatmapCellGraphic)
  }

  updateRowContainerPosition() {
    this.rowContainer.position.y = useHeatmapLayoutStore().rowsVerticalStartPosition
  }

  updateRowContainerMask() {
    const heatmapLayoutStore = useHeatmapLayoutStore()
    this.rowContainerMask.clear()
    this.rowContainerMask
      .rect(
        0,
        heatmapLayoutStore.rowsVerticalStartPosition,
        heatmapLayoutStore.canvasWidth,
        heatmapLayoutStore.canvasHeight - heatmapLayoutStore.rowsVerticalStartPosition,
      )
      .fill(0xffffff)
  }
}
