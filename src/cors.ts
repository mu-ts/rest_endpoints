import 'reflect-metadata';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { HTTPAction } from './HTTPAction';
import { HTTPAPIGatewayProxyResult } from './HTTPAPIGatewayProxyResult';
import { AllowedOrigin } from './AllowedOrigin';
import { logging } from './decorators';

/**
 * Needs to be placed after the @endpoints decorator.
 *
 * @param Defines the COR's configuration for a specific endpoint.
 */
export function cors(
  allowedOrigin: string | AllowedOrigin,
  allowedActions?: Array<HTTPAction | string>,
  allowedHeaders?: { [name: string]: string },
  allowCredentials: boolean = true
) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const targetMethod = descriptor.value;

    logging.debug('cors() - decorating function.');

    descriptor.value = function() {
      const event: APIGatewayProxyEvent = arguments[0];

      return targetMethod.apply(this, arguments).then((response: HTTPAPIGatewayProxyResult) => {
        const origin: string = typeof allowedOrigin === 'string' ? allowedOrigin : allowedOrigin(event, response);

        response.addHeaders({
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Credentials': allowCredentials ? 'true' : 'false',
        });

        if (allowedActions) response.addHeader('Access-Control-Allow-Methods', allowedActions.join(', '));
        if (allowedHeaders) response.addHeader('Access-Control-Allow-Headers', Object.keys(allowedHeaders).join(', '));

        return response;
      });
    };

    return descriptor;
  };
}
