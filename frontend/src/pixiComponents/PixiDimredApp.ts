import { Application, Container, Texture, Graphics } from 'pixi.js'
import { useDimredLayoutStore } from '@/stores/dimredLayoutStore'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { PixiBubble } from '@/pixiComponents/PixiBubble'

export class PixiDimredApp extends Application {
  public bubbleContainer: Container = new Container() // PixiBubble[] as children
  public bubbleTexture: Texture = new Texture() // used to efficiently render bubbles as sprites

  constructor(canvasElement: HTMLCanvasElement) {
    super()

    const dimredLayoutStore = useDimredLayoutStore()

    // init app
    this.init({
      canvas: canvasElement,
      width: dimredLayoutStore.canvasWidth,
      height: dimredLayoutStore.canvasHeight,
      backgroundColor: dimredLayoutStore.heatmapCanvasBackgroundColor,
      antialias: true,
      resolution: 2,
      // autoDensity: true, // not sure what this does
    })

    this.stage.position.set(0, 0) // TODO: margin

    this.stage.addChild(this.bubbleContainer)
    // center the dimred, ensure it is quadratic
    this.bubbleContainer.width = dimredLayoutStore.dimredSize
    this.bubbleContainer.height = dimredLayoutStore.dimredSize
    this.bubbleContainer.position.set(
      dimredLayoutStore.dimredXPadding,
      dimredLayoutStore.dimredYPadding,
    )
  }

  addBubble(bubble: PixiBubble) {
    this.bubbleContainer.addChild(bubble)
  }

  generateBubbleTexture() {
    const bubbleGraphic = new Graphics()
    bubbleGraphic.circle(0, 0, useDimredLayoutStore().bubbleSize).fill(0xffffff) //.stroke({width: 1, color: 0x000000})
    bubbleGraphic.fill(0xffffff)
    this.bubbleTexture = this.renderer.generateTexture({
      target: bubbleGraphic,
      resolution: 8,
    })
  }
}
