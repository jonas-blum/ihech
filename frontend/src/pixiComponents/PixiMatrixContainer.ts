import { Container, Texture, Graphics } from 'pixi.js'
import { OutlineFilter, DropShadowFilter, GlowFilter } from 'pixi-filters'
import { Row } from '@/classes/Row'
import { Column } from '@/classes/Column'
import { PixiHeatmapCell } from '@/pixiComponents/PixiHeatmapCell'
import { PixiRow } from '@/pixiComponents/PixiRow'
import { PixiRowsContainer } from '@/pixiComponents/PixiRowsContainer'
import { PixiContainer } from '@/pixiComponents/PixiContainer'
import { useHeatmapStore } from '@/stores/heatmapStore'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'
import { gsap } from 'gsap'

export class PixiMatrixContainer extends PixiContainer {
  public rowsContainer: PixiRowsContainer = new PixiRowsContainer()
  public stickyRowsContainer: PixiRowsContainer = new PixiRowsContainer()
  // TODO: mask

  constructor() {
    super()

    this.addChild(this.rowsContainer)
    this.addChild(this.stickyRowsContainer)
    
    this.addMask()
    
    this.updatePosition()
    this.updateMask()
  }
  
  updatePosition() {    
    // TODO: implement (for scrolling effect)
    this.position.y = 0
  }
  
  updateMask(){
    const heatmapLayoutStore = useHeatmapLayoutStore()
    // the height of the mask needs to adapt based on the amount of sticky rows
    super.updateMask(0, 0, heatmapLayoutStore.availableWidthForColumns, heatmapLayoutStore.availableHeightForRows)
  }
}
