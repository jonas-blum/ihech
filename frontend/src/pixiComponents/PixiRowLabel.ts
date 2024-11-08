import { Container, Text, Rectangle, Graphics } from 'pixi.js'
import { Row } from '@/classes/Row'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'

export class PixiRowLabel extends Container {
  public row: Row // reference to data structure Row
  public isSticky: boolean // true for sticky rows
  public text: Text
  public background: Graphics = new Graphics()

  constructor(row: Row, isSticky: boolean = false) {
    super()
    this.row = row
    this.isSticky = isSticky

    // background box
    let backgroundWidth = useHeatmapLayoutStore().rowLabelWidth - useHeatmapLayoutStore().rowLabelPaddingRight
    this.background.rect(0, 1, backgroundWidth, useHeatmapLayoutStore().rowHeight - 2).fill(useHeatmapLayoutStore().labelBackgroundColor)
    this.addChild(this.background)

    // create the text for the row label
    this.text = new Text({
      text: row.name,
      style: {
        fill: 0x000000,
        fontSize: 12,
        fontFamily: 'Arial',
      },
    })
    this.text.y = (useHeatmapLayoutStore().rowHeight - this.text.height) / 2
    this.text.x = useHeatmapLayoutStore().rowLabelTextPaddingLeft
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
    // differntiate between sticky and non-sticky rows
    if (this.isSticky) {
      this.x = 0
      this.background.width = useHeatmapLayoutStore().rowLabelWidth - useHeatmapLayoutStore().rowLabelPaddingRight
    } else {
      this.x = this.row.depth * useHeatmapLayoutStore().rowLabelDepthIndent
      this.background.width =
        useHeatmapLayoutStore().rowLabelWidth -
        this.row.depth * useHeatmapLayoutStore().rowLabelDepthIndent -
        useHeatmapLayoutStore().rowLabelPaddingRight
    }
  }
}
