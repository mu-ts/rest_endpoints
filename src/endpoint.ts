import { EndpointRouter } from './EndpointRouter';
import { HTTPAction } from './HTTPAction';
import { APIGatewayProxyEventCondition } from './APIGatewayProxyEventCondition';
import { Validation } from './Validation';
import { HTTPAPIGatewayProxyResult } from './HTTPAPIGatewayProxyResult';
import { APIGatewayEvent } from './EndpointEvent';

/**
 *
 * @param route for this function.
 */
export function endpoint(
    path: string,
    action: HTTPAction | string,
    condition?: APIGatewayProxyEventCondition,
    priority?: number
) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const targetMethod = descriptor.value;

    descriptor.value = function() {
      const event: APIGatewayEvent<any> = arguments[0];
      const validations: Array<Validation> = arguments[2];

            if (validations) {
                const validationErrors = new Set<string>();
                validations.forEach(validation => {
                    validationErrors.add(EndpointRouter.validationHandler.validate(event.body, validation.schema));
                });

                if (validationErrors.size) {
                    return HTTPAPIGatewayProxyResult.setBody({message: validationErrors})
                        .setStatusCode(400)
                        .addHeader('X-REQUEST-ID', event.requestContext.requestId);
                }
            }
            return targetMethod
                .apply(this, arguments)
                .then((response: HTTPAPIGatewayProxyResult) => {
                    response.addHeader('X-REQUEST-ID', event.requestContext.requestId);
                    return response;
                })

                .catch((error: any) => {
                    return HTTPAPIGatewayProxyResult.setBody({message: error.message})
                        .setStatusCode(501)
                        .addHeader('X-REQUEST-ID', event.requestContext.requestId);
                });
        };

        const routeAction = typeof action === 'string' ? action.toUpperCase() : action;

        EndpointRouter.register(path, routeAction.toUpperCase(), descriptor.value, descriptor, condition, priority);

        return descriptor;
    };
}
