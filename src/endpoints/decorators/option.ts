import { HttpHandler } from '../../HttpHandler';
import { HttpAction } from '../model/HttpAction';

/**
 *
 * @param path definition for this GET action mapping. This would include the path names ie, /pathy/{id}
 * @returns
 */
export function option(path: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    /**
     * De-serialize the request body into an object for the validators to use.
     */
    const handler: HttpHandler = HttpHandler.instance();
    handler.router().register({
      path,
      clazz: target,
      action: HttpAction.OPTIONS,
      functionName: propertyKey,
      function: descriptor.value
    });

    return descriptor;
  };
}