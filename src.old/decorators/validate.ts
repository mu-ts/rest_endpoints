import { EventCondition } from '../index';
import { EndpointRoutes } from '../EndpointRoutes';
import { Logger, LoggerConfig, LoggerService } from '@mu-ts/logger';

export function validate(schema: string, condition?: EventCondition): any;
export function validate(schema: object, condition?: EventCondition): any;

/**
 * Decorates endpoints ({endpoint}) with validation constraints to perform on body of requests. This is intended
 * to be used in conjunction with the mu.ts endpoint module.
 *
 * These can optionally be placed on methods marked with the @endpoint(...) decorator. Order matters, and the
 * validation should be defined before the @endpoint annotation.
 *
 * The validator can either take a file name for a json descriptor or json descriptor object itself that
 * describes the validations to perform against the body. These descriptors are intended to be compatible with
 * whatever validation library you intend to use within. For these examples, we are using validate.js
 * (https://www.validatejs.org).
 *
 * <pre><code>
 * @validate('new-user-validation.json')
 * @validate({"firstName": {"presence": true}})
 * @endpoint('/user', HTTPAction.POST)
 * public createUser(event: HTTPEvent, context: Context) : Promise<HTTPResponse> {
 *   ..
 * }
 * </code></pre>
 *
 * Multiple validators can be attached to a single endpoint for different expected bodies in different
 * scenarios, as necessary. For this you can utilize the conditions parameter. Conditions should return
 * a boolean and are provided the body as well as the originating lambda event to determine if the
 * validation should be applied.
 *
 * <pre><code>
 * @validate('new-client-user-validation.json', (body: HTTPBody, event: HTTPEvent) => body ? body.type === 'client' : false)
 * @validate('new-demo-user-validation.json', (body: HTTPBody, event: HTTPEvent) => body ? body.type === 'demo' : false)
 * @validate('new-user-validation.json')
 * @endpoint('/user', HTTPAction.POST)
 * public createUser(event: HTTPEvent, context: Context) : Promise<HTTPResponse> {
 *   ..
 * }
 * </code></pre>
 *
 * This will execute the validation rules in the new-user-validation.json file (our common validation for
 * new User POST calls), and then if the body contains "type: client" it will also process the validation
 * rules from new-client-user-validation.json, which would contain validation that doesn't apply to other
 * user types in our endpoint. Likewise if the body had a "type: demo", the common validation and the
 * new-demo-user-validation.json would run against the body.
 *
 * As mentioned prior, you can use any validator library you would like to provide to the EndpointRouter in
 * the mu.ts endpoint module, as long as it implements a method validate(body: object, schema: object), or
 * you will have to create a light wrapper around your desired library to conform.
 *
 * @param schema the validation schema to pass to the validator on endpoint invocation
 * @param condition the optional condition, specifying when a specific validation schema should be applied
 */
export function validate(schema: object | string, condition?: EventCondition) {
  return function(target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const parent: string = target.constructor.name;
    const logConfig: LoggerConfig = { name: `${parent}.validate`, adornments: { '@mu-ts': 'endpoints' } };
    const logger: Logger = LoggerService.named(logConfig);
    /*
     * If we are provided a schema file (string to url), then attempt to load that file in,
     * otherwise we assume the object provided is a valid schema definition.
     */
    let schemaObject: object;
    if (typeof schema === 'string') {
      const path = require('path');
      try {
        schemaObject = require(path.resolve(process.cwd(), schema));
      } catch (e) {
        schemaObject = require(path.resolve(process.cwd(), '_optimize', process.env.AWS_LAMBDA_FUNCTION_NAME, schema));
      }
    } else {
      schemaObject = schema;
    }

    logger.debug({ data: { schema, condition, target } }, 'registering validator');

    EndpointRoutes.registerValidation(target, {
      descriptor: descriptor,
      schema: schemaObject,
      validatorCondition: condition,
    });

    return descriptor;
  };
}
