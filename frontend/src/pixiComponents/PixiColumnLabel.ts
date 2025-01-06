import { Container, Text, Graphics, Sprite, Rectangle } from 'pixi.js'
import { OutlineFilter, DropShadowFilter, GlowFilter } from 'pixi-filters'
import { PixiContainer } from '@/pixiComponents/PixiContainer'
import { AggregateColumn, AttributeColumn, Column } from '@/classes/Column'
import { useMainStore } from '@/stores/mainStore'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'
import { useTextureStore } from '@/stores/textureStore'
import { gsap } from 'gsap'

export class PixiColumnLabel extends PixiContainer {
  public column: Column // reference to data structure Column
  public text: Text
  public icon: Sprite = new Sprite() // maybe not the most efficient to initialize them with empty sprite, however, it is the easiest way to avoid null checks

  constructor(column: Column) {
    super()
    this.column = column

    const heatmapLayoutStore = useHeatmapLayoutStore()

    // TODO: would a texture for the separator line be more efficient?
    const separatorLine = new Graphics()
      .lineTo(0, heatmapLayoutStore.columnLabelHeight)
      .stroke({ width: 1, color: heatmapLayoutStore.labelBackgroundColor })
    separatorLine.x = heatmapLayoutStore.columnWidth - 1
    this.addChild(separatorLine)

    this.hitArea = new Rectangle(0, 0, heatmapLayoutStore.columnWidth, heatmapLayoutStore.columnLabelHeight)

    // create the text for the column label
    this.text = new Text({
      text: '', // NOTE: this is set in the subclasses
      style: {
        fill: 0x000000,
        fontSize: heatmapLayoutStore.fontSize,
        fontFamily: 'Arial',
      },
    })

    // rotate and position text
    this.text.rotation = Math.PI / 2
    this.text.x = (heatmapLayoutStore.columnWidth - this.text.height) / 2 + this.text.height
    this.text.y = heatmapLayoutStore.columnLabelTextPaddingTop
    this.addChild(this.text)

    this.updateVisibility()
    this.updatePosition()

    // event listeners
    this.eventMode = 'static'
    this.cursor = 'pointer'
    // @ts-ignore: Property 'on' does not exist
    this.on('click', () => {
      useMainStore()?.columnLabelClickEvent(this.column)
    })
    // @ts-ignore: Property 'on' does not exist
    this.on('mouseover', () => {
      useMainStore()?.setHoveredPixiColumnLabel(this)
    })
    // @ts-ignore: Property 'on' does not exist
    this.on('mouseout', () => {
      useMainStore()?.setHoveredPixiColumnLabel(null)
    })
    // @ts-ignore: Property 'on' does not exist
    this.on('rightclick', () => {
      useMainStore()?.columnLabelRightClickEvent(this)
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
        duration:
          animate && heatmapLayoutStore.allowAnimations ? heatmapLayoutStore.animationDuration : 0,
      },
    )

    // TODO: max Depth might not be needed
    const maxDepth = useMainStore()?.attributesMaxDepth ?? 0
    this.y = this.column.depth * heatmapLayoutStore.columnLabelDepthIndent

    this.updateIcon()
  }

  createIcon() {
    // needs to be implemented by the subclasses
  }

  updateIcon() {
    // needs to be implemented by the subclasses
  }

  updateText() {
    // needs to be implemented by the subclasses
  }

  updateVisibility() {
    this.visible = this.column.heatmapVisibility
  }

  updateHighlightedDisplay(highlighted: boolean) {
    // make font bold of text object
    this.text.style.fontWeight = highlighted ? 'bold' : 'normal'
  }
}

export class PixiAggregateColumnLabel extends PixiColumnLabel {
  column: AggregateColumn

  constructor(column: AggregateColumn) {
    super(column)
    this.column = column
    this.createIcon()
    this.updateText()
  }

  createIcon(): void {
    const heatmapLayoutStore = useHeatmapLayoutStore()
    this.icon = new Sprite(useTextureStore().chevronTexture)
    this.icon.anchor.set(0.5)
    this.icon.x = heatmapLayoutStore.columnWidth / 2
    this.icon.y = this.icon.width / 2
    this.addChild(this.icon)
    this.updateIcon(false)
  }

  updateIcon(animate: boolean = true): void {
    console.log('updateIcon')
    
    const maxIconSize = useHeatmapLayoutStore().maxIconSize
    this.icon.width = maxIconSize
    this.icon.height = maxIconSize

    gsap.to(this.icon, {
      rotation: this.column.isOpen ? -Math.PI / 2 : 0,
      duration: animate ? useHeatmapLayoutStore().animationDuration : 0,
    })
    
  }

  updateText(): void {
    this.text.text = this.column.getName()
  }
}

export class PixiAttributeColumnLabel extends PixiColumnLabel {
  column: AttributeColumn

  constructor(column: AttributeColumn) {
    super(column)
    this.column = column
    this.createIcon()
    this.updateHighlightedDisplay(false)
    this.text.text = column.name
  }

  updateIcon(animated: boolean = true): void {
    const maxIconSize = useHeatmapLayoutStore().maxIconSize
    this.icon.width = maxIconSize
    this.icon.height = maxIconSize

    // dont show the dot if the column is not selected
    this.icon.visible = this.column.selected
  }

  createIcon(): void {
    const heatmapLayoutStore = useHeatmapLayoutStore()
    this.icon = new Sprite(useTextureStore().circleTexture)
    this.icon.anchor.set(0.5)
    this.icon.x = heatmapLayoutStore.columnWidth / 2
    this.icon.y = this.icon.height / 2
    // NOTE: fix neutral color
    this.icon.tint = heatmapLayoutStore.chevronColor
    this.addChild(this.icon)
  }

  updateHighlightedDisplay(highlighted: boolean): void {
    super.updateHighlightedDisplay(highlighted)
    this.icon.alpha = highlighted ? 1 : 0.25
  }
}
