import { defineStore } from 'pinia'
import { useHeatmapStore } from '@/stores/heatmapStore'

export const useLayoutStore = defineStore('layout', {
  state: () => ({
    canvasWidth: 0, // width of the canvas
    canvasHeight: 0, // height of the canvas
    rowHeight: 20, // height of a row in the heatmap
    columnWidth: 20, // width of a column in the heatmap
    columnLabelHeight: 120, // top margin until the rows start
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
    heatmapTopMargin: 5, // prevent the heatmap from touching the top border

    verticalScrollbarWidth: 30, // width of the vertical scrollbar
    verticalScrollPosition: 0, // current vertical scroll position

    animationDuration: 0.3, // duration of animations in seconds

    heatmapCanvasBackgroundColor: 0xeeeeee, // background color of the heatmap
    labelBackgroundColor: 0xf0ece1, // background color of the row labels
    scrollbarBackgroundColor: 0xf0ece1, // background color of the scrollbar
    scrollbarThumbColor: 0xE8D8AC, // color of the scrollbar thumb
  }),
  getters: {
    // how much vertical space is required for the whole heatmap
    requiredHeight(): number {
      const heatmapStore = useHeatmapStore()
      const heightOfVisibleRows =
        (heatmapStore?.itemTree?.getVisibleRowsCount() ?? 0) * this.rowHeight
      const heightOfStickyRows = (heatmapStore?.itemTree?.stickyRows.length ?? 0) * this.rowHeight
      const stickyRowPadding = heightOfStickyRows > 0 ? this.gapAfterStickyRows : 0
      return this.columnLabelHeight + heightOfVisibleRows + heightOfStickyRows + stickyRowPadding
    },

    // vertical start position of rows (excluding sticky rows)
    rowsVerticalStartPosition(): number {
      const heatmapStore = useHeatmapStore()
      const stickyRowAmount = heatmapStore?.itemTree?.stickyRows.length ?? 0
      const stickyRowPadding = stickyRowAmount > 0 ? this.gapAfterStickyRows : 0
      return this.columnLabelHeight + stickyRowAmount * this.rowHeight + stickyRowPadding
    },

    verticalScrollbarVisible(): boolean {
      return this.requiredHeight > this.canvasHeight
    },

    verticalScrollbarTrackHeight(): number {
      return this.canvasHeight - this.rowsVerticalStartPosition
    },

    verticalScrollbarThumbHeight(): number {
      const visibleRatio = this.verticalScrollbarTrackHeight / this.requiredHeight
      return visibleRatio * this.verticalScrollbarTrackHeight
    },

  },
  actions: {
    setVerticalScrollPosition(position: number) {
      this.verticalScrollPosition = position
    },
  },
})
