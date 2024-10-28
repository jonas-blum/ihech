import { Application } from 'pixi.js'
import { PixiHeatmap } from '@/pixiComponents/PixiHeatmap'
import { useHeatmapStore } from '@/stores/heatmapStore'

export class PixiApplicationManager {
  app: Application
  heatmap: PixiHeatmap

  constructor(canvasElement: HTMLCanvasElement, canvasWidth: number, canvasHeight: number) {
    // init app
    this.app = new Application()
    this.app.init({
      canvas: canvasElement,
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: 0xffffff,
      antialias: true,
      resolution: 2,
      // autoDensity: true, // not sure what this does
    })

    // add heatmap
    this.heatmap = new PixiHeatmap()
    this.app.stage.addChild(this.heatmap.container)
    // TODO: this needs to be moved
    this.heatmap.container.position.set(0, 0)

    // add event listeners for drag and drop
    this.app.stage.eventMode = 'static'
    // this.app.stage.hitArea = this.app.renderer.screen
  }
}