import { defineStore } from 'pinia'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { set } from '@vueuse/core'

export const useHeatmapLayoutStore = defineStore('heatmapLayoutStore', {
  state: () => ({
    canvasWidth: 0, // width of the canvas
    canvasHeight: 0, // height of the canvas
    rowHeight: 20, // height of a row in the heatmap
    columnWidth: 20, // width of a column in the heatmap
    columnLabelHeight: 200, // top margin until the rows start
    columnLabelPaddingBottom: 5, // prevent column labels from touching the cells
    columnLabelTextPaddingBottom: 5, // bottom padding of the column label text compared to the column label background
    rowLabelWidth: 200, // left margin until the columns start
    rowLabelTextPaddingLeft: 5, // left padding of the row label text compared to the row label background
    rowLabelPaddingRight: 5, // prevent row labels from touching the cells
    cellPadding: 1, // inset padding of the cells (will create a gap between cells)
    gapAfterStickyRows: 10, // gap between sticky rows and the rest of the heatmap rows
    rowLabelDepthIndent: 10, // indent for each depth level in the row labels
    columnLabelDepthIndent: 10, // indent for each depth level in the row labels
    heatmapLeftMargin: 5, // prevent the heatmap from touching the left border
    heatmapRightMargin: 5, // prevent the heatmap from touching the right border
    heatmapTopMargin: 5, // prevent the heatmap from touching the top border
    heatmapBottomMargin: 5, // prevent the heatmap from touching the bottom border
    tilePadding: 5, // padding of items inside the "layout tiles"; do not confuse with cellPadding
    tileMargin: 20, // margin between "layout tiles"

    verticalScrollbarWidth: 10, // width of the vertical scrollbar
    verticalScrollPosition: 0, // current vertical scroll position
    horizontalScrollbarHeight: 10, // height of the horizontal scrollbar
    horizontalScrollPosition: 0, // current horizontal scroll position

    animationDuration: 0.3, // duration of animations in seconds
    allowAnimations: false, // if false, no animations will be performed

    heatmapCanvasBackgroundColor: 0xffffff, // background color of the heatmap
    labelBackgroundColor: 0xeeeeee, // background color of the row labels
    scrollbarBackgroundColor: 0xf0ece1, // background color of the scrollbar
    scrollbarThumbColor: 0x000000, // color of the scrollbar thumb
  }),
  getters: {
    // heatmap canvas width without the left and right margins
    canvasInnerWidth(): number {
      return this.canvasWidth - 2 * this.tileMargin
    },
    // heatmap canvas height without the top and bottom margins
    canvasInnerHeight(): number {
      return this.canvasHeight - 2 * this.tileMargin
    },

    // how much vertical space is required for the whole heatmap
    requiredHeightOfRows(): number {
      const heatmapStore = useHeatmapStore()
      const heightOfVisibleRows =
        (heatmapStore?.itemTree?.getVisibleRowsCount() ?? 0) * this.rowHeight
      return heightOfVisibleRows
    },

    requiredWidthOfColumns(): number {
      const heatmapStore = useHeatmapStore()
      const widthOfVisibleColumns =
        (heatmapStore?.attributeTree?.getVisibleColumnsCount() ?? 0) * this.columnWidth
      return widthOfVisibleColumns
    },

    availableHeightForRows(): number {
      return this.canvasInnerHeight - this.rowsVerticalStartPosition - 2 * this.tilePadding
    },

    availableWidthForColumns(): number {
      return this.canvasInnerWidth - this.rowLabelWidth - 2 * this.tilePadding
    },

    // vertical start position of rows (excluding sticky rows)
    rowsVerticalStartPosition(): number {
      const heatmapStore = useHeatmapStore()
      const stickyRowAmount = heatmapStore?.itemTree?.stickyRows.length ?? 0
      const stickyRowPadding = stickyRowAmount > 0 ? this.gapAfterStickyRows : 0
      return this.columnLabelHeight + this.tileMargin + this.tilePadding + stickyRowAmount * this.rowHeight + stickyRowPadding
    },

    // horizontal start position of columns
    columnsHorizontalStartPosition(): number {
      return this.rowLabelWidth + this.tileMargin + this.tilePadding
    },

    firstVisibleRowIndex(): number {
      return Math.floor(this.verticalScrollPosition / this.rowHeight)
    },

    lastVisibleRowIndex(): number {
      return Math.ceil((this.verticalScrollPosition + this.canvasHeight) / this.rowHeight)
    },

    firstVisibleColumnIndex(): number {
      return Math.floor(this.horizontalScrollPosition / this.columnWidth)
    },

    lastVisibleColumnIndex(): number {
      return Math.ceil((this.horizontalScrollPosition + this.canvasWidth) / this.columnWidth)
    },

    verticalScrollbarVisible(): boolean {
      return this.requiredHeightOfRows > this.availableHeightForRows
    },

    horizontalScrollbarVisible(): boolean {
      return this.requiredWidthOfColumns > this.availableWidthForColumns
    },

    verticalScrollbarThumbHeight(): number {
      return this.availableHeightForRows / this.requiredHeightOfRows * this.availableHeightForRows
    },

    verticalScrollbarThumbPosition(): number {
      return this.verticalScrollPosition / this.requiredHeightOfRows * this.availableHeightForRows
    },

    horizontalScrollbarThumbHeight(): number {
      return this.availableWidthForColumns / this.requiredWidthOfColumns * this.availableWidthForColumns
    },

    horizontalScrollbarThumbPosition(): number {
      return this.horizontalScrollPosition / this.requiredWidthOfColumns * this.availableWidthForColumns
    },
  },
  actions: {
    setVerticalScrollPosition(position: number) {
      // clamp the position to the available height
      // make sure the position is updated based on the ratio of the required height
      const maxPosition = this.requiredHeightOfRows - this.availableHeightForRows
      this.verticalScrollPosition = Math.max(0, Math.min(maxPosition, position))
    },
    setHorizontalScrollPosition(position: number) {
      // clamp the position to the available width
      // make sure the position is updated based on the ratio of the required width
      const maxPosition = this.requiredWidthOfColumns - this.availableWidthForColumns
      this.horizontalScrollPosition = Math.max(0, Math.min(maxPosition, position))
    }
  },
})
