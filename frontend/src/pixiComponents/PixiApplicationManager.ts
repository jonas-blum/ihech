import { Application } from 'pixi.js'
import { PixiHeatmap } from '@/pixiComponents/PixiHeatmap'
import { useLayoutStore } from '@/stores/layoutStore'

export class PixiApplicationManager {
  app: Application
  heatmap: PixiHeatmap

  constructor(canvasElement: HTMLCanvasElement) {
    // init app
    this.app = new Application()
    this.app.init({
      canvas: canvasElement,
      width: useLayoutStore().canvasWidth,
      height: useLayoutStore().canvasHeight,
      backgroundColor: 0xffffff,
      antialias: true,
      resolution: 2,
      // autoDensity: true, // not sure what this does
    })

    // add heatmap
    this.heatmap = new PixiHeatmap()
    this.app.stage.addChild(this.heatmap)
    // TODO: this needs to be moved
    this.heatmap.position.set(useLayoutStore().heatmapLeftMargin, useLayoutStore().heatmapTopMargin)
  }
}