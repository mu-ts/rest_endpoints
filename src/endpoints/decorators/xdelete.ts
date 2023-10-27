import { Router } from '../services/Router';
import { HttpAction } from '../model/HttpAction';

/**
 * Needs to be called xdelete because delete is a reserved keyword.
 *
 * @param path definition for this GET action mapping. This would include the path names ie, /pathy/{id}
 * @returns
 */
export function xdelete(path: string) {
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
      action: HttpAction.DELETE,
    });

    return originalMethod;
  };
}