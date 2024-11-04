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
    
    this.addChild(this.bubbleGraphic)
    this.drawBubbleGraphic()
    this.updateTint()
    // this.position.x = this.originalColumnIndex * useHeatmapLayoutStore().columnWidth

    this.eventMode = 'static'
    this.cursor = 'pointer'

    // this.hitArea = new Rectangle(0, 0, useHeatmapLayoutStore().columnWidth, useHeatmapLayoutStore().rowHeight)

    // event listeners
    // @ts-ignore: Property 'on' does not exist
    // this.on('click', () => {
    //   useHeatmapStore()?.cellClickEvent(this)
    // })
    // @ts-ignore: Property 'on' does not exist
    // this.on('mouseover', () => {
    //   useHeatmapStore()?.setHoveredPixiHeatmapCell(this)
    // })
    // @ts-ignore: Property 'on' does not exist
    // this.on('mouseout', () => {
    //   useHeatmapStore()?.setHoveredPixiHeatmapCell(null)
    // })
  }

  drawBubbleGraphic() {
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

    this.bubbleGraphic.circle(xNormalized * dimredLayoutStore.dimredSize, yNormalized * dimredLayoutStore.dimredSize, dimredLayoutStore.bubbleSize).fill(0xffffff)//.stroke({width: 1, color: 0x000000})
  }

  updateTint(color?: number) {
    if (color === undefined) {
      color = useDimredLayoutStore().basicBubbleColor
    }
    this.bubbleGraphic.tint = color
  }
}