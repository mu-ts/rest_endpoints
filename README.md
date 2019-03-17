# Summary

Simple REST endpoint and action routing.

## AWS Lambda Handler

Each endpoint and action combination should be easily encapsulated into its own object. This makes the handling very specific and much easier to manage. However, every endpoint needs to worry about similar concerns. Headers, body structure, errors and COR's.

```
import { EndpointRouter } from '@mu-ts/endpoints';

/**
 * To modify how the event will be serialized, you can specify your own
 * implementation of the `1EventSerailizer`.
 */
EndpointRouter.serializer = new CustomSerializer();

/**
 * By creating each instance and feeding in its dependencies
 * the classes which have endpoints mapped will register
 * themselves. Once registered, they will be picked up
 * by the EndpointRouter.
 */
const usersService: UsersService = new UsersService();
new GetUsersEndpoint(usersService);

/**
 * We recommend you use a .rest postfix on your export in case you 
 * want to handle different event trigger types for this lambda function.
 */
module.export.rest = EndpointRouter.handle;
```

## Endpoint Routing

For each function that will be handling a specific 'route' you will need to use the `@endpoint()` decorator. It takes 3 arguments, the path:action, condition and priority.

1. Required.`path:action` For example `/users/{user-id}:PATCH`. 
1. Condition on when this endpoint should execute. Can be a static value, or a function that accepts the body:HTTPBody and optionally event:HTTPEvent arguments.
1. Lastly, you can specify a priority. This will determine the order that multiple functions for the same endpoint path are executed in.

```
import { endpoint, EndpointResponse, EndpointEvent } from '@authvia/endpoints';

public class GetUsersEndpoint {

  constructor(usersService: UsersService){
    this.usersService = usersService;
  }
  
  @endpoint('/users/{user-id}:PATCH')
  updateUser(event: HTTPEvent, context: Context):Promise<HTTPResponse> {
    return HTTPResponse.body('the-body');
  }
  
  /**
   * Only call this function for the /users/{user-id} POST operation if the body
   * contains an attribute action with the value 'promote'.
   *
   * This could be more complex, and 
   */
  @endpoint('/users/{user-id}:POST', (body:Body) => body['action'] === 'promote')
  updateUser(event: HTTPEvent, context: Context):Promise<HTTPResponse> {
    return HTTPResponse
      .body('the-body');
  }
  
  /**
   * This function will be the 'default'. So if the body does not contain an attribute
   * called action, with the value 'promote' then this function will be exeecuted.
   */
  @endpoint('/users/{user-id}:POST')
  updateUser(event: HTTPEvent, context: Context):Promise<HTTPResponse> {
    return HTTPResponse.body('the-body');
  }
  
}

```

## CORS

@cors(domain)


https://pentest-tools.com/blog/essential-http-security-headers/

TODO: Endpoint mapping needs to be role sensitive!

## Endpoint Serialization
TODO build decorator for redaction.
TODO build serializer for objects with redacted fields. Should also redact fields that are not present on the class provided. If role = 'system' no redaction.
TODO build endpoint response builder pattern dealio.
TODO Rename EndpointResponse and EndpointEvent to have HTTP instead of Endpoint.

```
public class User {

  private id: string;
  private name: string;
  @redacted
  private role: string;
  private createdBy: string;
  
  
}

import { Response } from './endpoints';
import Response as EndpointResponse from './.endpoints';

@endpoint('/users:GET',cors=true,roles=['merchant'])
handle(event: HTTPEvent, context: Context):Promise<HTTPResponse> {

  if(hasError){
   return HTTPResponse
     .status(400)
     .body({message: 'I\'m verbose!'},Error);
  }

  if(updated) {
    return HTTPResponse
      .body(user,User)
      .addHeader('eTag',user.eTag);
  }

  return HTTPResponse
    .status(201)
    .body(user,User)
    .addHeader('eTag',user.eTag);
  
}

```