import { defineStore } from 'pinia'
import { useHeatmapStore } from '@/stores/heatmapStore'

export const useDimredLayoutStore = defineStore('dimredLayoutStore', {
  state: () => ({
    canvasWidth: 0, // width of the canvas
    canvasHeight: 0, // height of the canvas
    
    animationDuration: 0.3, // duration of animations in seconds

    heatmapCanvasBackgroundColor: 0xdddddd, // background color of the heatmap
    
  }),
  getters: {
    dummy(): number {
      return 1 + 1
    },

  },
  actions: {
    dummyAction(param: number) {
      console.log(param)
    },
  },
})
