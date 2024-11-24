import { defineStore } from 'pinia'
import { useMainStore } from '@/stores/mainStore'
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
    // canvas width without the left and right margins
    canvasInnerWidth(): number {
      return this.canvasWidth - 2 * this.tileMargin
    },
    // canvas height without the top and bottom margins
    canvasInnerHeight(): number {
      return this.canvasHeight - 2 * this.tileMargin
    },
    // frame of the row labels tile (absolute positioned)
    rowLabelsTileFrame(): { x: number; y: number; width: number; height: number } {
      return {
        x: this.tileMargin,
        y: this.columnLabelHeight + 2 * this.tileMargin,
        width: this.rowLabelWidth,
        height: this.canvasInnerHeight - this.columnLabelHeight - this.tileMargin,
      }
    },
    // frame of the column labels tile (absolute positioned)
    columnLabelsTileFrame(): { x: number; y: number; width: number; height: number } {
      return {
        x: this.rowLabelWidth + 2 * this.tileMargin,
        y: this.tileMargin,
        width: this.canvasInnerWidth - this.rowLabelWidth - this.tileMargin,
        height: this.columnLabelHeight,
      }
    },
    // frame of the heatmap tile (absolute positioned)
    matrixTileFrame(): { x: number; y: number; width: number; height: number } {
      return {
        x: this.rowLabelWidth + 2 * this.tileMargin,
        y: this.columnLabelHeight + 2 * this.tileMargin,
        width: this.canvasInnerWidth - this.rowLabelWidth - this.tileMargin,
        height: this.canvasInnerHeight - this.columnLabelHeight - this.tileMargin,
      }
    },
    // frame of the row labels container (absolute positioned)
    rowLabelsContainerFrame(): { x: number; y: number; width: number; height: number } {
      return {
        x: this.rowLabelsTileFrame.x + this.tilePadding,
        y: this.rowLabelsTileFrame.y + this.tilePadding,
        width: this.rowLabelsTileFrame.width - 2 * this.tilePadding,
        height: this.rowLabelsTileFrame.height - 2 * this.tilePadding,
      }
    },
    // frame of the column labels container (absolute positioned)
    columnLabelsContainerFrame(): { x: number; y: number; width: number; height: number } {
      return {
        x: this.columnLabelsTileFrame.x + this.tilePadding,
        y: this.columnLabelsTileFrame.y + this.tilePadding,
        width: this.columnLabelsTileFrame.width - 2 * this.tilePadding,
        height: this.columnLabelsTileFrame.height - 2 * this.tilePadding,
      }
    },
    // frame of the heatmap container (absolute positioned)
    matrixContainerFrame(): { x: number; y: number; width: number; height: number } {
      return {
        x: this.matrixTileFrame.x + this.tilePadding,
        y: this.matrixTileFrame.y + this.tilePadding,
        width: this.matrixTileFrame.width - 2 * this.tilePadding,
        height: this.matrixTileFrame.height - 2 * this.tilePadding,
      }
    },

    // how much vertical space is required for the (non-sticky) rows
    requiredHeightOfRows(): number {
      const mainStore = useMainStore()
      const heightOfVisibleRows =
        (mainStore?.itemTree?.getVisibleRowsCount() ?? 0) * this.rowHeight
      return heightOfVisibleRows
    },

    requiredWidthOfColumns(): number {
      const mainStore = useMainStore()
      const widthOfVisibleColumns =
        (mainStore?.attributeTree?.getVisibleColumnsCount() ?? 0) * this.columnWidth
      return widthOfVisibleColumns
    },

    // height of sticky rows (includig gap after sticky rows)
    requiredHeightOfStickyRows(): number {
      const mainStore = useMainStore()
      const heightOfStickyRows = (mainStore?.itemTree?.stickyRows.length ?? 0) * this.rowHeight
      const gap = heightOfStickyRows > 0 ? this.gapAfterStickyRows : 0
      return heightOfStickyRows + gap
    },

    
    availableHeightForRows(): number {
      return this.matrixContainerFrame.height - this.requiredHeightOfStickyRows
    },

    availableWidthForColumns(): number {
      // NOTE: if we ever introduce sticky attributes, we need to subtract the width of the sticky attributes
      return this.matrixContainerFrame.width
    },

    // vertical start position of rows (excluding sticky rows)
    rowsVerticalStartPosition(): number {
      const mainStore = useMainStore()
      const stickyRowAmount = mainStore?.itemTree?.stickyRows.length ?? 0
      const stickyRowPadding = stickyRowAmount > 0 ? this.gapAfterStickyRows : 0
      return stickyRowAmount * this.rowHeight + stickyRowPadding
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
      return Math.ceil((this.horizontalScrollPosition + this.availableWidthForColumns) / this.columnWidth)
    },

    verticalScrollbarVisible(): boolean {
      return this.requiredHeightOfRows > this.availableHeightForRows
    },

    horizontalScrollbarVisible(): boolean {
      return this.requiredWidthOfColumns > this.availableWidthForColumns
    },

    verticalScrollbarThumbHeight(): number {
      return (this.availableHeightForRows / this.requiredHeightOfRows) * this.availableHeightForRows
    },

    verticalScrollbarThumbPosition(): number {
      return (this.verticalScrollPosition / this.requiredHeightOfRows) * this.availableHeightForRows
    },

    horizontalScrollbarThumbWidth(): number {
      return (
        (this.availableWidthForColumns / this.requiredWidthOfColumns) *
        this.availableWidthForColumns
      )
    },

    horizontalScrollbarThumbPosition(): number {
      return (
        (this.horizontalScrollPosition / this.requiredWidthOfColumns) *
        this.availableWidthForColumns
      )
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
    },
  },
})
