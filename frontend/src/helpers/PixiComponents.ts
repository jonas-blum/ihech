import { Application, Graphics, Container } from 'pixi.js'
import { Row } from './classes'
import { useHeatmapStore } from '../stores/heatmapStore'
import { ColoringHeatmapEnum } from './helpers'

export class PixiApplicationManager {
  app: Application
  heatmap: PixiHeatmap

  constructor(canvasElement: HTMLCanvasElement, canvasWidth: number, canvasHeight: number) {
    // init app
    this.app = new Application()
    this.app.init({
      canvas: canvasElement,
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: 0xffffff,
      antialias: true,
      resolution: 2,
      // autoDensity: true, // not sure what this does
    })

    // add heatmap
    this.heatmap = new PixiHeatmap()
    this.app.stage.addChild(this.heatmap.container)
    // TODO: this needs to be moved
    this.heatmap.container.position.set(0, 0)

    console.log('PixiApplicationManager constructor')
    console.log(this.app, this.app.stage)

    // add event listeners for drag and drop
    this.app.stage.eventMode = 'static'
    // this.app.stage.hitArea = this.app.renderer.screen
    this.app.stage.on('pointerup', () => {
      console.log('pointerup')
    })
  }
}

export class PixiHeatmap {
  public container: Container
  public rowContainer: Container
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
    // this.rowContainer.position.set(rowLabelsWidth.value, columnLabelsHeight.value)
    // this.rowLabelsContainer.position.set(0, columnLabelsHeight.value)
    // this.columnLabelsContainer.position.set(rowLabelsWidth.value, 0)
  }

  addRow(row: PixiRow) {
    this.rowContainer.addChild(row.container)
  }
}

// maps 1:1 to ItenNameAndData
export class PixiRow {
  public container: Container
  public row: Row // reference to data structure Row

  constructor(row: Row) {
    this.container = new Container()
    this.row = row

    // create all the cells for the row
    for (let i = 0; i < row.data.length; i++) {
      const value = row.data[i]
      const adjustedValue = row.dataAdjusted[i]
      const cell = new PixiHeatmapCell(value, adjustedValue, i)
      this.container.addChild(cell)
    }

    this.updateVerticalPosition()
  }

  updateVerticalPosition() {
    this.container.y = this.row.position * 20 // TODO: hardcoded for the moment
  }
}

export class PixiHeatmapCell extends Graphics {
  // eventMode: string
  // cursor: string // otherwise typescript complains about it
  value: number // the true value of the cell (as received by the backend)
  adjustedValue: number // the value adjusted for the coloring mode
  column: number // the column index of the cell

  constructor(
    value: number,
    adjustedValue: number,
    column: number,
    // customProperties: CustomCollectionProperties,
    onClick: (heatmapCell: PixiHeatmapCell) => void = () => {},
    onMouseOver: (heatmapCell: PixiHeatmapCell) => void = () => {},
    onMouseOut: (heatmapCell: PixiHeatmapCell) => void = () => {},
  ) {
    super()
    this.value = value // TODO: not used yet
    this.adjustedValue = adjustedValue
    this.column = column
    this.draw(18, 18, useHeatmapStore()?.getHeatmapColor(adjustedValue)) // TODO: hardcoded for the moment
    this.position.x = this.column * 20 // TODO: hardcoded for the moment

    // Initialize custom properties within the namespace object
    // this.customProperties = customProperties
    this.eventMode = 'static'
    this.cursor = 'pointer'

    // event listeners
    // @ts-ignore: Property 'on' does not exist on type 'CollectionGraphics'
    this.on('click', () => {
      onClick(this)
    })
    // @ts-ignore: Property 'on' does not exist on type 'CollectionGraphics'
    this.on('mouseover', () => {
      onMouseOver(this)
    })
    // @ts-ignore: Property 'on' does not exist on type 'CollectionGraphics'
    this.on('mouseout', () => {
      onMouseOut(this)
    })
  }

  draw(width: number, height: number, color: number | string) {
    this.rect(0, 0, width, height).fill(color)
  }

  // clearGraphic() {
  //     this.clear()
  //     this.removeChildren()
  // }

  // updateHighlightedDisplay() {
  //     if (this.highlighted) {
  //         this.tint = DARK_GREY
  //     } else {
  //         this.tint = NEUTRAL_GREY
  //     }
  // }
}
