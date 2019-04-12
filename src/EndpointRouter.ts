import { Context, Callback, APIGatewayProxyResult } from 'aws-lambda';
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
   * @param headers to set on every request.
   */
  public static setDefaultHeaders(headers: { [name: string]: boolean | number | string }): void {
    HTTPAPIGatewayProxyResult.setDefaultHeaders(headers);
  }

  /**
   *
   * @param event to invoke the endpoint with.
   * @param context of the invocation.
   * @param callback to execute when completed.
   */
  public static handle(event: EndpointEvent<any>, context: Context, callback: Callback<APIGatewayProxyResult>): void {
    event.rawBody = event.body;
    event.body = event.rawBody ? EndpointRouter.serializer.deserializeBody(event.body) : undefined;
    console.log('EndpointRouter.routes', { resource: event.resource, httpMethod: event.httpMethod });
    const routeOptions: Array<EndpointRoute> = EndpointRouter.routes
      .filter((route: EndpointRoute) => route.resource === event.resource)
      .filter((route: EndpointRoute) => route.action === event.httpMethod)
      .filter((route: EndpointRoute) => {
        console.log('check condition', route);
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
      return callback(
        undefined,
        HTTPAPIGatewayProxyResult.setBody({ message: 'Action is not implemented at this path.' })
          .setStatusCode(501)
          .addHeader('X-REQUEST-ID', event.requestContext.requestId)
      );
    }

    let promiseChain = Promise.resolve<APIGatewayProxyResult | undefined>(undefined);

    for (const route of routeOptions) {
      promiseChain = promiseChain.then((response: APIGatewayProxyResult | undefined) => {
        if (response) return response;
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
