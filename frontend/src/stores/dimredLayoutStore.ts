import { defineStore } from 'pinia'
import { useMainStore } from '@/stores/mainStore'

export const useDimredLayoutStore = defineStore('dimredLayoutStore', {
  state: () => ({
    canvasWidth: 0, // width of the canvas
    canvasHeight: 0, // height of the canvas
    bubbleSize: 2, // size of the bubbles in the dimred
    bubbleSizeMaximal: 20, // maximal size of the bubbles in the dimred
    bubbleSizeDepthIncrement: 2, // how much bigger the bubbles get with each depth level (with depth=0 being the largest)
    tilePadding: 5, // padding of items inside the "layout tiles"
    tileMargin: 20, // margin between "layout tiles"

    dimredNeedsToBeScaled: 0, // counter that is incremented when the dimred needs to be scaled (because rows where expanded or collapsed)

    animationDuration: 0.3, // duration of animations in seconds
    showParentBubbles: false, // whether to show the parent bubbles in the dimred

    dimredCanvasBackgroundColor: 0xffffff, // background color of the heatmap
    basicBubbleColor: 0x654321, // basic color of the bubbles
  }),
  getters: {
    // canvas width without the left and right margins
    canvasInnerWidth(): number {
      return this.canvasWidth - 1 * this.tileMargin - 2 // NOTE: dirty fix to make the gap between the dimred and heatmap canvas (almost) equal
    },
    // canvas height without the top and bottom margins
    canvasInnerHeight(): number {
      return this.canvasHeight - 2 * this.tileMargin
    },
    // needs to be a square, so we take the smaller of the two dimensions.. and take some padding
    dimredSize(): number {
      return Math.min(
        this.dimredTileFrame.width - this.tilePadding * 2 - this.bubbleSizeMaximal * 2.2, 
        this.dimredTileFrame.height - this.tilePadding * 2 - this.bubbleSizeMaximal * 2.2
      )
    },
    // if the canvasWidth > canvasHeight, we need to center the dimred horizontally
    dimredXPadding(): number {
      return (this.canvasInnerWidth - this.dimredSize) / 2
    },
    // if the canvasHeight > canvasWidth, we need to center the dimred vertically
    dimredYPadding(): number {
      return (this.canvasInnerHeight - this.dimredSize) / 2
    },
    dimredTileFrame(): { x: number; y: number; width: number; height: number } {
      return {
        x: this.tileMargin,
        y: this.tileMargin,
        width: this.canvasInnerWidth,
        height: this.canvasInnerHeight,
      }
    }
  },
  actions: {
    dummyAction(param: number) {
      console.log(param)
    },
  },
})
