import { Router } from '../services/Router';
import { HttpAction } from '../model/HttpAction';

/**
 *
 * @param path definition for this GET action mapping. This would include the path names ie, /pathy/{id}
 * @returns
 */
export function option(path: string) {
  return function (originalMethod: any, { name }: ClassMethodDecoratorContext) {
    /**
     * De-serialize the request body into an object for the validators to use.
     */
    Router.register({
      path,
      clazz: originalMethod.constructor,
      functionName: name as string,
      function: originalMethod,
      action: HttpAction.OPTIONS,
    });

    return originalMethod;
  };
}
