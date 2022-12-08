import { HttpRoutes } from "../../HttpRoutes";
import { HttpAction } from "../model/HttpAction";

/**
 * Needs to be called xdelete because delete is a reserved keyword.
 * 
 * @param path definition for this GET action mapping. This would include the path names ie, /pathy/{id}
 * @returns 
 */
export function xdelete(path: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    /**
     * De-serialize the request body into an object for the validators to use.
     */
    HttpRoutes.instance().router().register({
      path,
      action: HttpAction.DELETE,
      function: descriptor.value.bind(target)
    });

    return descriptor;
  };
}