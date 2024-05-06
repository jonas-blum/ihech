const COLORS_DISTINCT = ['darkGreen', 'purple']

export function getHeatmapColor(value: number, min: number, max: number) {
  if (value <= 0) {
    return '#D0D0D0'
  }
  const normalizedValue = (value - min) / (max - min)
  const l = 80 - normalizedValue * 55
  return `hsl(215, 100%, ${l}%)`
}

export function getColorFromIndex(index: number): string {
  const newIndex = index % COLORS_DISTINCT.length
  const selectedColor = COLORS_DISTINCT[newIndex]

  return selectedColor
}
