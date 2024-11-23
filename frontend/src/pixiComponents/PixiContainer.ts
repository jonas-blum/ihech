import { Container, Texture, Sprite } from 'pixi.js'
import { DropShadowFilter } from 'pixi-filters'


export class PixiContainer extends Container {
  background: Sprite | null = null
  maskSprite: Sprite | null = null

  // TODO: add debug mode (show bounding box)

  constructor() {
    super()

    // add background with random hex color
    // this.addBackground()
    // this.setBackgroundDimensions(this.width, this.height)
    // this.setBackgroundColor(Math.floor(Math.random() * 16777215))
  }

  addBackground(color: number = 0xffffff) {
    this.background = new Sprite(Texture.WHITE)
    // NOTE: the parent might not be available if the container has not been added as a child yet
    if (this.parent) {
      this.setBackgroundRect(0, 0, this.width, this.height)
    }
    this.setBackgroundColor(color)
    this.addChild(this.background)
  }

  addDropShadow() {
    if (!this.background) {
      this.addBackground()
    }
    this.background!.filters = [
      new DropShadowFilter({
        offset: { x: 0, y: 0 },
        blur: 1,
        alpha: 1,
      }),
    ]
  }

  addMask(x: number = 0, y: number = 0, width: number = this.width, height: number = this.height) {
    const mask = new Sprite(Texture.WHITE)
    mask.x = x
    mask.y = y
    mask.width = width
    mask.height = height
    this.addChild(mask)
    this.mask = mask
    this.maskSprite = mask
  }

  removeMask() {
    if (this.mask && this.maskSprite) {
      this.removeChild(this.maskSprite)
      this.mask = null
    }
  }

  updateMask(x: number, y: number, width: number, height: number) {
    console.log('🥽 super.updateMask')

    if (this.maskSprite) {
      this.maskSprite.x = x
      this.maskSprite.y = y
      this.maskSprite.width = width
      this.maskSprite.height = height
    }
  }

  setBackgroundColor(color: number) {
    if (this.background) {
      this.background.tint = color
    }
  }

  setBackgroundPosition(x: number, y: number) {
    if (this.background) {
      this.background.position.set(x, y)
    }
  }

  setBackgroundWidth(width: number) {
    if (this.background) {
      this.background.width = width
    }
  }

  setBackgroundHeight(height: number) {
    if (this.background) {
      this.background.height = height
    }
  }

  setBackgroundDimensions(width: number, height: number) {
    this.setBackgroundWidth(width)
    this.setBackgroundHeight(height)
  }

  setBackgroundRect(x: number, y: number, width: number, height: number) {
    this.setBackgroundPosition(x, y)
    this.setBackgroundDimensions(width, height)
  }
}
