import { Container, Text } from 'pixi.js'
import { Column } from '@/classes/Column'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { useLayoutStore } from '@/stores/layoutStore'
import { gsap } from 'gsap'

export class PixiColumnLabel extends Container {
  public column: Column // reference to data structure Column

  constructor(column: Column) {
    super()
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

    this.addChild(text)
    // TODO: icons and other stuff can be added here

    this.updatePosition()
    this.updateVisibility()

    // event listeners
    this.eventMode = 'static'
    this.cursor = 'pointer'
    // @ts-ignore: Property 'on' does not exist
    this.on('click', () => {
      useHeatmapStore()?.columnLabelClickEvent(this.column)
    })
    // @ts-ignore: Property 'on' does not exist
    this.on('mouseover', () => {
      useHeatmapStore()?.setHoveredPixiColumnLabel(this)
    })
    // @ts-ignore: Property 'on' does not exist
    this.on('mouseout', () => {
      useHeatmapStore()?.setHoveredPixiColumnLabel(null)
    })
  }

  updatePosition(animate: boolean = true) {
    // if the oldPosition is -1, we want to animate from the parent column position (if available)
    let startPosition =
      this.column.oldPosition === -1 ? (this.column.parent?.position ?? 0) : this.column.oldPosition
    gsap.fromTo(
      this,
      { x: startPosition * useLayoutStore().columnWidth },
      {
        x: this.column.position * useLayoutStore().columnWidth,
        duration: animate ? useLayoutStore().animationDuration : 0,
      },
    )

    let maxDepth = 1 + 1 // TODO: fetch dynamically
    this.y =
      useLayoutStore().columnLabelHeight -
      (maxDepth - this.column.depth) * useLayoutStore().columnLabelDepthIndent
    // this.y = this.children[0].width + this.column.depth * useLayoutStore().columnLabelDepthIndent
  }

  updateVisibility() {
    this.visible = this.column.position !== -1
  }

  updateHighlightedDisplay(highlighted: boolean) {
    // make font bold of text object
    // TODO: this is a bit ugly
    const textChild = this.children[0] as Text
    textChild.style.fontWeight = highlighted ? 'bold' : 'normal'
  }
}
