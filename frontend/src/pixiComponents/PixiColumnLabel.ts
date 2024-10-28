import { Container, Text } from 'pixi.js'
import { Column } from '@/classes/AttributeTree'
import { useHeatmapStore } from '@/stores/heatmapStore'

export class PixiColumnLabel {
  public container: Container // Text as child
  public column: Column // reference to data structure Column

  constructor(column: Column) {
    this.container = new Container()
    this.column = column
    
    // create the text for the column label
    const text = new Text({
        text: column.name,
        style: {
            fill: 0x000000,
            fontSize: 12,
            fontFamily: 'Arial',
        },
    })
    text.rotation = -Math.PI / 4 // Rotate -90 degrees
    this.container.addChild(text)
    // TODO: icons and other stuff can be added here
    
    this.updatePosition()
    this.updateVisibility()
    
    // event listeners
    this.container.eventMode = 'static'
    this.container.cursor = 'pointer'
    // @ts-ignore: Property 'on' does not exist on type 'CollectionGraphics'
    this.container.on('click', () => {
      useHeatmapStore()?.columnLabelClickEvent(this.column)
    })
  }

  updatePosition() {
    this.container.x = this.column.position * 20 // TODO: hardcoded for the moment
    this.container.y = 150 + this.column.depth * 40 // TODO: this is a super ugly quick fix.. needs better logic 
  }

  updateVisibility() {
    this.container.visible = this.column.position !== -1
  }
}