import { Container, Text, Rectangle, Graphics, Sprite } from 'pixi.js'
import { OutlineFilter, DropShadowFilter, GlowFilter } from 'pixi-filters'
import { PixiContainer } from '@/pixiComponents/PixiContainer'
import { AggregateRow, Row } from '@/classes/Row'
import { useMainStore } from '@/stores/mainStore'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'
import { useTextureStore } from '@/stores/textureStore'
import { gsap } from 'gsap'

export class PixiRowLabel extends PixiContainer {
  public row: Row // reference to data structure Row
  public text: Text
  public icon: Sprite = new Sprite() // maybe not the most efficient to initialize them with empty sprite, however, it is the easiest way to avoid null checks

  constructor(row: Row) {
    super()
    this.row = row

    const heatmapLayoutStore = useHeatmapLayoutStore()

    // background box
    // this.addBackground(heatmapLayoutStore.labelBackgroundColor)
    // const backgroundWidth = heatmapLayoutStore.rowLabelWidth - 2 * heatmapLayoutStore.tilePadding
    // this.setBackgroundRect(
    //   0,
    //   heatmapLayoutStore.cellPadding,
    //   backgroundWidth,
    //   heatmapLayoutStore.rowHeight - 2 * heatmapLayoutStore.cellPadding,
    // )

    const width = heatmapLayoutStore.rowLabelWidth - 2 * heatmapLayoutStore.tilePadding
    const separatorLine = new Graphics()
      .lineTo(width, 0)
      .stroke({ width: 1, color: heatmapLayoutStore.labelBackgroundColor })
    // separatorLine.x = heatmapLayoutStore.rowLabelTextPaddingLeft
    separatorLine.y = heatmapLayoutStore.rowHeight - 1
    this.addChild(separatorLine)

    this.hitArea = new Rectangle(0, 0, width, heatmapLayoutStore.rowHeight)

    // create the text for the row label
    this.text = new Text({
      text: row.name,
      style: {
        fill: this.row.getColor(),
        // fill: 0x000000,
        fontSize: 12,
        fontFamily: 'Arial',
      },
    })
    this.text.y = (heatmapLayoutStore.rowHeight - this.text.height) / 2
    this.text.x = heatmapLayoutStore.rowLabelTextPaddingLeft
    this.text.width = Math.min(
      this.text.width,
      width - 2 * heatmapLayoutStore.rowLabelTextPaddingLeft,
    )

    this.addChild(this.text)
    // TODO: icons and other stuff can be added here

    this.updatePosition()

    // event listeners
    this.eventMode = 'static'
    this.cursor = 'pointer'
    // @ts-ignore: Property 'on' does not exist on type 'CollectionGraphics'
    this.on('click', () => {
      useMainStore()?.rowLabelClickEvent(this)
    })
    // @ts-ignore: Property 'on' does not exist
    this.on('mouseover', () => {
      useMainStore()?.setHoveredPixiRowLabel(this)
    })
    // @ts-ignore: Property 'on' does not exist
    this.on('mouseout', () => {
      useMainStore()?.setHoveredPixiRowLabel(null)
    })
  }

  updatePosition(animate: boolean = true) {
    const heatmapLayoutStore = useHeatmapLayoutStore()
    this.x = this.row.depth * heatmapLayoutStore.rowLabelDepthIndent
    // this.setBackgroundWidth(heatmapLayoutStore.rowLabelWidth)

    const startPosition =
      this.row.oldPosition === -1 ? (this.row.parent?.position ?? 0) : this.row.oldPosition
    gsap.fromTo(
      this,
      { y: startPosition * heatmapLayoutStore.rowHeight },
      {
        y: this.row.position * heatmapLayoutStore.rowHeight,
        duration:
          animate && heatmapLayoutStore.allowAnimations ? heatmapLayoutStore.animationDuration : 0,
      },
    )

    this.updateIcon()
  }

  createIcon() {
    // needs to be implemented by the subclasses
  }

  updateIcon() {
    // needs to be implemented by the subclasses
  }

  updateVisibility() {
    this.visible = this.row.heatmapVisibility
  }

  updateHighlightedDisplay(highlighted: boolean) {
    // make font bold of text object
    this.text.style.fontWeight = highlighted ? 'bold' : 'normal'

    // make background of row label glow
    // this.background!.filters = highlighted ? [new GlowFilter()] : []
  }
}

export class PixiAggregateRowLabel extends PixiRowLabel {
  row: AggregateRow

  constructor(row: AggregateRow) {
    super(row)
    this.row = row
    this.createIcon()
  }

  createIcon(): void {
    const heatmapLayoutStore = useHeatmapLayoutStore()
    this.icon = new Sprite(useTextureStore().chevronTexture)
    this.icon.anchor.set(0.5)
    this.icon.x = this.icon.width / 2
    this.icon.y = heatmapLayoutStore.rowHeight / 2
    this.addChild(this.icon)
  }

  updateIcon(animate: boolean = true): void {
    gsap.to(this.icon, {
      rotation: this.row.isOpen ? 0 : -Math.PI / 2,
      duration: animate ? useHeatmapLayoutStore().animationDuration : 0,
    })
  }
}

export class PixiItemRowLabel extends PixiRowLabel {
  constructor(row: Row) {
    super(row)
    this.createIcon()
    this.updateHighlightedDisplay(false)
  }

  createIcon(): void {
    const heatmapLayoutStore = useHeatmapLayoutStore()
    this.icon = new Sprite(useTextureStore().circleTexture)
    this.icon.anchor.set(0.5)
    this.icon.x = this.icon.width / 2
    this.icon.y = heatmapLayoutStore.rowHeight / 2
    this.addChild(this.icon)
  }

  updateIcon(): void {
    this.icon.tint = this.row.getColor()
  }

  updateHighlightedDisplay(highlighted: boolean): void {
    super.updateHighlightedDisplay(highlighted)
    // update opacity of the icon
    this.icon.alpha = highlighted ? 1 : 0.5
  }
}

// NOTE: this extends the PixiItemRowLabel
export class PixiStickyRowLabel extends PixiItemRowLabel {
  constructor(row: Row) {
    super(row)
    this.createIcon()
    this.updateHighlightedDisplay(false)
  }

  createIcon(): void {
    const heatmapLayoutStore = useHeatmapLayoutStore()
    this.icon = new Sprite(useTextureStore().starTexture) // TODO: change to sticky icon
    this.icon.anchor.set(0.5)
    this.icon.x = this.icon.width / 2
    this.icon.y = heatmapLayoutStore.rowHeight / 2 - 1
    this.addChild(this.icon)
    this.updateIcon()
  }

  updatePosition(animate?: boolean): void {
    const heatmapLayoutStore = useHeatmapLayoutStore()
    this.setBackgroundWidth(heatmapLayoutStore.rowLabelWidth)
  }

  updateVisibility(): void {
    this.visible = true
  }
}
