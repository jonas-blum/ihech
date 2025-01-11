import { Container, Texture, Graphics, Sprite, Point, Text } from 'pixi.js'
import { OutlineFilter, DropShadowFilter, GlowFilter } from 'pixi-filters'
import { Row, AggregateRow, ItemRow } from '@/classes/Row'
import { PixiHeatmapCell } from '@/pixiComponents/PixiHeatmapCell'
import { PixiRowLabel } from '@/pixiComponents/PixiRowLabel'
import { PixiContainer } from '@/pixiComponents/PixiContainer'
import { useMainStore } from '@/stores/mainStore'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'
import { useDimredLayoutStore } from '@/stores/dimredLayoutStore'
import { gsap } from 'gsap'
import { useTextureStore } from '@/stores/textureStore'

export class PixiBubble extends PixiContainer {
  public row: Row // reference to data structure Row
  public bubbleGraphic: Sprite = new Sprite()

  constructor(row: Row) {
    super()
    this.row = row

    const mainStore = useMainStore()

    this.addChild(this.bubbleGraphic)

    this.updateTint(this.row.getColor())
    this.updateOpacity(0.5)
    this.updatePositionAndVisibility(false)
    this.updateSize()

    this.eventMode = 'static'
    this.cursor = 'pointer'

    // this.hitArea = new Rectangle(0, 0, useHeatmapLayoutStore().columnWidth, useHeatmapLayoutStore().rowHeight)

    // event listeners
    // @ts-ignore: Property 'on' does not exist
    this.on('click', () => {
      mainStore?.bubbleClickEvent(this)
    })
    // @ts-ignore: Property 'on' does not exist
    this.on('mouseover', () => {
      mainStore?.setHoveredPixiBubble(this)
    })
    // @ts-ignore: Property 'on' does not exist
    this.on('mouseout', () => {
      mainStore?.setHoveredPixiBubble(null)
    })
    // @ts-ignore: Property 'on' does not exist
    this.on('rightclick', () => {
      mainStore?.bubbleRightClickEvent(this)
    })
  }

  changeTexture(texture: Texture) {
    // NOTE: this is a quick fix to avoid errors when the data is updated
    if (!this.bubbleGraphic.pivot) {
      return
    }
    this.bubbleGraphic.texture = texture
    this.bubbleGraphic.pivot = new Point(texture.width / 2, texture.height / 2)
  }

  updatePositionAndVisibility(animate: boolean = true) {
    const dimredLayoutStore = useDimredLayoutStore()

    const isRowSticky = useMainStore().itemTree?.isRowSticky(this.row)

    // dimredPosition is between 0 and 1, so we need to multiply it by the size of dimred
    const parentContainerSize = dimredLayoutStore.dimredSize

    // if the position is -1, we hide the bubble
    if (this.row.position === -1 && !isRowSticky) {
      const startX = this.row.dimredPosition.x * parentContainerSize
      const startY = this.row.dimredPosition.y * parentContainerSize
      const endX = (this.row.parent?.dimredPosition.x ?? 0) * parentContainerSize
      const endY = (this.row.parent?.dimredPosition.y ?? 0) * parentContainerSize
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
          this.updateVisibility()
        },
        animate ? dimredLayoutStore.animationDuration * 1000 : 0,
      )

