import { Container, Texture, Graphics, Sprite } from 'pixi.js'
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
  public bubbleGraphic: Sprite

  constructor(row: Row, texture: Texture) {
    super()
    this.row = row

    const heatmapStore = useHeatmapStore()

    this.bubbleGraphic = new Sprite(texture)
    this.bubbleGraphic.pivot.set(this.bubbleGraphic.width / 2, this.bubbleGraphic.height / 2)
    this.updateTint()
    this.updateOpacity(0.5)
    this.addChild(this.bubbleGraphic)

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

    this.updatePositionAndVisibility(false)
    this.updateSize()
  }

  updatePositionAndVisibility(animate: boolean = true) {
    const dimredLayoutStore = useDimredLayoutStore()

    // if the position is -1, we hide the bubble
    if (this.row.position === -1) {
      const startX = this.row.dimredPosition.x * dimredLayoutStore.dimredSize
      const startY = this.row.dimredPosition.y * dimredLayoutStore.dimredSize
      const endX = (this.row.parent?.dimredPosition.x ?? 0) * dimredLayoutStore.dimredSize
      const endY = (this.row.parent?.dimredPosition.y ?? 0) * dimredLayoutStore.dimredSize
      gsap.fromTo(
        this,
        {
          x: startX,
          y: startY,
        },
        {
          x: endX,
          y: endY,
          duration: animate ? dimredLayoutStore.animationDuration : 0,
        },
      )

      // set visibility to false after the animation
      setTimeout(
        () => {
          this.visible = false
        },
        animate ? dimredLayoutStore.animationDuration * 1000 : 0,
      )

      return
    }

    // if the oldPosition is -1, we want to animate from the parent row position (if available)
    if (this.row.oldPosition === -1) {
      const startX = (this.row.parent?.dimredPosition.x ?? 0) * dimredLayoutStore.dimredSize
      const startY = (this.row.parent?.dimredPosition.y ?? 0) * dimredLayoutStore.dimredSize
      const endX = this.row.dimredPosition.x * dimredLayoutStore.dimredSize
      const endY = this.row.dimredPosition.y * dimredLayoutStore.dimredSize

      this.visible = true
      gsap.fromTo(
        this,
        {
          x: startX,
          y: startY,
        },
        {
          x: endX,
          y: endY,
          duration: animate ? dimredLayoutStore.animationDuration : 0,
        },
      )
    }

    // if neiter the position nor the oldPosition is -1, we do not need to change anything
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

    const itemsTotal = (useHeatmapStore()?.itemTree?.root?.totalChildrenCount ?? 0) + 1
    const itemsAmount = 1 + this.row.totalChildrenCount

    const maxScaleFactor =
      useDimredLayoutStore().bubbleSizeMaximal / useDimredLayoutStore().bubbleSize

    // Use logarithmic scaling for itemsAmount and itemsTotal to spread out values
    const logItemsAmount = Math.log(itemsAmount + 1) // +1 to avoid log(0) if itemsAmount is 1
    const logItemsTotal = Math.log(itemsTotal + 1)

    // Calculate the scale factor with log-transformed values
    const scaleFactor = 1 + (maxScaleFactor - 1) * (logItemsAmount / logItemsTotal)

    // console.log(`updateSize for bubble ${this.row.name} (${this.row.depth}): ${scaleFactor}`)
    this.bubbleGraphic.scale.set(scaleFactor)
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
