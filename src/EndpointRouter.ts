import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import {
  CreditCardLoggerFilter,
  duration,
  inOut,
  Logger,
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
LoggerService.registerFilter(new SensitiveNameLoggerFilter());
LoggerService.registerFilter(new CreditCardLoggerFilter());

/**
 * Singleton that contains all the routes registered for this
 * endpoint.
 */
export abstract class EndpointRouter {
  private static logger: Logger = LoggerService.named({ name: 'EndpointRouter', adornments: { '@mu-ts': 'endpoints' } });
  private static serializer: HTTPSerializer = new JSONRedactingSerializer();
  public static validationHandler: ValidationHandler;

  /**
   *
   * @param level
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
   * @param _event to invoke the endpoint with.
   * @param context of the invocation.
   */
  @duration()
  @inOut()
  public static async handle(_event: APIGatewayProxyEvent, context: Context): Promise<HTTPAPIGatewayProxyResult> {
    try {
      this.logger.trace('handle()', 'Start -->', _event);

      const _headers = new StringMap(_event.headers);
      const contentTypes: string | undefined = ['Content-Type', 'Content-type', 'content-type', 'content-Type'].map((type: string) => _headers.get(type)).find(Boolean);

      const event: EndpointEvent<any> = {
        rawBody: _event.body,
        body: _event.body ? EndpointRouter.serializer.deserializeBody(contentTypes, _event.body) : undefined,
        headers: _headers,
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

      this.logger.trace('handle()', 'event', event);
      this.logger.trace('handle()', ' routes', { data: EndpointRoutes.getRoutes() });

      const { httpMethod, path, queryStringParameters, body, requestContext, headers  } = event;
      this.logger.info('handle()', 'request path', {
        httpMethod,
        path,
        queryStringParameters,
        body,
        requestContext,
        headers
      });

      const routeOptions: Array<EndpointRoute> = EndpointRoutes.getRoutes()
        .filter((route: EndpointRoute) => route.resource === event.resource)
        .filter((route: EndpointRoute) => route.action === event.httpMethod)
        .filter((route: EndpointRoute) => {
          this.logger.trace('handle()', 'check condition', route);
          if (route.condition) {
            return route.condition(event.body, event);
          }
          return route;
        })
        .map((route: EndpointRoute) => {
          const validators = EndpointRoutes.getValidators() || [];
          route.validations = validators.filter(validator => validator.descriptor === route.descriptor);
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

      this.logger.trace({ data: response }, 'handle()', 'response from route');

      const scopes = event.requestContext.authorizer && String(event.requestContext.authorizer.scope);
      const role = event.requestContext.authorizer && String(event.requestContext.authorizer['https://authvia.com/role']);

      response.body =
        typeof response.body === 'string' ? response.body : EndpointRouter.serializer.serializeResponse(response.body, response.type, scopes, role);

      // delete response.type; // TODO: is there a better way to handle removing 'type' from the response, doesn't seem to like it
      const { type, ...returnResponse } = response; // removing 'type' from response being returned

      try {
        this.logger.info('handle()', 'response after serializing', { ...returnResponse, ...{ body: JSON.parse(returnResponse.body) } });
      } catch (error) {
        this.logger.info('handle()', 'response after serializing catch', { returnResponse });
      }

      return returnResponse as HTTPAPIGatewayProxyResult;
    } catch (error) {
      return HTTPAPIGatewayProxyResult.setBody({ message: `Critical failure: ${error.message}` })
        .setStatusCode(500)
        .addHeader('X-REQUEST-ID', _event.requestContext.requestId);
    }
  }

  static attachValidationHandler(validationHandler: ValidationHandler) {
    this.validationHandler = validationHandler;
  }
}
