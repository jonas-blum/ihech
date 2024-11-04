import { Application, Container } from 'pixi.js'
import { useDimredLayoutStore } from '@/stores/dimredLayoutStore'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { PixiBubble } from '@/pixiComponents/PixiBubble'

export class PixiDimredApp extends Application {
  public bubbleContainer: Container = new Container() // PixiBubble[] as children

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
      resolution: 1,
      // autoDensity: true, // not sure what this does
    })

    this.stage.position.set(0, 0) // TODO: margin

    this.stage.addChild(this.bubbleContainer)
    // center the dimred, ensure it is quadratic
    this.bubbleContainer.width = dimredLayoutStore.dimredSize
    this.bubbleContainer.height = dimredLayoutStore.dimredSize
    this.bubbleContainer.position.set(dimredLayoutStore.dimredXPadding, dimredLayoutStore.dimredYPadding)
  }

  addBubble(bubble: PixiBubble) {
    this.bubbleContainer.addChild(bubble)
  }
}