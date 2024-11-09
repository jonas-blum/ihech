import { Container, Text, Graphics, Rectangle } from 'pixi.js'
import { OutlineFilter, DropShadowFilter, GlowFilter } from 'pixi-filters'
import { Row } from '@/classes/Row'
import { PixiHeatmapCell } from '@/pixiComponents/PixiHeatmapCell'
import { PixiRowLabel } from '@/pixiComponents/PixiRowLabel'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'
import { gsap } from 'gsap'

export class PixiVerticalScrollbar extends Container {
  track: Graphics = new Graphics() // the 'track' is the background of the scrollbar
  thumb: Graphics = new Graphics() // the 'thumb' is the draggable part of the scrollbar
  isDragging: boolean = false // flag to track dragging state
  startDragY: number = 0 // stores the initial Y position on drag start

  constructor() {
    super()

    const heatmapLayoutStore = useHeatmapLayoutStore()

    // set the width and height of the container
    const width = heatmapLayoutStore.verticalScrollbarWidth
    const height = heatmapLayoutStore.canvasHeight - heatmapLayoutStore.columnLabelHeight

    this.track
      .rect(0, 0, width, height)
      .fill({ color: heatmapLayoutStore.scrollbarBackgroundColor, alpha: 0.2 })
    this.addChild(this.track)

    this.thumb
      .rect(0, 0, width, 10)
      .fill({ color: heatmapLayoutStore.scrollbarThumbColor, alpha: 1 })
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

    // quick fix to increase the hit area of the thumb
    this.thumb.hitArea = new Rectangle(-20, -20, width + 40, height + 40)
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
      const heatmapLayoutStore = useHeatmapLayoutStore()

      // Calculate new thumb position within the track bounds
      let newY = event.data.global.y - this.startDragY
      newY = Math.max(
        0,
        Math.min(newY, heatmapLayoutStore.verticalScrollbarTrackHeight - this.thumb.height),
      )

      // Set thumb position
      this.thumb.y = newY

      // Update scroll position in the layout store based on thumb position
      const scrollRatio =
        newY / (heatmapLayoutStore.verticalScrollbarTrackHeight - this.thumb.height)
      heatmapLayoutStore.verticalScrollPosition =
        scrollRatio * (heatmapLayoutStore.requiredHeight - heatmapLayoutStore.canvasHeight)
    }
  }

  update() {
    const heatmapLayoutStore = useHeatmapLayoutStore()

    // if the required height of the heatmap is smaller than the canvas height, we don't need a scrollbar
    this.visible = heatmapLayoutStore.verticalScrollbarVisible

    // position the scrollbar at the right edge of the canvas
    this.position.x = heatmapLayoutStore.canvasWidth - heatmapLayoutStore.verticalScrollbarWidth

    // align the scrollbar with the rows (excluding the sticky rows)
    this.position.y = heatmapLayoutStore.rowsVerticalStartPosition

    // adjust the height of the scrollbar track to go until the bottom of the canvas
    this.track.height = heatmapLayoutStore.verticalScrollbarTrackHeight

    // set the height of the thumb
    this.thumb.height = heatmapLayoutStore.verticalScrollbarThumbHeight

    // TODO:
    // Position the thumb based on the current scroll position
    const maxThumbY = heatmapLayoutStore.verticalScrollbarTrackHeight - this.thumb.height
    const scrollRatio =
      heatmapLayoutStore.verticalScrollPosition /
      (heatmapLayoutStore.requiredHeight - heatmapLayoutStore.canvasHeight)
    this.thumb.y = scrollRatio * maxThumbY
  }
}
