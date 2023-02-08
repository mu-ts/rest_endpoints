# Objective

Create a lightweight solution for routing endpoint requests received by a lambda function to different handlers, written in TypeScript. Targeted to work for AWS http/rest endpoints and own all the normal middleware that might exist, like facilitating validation, serialization and cors.

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

These mappings must be done in addition to the definition of the pathing within your API gateway definition, that routes the requests to the Lambda function.

* @any('/my-path', validation?: ajvValidationSchema, deserialize?: jsonSchema, serialize?: jsonSchema) [beta] This has not gotten a lot of testing, but intended to be a 'catch all' for any action used on this path.
* @get('/my-path', deserialize?: jsonSchema)
* @put('/my-path', validation?: ajvValidationSchema, deserialize?: jsonSchema, serialize?: jsonSchema)
* @post('/my-path', validation?: ajvValidationSchema, deserialize?: jsonSchema, serialize?: jsonSchema)
* @put('/my-path', validation?: ajvValidationSchema, deserialize?: jsonSchema, serialize?: jsonSchema)
* @xdelete('/my-path')
* @options('/my-path')

The validation schema depends on the implementation of your Validator. The above presumes you are using AJV, which also provides the ability to transform an object to an alternative format. Generally this would be useful for the outbound request where you want to ensure that a contract is always respected, regardless of how the underlying object being serialized is changed. For example, adding a properly to the object would not result in the property being returned in a response, if you had a deserialization schema defined that did not include that additional property.

# Sugar

These helper methods can help reduce the amount of code you need to write.

* `response(statusCode, objectToSerialize)` can be used to return a quick HttpResponse and not having to format a whole object.
* `json('jsonFile.json')` to load a JSON file. Useful for externalizing JSON schema files for validation. `@post('/some/path', json('myschema.validation.json'))`

# Object Factory

If your instances need complex instantiation, you can implement the `ObjectFactory` interface to populate the instances. The default implementation just uses 'new' on the class being decorated.

Decorated functions recieve the registered 'instance' as the basis for execution of the function, `function.apply(instance, [request, context])`.

This is useful if you are using IoC.

```
import { ObjectFactory, Constructable } = '@mu-ts/endpoints';

class MyObjectFactory implements ObjectFactory {
  
  public instantiate<T>(constructable: Constructable<T>): T {
    const name: string = constructable.name;
    const instance: T = superSpecialStuff(name);
    return instance
  }
} 
```

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

# Cors

Use the @cors decorator, which is pretty self-explanatory. If you are using http endpoints instead of rest endpoints then cors should be a cloud formation setting and not something your code needs to handle.

# Example

handler.ts
```
import { HttpHandler, LambdaContext, Router } from '@mu-ts/endpoints';

/*
 * A class per endpoint can help keep your code easier to test and manage.
 */
export * from './memories/CreateUser';  // @post
export * from './memories/GetUser';     // @get
export * from './memories/UpdateUser';  // @patch
export * from './memories/DeleteUser';  // @_delete
export * from './memories/ListUsers';   // @get

/**
 * Creating a router instance. Execute the handle event on the router
 * when the endpoint is invoked.
 */
const router: Router = HttpHandler.instance().router();
module.exports.rest = async (event: any, context: LambdaContext) => router.handle(event, context);
```

endpoint implementations

```
class CreateUser {

  /**
   * If userPersistence is provided (for unit testing) then a new instance is not
   * created. 
   */
  constructor(private userPersistence: UserPersistence = new UserPersistence()){}

  @post('/v1/users', {
    type: "object",
    properties: {
      phone: { type: "string", pattern: "(^\\+[1-9]\\d{1,14}$)" },
      name: { type: "string" },
    },
    required: ["phone", "name"],
    additionalProperties: false
  })
  public async create({ body }: HttpRequest<Pick<User, 'to' | 'name'>>): Promise<HttpResponse> {
    console.log('create()', { body });
    const user: User = await this.userPersistence.create(body!);
    return response(201, user);
  }
}

export const createUser: CreateUser = new CreateUser();
```

# Common Problems

Don't map invocation directly to router.handle, it loses hold of 'this' and has trouble executing functions. So while it's a bit cleaner, it doesn't work.

```
module.export.rest = HttpHandler.instance().router().handle;
```