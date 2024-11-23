import { Container, Texture, Graphics } from 'pixi.js'
import { OutlineFilter, DropShadowFilter, GlowFilter } from 'pixi-filters'
import { Row } from '@/classes/Row'
import { Column } from '@/classes/Column'
import { PixiHeatmapCell } from '@/pixiComponents/PixiHeatmapCell'
import { PixiContainer } from '@/pixiComponents/PixiContainer'
import { PixiRow } from '@/pixiComponents/PixiRow'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'
import { gsap } from 'gsap'

export class PixiColumnLabelsContainer extends PixiContainer {
  constructor() {
    super()

    this.addMask()
    
    this.updatePosition()
    this.updateMask()
  }

  updatePosition() {    
    // TODO: implement (for scrolling effect)
    this.position.x = 0
  }

  updateMask() {
    const heatmapLayoutStore = useHeatmapLayoutStore()
    // the width of the mask needs to adapt based on the amount of sticky columns
    super.updateMask(0, 0, heatmapLayoutStore.availableWidthForColumns, heatmapLayoutStore.columnLabelHeight)
  }
}
