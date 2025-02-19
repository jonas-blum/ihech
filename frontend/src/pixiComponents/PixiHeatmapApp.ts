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
import { useTextureStore } from '@/stores/textureStore'

export class PixiHeatmapApp extends Application {
  public verticalScrollbar: PixiVerticalScrollbar = new PixiVerticalScrollbar()
  public horizontalScrollbar: PixiHorizontalScrollbar = new PixiHorizontalScrollbar()
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
      resolution: 2,
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

    // add scroll event listeners
    const handleWheel = (e: WheelEvent, allowVertical = true, allowHorizontal = true) => {
      const heatmapLayoutStore = useHeatmapLayoutStore()

      if (allowVertical && e.deltaY !== 0) {
        heatmapLayoutStore.setVerticalScrollPosition(heatmapLayoutStore.verticalScrollPosition + e.deltaY)
      }
      if (allowHorizontal && e.deltaX !== 0) {
        heatmapLayoutStore.setHorizontalScrollPosition(heatmapLayoutStore.horizontalScrollPosition + e.deltaX)
      }
    }

    this.matrixTile.eventMode = 'static'
    this.matrixTile.on('wheel', (e) => handleWheel(e, true, true))

    this.rowLabelTile.eventMode = 'static'
    this.rowLabelTile.on('wheel', (e) => handleWheel(e, true, false))

    this.columnLabelTile.eventMode = 'static'
    this.columnLabelTile.on('wheel', (e) => handleWheel(e, false, true))
  }

  activateLoadingState() {
    this.matrixTile.activateLoadingState()
    this.rowLabelTile.activateLoadingState()
    this.columnLabelTile.activateLoadingState()
  }

  deactivateLoadingState() {
    this.matrixTile.deactivateLoadingState()
    this.rowLabelTile.deactivateLoadingState()
    this.columnLabelTile.deactivateLoadingState()
  }

  clear() {
    // DOCS: https://pixijs.download/release/docs/app.Application.html#destroy
    this.rowLabelTile.clear()
    this.columnLabelTile.clear()
    this.matrixTile.clear()
  }

  generateTextures() {
    const heatmapLayoutStore = useHeatmapLayoutStore()
    const textureStore = useTextureStore()

    // heatmap cell texture
    const heatmapCellGraphic = new Graphics()
    heatmapCellGraphic
      .rect(
        0,
        0,
        heatmapLayoutStore.columnWidth - heatmapLayoutStore.cellPadding,
        heatmapLayoutStore.rowHeight - heatmapLayoutStore.cellPadding,
      )
      .fill(0xffffff)
    textureStore.heatmapCellTexture = this.renderer.generateTexture(heatmapCellGraphic)

    // chevron texture
    const chevronWidth = 10
    const chevronHeight = 6
    const textureSize = 10
    const chevronGraphic = new Graphics()
    chevronGraphic
      .moveTo(0, (textureSize - chevronHeight) / 2)
      .lineTo(chevronWidth / 2, (textureSize + chevronHeight) / 2)
      .lineTo(chevronWidth, (textureSize - chevronHeight) / 2)
      .stroke({ width: 1, color: heatmapLayoutStore.chevronColor })
    let textureContainer = new Rectangle(0, 0, textureSize, textureSize)
    textureStore.chevronTexture = this.renderer.generateTexture({ frame: textureContainer, target: chevronGraphic })

    // circle texture (used for PixiItemRowLabel)
    const circleGraphic = new Graphics()
    circleGraphic.circle(0, 0, 5).fill(0xffffff) //.stroke({width: 1, color: 0x000000})
    textureStore.circleTexture = this.renderer.generateTexture(circleGraphic)

    // star texture
    const starGraphic = new Graphics()
    starGraphic.star(0, 0, 5, 6).fill(0xffffff)
    textureStore.starTexture = this.renderer.generateTexture({
      target: starGraphic,
      resolution: 4,
    })
  }
}
