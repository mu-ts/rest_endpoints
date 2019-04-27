import { Context, Callback } from 'aws-lambda';
import { LogLevel, Logger, ConsoleLogger } from '@mu-ts/logger';
import { HTTPSerializer } from './HTTPSerializer';
import { Validation } from './Validation';
import { EndpointEvent } from './EndpointEvent';
import { EndpointRoute } from './EndpointRoute';
import { HTTPAPIGatewayProxyResult } from './HTTPAPIGatewayProxyResult';
import { JSONRedactingSerializer } from './JSONRedactingSerializer';
import { EndpointRoutes } from './EndpointRoutes';
import { setLevel } from './decorators';

/**
 * Singleton that contains all of the routes registered for this
 * endpoint.
 */
export abstract class EndpointRouter {
  private static logger: Logger = new ConsoleLogger('EndpointRouter', LogLevel.info);
  private static serializer: HTTPSerializer = new JSONRedactingSerializer();
  public static validationHandler: any;

  private constructor() {}

  /**
   *
   * @param headers to set on every request.
   */
  public static setLogLevel(level: LogLevel): void {
    EndpointRouter.logger.setLevel(level);
    EndpointRoutes.setLogLevel(level);
    setLevel(level);
  }

  /**
   *
   * @param headers to set on every request.
   */
  public static setDefaultHeaders(headers: { [name: string]: boolean | number | string }): void {
    EndpointRouter.logger.info('setDefaultHeaders()', headers);
    HTTPAPIGatewayProxyResult.setDefaultHeaders(headers);
  }

  /**
   *
   * @param descriptor
   * @param validation
   */
  public static attachEndpointValidation(descriptor: PropertyDescriptor, validation: Validation): void {
    EndpointRouter.logger.info('attachEndpointValidation() - ', { descriptor, validation });
    const route = EndpointRoutes.find((route: EndpointRoute) => route.descriptor === descriptor);
    if (route) {
      if (route.validations) {
        route.validations.push(validation);
      } else {
        route.validations = [validation];
      }
    }
  }

  /**
   *
   * @param event to invoke the endpoint with.
   * @param context of the invocation.
   * @param callback to execute when completed.
   */
  public static async handle(
    event: EndpointEvent<any>,
    context: Context,
    callback: Callback<HTTPAPIGatewayProxyResult>
  ): Promise<HTTPAPIGatewayProxyResult> {
    try {
      EndpointRouter.logger.debug('handle()', event);

      event.rawBody = event.body;
      event.body = event.rawBody ? EndpointRouter.serializer.deserializeBody(event.body) : undefined;

      EndpointRouter.logger.debug('handle() request path', { resource: event.resource, httpMethod: event.httpMethod });
      EndpointRouter.logger.debug('handle() routes', EndpointRoutes.getRoutes());

      const routeOptions: Array<EndpointRoute> = EndpointRoutes.getRoutes()
        .filter((route: EndpointRoute) => route.resource === event.resource)
        .filter((route: EndpointRoute) => route.action === event.httpMethod)
        .filter((route: EndpointRoute) => {
          EndpointRouter.logger.debug('check condition', route);
          if (route.condition) {
            return route.condition(event.body, event);
          }
          return route;
        })
        .map((route: EndpointRoute) => {
          if (route.validations) {
            route.validations = route.validations.filter(
              validation => validation.validatorCondition && validation.validatorCondition(event.body, event)
            );
          } else {
            route.validations = [];
          }
          return route;
        })
        .sort((first: EndpointRoute, second: EndpointRoute) => second.priority - first.priority);

      if (!routeOptions || routeOptions.length === 0) {
        return HTTPAPIGatewayProxyResult.setBody({ message: 'Action is not implemented at this path.' })
          .setStatusCode(501)
          .addHeader('X-REQUEST-ID', event.requestContext.requestId);
      }

      let response: HTTPAPIGatewayProxyResult | undefined = undefined;

      for (const route of routeOptions) {
        response = await route.endpoint(event, context, route.validations);
        if (response) break;
      }

      if (!response) {
        return HTTPAPIGatewayProxyResult.setBody({ message: 'Action is not implemented at this path.' })
          .setStatusCode(501)
          .addHeader('X-REQUEST-ID', event.requestContext.requestId);
      }

      EndpointRouter.logger.debug('handle() response', response);

      response.body =
        typeof response.body === 'string' ? response.body : EndpointRouter.serializer.serializeResponse(response.body);

      EndpointRouter.logger.debug('handle() response after serializing', response);

      return response;
    } catch (error) {
      return HTTPAPIGatewayProxyResult.setBody({ message: `Critical failure: ${error.message}` })
        .setStatusCode(500)
        .addHeader('X-REQUEST-ID', event.requestContext.requestId);
    }
  }

  static attachValidationHandler(validationHandler: object) {
    EndpointRouter.logger.info('attachValidationHandler()', validationHandler);
    if (!validationHandler.hasOwnProperty('validate')) {
      throw new Error('Invalid validator supplied');
    } else {
      EndpointRouter.validationHandler = validationHandler;
    }
  }
}
