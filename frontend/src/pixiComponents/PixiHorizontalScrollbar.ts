import { Container, Text, Graphics, Rectangle } from 'pixi.js'
import { OutlineFilter, DropShadowFilter, GlowFilter } from 'pixi-filters'
import { Row } from '@/classes/Row'
import { PixiHeatmapCell } from '@/pixiComponents/PixiHeatmapCell'
import { PixiRowLabel } from '@/pixiComponents/PixiRowLabel'
import { useMainStore } from '@/stores/mainStore'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'
import { gsap } from 'gsap'

export class PixiHorizontalScrollbar extends Container {
  track: Graphics = new Graphics() // the 'track' is the background of the scrollbar
  thumb: Graphics = new Graphics() // the 'thumb' is the draggable part of the scrollbar
  isDragging: boolean = false // flag to track dragging state
  startDragX: number = 0 // stores the initial X position on drag start
  startDragScrollPosition: number = 0 // stores the initial scroll position on drag start
  narrowHitArea: Rectangle // is active by default
  wideHitArea: Rectangle // is active when dragging

  constructor() {
    super()

    const heatmapLayoutStore = useHeatmapLayoutStore()

    // set the width and height of the container
    const width = heatmapLayoutStore.canvasWidth - heatmapLayoutStore.rowLabelWidth
    const height = heatmapLayoutStore.horizontalScrollbarHeight

    this.track
      .rect(0, 0, width, height)
      .fill({ color: heatmapLayoutStore.scrollbarBackgroundColor, alpha: 0 })
    this.addChild(this.track)

    this.thumb
      .rect(0, 0, width, height)
      .fill({ color: heatmapLayoutStore.scrollbarThumbColor, alpha: 0.5 })
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
    this.narrowHitArea = new Rectangle(-10, -10, width + 20, height + 20)
    this.wideHitArea = new Rectangle(-2000, -1000, width + 4000, height + 2000)
    this.thumb.hitArea = this.narrowHitArea
  }

  // Drag start event
  onDragStart(event: any): void {
    this.isDragging = true
    this.startDragX = event.data.global.x
    this.startDragScrollPosition = useHeatmapLayoutStore().horizontalScrollPosition
    this.thumb.hitArea = this.wideHitArea
  }

  // Drag end event
  onDragEnd() {
    this.isDragging = false
    this.thumb.hitArea = this.narrowHitArea
  }

  // Drag move event
  onDragMove(event: any) {
    if (this.isDragging) {
      const heatmapLayoutStore = useHeatmapLayoutStore()

      // the amount of pixels the thumb was dragged
      const dragDelta = event.data.global.x - this.startDragX

      // set vertical scroll position based on the drag distance (based on ratio)
      const scrollDelta = (dragDelta / heatmapLayoutStore.availableWidthForColumns) * heatmapLayoutStore.requiredWidthOfColumns

      heatmapLayoutStore.setHorizontalScrollPosition(this.startDragScrollPosition + scrollDelta)
    }
  }

  update() {
    const heatmapLayoutStore = useHeatmapLayoutStore()

    this.visible = heatmapLayoutStore.horizontalScrollbarVisible

    this.position.y = heatmapLayoutStore.matrixTileFrame.y - heatmapLayoutStore.tileMargin / 2 - heatmapLayoutStore.horizontalScrollbarHeight / 2
    this.position.x = heatmapLayoutStore.matrixTileFrame.x

    // adjust the width of the scrollbar track to go until the right end of the canvas
    this.track.width = heatmapLayoutStore.matrixTileFrame.width

    // set the width of the thumb
    this.thumb.width = heatmapLayoutStore.horizontalScrollbarThumbWidth

    // Position the thumb based on the current scroll position (ratio of scroll position to required width)
    this.thumb.x = (heatmapLayoutStore.horizontalScrollPosition / heatmapLayoutStore.requiredWidthOfColumns) * this.track.width
  }
}