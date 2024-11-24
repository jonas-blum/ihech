import { Container, Texture, Graphics } from 'pixi.js'
import { OutlineFilter, DropShadowFilter, GlowFilter } from 'pixi-filters'
import { Row } from '@/classes/Row'
import { Column } from '@/classes/Column'
import { PixiHeatmapCell } from '@/pixiComponents/PixiHeatmapCell'
import { PixiContainer } from '@/pixiComponents/PixiContainer'
import { PixiRow } from '@/pixiComponents/PixiRow'
import { PixiColumnLabel } from '@/pixiComponents/PixiColumnLabel'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'
import { gsap } from 'gsap'

export class PixiColumnLabelsContainer extends PixiContainer {
  constructor() {
    super()
  }

  addColumnLabel(columnLabel: PixiColumnLabel) {
    this.addChild(columnLabel)
  }
}
