import { Application, Container, Texture, Graphics, Rectangle } from 'pixi.js'
import { OutlineFilter, DropShadowFilter, GlowFilter } from 'pixi-filters'
import { useDimredLayoutStore } from '@/stores/dimredLayoutStore'
import { useMainStore } from '@/stores/mainStore'
import { PixiBubble } from '@/pixiComponents/PixiBubble'
import { DimredTile } from '@/pixiComponents/PixiTile'
import { PixiContainer } from '@/pixiComponents/PixiContainer'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'
import { useTextureStore } from '@/stores/textureStore'

export class PixiDimredApp extends Application {
  public bubbleContainer: PixiContainer = new PixiContainer() // PixiBubble[] as children
  public dimredTile: DimredTile = new DimredTile() 

  constructor(canvasElement: HTMLCanvasElement) {
    super()

    const dimredLayoutStore = useDimredLayoutStore()

    // init app
    this.init({
      canvas: canvasElement,
      width: dimredLayoutStore.canvasWidth,
      height: dimredLayoutStore.canvasHeight,
      backgroundColor: dimredLayoutStore.dimredCanvasBackgroundColor,
      antialias: true,
      resolution: 2,
      // autoDensity: true, // not sure what this does
    })

    this.stage.addChild(this.dimredTile)

    this.dimredTile.content.addChild(this.bubbleContainer)
    // center the dimred, ensure it is quadratic
    this.bubbleContainer.width = dimredLayoutStore.dimredSize
    this.bubbleContainer.height = dimredLayoutStore.dimredSize
    this.bubbleContainer.position.set(
      dimredLayoutStore.dimredXPadding,
      dimredLayoutStore.dimredYPadding,
    )
    // for debugging the bubbleContainer position
    // this.bubbleContainer.addBackground(0x00ffff)
    // this.bubbleContainer.setBackgroundDimensions(
    //   dimredLayoutStore.dimredSize,
    //   dimredLayoutStore.dimredSize,
    // )
  }

  clear() {
    this.dimredTile.clear()
  }

  activateLoadingState() {
    this.dimredTile.activateLoadingState()
  }

  deactivateLoadingState() {
    this.dimredTile.deactivateLoadingState()
  }

  addBubble(bubble: PixiBubble) {
    this.bubbleContainer.addChild(bubble)
  }

  generateTextures() {
    const dimredLayoutStore = useDimredLayoutStore()
    const textureStore = useTextureStore()
    const bubbleSize = dimredLayoutStore.bubbleSize

    // bubble texture no border
    const bubbleGraphic = new Graphics()
    bubbleGraphic.circle(0, 0, bubbleSize).fill(0xffffff)
    textureStore.bubbleTexture = this.renderer.generateTexture({
      target: bubbleGraphic,
      resolution: 8,
      frame: new Rectangle(-bubbleSize, -bubbleSize, bubbleSize * 2, bubbleSize * 2),
    })

    // bubble texture with border
    const bubbleGraphicBordered = new Graphics()
    const strokeWidth = 0.1
    bubbleGraphicBordered.circle(0, 0, bubbleSize).fill(0xffffff).stroke({width: strokeWidth, color: 0x000000})
    textureStore.bubbleTextureBordered = this.renderer.generateTexture({
      target: bubbleGraphicBordered,
      resolution: 8,
      frame: new Rectangle(-bubbleSize-strokeWidth, -bubbleSize-strokeWidth, bubbleSize * 2 + 1, bubbleSize * 2 + 1),
    })

    // ring texture
    const ringGraphic = new Graphics()
    const ringSize = bubbleSize
    const ringThickness = 0.5
    ringGraphic.circle(0, 0, ringSize).stroke({width: ringThickness, color: 0xffffff})
    textureStore.ringTexture = this.renderer.generateTexture({
      target: ringGraphic,
      resolution: 8,
      frame: new Rectangle(-ringSize-ringThickness, -ringSize-ringThickness, ringSize * 2 + 2*ringThickness, ringSize * 2 + 2*ringThickness),
    })


    // sticky bubble texture
    const starScaleFactor = 2
    const starSize = dimredLayoutStore.bubbleSize * starScaleFactor

    const graphic = new Graphics().star(0, 0, 5, starSize).fill(0xffffff)

    textureStore.stickyBubbleTexture = this.renderer.generateTexture({
      target: graphic,
      resolution: 16, // Optional: Keep this if you want higher resolution
    })
  }
}
