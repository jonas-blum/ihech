export class LinearColorMap {
  min: number = 0
  max: number = 100
  minColor: number = 0xf2f2f2
  maxColor: number = 0x424242
  isZeroSpecial: boolean = false
  colorZero: number = 0xffffff

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
    const ratio = (value - this.min) / (this.max - this.min)

    // Interpolate each RGB component
    const minR = (this.minColor >> 16) & 0xff
    const minG = (this.minColor >> 8) & 0xff
    const minB = this.minColor & 0xff

    const maxR = (this.maxColor >> 16) & 0xff
    const maxG = (this.maxColor >> 8) & 0xff
    const maxB = this.maxColor & 0xff

    const r = Math.round(minR + ratio * (maxR - minR))
    const g = Math.round(minG + ratio * (maxG - minG))
    const b = Math.round(minB + ratio * (maxB - minB))

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
