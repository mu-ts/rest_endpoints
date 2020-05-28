import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import {
  CreditCardLoggerFilter,
  duration,
  inOut,
  Logger,
  LoggerFilter,
  LoggerService,
  LogLevelString,
  SensitiveNameLoggerFilter
} from '@mu-ts/logger';
import { EndpointRoute, HTTPSerializer, ValidationHandler } from './interfaces';
import { EndpointEvent, StringMap } from './model';
import { HTTPAPIGatewayProxyResult } from './HTTPAPIGatewayProxyResult';
import { JSONRedactingSerializer } from './JSONRedactingSerializer';
import { EndpointRoutes } from './EndpointRoutes';

/**
 * Have these filters registered by default
 */
LoggerService.registerFilter(new CreditCardLoggerFilter());
LoggerService.registerFilter(new SensitiveNameLoggerFilter());

/**
 * Singleton that contains all of the routes registered for this
 * endpoint.
 */
export abstract class EndpointRouter {
  private static logger: Logger = LoggerService.named({ name: 'EndpointRouter', adornments: { '@mu-ts': 'endpoints' } });
  private static serializer: HTTPSerializer = new JSONRedactingSerializer();
  public static validationHandler: ValidationHandler;

  private constructor() {}

  /**
   * Allow for more filters to be registered to the LoggerService, as needed
   * @param filters
   */
  public static registerLogFilters(...filters: LoggerFilter[]): void {
    this.logger.info({ filters }, 'registerLoggerFilter()');
    filters.forEach( (filter) => LoggerService.registerFilter(filter));
  }

  /**
   *
   * @param headers to set on every request.
   */
  public static setLogLevel(level: LogLevelString): void {
    this.logger.setLevel(level);
    EndpointRoutes.setLogLevel(level);
  }

  /**
   *
   * @param headers to set on every request.
   */
  public static setDefaultHeaders(headers: { [name: string]: boolean | number | string }): void {
    this.logger.info({ headers }, 'setDefaultHeaders()');
    HTTPAPIGatewayProxyResult.setDefaultHeaders(headers);
  }

  /**
   *
   * @param event to invoke the endpoint with.
   * @param context of the invocation.
   * @param callback to execute when completed.
   */
  @duration()
  @inOut()
  public static async handle(_event: APIGatewayProxyEvent, context: Context): Promise<HTTPAPIGatewayProxyResult> {
    try {
      this.logger.trace(_event, 'handle()', 'Start -->');

      const event: EndpointEvent<any> = {
        rawBody: _event.body,
        body: _event.body ? EndpointRouter.serializer.deserializeBody(_event.body) : undefined,
        headers: new StringMap(_event.headers),
        multiValueHeaders: _event.multiValueHeaders,
        httpMethod: _event.httpMethod,
        isBase64Encoded: _event.isBase64Encoded,
        path: _event.path,
        pathParameters: new StringMap(_event.pathParameters),
        queryStringParameters: new StringMap(_event.queryStringParameters),
        multiValueQueryStringParameters: _event.multiValueQueryStringParameters,
        stageVariables: new StringMap(_event.stageVariables),
        requestContext: _event.requestContext,
        resource: _event.resource,
      };

      this.logger.trace(event, 'handle()', 'event');
      this.logger.trace({ data: EndpointRoutes.getRoutes() }, 'handle()', ' routes');

      this.logger.debug({ resource: event.resource, httpMethod: event.httpMethod }, 'handle()', 'request path');

      const routeOptions: Array<EndpointRoute> = EndpointRoutes.getRoutes()
        .filter((route: EndpointRoute) => route.resource === event.resource)
        .filter((route: EndpointRoute) => route.action === event.httpMethod)
        .filter((route: EndpointRoute) => {
          this.logger.trace(route, 'handle()', 'check condition');
          if (route.condition) {
            return route.condition(event.body, event);
          }
          return route;
        })
        .map((route: EndpointRoute) => {
          const validators = EndpointRoutes.getValidators() || [];
          const validations = validators.filter(validator => validator.descriptor === route.descriptor);
          route.validations = validations;
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

      this.logger.debug({ data: response }, 'handle() response from route');

      const scopes = event.requestContext.authorizer && String(event.requestContext.authorizer.scope);
      const role = event.requestContext.authorizer && String(event.requestContext.authorizer['https://authvia.com/role']);

      response.body =
        typeof response.body === 'string' ? response.body : EndpointRouter.serializer.serializeResponse(response.body, response.type, scopes, role);

      delete response.type; // TODO: is there a better way to handle removing 'type' from the response, doesn't seem to like it

      this.logger.debug({ data: response }, 'handle()', 'response after serializing');

      return response;
    } catch (error) {
      return HTTPAPIGatewayProxyResult.setBody({ message: `Critical failure: ${error.message}` })
        .setStatusCode(500)
        .addHeader('X-REQUEST-ID', _event.requestContext.requestId);
    }
  }

  static attachValidationHandler(validationHandler: ValidationHandler) {
    this.logger.debug({ data: { validationHandler } }, 'attachValidationHandler()');
    this.validationHandler = validationHandler;
  }
}
