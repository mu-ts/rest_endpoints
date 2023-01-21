import { HttpEndpointFunction } from "../model/HttpEndpointFunction";
import { HttpRequest } from "../model/HttpRequest";
import { HttpResponse } from "../model/HttpResponse";
import { HttpRoute } from "../model/HttpRoute";
import { LambdaContext } from "../model/LambdaContext";
import { EventNormalizer } from "./EventNormalizer";
import { Logger } from "../../utils/Logger";
import { Headers } from "./Headers";
import { SerializerService } from "../../serializers/service/SerializerService";
import { HttpSerializer } from "../../serializers/model/HttpSerializer";
import { ValidationService } from "../../validation/service/ValidationService";

export class Router {
  private readonly routes: { [key: string]: HttpRoute };

  /**
   * 
   * @param normalizer used to format the event recieved by the lambda function.
   */
  constructor(
    private readonly serializerService: SerializerService,
    private readonly validationService?: ValidationService,
  ) {
    this.routes = {};
  }

  /**
   * 
   * @param route to register with this router.
   * @returns 
   */
  public register(route: HttpRoute): Router {
    Logger.debug('Router.register() register route', { route });
    const path: string = `${route.path}:${route.action}`;
    this.routes[path] = route;
    Logger.debug('Router.register() total routes', Object.keys(this.routes));
    return this;
  }

  /**
   * 
   * @param event 
   * @param context see https://docs.aws.amazon.com/lambda/latest/dg/nodejs-context.html
   * @returns 
   */
  public async handle(event: any, context: LambdaContext): Promise<HttpResponse> {
    Logger.trace('Router.handler() available events.', Object.keys(this.routes));
    Logger.debug('Router.handler() event recieved.', { event: JSON.stringify(event, undefined, 2) });

    let request: HttpRequest<string | object> = EventNormalizer.normalize(event);

    Logger.debug('Router.handler() normalized request.', { request: JSON.stringify(request, undefined, 2) });

    const { resource, action } = request;

    let route: HttpRoute | undefined = this.routes?.[`${resource}:${action}`]

    Logger.debug('Router.handler() Direct check for route found a result?', route !== undefined);

    /**
     * If no route was found for the specific action, look under 'ANY' for the 
     * same path.
     */
    if (!route) route = this.routes?.[`${resource}:ANY`]

    /**
     * If no route is found, then return a 501.
     */

    let response: HttpResponse | undefined;

    if (!route) {
      Logger.warn('Router.handler() No route was found.');
      response = {
        body: { message: `The path or action is not implemented "${resource}:${action}".`, awsRequestId: context.awsRequestId },
        statusCode: 501,
        statusDescription: `The path or action is not implemented "${resource}:${action}".`,
        headers: Headers.get(),
      }
    } else {
      /**
       * Handler should actively do less, and allow decorators to do their
       * jobs in isolation. Serialization will happen at the macro level to
       * attempt to provide a more consistent implementation for Lamda code.
       */
      try {
        if (request.body) {
          const requestSerializer: HttpSerializer | undefined = this.serializerService.forRequest(request as HttpRequest<string>);
          Logger.debug('Router.handler() Serializer for request.', { requestSerializer });
          /**
           * This is the point where the body converts from a string to
           * an object, if a serializer decides for it to be the case.
           */
          if (requestSerializer?.request) {
            request.body = requestSerializer.request(request.body as string, route.deserialize);
            Logger.debug('Router.handler() Request body deserialized.', request.body);
          } else Logger.warn('Router.handler() No request serializer found.');
        }

        if (route.validation && this.validationService) {
          response = this.validationService.validate(request as HttpRequest<object>, route.validation);
          Logger.debug('Router.handler() Request after validation.', response);
        }

        if (!response) {
          Logger.debug('Router.handler() Executing function.', { requst: JSON.stringify(request), function: JSON.stringify(route.function) });

          response = await route.function.apply(route.instance, [request, context]);
          response.headers = { ...Headers.get(), ...response.headers, ...{ 'Content-Type': request.headers?.Accept || request.headers?.['Content-Type'] || 'application/json' } };
          
          Logger.debug('Router.handler() Response after execution.', { response });
        }

      } catch (error) {
        Logger.error('Router.handler() HttpEndpointFunction implementation threw an exception.', error);
        if(error.message.includes('schema is invalid')) {
          response = {
            body: { message: 'Validation schema for this route is invalid. Check your schema using a JSON schema validator.' },
            statusCode: 500,
            statusDescription: 'Invalid Validation Schema',
            headers: Headers.get(),
          }
        } else {
          response = {
            body: { message: 'Unhandled error encountered.' },
            statusCode: 500,
            statusDescription: 'Unhandled error encountered.',
            headers: Headers.get(),
          }
        }
      }
    }

    /**
     * If there is a response.body then look to serialize it appropriately.
     */
    if (response.body) {
      const responseSerializer: HttpSerializer | undefined = this.serializerService.forResponse(request as any as HttpRequest<object>, response);
      if (responseSerializer?.response) {
        response.body = responseSerializer.response(response.body, route.serialize);
        Logger.debug('Router.handler() Response body serialized.', response.body);
      }
      else Logger.warn('Router.handler() No response serializer found.');
    }

    Logger.debug('Router.handler() Repsonse being returned.', JSON.stringify(response));

    return response;
  }
}