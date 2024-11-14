import { Application, Container, Graphics, Texture } from 'pixi.js'
import { OutlineFilter, DropShadowFilter, GlowFilter } from 'pixi-filters'
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
  public rowLabelTile: Graphics = new Graphics() // purely visual; disconnected from actual Pixi objects
  public columnLabelTile: Graphics = new Graphics() // purely visual; disconnected from actual Pixi objects
  public heatmapTile: Graphics = new Graphics() // purely visual; disconnected from actual Pixi objects

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
    this.stage.addChild(this.rowLabelTile)
    this.stage.addChild(this.columnLabelTile)
    this.stage.addChild(this.heatmapTile)
    this.stage.addChild(this.rowContainer)
    this.stage.addChild(this.rowContainerMask)
    this.stage.addChild(this.stickyRowContainer)
    this.stage.addChild(this.columnLabelsContainer)
    this.stage.addChild(this.verticalScrollbar)
    
    // set the position of the containers
    this.rowContainer.position.set(heatmapLayoutStore.tilePadding, heatmapLayoutStore.columnLabelHeight + heatmapLayoutStore.tileMargin + heatmapLayoutStore.tilePadding)
    this.stickyRowContainer.position.set(heatmapLayoutStore.tilePadding, heatmapLayoutStore.columnLabelHeight + heatmapLayoutStore.tileMargin + heatmapLayoutStore.tilePadding)
    this.columnLabelsContainer.position.set(heatmapLayoutStore.rowLabelWidth + heatmapLayoutStore.tileMargin + heatmapLayoutStore.tilePadding, heatmapLayoutStore.tilePadding)
    this.verticalScrollbar.update()

    // set the mask for the row container
    this.updateRowContainerMask()
    this.rowContainer.mask = this.rowContainerMask

    // set row label tile
    this.rowLabelTile.rect(0, 0, heatmapLayoutStore.rowLabelWidth, 2000).fill(0xffffff)
    this.rowLabelTile.position.set(0, heatmapLayoutStore.columnLabelHeight + heatmapLayoutStore.tileMargin)
    this.rowLabelTile.filters = [new DropShadowFilter({
      offset: {x:0, y:0},
      blur: 1,
      alpha: 1
    })]

    // set column label tile
    this.columnLabelTile.rect(0, 0, 2000, heatmapLayoutStore.columnLabelHeight).fill(0xffffff)
    this.columnLabelTile.position.set(heatmapLayoutStore.rowLabelWidth + heatmapLayoutStore.tileMargin, 0)
    this.columnLabelTile.filters = [new DropShadowFilter({
      offset: {x:0, y:0},
      blur: 1,
      alpha: 1
    })]

    // set heatmap tile
    this.heatmapTile.rect(0, 0, 2000, 2000).fill(0xffffff)
    this.heatmapTile.position.set(heatmapLayoutStore.rowLabelWidth + heatmapLayoutStore.tileMargin, heatmapLayoutStore.columnLabelHeight + heatmapLayoutStore.tileMargin)
    this.heatmapTile.filters = [new DropShadowFilter({
      offset: {x:0, y:0},
      blur: 1,
      alpha: 1
    })]

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
