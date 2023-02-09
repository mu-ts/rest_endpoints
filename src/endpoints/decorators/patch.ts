import { Router } from '../services/Router';
import { HttpAction } from '../model/HttpAction';

/**
 *
 * @param path definition for this GET action mapping. This would include the path names ie, /pathy/{id}
 * @param validation
 * @param deserialize
 * @param serialize
 * @returns
 */
export function patch(path: string, validation?: object, deserialize?: object, serialize?: object) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    /**
     * De-serialize the request body into an object for the validators to use.
     */
    Router.register({
      functionName: propertyKey,
      function: descriptor.value,
      action: HttpAction.PATCH,
      clazz: target.constructor,
      path,
      validation,
      deserialize,
      serialize
    });

    return descriptor;
  };
}