import { difference } from 'd3'
import { defineStore } from 'pinia'

export const useLayoutStore = defineStore('layout', {
  state: () => ({
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

    animationDuration: 0.3, // duration of animations in seconds

    labelBackgroundColor: 0xf0ece1, // background color of the row labels
  }),
  getters: {},
  actions: {
    // Define your actions here
  },
})
