import { Container, Text, Graphics } from 'pixi.js'
import { OutlineFilter, DropShadowFilter, GlowFilter } from 'pixi-filters'
import { Column } from '@/classes/Column'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'
import { gsap } from 'gsap'

export class PixiColumnLabel extends Container {
  public column: Column // reference to data structure Column
  public text: Text
  public background: Graphics = new Graphics()

  constructor(column: Column) {
    super()
    this.column = column

    // background box
    let backgroundHeight =
      useHeatmapLayoutStore().columnLabelHeight - useHeatmapLayoutStore().columnLabelPaddingBottom
    this.background
      .rect(1, 0, useHeatmapLayoutStore().columnWidth - 2, backgroundHeight)
      .fill(useHeatmapLayoutStore().labelBackgroundColor)
    this.addChild(this.background)

    // create the text for the column label
    this.text = new Text({
      text: column.name,
      style: {
        fill: 0x000000,
        fontSize: 12,
        fontFamily: 'Arial',
      },
    })

    // rotate and position text
    this.text.x = (useHeatmapLayoutStore().columnWidth - this.text.height) / 2
    this.text.rotation = -Math.PI / 2
    this.text.y =
      useHeatmapLayoutStore().columnLabelHeight -
      useHeatmapLayoutStore().columnLabelPaddingBottom -
      useHeatmapLayoutStore().columnLabelTextPaddingBottom

    this.addChild(this.text)
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
      { x: startPosition * useHeatmapLayoutStore().columnWidth },
      {
        x: this.column.position * useHeatmapLayoutStore().columnWidth,
        duration: animate ? useHeatmapLayoutStore().animationDuration : 0,
      },
    )

    let maxDepth = 1 + 1 // TODO: fetch dynamically
    // BIG TODO: I need to figure out how I want to align the hierarchical column labels
    // this.y = this.column.depth * useHeatmapLayoutStore().columnLabelDepthIndent
    // this.y = this.children[0].width + this.column.depth * useHeatmapLayoutStore().columnLabelDepthIndent
  }

  updateVisibility() {
    this.visible = this.column.position !== -1
  }

  updateHighlightedDisplay(highlighted: boolean) {
    // make font bold of text object
    this.text.style.fontWeight = highlighted ? 'bold' : 'normal'

    // make background of column label glow
    this.background.filters = highlighted ? [new GlowFilter()] : []
    // make sure the higlighted column is rendered last, otherwise the glow filter is not visible
    if (highlighted && this.parent) {
      this.parent.setChildIndex(this, this.parent.children.length - 1)
    }
  }
}
