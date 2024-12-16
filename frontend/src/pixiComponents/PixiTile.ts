import { Graphics, BlurFilter } from 'pixi.js'
import { DropShadowFilter } from 'pixi-filters'
import { useHeatmapLayoutStore } from '@/stores/heatmapLayoutStore'
import { PixiContainer } from '@/pixiComponents/PixiContainer'
import { PixiRowsContainer } from '@/pixiComponents/PixiRowsContainer'
import { PixiColumnLabelsContainer } from '@/pixiComponents/PixiColumnLabelsContainer'
import { PixiRowLabelsContainer } from '@/pixiComponents/PixiRowLabelsContainer'
import { useDimredLayoutStore } from '@/stores/dimredLayoutStore'

export class PixiTile extends PixiContainer {
  content: PixiContainer = new PixiContainer()

  constructor() {
    super()
  }

  initializeTile(frame: { x: number; y: number; width: number; height: number }) {
    const { x, y, width, height } = frame
    const padding = useHeatmapLayoutStore().tilePadding

    // position tile
    this.x = x
    this.y = y

    // background and drop shadow
    this.addBackground()
    this.setBackgroundDimensions(width, height)
    this.addDropShadow()

    // content container
    this.addChild(this.content)
    this.content.x = padding
    this.content.y = padding
    // this.content.addBackground(0x00ffff);
    // this.content.setBackgroundDimensions(width - padding * 2, height - padding * 2);

    // mask the content to prevent overflow
    this.content.addMask(0, 0, width - padding * 2, height - padding * 2)
  }

  // destroys all children inside containers of the content container (but not the containers themselves)
  clear() {
    this.content.children.forEach((child) => {
      while (child.children[0]) {
        child.children[0].destroy({ children: true, texture: false, textureSource: false })
      }
    })
  }

  activateLoadingState() {
    this.content.filters = [new BlurFilter()]
    this.content.eventMode = 'none'
    this.content.alpha = 0.5
  }

  deactivateLoadingState() {
    this.content.filters = []
    this.content.eventMode = 'static'
    this.content.alpha = 1
  }
}

export class DimredTile extends PixiTile {
  constructor() {
    super()

    const dimredLayoutStore = useDimredLayoutStore()
    this.initializeTile(dimredLayoutStore.dimredTileFrame)
  }
}

export class MatrixTile extends PixiTile {
  public rowsContainer: PixiRowsContainer = new PixiRowsContainer()
  public stickyRowsContainer: PixiRowsContainer = new PixiRowsContainer()

  constructor() {
    super()
    const heatmapLayoutStore = useHeatmapLayoutStore()
    this.initializeTile(heatmapLayoutStore.matrixTileFrame)

    this.content.addChild(this.rowsContainer)
    this.content.addChild(this.stickyRowsContainer)
  }

  updateHorizontalPosition() {
    const heatmapLayoutStore = useHeatmapLayoutStore()

    // this.content.position.x = -heatmapLayoutStore.horizontalScrollPosition
    this.rowsContainer.position.x = -heatmapLayoutStore.horizontalScrollPosition
    this.stickyRowsContainer.position.x = -heatmapLayoutStore.horizontalScrollPosition

    // TODO: not sure about the performance side effects of this ...
    // this.rowsContainer.updateMask(
    //   0,
    //   heatmapLayoutStore.verticalScrollPosition,
    //   heatmapLayoutStore.matrixTileFrame.width,
    //   heatmapLayoutStore.matrixTileFrame.height,
    // )
  }

  updateVerticalPosition() {
    const heatmapLayoutStore = useHeatmapLayoutStore()

    this.rowsContainer.position.y =
      heatmapLayoutStore.requiredHeightOfStickyRows - heatmapLayoutStore.verticalScrollPosition

    // TODO: not sure about the performance side effects of this ...
    // this.rowsContainer.updateMask(
    //   0,
    //   heatmapLayoutStore.verticalScrollPosition,
    //   40000,
    //   heatmapLayoutStore.matrixTileFrame.height,
    // )
  }
}

export class RowLabelTile extends PixiTile {
  public rowLabelsContainer: PixiRowLabelsContainer = new PixiRowLabelsContainer() // PixiRowLabel[] as children
  public stickyRowLabelsContainer: PixiRowLabelsContainer = new PixiRowLabelsContainer() // PixiRowLabel[] as children

  constructor() {
    super()
    const heatmapLayoutStore = useHeatmapLayoutStore()
    this.initializeTile(heatmapLayoutStore.rowLabelsTileFrame)

    this.content.addChild(this.rowLabelsContainer)
    this.content.addChild(this.stickyRowLabelsContainer)
  }

  updateVerticalPosition() {
    const heatmapLayoutStore = useHeatmapLayoutStore()
    this.rowLabelsContainer.position.y =
      heatmapLayoutStore.requiredHeightOfStickyRows - heatmapLayoutStore.verticalScrollPosition

    this.rowLabelsContainer.updateMask(0, heatmapLayoutStore.verticalScrollPosition, 20000, 20000)
  }
}

export class ColumnLabelTile extends PixiTile {
  public columnLabelsContainer: PixiColumnLabelsContainer = new PixiColumnLabelsContainer() // PixiColumnLabel[] as children
  // NOTE: add container here to support sticky columns

  constructor() {
    super()
    const heatmapLayoutStore = useHeatmapLayoutStore()
    this.initializeTile(heatmapLayoutStore.columnLabelsTileFrame)

    this.content.addChild(this.columnLabelsContainer)
  }

  updateHorizontalPosition() {
    const heatmapLayoutStore = useHeatmapLayoutStore()
    this.columnLabelsContainer.position.x = -heatmapLayoutStore.horizontalScrollPosition
  }
}
