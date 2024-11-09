export class LinearColorMap {
  min: number = 0
  max: number = 100
  minColor: number = 0xefefff
  maxColor: number = 0x0000ff
  isZeroSpecial: boolean = false
  colorZero: number = 0x111111

  constructor(
    min?: number,
    max?: number,
    minColor?: number,
    maxColor?: number,
    isZeroSpecial?: boolean,
    colorZero?: number,
  ) {
    if (min !== undefined) this.setMin(min)
    if (max !== undefined) this.setMax(max)
    if (minColor !== undefined) this.setMinColor(minColor)
    if (maxColor !== undefined) this.setMaxColor(maxColor)
    if (colorZero !== undefined) this.setColorZero(colorZero)
    if (isZeroSpecial !== undefined) this.setIsZeroSpecial(isZeroSpecial)
  }

  getColor(value: number): number {
    // Clamp value to the min and max range
    value = Math.max(this.min, Math.min(this.max, value))

    if (this.isZeroSpecial && value === 0) {
      return this.colorZero
    }

    // Calculate the ratio
    let ratio = (value - this.min) / (this.max - this.min)

    // Interpolate each RGB component
    let minR = (this.minColor >> 16) & 0xff
    let minG = (this.minColor >> 8) & 0xff
    let minB = this.minColor & 0xff

    let maxR = (this.maxColor >> 16) & 0xff
    let maxG = (this.maxColor >> 8) & 0xff
    let maxB = this.maxColor & 0xff

    let r = Math.round(minR + ratio * (maxR - minR))
    let g = Math.round(minG + ratio * (maxG - minG))
    let b = Math.round(minB + ratio * (maxB - minB))

    // Combine the RGB components back into a single number
    return (r << 16) | (g << 8) | b
  }

  setMin(min: number) {
    if (min >= this.max) {
      throw new Error('Min must be less than max')
    }
    this.min = min
  }

  setMax(max: number) {
    if (max <= this.min) {
      throw new Error('Max must be greater than min')
    }
    this.max = max
  }

  setMinColor(color: number) {
    this.minColor = color
  }

  setMaxColor(color: number) {
    this.maxColor = color
  }

  setColorZero(color: number) {
    this.colorZero = color
  }

  setIsZeroSpecial(isZeroSpecial: boolean) {
    this.isZeroSpecial = isZeroSpecial
  }
}
