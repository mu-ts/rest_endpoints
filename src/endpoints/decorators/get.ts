import { Router } from '../services/Router';
import { HttpAction } from '../model/HttpAction';

/**
 *
 * @param path definition for this GET action mapping. This would include the path names ie, /pathy/{id}
 * @param deserialize
 * @returns
 */
export function get(path: string, deserialize?: object) {
  return function (originalMethod: any, context: ClassMethodDecoratorContext) {
    /**
     * De-serialize the request body into an object for the validators to use.
     */
    const { name } = context

    Router.register({
      path,
      clazz: originalMethod.constructor,
      functionName: name as string,
      function: originalMethod,
      action: HttpAction.GET,
      deserialize
    });

    return originalMethod;
  };
}