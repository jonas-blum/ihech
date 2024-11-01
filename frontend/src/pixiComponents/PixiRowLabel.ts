import { Container, Text } from 'pixi.js'
import { Row } from '@/classes/Row'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { useLayoutStore } from '@/stores/layoutStore'

export class PixiRowLabel extends Container {
  public row: Row // reference to data structure Row

  constructor(row: Row) {
    super()
    this.row = row

    // create the text for the row label
    const text = new Text({
      text: row.name,
      style: {
        fill: 0x000000,
        fontSize: 12,
        fontFamily: 'Arial',
      },
    })
    this.addChild(text)
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
    this.x = this.row.depth * useLayoutStore().rowLabelDepthIndent
  }
}
