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
    // console.log('🎾 SCALING')
    const dimredLayoutStore = useDimredLayoutStore()

    // reset postion and scale to prevent weird iteration effects
    this.bubbleContainer.position.set(0, 0)
    this.bubbleContainer.scale.set(1, 1)
    // also reset the scale of the individual bubbles
    this.bubbleContainer.children.forEach((bubble) => {
      bubble.scale.set(1, 1);
    });

    // Bounding box of the bubbles
    const { minX, minY, maxX, maxY } = this.bubbleContainer.getBounds();
    // console.log({ minX, minY, maxX, maxY });
    // console.log(`bubbleContainer: ${this.bubbleContainer.x}, ${this.bubbleContainer.y}, ${this.bubbleContainer.width}, ${this.bubbleContainer.height}`);

    // offsets
    const offsetX = dimredLayoutStore.bubbleSizeMaximal * 1.5
    const offsetY = dimredLayoutStore.bubbleSizeMaximal * 1.5

    // scale the bubbles to fit the available space
    const scaleFactor = Math.min(dimredLayoutStore.dimredSize / (maxX - minX), dimredLayoutStore.dimredSize / (maxY - minY));
    // console.log({scaleFactor});
    this.bubbleContainer.scale.set(this.bubbleContainer.scale.x * scaleFactor, this.bubbleContainer.scale.y * scaleFactor);
    // console.log(`bubbleContainer: ${this.bubbleContainer.x}, ${this.bubbleContainer.y}, ${this.bubbleContainer.width}, ${this.bubbleContainer.height}`);

    // apply reverse scaling to the individual bubbles to keep their size
    this.bubbleContainer.children.forEach((bubble) => {
      // bubble.pivot.set(bubble.width / 2, bubble.height / 2);
      bubble.scale.set(bubble.scale.x / scaleFactor, bubble.scale.y / scaleFactor);
    });

    // translate the container such that the bounds is in the top left corner
    const bounds2 = this.bubbleContainer.getBounds();
    // console.log({ bounds2 });
    this.bubbleContainer.position.set(
      this.bubbleContainer.x - bounds2.x,
      this.bubbleContainer.y - bounds2.y,
    );

    const bounds3 = this.bubbleContainer.getBounds();
    // console.log({ bounds3 });

    // translate the container to the center and add padding
    const availableWidth = dimredLayoutStore.dimredTileFrame.width
    const availableHeight = dimredLayoutStore.dimredTileFrame.height
    this.bubbleContainer.position.set(
      this.bubbleContainer.x + (availableWidth - bounds3.width) / 2 + offsetX,
      this.bubbleContainer.y + (availableHeight - bounds3.height) / 2 + offsetY,
    );

  }
}
