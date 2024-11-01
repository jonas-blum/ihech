import { Container, Graphics } from 'pixi.js'
import { PixiRow } from '@/pixiComponents/PixiRow'
import { useLayoutStore } from '@/stores/layoutStore'
import { useHeatmapStore } from '@/stores/heatmapStore'
import type { PixiColumnLabel } from './PixiColumnLabel'

export class PixiHeatmap extends Container {
  public rowContainer: Container = new Container() // PixiRow[] as children
  public stickyRowContainer: Container = new Container() // PixiRow[] as children
  public columnLabelsContainer: Container = new Container() // PixiColumnLabel[] as children
  public highlightBox: Graphics = new Graphics()

  constructor() {
    super();

    // add the children to the main container
    this.addChild(this.rowContainer)
    this.addChild(this.stickyRowContainer)
    this.addChild(this.columnLabelsContainer)
    this.addChild(this.highlightBox)

    // set the position of the containers
    this.rowContainer.position.set(0, useLayoutStore().columnLabelHeight)
    this.stickyRowContainer.position.set(0, useLayoutStore().columnLabelHeight)
    this.columnLabelsContainer.position.set(useLayoutStore().rowLabelWidth, 0)

    // draw the highlight box
    this.highlightBox.rect(0, 0, 100, 100).fill(0xff0000)
    // this.highlightBox.setStrokeStyle({color: 0x000000, width: 1}).rect(0, 0, width, height)
  }

  addRow(row: PixiRow) {
    this.rowContainer.addChild(row)
  }

  addStickyRow(row: PixiRow) {
    this.stickyRowContainer.addChild(row)
  }

  removeStickyRow(row: PixiRow) {
    this.stickyRowContainer.removeChild(row)
    row.destroy()
  }

  addColumnLabel(columnLabel: PixiColumnLabel) {
    this.columnLabelsContainer.addChild(columnLabel)
  }

  updateHighlightBox() {
    // by default box is around whole heatmap
    let x = useLayoutStore().rowLabelWidth
    let y = useLayoutStore().columnLabelHeight
    let width =
      (useHeatmapStore().attributeTree?.getAttributeCount() ?? 0) * useLayoutStore().columnWidth
    let height =
      (useHeatmapStore().itemTree?.getVisibleRowsCount() ?? 0) * useLayoutStore().rowHeight

    // now we shrink the vertical size if there is a row highlighted
    const highlightedRow = useHeatmapStore().highlightedRow
    if (highlightedRow) {
      y = useLayoutStore().columnLabelHeight + highlightedRow.position * useLayoutStore().rowHeight
      height = useLayoutStore().rowHeight
    }

    // now we shrink the horizontal size if there is a column highlighted
    const highlightedColumn = useHeatmapStore().highlightedColumn
    if (highlightedColumn) {
      x = useLayoutStore().rowLabelWidth + highlightedColumn.position * useLayoutStore().columnWidth
      width = useLayoutStore().columnWidth
    }

    this.highlightBox.position.set(x, y)
    this.highlightBox.width = width
    this.highlightBox.height = height
  }
}
