import { Container, Text, Graphics } from 'pixi.js'
import { OutlineFilter, DropShadowFilter, GlowFilter } from 'pixi-filters'
import { Row } from '@/classes/Row'
import { PixiHeatmapCell } from '@/pixiComponents/PixiHeatmapCell'
import { PixiRowLabel } from '@/pixiComponents/PixiRowLabel'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { useLayoutStore } from '@/stores/layoutStore'
import { gsap } from 'gsap'

export class PixiVerticalScrollbar extends Container {
  track: Graphics = new Graphics() // the 'track' is the background of the scrollbar
  thumb: Graphics = new Graphics() // the 'thumb' is the draggable part of the scrollbar
  isDragging: boolean = false // flag to track dragging state
  startDragY: number = 0 // stores the initial Y position on drag start

  constructor() {
    super()

    const layoutStore = useLayoutStore()

    // set the width and height of the container
    let width = layoutStore.verticalScrollbarWidth
    let height = layoutStore.canvasHeight - layoutStore.columnLabelHeight

    this.track.rect(0, 0, width, height).fill({ color: layoutStore.scrollbarBackgroundColor, alpha: 0.2 })
    this.addChild(this.track)

    this.thumb.rect(0, 0, width, 10).fill({ color: layoutStore.scrollbarThumbColor, alpha: 1 })
    this.addChild(this.thumb)

    // TODO: the scrolling is a bit finicky atm because the thumb needs to stay within the track bounds
    // this could be improved by either global mouse events or an increased hit area
    // Position scrollbar and make thumb draggable
    this.thumb.eventMode = 'static'
    this.thumb.cursor = 'pointer'
    this.thumb
      .on('pointerdown', this.onDragStart.bind(this))
      .on('pointerup', this.onDragEnd.bind(this))
      .on('pointerupoutside', this.onDragEnd.bind(this))
      .on('pointermove', this.onDragMove.bind(this))
  }

  // Drag start event
  onDragStart(event: any): void {
    this.isDragging = true
    this.startDragY = event.data.global.y - this.thumb.y
  }

  // Drag end event
  onDragEnd() {
    this.isDragging = false
  }

  // Drag move event
  onDragMove(event: any) {
    if (this.isDragging) {
      const layoutStore = useLayoutStore()

      // Calculate new thumb position within the track bounds
      let newY = event.data.global.y - this.startDragY
      newY = Math.max(
        0,
        Math.min(newY, layoutStore.verticalScrollbarTrackHeight - this.thumb.height),
      )

      // Set thumb position
      this.thumb.y = newY

      // Update scroll position in the layout store based on thumb position
      const scrollRatio = newY / (layoutStore.verticalScrollbarTrackHeight - this.thumb.height)
      layoutStore.verticalScrollPosition =
        scrollRatio * (layoutStore.requiredHeight - layoutStore.canvasHeight)
    }
  }

  update() {
    const layoutStore = useLayoutStore()

    // if the required height of the heatmap is smaller than the canvas height, we don't need a scrollbar
    this.visible = layoutStore.verticalScrollbarVisible

    // position the scrollbar at the right edge of the canvas
    this.position.x = layoutStore.canvasWidth - layoutStore.verticalScrollbarWidth

    // align the scrollbar with the rows (excluding the sticky rows)
    this.position.y = layoutStore.rowsVerticalStartPosition

    // adjust the height of the scrollbar track to go until the bottom of the canvas
    this.track.height = layoutStore.verticalScrollbarTrackHeight

    // set the height of the thumb
    this.thumb.height = layoutStore.verticalScrollbarThumbHeight

    // TODO:
    // Position the thumb based on the current scroll position
    const maxThumbY = layoutStore.verticalScrollbarTrackHeight - this.thumb.height
    const scrollRatio =
      layoutStore.verticalScrollPosition / (layoutStore.requiredHeight - layoutStore.canvasHeight)
    this.thumb.y = scrollRatio * maxThumbY
  }
}
