import { Context, Callback, APIGatewayProxyEvent } from 'aws-lambda';
import { Logger, LoggerService, LogLevelString } from '@mu-ts/logger';
import { HTTPSerializer } from './HTTPSerializer';
import { EndpointEvent, StringMap } from './EndpointEvent';
import { EndpointRoute } from './EndpointRoute';
import { HTTPAPIGatewayProxyResult } from './HTTPAPIGatewayProxyResult';
import { JSONRedactingSerializer } from './JSONRedactingSerializer';
import { EndpointRoutes } from './EndpointRoutes';

/**
 * Singleton that contains all of the routes registered for this
 * endpoint.
 */
export abstract class EndpointRouter {
  private static logger: Logger = LoggerService.named('EndpointRouter', { fwk: '@mu-ts' });
  private static serializer: HTTPSerializer = new JSONRedactingSerializer();
  public static validationHandler: any;

  private constructor() {}

  /**
   *
   * @param headers to set on every request.
   */
  public static setLogLevel(level: LogLevelString): void {
    this.logger.level(level);
    EndpointRoutes.setLogLevel(level);
  }

  /**
   *
   * @param headers to set on every request.
   */
  public static setDefaultHeaders(headers: { [name: string]: boolean | number | string }): void {
    this.logger.info({ data: headers }, 'setDefaultHeaders()');
    HTTPAPIGatewayProxyResult.setDefaultHeaders(headers);
  }

  /**
   *
   * @param event to invoke the endpoint with.
   * @param context of the invocation.
   * @param callback to execute when completed.
   */
  public static async handle(
    _event: APIGatewayProxyEvent,
    context: Context,
    callback: Callback<HTTPAPIGatewayProxyResult>
  ): Promise<HTTPAPIGatewayProxyResult> {
    try {
      this.logger.debug({ data: _event }, 'handle()');

      const event: EndpointEvent<any> =  {
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
        resource: _event.resource
      };

      this.logger.debug({ data: event }, 'handle()');
      this.logger.debug({ data: { resource: event.resource, httpMethod: event.httpMethod } }, 'handle() request path');
      this.logger.trace({ data: EndpointRoutes.getRoutes() }, 'handle() routes');

      const routeOptions: Array<EndpointRoute> = EndpointRoutes.getRoutes()
        .filter((route: EndpointRoute) => route.resource === event.resource)
        .filter((route: EndpointRoute) => route.action === event.httpMethod)
        .filter((route: EndpointRoute) => {
          this.logger.trace({ data: route }, 'check condition');
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

      response.body =
        typeof response.body === 'string'
          ? response.body
          : EndpointRouter.serializer.serializeResponse(response.body, response.type, scopes);

      delete response.type; // TODO: is there a better way to handle removing 'type' from the response, doesn't seem to like it

      this.logger.debug({ data: response }, 'handle() response after serializing');

      return response;
    } catch (error) {
      return HTTPAPIGatewayProxyResult.setBody({ message: `Critical failure: ${error.message}` })
        .setStatusCode(500)
        .addHeader('X-REQUEST-ID', _event.requestContext.requestId);
    }
  }

  static attachValidationHandler(validationHandler: object) {
    this.logger.debug({ data: { validationHandler } }, 'attachValidationHandler()');
    if (!validationHandler.hasOwnProperty('validate')) {
      throw new Error('Invalid validator supplied');
    } else {
      this.validationHandler = validationHandler;
    }
  }
}
