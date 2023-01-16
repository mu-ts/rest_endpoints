import { HttpHandler } from "../../HttpHandler";
import { HttpAction } from "../model/HttpAction";

/**
 * 
 * @param path for all requests to get mapped to. If another action is mapped, 
 *        for the path, it will be invoked instead of this 'generic' mapping.
 * @returns 
 */
export function any(path: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    /**
     * De-serialize the request body into an object for the validators to use.
     */
    const instance: any = new target.constructor();
    HttpHandler.instance().router().register({
      path,
      action: HttpAction.ANY,
      function: () => descriptor.value.apply(instance, arguments),
    });

    return descriptor;
  };
}