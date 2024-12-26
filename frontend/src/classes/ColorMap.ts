export class ColorMap {
  breakpoints: Breakpoint[] = []
  zeroColor: number | null = null
  isLogarithmic: boolean = false

  constructor(breakpoints: Breakpoint[] = [], zeroColor: number | string | null = null, isLogarithmic: boolean = false) {
    this.isLogarithmic = isLogarithmic
    for (const breakpoint of breakpoints) {
      this.addBreakpoint(breakpoint)
    }
    if (zeroColor !== null) {
      if (typeof zeroColor === 'string') {
        this.zeroColor = parseInt(zeroColor.replace('#', ''), 16)
      } else {
        this.zeroColor = zeroColor
      }
    }
  }

  setLogarithmic(isLogarithmic: boolean) {
    this.isLogarithmic = isLogarithmic
  }

  // interpolates the color based on the next lower and next higher breakpoint
  getColor(value: number): number {
    if (this.breakpoints.length === 0) {
      return 0
    }

    // Check for zero value if zeroColor is set
    if (this.zeroColor !== null && value === 0) {
      return this.zeroColor
    }

    // Transform value if logarithmic scale is enabled
    const transformedValue = this.isLogarithmic ? Math.log10(Math.max(value, Number.EPSILON)) : value

    // check for edge case when value is exactly the value of a breakpoint
    for (let i = 0; i < this.breakpoints.length; i++) {
      const breakpointValue = this.isLogarithmic ? Math.log10(Math.max(this.breakpoints[i].value, Number.EPSILON)) : this.breakpoints[i].value
      if (breakpointValue === transformedValue) {
        return this.breakpoints[i].color
      }
    }

    // find the next lower and next higher breakpoints
    let lowerBreakpoint: Breakpoint | null = null
    let higherBreakpoint: Breakpoint | null = null
    for (let i = 0; i < this.breakpoints.length; i++) {
      const breakpointValue = this.isLogarithmic ? Math.log10(Math.max(this.breakpoints[i].value, Number.EPSILON)) : this.breakpoints[i].value
      if (breakpointValue <= transformedValue) {
        lowerBreakpoint = this.breakpoints[i]
      }
      if (breakpointValue >= transformedValue) {
        higherBreakpoint = this.breakpoints[i]
        break
      }
    }

    // if there is no next higher breakpoint, return the color of the last breakpoint
    if (higherBreakpoint === null) {
      return this.breakpoints[this.breakpoints.length - 1].color
    }

    // if there is no next lower breakpoint, return the color of the first breakpoint
    if (lowerBreakpoint === null) {
      return this.breakpoints[0].color
    }

    // interpolate the color using transformed values if logarithmic
    const lowerValue = this.isLogarithmic ? Math.log10(Math.max(lowerBreakpoint.value, Number.EPSILON)) : lowerBreakpoint.value
    const higherValue = this.isLogarithmic ? Math.log10(Math.max(higherBreakpoint.value, Number.EPSILON)) : higherBreakpoint.value

    return ColorMap.interpolateColor(
      lowerBreakpoint.color,
      higherBreakpoint.color,
      transformedValue,
      lowerValue,
      higherValue,
    )
  }

  setZeroColor(color: number | string | null) {
    if (color === null) {
      this.zeroColor = null
      return
    }
    if (typeof color === 'string') {
      this.zeroColor = parseInt(color.replace('#', ''), 16)
    } else {
      this.zeroColor = color
    }
  }

  addBreakpoint(breakpoint: Breakpoint) {
    this.breakpoints.push(breakpoint)
    this.breakpoints.sort((a, b) => a.value - b.value)
  }

  removeBreakpoint(breakpoint: Breakpoint) {
    const index = this.breakpoints.indexOf(breakpoint)
    if (index > -1) {
      this.breakpoints = [...this.breakpoints.slice(0, index), ...this.breakpoints.slice(index + 1)]
    }
  }

  clearBreakpoints() {
    this.breakpoints = []
  }

  getBreakpoints(): Breakpoint[] {
    return this.breakpoints
  }

  getLowestBreakpoint(): Breakpoint | null {
    if (this.breakpoints.length === 0) {
      return null
    }

    return this.breakpoints[0]
  }

  getHighestBreakpoint(): Breakpoint | null {
    if (this.breakpoints.length === 0) {
      return null
    }

    return this.breakpoints[this.breakpoints.length - 1]
  }

  static interpolateColor(
    minColor: number,
    maxColor: number,
    value: number,
    min: number,
    max: number,
  ): number {
    // Normalize `value` to a 0-1 range based on `min` and `max`
    const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)))

    // Extract RGB components from minColor
    const minR = (minColor >> 16) & 0xff
    const minG = (minColor >> 8) & 0xff
    const minB = minColor & 0xff

    // Extract RGB components from maxColor
    const maxR = (maxColor >> 16) & 0xff
    const maxG = (maxColor >> 8) & 0xff
    const maxB = maxColor & 0xff

    // Interpolate each color component based on normalizedValue
    const r = Math.round(minR + (maxR - minR) * normalizedValue)
    const g = Math.round(minG + (maxG - minG) * normalizedValue)
    const b = Math.round(minB + (maxB - minB) * normalizedValue)

    // Combine RGB components back into a single hex number
    return (r << 16) | (g << 8) | b
  }
}

export class Breakpoint {
  value: number = 0
  color: number = 0

  constructor(value?: number, color?: number | string) {
    if (value !== undefined) this.setValue(value)
    if (color !== undefined) this.setColor(color)
  }

  setValue(value: number) {
    this.value = value
  }

  setColor(color: number | string) {

    // if string (#123456) turn to number (0x123456)
    if (typeof color === 'string') {
      color = parseInt(color.replace('#', ''), 16)
    }

    this.color = color
  }
}
