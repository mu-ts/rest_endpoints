import 'reflect-metadata';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { HTTPAction } from '../model/HTTPAction';
import { HTTPAPIGatewayProxyResult } from '../HTTPAPIGatewayProxyResult';
import { AllowedOrigin } from '../interfaces/AllowedOrigin';
import { Logger, LoggerService, LoggerConfig } from '@mu-ts/logger';

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
    const parent: string = target.constructor.name;
    const logConfig: LoggerConfig = { name: `${parent}.cors`, adornments: { '@mu-ts': 'endpoints' } };
    const logger: Logger = LoggerService.named(logConfig);
    const targetMethod = descriptor.value;

    logger.debug({ allowedOrigin, allowedActions, allowedHeaders, allowCredentials, propertyKey }, 'cors()', 'decorating function');

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
