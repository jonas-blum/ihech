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
    this.bubbleContainer.x = dimredLayoutStore.dimredXPadding
    this.bubbleContainer.y = dimredLayoutStore.dimredYPadding
    this.bubbleContainer.width = dimredLayoutStore.dimredSize
    this.bubbleContainer.height = dimredLayoutStore.dimredSize

    // AHAH! dimredTile has by default a padding! this is why the bubbleContainer is actually overflowing to the right
    // its size can not be dimredSize... ?!

    // One problem is that the bubbles are positioned by their top left corner, not their center
    // this is tricky to correct, because we dont know the size of the bubble container, they are scaled dynamically

    // rectangle with same dimension and position as bubble for debugging
    // let rectangle = new Graphics()
    // this.bubbleContainer.addChild(rectangle)
    // rectangle.rect(
    //   0, 0,
    //   dimredLayoutStore.dimredTileFrame.width - 2 * useHeatmapLayoutStore().tilePadding,
    //   dimredLayoutStore.dimredTileFrame.height - 2 * useHeatmapLayoutStore().tilePadding,
    // ).stroke({ width: 1, color: 0x000000 })
    // rectangle.filters = [new OutlineFilter()]

    // custom circle because I cannot control the bubble position, size, scaling and all that shizzle
    // let circle = new Graphics()
    // this.bubbleContainer.addChild(circle)
    // circle.circle(0, 0, 10).stroke({ width: 1, color: 0x000000 })
    // circle.position.set(0, 0)

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
    bubbleGraphicBordered.circle(0, 0, bubbleSize).fill(0xffffff).stroke({ width: strokeWidth, color: 0x000000 })
    textureStore.bubbleTextureBordered = this.renderer.generateTexture({
      target: bubbleGraphicBordered,
      resolution: 8,
      frame: new Rectangle(-bubbleSize - strokeWidth, -bubbleSize - strokeWidth, bubbleSize * 2 + 1, bubbleSize * 2 + 1),
    })

    // ring texture
    const ringGraphic = new Graphics()
    const ringSize = bubbleSize
    const ringThickness = 0.5
    ringGraphic.circle(0, 0, ringSize).stroke({ width: ringThickness, color: 0xffffff })
    textureStore.ringTexture = this.renderer.generateTexture({
      target: ringGraphic,
      resolution: 8,
      frame: new Rectangle(-ringSize - ringThickness, -ringSize - ringThickness, ringSize * 2 + 2 * ringThickness, ringSize * 2 + 2 * ringThickness),
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

  testScaling() {
    // setting the pivot to be the center of the bubble container
    // this.bubbleContainer.pivot.set(this.bubbleContainer.width / 2, this.bubbleContainer.height / 2)
    // console.log(`setting the pivot to ${this.bubbleContainer.pivot.x}, ${this.bubbleContainer.pivot.y}`)

    // const currentScale = this.bubbleContainer.scale.x
    // this.bubbleContainer.scale.set(currentScale + 0.1)
    // console.log(`setting the scale from ${currentScale} to ${this.bubbleContainer.scale.x}`)
  }

  // NOTE: here I tried to dynamically scale to reduce white space in the dimred. I gave up.
  // scaleToBubbleBoundingBox() {
  //   const { minX, minY, maxX, maxY } = this.bubbleContainer.getBounds()
  //   const spanX = maxX - minX // how much space the bubbles take up in x direction
  //   const spanY = maxY - minY // how much space the bubbles take up in y direction
  //   console.log({ minX, minY, maxX, maxY, spanX, spanY })

  //   const dimredLayoutStore = useDimredLayoutStore()

  //   // "zoom-in" by scaling the bubble container
  //   const scaleFactor = dimredLayoutStore.dimredSize / Math.max(spanX, spanY)
  //   console.log({ scaleFactor })
  //   this.bubbleContainer.scale.set(scaleFactor)

  //   // translate the bubble container to the center
  //   this.bubbleContainer.x = dimredLayoutStore.dimredXPadding - minX * scaleFactor
  //   this.bubbleContainer.y = dimredLayoutStore.dimredYPadding - minY * scaleFactor
  // }
}
