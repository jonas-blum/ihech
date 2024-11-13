import { Graphics, Container, Rectangle, Texture, Sprite } from 'pixi.js'
import { OutlineFilter, DropShadowFilter, GlowFilter } from 'pixi-filters'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'

export class PixiHeatmapCell extends Container {
  cellGraphic: Sprite
  // eventMode: string
  // cursor: string // otherwise typescript complains about it
  value: number // the true value of the cell (as received by the backend)
  adjustedValue: number // the value adjusted for the coloring mode
  originalColumnIndex: number // the column index of the cell; super important in combination with the sibling pointer implementation! the row data array as well as the attributes never change the order - and this column index allows the correct access to the data

  constructor(
    cellTexture: Texture,
    value: number, // TODO: not used yet
    adjustedValue: number,
    originalColumnIndex: number,
    // customProperties: CustomCollectionProperties,
  ) {
    super()

    const heatmapStore = useHeatmapStore()
    const heatmapLayoutStore = useHeatmapLayoutStore()

    this.cellGraphic = new Sprite(cellTexture)

    this.value = value
    this.adjustedValue = adjustedValue
    this.originalColumnIndex = originalColumnIndex
    this.addChild(this.cellGraphic)
    // this.drawCellGraphic(
    //   heatmapLayoutStore.columnWidth - heatmapLayoutStore.cellPadding,
    //   heatmapLayoutStore.rowHeight - heatmapLayoutStore.cellPadding,
    // )
    this.updateTint(heatmapStore?.colorMap.getColor(adjustedValue))
    this.position.x = this.originalColumnIndex * heatmapLayoutStore.columnWidth

    this.eventMode = 'static'
    this.cursor = 'pointer'

    this.hitArea = new Rectangle(0, 0, heatmapLayoutStore.columnWidth, heatmapLayoutStore.rowHeight)

    // event listeners
    // @ts-ignore: Property 'on' does not exist
    this.on('click', () => {
      heatmapStore?.cellClickEvent(this)
    })
    // @ts-ignore: Property 'on' does not exist
    this.on('mouseover', () => {
      heatmapStore?.setHoveredPixiHeatmapCell(this)
    })
    // @ts-ignore: Property 'on' does not exist
    this.on('mouseout', () => {
      heatmapStore?.setHoveredPixiHeatmapCell(null)
    })
  }

  // drawCellGraphic(width: number, height: number) {
  //   this.cellGraphic.rect(0, 0, width, height).fill(0xffffff) //.stroke({width: 1, color: 0x000000})
  // }

  updateTint(color: number) {
    this.cellGraphic.tint = color
  }
}
