import { defineStore } from 'pinia'
import { useHeatmapStore } from '@/stores/heatmapStore'

export const useDimredLayoutStore = defineStore('dimredLayoutStore', {
  state: () => ({
    canvasWidth: 0, // width of the canvas
    canvasHeight: 0, // height of the canvas
    bubbleSize: 2, // size of the bubbles in the dimred
    bubbleSizeMaximal: 20, // maximal size of the bubbles in the dimred
    bubbleSizeDepthIncrement: 2, // how much bigger the bubbles get with each depth level (with depth=0 being the largest)

    animationDuration: 0.3, // duration of animations in seconds

    dimredCanvasBackgroundColor: 0xffffff, // background color of the heatmap
    basicBubbleColor: 0x654321, // basic color of the bubbles
  }),
  getters: {
    // because the dimred points need to be quadratic, we take the minimum of the width and height
    dimredSize(): number {
      return Math.min(this.canvasWidth, this.canvasHeight)
    },
    // if the canvasWidth > canvasHeight, we need to center the dimred horizontally
    dimredXPadding(): number {
      return (this.canvasWidth - this.dimredSize) / 2
    },
    // if the canvasHeight > canvasWidth, we need to center the dimred vertically
    dimredYPadding(): number {
      return (this.canvasHeight - this.dimredSize) / 2
    },
  },
  actions: {
    dummyAction(param: number) {
      console.log(param)
    },
  },
})
