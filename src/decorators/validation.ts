/**
 * Whatever is supplied here will be supplied to the validation object during
 * the validation of the endpoint invocation, which happens before the logic
 * itself gets invoked.
 * 
 * @param name of the json schema to load, or JSON schema object itself. If nothing is 
 *        provided then the class the function lives within will be used to determine
 *        the schema. GetMyObject will look for getmyobject.post.validation.json. the post
 *        part is based on the mapped action type.
 * @returns 
 */
 export function validate(schema?: string | object) {
    // TODO if schema is provided then register it with the HttpEndpointFunction
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      
    };
  }