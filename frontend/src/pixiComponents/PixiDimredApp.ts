import { Application, Container, Texture, Graphics, Rectangle } from 'pixi.js'
import { OutlineFilter, DropShadowFilter, GlowFilter } from 'pixi-filters'
import { useDimredLayoutStore } from '@/stores/dimredLayoutStore'
import { useMainStore } from '@/stores/mainStore'
import { PixiBubble } from '@/pixiComponents/PixiBubble'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'

export class PixiDimredApp extends Application {
  public bubbleContainer: Container = new Container() // PixiBubble[] as children
  public bubbleTexture: Texture = new Texture() // texture used to efficiently render bubbles as sprites
  public stickyBubbleTexture: Texture = new Texture() // texture used to encode sticky rows in the dimred
  public dimredTile: Graphics = new Graphics() // purely visual; disconnected from actual Pixi objects

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

    this.stage.position.set(dimredLayoutStore.tileMargin, dimredLayoutStore.tileMargin)

    // tile for border effect
    this.dimredTile
      .rect(
        0,
        0,
        dimredLayoutStore.canvasInnerWidth + dimredLayoutStore.tileMargin - 1,
        dimredLayoutStore.canvasInnerHeight,
      )
      .fill(0xffffff)
    this.dimredTile.filters = [
      new DropShadowFilter({
        offset: { x: 0, y: 0 },
        blur: 1,
        alpha: 1,
      }),
    ]
    this.stage.addChild(this.dimredTile)

    this.stage.addChild(this.bubbleContainer)
    // center the dimred, ensure it is quadratic
    this.bubbleContainer.width = dimredLayoutStore.dimredSize
    this.bubbleContainer.height = dimredLayoutStore.dimredSize
    this.bubbleContainer.position.set(
      dimredLayoutStore.dimredXPadding,
      dimredLayoutStore.dimredYPadding,
    )
  }

  clear() {
    this.bubbleContainer.removeChildren()
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
