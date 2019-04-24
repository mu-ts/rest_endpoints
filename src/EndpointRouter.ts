import { Context, Callback, APIGatewayProxyResult } from 'aws-lambda';
import { Logger, ConsoleLogger, LogLevel } from '@mu-ts/logger';
import { HTTPSerializer } from './HTTPSerializer';
import { EventCondition } from './EventCondition';
import { Validation } from './Validation';
import { HTTPAPIGatewayProxyResult } from './HTTPAPIGatewayProxyResult';
import { JSONRedactingSerializer } from './JSONRedactingSerializer';
import { EndpointEvent } from './EndpointEvent';

interface EndpointRoute {
  resource: string;
  action: string;
  endpoint: Function;
  condition?: EventCondition;
  priority: number;
  validations?: Array<Validation>;
  descriptor: PropertyDescriptor;
}

/**
 * Singleton that contains all of the routes registered for this
 * endpoint.
 */
export abstract class EndpointRouter {
  private static routes: Array<EndpointRoute> = [];
  private static serializer: HTTPSerializer = new JSONRedactingSerializer();
  private static logger: Logger = new ConsoleLogger('EndpointRouter');
  public static validationHandler: any;

  private constructor() {}

  /**
   *
   * @param resource to map this endpoint to.
   * @param action to map this endpoint to.
   * @param endpoint function that will take event: HTTPEvent as the first argument
   *        and context: LambdaContext as the second argument. It is expected that
   *        it will return Promise<HTTPResponse>
   * @param descriptor the property descriptor from the method, used to bind the
   *        validation back to the endpoint in the handle() phase
   * @param condition?, that if provided, will test if this endpoint should even
   *        be invoked.
   * @param priority? of this endpoint. A higher value indicates it should be
   *        executed ahead of other endpoints. Defaults to 0.
   *
   */
  public static register(
    resource: string,
    action: string,
    endpoint: Function,
    descriptor: PropertyDescriptor,
    condition?: EventCondition,
    priority?: number
  ): void {
    EndpointRouter.logger.debug('register()', arguments);
    EndpointRouter.routes.push({
      descriptor: descriptor,
      resource: resource,
      action: action,
      endpoint: endpoint,
      condition: condition,
      priority: priority || 0,
    });
  }

  public static attachEndpointValidation(descriptor: PropertyDescriptor, validation: Validation): void {
    EndpointRouter.logger.debug('attachEndpointValidation()', arguments);
    const route = EndpointRouter.routes.find(route => route.descriptor === descriptor);
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
   * @param level to use for the EndpointRouter.
   */
  public static setLogLevel(level: LogLevel): void {
    EndpointRouter.logger.setLevel(level);
  }

  /**
   *
   * @param headers to set on every request.
   */
  public static setDefaultHeaders(headers: { [name: string]: boolean | number | string }): void {
    EndpointRouter.logger.debug('setDefaultHeaders() to', headers);
    HTTPAPIGatewayProxyResult.setDefaultHeaders(headers);
  }

  /**
   *
   * @param event to invoke the endpoint with.
   * @param context of the invocation.
   * @param callback to execute when completed.
   */
  public static handle(event: EndpointEvent<any>, context: Context, callback: Callback<APIGatewayProxyResult>): void {
    EndpointRouter.logger.debug('handle() event', event);

    event.rawBody = event.body;
    event.body = event.rawBody ? EndpointRouter.serializer.deserializeBody(event.body) : undefined;
    EndpointRouter.logger.debug('handle()', { resource: event.resource, httpMethod: event.httpMethod });

    const routeOptions: Array<EndpointRoute> = EndpointRouter.routes
      .filter((route: EndpointRoute) => route.resource === event.resource)
      .filter((route: EndpointRoute) => route.action === event.httpMethod)
      .filter((route: EndpointRoute) => {
        if (route.condition) {
          EndpointRouter.logger.debug('handle() evaluating condition');
          return route.condition(event.body, event);
        }
        return route;
      })
      .map((route: EndpointRoute) => {
        if (route.validations) {
          EndpointRouter.logger.debug('handle() evaluating validations to apply');
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
      EndpointRouter.logger.error('There is no action for the path defined.', {
        resource: event.resource,
        httpMethod: event.httpMethod,
      });
      return callback(
        undefined,
        HTTPAPIGatewayProxyResult.setBody({ message: 'Action is not implemented at this path.' })
          .setStatusCode(501)
          .addHeader('X-REQUEST-ID', event.requestContext.requestId)
      );
    }

    let promiseChain = Promise.resolve<APIGatewayProxyResult | undefined>(undefined);

    EndpointRouter.logger.debug('handle() routeOptions', routeOptions);

    for (const route of routeOptions) {
      promiseChain = promiseChain.then((response: APIGatewayProxyResult | undefined) => {
        if (response) return response;
        EndpointRouter.logger.debug('handle() No response yet, invoking endpoint');
        return route.endpoint(event, context, route.validations);
      });
    }

    promiseChain
      .then((response: APIGatewayProxyResult | undefined) => callback(undefined, response))
      .catch((error: any) => callback(error));
  }

  static attachValidationHandler(validationHandler: object) {
    if (!validationHandler.hasOwnProperty('validate')) {
      throw new Error('Invalid validator supplied');
    } else {
      EndpointRouter.validationHandler = validationHandler;
    }
  }
}
