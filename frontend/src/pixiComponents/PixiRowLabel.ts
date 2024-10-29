import { Container, Text } from 'pixi.js'
import { Row } from '@/classes/Row'
import { useHeatmapStore } from '@/stores/heatmapStore'

export class PixiRowLabel {
  public container: Container // Text as child
  public row: Row // reference to data structure Row

  constructor(row: Row) {
    this.container = new Container()
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
    this.container.addChild(text)
    // TODO: icons and other stuff can be added here
    
    this.updatePosition()
    
    // event listeners
    this.container.eventMode = 'static'
    this.container.cursor = 'pointer'
    // @ts-ignore: Property 'on' does not exist on type 'CollectionGraphics'
    this.container.on('click', () => {
      useHeatmapStore()?.rowLabelClickEvent(this.row)
    })
  }

  updatePosition() {
    this.container.x = this.row.depth * 10 // TODO: hardcoded for the moment
  }
}