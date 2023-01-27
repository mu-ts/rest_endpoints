import { HttpHandler } from '../../HttpHandler';
import { HttpAction } from '../model/HttpAction';

/**
 *
 * @param path for all requests to get mapped to. If another action is mapped,
 *        for the path, it will be invoked instead of this 'generic' mapping.
 * @param validation
 * @param deserialize
 * @param serialize
 * @returns
 */
export function any(path: string, validation?: object, deserialize?: object, serialize?: object) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    /**
     * De-serialize the request body into an object for the validators to use.
     */
    const instance: any = new target.constructor();
    HttpHandler.instance().router().register({
      path,
      instance,
      action: HttpAction.ANY,
      function: descriptor.value,
      validation,
      deserialize,
      serialize
    });

    return descriptor;
  };
}