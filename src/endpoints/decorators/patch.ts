import { HttpHandler } from "../../HttpHandler";
import { HttpAction } from "../model/HttpAction";

/**
 * 
 * @param path definition for this GET action mapping. This would include the path names ie, /pathy/{id}
 * @returns 
 */
export function patch(path: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    /**
     * De-serialize the request body into an object for the validators to use.
     */
    const instance: any = new target.constructor();
    HttpHandler.instance().router().register({
      path,
      action: HttpAction.PATCH,
      function: () => descriptor.value.apply(instance, arguments)
    });

    return descriptor;
  };
}