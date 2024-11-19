import { Container, Text, Rectangle, Graphics } from 'pixi.js'
import { PixiContainer } from '@/pixiComponents/PixiContainer'
import { Row } from '@/classes/Row'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'

export class PixiRowLabel extends PixiContainer {
  public row: Row // reference to data structure Row
  public isSticky: boolean // true for sticky rows
  public text: Text

  constructor(row: Row, isSticky: boolean = false) {
    super()
    this.row = row
    this.isSticky = isSticky

    const heatmapLayoutStore = useHeatmapLayoutStore()

    // background box
    const backgroundWidth = heatmapLayoutStore.rowLabelWidth - 2 * heatmapLayoutStore.tilePadding
    this.setBackgroundRect(0, heatmapLayoutStore.cellPadding, backgroundWidth, heatmapLayoutStore.rowHeight - 2*heatmapLayoutStore.cellPadding)
    this.setBackgroundColor(heatmapLayoutStore.labelBackgroundColor)

    // create the text for the row label
    this.text = new Text({
      text: row.name,
      style: {
        fill: this.row.getColor(),
        fontSize: 12,
        fontFamily: 'Arial',
      },
    })
    this.text.y = (heatmapLayoutStore.rowHeight - this.text.height) / 2
    this.text.x = heatmapLayoutStore.rowLabelTextPaddingLeft
    this.text.width = Math.min(this.text.width, backgroundWidth - 2 * heatmapLayoutStore.rowLabelTextPaddingLeft)
    
    this.addChild(this.text)
    // TODO: icons and other stuff can be added here

    this.updatePosition()

    // event listeners
    this.eventMode = 'static'
    this.cursor = 'pointer'
    // @ts-ignore: Property 'on' does not exist on type 'CollectionGraphics'
    this.on('click', () => {
      useHeatmapStore()?.rowLabelClickEvent(this)
    })
    // @ts-ignore: Property 'on' does not exist
    this.on('mouseover', () => {
      useHeatmapStore()?.setHoveredPixiRowLabel(this)
    })
    // @ts-ignore: Property 'on' does not exist
    this.on('mouseout', () => {
      useHeatmapStore()?.setHoveredPixiRowLabel(null)
    })
  }

  updatePosition() {
    const heatmapLayoutStore = useHeatmapLayoutStore()
    // differntiate between sticky and non-sticky rows
    if (this.isSticky) {
      this.x = 0
      this.setBackgroundWidth(heatmapLayoutStore.rowLabelWidth - 2 * heatmapLayoutStore.tilePadding)
    } else {
      this.x = this.row.depth * heatmapLayoutStore.rowLabelDepthIndent
      this.setBackgroundWidth(
        heatmapLayoutStore.rowLabelWidth -
          this.row.depth * heatmapLayoutStore.rowLabelDepthIndent -
          2 * heatmapLayoutStore.tilePadding,
      )
    }
  }
}
