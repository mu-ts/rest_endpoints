import { Logger, LoggerService } from '@mu-ts/logger'

import { HttpRequest } from '../model/HttpRequest'
import { HttpResponse } from '../model/HttpResponse'
import { HttpRoute } from '../model/HttpRoute'
import { LambdaContext } from '../model/LambdaContext'
import { EventNormalizer } from './EventNormalizer'
import { Headers } from './Headers'
import { SerializerService } from '../../serializers/service/SerializerService'
import { HttpSerializer } from '../../serializers/model/HttpSerializer'
import { ValidationService } from '../../validation/service/ValidationService'
import { ObjectFactory } from '../../objects/model/ObjectFactory'

export class Router {

  private static readonly _routes: { [key: string]: HttpRoute } = {}

  private readonly logger: Logger

  private static readonly LOGGER: Logger = LoggerService.named(this.constructor.name)

  /**
   *
   * @param normalizer used to format the event received by the lambda function.
   */
  constructor(
    private readonly serializerService: SerializerService,
    private readonly objectFactory: ObjectFactory,
    private readonly validationService?: ValidationService,
  ) {
    this.logger = LoggerService.named(this.constructor.name)
  }

  public static routes(): { [key: string]: HttpRoute } {
    return this._routes
  }


  /**
   *
   * @param route to register with this router.
   * @returns
   */
  public static register(route: HttpRoute): void {
    this.LOGGER.trace('Router.register() register route', { route })
    const path: string = `${route.path}:${route.action}`
    Router.routes[path] = route
    this.LOGGER.trace('Router.register() total routes', Object.keys(Router.routes))
  }

  /**
   *
   * @param event
   * @param context see https://docs.aws.amazon.com/lambda/latest/dg/nodejs-context.html
   * @returns
   */
  public async handle(event: any, context: LambdaContext): Promise<HttpResponse> {
    const loggingTrackerId: string = `${event.path || event.rawPath}-handle()-${context.awsRequestId}`
    this.logger.start(loggingTrackerId)
    this.logger.trace('Router.handler() available events.', Object.keys(Router.routes))
    this.logger.trace('Router.handler() event received.', { event: JSON.stringify(event, undefined, 2) })

    const request: HttpRequest<string | object> = EventNormalizer.normalize(event)

    this.logger.trace('Router.handler() normalized request.', { request: JSON.stringify(request, undefined, 2) })

    const { resource, action } = request

    let route: HttpRoute | undefined = Router.routes?.[`${resource}:${action}`]

    this.logger.trace('Router.handler() Direct check for route found a result?', route !== undefined)

    /**
     * If no route was found for the specific action, look under 'ANY' for the
     * same path.
     */
    if (!route) route = Router.routes?.[`${resource}:ANY`]

    /**
     * If no route is found, then return a 501.
     */

    let response: HttpResponse | undefined

    if (!route) {
      this.logger.warn('Router.handler() No route was found.')
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
       * attempt to provide a more consistent implementation for Lambda code.
       */
      try {
        if (request.body) {
          const requestSerializer: HttpSerializer | undefined = this.serializerService.forRequest(request as HttpRequest<string>)
          this.logger.trace('Router.handler() Serializer for request.', { requestSerializer })
          /**
           * This is the point where the body converts from a string to
           * an object, if a serializer decides for it to be the case.
           */
          if (requestSerializer?.request) {
            request.body = requestSerializer.request(request.body as string, route.deserialize)
            this.logger.trace('Router.handler() Request body deserialized.', request.body)
          } else this.logger.warn('Router.handler() No request serializer found.')
        }

        if (route.validation && this.validationService) {
          response = this.validationService.validate(request as HttpRequest<object>, route.validation)
          this.logger.trace('Router.handler() Request after validation.', { response })
        }

        if (!response) {
          this.logger.trace('Router.handler() Executing function.', { request: JSON.stringify(request), function: JSON.stringify(route.function) })
          // this.logger.log(loggingTrackerId)
          /**
           * Resolving the instance on each invocation means that instances can be
           * created on each invocation if necessary.
           *
           * Invoking the function directly on the instance also means that maintaining
           * `this` should be easier for invocation.
           */
          const instance: unknown = this.objectFactory.resolve(route.clazz)
          response = await instance[route.functionName](request, context)
          // response = await route.function.apply(route.instance, [request, context])
          // this.logger.timeStamp(loggingTrackerId)

          /**
           * marker to indicate that we can use the function 'serializer' down below
           */
          response._valid = true
          response.headers = { ...response.headers, ...{ 'Content-Type': request.headers?.Accept || request.headers?.['Content-Type'] || 'application/json' } }

          //TODO CACHE CONTROL https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
          // TODO Cache specify dot notation for finding 'last modified' or expiration
          // TODO eTag?
          // https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching
          //
          //TODO Security REF https://middy.js.org/docs/middlewares/http-security-headers/
          // TODO https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
          // TODO https://infosec.mozilla.org/guidelines/web_security
          // https://observatory.mozilla.org/analyze/api.authvia.com

          this.logger.trace('Router.handler() Response after execution.', { response: JSON.stringify(response, undefined, 3) })
        }

      } catch (error) {
        this.logger.error('Router.handler() HttpEndpointFunction implementation threw an exception.', error)
        if (error.message.includes('schema is invalid')) {
          response = {
            body: { message: 'Validation schema for this route is invalid. Check your schema using a JSON schema validator.' },
            statusCode: 500,
          }
        } else {
          response = {
            body: { message: 'Unhandled error encountered.' },
            statusCode: 500,
          }
        }
      }
    }

    /**
     * If there is a response.body then look to serialize it appropriately.
     */
    if (response.body) {
      this.logger.trace('Router.handler() Serializing body', { type: typeof response.body, body: response.body })
      const responseSerializer: HttpSerializer | undefined = this.serializerService.forResponse(request as any as HttpRequest<object>, response)
      /**
       * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-payload-encodings-workflow.html
       */
      if (responseSerializer?.response) {
        response.body = responseSerializer.response(response.body, (response._valid) ? route?.serialize : undefined)

        // remove after check above
        delete response._valid

        response.headers = { ...response.headers, ...{ 'Content-Type': responseSerializer.contentType() || 'application/json' } }

        if (responseSerializer.isBase64 && responseSerializer.isBase64()) {
          response.body = (response.body as Buffer).toString('base64')
          response.isBase64Encoded = true
        } else {
          response.body = (response.body as Buffer).toString('utf-8')
          response.isBase64Encoded = false
        }
        this.logger.trace('Router.handler() Response body serialized.', response.body)
      }
      else this.logger.warn('Router.handler() No response serializer found.')
    }

    response.headers = { ...Headers.get(), ...response.headers }

    this.logger.trace('Router.handler() Response being returned.', response)
    this.logger.stop(loggingTrackerId)

    return response
  }
}