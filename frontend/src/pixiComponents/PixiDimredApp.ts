import { Application, Container } from 'pixi.js'
import { useDimredLayoutStore } from '@/stores/dimredLayoutStore'
import { PixiBubble } from '@/pixiComponents/PixiBubble'

export class PixiDimredApp extends Application {
  public bubbleContainer: Container = new Container() // PixiBubble[] as children

  constructor(canvasElement: HTMLCanvasElement) {
    super()
    // init app
    this.init({
      canvas: canvasElement,
      width: useDimredLayoutStore().canvasWidth,
      height: useDimredLayoutStore().canvasHeight,
      backgroundColor: useDimredLayoutStore().heatmapCanvasBackgroundColor,
      antialias: true,
      resolution: 2,
      // autoDensity: true, // not sure what this does
    })

    this.stage.position.set(0, 0) // TODO: margin

    this.stage.addChild(this.bubbleContainer)
    // TODO: set the position of the container
  }

  addBubble(bubble: PixiBubble) {
    this.bubbleContainer.addChild(bubble)
  }
}