      return
    }

    // if the oldPosition is -1, we want to animate from the parent row position (if available)
    if (this.row.oldPosition === -1 && !isRowSticky) {
      const startX = (this.row.parent?.dimredPosition.x ?? 0) * parentContainerSize
      const startY = (this.row.parent?.dimredPosition.y ?? 0) * parentContainerSize
      const endX = this.row.dimredPosition.x * parentContainerSize
      const endY = this.row.dimredPosition.y * parentContainerSize
      // const endX = 0 * parentContainerSize
      // const endY = 0 * parentContainerSize

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

    // if neiter the position nor the oldPosition is -1, we do not need to change the position

    this.updateVisibility()
  }

  updateVisibility(delay: number = 0) {
    // always show if it is sticky
    if (useMainStore().itemTree?.isRowSticky(this.row)) {
      this.visible = true
      return
    }

    if (this.row.position === -1) {
      this.visible = false
      return
    }

    if (!useDimredLayoutStore().showParentBubbles && this.row.hasChildren() && 'isOpen' in this.row && this.row.isOpen) {
      this.visible = false
      return
    }

    this.visible = true
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
    if (this.row.position === -1 && !useMainStore().itemTree?.isRowSticky(this.row)) {
      return
    }

    // NOTE: initially I planned to scale the bubbles based on the depth of the tree
    // but I think it makes more sense to scale the bubbles based on the number of items.. TBD

    // let maxDepth = useMainStore()?.itemsMaxDepth
    // let scaleFactor =
    //   (1 + (maxDepth - this.row.depth)) * useDimredLayoutStore().bubbleSizeDepthIncrement
    // // console.log(`maxDepth: ${maxDepth}`)

    const itemsTotal = (useMainStore()?.itemTree?.root?.totalChildrenCount ?? 0) + 1
    const itemsAmount = 1 + this.row.totalChildrenCount

    const maxScaleFactor =
      useDimredLayoutStore().bubbleSizeMaximal / useDimredLayoutStore().bubbleSize

    // Use logarithmic scaling for itemsAmount and itemsTotal to spread out values
    const logItemsAmount = Math.log(itemsAmount + 1) // +1 to avoid log(0) if itemsAmount is 1
    const logItemsTotal = Math.log(itemsTotal + 1)

    // Calculate the scale factor with log-transformed values
    const scaleFactor = 1 + (maxScaleFactor - 1) * (logItemsAmount / logItemsTotal)

    // this.bubbleGraphic.pivot.set(this.bubbleGraphic.width / 2, this.bubbleGraphic.height / 2)
    this.bubbleGraphic.scale = scaleFactor
  }

  updateHighlightedDisplay(highlighted: boolean) {
    // make sure the higlighted bubble is rendered last, otherwise the glow filter is not visible
    if (highlighted && this.parent) {
      this.parent.setChildIndex(this, this.parent.children.length - 1)
    }

    this.bubbleGraphic.filters = highlighted ? [new OutlineFilter()] : []
    
    this.updateOpacity(highlighted ? 1 : 0.5)
  }
}

export class PixiAggregateBubble extends PixiBubble {
  public text: Text

  constructor(row: AggregateRow) {
    super(row)
    this.text = new Text({
      text: this.row.totalChildrenCount.toString(),
      style: {
        fill: this.row.getColor(),
        fontSize: 10,
        fontFamily: 'Arial',
      }
    })
    this.text.x = -this.text.width / 2
    this.text.y = -this.text.height / 2

    this.addChild(this.text)

    this.changeTexture(useTextureStore().ringTexture as Texture)
  }
}

export class PixiItemBubble extends PixiBubble {
  constructor(row: ItemRow) {
    super(row)

    this.changeTexture(useTextureStore().bubbleTexture as Texture)
  }

  updatePositionAndVisibility(animate: boolean = true) {
    const dimredLayoutStore = useDimredLayoutStore()

    const isRowSticky = useMainStore().itemTree?.isRowSticky(this.row)

    const parentContainerSize = dimredLayoutStore.dimredSize

    // if the position is -1, we hide the bubble
    if (this.row.position === -1 && !isRowSticky) {
      const startX = this.row.dimredPosition.x * parentContainerSize
      const startY = this.row.dimredPosition.y * parentContainerSize
      const endX = (this.row.parent?.dimredPosition.x ?? 0) * parentContainerSize
      const endY = (this.row.parent?.dimredPosition.y ?? 0) * parentContainerSize
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
          this.updateVisibility()
        },
        animate ? dimredLayoutStore.animationDuration * 1000 : 0,
      )

      return
    }

    // if the oldPosition is -1, we want to animate from the parent row position (if available)
    if (this.row.oldPosition === -1 && !isRowSticky) {
      const startX = (this.row.parent?.dimredPosition.x ?? 0) * parentContainerSize
      const startY = (this.row.parent?.dimredPosition.y ?? 0) * parentContainerSize
      const endX = this.row.dimredPosition.x * parentContainerSize
      const endY = this.row.dimredPosition.y * parentContainerSize

      // NOTE: I have no idea why, but for some reason it crashed when updating and an item was sticky.
      // this catch block is a dirty fix to avoid the crash
      try {
        let wtf = this.x
      } catch (error) {
        return
      }

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

    // if neiter the position nor the oldPosition is -1, we do not need to change the position

    this.updateVisibility()
  }
}
