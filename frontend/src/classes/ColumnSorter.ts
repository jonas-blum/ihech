import { Column } from '@/classes/Column'
import { useMainStore } from '@/stores/mainStore'

export class ColumnSorter {
  private criteria: ColumnSorterCriterion[]

  constructor(criteria: ColumnSorterCriterion[] = []) {
    this.criteria = criteria
  }

  // Sort method that applies the criteria in order
  public sort(columns: Column[]): Column[] {
    return columns.sort((column1, column2) => {
      for (const criterion of this.criteria) {
        const comparison = criterion.compare(column1, column2)
        if (comparison !== 0) {
          return comparison
        }
      }
      return 0
    })
  }

  // Add a criterion to the list
  public addCriterion(criterion: ColumnSorterCriterion) {
    this.criteria.push(criterion)
  }

  // Remove a criterion by technicalName
  public removeCriterion(technicalName: string) {
    this.criteria = this.criteria.filter((criterion) => criterion.technicalName !== technicalName)
  }

  // Move a criterion to a different position in the list
  public moveCriterion(technicalName: string, newIndex: number) {
    const index = this.criteria.findIndex((criterion) => criterion.technicalName === technicalName)
    if (index === -1) return // Criterion not found

    const [criterion] = this.criteria.splice(index, 1) // Remove criterion
    this.criteria.splice(newIndex, 0, criterion) // Insert at the new index

    // trigger re-sorting of the columns
    useMainStore().sortColumns()
  }

  // Retrieve all criteria (useful for displaying current order)
  public getCriteria(): ColumnSorterCriterion[] {
    return this.criteria
  }
}

export abstract class ColumnSorterCriterion {
  humanReadableName: string
  technicalName: string
  reverse: boolean

  constructor(humanReadableName: string, technicalName: string, reverse: boolean = false) {
    this.humanReadableName = humanReadableName
    this.technicalName = technicalName
    this.reverse = reverse
  }

  // Abstract compare function to be implemented by subclasses
  abstract compare(column1: Column, column2: Column): number

  // Apply reverse sorting if the `reverse` flag is true
  protected applyReverse(value: number): number {
    return this.reverse ? -value : value
  }

  // toggle the reverse flag
  public toggleReverse() {
    this.reverse = !this.reverse

    // trigger re-sorting of the rows
    useMainStore().sortColumns()
  }
}

export class ColumnSorterCriterionByName extends ColumnSorterCriterion {
  constructor(reverse: boolean = false) {
    super('Name', 'name', reverse)
  }

  compare(column1: Column, column2: Column): number {
    const result = column1.name.localeCompare(column2.name)
    return this.applyReverse(result)
  }
}

export class ColumnSorterCriterionByHasChildren extends ColumnSorterCriterion {
  constructor(reverse: boolean = false) {
    super('Has Children', 'hasChildren', reverse)
  }

  compare(column1: Column, column2: Column): number {
    const result = 
      column1.hasChildren() && !column2.hasChildren() ? -1 :
      !column1.hasChildren() && column2.hasChildren() ? 1 : 0
    return this.applyReverse(result)
  }
}

export class ColumnSorterCriterionByStandardDeviation extends ColumnSorterCriterion {
  constructor(reverse: boolean = false) {
    super('Standard Deviation', 'standardDeviation', reverse)
  }

  compare(column1: Column, column2: Column): number {
    const result = column1.standardDeviation - column2.standardDeviation
    return this.applyReverse(result)
  }
}

// export class ColumnSorterCriterionByAmountOfChildren extends ColumnSorterCriterion {
//   constructor(reverse: boolean = false) {
//     super('Children Amount', 'amountOfChildren', reverse)
//   }

//   compare(column1: Column, column2: Column): number {
//     const result = column1.totalChildrenCount - column2.totalChildrenCount
//     return this.applyReverse(result)
//   }
// }

export class ColumnSorterCriterionByOriginalAttributeOrder extends ColumnSorterCriterion {
  constructor(reverse: boolean = false) {
    super('Original Attribute Order', 'originalAttributeOrder', reverse)
  }

  compare(column1: Column, column2: Column): number {
    const result = column1.originalAttributeOrder - column2.originalAttributeOrder
    return this.applyReverse(result)
  }
}
