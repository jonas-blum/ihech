import { Application } from 'pixi.js'
import { PixiHeatmap } from '@/pixiComponents/PixiHeatmap'
import { useLayoutStore } from '@/stores/layoutStore'

export class PixiHeatmapApp extends Application {
  heatmap: PixiHeatmap

  constructor(canvasElement: HTMLCanvasElement) {
    super()
    // init app
    this.init({
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
    this.stage.addChild(this.heatmap)
    // TODO: this needs to be moved
    this.heatmap.position.set(useLayoutStore().heatmapLeftMargin, useLayoutStore().heatmapTopMargin)
  }
}