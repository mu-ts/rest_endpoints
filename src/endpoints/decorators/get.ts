import { Router } from '../services/Router';
import { HttpAction } from '../model/HttpAction';

/**
 *
 * @param path definition for this GET action mapping. This would include the path names ie, /pathy/{id}
 * @param serialize
 * @returns
 */
export function get(path: string, serialize?: object) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    /**
     * De-serialize the request body into an object for the validators to use.
     */
    Router.register({
      path,
      clazz: target.constructor,
      action: HttpAction.GET,
      functionName: propertyKey,
      function: descriptor.value,
      serialize
    });

    return descriptor;
  };
}