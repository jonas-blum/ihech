import { Container, Text, Rectangle, Graphics } from 'pixi.js'
import { OutlineFilter, DropShadowFilter, GlowFilter } from 'pixi-filters'
import { PixiContainer } from '@/pixiComponents/PixiContainer'
import { Row } from '@/classes/Row'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'
import { gsap } from 'gsap'

export class PixiRowLabel extends PixiContainer {
  public row: Row // reference to data structure Row
  public isSticky: boolean // true for sticky rows
  public text: Text

  constructor(row: Row, isSticky: boolean = false) {
    super()
    this.row = row
    this.isSticky = isSticky

    const heatmapLayoutStore = useHeatmapLayoutStore()

    // background box
    this.addBackground(heatmapLayoutStore.labelBackgroundColor)
    const backgroundWidth = heatmapLayoutStore.rowLabelWidth - 2 * heatmapLayoutStore.tilePadding
    this.setBackgroundRect(
      0,
      heatmapLayoutStore.cellPadding,
      backgroundWidth,
      heatmapLayoutStore.rowHeight - 2 * heatmapLayoutStore.cellPadding,
    )

    // create the text for the row label
    this.text = new Text({
      text: row.name,
      style: {
        fill: this.row.getColor(),
        fontSize: 12,
        fontFamily: 'Arial',
      },
    })
    this.text.y = (heatmapLayoutStore.rowHeight - this.text.height) / 2
    this.text.x = heatmapLayoutStore.rowLabelTextPaddingLeft
    this.text.width = Math.min(
      this.text.width,
      backgroundWidth - 2 * heatmapLayoutStore.rowLabelTextPaddingLeft,
    )

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

  updatePosition(animate: boolean = true) {
    const heatmapLayoutStore = useHeatmapLayoutStore()
    // differntiate between sticky and non-sticky rows
    if (this.isSticky) {
      this.setBackgroundWidth(heatmapLayoutStore.rowLabelWidth)
    } else {
      this.x = this.row.depth * heatmapLayoutStore.rowLabelDepthIndent
      this.setBackgroundWidth(heatmapLayoutStore.rowLabelWidth)

      const startPosition =
        this.row.oldPosition === -1 ? (this.row.parent?.position ?? 0) : this.row.oldPosition
      gsap.fromTo(
        this,
        { y: startPosition * heatmapLayoutStore.rowHeight },
        {
          y: this.row.position * heatmapLayoutStore.rowHeight,
          duration:
            animate && heatmapLayoutStore.allowAnimations
              ? heatmapLayoutStore.animationDuration
              : 0,
        },
      )
    }
  }

  updateVisibility() {
    const heatmapLayoutStore = useHeatmapLayoutStore()

    if (this.isSticky) {
      this.visible = true
      return
    }

    // this is our custom culling mechanism -> prevent rendering if not in visible viewport
    this.visible =
      this.row.position !== -1 &&
      this.row.position >= heatmapLayoutStore.firstVisibleRowIndex &&
      this.row.position <= heatmapLayoutStore.lastVisibleRowIndex
  }

  updateHighlightedDisplay(highlighted: boolean) {
    // make font bold of text object
    this.text.style.fontWeight = highlighted ? 'bold' : 'normal'

    // make background of row label glow
    this.background!.filters = highlighted ? [new GlowFilter()] : []
  }
}
