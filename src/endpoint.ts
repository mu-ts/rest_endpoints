import { EndpointRouter } from './EndpointRouter';
import { HTTPAction } from './HTTPAction';
import { Validation } from './Validation';
import { EndpointEvent } from './EndpointEvent';
import { EventCondition } from './EventCondition';
import { HTTPAPIGatewayProxyResult } from './HTTPAPIGatewayProxyResult';
import { EndpointRoutes } from './EndpointRoutes';
import { logging } from './decorators';

/**
 *
 * @param action to trigger this endpoint.
 * @param path after the 'endpoints()' prefix.
 * @param condition of when this endpoint will execute.
 * @param priority of this endpoint vs other registered endpoints.
 */
export function endpoint(action: HTTPAction | string, path?: string, condition?: EventCondition, priority?: number) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const targetMethod = descriptor.value;

    logging.debug('endpoint() - decorating function.');

    descriptor.value = function(): Promise<HTTPAPIGatewayProxyResult> {
      const event: EndpointEvent<any> = arguments[0];
      const validations: Array<Validation> = arguments[2];

      /*
       * Schema and general validation
       */
      if (validations) {
        const validationErrors = new Set<string>();

        validations.forEach(validation => {

          const keys: string[]     = Object.keys(validation.schema);
          const dataKeys: string[] = Object.keys(event.body);

          let unmatchedKeys: string[];
          unmatchedKeys = dataKeys.filter(key => ! keys.includes(key));

          if (unmatchedKeys) {
            unmatchedKeys.forEach(key => validationErrors.add(`'${key}' is not a valid property (not in schema)`));
          }

          const errors: string[] = EndpointRouter.validationHandler.validate(event.body, validation.schema);
          if (errors) {
            errors.forEach(item => validationErrors.add(item));
          }
        });

        if (validationErrors.size > 0) {
          logging.error('endpoint() - failed validation');

          return Promise.resolve(
            HTTPAPIGatewayProxyResult.setBody({ message: Array.from(validationErrors) })
              .setStatusCode(400)
              .addHeader('X-REQUEST-ID', event.requestContext.requestId)
          );
        }
      }

      return targetMethod
        .apply(this, arguments)
        .then((response: HTTPAPIGatewayProxyResult) => {
          logging.debug('endpoint() - response', response);
          response.addHeader('X-REQUEST-ID', event.requestContext.requestId);
          return response;
        })
        .catch((error: any) => {
          logging.error('endpoint() - problem executing function', error);
          return HTTPAPIGatewayProxyResult.setBody({ message: error.message })
            .setStatusCode(501)
            .addHeader('X-REQUEST-ID', event.requestContext.requestId);
        });
    };

    logging.debug('endpoint() registering', { path, action: ('' + action).toUpperCase() });

    EndpointRoutes.register(
      target,
      path,
      ('' + action).toUpperCase(),
      descriptor.value,
      descriptor,
      condition,
      priority
    );

    return descriptor.value;
  };
}
