import { EndpointRouter } from './EndpointRouter';
import { HTTPAction } from './HTTPAction';
import { Validation } from './Validation';
import { EndpointEvent } from './EndpointEvent';
import { EventCondition } from './EventCondition';
import { HTTPAPIGatewayProxyResult } from './HTTPAPIGatewayProxyResult';
import { EndpointRoutes } from './EndpointRoutes';

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

    descriptor.value = function(): Promise<HTTPAPIGatewayProxyResult> {
      const event: EndpointEvent<any> = arguments[0];
      const validations: Array<Validation> = arguments[2];

      if (validations) {
        const validationErrors = new Set<string>();
        validations.forEach(validation => {
          validationErrors.add(EndpointRouter.validationHandler.validate(event.body, validation.schema));
        });

        if (validationErrors.size) {
          return Promise.resolve(
            HTTPAPIGatewayProxyResult.setBody({ message: validationErrors })
              .setStatusCode(400)
              .addHeader('X-REQUEST-ID', event.requestContext.requestId)
          );
        }
      }
      return targetMethod
        .apply(this, arguments)
        .then((response: HTTPAPIGatewayProxyResult) => {
          response.addHeader('X-REQUEST-ID', event.requestContext.requestId);
          return response;
        })

        .catch((error: any) => {
          return HTTPAPIGatewayProxyResult.setBody({ message: error.message })
            .setStatusCode(501)
            .addHeader('X-REQUEST-ID', event.requestContext.requestId);
        });
    };

    const routeAction = typeof action === 'string' ? action : action;

    EndpointRoutes.register(target, path, routeAction.toUpperCase(), descriptor.value, descriptor, condition, priority);

    return descriptor;
  };
}
