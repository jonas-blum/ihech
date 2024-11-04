import { Container, Text, Graphics } from 'pixi.js'
import { OutlineFilter, DropShadowFilter, GlowFilter } from 'pixi-filters'
import { Row } from '@/classes/Row'
import { PixiHeatmapCell } from '@/pixiComponents/PixiHeatmapCell'
import { PixiRowLabel } from '@/pixiComponents/PixiRowLabel'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'
import { gsap } from 'gsap'

export class PixiBubble extends Container {
  public row: Row // reference to data structure Row
  public bubbleGraphic: Graphics = new Graphics()

  constructor(row: Row) {
    super()
    this.row = row
    
    this.addChild(this.bubbleGraphic)
    this.drawBubbleGraphic()
    this.updateTint(0x123456)
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
    this.bubbleGraphic.circle(Math.random()*300, Math.random()*300, 2).fill(0xffffff)//.stroke({width: 1, color: 0x000000})
  }

  updateTint(color: number) {
    this.bubbleGraphic.tint = color
  }
}