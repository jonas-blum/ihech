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

// TODO: sams same but different for the sticky row labels container ??

export class PixiRowLabelsContainer extends PixiContainer {
  constructor() {
    super()

    this.addMask()

    this.updatePosition()
    this.updateMask()
  }

  updatePosition() {
    // TODO: implement (for scrolling effect)
    this.position.y = 0
  }

  updateMask() {
    const heatmapLayoutStore = useHeatmapLayoutStore()
    // the height of the mask needs to adapt based on the amount of sticky rows
    super.updateMask(
      0,
      0,
      heatmapLayoutStore.rowLabelWidth,
      heatmapLayoutStore.availableHeightForRows,
    )
  }
}
