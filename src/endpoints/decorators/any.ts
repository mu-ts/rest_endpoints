import { Router } from '../services/Router';
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
  return function (originalMethod: any, { name }: ClassMethodDecoratorContext) {
    /**
     * De-serialize the request body into an object for the validators to use.
     */
    Router.register({
      path,
      clazz: originalMethod.constructor,
      functionName: name as string,
      function: originalMethod,
      action: HttpAction.ANY,
      validation,
      deserialize,
      serialize,
    });

    return originalMethod;
  };
}
