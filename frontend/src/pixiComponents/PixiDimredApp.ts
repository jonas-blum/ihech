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

  addBubble(bubble: PixiBubble) {
    this.bubbleContainer.addChild(bubble)
  }

  generateTextures() {
    const dimredLayoutStore = useDimredLayoutStore()
    const textureStore = useTextureStore()
    const bubbleSize = dimredLayoutStore.bubbleSize

    const bubbleGraphic = new Graphics()
    bubbleGraphic.circle(0, 0, bubbleSize).fill(0xffffff) //.stroke({width: 1, color: 0x000000})
    textureStore.bubbleTexture = this.renderer.generateTexture({
      target: bubbleGraphic,
      resolution: 8,
    })

    // sticky bubble texture
    const starScaleFactor = 2
    const starSize = dimredLayoutStore.bubbleSize * starScaleFactor

    const graphic = new Graphics().star(0, 0, 5, starSize).fill(0xffffff)

    textureStore.stickyBubbleTexture = this.renderer.generateTexture({
      target: graphic,
      resolution: 8, // Optional: Keep this if you want higher resolution
    })
  }
}
