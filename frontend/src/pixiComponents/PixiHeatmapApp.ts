import { Application, Container, Graphics, Texture } from 'pixi.js'
import { OutlineFilter, DropShadowFilter, GlowFilter } from 'pixi-filters'
import { PixiRow } from '@/pixiComponents/PixiRow'
import type { PixiColumnLabel } from '@/pixiComponents/PixiColumnLabel'
import type { PixiRowLabel } from '@/pixiComponents/PixiRowLabel'
import { PixiVerticalScrollbar } from '@/pixiComponents/PixiVerticalScrollbar'
import { PixiHorizontalScrollbar } from '@/pixiComponents/PixiHorizontalScrollbar'
import { ColumnLabelTile, RowLabelTile, MatrixTile } from '@/pixiComponents/PixiTile'
import { PixiMatrixContainer } from '@/pixiComponents/PixiMatrixContainer'
import { PixiColumnLabelsContainer } from '@/pixiComponents/PixiColumnLabelsContainer'
import { PixiRowLabelsContainer } from '@/pixiComponents/PixiRowLabelsContainer'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'

export class PixiHeatmapApp extends Application {
  public matrixContainer: PixiMatrixContainer = new PixiMatrixContainer() // PixiMatrixContainer
  public columnLabelsContainer: PixiColumnLabelsContainer = new PixiColumnLabelsContainer() // PixiColumnLabel[] as children
  public rowLabelsContainer: PixiRowLabelsContainer = new PixiRowLabelsContainer() // PixiRowLabel[] as children
  public verticalScrollbar: PixiVerticalScrollbar = new PixiVerticalScrollbar()
  public horizontalScrollbar: PixiHorizontalScrollbar = new PixiHorizontalScrollbar()
  public heatmapCellTexture: Texture = new Texture() // used to efficiently render heatmap cells as sprites
  public rowLabelTile: RowLabelTile = new RowLabelTile() // purely visual; disconnected from actual Pixi objects
  public columnLabelTile: ColumnLabelTile = new ColumnLabelTile() // purely visual; disconnected from actual Pixi objects
  public matrixTile: MatrixTile = new MatrixTile() // purely visual; disconnected from actual Pixi objects

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

    // add the children to the main container
    this.stage.addChild(this.rowLabelTile)
    this.stage.addChild(this.columnLabelTile)
    this.stage.addChild(this.matrixTile)
    this.stage.addChild(this.matrixContainer)
    this.stage.addChild(this.columnLabelsContainer)
    this.stage.addChild(this.rowLabelsContainer)
    this.stage.addChild(this.verticalScrollbar)
    this.stage.addChild(this.horizontalScrollbar)


    this.matrixContainer.position.set(
      heatmapLayoutStore.matrixContainerFrame.x,
      heatmapLayoutStore.matrixContainerFrame.y,
    )
    this.columnLabelsContainer.position.set(
      heatmapLayoutStore.columnLabelsContainerFrame.x,
      heatmapLayoutStore.columnLabelsContainerFrame.y,
    )
    this.rowLabelsContainer.position.set(
      heatmapLayoutStore.rowLabelsContainerFrame.x,
      heatmapLayoutStore.rowLabelsContainerFrame.y,
    )
    this.verticalScrollbar.update()
    this.horizontalScrollbar.update()
  }

  clear() {
    this.matrixContainer.rowsContainer.removeChildren()
    this.matrixContainer.stickyRowsContainer.removeChildren()
    this.columnLabelsContainer.removeChildren()
    this.rowLabelsContainer.removeChildren()
  }

  addColumnLabel(columnLabel: PixiColumnLabel) {
    this.columnLabelsContainer.addChild(columnLabel)
  }

  addRowLabel(rowLabel: PixiRowLabel) {
    this.rowLabelsContainer.addChild(rowLabel)
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
}
