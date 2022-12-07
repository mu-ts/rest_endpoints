/**
 * Enables a response to be restricte to a specific format.
 * 
 * @param name of the json schema to load, or JSON schema object itself. This is used
 *        to serialize the object returned into the structure defined in JSON schema.
 * @returns 
 */
 export function output(schema?: string | object) {
    // TODO if schema is provided then register it with the HttpEndpointFunction
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      
    };
  }