# Objective

Create a lightweight solution for routing endpoing requests recieved by a lambda function to different handlers. Expected to work for AWS http/rest endpoints and own all of the normal middleware that might exist, like facilitating validation, serialization and cors.


# Start

Your handler for lambda needs to create and map the handling function to the router.

```
/**
 * It is recommended that you export an instance, and not just the class. This will help your system maintain
 * better control over how the class is constructed, as its not uncommon for contructors to contain dependencies
 * and if you have an IoC solution handling this, lets this framework stay un involved.
 *
 * _This has not yet been tested with a stand alon function outside of a class._
 */
export * from './path/to/class/with/endpoints';

const router: Router = HttpHandler.instance().router();
module.exports.rest = async (event: any, context: LambdaContext) => router.handle(event, context);
```

Above this, you would export any of the classes (or functions) that are decorated with endpoint decorators.

# Endpoints

To map an endpoint, use the appropriate decorator for the action you want. Then add the resource path as the second argument.

These mappings must be done in addition to the definition of the pathin within your API gateway definition, that routes the requests to the Lambda function.

* @any('/my-path', validation?: ajvValidationSchema, deserialize?: jsonSchema, serialize?: jsonSchema) [beta] This has not gotten a lot of testing, but intended to be a 'catch all' for any action used on this path.
* @get('/my-path', deserialize?: jsonSchema)
* @options('/my-path')
* @put('/my-path', validation?: ajvValidationSchema, deserialize?: jsonSchema, serialize?: jsonSchema)
* @post('/my-path', validation?: ajvValidationSchema, deserialize?: jsonSchema, serialize?: jsonSchema)
* @put('/my-path', validation?: ajvValidationSchema, deserialize?: jsonSchema, serialize?: jsonSchema)
* @_delete_('/my-path')

The validation schema depends on the implementation of your Validator. The above presumes you are using AJV, which also provides the ability to transform an object to an atlernative format. Generally this would be useful for the outbound request where you want to ensure that a contract is always respected, regardless of how the underlying object being serialized is changed. For example, adding an additional properly to the object would not result in the property being returned in a response, if you had a deserialization schema defined that did not include that additional property.

# Validation

```
/** AJV is used by default **/
const router: Router = HttpHandler.instance().validation('ajv').router();

/** Supply your own **/
const myValidator: Validator = {
  validate(request: HttpRequest<object>, schema: object): T[] | undefined { 
    // it does a validation.
  }
  /**
   * Optional, but used to format the response based on the validation errors identified.
   */
  format(errors: T[], request: HttpRequest<object>): HttpResponse { 
    // it does formatting.
  }
}
const router: Router = HttpHandler.instance().validation(myValidator).router();
```

# Serialization

Both application/json and application/x-www-form-urlencoded are supported out of the box.

```
/** AJV is used by default **/
const xmlSerializer: HttpSerializer = {
  request?(body: string, schema?: object): object { 
    // do a de-serialize
  }
  response?(body: string | Buffer | object, schema?: object): string {
    // do a serialize
  }
}

/**
 * You can add as many serializers to the main handler as you want by chainining more .serializer calls.
 */
const router: Router = HttpHandler.instance().serializer('application/xml', xmlSerializer).router();
```