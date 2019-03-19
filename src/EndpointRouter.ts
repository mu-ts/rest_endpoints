import { HTTPEvent, HTTPResponse, HTTPBody, HTTPHeaders, HTTPAction } from "./Model";
import { Context, Callback } from "aws-lambda";
import { HTTPSerializer, JSONRedactingSerializer } from "./serialization";
import { EndpointCondition, endpoint, cors, AllowedOrigin } from "./decorators";

interface EndpointRoute {
  resource: string;
  action: string;
  endpoint: Function;
  condition?: EndpointCondition;
  priority: number;
}

/**
 * Singleton that contains all of the routes registered for this
 * endpoint.
 */
export abstract class EndpointRouter {

  private static routes: Array<EndpointRoute> = new Array();
  private static serializer: HTTPSerializer = new JSONRedactingSerializer();

  private constructor() { }

  /**
   * 
   * @param resource to map this endpoint to.
   * @param action to map this endpoint to.
   * @param endpoint function that will take event: HTTPEvent as the first argument 
   *        and context: LambdaContext as the second argument. It is expected that 
   *        it will return Promise<HTTPResponse>
   * @param condition, that if provided, will test if this endpoint should even
   *        be invoked.
   * @param priority of this endpoint. A higher value indicates it should be
   *        executed ahead of other endpoints. Defaults to 0.
   * 
   */
  public static register(resource: string, action: string, endpoint: Function, condition?: EndpointCondition, priority?: number): void {
    EndpointRouter.routes.push({
      resource: resource,
      action: action,
      endpoint: endpoint,
      condition: condition,
      priority: priority || 0
    });
  }

  /**
   * 
   * @param headers to set on every request.
   */
  public static setDefaultHeaders(headers: HTTPHeaders): void {
    HTTPResponse.setDefaultHeaders(headers);
  }

  /**
   * 
   * @param event to invoke the endpoint with.
   * @param context of the invocation.
   * @param callback to execute when completed.
   */
  public static handle(event: HTTPEvent, context: Context, callback: Callback<HTTPResponse>): void {
    const body: HTTPBody | undefined = event.body ? EndpointRouter.serializer.deserializeBody(event.body) : undefined;
    console.log("EndpointRouter.routes", { resource: event.resource, httpMethod: event.httpMethod });
    const routeOptions: Array<EndpointRoute> = EndpointRouter.routes
      .filter((route: EndpointRoute) => route.resource === event.resource)
      .filter((route: EndpointRoute) => route.action === event.httpMethod)
      .filter((route: EndpointRoute) => {
        console.log("check condition", route);
        if (route.condition) {
          return route.condition(body, event);
        }
        return route;
      })
      .sort((first: EndpointRoute, second: EndpointRoute) => second.priority - first.priority);

    if (!routeOptions || routeOptions.length === 0) {
      return callback(
        null,
        HTTPResponse
          .setBody({ message: 'Action is not implemented at this path.' })
          .setStatusCode(501)
          .addHeader('X-REQUEST-ID', event.requestContext.requestId)
      );
    }

    let promiseChain = Promise.resolve<HTTPResponse | undefined>(undefined);

    for (let route of routeOptions) {
      promiseChain = promiseChain.then((response: HTTPResponse | undefined) => {
        if (response) return response;
        return route.endpoint(event, context)
      })
    }


    promiseChain
      .then((response: HTTPResponse | undefined) => callback(null, response))
      .catch((error: any) => callback(error))

  }
}