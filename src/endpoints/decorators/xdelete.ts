/**
 * Needs to be called xdelete because delete is a reserved keyword.
 * 
 * @param path definition for this GET action mapping. This would include the path names ie, /pathy/{id}
 * @returns 
 */
export function xdelete(path: string) {

    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      
    };
  }