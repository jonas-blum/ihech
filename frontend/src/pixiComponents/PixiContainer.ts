import { Container, Texture, Sprite } from 'pixi.js'

export class PixiContainer extends Container {
  background: Sprite = new Sprite(Texture.WHITE)

  constructor(backgroundColor: number = 0xffffff) {
    super()

    this.setBackgroundColor(backgroundColor)
    this.addChild(this.background)
  }

  setBackgroundColor(color: number) {
    this.background.tint = color
  }

  setBackgroundPosition(x: number, y: number) {
    this.background.position.set(x, y)
    }

  setBackgroundWidth(width: number) {
    this.background.width = width
  }

  setBackgroundHeight(height: number) {
    this.background.height = height
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
