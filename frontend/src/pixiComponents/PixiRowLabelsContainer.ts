import { Container, Texture, Graphics } from 'pixi.js'
import { OutlineFilter, DropShadowFilter, GlowFilter } from 'pixi-filters'
import { Row } from '@/classes/Row'
import { Column } from '@/classes/Column'
import { PixiHeatmapCell } from '@/pixiComponents/PixiHeatmapCell'
import { PixiContainer } from '@/pixiComponents/PixiContainer'
import { PixiRowLabel } from '@/pixiComponents/PixiRowLabel'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'
import { gsap } from 'gsap'

// TODO: sams same but different for the sticky row labels container ??

export class PixiRowLabelsContainer extends PixiContainer {
  constructor() {
    super()
  }

  addRowLabel(rowlabel: PixiRowLabel) {
    this.addChild(rowlabel)
  }

  removeRowLabel(rowlabel: PixiRowLabel) {
    this.removeChild(rowlabel)
    rowlabel.destroy()
  }
}
