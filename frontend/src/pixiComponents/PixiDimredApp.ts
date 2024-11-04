import { Application } from 'pixi.js'
import { useDimredLayoutStore } from '@/stores/dimredLayoutStore'

export class PixiDimredApp extends Application {

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
    
  }
}