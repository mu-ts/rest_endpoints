import { Constructable } from 'objects/model/Constructable';
import { HttpHandler } from '../../HttpHandler';
import { HttpAction } from '../model/HttpAction';

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
    const handler: HttpHandler = HttpHandler.instance();
    handler.router().register({
      path,
      clazz: target.constructor,
      action: HttpAction.DELETE,
      functionName: propertyKey,
      function: descriptor.value
    });

    return descriptor;
  };
}