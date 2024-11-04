import { Graphics, Container, Rectangle } from 'pixi.js'
import { OutlineFilter, DropShadowFilter, GlowFilter } from 'pixi-filters'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'


export class PixiHeatmapCell extends Container {
  cellGraphic: Graphics = new Graphics()
  // eventMode: string
  // cursor: string // otherwise typescript complains about it
  value: number // the true value of the cell (as received by the backend)
  adjustedValue: number // the value adjusted for the coloring mode
  originalColumnIndex: number // the column index of the cell; super important in combination with the sibling pointer implementation! the row data array as well as the attributes never change the order - and this column index allows the correct access to the data

  constructor(
    value: number, // TODO: not used yet
    adjustedValue: number,
    originalColumnIndex: number,
    // customProperties: CustomCollectionProperties,
  ) {
    super()
    this.value = value 
    this.adjustedValue = adjustedValue
    this.originalColumnIndex = originalColumnIndex 
    this.addChild(this.cellGraphic)
    this.drawCellGraphic(useHeatmapLayoutStore().columnWidth - useHeatmapLayoutStore().cellPadding, useHeatmapLayoutStore().rowHeight - useHeatmapLayoutStore().cellPadding)
    this.updateTint(useHeatmapStore()?.colorMap.getColor(adjustedValue))
    this.position.x = this.originalColumnIndex * useHeatmapLayoutStore().columnWidth

    this.eventMode = 'static'
    this.cursor = 'pointer'

    this.hitArea = new Rectangle(0, 0, useHeatmapLayoutStore().columnWidth, useHeatmapLayoutStore().rowHeight)

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
}
