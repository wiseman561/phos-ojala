import 'jest-extended';

// Add custom matchers type definitions to augment Jest
declare global {
  namespace jest {
    interface Matchers<R> {
      /**
       * Checks if a number is within a range (inclusive).
       * @param floor The minimum allowed value
       * @param ceiling The maximum allowed value
       */
      toBeWithinRange(floor: number, ceiling: number): R;
      
      /**
       * Checks if a value matches one of the items in the array.
       * @param items Array of possible values to match against
       */
      toMatchOneOf(items: any[]): R;
    }
  }
}

// This export is needed to make TypeScript treat this as a module
export {}; 