import { HttpHandler } from '../../HttpHandler';
import { HttpAction } from '../model/HttpAction';

/**
 *
 * @param path definition for this GET action mapping. This would include the path names ie, /pathy/{id}
 * @param validation
 * @param deserialize
 * @param serialize
 * @returns
 */
export function put(path: string, validation?: object, deserialize?: object, serialize?: object) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    /**
     * De-serialize the request body into an object for the validators to use.
     */
    const handler: HttpHandler = HttpHandler.instance();
    handler.router().register({
      path,
      clazz: target,
      action: HttpAction.PUT,
      functionName: propertyKey,
      function: descriptor.value,
      validation,
      deserialize,
      serialize
    });

    return descriptor;
  };
}