import { Container } from 'pixi.js'
import { PixiRow } from '@/pixiComponents/PixiRow'
import { PixiRowLabel } from '@/pixiComponents/PixiRowLabel'
import { useHeatmapStore } from '@/stores/heatmapStore'

export class PixiHeatmap {
  public container: Container // rowContainer, rowLabelsContainer, columnLabelsContainer as children
  public rowContainer: Container // PixiRow[] as children
  public rowLabelsContainer: Container
  public columnLabelsContainer: Container

  constructor() {
    // main container for everything in the heatmap (including the row and column labels)
    this.container = new Container()

    // container for the cells, row labels, and column labels
    this.rowContainer = new Container()
    this.rowLabelsContainer = new Container()
    this.columnLabelsContainer = new Container()

    // add the containers to the main container
    this.container.addChild(this.rowContainer)
    this.container.addChild(this.rowLabelsContainer)
    this.container.addChild(this.columnLabelsContainer)

    // set the position of the containers
    // TODO
    this.rowContainer.position.set(200, 200)
    this.rowLabelsContainer.position.set(0, 200)
    this.columnLabelsContainer.position.set(200, 0)
  }

  addRow(row: PixiRow) {
    this.rowContainer.addChild(row.container)
  }

  addRowLabel(rowLabel: PixiRowLabel) {
    this.rowLabelsContainer.addChild(rowLabel.container)
  }
}