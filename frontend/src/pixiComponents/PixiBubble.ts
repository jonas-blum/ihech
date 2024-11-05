import { Container, Text, Graphics } from 'pixi.js'
import { OutlineFilter, DropShadowFilter, GlowFilter } from 'pixi-filters'
import { Row } from '@/classes/Row'
import { PixiHeatmapCell } from '@/pixiComponents/PixiHeatmapCell'
import { PixiRowLabel } from '@/pixiComponents/PixiRowLabel'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'
import { useDimredLayoutStore } from '@/stores/dimredLayoutStore'
import { gsap } from 'gsap'

export class PixiBubble extends Container {
  public row: Row // reference to data structure Row
  public bubbleGraphic: Graphics = new Graphics()

  constructor(row: Row) {
    super()
    this.row = row

    const heatmapStore = useHeatmapStore()

    this.addChild(this.bubbleGraphic)
    this.drawBubbleGraphic()
    this.updateTint()
    // this.position.x = this.originalColumnIndex * useHeatmapLayoutStore().columnWidth

    this.eventMode = 'static'
    this.cursor = 'pointer'

    // this.hitArea = new Rectangle(0, 0, useHeatmapLayoutStore().columnWidth, useHeatmapLayoutStore().rowHeight)

    // event listeners
    // @ts-ignore: Property 'on' does not exist
    this.on('click', () => {
      heatmapStore?.bubbleClickEvent(this)
    })
    // @ts-ignore: Property 'on' does not exist
    this.on('mouseover', () => {
      heatmapStore?.setHoveredPixiBubble(this)
    })
    // @ts-ignore: Property 'on' does not exist
    this.on('mouseout', () => {
      heatmapStore?.setHoveredPixiBubble(null)
    })

    this.updatePosition()
    this.updateVisibility()
    this.updateSize()
  }

  drawBubbleGraphic() {
    this.bubbleGraphic.circle(0, 0, useDimredLayoutStore().bubbleSize).fill(0xffffff) //.stroke({width: 1, color: 0x000000})
    this.updateOpacity(0.5)

    // Set the pivot to the center of the bubble
    this.bubbleGraphic.pivot.set(this.bubbleGraphic.width / 2, this.bubbleGraphic.height / 2)
  }

  updatePosition(animate: boolean = true) {
    // NOTE: we are positioning this (=Container) and not the bubbleGraphic

    // TODO: not happy with this implementation, but it works for now
    // TODO: ideally the backend coordinates should already be normalized to [0, 1] and then multiplied by the dimredSize
    const heatmapStore = useHeatmapStore()
    const dimredLayoutStore = useDimredLayoutStore()
    let maxX = heatmapStore?.getDimRedMaxXValue
    let maxY = heatmapStore?.getDimRedMaxYValue
    let minX = heatmapStore?.getDimRedMinXValue
    let minY = heatmapStore?.getDimRedMinYValue

    let x = this.row.dimRedPosition.x
    let y = this.row.dimRedPosition.y

    // normalize x and y to be between 0 and 1
    let xNormalized = (x - minX) / (maxX - minX)
    let yNormalized = (y - minY) / (maxY - minY)

    this.position.set(
      xNormalized * dimredLayoutStore.dimredSize,
      yNormalized * dimredLayoutStore.dimredSize,
    )
  }

  updateTint(color?: number) {
    if (color === undefined) {
      color = useDimredLayoutStore().basicBubbleColor
    }
    this.bubbleGraphic.tint = color
  }

  updateOpacity(alpha: number) {
    this.bubbleGraphic.alpha = alpha
  }

  updateSize() {
    if (this.row.position === -1) {
      return
    }

    // NOTE: initially I planned to scale the bubbles based on the depth of the tree
    // but I think it makes more sense to scale the bubbles based on the number of items.. TBD

    // let maxDepth = useHeatmapStore()?.itemsMaxDepth
    // let scaleFactor =
    //   (1 + (maxDepth - this.row.depth)) * useDimredLayoutStore().bubbleSizeDepthIncrement
    // // console.log(`maxDepth: ${maxDepth}`)

    let itemsTotal = (useHeatmapStore()?.itemTree?.root?.totalChildrenCount ?? 0) + 1
    let itemsAmount = 1 + this.row.totalChildrenCount

    let maxScaleFactor =
      useDimredLayoutStore().bubbleSizeMaximal / useDimredLayoutStore().bubbleSize

    // Use logarithmic scaling for itemsAmount and itemsTotal to spread out values
    let logItemsAmount = Math.log(itemsAmount + 1) // +1 to avoid log(0) if itemsAmount is 1
    let logItemsTotal = Math.log(itemsTotal + 1)

    // Calculate the scale factor with log-transformed values
    let scaleFactor = 1 + (maxScaleFactor - 1) * (logItemsAmount / logItemsTotal)

    // console.log(`updateSize for bubble ${this.row.name} (${this.row.depth}): ${scaleFactor}`)
    this.bubbleGraphic.scale.set(scaleFactor)
  }

  updateVisibility() {
    this.visible = this.row.position !== -1
  }

  updateHighlightedDisplay(highlighted: boolean) {
    // make sure the higlighted bubble is rendered last, otherwise the glow filter is not visible
    if (highlighted && this.parent) {
      this.parent.setChildIndex(this, this.parent.children.length - 1)
    }

    this.filters = highlighted ? [new GlowFilter()] : []
    this.updateOpacity(highlighted ? 1 : 0.5)
  }
}
