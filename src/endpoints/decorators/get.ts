import { HttpHandler } from '../../HttpHandler';
import { HttpAction } from '../model/HttpAction';

/**
 *
 * @param path definition for this GET action mapping. This would include the path names ie, /pathy/{id}
 * @param deserialize
 * @returns
 */
export function get(path: string, deserialize?: object) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    /**
     * De-serialize the request body into an object for the validators to use.
     */
    const handler: HttpHandler = HttpHandler.instance();
    handler.router().register({
      path,
      clazz: target.constructor,
      action: HttpAction.GET,
      functionName: propertyKey,
      function: descriptor.value,
      deserialize
    });

    return descriptor;
  };
}