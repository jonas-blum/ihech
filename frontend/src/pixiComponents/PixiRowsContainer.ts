import { Container, Texture, Graphics } from 'pixi.js'
import { OutlineFilter, DropShadowFilter, GlowFilter } from 'pixi-filters'
import { Row } from '@/classes/Row'
import { Column } from '@/classes/Column'
import { PixiHeatmapCell } from '@/pixiComponents/PixiHeatmapCell'
import { PixiContainer } from '@/pixiComponents/PixiContainer'
import { PixiRow } from '@/pixiComponents/PixiRow'
import { useMainStore } from '@/stores/mainStore'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'
import { gsap } from 'gsap'

export class PixiRowsContainer extends PixiContainer {
  constructor() {
    super()

  }

  addRow(row: PixiRow) {
    this.addChild(row)
  }

  removeRow(row: PixiRow) {
    this.removeChild(row)
    row.destroy()
  }
}
