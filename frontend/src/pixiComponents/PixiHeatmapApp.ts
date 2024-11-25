import { Application, Container, Graphics, Rectangle, Texture } from 'pixi.js'
import { OutlineFilter, DropShadowFilter, GlowFilter } from 'pixi-filters'
import { PixiRow } from '@/pixiComponents/PixiRow'
import type { PixiColumnLabel } from '@/pixiComponents/PixiColumnLabel'
import type { PixiRowLabel } from '@/pixiComponents/PixiRowLabel'
import { PixiVerticalScrollbar } from '@/pixiComponents/PixiVerticalScrollbar'
import { PixiHorizontalScrollbar } from '@/pixiComponents/PixiHorizontalScrollbar'
import { ColumnLabelTile, RowLabelTile, MatrixTile } from '@/pixiComponents/PixiTile'
import { PixiColumnLabelsContainer } from '@/pixiComponents/PixiColumnLabelsContainer'
import { PixiRowLabelsContainer } from '@/pixiComponents/PixiRowLabelsContainer'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'
import { PixiContainer } from '@/pixiComponents/PixiContainer'

export class PixiHeatmapApp extends Application {
  public verticalScrollbar: PixiVerticalScrollbar = new PixiVerticalScrollbar()
  public horizontalScrollbar: PixiHorizontalScrollbar = new PixiHorizontalScrollbar()
  public heatmapCellTexture: Texture = new Texture() // used to efficiently render heatmap cells as sprites
  public rowLabelTile: RowLabelTile = new RowLabelTile() 
  public columnLabelTile: ColumnLabelTile = new ColumnLabelTile() 
  public matrixTile: MatrixTile = new MatrixTile() 

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

    // add the children to the main container
    this.stage.addChild(this.rowLabelTile)
    this.stage.addChild(this.columnLabelTile)
    this.stage.addChild(this.matrixTile)
    this.stage.addChild(this.verticalScrollbar)
    this.stage.addChild(this.horizontalScrollbar)

    this.verticalScrollbar.update()
    this.horizontalScrollbar.update()
  }

  clear() {
    // DOCS: https://pixijs.download/release/docs/app.Application.html#destroy
    this.rowLabelTile.clear()
    this.columnLabelTile.clear()
    this.matrixTile.clear()
  }

  generateHeatmapCellTexture() {
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
}
