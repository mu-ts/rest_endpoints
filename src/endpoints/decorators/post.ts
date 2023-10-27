import { Router } from '../services/Router';
import { HttpAction } from '../model/HttpAction';

/**
 *
 * @param path definition for this POST action mapping. This would include the path names ie, /pathy/{id}
 * @param validation schema for validating the payload of the request body. If it is not valid the endpoint
 *        function will not be invoked.
 * @param deserialize
 * @param serialize
 * @returns
 */
export function post(path: string, validation?: object, deserialize?: object, serialize?: object) {
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
      action: HttpAction.POST,
      validation,
      deserialize,
      serialize
    });

    return originalMethod;
  };
}
