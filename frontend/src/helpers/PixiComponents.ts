import { Application, Graphics, Container, Text } from 'pixi.js'
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

    // add event listeners for drag and drop
    this.app.stage.eventMode = 'static'
    // this.app.stage.hitArea = this.app.renderer.screen
  }
}

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

export class PixiRowLabel {
  public container: Container // Text as child
  public row: Row // reference to data structure Row

  constructor(row: Row) {
    this.container = new Container()
    this.row = row
    
    // create the text for the row label
    const text = new Text({
        text: row.name,
        style: {
            fill: 0x000000,
            fontSize: 12,
            fontFamily: 'Arial',
        },
    })
    this.container.addChild(text)
    // TODO: icons and other stuff can be added here
    
    this.updatePosition()
    this.updateVisibility()
    
    // event listeners
    this.container.eventMode = 'static'
    this.container.cursor = 'pointer'
    // @ts-ignore: Property 'on' does not exist on type 'CollectionGraphics'
    this.container.on('click', () => {
      useHeatmapStore()?.rowLabelClickEvent(this.row)
    })
  }

  updatePosition() {
    this.container.y = this.row.position * 20 // TODO: hardcoded for the moment
    this.container.x = this.row.depth * 10 // TODO: hardcoded for the moment
  }

  updateVisibility() {
    this.container.visible = this.row.position !== -1
  }
}

// maps 1:1 to ItenNameAndData
export class PixiRow {
  public container: Container // PixiHeatmapCell[] as children
  public row: Row // reference to data structure Row

  constructor(row: Row) {
    this.container = new Container()
    this.row = row

    // create all the cells for the row
    for (let i = 0; i < row.data.length; i++) {
      const value = row.data[i]
      const adjustedValue = row.dataAdjusted[i]
      const cell = new PixiHeatmapCell(value, adjustedValue, i, this.onCellClick.bind(this))
      this.container.addChild(cell)
    }

    this.updatePosition()
    this.updateVisibility()
  }

  updatePosition() {
    this.container.y = this.row.position * 20 // TODO: hardcoded for the moment
  }

  updateVisibility() {
    this.container.visible = this.row.position !== -1
  }

  onCellClick(pixiHeatmapCell: PixiHeatmapCell) {
    useHeatmapStore()?.cellClickEvent(this.row, pixiHeatmapCell.column)
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
    onClick: (pixiHeatmapCell: PixiHeatmapCell) => void = () => {},
    onMouseOver: (pixiHeatmapCell: PixiHeatmapCell) => void = () => {},
    onMouseOut: (pixiHeatmapCell: PixiHeatmapCell) => void = () => {},
  ) {
    super()
    this.value = value // TODO: not used yet
    this.adjustedValue = adjustedValue
    this.column = column
    this.draw(18, 18) // TODO: hardcoded for the moment
    this.updateTint(useHeatmapStore()?.getHeatmapColor(adjustedValue))
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

  draw(width: number, height: number) {
    this.rect(0, 0, width, height).fill(0xffffff)
  }

  updateTint(color: number) {
    this.tint = color
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
