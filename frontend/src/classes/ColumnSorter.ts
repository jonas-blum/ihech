import { Column } from '@/classes/Column'

export class ColumnSorter {
    private criteria: ColumnSorterCriteria[];
  
    constructor(criteria: ColumnSorterCriteria[] = []) {
      this.criteria = criteria;
    }
  
    // Sort method that applies the criteria in order
    public sort(columns: Column[]): Column[] {
      return columns.sort((column1, column2) => {
        for (const criterion of this.criteria) {
          const comparison = criterion.compare(column1, column2);
          if (comparison !== 0) {
            return comparison;
          }
        }
        return 0;
      });
    }
  
    // Add a criterion to the list
    public addCriterion(criterion: ColumnSorterCriteria) {
      this.criteria.push(criterion);
    }
  
    // Remove a criterion by technicalName
    public removeCriterion(technicalName: string) {
      this.criteria = this.criteria.filter(criterion => criterion.technicalName !== technicalName);
    }
  
    // Move a criterion to a different position in the list
    public moveCriterion(technicalName: string, newIndex: number) {
      const index = this.criteria.findIndex(criterion => criterion.technicalName === technicalName);
      if (index === -1) return; // Criterion not found
  
      const [criterion] = this.criteria.splice(index, 1); // Remove criterion
      this.criteria.splice(newIndex, 0, criterion);       // Insert at the new index
    }
  
    // Retrieve all criteria (useful for displaying current order)
    public getCriteria(): ColumnSorterCriteria[] {
      return this.criteria;
    }
  }
  

export abstract class ColumnSorterCriteria {
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
}

export class ColumnSorterCriteriaByName extends ColumnSorterCriteria {
  constructor(reverse: boolean = false) {
    super('Name', 'name', reverse)
  }

  compare(column1: Column, column2: Column): number {
    const result = column1.name.localeCompare(column2.name)
    return this.applyReverse(result)
  }
}