import { Row, AggregatedRow, ItemRow } from '@/classes/Row'
import { useMainStore } from '@/stores/mainStore'

export class RowSorter {
  private criteria: RowSorterCriterion[]

  constructor(criteria: RowSorterCriterion[] = []) {
    this.criteria = criteria
  }

  // Sort method that applies the criteria in order
  public sort(rows: Row[]): Row[] {
    return rows.sort((row1, row2) => {
      for (const criterion of this.criteria) {
        const comparison = criterion.compare(row1, row2)
        if (comparison !== 0) {
          return comparison
        }
      }
      return 0
    })
  }

  // Add a criterion to the list
  public addCriterion(criterion: RowSorterCriterion) {
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

    // Ensure newIndex is within bounds
    if (newIndex < 0 || newIndex >= this.criteria.length) return

    const [criterion] = this.criteria.splice(index, 1) // Remove criterion
    this.criteria.splice(newIndex, 0, criterion) // Insert at the new index

    // trigger re-sorting of the rows
    useMainStore().sortRows()
  }

  // Retrieve all criteria (useful for displaying current order)
  public getCriteria(): RowSorterCriterion[] {
    return this.criteria
  }
}

export abstract class RowSorterCriterion {
  humanReadableName: string
  technicalName: string
  reverse: boolean

  constructor(humanReadableName: string, technicalName: string, reverse: boolean = false) {
    this.humanReadableName = humanReadableName
    this.technicalName = technicalName
    this.reverse = reverse
  }

  // Abstract compare function to be implemented by subclasses
  abstract compare(row1: Row, row2: Row): number

  // Apply reverse sorting if the `reverse` flag is true
  protected applyReverse(value: number): number {
    return this.reverse ? -value : value
  }

  // toggle the reverse flag
  public toggleReverse() {
    this.reverse = !this.reverse

    // trigger re-sorting of the rows
    useMainStore().sortRows()
  }
}

export class RowSorterCriterionByName extends RowSorterCriterion {
  constructor(reverse: boolean = false) {
    super('Name', 'name', reverse)
  }

  compare(row1: Row, row2: Row): number {
    const result = row1.name.localeCompare(row2.name)
    return this.applyReverse(result)
  }
}

export class RowSorterCriterionByHasChildren extends RowSorterCriterion {
  constructor(reverse: boolean = false) {
    super('Has Children', 'hasChildren', reverse)
  }

  compare(row1: Row, row2: Row): number {
    const result =
      row1.hasChildren() && !row2.hasChildren()
        ? -1
        : !row1.hasChildren() && row2.hasChildren()
          ? 1
          : 0
    return this.applyReverse(result)
  }
}

export class RowSorterCriterionByAmountOfChildren extends RowSorterCriterion {
  constructor(reverse: boolean = false) {
    super('Children Amount', 'amountOfChildren', reverse)
  }

  compare(row1: Row, row2: Row): number {
    const result = row1.totalChildrenCount - row2.totalChildrenCount
    return this.applyReverse(result)
  }
}
