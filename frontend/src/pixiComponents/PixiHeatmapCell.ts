import { Graphics, Container } from 'pixi.js'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { useLayoutStore } from '@/stores/layoutStore'


export class PixiHeatmapCell extends Container {
  cellGraphic: Graphics = new Graphics()
  // eventMode: string
  // cursor: string // otherwise typescript complains about it
  value: number // the true value of the cell (as received by the backend)
  adjustedValue: number // the value adjusted for the coloring mode
  column: number // the column index of the cell; super important in combination with the sibling pointer implementation! the row data array as well as the attributes never change the order - and this column index allows the correct access to the data

  constructor(
    value: number, // TODO: not used yet
    adjustedValue: number,
    column: number, // TODO: rename to columnIndex or originalColumnIndex ?? otherwise its confusing
    // customProperties: CustomCollectionProperties,
  ) {
    super()
    this.value = value 
    this.adjustedValue = adjustedValue
    this.column = column 
    this.addChild(this.cellGraphic)
    this.drawCellGraphic(useLayoutStore().columnWidth - useLayoutStore().cellPadding, useLayoutStore().rowHeight - useLayoutStore().cellPadding)
    this.updateTint(useHeatmapStore()?.getHeatmapColor(adjustedValue))
    this.position.x = this.column * useLayoutStore().columnWidth

    this.eventMode = 'static'
    this.cursor = 'pointer'

    // event listeners
    // @ts-ignore: Property 'on' does not exist
    this.on('click', () => {
      useHeatmapStore()?.cellClickEvent(this)
    })
    // @ts-ignore: Property 'on' does not exist
    this.on('mouseover', () => {
      useHeatmapStore()?.setHoveredPixiHeatmapCell(this)
    })
    // @ts-ignore: Property 'on' does not exist
    this.on('mouseout', () => {
      useHeatmapStore()?.setHoveredPixiHeatmapCell(null)
    })
  }

  drawCellGraphic(width: number, height: number) {
    this.cellGraphic.rect(0, 0, width, height).fill(0xffffff)//.stroke({width: 1, color: 0x000000})
  }

  updateTint(color: number) {
    this.cellGraphic.tint = color
  }

  // clearGraphic() {
  //     this.clear()
  //     this.removeChildren()
  // }

  // updateHighlightedDisplay() {
  //     if (this.highlighted) {
  //         this.tint = DARK_GREY
  //     } else {
  //         this.tint = NEUTRAL_GREY
  //     }
  // }
}
