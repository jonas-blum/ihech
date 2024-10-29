import { Container, Text } from 'pixi.js'
import { Column } from '@/classes/Column'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { useLayoutStore } from '@/stores/layoutStore'


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

    // rotate the text if it has no children
    // if (!this.column.hasChildren()) {
        // text.rotation = -Math.PI / 4 // Rotate -45 degrees
        text.rotation = -Math.PI / 2 // Rotate -90 degrees
    // }

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
    this.container.x = this.column.position * useLayoutStore().columnWidth
    let maxDepth = 1 + 1// TODO: fetch dynamically
    
    this.container.y = useLayoutStore().columnLabelHeight - (maxDepth - this.column.depth) * useLayoutStore().columnLabelDepthIndent
    // this.container.y = this.container.children[0].width + this.column.depth * useLayoutStore().columnLabelDepthIndent
  }

  updateVisibility() {
    this.container.visible = this.column.position !== -1
  }
}