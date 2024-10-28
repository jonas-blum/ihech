import { Graphics } from 'pixi.js'
import { useHeatmapStore } from '@/stores/heatmapStore'

export class PixiHeatmapCell extends Graphics {
  // eventMode: string
  // cursor: string // otherwise typescript complains about it
  value: number // the true value of the cell (as received by the backend)
  adjustedValue: number // the value adjusted for the coloring mode
  column: number // the column index of the cell; super important in combination with the sibling pointer implementation! the row data array as well as the attributes never change the order - and this column index allows the correct access to the data

  constructor(
    value: number,
    adjustedValue: number,
    column: number,
    // customProperties: CustomCollectionProperties,
    onClick: (pixiHeatmapCell: PixiHeatmapCell) => void = () => {},
    onMouseOver: (pixiHeatmapCell: PixiHeatmapCell) => void = () => {},
    onMouseOut: (pixiHeatmapCell: PixiHeatmapCell) => void = () => {},
  ) {
    super()
    this.value = value // TODO: not used yet
    this.adjustedValue = adjustedValue
    this.column = column
    this.draw(18, 18) // TODO: hardcoded for the moment
    this.updateTint(useHeatmapStore()?.getHeatmapColor(adjustedValue))
    this.position.x = this.column * 20 // TODO: hardcoded for the moment

    // Initialize custom properties within the namespace object
    // this.customProperties = customProperties
    this.eventMode = 'static'
    this.cursor = 'pointer'

    // event listeners
    // @ts-ignore: Property 'on' does not exist on type 'CollectionGraphics'
    this.on('click', () => {
      onClick(this)
    })
    // @ts-ignore: Property 'on' does not exist on type 'CollectionGraphics'
    this.on('mouseover', () => {
      onMouseOver(this)
    })
    // @ts-ignore: Property 'on' does not exist on type 'CollectionGraphics'
    this.on('mouseout', () => {
      onMouseOut(this)
    })
  }

  draw(width: number, height: number) {
    this.rect(0, 0, width, height).fill(0xffffff)
  }

  updateTint(color: number) {
    this.tint = color
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
