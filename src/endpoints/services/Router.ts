import { HttpRequest } from '../model/HttpRequest';
import { HttpResponse } from '../model/HttpResponse';
import { HttpRoute } from '../model/HttpRoute';
import { LambdaContext } from '../model/LambdaContext';
import { EventNormalizer } from './EventNormalizer';
import { Logger } from '../../utils/Logger';
import { Headers } from './Headers';
import { SerializerService } from '../../serializers/service/SerializerService';
import { HttpSerializer } from '../../serializers/model/HttpSerializer';
import { ValidationService } from '../../validation/service/ValidationService';
import { ObjectFactory } from '../../objects/model/ObjectFactory';

export class Router {

  private static readonly _routes: { [key: string]: HttpRoute } = {};

  /**
   *
   * @param normalizer used to format the event received by the lambda function.
   */
  constructor(
    private readonly serializerService: SerializerService,
    private readonly objectFactory: ObjectFactory,
    private readonly validationService?: ValidationService,
  ) {
    Logger.trace('Router() constructed.');
  }

  public static routes(): { [key: string]: HttpRoute } {
    return this._routes;
  }
  

  /**
   *
   * @param route to register with this router.
   * @returns
   */
  public static register(route: HttpRoute): void {
    Logger.trace('Router.register() register route', { route });
    const path: string = `${route.path}:${route.action}`;
    Router.routes[path] = route;
    Logger.trace('Router.register() total routes', Object.keys(Router.routes));
  }

  /**
   *
   * @param event
   * @param context see https://docs.aws.amazon.com/lambda/latest/dg/nodejs-context.html
   * @returns
   */
  public async handle(event: any, context: LambdaContext): Promise<HttpResponse> {
    const loggingTrackerId: string = `${event.path || event.rawPath}-handle()-${context.awsRequestId}`;
    Logger.timeStart(loggingTrackerId);
    Logger.trace('Router.handler() available events.', Object.keys(Router.routes));
    Logger.trace('Router.handler() event received.', { event: JSON.stringify(event, undefined, 2) });

    const request: HttpRequest<string | object> = EventNormalizer.normalize(event);

    Logger.trace('Router.handler() normalized request.', { request: JSON.stringify(request, undefined, 2) });

    const { resource, action } = request;

    let route: HttpRoute | undefined = Router.routes?.[`${resource}:${action}`];

    Logger.trace('Router.handler() Direct check for route found a result?', route !== undefined);

    /**
     * If no route was found for the specific action, look under 'ANY' for the
     * same path.
     */
    if (!route) route = Router.routes?.[`${resource}:ANY`];

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
      };
    } else {
      /**
       * Handler should actively do less, and allow decorators to do their
       * jobs in isolation. Serialization will happen at the macro level to
       * attempt to provide a more consistent implementation for Lambda code.
       */
      try {
        if (request.body) {
          const requestSerializer: HttpSerializer | undefined = this.serializerService.forRequest(request as HttpRequest<string>);
          Logger.trace('Router.handler() Serializer for request.', { requestSerializer });
          /**
           * This is the point where the body converts from a string to
           * an object, if a serializer decides for it to be the case.
           */
          if (requestSerializer?.request) {
            request.body = requestSerializer.request(request.body as string, route.deserialize);
            Logger.trace('Router.handler() Request body deserialized.', request.body);
          } else Logger.warn('Router.handler() No request serializer found.');
        }

        if (route.validation && this.validationService) {
          response = this.validationService.validate(request as HttpRequest<object>, route.validation);
          Logger.trace('Router.handler() Request after validation.', { response });
        }

        if (!response) {
          Logger.trace('Router.handler() Executing function.', { request: JSON.stringify(request), function: JSON.stringify(route.function) });
          Logger.timeStamp(loggingTrackerId);
          /**
           * Resolving the instance on each invocation means that instances can be 
           * created on each invocation if necessary. 
           * 
           * Invoking the function directly on the instance also means that maintaining
           * `this` should be easier for invocation.
           */
          const instance: unknown = this.objectFactory.resolve(route.clazz);
          response = await instance[route.functionName](request, context);
          // response = await route.function.apply(route.instance, [request, context]);
          Logger.timeStamp(loggingTrackerId);

          response.headers = { ...response.headers, ...{ 'Content-Type': request.headers?.Accept || request.headers?.['Content-Type'] || 'application/json' } };

          Logger.trace('Router.handler() Response after execution.', { response });
        }

      } catch (error) {
        Logger.error('Router.handler() HttpEndpointFunction implementation threw an exception.', error);
        if (error.message.includes('schema is invalid')) {
          response = {
            body: { message: 'Validation schema for this route is invalid. Check your schema using a JSON schema validator.' },
            statusCode: 500,
          };
        } else {
          response = {
            body: { message: 'Unhandled error encountered.' },
            statusCode: 500,
          };
        }
      }
    }

    /**
     * If there is a response.body then look to serialize it appropriately.
     */
    if (response.body) {
      Logger.trace('Router.handler() Serializing body', { type: typeof response.body, body: response.body });
      const responseSerializer: HttpSerializer | undefined = this.serializerService.forResponse(request as any as HttpRequest<object>, response);
      /**
       * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-payload-encodings-workflow.html
       */
      if (responseSerializer?.response) {
        response.body = responseSerializer.response(response.body, route?.serialize);
        response.headers['Content-Type'] = responseSerializer.contentType();
        if (responseSerializer.isBase64 && responseSerializer.isBase64()) {
          response.body = (response.body as Buffer).toString('base64');
          response.isBase64Encoded = true;
        } else {
          response.body = (response.body as Buffer).toString('utf-8');
          response.isBase64Encoded = false;
        }
        Logger.trace('Router.handler() Response body serialized.', response.body);
      }
      else Logger.warn('Router.handler() No response serializer found.');
    }

    response.headers = { ...Headers.get(), ...response.headers };

    Logger.trace('Router.handler() Response being returned.', response);
    Logger.timeEnd(loggingTrackerId);

    return response;
  }
}