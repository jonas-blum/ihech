import { Application, Container, Texture, Graphics, Rectangle } from 'pixi.js'
import { OutlineFilter, DropShadowFilter, GlowFilter } from 'pixi-filters'
import { useDimredLayoutStore } from '@/stores/dimredLayoutStore'
import { useMainStore } from '@/stores/mainStore'
import { PixiBubble } from '@/pixiComponents/PixiBubble'
import { DimredTile } from '@/pixiComponents/PixiTile'
import { PixiContainer } from '@/pixiComponents/PixiContainer'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'

export class PixiDimredApp extends Application {
  public bubbleContainer: PixiContainer = new PixiContainer() // PixiBubble[] as children
  public bubbleTexture: Texture = new Texture() // texture used to efficiently render bubbles as sprites
  public stickyBubbleTexture: Texture = new Texture() // texture used to encode sticky rows in the dimred
  public dimredTile: DimredTile = new DimredTile() 

  constructor(canvasElement: HTMLCanvasElement) {
    super()

    const dimredLayoutStore = useDimredLayoutStore()

    // init app
    this.init({
      canvas: canvasElement,
      width: dimredLayoutStore.canvasWidth,
      height: dimredLayoutStore.canvasHeight,
      backgroundColor: dimredLayoutStore.dimredCanvasBackgroundColor,
      antialias: true,
      resolution: 2,
      // autoDensity: true, // not sure what this does
    })

    this.stage.addChild(this.dimredTile)

    this.dimredTile.content.addChild(this.bubbleContainer)
    // center the dimred, ensure it is quadratic
    this.bubbleContainer.width = dimredLayoutStore.dimredSize
    this.bubbleContainer.height = dimredLayoutStore.dimredSize
    this.bubbleContainer.position.set(
      dimredLayoutStore.dimredXPadding,
      dimredLayoutStore.dimredYPadding,
    )
    // for debugging the bubbleContainer position
    // this.bubbleContainer.addBackground(0x00ffff)
    // this.bubbleContainer.setBackgroundDimensions(
    //   dimredLayoutStore.dimredSize,
    //   dimredLayoutStore.dimredSize,
    // )
  }

  clear() {
    this.dimredTile.clear()
  }

  addBubble(bubble: PixiBubble) {
    this.bubbleContainer.addChild(bubble)
  }

  generateBubbleTexture() {
    const size = useDimredLayoutStore().bubbleSize

    const bubbleGraphic = new Graphics()
    bubbleGraphic.circle(0, 0, size).fill(0xffffff) //.stroke({width: 1, color: 0x000000})
    this.bubbleTexture = this.renderer.generateTexture({
      target: bubbleGraphic,
      resolution: 8,
    })
  }

  generateStickyBubbleTexture() {
    const dimredLayoutStore = useDimredLayoutStore()
    const starScaleFactor = 2
    const size = dimredLayoutStore.bubbleSize * starScaleFactor

    const graphic = new Graphics().star(0, 0, 5, size).fill(0xffffff)

    this.stickyBubbleTexture = this.renderer.generateTexture({
      target: graphic,
      resolution: 8, // Optional: Keep this if you want higher resolution
    })
  }
}
