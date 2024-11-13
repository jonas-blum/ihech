import { Container, Text, Graphics } from 'pixi.js'
import { OutlineFilter, DropShadowFilter, GlowFilter } from 'pixi-filters'
import { PixiContainer } from '@/pixiComponents/PixiContainer'
import { Column } from '@/classes/Column'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'
import { gsap } from 'gsap'

export class PixiColumnLabel extends PixiContainer {
  public column: Column // reference to data structure Column
  public text: Text

  constructor(column: Column) {
    super()
    this.column = column

    const heatmapLayoutStore = useHeatmapLayoutStore()

    // background box
    const backgroundHeight =
      heatmapLayoutStore.columnLabelHeight - heatmapLayoutStore.columnLabelPaddingBottom
    this.setBackgroundRect(1, 0, heatmapLayoutStore.columnWidth - 2, backgroundHeight)

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
    this.text.x = (heatmapLayoutStore.columnWidth - this.text.height) / 2
    this.text.rotation = -Math.PI / 2
    this.text.y =
      heatmapLayoutStore.columnLabelHeight -
      heatmapLayoutStore.columnLabelPaddingBottom -
      heatmapLayoutStore.columnLabelTextPaddingBottom

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
    const heatmapLayoutStore = useHeatmapLayoutStore()

    // if the oldPosition is -1, we want to animate from the parent column position (if available)
    const startPosition =
      this.column.oldPosition === -1 ? (this.column.parent?.position ?? 0) : this.column.oldPosition
    gsap.fromTo(
      this,
      { x: startPosition * heatmapLayoutStore.columnWidth },
      {
        x: this.column.position * heatmapLayoutStore.columnWidth,
        duration: animate ? heatmapLayoutStore.animationDuration : 0,
      },
    )

    const maxDepth = useHeatmapStore()?.attributesMaxDepth ?? 0
    // BIG TODO: I need to figure out how I want to align the hierarchical column labels
    // this.y = this.column.depth * heatmapLayoutStore.columnLabelDepthIndent - maxDepth * heatmapLayoutStore.columnLabelDepthIndent
    this.text.y =
      heatmapLayoutStore.columnLabelHeight -
      heatmapLayoutStore.columnLabelPaddingBottom -
      heatmapLayoutStore.columnLabelTextPaddingBottom -
      (maxDepth - this.column.depth) * heatmapLayoutStore.columnLabelDepthIndent
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
