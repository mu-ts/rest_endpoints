import 'reflect-metadata';
import {HTTPHeaders, HTTPResponse, HTTPEvent, HTTPAction, HTTPBody, Validation} from "./Model";
import { EndpointRouter } from './EndpointRouter';
import { JSONRedactingSerializer } from './Serialization';
import {version} from "punycode";

export const METADATA_KEY: string = '__MU-TS';
export const REDACTED_KEY: string = 'redacted';

/**
 * Used to ensure that values in a model are removed from the response
 * when it is being serialized.
 * 
 * @param target object where the attribute is being redacted.
 * @param propertyKey of the attribute being redacted.
 * @param descriptor of the attribute being redacted.
 */
export function redacted(target: any, propertyToRedact: string) {
  const metadata = Reflect.getMetadata(METADATA_KEY, target) || {};
  const redactedKeys = metadata[REDACTED_KEY] || [];

  redactedKeys.push(propertyToRedact);

  metadata[REDACTED_KEY] = redactedKeys;

  Reflect.defineMetadata(METADATA_KEY, metadata, target);
};

export interface AllowedOrigin {
  (event: HTTPEvent, response: HTTPResponse): string;
}

/**
 * Needs to be placed after the @endpoints decorator.
 * 
 * @param Defines the COR's configuration for a specific endpoint.
 */
export function cors(allowedOrigin: string | AllowedOrigin, allowedActions?: Array<HTTPAction | string>, allowedHeaders?: HTTPHeaders, allowCredentials: boolean = true) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {

    const targetMethod = descriptor.value;

    descriptor.value = function () {

      const event: HTTPEvent = arguments[0];

      return targetMethod.apply(this, arguments)
        .then((response: HTTPResponse) => {

          const origin: string = typeof allowedOrigin === 'string' ? allowedOrigin : allowedOrigin(event, response);

          response.addHeaders({
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Credentials': allowCredentials ? 'true' : 'false'
          })

          if (allowedActions) response.addHeader('Access-Control-Allow-Methods', allowedActions.join(', '));
          if (allowedHeaders) response.addHeader('Access-Control-Allow-Headers', Object.keys(allowedHeaders).join(', '));

          return response;
        });
    }

    return descriptor;
  };
}

/**
 * Function interface for the logic that will check if a route
 * should be executed or not.
 */
export interface HTTPEventCondition {
  (body: HTTPBody | undefined, event: HTTPEvent): boolean;
}

/**
 *
 * @param route for this function.
 */
export function endpoint(path: string, action: HTTPAction | string, condition?: HTTPEventCondition, priority?: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {

    const targetMethod = descriptor.value;

    descriptor.value = function () {

      const event: HTTPEvent = arguments[0];
      const validations: Array<Validation> = arguments[2];

      if (validations) {
          let validationErrors;
          validations.forEach(validation => {
              // TODO right now this is only taking in body. Should we have a wrapper around this that will segment out parts of the event (query params, etc, and run separate validations against each, defined in the file by type?)
              // FIXME this will overwrite if there are multiple validators, but I think we'll want the ability to have multiple. Make the arrays merge.
              validationErrors = EndpointRouter.validationHandler.validate(event.body, validation.schema);

          });

          if (validationErrors) {
              return HTTPResponse
                  .setBody({ message: validationErrors })
                  .setStatusCode(400)
                  .addHeader('X-REQUEST-ID', event.requestContext.requestId);
          }
      }

      return targetMethod.apply(this, arguments)
        .then((response: HTTPResponse) => {
          response.addHeader('X-REQUEST-ID', event.requestContext.requestId);
          return response;
        })
        .catch((error: any) => {
          return HTTPResponse
            .setBody({ message: error.message })
            .setStatusCode(501)
            .addHeader('X-REQUEST-ID', event.requestContext.requestId);
        });
    }

    const routeAction = typeof action === 'string' ? action.toUpperCase() : action;

    EndpointRouter.register(path, routeAction.toUpperCase(), descriptor.value, descriptor, condition, priority);

    return descriptor;
  };
}