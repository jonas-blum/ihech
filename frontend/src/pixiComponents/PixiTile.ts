import { Graphics } from 'pixi.js'
import { DropShadowFilter } from 'pixi-filters'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'

export class PixiTile extends Graphics {
  constructor() {
    super()

    this.filters = [
      new DropShadowFilter({
        offset: { x: 0, y: 0 },
        blur: 1,
        alpha: 1,
      }),
    ]
  }
}

export class RowLabelTile extends PixiTile {
  constructor() {
    super()

    const heatmapLayoutStore = useHeatmapLayoutStore()

    const { x, y, width, height } = heatmapLayoutStore.rowLabelsTileFrame
    this.rect(x, y, width, height).fill(0xffffff)
  }
}

export class ColumnLabelTile extends PixiTile {
  constructor() {
    super()

    const heatmapLayoutStore = useHeatmapLayoutStore()

    const { x, y, width, height } = heatmapLayoutStore.columnLabelsTileFrame
    this.rect(x, y, width, height).fill(0xffffff)
  }
}

export class MatrixTile extends PixiTile {
  constructor() {
    super()

    const heatmapLayoutStore = useHeatmapLayoutStore()

    const { x, y, width, height } = heatmapLayoutStore.matrixTileFrame
    this.rect(x, y, width, height).fill(0xffffff)
  }
}